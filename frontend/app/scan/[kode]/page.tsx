"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { API } from "../../lib/api";
import { simpanSesi } from "../../lib/sesiMeja";

export default function HalamanScan() {
  const { kode } = useParams<{ kode: string }>();
  const router = useRouter();
  const [error, setError] = useState("");
  const sudahJalan = useRef(false);

  useEffect(() => {
    if (sudahJalan.current) return; // cegah kunjungan tercatat dobel
    sudahJalan.current = true;

    fetch(`${API}/api/meja/scan/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kode }),
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.detail ?? "QR code tidak valid.");
        simpanSesi(d.nomor, d.kode);
        router.replace("/");
      })
      .catch((e: Error) =>
        setError(e.message === "Failed to fetch" ? "Tidak bisa terhubung ke server." : e.message)
      );
  }, [kode, router]);

  return (
    <div className="grid min-h-screen place-items-center bg-[#f6faf7] p-6 text-center">
      <div className="max-w-sm rounded-2xl border border-[#cfe7db] bg-white p-8 shadow-sm">
        {error ? (
          <>
            <h1 className="mb-2 text-xl font-bold text-red-600">QR Code Tidak Valid</h1>
            <p className="text-sm text-[#4f6358]">{error}</p>
            <p className="mt-2 text-sm text-[#4f6358]">Silakan scan ulang QR di meja atau hubungi pelayan.</p>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#cfe7db] border-t-[#2f7d62]" />
            <p className="text-sm text-[#4f6358]">Memeriksa meja Anda...</p>
          </>
        )}
      </div>
    </div>
  );
}