import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function TodosClientes() {
  const supabase = await createClient();

  const { data: clientes } = await supabase
    .from("clientes")
    .select("id, nombre, rut, telefono, estado, resultado_total, created_at, perfiles(nombre)")
    .order("created_at", { ascending: false });

  const fmt = (v: number) =>
    v?.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

  const ESTADO_COLOR: Record<string, string> = {
    lead: "bg-yellow-100 text-yellow-800",
    activo: "bg-blue-100 text-blue-800",
    en_proceso: "bg-purple-100 text-purple-800",
    cerrado: "bg-green-100 text-green-800",
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-800">Todos los clientes</h1>
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 text-sm">
        {clientes?.map((c) => {
          const abogado = c.perfiles as { nombre: string } | null;
          return (
            <div key={c.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <Link href={`/admin/calculos/${c.id}`} className="font-medium text-gray-800 hover:text-blue-700">
                  {c.nombre}
                </Link>
                <p className="text-xs text-gray-400">
                  {c.rut} · Abogado: {abogado?.nombre ?? "sin asignar"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {c.resultado_total > 0 && (
                  <span className="text-sm font-semibold text-green-700">{fmt(c.resultado_total)}</span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLOR[c.estado] ?? ""}`}>
                  {c.estado}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
