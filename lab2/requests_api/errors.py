import logging

from rest_framework import status
from rest_framework.exceptions import APIException, ValidationError
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


class Conflict(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "Студент с таким ИСУ ID уже существует."
    default_code = "conflict"


class BadRequest(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Некорректный запрос."
    default_code = "bad_request"


def error_response(code, message, http_status, details=None):
    body = {"error": {"code": code, "message": str(message)}}
    if details is not None:
        body["error"]["details"] = details
    return Response(body, status=http_status)


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        logger.exception("Unexpected API error", exc_info=exc)
        return error_response("internal_error", "Внутренняя ошибка сервера.", 500)

    if isinstance(exc, ValidationError):
        return error_response("validation_error", "Проверьте поля запроса.", 422, response.data)

    code = getattr(exc, "default_code", None) or "error"
    message = response.data.get("detail", "Ошибка запроса.") if isinstance(response.data, dict) else str(response.data)
    return error_response(code, message, response.status_code)
