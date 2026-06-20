import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [{ count: totalClientes }, { count: totalAbogados }, { data: leads }] =
    await Promise.all([
      supabase.from("clientes").select("*", { count: "exact", head: true }),
      supabase.from("perfiles").select("*", { count: "exact", head: true }).eq("role", "abogado"),
      supabase.from("clientes").select("id").eq("estado", "lead"),
    ]);

  const stat = (label: string, value: number | null, color: string) => (
    <div className={`bg-white rounded-xl border p-5 border-l-4 ${color}`}>
      <p className="text-2xl font-bold">{value ?? 0}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-800">Panel de administracion</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stat("Total clientes", totalClientes, "border-blue-400")}
        {stat("Leads sin asignar", leads?.length ?? 0, "border-yellow-400")}
        {stat("Abogados activos", totalAbogados, "border-green-400")}
      </div>
    </div>
  );
}
