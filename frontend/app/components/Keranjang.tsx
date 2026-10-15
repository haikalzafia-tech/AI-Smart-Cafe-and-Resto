"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ItemKeranjang = {
  kunci: string; // menuId + varian + catatan, supaya pesanan berbeda tidak tergabung
  menuId: number;
  nama: string;
  varian: string | null;
  harga: number;
  jumlah: number;
  catatan: string;
  foto: string | null;
};

type Konteks = {
  items: ItemKeranjang[];
  jumlah: number;
  total: number;
  tambah: (item: Omit<ItemKeranjang, "kunci">) => void;
  ubahJumlah: (kunci: string, jumlah: number) => void;
  hapus: (kunci: string) => void;
  kosongkan: () => void;
};

const KonteksKeranjang = createContext<Konteks | null>(null);
const KUNCI = "keranjang";

export function useKeranjang() {
  const k = useContext(KonteksKeranjang);
  if (!k) throw new Error("useKeranjang harus dipakai di dalam KeranjangProvider");
  return k;
}

function muat(kodeMeja: string): ItemKeranjang[] {
  try {
    const d = JSON.parse(localStorage.getItem(KUNCI) ?? "null");
    // Keranjang milik meja lain (misal HP dipakai scan meja berbeda) tidak dipakai
    return d && d.kodeMeja === kodeMeja && Array.isArray(d.items) ? d.items : [];
  } catch {
    return [];
  }
}

export function KeranjangProvider({ kodeMeja, children }: { kodeMeja: string; children: ReactNode }) {
  const [items, setItems] = useState<ItemKeranjang[]>(() => muat(kodeMeja));

  useEffect(() => {
    try {
      localStorage.setItem(KUNCI, JSON.stringify({ kodeMeja, items }));
    } catch {}
  }, [items, kodeMeja]);

  const tambah = useCallback((item: Omit<ItemKeranjang, "kunci">) => {
    const kunci = `${item.menuId}|${item.varian ?? ""}|${item.catatan.trim()}`;
    setItems((l) => {
      const ada = l.find((x) => x.kunci === kunci);
      if (ada) return l.map((x) => (x.kunci === kunci ? { ...x, jumlah: x.jumlah + item.jumlah } : x));
      return [...l, { ...item, catatan: item.catatan.trim(), kunci }];
    });
  }, []);

  const ubahJumlah = useCallback((kunci: string, jumlah: number) => {
    setItems((l) =>
      jumlah <= 0 ? l.filter((x) => x.kunci !== kunci) : l.map((x) => (x.kunci === kunci ? { ...x, jumlah } : x))
    );
  }, []);

  const hapus = useCallback((kunci: string) => setItems((l) => l.filter((x) => x.kunci !== kunci)), []);
  const kosongkan = useCallback(() => setItems([]), []);

  const nilai = useMemo(
    () => ({
      items,
      jumlah: items.reduce((s, x) => s + x.jumlah, 0),
      total: items.reduce((s, x) => s + x.harga * x.jumlah, 0),
      tambah,
      ubahJumlah,
      hapus,
      kosongkan,
    }),
    [items, tambah, ubahJumlah, hapus, kosongkan]
  );

  return <KonteksKeranjang.Provider value={nilai}>{children}</KonteksKeranjang.Provider>;
}
