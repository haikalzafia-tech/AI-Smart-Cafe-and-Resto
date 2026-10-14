from django.contrib import admin

from .models import Meja


@admin.register(Meja)
class MejaAdmin(admin.ModelAdmin):
    list_display = ("nomor", "aktif", "kode", "dibuat")
    list_filter = ("aktif",)
    readonly_fields = ("kode",)