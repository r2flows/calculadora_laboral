import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const ESTADO_LABELS: Record<string, { label: string; color: string }> = {
  lead:       { label: "Revisión inicial",  color: "bg-yellow-100 text-yellow-800" },
  activo:     { label: "Activo",            color: "bg-blue-100 text-blue-800" },
  en_proceso: { label: "En proceso legal",  color: "bg-purple-100 text-purple-800" },
  cerrado:    { label: "Cerrado",           color: "bg-green-100 text-green-800" },
};

export default async function ClienteDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: cliente } = await supabase
    .from("clientes")
    .select("id, nombre, estado, resultado_total, created_at")
    .eq("auth_user_id", user.id)
    .single();

  if (!cliente) redirect("/login");

  const { data: documentos } = await supabase
    .from("documentos")
    .select("id, tipo, estado, created_at")
    .eq("cliente_id", cliente.id)
    .order("created_at", { ascending: false });

  const fmt = (v: number) =>
    v?.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

  const estadoConf = ESTADO_LABELS[cliente.estado] ?? { label: cliente.estado, color: "bg-gray-100 text-gray-700" };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h1 className="font-bold text-gray-800">Estado de tu causa</h1>
        <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${estadoConf.color}`}>
          {estadoConf.label}
        </span>
        {cliente.resultado_total > 0 && (
          <div className="pt-1">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Estimación de tu demanda</p>
            <p className="text-2xl font-bold text-green-700">{fmt(cliente.resultado_total)}</p>
            <p className="text-xs text-gray-400 mt-0.5">Basado en los datos que ingresaste. Puede ajustarse con tus documentos.</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-gray-700">Mis documentos</h2>
          <Link href="/cliente/documentos" className="text-xs text-blue-600 hover:underline">
            {documentos && documentos.length > 0 ? "Ver todos →" : "Subir documentos →"}
          </Link>
        </div>
        {documentos && documentos.length > 0 ? (
          <div className="space-y-1.5">
            {documentos.slice(0, 4).map((d) => (
              <div key={d.id} className="flex justify-between items-center text-sm">
                <span className="capitalize text-gray-700">{d.tipo}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  d.estado === "procesado"   ? "bg-green-100 text-green-700" :
                  d.estado === "error"       ? "bg-red-100 text-red-600" :
                  d.estado === "procesando"  ? "bg-blue-100 text-blue-700" :
                                               "bg-yellow-100 text-yellow-700"
                }`}>{d.estado}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            Sube tus liquidaciones y finiquito para que podamos analizar tu caso con mayor precisión.
          </p>
        )}
      </div>
    </div>
  );
}
