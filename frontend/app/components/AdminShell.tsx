"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { KUNCI_TOKEN } from "../lib/api";
import { keluarAdmin } from "../lib/adminApi";

const NAV = [
  { href: "/admin/dashboard", label: "Ringkasan" },
  { href: "/admin/menu", label: "Menu" },
  { href: "/admin/aturan", label: "Aturan rekomendasi" },
  { href: "/admin/statistik", label: "Statistik menu" },
  { href: "/admin/ulasan", label: "Ulasan" },
  { href: "/admin/meja", label: "Meja & QR" },
  { href: "/admin/pengaturan", label: "Pengaturan" },
];

export default function AdminShell({ judul, aksi, children }: { judul: string; aksi?: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  const [siap, setSiap] = useState(false);

  useEffect(() => {
    let ada = false;
    try {
      ada = !!localStorage.getItem(KUNCI_TOKEN);
    } catch {}
    if (!ada) keluarAdmin();
    else setSiap(true);
  }, []);

  if (!siap) return <div className="min-h-screen bg-[#f6faf7]" />;

  return (
    <div className="min-h-screen bg-[#f6faf7] text-[#1f2a23] lg:flex print:block print:bg-white">
      <aside className="border-b border-[#e1ece5] bg-white lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r print:hidden">
        <div className="flex items-center justify-between px-4 py-3 lg:block lg:px-5 lg:py-6">
          <div>
            <p className="text-lg font-bold text-[#1f6b50]">Treehouse</p>
            <p className="text-xs text-[#4f6358]">Panel admin</p>
          </div>
          <button onClick={keluarAdmin} className="rounded-lg border border-[#d6e6dc] px-3 py-1.5 text-sm hover:bg-[#e6f4ec] lg:hidden">
            Keluar
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3 lg:pb-0" aria-label="Menu admin">
          {NAV.map((n) => {
            const aktif = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={aktif ? "page" : undefined}
                className={`shrink-0 rounded-lg px-3 py-2 text-sm transition ${
                  aktif ? "bg-[#2f7d62] font-semibold text-white" : "text-[#1f3a2e] hover:bg-[#e6f4ec]"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden px-3 pt-6 lg:block">
          <button onClick={keluarAdmin} className="w-full rounded-lg border border-[#d6e6dc] px-3 py-2 text-left text-sm hover:bg-[#e6f4ec]">
            Keluar
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e1ece5] bg-white px-4 py-4 sm:px-6 print:hidden">
          <h1 className="text-xl font-bold text-[#1f6b50]">{judul}</h1>
          {aksi && <div className="flex flex-wrap gap-2">{aksi}</div>}
        </header>
        <main className="mx-auto max-w-[1150px] space-y-6 p-4 sm:p-6 print:max-w-none print:p-0">{children}</main>
      </div>
    </div>
  );
}

/* Komponen kecil yang dipakai di banyak halaman admin */
export const kelasTombol = "rounded-lg bg-[#2f7d62] px-3 py-2 text-sm font-medium text-white hover:bg-[#256650] disabled:opacity-60";
export const kelasTombolGaris = "rounded-lg border border-[#d6e6dc] bg-white px-3 py-2 text-sm hover:bg-[#e6f4ec] disabled:opacity-60";
export const kelasInput = "w-full rounded-lg border border-[#d6e6dc] bg-white px-3 py-2 text-sm outline-none focus:border-[#2f7d62]";
export const kelasKartu = "rounded-2xl border border-[#cfe7db] bg-white p-4 sm:p-5";

export function Saklar({ nyala, onUbah, label, disabled }: { nyala: boolean; onUbah: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={nyala}
      aria-label={label}
      disabled={disabled}
      onClick={onUbah}
      className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f7d62] ${
        nyala ? "bg-[#2f7d62]" : "bg-[#cfd8d3]"
      }`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${nyala ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

export function Angka({ judul, nilai, catatan }: { judul: string; nilai: string | number; catatan?: string }) {
  return (
    <div className="rounded-2xl border border-[#cfe7db] bg-white p-4">
      <p className="text-sm text-[#4f6358]">{judul}</p>
      <p className="text-3xl font-bold text-[#1f6b50]">{typeof nilai === "number" ? nilai.toLocaleString("id-ID") : nilai}</p>
      {catatan && <p className="mt-0.5 text-xs text-[#4f6358]">{catatan}</p>}
    </div>
  );
}

export function Konfirmasi({ pesan, onYa, onBatal, labelYa = "Hapus" }: { pesan: string; onYa: () => void; onBatal: () => void; labelYa?: string }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onBatal();
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onBatal]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onBatal}>
      <div role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <p className="text-sm leading-relaxed">{pesan}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button autoFocus onClick={onBatal} className={kelasTombolGaris}>Batal</button>
          <button onClick={onYa} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700">{labelYa}</button>
        </div>
      </div>
    </div>
  );
}
