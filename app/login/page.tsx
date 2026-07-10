"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [enviado, setEnviado]   = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("No pudimos enviar el enlace. Verifica tu correo e intenta de nuevo.");
    } else {
      setEnviado(true);
    }
  }

  return (
    <div
      className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4"
      style={{
        backgroundImage: [
          "linear-gradient(rgba(148,163,184,.06) 1px, transparent 1px)",
          "linear-gradient(90deg, rgba(148,163,184,.06) 1px, transparent 1px)",
        ].join(","),
        backgroundSize: "52px 52px",
      }}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-700/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 group">
            <span className="text-sm text-slate-400 font-normal">empowered by</span>
            <span className="text-sm text-white font-semibold tracking-tight group-hover:text-cyan-300 transition-colors">
              AgentLoop
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-5 backdrop-blur-sm">
          {enviado ? (
            /* ── Éxito magic link ── */
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 bg-green-500/15 rounded-full flex items-center justify-center mx-auto text-3xl">
                ✉️
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Revisa tu correo</h2>
                <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                  Enviamos un enlace de acceso a <span className="text-white font-medium">{email}</span>.
                  Haz click en él para entrar a tu portal.
                </p>
              </div>
              <p className="text-xs text-slate-500">¿No llegó? Revisa la carpeta de spam.</p>
              <button
                onClick={() => { setEnviado(false); setEmail(""); }}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Intentar con otro correo
              </button>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-xl font-bold text-white">Acceder a mi cuenta</h1>
                <p className="text-sm text-slate-400 mt-1">Portal de clientes</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="tu@email.com"
                  />
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Te enviaremos un enlace directo a tu correo. Sin contraseña, sin complicaciones.
                </p>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-blue-900/30"
                >
                  {loading ? "Procesando..." : "Enviar enlace de acceso →"}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
            ← Volver a la calculadora
          </Link>
        </div>
      </div>
    </div>
  );
}
