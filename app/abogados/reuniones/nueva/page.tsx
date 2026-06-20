"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MODALIDADES = ["presencial", "zoom", "telefono"] as const;

function NuevaReuniónForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [clientes, setClientes] = useState<{ id: string; nombre: string }[]>([]);
  const [form, setForm] = useState({
    cliente_id: params.get("cliente") ?? "",
    fecha: "",
    hora: "10:00",
    modalidad: "presencial" as typeof MODALIDADES[number],
    notas: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from("clientes")
        .select("id, nombre")
        .eq("abogado_id", user!.id)
        .order("nombre");
      setClientes(data ?? []);
    })();
  }, []);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cliente_id || !form.fecha) { setError("Selecciona cliente y fecha."); return; }
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("reuniones").insert({
      ...form,
      abogado_id: user!.id,
      estado: "pendiente",
    });

    if (error) { setError("Error al guardar."); setLoading(false); return; }
    router.push("/abogados/reuniones");
  }

  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-bold text-gray-800">Nueva reunion</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Cliente</label>
          <select className={inputCls} value={form.cliente_id} onChange={(e) => set("cliente_id", e.target.value)} required>
            <option value="">Seleccionar...</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Fecha</label>
            <input className={inputCls} type="date" value={form.fecha} onChange={(e) => set("fecha", e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hora</label>
            <input className={inputCls} type="time" value={form.hora} onChange={(e) => set("hora", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Modalidad</label>
          <div className="flex gap-2">
            {MODALIDADES.map((m) => (
              <button key={m} type="button"
                onClick={() => set("modalidad", m)}
                className={`px-4 py-1.5 rounded-lg text-sm border transition-colors ${
                  form.modalidad === m ? "bg-blue-700 text-white border-blue-700" : "border-gray-300 hover:bg-gray-50"
                }`}>
                {m}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notas (opcional)</label>
          <textarea className={`${inputCls} resize-none`} rows={2} value={form.notas} onChange={(e) => set("notas", e.target.value)} />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()}
            className="border border-gray-300 hover:bg-gray-50 px-5 py-2 rounded-lg text-sm">
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="bg-blue-700 hover:bg-blue-800 text-white font-medium px-5 py-2 rounded-lg text-sm disabled:opacity-50">
            {loading ? "Guardando..." : "Agendar reunion"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NuevaReunion() {
  return <Suspense><NuevaReuniónForm /></Suspense>;
}
