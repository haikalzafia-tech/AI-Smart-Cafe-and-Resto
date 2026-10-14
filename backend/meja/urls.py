from django.urls import path

from . import views

urlpatterns = [
    path("", views.daftar_meja),
    path("scan/", views.scan),
    path("<int:pk>/", views.ubah_meja),
]