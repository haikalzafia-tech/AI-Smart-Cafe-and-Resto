"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ambilSesi, type SesiMeja } from "../lib/sesiMeja";
import { KeranjangProvider } from "./Keranjang";
import ChatBox from "./ChatBox";

const KonteksMeja = createContext<SesiMeja | null>(null);
export const useMeja = () => useContext(KonteksMeja);

const HALAMAN_BEBAS = ["/admin", "/scan"];

export default function WajibScan({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const bebas = HALAMAN_BEBAS.some((p) => pathname.startsWith(p));
  const [sesi, setSesi] = useState<SesiMeja | null>(null);
  const [siap, setSiap] = useState(false);

  useEffect(() => {
    setSesi(ambilSesi());
    setSiap(true);
  }, [pathname]);

  if (bebas) return <>{children}</>;
  if (!siap) return <div className="min-h-screen bg-[#f6faf7]" />;
  if (!sesi) return <LayarScan />;
  return (
    <KonteksMeja.Provider value={sesi}>
      <KeranjangProvider key={sesi.kode} kodeMeja={sesi.kode}>
        {children}
        {pathname !== "/keranjang" && <ChatBox sesi={sesi} />}
      </KeranjangProvider>
    </KonteksMeja.Provider>
  );
}

function LayarScan() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#f6faf7] p-6 text-center">
      <div className="max-w-sm rounded-2xl border border-[#cfe7db] bg-white p-8 shadow-sm">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-[#e6f4ec] text-[#2f7d62]">
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10" />
          </svg>
        </div>
        <h1 className="mb-2 text-xl font-bold text-[#1f6b50]">Scan QR Code di Meja</h1>
        <p className="text-sm leading-relaxed text-[#4f6358]">
          Untuk mengakses menu Treehouse, silakan scan QR code yang ada di meja Anda menggunakan kamera HP.
        </p>
      </div>
    </div>
  );
}
