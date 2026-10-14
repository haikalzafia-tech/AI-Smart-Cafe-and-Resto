from django.urls import path
from . import views

urlpatterns = [
    path("kunjungan/", views.catat_kunjungan),
    path("admin/login/", views.login_admin),
    path("admin/statistik/", views.statistik),
]