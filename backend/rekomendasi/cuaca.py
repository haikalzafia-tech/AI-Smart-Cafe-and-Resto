"""Ambil cuaca dari API eksternal + tentukan periode waktu. Semua gagal-aman (fallback)."""

import json
import urllib.error
import urllib.parse
import urllib.request

from django.core.cache import cache
from django.utils import timezone

KUNCI_CACHE = "cuaca_terkini"
LABEL_CUACA = {"cerah": "Cerah", "berawan": "Berawan", "hujan": "Hujan", "panas": "Panas"}
LABEL_WAKTU = {"pagi": "Pagi", "siang": "Siang", "sore": "Sore", "malam": "Malam"}
BATAS_PANAS = 31.0


def periode_waktu(sekarang=None):
    jam = (sekarang or timezone.localtime()).hour
    if 5 <= jam < 11:
        return "pagi"
    if 11 <= jam < 15:
        return "siang"
    if 15 <= jam < 18:
        return "sore"
    return "malam"


def _kondisi_dari_wmo(kode, suhu):
    """Kode cuaca WMO (Open-Meteo) → kondisi sederhana."""
    if kode in (51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99):
        return "hujan"
    if suhu is not None and suhu >= BATAS_PANAS:
        return "panas"
    return "cerah" if kode in (0, 1) else "berawan"


def _kondisi_dari_owm(utama, suhu):
    if utama in ("Rain", "Drizzle", "Thunderstorm", "Squall"):
        return "hujan"
    if suhu is not None and suhu >= BATAS_PANAS:
        return "panas"
    return "cerah" if utama == "Clear" else "berawan"


def _get_json(url, timeout=6):
    req = urllib.request.Request(url, headers={"User-Agent": "TreehouseCafe/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


def ambil_dari_api(konf):
    """Panggil API sesuai konfigurasi. Melempar Exception kalau gagal."""
    if konf.penyedia == "openweathermap":
        if not konf.api_key:
            raise ValueError("API key OpenWeatherMap belum diisi.")
        dasar = konf.endpoint or "https://api.openweathermap.org/data/2.5/weather"
        q = urllib.parse.urlencode({"lat": konf.lintang, "lon": konf.bujur, "appid": konf.api_key, "units": "metric", "lang": "id"})
        d = _get_json(f"{dasar}?{q}")
        suhu = float(d["main"]["temp"])
        utama = d["weather"][0]["main"]
        return {
            "kondisi": _kondisi_dari_owm(utama, suhu),
            "suhu": round(suhu),
            "deskripsi": d["weather"][0].get("description", utama).capitalize(),
        }

    dasar = konf.endpoint or "https://api.open-meteo.com/v1/forecast"
    q = urllib.parse.urlencode({
        "latitude": konf.lintang,
        "longitude": konf.bujur,
        "current": "temperature_2m,weather_code",
        "timezone": "Asia/Jakarta",
    })
    if konf.api_key:  # untuk paket Open-Meteo berbayar
        q += "&" + urllib.parse.urlencode({"apikey": konf.api_key})
    d = _get_json(f"{dasar}?{q}")
    suhu = float(d["current"]["temperature_2m"])
    kode = int(d["current"]["weather_code"])
    kondisi = _kondisi_dari_wmo(kode, suhu)
    return {"kondisi": kondisi, "suhu": round(suhu), "deskripsi": LABEL_CUACA[kondisi]}


def catat_status(konf, berhasil, pesan):
    konf.status_terakhir = "berhasil" if berhasil else "gagal"
    konf.pesan_terakhir = pesan[:255]
    konf.dicek_pada = timezone.now()
    konf.save(update_fields=["status_terakhir", "pesan_terakhir", "dicek_pada"])


def cuaca_terkini(paksa=False):
    """Kembalikan dict cuaca. Kalau API mati/gagal: ok=False dan kondisi=None (rekomendasi pakai waktu saja)."""
    from .models import KonfigurasiCuaca

    if not paksa:
        tersimpan = cache.get(KUNCI_CACHE)
        if tersimpan:
            return tersimpan

    konf = KonfigurasiCuaca.ambil()
    hasil = {"ok": False, "kondisi": None, "suhu": None, "deskripsi": "Cuaca tidak tersedia", "lokasi": konf.nama_lokasi}
    if not konf.aktif:
        hasil["deskripsi"] = "Integrasi cuaca dimatikan"
        cache.set(KUNCI_CACHE, hasil, 300)
        return hasil
    try:
        hasil.update(ambil_dari_api(konf), ok=True)
        catat_status(konf, True, f"{hasil['deskripsi']}, {hasil['suhu']}°C")
        cache.set(KUNCI_CACHE, hasil, max(1, konf.cache_menit) * 60)
    except (urllib.error.URLError, TimeoutError, OSError, ValueError, KeyError, IndexError, TypeError) as e:
        alasan = getattr(e, "reason", None) or str(e) or e.__class__.__name__
        catat_status(konf, False, f"Gagal mengambil cuaca: {alasan}")
        cache.set(KUNCI_CACHE, hasil, 120)  # coba lagi 2 menit lagi
    return hasil


def kondisi_sekarang():
    """Ringkas: (kondisi cuaca atau '', periode waktu). Dipakai saat menyimpan like/dislike."""
    c = cuaca_terkini()
    return (c["kondisi"] or ""), periode_waktu()
