import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function DetalleCalculo({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: cliente } = await supabase
    .from("clientes")
    .select("nombre, rut, resultado_total, datos_calculo")
    .eq("id", params.id)
    .single();

  if (!cliente) notFound();

  const fmt = (v: number) =>
    v?.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

  const datos = cliente.datos_calculo as Record<string, unknown> | null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800">{cliente.nombre}</h1>
        <p className="text-sm text-gray-400">{cliente.rut}</p>
      </div>

      {cliente.resultado_total > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-xs text-green-600 font-medium">Total que podria demandar</p>
          <p className="text-3xl font-bold text-green-800">{fmt(cliente.resultado_total)}</p>
        </div>
      )}

      {datos && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
          <h2 className="font-semibold text-gray-700 mb-3">Datos del calculo (admin)</h2>
          <div className="divide-y divide-gray-100 text-sm">
            {Object.entries(datos).map(([k, v]) => (
              <div key={k} className="flex justify-between py-1.5">
                <span className="text-gray-500">{k}</span>
                <span className="text-gray-800 font-mono text-xs">
                  {typeof v === "object" ? JSON.stringify(v) : String(v)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
