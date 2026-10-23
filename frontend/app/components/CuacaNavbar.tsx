"use client";

import { useEffect, useState } from "react";
import { API } from "../lib/api";

type Cuaca = { ok: boolean; kondisi: string | null; suhu: number | null; deskripsi: string };

const Matahari = () => (
  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4.2" fill="currentColor" />
    <path d="M12 2v2.2M12 19.8V22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2 12h2.2M19.8 12H22M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
  </svg>
);
const Awan = () => (
  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
    <path d="M7 18a5 5 0 0 1-.6-9.96A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9H7Z" />
  </svg>
);
const Hujan = () => (
  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M7 14a5 5 0 0 1-.6-9.96A6 6 0 0 1 18 5a4.5 4.5 0 0 1-.5 9H7Z" fill="currentColor" stroke="none" />
    <path d="M8 17l-1 3M12 17l-1 3M16 17l-1 3" />
  </svg>
);

/** Cuaca asli dari backend (ADM-05), menggantikan tulisan "29°C Cerah" yang sebelumnya tetap. */
export default function CuacaNavbar() {
  const [c, setC] = useState<Cuaca | null>(null);

  useEffect(() => {
    const muat = () =>
      fetch(`${API}/api/cuaca/`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d && setC(d.cuaca))
        .catch(() => {});
    muat();
    const t = setInterval(muat, 15 * 60_000);
    return () => clearInterval(t);
  }, []);

  if (!c || !c.ok) return null; // cuaca tidak tersedia: sembunyikan saja, jangan tampilkan angka palsu

  const ikon =
    c.kondisi === "hujan" ? (
      <span className="text-[#5b8db8]"><Hujan /></span>
    ) : c.kondisi === "berawan" ? (
      <span className="text-[#9aa8b1]"><Awan /></span>
    ) : (
      <span className="inline-block animate-rotate-slow text-[#f5a524]"><Matahari /></span>
    );

  return (
    <div className="flex items-center gap-2" title={`Cuaca sekarang: ${c.deskripsi}`}>
      {ikon}
      <span className="flex flex-col text-[0.78rem] leading-tight text-[#4f6358]">
        <span className="font-semibold text-[#1f3a2e]">{c.suhu}°C</span>
        <span className="hidden sm:block">{c.deskripsi}</span>
      </span>
    </div>
  );
}
