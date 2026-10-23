"""Analisis sentimen sederhana berbasis kamus kata (Bahasa Indonesia + Inggris) dan rating bintang."""

import re

POSITIF = {
    "enak", "lezat", "mantap", "mantul", "sedap", "nikmat", "bagus", "suka", "ramah", "cepat", "nyaman", "bersih",
    "rekomen", "recommended", "keren", "puas", "terbaik", "segar", "seger", "cantik", "indah", "worth", "top",
    "oke", "ok", "best", "love", "nice", "good", "great", "amazing", "delicious", "tasty", "murah", "asik", "asyik",
    "sejuk", "adem", "memuaskan", "pas", "juara", "favorit", "betah", "sopan", "friendly", "lengkap", "luas",
    "estetik", "aesthetic", "instagramable", "romantis", "menarik", "wangi", "lembut", "renyah", "crispy", "fresh",
}
NEGATIF = {
    "lama", "lambat", "mahal", "kotor", "asin", "hambar", "jutek", "kecewa", "buruk", "jelek", "basi", "berisik",
    "mengecewakan", "parah", "bad", "slow", "worst", "rude", "overpriced", "alot", "keras", "gosong", "amis",
    "pahit", "bau", "sempit", "pengap", "kasar", "cuek", "lelet", "nyamuk", "salah", "kurang", "terlalu", "zonk",
    "kemahalan", "lalat", "rusak", "telat", "antri", "antre", "ribet",
}
PENYANGKAL = {"tidak", "gak", "ga", "nggak", "enggak", "tak", "kurang", "bukan", "belum", "not", "no", "never"}


def analisis(komentar: str, rating: int) -> str:
    kata = re.findall(r"[a-zA-Z]+", (komentar or "").lower())
    skor = 0.0
    for i, k in enumerate(kata):
        tanda = 1 if k in POSITIF else -1 if k in NEGATIF and k != "kurang" else 0
        if not tanda:
            continue
        sebelum = kata[max(0, i - 2):i]
        if any(s in PENYANGKAL for s in sebelum):
            tanda = -tanda  # "tidak enak" → negatif, "nggak lama" → positif
        skor += tanda
    if "kurang" in kata and not any(k in POSITIF for k in kata[kata.index("kurang") + 1:kata.index("kurang") + 3]):
        skor -= 1  # "kurang" berdiri sendiri, misal "porsinya kurang"
    skor += (int(rating) - 3) * 1.5
    if skor > 0.5:
        return "positif"
    if skor < -0.5:
        return "negatif"
    return "netral"
