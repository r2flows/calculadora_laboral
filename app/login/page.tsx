"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Modo = "password" | "magic";

export default function LoginPage() {
  const router  = useRouter();
  const [modo, setModo]         = useState<Modo>("magic");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [enviado, setEnviado]   = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();

    if (modo === "magic") {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${siteUrl}/cliente` },
      });
      setLoading(false);
      if (otpError) {
        setError("No pudimos enviar el enlace. Verifica tu correo.");
      } else {
        setEnviado(true);
      }
      return;
    }

    // Modo contraseña (admins / abogados)
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError("Credenciales incorrectas. Verifica tu email y contraseña.");
      setLoading(false);
      return;
    }

    const userId = data.user?.id;
    if (userId) {
      const { data: perfil } = await supabase
        .from("perfiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (perfil?.role === "admin") router.push("/admin");
      else if (perfil)              router.push("/abogados");
      else                          router.push("/cliente");
    } else {
      router.push("/cliente");
    }
    router.refresh();
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
                <p className="text-sm text-slate-400 mt-1">Portal para clientes y equipo profesional</p>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 bg-white/5 rounded-xl p-1">
                <button
                  onClick={() => { setModo("magic"); setError(""); }}
                  className={`flex-1 text-xs py-2 rounded-lg font-medium transition-colors ${
                    modo === "magic"
                      ? "bg-blue-600 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Enlace por email
                </button>
                <button
                  onClick={() => { setModo("password"); setError(""); }}
                  className={`flex-1 text-xs py-2 rounded-lg font-medium transition-colors ${
                    modo === "password"
                      ? "bg-blue-600 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Con contraseña
                </button>
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

                {modo === "password" && (
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                )}

                {modo === "magic" && (
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Te enviaremos un enlace directo a tu correo. Sin contraseña, sin complicaciones.
                  </p>
                )}

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
                  {loading
                    ? "Procesando..."
                    : modo === "magic"
                    ? "Enviar enlace de acceso →"
                    : "Ingresar"}
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
