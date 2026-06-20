"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ESTADOS = ["lead", "activo", "en_proceso", "cerrado"] as const;

export default function NuevoCliente() {
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: "", rut: "", email: "", telefono: "", estado: "lead" as typeof ESTADOS[number],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("clientes").insert({
      ...form,
      abogado_id: user!.id,
    });

    if (error) { setError("Error al guardar. Intenta de nuevo."); setLoading(false); return; }
    router.push("/abogados/clientes");
  }

  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-bold text-gray-800">Nuevo cliente</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Nombre completo</label>
            <input className={inputCls} value={form.nombre} onChange={(e) => set("nombre", e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">RUT</label>
            <input className={inputCls} placeholder="12.345.678-9" value={form.rut} onChange={(e) => set("rut", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telefono</label>
            <input className={inputCls} placeholder="+56 9 1234 5678" value={form.telefono} onChange={(e) => set("telefono", e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input className={inputCls} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Estado inicial</label>
            <select className={inputCls} value={form.estado} onChange={(e) => set("estado", e.target.value)}>
              {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()}
            className="border border-gray-300 hover:bg-gray-50 px-5 py-2 rounded-lg text-sm">
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="bg-blue-700 hover:bg-blue-800 text-white font-medium px-5 py-2 rounded-lg text-sm disabled:opacity-50">
            {loading ? "Guardando..." : "Guardar cliente"}
          </button>
        </div>
      </form>
    </div>
  );
}
