import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("nombre, role")
    .eq("id", user.id)
    .single();

  if (perfil?.role !== "admin") redirect("/abogados");

  return (
    <div className="flex min-h-screen">
      <Sidebar role="admin" nombre={perfil?.nombre ?? user.email ?? "Admin"} />
      <main className="flex-1 bg-gray-50 p-6 overflow-auto">{children}</main>
    </div>
  );
}
