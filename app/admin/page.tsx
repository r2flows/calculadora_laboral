import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const ESTADO_COLOR: Record<string, string> = {
  lead:       "bg-yellow-100 text-yellow-800",
  activo:     "bg-blue-100 text-blue-800",
  en_proceso: "bg-purple-100 text-purple-800",
  cerrado:    "bg-green-100 text-green-800",
};

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: totalClientes },
    { count: totalLeads },
    { count: totalActivos },
    { count: totalAbogados },
    { data: leadsRecientes },
  ] = await Promise.all([
    supabase.from("clientes").select("*", { count: "exact", head: true }),
    supabase.from("clientes").select("*", { count: "exact", head: true }).eq("estado", "lead"),
    supabase.from("clientes").select("*", { count: "exact", head: true }).eq("estado", "activo"),
    supabase.from("perfiles").select("*", { count: "exact", head: true }).eq("role", "abogado"),
    supabase
      .from("clientes")
      .select("id, nombre, email, telefono, resultado_total, created_at, estado")
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  const fmt = (v: number) =>
    v?.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

  const fmtFecha = (iso: string) =>
    new Date(iso).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-800">Panel de administración</h1>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total clientes",    value: totalClientes,  color: "border-l-blue-400" },
          { label: "Leads nuevos",      value: totalLeads,     color: "border-l-yellow-400" },
          { label: "Causas activas",    value: totalActivos,   color: "border-l-purple-400" },
          { label: "Abogados activos",  value: totalAbogados,  color: "border-l-green-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`bg-white rounded-xl border border-gray-200 border-l-4 ${color} p-4`}>
            <p className="text-2xl font-bold text-gray-800">{value ?? 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Feed de actividad reciente */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-gray-700">Actividad reciente</h2>
          <Link href="/admin/clientes" className="text-xs text-blue-600 hover:underline">
            Ver todos →
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 text-sm">
          {leadsRecientes?.length === 0 && (
            <p className="px-4 py-4 text-gray-400 text-sm">Sin actividad aún.</p>
          )}
          {leadsRecientes?.map((c) => (
            <Link
              key={c.id}
              href={`/admin/calculos/${c.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="min-w-0">
                <p className="font-medium text-gray-800 truncate">{c.nombre}</p>
                <p className="text-xs text-gray-400">
                  {c.email ?? "sin email"} · {c.telefono} · {fmtFecha(c.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                {c.resultado_total > 0 && (
                  <span className="text-sm font-semibold text-green-700 hidden sm:block">
                    {fmt(c.resultado_total)}
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLOR[c.estado] ?? "bg-gray-100 text-gray-600"}`}>
                  {c.estado}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
