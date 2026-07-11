import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import SessionCountdown from "@/components/SessionCountdown";

export default async function ClienteLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Una misma persona puede haber generado varias estimaciones (varias filas en
  // clientes con el mismo auth_user_id) — tomamos la más reciente como la del
  // portal en vez de .single(), que fallaría con más de una fila.
  const { data: cliente } = await supabase
    .from("clientes")
    .select("id, nombre")
    .eq("auth_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // El portal de clientes es un módulo totalmente separado del de administración:
  // se accede solo por enlace mágico y solo sirve a cuentas con fila en `clientes`.
  // Nunca debe reenviar a /admin ni /abogados, aunque la cuenta autenticada también
  // tenga un perfil de staff — esos módulos se acceden exclusivamente por su propio
  // login con contraseña (/admin/login).
  if (!cliente) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div>
              <span className="font-semibold text-gray-800 text-sm">Mi Portal</span>
              <span className="text-gray-400 text-xs ml-1.5">· {cliente.nombre}</span>
            </div>
            <nav className="flex gap-1">
              <Link
                href="/cliente"
                className="text-xs px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
              >
                Resumen
              </Link>
              <Link
                href="/cliente/documentos"
                className="text-xs px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
              >
                Documentos
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <SessionCountdown />
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
