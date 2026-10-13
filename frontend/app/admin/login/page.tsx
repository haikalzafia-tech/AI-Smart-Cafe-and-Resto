"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API, KUNCI_TOKEN } from "../../lib/api";

export default function LoginAdmin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function masuk(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/admin/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "Gagal masuk.");
      localStorage.setItem(KUNCI_TOKEN, data.token);
      router.push("/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal masuk.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#f6faf7] p-4">
      <form onSubmit={masuk} className="w-full max-w-sm space-y-4 rounded-2xl border border-[#cfe7db] bg-white p-6 shadow">
        <h1 className="text-xl font-bold text-[#1f6b50]">Login Admin Treehouse</h1>
        <input className="w-full rounded-lg border border-[#d6e6dc] px-3 py-2" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <input className="w-full rounded-lg border border-[#d6e6dc] px-3 py-2" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="w-full rounded-lg bg-[#2f7d62] py-2 font-semibold text-white hover:bg-[#256650] disabled:opacity-60">
          {loading ? "Memproses..." : "Masuk"}
        </button>
      </form>
    </div>
  );
}
