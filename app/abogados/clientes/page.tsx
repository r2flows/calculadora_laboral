import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const ESTADO_COLOR: Record<string, string> = {
  lead: "bg-yellow-100 text-yellow-800",
  activo: "bg-blue-100 text-blue-800",
  en_proceso: "bg-purple-100 text-purple-800",
  cerrado: "bg-green-100 text-green-800",
};

export default async function ClientesAbogado() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: clientes } = await supabase
    .from("clientes")
    .select("id, nombre, rut, telefono, email, estado, resultado_total, created_at")
    .eq("abogado_id", user!.id)
    .order("created_at", { ascending: false });

  const fmt = (v: number) =>
    v?.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Mis clientes</h1>
        <Link
          href="/abogados/clientes/nuevo"
          className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          + Nuevo cliente
        </Link>
      </div>

      {(!clientes || clientes.length === 0) ? (
        <p className="text-gray-500 text-sm">No tienes clientes asignados aun.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {clientes.map((c) => (
            <Link
              key={c.id}
              href={`/abogados/clientes/${c.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div>
                <p className="font-medium text-gray-800">{c.nombre}</p>
                <p className="text-xs text-gray-400">{c.rut} · {c.telefono}</p>
              </div>
              <div className="flex items-center gap-3">
                {c.resultado_total > 0 && (
                  <span className="text-sm font-semibold text-green-700">{fmt(c.resultado_total)}</span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLOR[c.estado] ?? ""}`}>
                  {c.estado}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
