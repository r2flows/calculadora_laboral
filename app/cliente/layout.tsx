import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
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

  if (!cliente) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <span className="font-semibold text-gray-800">Mi Portal</span>
            <span className="text-gray-400 text-sm ml-2">· {cliente.nombre}</span>
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
