from django.db import models
from django.utils import timezone


class Kunjungan(models.Model):
    """Satu kunjungan = satu sesi browser yang membuka halaman menu.
    Anonim: tidak menyimpan IP, nama, atau identitas pelanggan."""

    SUMBER = [("qr", "QR Code"), ("langsung", "Langsung / Link")]

    waktu = models.DateTimeField(default=timezone.now, db_index=True)
    meja = models.PositiveSmallIntegerField(null=True, blank=True)
    sumber = models.CharField(max_length=10, choices=SUMBER, default="langsung")

    class Meta:
        ordering = ["-waktu"]
        verbose_name_plural = "Kunjungan"

    def __str__(self):
        return f"{self.waktu:%Y-%m-%d %H:%M} | meja {self.meja} | {self.sumber}"