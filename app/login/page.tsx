"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";


export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError("Credenciales incorrectas. Verifica tu email y contraseña.");
      setLoading(false);
      return;
    }

    // Detectar rol para redirigir al área correcta
    const userId = data.user?.id;
    if (userId) {
      const { data: perfil } = await supabase
        .from("perfiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (perfil?.role === "admin") {
        router.push("/admin");
      } else if (perfil) {
        router.push("/abogados");
      } else {
        router.push("/cliente");
      }
    } else {
      router.push("/cliente");
    }

    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4"
      style={{
        backgroundImage: [
          "linear-gradient(rgba(148,163,184,.06) 1px, transparent 1px)",
          "linear-gradient(90deg, rgba(148,163,184,.06) 1px, transparent 1px)",
        ].join(","),
        backgroundSize: "52px 52px",
      }}
    >
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-700/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 group">
            <span className="text-sm text-slate-400 font-normal">empowered by</span>
            <span className="text-sm text-white font-semibold tracking-tight group-hover:text-cyan-300 transition-colors">AgentLoop</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-5 backdrop-blur-sm">
          <div>
            <h1 className="text-xl font-bold text-white">Iniciar sesión</h1>
            <p className="text-sm text-slate-400 mt-1">Accede a tu cuenta para gestionar tu causa</p>
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
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <p className="text-xs text-slate-500 text-center">
            ¿Recibiste una invitación por correo?{" "}
            <span className="text-slate-400">Usa el enlace del email para crear tu contraseña.</span>
          </p>
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
