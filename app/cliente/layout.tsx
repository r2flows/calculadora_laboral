import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

export default async function ClienteLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: cliente } = await supabase
    .from("clientes")
    .select("id, nombre")
    .eq("auth_user_id", user.id)
    .single();

  if (!cliente) {
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (perfil?.role === "admin")    redirect("/admin");
    else if (perfil)                 redirect("/abogados");
    else                             redirect("/login");
  }

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
          <LogoutButton />
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
