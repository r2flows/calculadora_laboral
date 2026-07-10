"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function formatearRestante(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Contador en vivo del tiempo restante de la sesión (expiración del token de Supabase).
 * Se re-sincroniza solo cuando Supabase refresca el token en segundo plano
 * (onAuthStateChange), así que normalmente nunca llega a 0 mientras la pestaña sigue
 * activa — pero si el refresh falla o la sesión realmente expira, avisa y ofrece volver
 * a entrar en vez de dejar al usuario con acciones que fallan en silencio.
 */
export default function SessionCountdown() {
  const router = useRouter();
  const [expiraEn, setExpiraEn] = useState<number | null>(null);
  const [ahora, setAhora] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      setExpiraEn(data.session?.expires_at ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setExpiraEn(session?.expires_at ?? null);
    });

    const interval = setInterval(() => setAhora(Math.floor(Date.now() / 1000)), 1000);

    return () => {
      sub.subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  if (expiraEn === null) return null;

  const restante = expiraEn - ahora;

  if (restante <= 0) {
    return (
      <span className="text-xs font-medium text-red-600">
        Sesión expirada —{" "}
        <button onClick={() => router.push("/login")} className="underline">
          volver a entrar
        </button>
      </span>
    );
  }

  const critico = restante <= 120;

  return (
    <span
      className={`text-xs font-medium tabular-nums px-2 py-1 rounded-lg border ${
        critico ? "text-red-600 bg-red-50 border-red-200" : "text-gray-500 bg-gray-50 border-gray-200"
      }`}
      title="Tiempo restante antes de que tu sesión expire"
    >
      Sesión: {formatearRestante(restante)}
    </span>
  );
}
