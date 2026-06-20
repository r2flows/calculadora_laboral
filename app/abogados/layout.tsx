import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";

export default async function AbogadosLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("nombre, role")
    .eq("id", user.id)
    .single();

  const role = perfil?.role as "admin" | "abogado";
  const nombre = perfil?.nombre ?? user.email ?? "Usuario";

  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} nombre={nombre} />
      <main className="flex-1 bg-gray-50 p-6 overflow-auto">{children}</main>
    </div>
  );
}
