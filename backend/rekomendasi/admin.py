from django.contrib import admin

from .models import AturanRekomendasi, KonfigurasiAI, KonfigurasiCuaca, LogRekomendasi, Ulasan


@admin.register(AturanRekomendasi)
class AturanAdmin(admin.ModelAdmin):
    list_display = ("menu", "cuaca", "waktu", "prioritas", "aktif")
    list_filter = ("cuaca", "waktu", "aktif")
    list_editable = ("prioritas", "aktif")
    autocomplete_fields = ("menu",)


@admin.register(Ulasan)
class UlasanAdmin(admin.ModelAdmin):
    list_display = ("dibuat", "meja", "rating", "sentimen", "komentar")
    list_filter = ("rating", "sentimen")


@admin.register(LogRekomendasi)
class LogAdmin(admin.ModelAdmin):
    list_display = ("dibuat", "menu", "cuaca", "waktu", "meja", "sumber")
    list_filter = ("cuaca", "waktu", "sumber")


admin.site.register(KonfigurasiCuaca)
admin.site.register(KonfigurasiAI)
