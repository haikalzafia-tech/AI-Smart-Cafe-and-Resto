"""Chatbox rekomendasi. Pakai layanan AI kalau dikonfigurasi, kalau tidak (atau gagal) pakai pencocokan kata kunci."""

import json
import re
import urllib.error
import urllib.request

from .cuaca import LABEL_WAKTU

MAKS_MENU = 4

# ---------- Mode tanpa AI: pencocokan kata kunci ----------

SINONIM = {
    "pedas": ("tag", "pedas"), "pedes": ("tag", "pedas"), "spicy": ("tag", "pedas"),
    "manis": ("tag", "manis"), "sweet": ("tag", "manis"),
    "gurih": ("tag", "gurih"), "creamy": ("tag", "creamy"), "keju": ("tag", "keju"), "cheese": ("tag", "keju"),
    "asam": ("tag", "asam"), "seger": ("suhu", "dingin"), "segar": ("suhu", "dingin"), "dingin": ("suhu", "dingin"),
    "es": ("suhu", "dingin"), "ice": ("suhu", "dingin"), "iced": ("suhu", "dingin"), "gerah": ("suhu", "dingin"),
    "hangat": ("suhu", "hangat"), "anget": ("suhu", "hangat"), "hot": ("suhu", "hangat"), "kuah": ("tag", "berkuah"),
    "berkuah": ("tag", "berkuah"), "sup": ("tag", "berkuah"), "soup": ("tag", "berkuah"),
    "kopi": ("tag", "kopi"), "coffee": ("tag", "kopi"), "ngopi": ("tag", "kopi"), "latte": ("tag", "kopi"),
    "teh": ("tag", "teh"), "tea": ("tag", "teh"), "susu": ("tag", "susu"), "milk": ("tag", "susu"),
    "jus": ("tag", "buah"), "juice": ("tag", "buah"), "buah": ("tag", "buah"), "fruit": ("tag", "buah"),
    "ayam": ("tag", "ayam"), "chicken": ("tag", "ayam"), "sapi": ("tag", "sapi"), "beef": ("tag", "sapi"),
    "daging": ("tag", "sapi"), "iga": ("tag", "sapi"), "seafood": ("tag", "seafood"), "udang": ("tag", "seafood"),
    "cumi": ("tag", "seafood"), "ikan": ("tag", "ikan"), "fish": ("tag", "ikan"), "salmon": ("tag", "ikan"),
    "vegetarian": ("tag", "vegetarian"), "sayur": ("tag", "vegetarian"), "sehat": ("tag", "sehat"), "diet": ("tag", "sehat"),
    "nasi": ("tag", "nasi"), "rice": ("tag", "nasi"), "mie": ("tag", "mie"), "mi": ("tag", "mie"), "noodle": ("tag", "mie"),
    "ramen": ("tag", "mie"), "pasta": ("tag", "pasta"), "spaghetti": ("tag", "pasta"), "roti": ("tag", "roti"),
    "burger": ("tag", "roti"), "sandwich": ("tag", "roti"), "pizza": ("tag", "keju"),
    "berat": ("tag", "berat"), "kenyang": ("tag", "berat"), "lapar": ("tag", "berat"), "laper": ("tag", "berat"),
    "ringan": ("tag", "ringan"), "cemilan": ("tag", "snack"), "camilan": ("tag", "snack"), "ngemil": ("tag", "snack"),
    "snack": ("tag", "snack"), "gorengan": ("tag", "gorengan"), "berbagi": ("tag", "berbagi"), "sharing": ("tag", "berbagi"),
    "rame": ("tag", "berbagi"), "ramai": ("tag", "berbagi"), "keluarga": ("tag", "berbagi"), "nusantara": ("tag", "nusantara"),
    "dessert": ("kategori", "dessert"), "penutup": ("kategori", "dessert"), "kue": ("kategori", "dessert"),
    "cake": ("kategori", "dessert"), "minum": ("kategori", "minuman"), "minuman": ("kategori", "minuman"),
    "haus": ("kategori", "minuman"), "drink": ("kategori", "minuman"), "makan": ("kategori", "makanan"),
    "makanan": ("kategori", "makanan"), "food": ("kategori", "makanan"), "sarapan": ("tag", "sarapan"),
    "matcha": ("kata", "matcha"), "cokelat": ("kata", "chocolate"), "coklat": ("kata", "chocolate"),
    "stroberi": ("kata", "strawberry"), "mangga": ("kata", "mango"), "alpukat": ("kata", "avocado"),
    "gelato": ("kata", "gelato"), "steak": ("kata", "steak"), "salad": ("kata", "salad"), "claypot": ("kata", "claypot"),
}
KATA_ALKOHOL = {"alkohol", "alcohol", "bir", "beer", "cocktail", "koktail", "wine", "soju", "vodka", "whisky", "whiskey", "gin", "rum", "tequila", "mabuk"}
SAPAAN = {"halo", "hai", "hi", "hello", "pagi", "siang", "sore", "malam", "permisi", "hey", "hallo"}
KATA_UMUM = {
    "pengen", "pingin", "ingin", "banget", "dong", "buat", "untuk", "yang", "mau", "minta", "tolong", "aja", "saja", "sama",
    "dengan", "nggak", "enggak", "tidak", "gimana", "kasih", "coba", "rekomendasi", "rekomen", "rekomendasiin", "menu",
    "enak", "bisa", "kakak", "orang", "porsi", "dulu", "lagi", "sekarang", "cocok", "kira", "kalau", "kalo", "boleh",
    "punya", "apa", "terus", "habis", "abis", "sini", "disini", "treehouse", "please", "want", "what", "something",
    "recommend", "with", "some", "have", "bawah", "budget", "harga", "ribu", "murah", "hemat", "maksimal",
}


def rupiah(n):
    return "Rp" + f"{int(n):,}".replace(",", ".")


def batas_harga(teks):
    """'di bawah 50rb', '50k', '50 ribu', 'budget 60000' → 50000 dst."""
    m = re.search(r"(\d+[.,]?\d*)\s*(rb|ribu|k|000)?\b", teks.replace(".", ""))
    if not m or not any(w in teks for w in ("bawah", "budget", "maks", "max", "murah", "hemat", "kurang dari", "rb", "ribu", "k ", "<")):
        return None
    angka = float(m.group(1).replace(",", "."))
    if m.group(2) in ("rb", "ribu", "k") or angka < 1000:
        angka *= 1000
    return int(angka) if angka >= 5000 else None


def cocokkan(pesan, menu_list, skor_kondisi):
    """menu_list: list Menu. skor_kondisi: {menu_id: skor dari mesin rekomendasi}. → (menu terpilih, ada_kriteria)"""
    teks = pesan.lower()
    token = set(re.findall(r"[a-zA-Z]+", teks))
    kriteria = [SINONIM[t] for t in token if t in SINONIM]
    boleh_alkohol = bool(token & KATA_ALKOHOL)
    maks = batas_harga(teks)
    if "murah" in token or "hemat" in token:
        maks = maks or 45000
    kata_nama = {t for t in token if len(t) > 3 and t not in SINONIM and t not in SAPAAN and t not in KATA_UMUM and t not in KATA_ALKOHOL}

    hasil = []
    for m in menu_list:
        if not m.tersedia or (m.beralkohol and not boleh_alkohol) or m.kategori == "lainnya":
            continue
        if maks and m.harga > maks:
            continue
        s, cocok = 0.0, 0
        nama = m.nama.lower()
        for jenis, nilai in kriteria:
            if jenis == "tag" and nilai in (m.tag or []):
                s, cocok = s + 10, cocok + 1
            elif jenis == "suhu" and m.suhu == nilai:
                s, cocok = s + 10, cocok + 1
            elif jenis == "kategori" and m.kategori == nilai:
                s, cocok = s + 6, cocok + 1
            elif jenis == "kata" and (nilai in nama or nilai in m.deskripsi.lower()):
                s, cocok = s + 12, cocok + 1
        for t in kata_nama:
            if t in nama:
                s, cocok = s + 8, cocok + 1
            elif t in m.deskripsi.lower():
                s, cocok = s + 3, cocok + 1
        if boleh_alkohol and m.beralkohol:
            s, cocok = s + 8, cocok + 1
        if kriteria or kata_nama or boleh_alkohol or maks:
            if cocok == 0 and not maks:
                continue
        s += skor_kondisi.get(m.id, 0) * 0.2
        hasil.append((s, m))
    hasil.sort(key=lambda x: (-x[0], x[1].id))
    ada_kriteria = bool(kriteria or kata_nama or boleh_alkohol or maks)
    return [m for _, m in hasil[:MAKS_MENU]], ada_kriteria, maks


# ---------- Mode AI ----------

def susun_prompt(menu_list, cuaca, waktu):
    baris = []
    for m in menu_list:
        if m.kategori == "lainnya":
            continue
        harga = ", ".join(f"{v['nama']} {rupiah(v['harga'])}" for v in m.varian) if m.varian else rupiah(m.harga)
        flag = (" [ALKOHOL 21+]" if m.beralkohol else "") + ("" if m.tersedia else " [HABIS]")
        tag = ", ".join(m.tag or [])
        baris.append(f"{m.id}|{m.nama}|{m.subkategori}|{harga}|{m.suhu}|{tag}{flag}|{m.deskripsi[:90]}")
    kondisi = (
        f"{cuaca['deskripsi']}, {cuaca['suhu']}°C" if cuaca.get("ok") else "tidak diketahui (API cuaca sedang tidak tersedia)"
    )
    return f"""Kamu adalah asisten pelayan di Treehouse Cafe and Resto, satu-satunya kafe rumah pohon di Batam dengan pemandangan laut.
Tugasmu membantu tamu memilih menu. Sekarang waktu {LABEL_WAKTU[waktu].lower()} hari, cuaca di Batam: {kondisi}.

Aturan:
- Hanya rekomendasikan menu dari DAFTAR MENU di bawah. Jangan mengarang menu, harga, atau bahan.
- Pilih paling banyak {MAKS_MENU} menu yang paling cocok dengan permintaan tamu, dan pertimbangkan cuaca serta waktu.
- Jangan pernah menyarankan menu bertanda [ALKOHOL 21+] kecuali tamu sendiri menanyakan alkohol, bir, wine, atau cocktail.
- Jangan sarankan menu bertanda [HABIS].
- Jawab ramah, santai, singkat (maksimal 3 kalimat), dalam bahasa yang dipakai tamu.
- Kalau pertanyaan di luar urusan menu/kafe, jawab singkat dengan sopan lalu arahkan kembali ke menu.
- Harga belum termasuk pajak dan service.

Balas HANYA dengan JSON valid tanpa teks lain, format:
{{"balasan": "teks untuk tamu", "menu_ids": [id, id]}}

DAFTAR MENU (id|nama|kelompok|harga|suhu|ciri|deskripsi):
""" + "\n".join(baris)


def _post_json(url, headers, body, timeout=25):
    req = urllib.request.Request(url, data=json.dumps(body).encode("utf-8"), headers={"Content-Type": "application/json", **headers}, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


def panggil_ai(konf, sistem, riwayat):
    """riwayat: list {'peran': 'tamu'|'asisten', 'teks': str}, diakhiri pesan tamu. → teks mentah balasan."""
    model = konf.model_dipakai
    if konf.penyedia == "anthropic":
        pesan = [{"role": "user" if r["peran"] == "tamu" else "assistant", "content": r["teks"]} for r in riwayat]
        d = _post_json(
            "https://api.anthropic.com/v1/messages",
            {"x-api-key": konf.api_key, "anthropic-version": "2023-06-01"},
            {"model": model, "max_tokens": 600, "system": sistem, "messages": pesan},
        )
        return "".join(b.get("text", "") for b in d.get("content", []) if b.get("type") == "text")
    if konf.penyedia == "gemini":
        isi = [{"role": "user" if r["peran"] == "tamu" else "model", "parts": [{"text": r["teks"]}]} for r in riwayat]
        d = _post_json(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
            {"x-goog-api-key": konf.api_key},
            {"systemInstruction": {"parts": [{"text": sistem}]}, "contents": isi,
             "generationConfig": {"maxOutputTokens": 600, "responseMimeType": "application/json"}},
        )
        return "".join(p.get("text", "") for p in d["candidates"][0]["content"]["parts"])
    if konf.penyedia == "openai":
        pesan = [{"role": "system", "content": sistem}] + [
            {"role": "user" if r["peran"] == "tamu" else "assistant", "content": r["teks"]} for r in riwayat
        ]
        d = _post_json(
            "https://api.openai.com/v1/chat/completions",
            {"Authorization": f"Bearer {konf.api_key}"},
            {"model": model, "messages": pesan, "max_completion_tokens": 600, "response_format": {"type": "json_object"}},
        )
        return d["choices"][0]["message"]["content"]
    raise ValueError("Penyedia AI belum dipilih.")


def baca_balasan(teks):
    """Ambil {'balasan', 'menu_ids'} dari teks AI, toleran terhadap format yang sedikit melenceng."""
    m = re.search(r"\{.*\}", teks or "", re.S)
    if m:
        try:
            d = json.loads(m.group(0))
            ids = [int(i) for i in d.get("menu_ids", []) if str(i).isdigit()]
            return str(d.get("balasan", "")).strip(), ids
        except (ValueError, TypeError):
            pass
    return (teks or "").strip()[:600], [int(i) for i in re.findall(r"\[\[(\d+)\]\]", teks or "")]


def pesan_galat_ai(e):
    if isinstance(e, urllib.error.HTTPError):
        try:
            isi = json.loads(e.read().decode("utf-8"))
            detail = isi.get("error", {})
            detail = detail.get("message") if isinstance(detail, dict) else str(detail)
        except Exception:
            detail = ""
        return f"HTTP {e.code}{': ' + detail if detail else ''}"[:250]
    return (str(getattr(e, "reason", "")) or str(e) or e.__class__.__name__)[:250]
