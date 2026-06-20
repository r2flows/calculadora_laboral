import { createClient } from "@/lib/supabase/server";

export default async function DashboardAbogado() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: counts } = await supabase
    .from("clientes")
    .select("estado")
    .eq("abogado_id", user!.id);

  const resumen = {
    lead: 0, activo: 0, en_proceso: 0, cerrado: 0,
  };
  for (const c of counts ?? []) {
    resumen[c.estado as keyof typeof resumen]++;
  }

  const stat = (label: string, value: number, color: string) => (
    <div className={`bg-white rounded-xl border p-5 space-y-1 border-l-4 ${color}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-800">Mi dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stat("Leads nuevos", resumen.lead, "border-yellow-400")}
        {stat("Activos", resumen.activo, "border-blue-400")}
        {stat("En proceso", resumen.en_proceso, "border-purple-400")}
        {stat("Cerrados", resumen.cerrado, "border-green-400")}
      </div>
    </div>
  );
}
