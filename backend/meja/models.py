import secrets

from django.db import models


def buat_kode():
    return secrets.token_urlsafe(12)


class Meja(models.Model):
    """Satu meja = satu QR permanen. Kode tidak pernah berubah."""

    nomor = models.PositiveSmallIntegerField(unique=True)
    kode = models.CharField(max_length=32, unique=True, default=buat_kode, editable=False)
    aktif = models.BooleanField(default=True)
    dibuat = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["nomor"]
        verbose_name_plural = "Meja"

    def __str__(self):
        return f"Meja {self.nomor}"