"use client";

import Link from "next/link";
import { useMeja } from "../components/WajibScan";
import { useKeranjang } from "../components/Keranjang";
import { rupiah } from "../lib/menu";
import { judul, teks } from "../lib/fonts";

export default function HalamanKeranjang() {
  const sesi = useMeja();
  const { items, jumlah, total, ubahJumlah, hapus, kosongkan } = useKeranjang();

  return (
    <div className={`${teks.className} min-h-screen bg-[#E2D4B2] text-[#3B2618]`}>
      <header className="sticky top-0 z-30 bg-[#3B2618] text-[#F3EBD8] shadow-[0_6px_18px_-8px_rgba(0,0,0,.6)]">
        <div className="mx-auto flex max-w-[720px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/menu" className="rounded-full px-3 py-1.5 text-sm text-[#E2D4B2] hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#E2D4B2]">
            Kembali ke menu
          </Link>
          <h1 className={`${judul.className} text-xl font-extrabold tracking-tight`}>Keranjang</h1>
          <span className="rounded-full border border-[#E2D4B2]/40 px-3 py-1.5 text-sm">Meja {sesi?.nomor}</span>
        </div>
      </header>

      <main className="mx-auto max-w-[720px] px-4 pb-40 pt-6 sm:px-6">
        {items.length === 0 ? (
          <div className="mt-10 rounded-[24px] border border-[#CDBB94] bg-[#FBF6EA] p-8 text-center shadow-[0_6px_0_#C2AC7F]">
            <p className={`${judul.className} text-2xl font-extrabold text-[#5B3A26]`}>Keranjangmu masih kosong</p>
            <p className="mt-2 text-sm text-[#6B4A33]">Pilih menu dulu, lalu tekan tombol + untuk menambahkannya ke sini.</p>
            <Link
              href="/menu"
              className="mt-5 inline-block rounded-full bg-[#2F7D62] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_0_#1E5642] active:translate-y-1 active:shadow-none"
            >
              Lihat menu
            </Link>
          </div>
        ) : (
          <>
            <ul className="space-y-4">
              {items.map((x) => (
                <li key={x.kunci} className="flex gap-3 rounded-[20px] border border-[#CDBB94] bg-[#FBF6EA] p-3 shadow-[0_5px_0_#C2AC7F]">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[14px] bg-[#5B3A26]">
                    {x.foto && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={x.foto} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`${judul.className} font-semibold leading-snug`}>{x.nama}</p>
                        {x.varian && <p className="text-xs text-[#6B4A33]">{x.varian}</p>}
                        {x.catatan && <p className="mt-0.5 text-xs italic text-[#6B4A33]">Catatan: {x.catatan}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => hapus(x.kunci)}
                        aria-label={`Hapus ${x.nama}`}
                        className="shrink-0 rounded-full px-2 py-1 text-xs text-[#8A4B17] hover:bg-[#F6DEC6]"
                      >
                        Hapus
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-full border border-[#E2D4B2] bg-white">
                        <button type="button" onClick={() => ubahJumlah(x.kunci, x.jumlah - 1)} aria-label={`Kurangi ${x.nama}`} className="h-9 w-9 text-lg text-[#5B3A26]">−</button>
                        <span className="w-6 text-center text-sm font-semibold">{x.jumlah}</span>
                        <button type="button" onClick={() => ubahJumlah(x.kunci, Math.min(50, x.jumlah + 1))} aria-label={`Tambah ${x.nama}`} className="h-9 w-9 text-lg text-[#5B3A26]">+</button>
                      </div>
                      <span className="font-bold text-[#7A5236]">{rupiah(x.harga * x.jumlah)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => {
                if (confirm("Hapus semua isi keranjang?")) kosongkan();
              }}
              className="mt-5 text-sm text-[#8A4B17] underline-offset-2 hover:underline"
            >
              Kosongkan keranjang
            </button>
          </>
        )}
      </main>

      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#CDBB94] bg-[#FBF6EA] px-4 pb-5 pt-4">
          <div className="mx-auto max-w-[720px]">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-[#6B4A33]">Total ({jumlah} item)</span>
              <span className={`${judul.className} text-2xl font-extrabold`}>{rupiah(total)}</span>
            </div>
            <p className="mt-1 text-xs text-[#6B4A33]">Belum termasuk pajak dan service.</p>
          </div>
        </div>
      )}
    </div>
  );
}
