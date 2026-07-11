import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    // Los enlaces mágicos se generan en el servidor (admin.generateLink), que no
    // tiene forma de producir un code_verifier de PKCE — siempre entregan tokens
    // por flujo implícito (#access_token=...). @supabase/ssr por defecto asume
    // PKCE, lo que hace que su detección automática de sesión rechace esa URL
    // ("Not a valid PKCE flow url") y deje al cliente en un estado inconsistente
    // para la llamada manual a setSession() en app/auth/callback. Forzar implicit
    // acá evita ese conflicto interno.
    { auth: { flowType: "implicit" } }
  );
}
