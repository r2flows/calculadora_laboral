"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Los enlaces mágicos de Supabase llegan con el token en el fragmento de la URL
 * (#access_token=...), que el navegador NUNCA envía al servidor. Si el destino fuera
 * directamente una ruta protegida por un Server Component (ej. /cliente), ese componente
 * corre en el servidor ANTES de que el JS del cliente pueda procesar el fragmento —
 * ve "sin sesión" y redirige a /login, aunque el enlace era válido.
 *
 * Esta página intermedia SÍ corre en el cliente: deja que el SDK de Supabase procese
 * el fragmento (o el ?code= de PKCE), establece la sesión (con sus cookies), y recién
 * ahí navega al destino final — para entonces el servidor sí ve la sesión.
 */
function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/cliente";
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabase a veces entrega el error como fragmento (#error=...) en vez de tokens
    // (ej. enlace ya usado o expirado).
    const hash = window.location.hash;
    const hashParams = new URLSearchParams(hash.slice(1));
    if (hashParams.get("error")) {
      setError(
        hashParams.get("error_description")?.replace(/\+/g, " ") ??
          "El enlace no es válido o ya expiró."
      );
      return;
    }

    const supabase = createClient();

    // Los enlaces se generan en el servidor (admin.generateLink / signInWithOtp),
    // que por defecto usan flujo implícito (#access_token=...&refresh_token=...).
    // El cliente del navegador (@supabase/ssr) viene fijo en flowType "pkce", y su
    // detección automática de sesión en la URL rechaza un callback implícito con
    // "Not a valid PKCE flow url." (nunca dispara onAuthStateChange) — por eso acá
    // seteamos la sesión manualmente en vez de depender de esa detección automática.
    const accessToken  = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    if (accessToken && refreshToken) {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error: setErr }) => {
        if (setErr) setError("El enlace no es válido o ya expiró.");
        else router.replace(next);
      });
      return;
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace(next);
    });

    // Si no hay error explícito pero tampoco llega sesión en unos segundos, el enlace
    // probablemente ya se usó o expiró — no dejar a la persona esperando indefinidamente.
    const timeout = setTimeout(() => {
      setError((prev) => prev ?? "El enlace no es válido o ya expiró.");
    }, 6000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router, next]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 gap-4 px-4 text-center">
        <p className="text-red-400 text-sm max-w-sm">{error}</p>
        <a href="/login" className="text-cyan-300 text-sm underline">
          Pedir un enlace nuevo
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <p className="text-slate-400 text-sm">Iniciando sesión...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
          <p className="text-slate-400 text-sm">Cargando...</p>
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
