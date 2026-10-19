from django.urls import path
from django.views.generic import RedirectView
from django.views.static import serve

from requests_api import views

urlpatterns = [
    path("", RedirectView.as_view(url="/index.html", permanent=False)),
    path("index.html", views.page, {"filename": "index.html"}),
    path("student-form.html", views.page, {"filename": "student-form.html"}),
    path("student-profile.html", views.page, {"filename": "student-profile.html"}),
    path("css/<path:path>", serve, {"document_root": views.FRONTEND / "css"}),
    path("js/<path:path>", serve, {"document_root": views.FRONTEND / "js"}),
    path("favicon/<path:path>", serve, {"document_root": views.FRONTEND / "favicon"}),
    path("api/requests", views.RequestCollection.as_view()),
    path("api/requests/<str:isu_id>", views.RequestDetail.as_view()),
]

handler404 = "requests_api.views.not_found"
handler500 = "requests_api.views.server_error"
