"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

const DAFTAR_MEJA: string[] = Array.from({ length: 20 }, (_, i) => `Meja ${i + 1}`);

/* ---------- Ikon (inline SVG, tanpa dependensi) ---------- */
const IkonMatahari = () => (
  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4.2" fill="currentColor" />
    <path d="M12 2v2.2M12 19.8V22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2 12h2.2M19.8 12H22M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
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

const IkonChevron = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const IkonMenu = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 18h18" />
    <path d="M5 18a7 7 0 0 1 14 0" />
    <path d="M12 8V6" />
    <circle cx="12" cy="5" r="1" />
  </svg>
);

const IkonBintang = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
    <path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9L12 2.5Z" />
  </svg>
);

const IkonInstagram = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const IkonPanah = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/* Hiasan daun di pojok kartu */
const HiasanDaun = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 120 120" className={className} fill="currentColor" aria-hidden="true">
    <path d="M20 110C14 62 44 26 100 16c6 52-24 88-80 94Z" />
    <path d="M10 70C6 44 22 24 50 18c3 28-12 46-40 52Z" opacity="0.7" />
    <path d="M24 108C46 78 66 56 92 32" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/* ---------- Tema warna kartu ---------- */
const TEMA = {
  hijau: {
    kartu: "border-[#cfe7db] bg-[linear-gradient(135deg,#e6f4ec_0%,#f7fcf9_100%)] hover:shadow-[0_14px_30px_-10px_rgba(47,125,98,0.35)]",
    ikon: "bg-[#2f7d62]",
    daun: "text-[#2f7d62]/15",
  },
  oranye: {
    kartu: "border-[#f3dcc3] bg-[linear-gradient(135deg,#fcebd9_0%,#fffaf4_100%)] hover:shadow-[0_14px_30px_-10px_rgba(217,138,61,0.4)]",
    ikon: "bg-[#d98a3d]",
    daun: "text-[#d98a3d]/20",
  },
  pink: {
    kartu: "border-[#f4d3e1] bg-[linear-gradient(135deg,#fbe4ee_0%,#fff8fb_100%)] hover:shadow-[0_14px_30px_-10px_rgba(194,51,111,0.35)]",
    ikon: "bg-[#c2336f]",
    daun: "text-[#c2336f]/15",
  },
} as const;

type KartuProps = {
  href: string;
  tema: keyof typeof TEMA;
  ikon: ReactNode;
  judul: string;
  deskripsi: string;
  eksternal?: boolean;
  delay: number;
};

function Kartu({ href, tema, ikon, judul, deskripsi, eksternal, delay }: KartuProps) {
  const t = TEMA[tema];
  const kelas = `group relative flex min-h-[170px] flex-col gap-1.5 overflow-hidden rounded-2xl border p-5 animate-fade-up transition-all duration-300 hover:-translate-y-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f7d62] ${t.kartu}`;

  const isi = (
    <>
      <HiasanDaun
        className={`pointer-events-none absolute -right-3 -top-3 h-28 w-28 origin-bottom-left animate-sway ${t.daun}`}
      />
      <span
        className={`relative mb-2 grid h-12 w-12 place-items-center rounded-full text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 ${t.ikon}`}
      >
        {ikon}
      </span>
      <span className="relative text-[1.05rem] font-bold text-[#1f3a2e]">{judul}</span>
      <span className="relative max-w-[26ch] text-[0.82rem] leading-relaxed text-[#4f6358]">
        {deskripsi}
      </span>
      <span className="absolute bottom-4 right-4 grid h-9 w-9 place-items-center rounded-full bg-[#2f7d62] text-white shadow transition-all duration-300 group-hover:translate-x-1 group-hover:bg-[#256650]">
        <IkonPanah />
      </span>
    </>
  );

  const style = { animationDelay: `${delay}ms` };

  return eksternal ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={kelas} style={style}>
      {isi}
    </a>
  ) : (
    <Link href={href} className={kelas} style={style}>
      {isi}
    </Link>
  );
}

/* ---------- Halaman ---------- */
export default function Home() {
  const [meja, setMeja] = useState<string>("Meja 5");
  const jumlahKeranjang = 0; // ganti dengan state/context keranjang

  return (
    <div className="min-h-screen bg-[#f6faf7] text-[#1f2a23]">
      {/* Navbar */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-[#e1ece5] bg-white/90 px-3.5 py-2.5 backdrop-blur animate-fade-in sm:px-6 sm:py-3">
        <Link href="/" className="group flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="Logo Treehouse"
            width={44}
            height={44}
            priority
            className="h-11 w-11 shrink-0 rounded-lg object-contain transition-transform duration-500 group-hover:rotate-6 group-hover:scale-105"
          />
          <span className="flex flex-col leading-tight">
            <strong className="text-lg font-bold text-[#1f6b50]">Treehouse</strong>
            <small className="hidden text-xs font-medium text-[#2f7d62] sm:block">
              Cafe and Resto
            </small>
          </span>
        </Link>

        <div className="flex items-center gap-2.5 sm:gap-5">
          {/* Cuaca */}
          <div className="flex items-center gap-2">
            <span className="inline-block animate-rotate-slow text-[#f5a524]">
              <IkonMatahari />
            </span>
            <span className="flex flex-col text-[0.78rem] leading-tight text-[#4f6358]">
              <span className="font-semibold text-[#1f3a2e]">29°C</span>
              <span className="hidden sm:block">Cerah</span>
            </span>
          </div>

          {/* Pilih meja */}
          <label className="relative flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#d6e6dc] bg-white px-3 py-2 text-[#2f7d62] shadow-sm transition hover:border-[#2f7d62] hover:shadow">
            <IkonLokasi />
            <span className="sr-only">Pilih meja</span>
            <select
              value={meja}
              onChange={(e) => setMeja(e.target.value)}
              className="cursor-pointer appearance-none bg-transparent pr-5 text-sm font-medium text-[#1f3a2e] outline-none"
            >
              {DAFTAR_MEJA.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2.5 text-[#4f6358]">
              <IkonChevron />
            </span>
          </label>

          {/* Keranjang */}
          <Link
            href="/keranjang"
            aria-label="Keranjang"
            className="relative grid h-11 w-11 place-items-center rounded-full text-[#1f6b50] transition hover:scale-110 hover:bg-[#e6f4ec]"
          >
            <IkonKeranjang />
            <span
              key={jumlahKeranjang}
              className="absolute right-0 top-0 grid h-[18px] min-w-[18px] animate-pop place-items-center rounded-full bg-[#1f6b50] px-1 text-[0.68rem] font-bold text-white"
            >
              {jumlahKeranjang}
            </span>
          </Link>
        </div>
      </header>

      <main>
        {/* Hero — foto /public/hero-menu.png */}
        <section className="relative flex min-h-[270px] items-center overflow-hidden px-4 py-10 text-white sm:min-h-[340px] sm:px-6">
          <Image
            src="/hero-menu.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="animate-kenburns object-cover"
          />
          <div
            className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,40,30,0.78)_0%,rgba(15,40,30,0.35)_55%,rgba(15,40,30,0.05)_100%)]"
            aria-hidden="true"
          />
          <div className="relative mx-auto w-full max-w-[1100px]">
            <p
              className="mb-1 inline-block animate-slide-right border-b border-white/80 font-script text-3xl leading-none sm:text-4xl"
              style={{ animationDelay: "150ms" }}
            >
              Welcome to
            </p>
            <h1
              className="mb-3 animate-slide-right text-[clamp(2rem,5vw,3.4rem)] font-bold leading-[1.1] tracking-tight drop-shadow"
              style={{ animationDelay: "300ms" }}
            >
              Treehouse Cafe and Resto
            </h1>
            <p
              className="max-w-[55ch] animate-slide-right leading-relaxed text-white/95 drop-shadow"
              style={{ animationDelay: "450ms" }}
            >
The only tree house cafe in Batam, Back to nature, elevated with elegance, Stunning seaside views & beautiful handcrafted.
            </p>
          </div>
        </section>

        {/* Kartu aksi */}
        <section className="mx-auto grid max-w-[1100px] grid-cols-1 gap-4 p-4 sm:p-6 md:grid-cols-3 md:gap-5">
          <Kartu
            href="/menu"
            tema="hijau"
            ikon={<IkonMenu />}
            judul="Lihat Menu"
            deskripsi="Temukan menu favoritmu dengan rekomendasi terbaik."
            delay={500}
          />
          <Kartu
            href="/review"
            tema="oranye"
            ikon={<IkonBintang />}
            judul="Beri Ulasan / Review"
            deskripsi="Bagikan pengalamanmu di Treehouse."
            delay={650}
          />
          <Kartu
            href="https://www.instagram.com/treehousecafeandresto/"
            tema="pink"
            ikon={<IkonInstagram />}
            judul="Instagram"
            deskripsi="Ikuti kami di Instagram untuk info terbaru."
            eksternal
            delay={800}
          />
        </section>
      </main>
    </div>
  );
}