"use client";

import { useState, type ReactNode } from "react";

const DAFTAR_MEJA: string[] = Array.from({ length: 20 }, (_, i) => `Meja ${i + 1}`);

/* ---------- Ikon (inline SVG, tanpa dependensi) ---------- */
const IkonMatahari = () => (
  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

const IkonLokasi = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
    <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
  </svg>
);

const IkonKeranjang = () => (
  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
    <path d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM1 2v2h2l3.6 7.6-1.4 2.4A2 2 0 0 0 7 17h12v-2H7.4l1.1-2h7.5a2 2 0 0 0 1.8-1l3.6-6.5A1 1 0 0 0 20.5 4H5.2l-.9-2H1Z" />
  </svg>
);

const IkonMenu = () => (
  <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 18h18" />
    <path d="M5 18a7 7 0 0 1 14 0" />
    <path d="M12 8V6" />
    <circle cx="12" cy="5" r="1" />
  </svg>
);

const IkonBintang = () => (
  <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor" aria-hidden="true">
    <path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9L12 2.5Z" />
  </svg>
);

const IkonInstagram = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const IkonFacebook = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
    <path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.5 1.6-1.5h1.7V4.4c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1v2.4H7.6V14h2.8v8h3.1Z" />
  </svg>
);

const IkonPanah = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/* ---------- Komponen kecil ---------- */
type KartuUtamaProps = {
  href: string;
  ikon: ReactNode;
  judul: string;
  deskripsi: string;
};

function KartuUtama({ href, ikon, judul, deskripsi }: KartuUtamaProps) {
  return (
    <a
      href={href}
      className="group relative flex min-h-[190px] flex-col gap-2 rounded-xl border border-[#d9e0d3] bg-white p-5 transition hover:border-[#5d7a4d] hover:shadow-md focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5d7a4d]"
    >
      <span className="mb-2 grid h-16 w-16 place-items-center rounded-full bg-[#25382d] text-white">
        {ikon}
      </span>
      <span className="text-lg font-semibold text-[#1f2a23]">{judul}</span>
      <span className="max-w-[28ch] text-sm leading-relaxed text-[#66736a]">{deskripsi}</span>
      <span className="absolute bottom-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-[#5d7a4d] text-white transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none">
        <IkonPanah />
      </span>
    </a>
  );
}

type KartuSosmedProps = {
  href: string;
  ikon: ReactNode;
  nama: string;
  deskripsi: string;
};

function KartuSosmed({ href, ikon, nama, deskripsi }: KartuSosmedProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-1 items-center gap-3.5 rounded-xl border border-[#d9e0d3] bg-white py-4 pl-4 pr-16 transition hover:border-[#5d7a4d] hover:shadow-md focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5d7a4d]"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#e6ede0] text-[#25382d]">
        {ikon}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="font-semibold text-[#1f2a23]">{nama}</span>
        <span className="text-[0.82rem] leading-snug text-[#66736a]">{deskripsi}</span>
      </span>
      <span className="absolute right-3.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-[#5d7a4d] text-white transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none">
        <IkonPanah />
      </span>
    </a>
  );
}

/* ---------- Halaman ---------- */
export default function Home() {
  const [meja, setMeja] = useState<string>("Meja 5");
  const jumlahKeranjang = 0; // ganti dengan state/context keranjang Anda

  return (
    <div className="min-h-screen bg-[#f4f6f1] text-[#1f2a23]">
      {/* Navbar */}
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[#d9e0d3] bg-white px-3.5 py-2.5 sm:px-6 sm:py-3">
        <a href="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo Treehouse" className="h-10" />
          <span className="flex flex-col leading-tight">
            <strong className="text-base">Treehouse</strong>
            <small className="hidden text-xs text-[#66736a] sm:block">Cafe and Resto</small>
          </span>
        </a>

        <div className="flex items-center gap-2.5 sm:gap-5">
          <div className="flex items-center gap-2 text-[#8b6b4a]">
            <IkonMatahari />
            <span className="flex flex-col text-[0.8rem] leading-tight text-[#66736a]">
              <span>29°C</span>
              <span className="hidden sm:block">Cerah</span>
            </span>
          </div>

          <label className="flex items-center gap-1.5 rounded-lg border border-[#d9e0d3] bg-[#f4f6f1] px-3 py-2 text-[#5d7a4d]">
            <IkonLokasi />
            <span className="sr-only">Pilih meja</span>
            <select
              value={meja}
              onChange={(e) => setMeja(e.target.value)}
              className="cursor-pointer bg-transparent text-sm text-[#1f2a23] outline-none"
            >
              {DAFTAR_MEJA.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>

          <a
            href="/keranjang"
            aria-label="Keranjang"
            className="relative grid h-11 w-11 place-items-center text-[#25382d]"
          >
            <IkonKeranjang />
            {jumlahKeranjang > 0 && (
              <span className="absolute right-0 top-0 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#8b6b4a] px-1 text-[0.7rem] font-bold text-white">
                {jumlahKeranjang}
              </span>
            )}
          </a>
        </div>
      </header>

      <main>
        {/* Hero — ganti bg-[...] dengan foto kafe: bg-[url('/hero.jpg')] bg-cover bg-center */}
        <section className="flex min-h-[240px] items-center bg-[linear-gradient(90deg,rgba(37,56,45,0.92),rgba(37,56,45,0.55)),linear-gradient(135deg,#3d5a47,#6f8a5c)] px-4 py-8 text-white sm:min-h-[300px] sm:px-6 sm:py-12">
          <div className="mx-auto w-full max-w-[1100px]">
            <p className="mb-1.5 text-lg opacity-85">Welcome to</p>
            <h1 className="mb-4 text-[clamp(2rem,5vw,3.4rem)] font-bold leading-[1.1] tracking-tight">
              Treehouse Cafe and Resto
            </h1>
            <p className="max-w-[52ch] leading-relaxed opacity-90">
            The only tree house cafe in Batam. Back to nature, elevated with elegance stunning seaside views & beautiful handcrafted
            </p>
          </div>
        </section>

        {/* Kartu aksi */}
        <section className="mx-auto grid max-w-[1100px] grid-cols-1 gap-3.5 p-4 sm:grid-cols-2 sm:gap-5 sm:p-6 lg:grid-cols-3">
          <KartuUtama
            href="/menu"
            ikon={<IkonMenu />}
            judul="Lihat Menu"
            deskripsi="Pilih makanan dan minuman, lalu tambahkan ke keranjang."
          />
          <KartuUtama
            href="/review"
            ikon={<IkonBintang />}
            judul="Beri Ulasan / Review"
            deskripsi="Ceritakan pengalaman Anda agar kami bisa melayani lebih baik."
          />

          <div className="flex flex-col gap-3.5 sm:col-span-2 sm:flex-row sm:gap-5 lg:col-span-1 lg:flex-col">
            <KartuSosmed
              href="https://www.instagram.com/treehousecafeandresto/"
              ikon={<IkonInstagram />}
              nama="Instagram"
              deskripsi="Foto menu dan kabar terbaru."
            />
            <KartuSosmed
              href="https://www.facebook.com/profile.php?id=61590389742572"
              ikon={<IkonFacebook />}
              nama="Facebook"
              deskripsi="Event dan promo kafe."
            />
          </div>
        </section>
      </main>
    </div>
  );
}