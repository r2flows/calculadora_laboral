import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DocumentoUpload from "@/components/DocumentoUpload";

const TIPO_LABELS: Record<string, string> = {
  liquidacion: "Liquidación de sueldo",
  finiquito:   "Finiquito",
  contrato:    "Contrato de trabajo",
  otro:        "Otro documento",
};

export default async function DocumentosCliente() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: cliente } = await supabase
    .from("clientes")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!cliente) redirect("/login");

  const { data: documentos } = await supabase
    .from("documentos")
    .select("id, tipo, nombre_archivo, estado, datos_extraidos, error_mensaje, created_at")
    .eq("cliente_id", cliente.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-5">
      <h1 className="font-bold text-gray-800 text-lg">Mis documentos</h1>

      <DocumentoUpload clienteId={cliente.id} />

      {documentos && documentos.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Documentos subidos</h2>
          {documentos.map((d) => (
            <div key={d.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{TIPO_LABELS[d.tipo] ?? d.tipo}</p>
                  <p className="text-xs text-gray-400">{d.nombre_archivo}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  d.estado === "procesado"  ? "bg-green-100 text-green-700" :
                  d.estado === "error"      ? "bg-red-100 text-red-600" :
                  d.estado === "procesando" ? "bg-blue-100 text-blue-700" :
                                              "bg-yellow-100 text-yellow-700"
                }`}>{d.estado}</span>
              </div>
              {d.error_mensaje && (
                <p className="text-xs text-red-500">{d.error_mensaje}</p>
              )}
              {d.datos_extraidos && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-500 hover:text-gray-700">Ver datos extraídos</summary>
                  <pre className="mt-2 bg-gray-50 rounded-lg p-3 overflow-auto text-xs text-gray-600 leading-relaxed">
                    {JSON.stringify(d.datos_extraidos, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
