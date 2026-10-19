from pathlib import Path

from django.conf import settings
from django.http import FileResponse, JsonResponse
from rest_framework import status
from rest_framework.parsers import JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .errors import BadRequest
from .serializers import FilterSerializer, StudentSerializer
from . import services

FRONTEND = Path(settings.BASE_DIR) / "frontend"


def page(request, filename):
    return FileResponse((FRONTEND / filename).open("rb"), content_type="text/html; charset=utf-8")


def not_found(request, exception):
    if request.path.startswith("/api/"):
        return JsonResponse({"error": {"code": "not_found", "message": "Маршрут не найден."}}, status=404)
    return JsonResponse({"error": {"code": "not_found", "message": "Страница не найдена."}}, status=404)


def server_error(request):
    return JsonResponse({"error": {"code": "internal_error", "message": "Внутренняя ошибка сервера."}}, status=500)


class RequestCollection(APIView):
    parser_classes = [JSONParser]
    http_method_names = ["get", "post", "query", "head", "options"]

    def _filters(self, data):
        serializer = FilterSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        return serializer.validated_data

    def get(self, request):
        if any(len(request.query_params.getlist(key)) > 1 for key in request.query_params):
            raise BadRequest("Повторяющиеся параметры фильтра не допускаются.")
        return Response(services.list_students(self._filters(request.query_params.dict())))

    def query(self, request):
        return Response(services.list_students(self._filters(request.data)))

    def post(self, request):
        serializer = StudentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        student = services.create_student(serializer.validated_data)
        return Response(student, status=status.HTTP_201_CREATED, headers={"Location": f"/api/requests/{student['isuId']}"})


class RequestDetail(APIView):
    parser_classes = [JSONParser]
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get(self, request, isu_id):
        return Response(services.get_student(isu_id))

    def patch(self, request, isu_id):
        previous = services.get_student(isu_id)
        if not isinstance(request.data, dict) or not request.data:
            raise BadRequest("Укажите поля для обновления.")
        serializer = StudentSerializer(data=request.data, partial=True, context={"previous": previous})
        serializer.is_valid(raise_exception=True)
        return Response(services.update_student(isu_id, serializer.validated_data))

    def delete(self, request, isu_id):
        services.delete_student(isu_id)
        return Response(status=status.HTTP_204_NO_CONTENT)
