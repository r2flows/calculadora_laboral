"use client";

import { useState } from "react";

interface Props {
  totalConNulidad: number;
  datosCalculo: Record<string, unknown>;
  onClose: () => void;
}

export default function LeadCaptureModal({ totalConNulidad, datosCalculo, onClose }: Props) {
  const [form, setForm] = useState({ nombre: "", rut: "", email: "", telefono: "" });
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const fmt = (v: number) =>
    v.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre || !form.telefono) {
      setError("Nombre y teléfono son obligatorios.");
      return;
    }
    setCargando(true);
    setError("");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, resultado_total: totalConNulidad, datos_calculo: datosCalculo }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      setEnviado(true);
    } catch {
      setError("No pudimos guardar tus datos. Intenta nuevamente.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl">×</button>

        {enviado ? (
          <div className="text-center py-4 space-y-3">
            <div className="text-4xl">✓</div>
            <h2 className="text-lg font-bold text-gray-800">¡Listo! Te contactaremos pronto.</h2>
            <p className="text-sm text-gray-500">Un abogado revisará tu caso y se comunicará contigo en breve.</p>
            <button onClick={onClose} className="mt-4 w-full bg-blue-700 text-white py-2 rounded-xl font-medium hover:bg-blue-800">
              Cerrar
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold text-gray-800 mb-1">¿Quieres que un abogado te contacte?</h2>
            <p className="text-sm text-gray-500 mb-4">
              Podrías tener derecho a <span className="font-semibold text-green-700">{fmt(totalConNulidad)}</span>. Déjanos tus datos y te contactamos.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Nombre completo *"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="text"
                placeholder="RUT (opcional)"
                value={form.rut}
                onChange={(e) => setForm((f) => ({ ...f, rut: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="email"
                placeholder="Correo electrónico (opcional)"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="tel"
                placeholder="Teléfono *"
                value={form.telefono}
                onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />

              {error && <p className="text-xs text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-blue-700 text-white py-3 rounded-xl font-semibold hover:bg-blue-800 disabled:opacity-60 transition-colors"
              >
                {cargando ? "Enviando..." : "Quiero que me contacten"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
