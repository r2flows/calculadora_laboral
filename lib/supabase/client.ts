import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    // Los enlaces mágicos se generan en el servidor (admin.generateLink), que no
    // tiene forma de producir un code_verifier de PKCE — siempre entregan tokens
    // por flujo implícito (#access_token=...). @supabase/ssr (v0.12) hardcodea
    // flowType "pkce" dentro de createBrowserClient sin importar lo que se le pase
    // acá, así que no se puede alinear el flowType. Su detección automática de
    // sesión (detectSessionInUrl) corre en paralelo a nuestro setSession() manual
    // en app/auth/callback, ve el hash implícito, lo rechaza por esperar PKCE
    // ("Not a valid PKCE flow url"), y esa limpieza pisa la cookie que setSession
    // recién había escrito — por eso la sesión "se seteaba" pero no sobrevivía a
    // la siguiente navegación. Desactivarla deja que solo nuestro código maneje
    // la sesión de estos enlaces.
    { auth: { detectSessionInUrl: false } }
  );
}
