"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { API } from "../lib/api";
import { ikonMenu, rupiah, type Menu } from "../lib/menu";
import type { SesiMeja } from "../lib/sesiMeja";
import { useKeranjang } from "./Keranjang";

type Pesan = { peran: "tamu" | "asisten"; teks: string; menu?: Menu[] };

const SARAN = ["Yang segar dong", "Lagi lapar banget", "Kopi buat santai", "Dessert manis", "Di bawah 50rb"];
const SAPAAN: Pesan = {
  peran: "asisten",
  teks: "Halo! Aku bantu pilihkan menu. Mau yang segar, hangat, pedas, atau lagi cari yang hemat?",
};

export default function ChatBox({ sesi }: { sesi: SesiMeja }) {
  const keranjang = useKeranjang();
  const router = useRouter();
  const [buka, setBuka] = useState(false);
  const [pesan, setPesan] = useState<Pesan[]>([SAPAAN]);
  const [input, setInput] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [info, setInfo] = useState("");
  const bawah = useRef<HTMLDivElement>(null);
  const kolom = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bawah.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [pesan, sibuk]);

  useEffect(() => {
    if (!buka) return;
    kolom.current?.focus();
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBuka(false);
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [buka]);

  useEffect(() => {
    if (!info) return;
    const t = setTimeout(() => setInfo(""), 2000);
    return () => clearTimeout(t);
  }, [info]);

  const kirim = async (teks: string) => {
    teks = teks.trim();
    if (!teks || sibuk || !sesi) return;
    const riwayat = pesan.slice(1).map(({ peran, teks }) => ({ peran, teks })); // sapaan awal tidak dikirim
    setPesan((p) => [...p, { peran: "tamu", teks }]);
    setInput("");
    setSibuk(true);
    try {
      const r = await fetch(`${API}/api/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kode: sesi.kode, pesan: teks, riwayat }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail ?? "Chat sedang bermasalah.");
      setPesan((p) => [...p, { peran: "asisten", teks: d.balasan, menu: d.menu }]);
    } catch (e) {
      const m = (e as Error).message;
      setPesan((p) => [
        ...p,
        { peran: "asisten", teks: m === "Failed to fetch" ? "Server tidak bisa dihubungi. Coba lagi sebentar ya." : m },
      ]);
    } finally {
      setSibuk(false);
    }
  };

  const kirimForm = (e: FormEvent) => {
    e.preventDefault();
    kirim(input);
  };

  const lihat = (m: Menu) => {
    setBuka(false);
    router.push(`/menu?buka=${m.id}`);
  };

  const tambah = (m: Menu) => {
    keranjang.tambah({ menuId: m.id, nama: m.nama, varian: null, harga: m.harga, jumlah: 1, catatan: "", foto: m.foto });
    setInfo(`${m.nama} masuk keranjang`);
  };

  return (
    <>
      {!buka && (
        <button
          type="button"
          onClick={() => setBuka(true)}
          aria-label="Tanya rekomendasi menu"
          className="fixed bottom-24 right-4 z-30 flex items-center gap-2 rounded-full bg-[#3B2618] py-3 pl-4 pr-5 text-sm font-semibold text-[#F3EBD8] shadow-[0_5px_0_#2A1A10,0_14px_24px_-8px_rgba(0,0,0,.5)] transition active:translate-y-1 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F7D62]"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
            <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm4 7a1.3 1.3 0 1 0 0-2.6A1.3 1.3 0 0 0 8 11Zm4 0a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6Zm4 0a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6Z" />
          </svg>
          Tanya menu
        </button>
      )}

      {buka && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Chat rekomendasi menu"
          className="font-teks fixed inset-0 z-50 flex flex-col bg-[#E2D4B2] text-[#3B2618] sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[600px] sm:max-h-[calc(100vh-3rem)] sm:w-[390px] sm:overflow-hidden sm:rounded-[28px] sm:shadow-[0_8px_0_#2A1A10,0_30px_60px_-20px_rgba(0,0,0,.6)]"
        >
          <header className="flex items-center justify-between bg-[#3B2618] px-4 py-3 text-[#F3EBD8]">
            <div>
              <p className="font-judul text-lg font-extrabold leading-tight">Tanya menu</p>
              <p className="text-xs text-[#B9A783]">Meja {sesi.nomor}, dibantu asisten Treehouse</p>
            </div>
            <button
              type="button"
              onClick={() => setBuka(false)}
              aria-label="Tutup chat"
              className="grid h-9 w-9 place-items-center rounded-full text-lg hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#E2D4B2]"
            >
              ✕
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4" aria-live="polite">
            {pesan.map((p, i) => (
              <div key={i} className={p.peran === "tamu" ? "flex justify-end" : "flex flex-col items-start gap-2"}>
                <p
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    p.peran === "tamu" ? "rounded-br-md bg-[#2F7D62] text-white" : "rounded-bl-md bg-[#FBF6EA] text-[#3B2618]"
                  }`}
                >
                  {p.teks}
                </p>
                {p.menu && p.menu.length > 0 && (
                  <ul className="w-full space-y-2">
                    {p.menu.map((m) => (
                      <li key={m.id} className="flex items-center gap-3 rounded-2xl border border-[#CDBB94] bg-[#FBF6EA] p-2 shadow-[0_3px_0_#C2AC7F]">
                        <button type="button" onClick={() => lihat(m)} className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#5B3A26]" aria-label={`Lihat ${m.nama}`}>
                          {m.foto ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.foto} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="grid h-full w-full place-items-center text-2xl" aria-hidden="true">{ikonMenu(m)}</span>
                          )}
                        </button>
                        <button type="button" onClick={() => lihat(m)} className="min-w-0 flex-1 text-left">
                          <span className="font-judul block truncate text-sm font-semibold">{m.nama}</span>
                          <span className="text-xs font-bold text-[#7A5236]">
                            {m.varian.length > 0 ? `mulai ${rupiah(m.harga)}` : rupiah(m.harga)}
                          </span>
                        </button>
                        {m.varian.length === 0 ? (
                          <button
                            type="button"
                            onClick={() => tambah(m)}
                            aria-label={`Tambah ${m.nama} ke keranjang`}
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#2F7D62] text-xl leading-none text-white shadow-[0_3px_0_#1E5642] active:translate-y-[3px] active:shadow-none"
                          >
                            +
                          </button>
                        ) : (
                          <button type="button" onClick={() => lihat(m)} className="shrink-0 rounded-full bg-[#EFE5CD] px-3 py-1.5 text-xs font-semibold text-[#5B3A26]">
                            Pilih ukuran
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            {sibuk && <p className="w-fit rounded-2xl rounded-bl-md bg-[#FBF6EA] px-3.5 py-2.5 text-sm text-[#7A5236]">Sedang memilihkan...</p>}
            {pesan.length === 1 && !sibuk && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SARAN.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => kirim(s)}
                    className="rounded-full border border-[#5B3A26]/30 bg-[#FBF6EA]/60 px-3 py-1.5 text-xs text-[#5B3A26] hover:bg-[#FBF6EA]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={bawah} />
          </div>

          {info && <p className="mx-3 mb-2 rounded-full bg-[#3B2618] px-4 py-2 text-center text-xs text-[#F3EBD8]">{info}</p>}

          <form onSubmit={kirimForm} className="flex gap-2 border-t border-[#CDBB94] bg-[#FBF6EA] p-3">
            <input
              ref={kolom}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 500))}
              placeholder="Contoh: yang pedas di bawah 60rb"
              aria-label="Tulis pesan"
              className="min-w-0 flex-1 rounded-full border border-[#E2D4B2] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#2F7D62]"
            />
            <button
              type="submit"
              disabled={sibuk || !input.trim()}
              className="rounded-full bg-[#2F7D62] px-4 text-sm font-semibold text-white disabled:bg-[#B9A783]"
            >
              Kirim
            </button>
          </form>
        </div>
      )}
    </>
  );
}
