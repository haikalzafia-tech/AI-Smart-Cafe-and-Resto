"use client";

import { useEffect } from "react";
import { API } from "../lib/api";

/** Taruh komponen ini di halaman /menu. Mencatat 1 kunjungan per sesi browser.
 *  URL di QR Code: https://domainmu.com/menu?meja=5&src=qr */
export default function CatatKunjungan() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem("kunjungan_tercatat")) return;
      sessionStorage.setItem("kunjungan_tercatat", "1");
    } catch {}
    const p = new URLSearchParams(window.location.search);
    fetch(`${API}/api/kunjungan/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meja: p.get("meja"), sumber: p.get("src") }),
    }).catch(() => {});
  }, []);
  return null;
}
