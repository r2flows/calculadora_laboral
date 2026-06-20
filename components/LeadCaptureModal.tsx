"use client";

import { useState } from "react";

interface Props {
  totalConNulidad: number;
  datosCalculo: Record<string, unknown>;
  onClose: () => void;
}

export default function LeadCaptureModal({ totalConNulidad, datosCalculo, onClose }: Props) {
  const [form, setForm]         = useState({ nombre: "", email: "", telefono: "" });
  const [step, setStep]         = useState<"form" | "success">("form");
  const [portalCreado, setPortalCreado] = useState(false);
  const [error, setError]       = useState("");
  const [cargando, setCargando] = useState(false);

  const fmt = (v: number) =>
    v.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre || !form.email || !form.telefono) {
      setError("Todos los campos son obligatorios.");
      return;
    }
    setCargando(true);
    setError("");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre,
          email: form.email,
          telefono: form.telefono,
          resultado_total: totalConNulidad,
          datos_calculo: datosCalculo,
        }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      const data = await res.json();
      setPortalCreado(data.portalCreado ?? false);
      setStep("success");
    } catch {
      setError("No pudimos crear tu cuenta. Intenta nuevamente.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-0 sm:px-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm">

        {step === "success" ? (
          /* ── Éxito ─────────────────────────────────────────────────────── */
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto text-2xl">
              ✓
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">¡Cuenta creada!</h2>
              {portalCreado ? (
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  Te enviamos un email a <strong>{form.email}</strong> con un enlace para activar tu contraseña.
                  <br /><br />
                  Una vez que lo actives podrás subir tu liquidación y finiquito, y ver el desglose exacto de tu caso.
                </p>
              ) : (
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  Tus datos quedaron registrados. Un abogado se contactará contigo pronto para guiarte en el proceso.
                </p>
              )}
            </div>
            {portalCreado && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 text-left space-y-1">
                <p className="font-semibold">Próximos pasos:</p>
                <p>1. Revisa tu bandeja de entrada (y la carpeta de spam)</p>
                <p>2. Haz click en el enlace de activación</p>
                <p>3. Crea tu contraseña y accede a tu portal</p>
              </div>
            )}
            <button
              onClick={onClose}
              className="w-full bg-blue-700 text-white py-2.5 rounded-xl font-medium hover:bg-blue-800 transition-colors text-sm"
            >
              Entendido
            </button>
          </div>
        ) : (
          /* ── Formulario ─────────────────────────────────────────────────── */
          <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-base font-bold text-gray-800">Crea tu cuenta gratuita</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Sube tus documentos y valida el resultado
                </p>
              </div>
              <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none mt-0.5">×</button>
            </div>

            {/* Monto */}
            <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-center">
              <p className="text-xs text-green-600 font-medium">Tu estimación actual</p>
              <p className="text-2xl font-bold text-green-800">{fmt(totalConNulidad)}</p>
            </div>

            {/* Beneficios */}
            <div className="space-y-1.5">
              {[
                "Acceso a tu portal personal",
                "Sube liquidación y finiquito en PDF",
                "Verificación de datos con IA",
              ].map((b) => (
                <div key={b} className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="w-4 h-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold">✓</span>
                  {b}
                </div>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Nombre completo *"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="email"
                placeholder="Correo electrónico *"
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
                className="w-full bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-800 disabled:opacity-60 transition-colors"
              >
                {cargando ? "Creando cuenta..." : "Crear cuenta y recibir enlace →"}
              </button>
              <p className="text-center text-xs text-gray-400">
                Sin costo · Recibirás un email para activar tu acceso
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
