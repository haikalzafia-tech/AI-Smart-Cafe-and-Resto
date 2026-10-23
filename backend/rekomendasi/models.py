from django.db import models

from menu.models import Menu

KONDISI_CUACA = [
    ("cerah", "Cerah"),
    ("berawan", "Berawan"),
    ("hujan", "Hujan"),
    ("panas", "Panas (≥ 31°C)"),
]
PERIODE_WAKTU = [
    ("pagi", "Pagi (05.00–10.59)"),
    ("siang", "Siang (11.00–14.59)"),
    ("sore", "Sore (15.00–17.59)"),
    ("malam", "Malam (18.00–04.59)"),
]


class Singleton(models.Model):
    """Model yang hanya punya satu baris (id=1)."""

    class Meta:
        abstract = True

    @classmethod
    def ambil(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)


class KonfigurasiCuaca(Singleton):
    """ADM-05: koneksi ke API cuaca eksternal."""

    PENYEDIA = [
        ("open-meteo", "Open-Meteo (gratis, tanpa API key)"),
        ("openweathermap", "OpenWeatherMap (butuh API key)"),
    ]
    penyedia = models.CharField(max_length=20, choices=PENYEDIA, default="open-meteo")
    endpoint = models.URLField(blank=True, help_text="Kosongkan untuk memakai endpoint bawaan penyedia")
    api_key = models.CharField(max_length=200, blank=True)
    nama_lokasi = models.CharField(max_length=80, default="Batam")
    lintang = models.FloatField(default=1.1301)
    bujur = models.FloatField(default=104.0529)
    cache_menit = models.PositiveSmallIntegerField(default=15)
    aktif = models.BooleanField(default=True)
    status_terakhir = models.CharField(max_length=10, default="belum", help_text="berhasil / gagal / belum")
    pesan_terakhir = models.CharField(max_length=255, blank=True)
    dicek_pada = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = verbose_name_plural = "Konfigurasi cuaca"


class KonfigurasiAI(Singleton):
    """Koneksi chatbox ke layanan AI. Tanpa API key, chatbox tetap jalan dengan pencocokan kata kunci."""

    PENYEDIA = [
        ("tanpa", "Tanpa AI (pencocokan kata kunci)"),
        ("anthropic", "Claude (Anthropic)"),
        ("gemini", "Gemini (Google)"),
        ("openai", "OpenAI"),
    ]
    MODEL_BAWAAN = {"anthropic": "claude-haiku-5-5", "gemini": "gemini-2.5-flash", "openai": "gpt-4o-mini"}

    penyedia = models.CharField(max_length=20, choices=PENYEDIA, default="tanpa")
    model = models.CharField(max_length=80, blank=True, help_text="Kosongkan untuk model bawaan")
    api_key = models.CharField(max_length=300, blank=True)
    status_terakhir = models.CharField(max_length=10, default="belum")
    pesan_terakhir = models.CharField(max_length=255, blank=True)
    dicek_pada = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = verbose_name_plural = "Konfigurasi AI"

    @property
    def model_dipakai(self):
        return self.model or self.MODEL_BAWAAN.get(self.penyedia, "")


class AturanRekomendasi(models.Model):
    """ADM-03: menu X direkomendasikan saat cuaca Y dan/atau waktu Z."""

    menu = models.ForeignKey(Menu, on_delete=models.CASCADE, related_name="aturan")
    cuaca = models.CharField(max_length=10, choices=[("semua", "Semua cuaca")] + KONDISI_CUACA, default="semua")
    waktu = models.CharField(max_length=10, choices=[("semua", "Sepanjang hari")] + PERIODE_WAKTU, default="semua")
    prioritas = models.PositiveSmallIntegerField(default=3, help_text="1 (rendah) sampai 5 (tinggi)")
    aktif = models.BooleanField(default=True)
    dibuat = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-prioritas", "menu__nama"]
        verbose_name_plural = "Aturan rekomendasi"
        constraints = [models.UniqueConstraint(fields=["menu", "cuaca", "waktu"], name="aturan_unik")]

    def __str__(self):
        return f"{self.menu} → {self.cuaca}/{self.waktu}"


class LogRekomendasi(models.Model):
    """Catatan menu yang ditampilkan ke pelanggan, untuk statistik ADM-04."""

    menu = models.ForeignKey(Menu, on_delete=models.CASCADE, related_name="log_rekomendasi")
    cuaca = models.CharField(max_length=10, blank=True)
    waktu = models.CharField(max_length=10)
    meja = models.PositiveSmallIntegerField(null=True, blank=True)
    sumber = models.CharField(max_length=10, default="otomatis", help_text="otomatis / chat")
    dibuat = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-dibuat"]
        verbose_name_plural = "Log rekomendasi"


class Ulasan(models.Model):
    """PLG-05: ulasan pelanggan lewat QR meja."""

    SENTIMEN = [("positif", "Positif"), ("netral", "Netral"), ("negatif", "Negatif")]
    meja = models.PositiveSmallIntegerField(null=True, blank=True)
    rating = models.PositiveSmallIntegerField()
    komentar = models.TextField(blank=True)
    sentimen = models.CharField(max_length=10, choices=SENTIMEN, default="netral")
    dibuat = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-dibuat"]
        verbose_name_plural = "Ulasan"

    def __str__(self):
        return f"{self.rating}★ meja {self.meja}"
