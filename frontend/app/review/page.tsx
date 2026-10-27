"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { API } from "../lib/api";
import { useMeja } from "../components/WajibScan";
import { judul, teks } from "../lib/fonts";

const ARTI = ["", "Kurang sekali", "Kurang", "Biasa saja", "Bagus", "Luar biasa"];

export default function HalamanUlasan() {
  const sesi = useMeja();
  const [rating, setRating] = useState(0);
  const [komentar, setKomentar] = useState("");
  const [status, setStatus] = useState<"isi" | "mengirim" | "terkirim">("isi");
  const [error, setError] = useState("");

  const kirim = async (e: FormEvent) => {
    e.preventDefault();
    if (!rating) {
      setError("Pilih jumlah bintang dulu.");
      return;
    }
    setStatus("mengirim");
    setError("");
    try {
      const r = await fetch(`${API}/api/ulasan/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kode: sesi?.kode, rating, komentar }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail ?? "Ulasan gagal dikirim.");
      setStatus("terkirim");
    } catch (e) {
      const m = (e as Error).message;
      setError(m === "Failed to fetch" ? "Server tidak bisa dihubungi. Coba lagi sebentar." : m);
      setStatus("isi");
    }
  };

  return (
    <div className={`${teks.className} min-h-screen bg-[#E2D4B2] text-[#3B2618]`}>
      <header className="bg-[#3B2618] text-[#F3EBD8]">
        <div className="mx-auto flex max-w-[560px] items-center justify-between px-4 py-3">
          <Link href="/" className="rounded-full px-3 py-1.5 text-sm text-[#E2D4B2] hover:bg-white/10">
            Beranda
          </Link>
          <h1 className={`${judul.className} text-xl font-extrabold`}>Ulasan</h1>
          <span className="rounded-full border border-[#E2D4B2]/40 px-3 py-1.5 text-sm">Meja {sesi?.nomor}</span>
        </div>
      </header>

      <main className="mx-auto max-w-[560px] px-4 py-8">
        <div className="rounded-[28px] border border-[#CDBB94] bg-[#FBF6EA] p-6 shadow-[0_6px_0_#C2AC7F] sm:p-8">
          {status === "terkirim" ? (
            <div className="text-center">
              <p className={`${judul.className} text-3xl font-extrabold text-[#2F7D62]`}>Terima kasih!</p>
              <p className="mt-2 text-sm leading-relaxed text-[#6B4A33]">
                Ulasanmu sudah kami terima dan akan kami pakai untuk membuat Treehouse lebih baik lagi.
              </p>
              <Link
                href="/menu"
                className="mt-6 inline-block rounded-full bg-[#2F7D62] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_0_#1E5642] active:translate-y-1 active:shadow-none"
              >
                Kembali ke menu
              </Link>
            </div>
          ) : (
            <form onSubmit={kirim} className="space-y-6">
              <div>
                <h2 className={`${judul.className} text-2xl font-extrabold leading-tight`}>Bagaimana pengalamanmu hari ini?</h2>
                <p className="mt-1 text-sm text-[#6B4A33]">Tanpa perlu daftar akun. Cukup pilih bintang dan tulis kesanmu.</p>
              </div>

              <fieldset>
                <legend className="sr-only">Rating</legend>
                <div className="flex justify-between gap-1 sm:justify-start sm:gap-3">
                  {[1, 2, 3, 4, 5].map((b) => (
                    <label key={b} className="cursor-pointer">
                      <input type="radio" name="rating" value={b} checked={rating === b} onChange={() => setRating(b)} className="peer sr-only" />
                      <span
                        aria-hidden="true"
                        className={`grid h-14 w-14 place-items-center rounded-2xl text-3xl transition peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#2F7D62] ${
                          b <= rating ? "bg-[#F6DEC6] text-[#D98A3D] shadow-[0_3px_0_#E2B88C]" : "bg-[#EFE5CD] text-[#CDBB94]"
                        }`}
                      >
                        ★
                      </span>
                      <span className="sr-only">{b} bintang, {ARTI[b]}</span>
                    </label>
                  ))}
                </div>
                <p className="mt-2 h-5 text-sm font-medium text-[#7A5236]">{ARTI[rating]}</p>
              </fieldset>

              <label className="block text-sm font-semibold">
                Ceritakan sedikit (opsional)
                <textarea
                  value={komentar}
                  onChange={(e) => setKomentar(e.target.value.slice(0, 1000))}
                  rows={4}
                  placeholder="Contoh: pemandangannya bagus, tom yam-nya enak, tapi pesanan agak lama."
                  className="mt-1.5 w-full resize-none rounded-xl border border-[#E2D4B2] bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-[#2F7D62]"
                />
              </label>

              {error && <p className="rounded-xl bg-[#F6DEC6] px-4 py-2.5 text-sm text-[#8A4B17]">{error}</p>}

              <button
                type="submit"
                disabled={status === "mengirim"}
                className="h-12 w-full rounded-full bg-[#2F7D62] text-sm font-semibold text-white shadow-[0_4px_0_#1E5642] transition active:translate-y-1 active:shadow-none disabled:bg-[#B9A783] disabled:shadow-none"
              >
                {status === "mengirim" ? "Mengirim..." : "Kirim ulasan"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
