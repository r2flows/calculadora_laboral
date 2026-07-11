import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DocumentoUpload from "@/components/DocumentoUpload";

const TIPO_LABELS: Record<string, { label: string; icon: string }> = {
  liquidacion:   { label: "Liquidación de sueldo",    icon: "📄" },
  finiquito:     { label: "Finiquito",                 icon: "📋" },
  contrato:      { label: "Contrato de trabajo",       icon: "📝" },
  carta_despido: { label: "Carta de despido",          icon: "✉️" },
  otro:          { label: "Otro documento",            icon: "📎" },
};

export default async function DocumentosCliente() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: cliente } = await supabase
    .from("clientes")
    .select("id")
    .eq("auth_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!cliente) redirect("/login");

  const { data: documentos } = await supabase
    .from("documentos")
    .select("id, tipo, nombre_archivo, estado, datos_extraidos, error_mensaje, created_at")
    .eq("cliente_id", cliente.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">

      {/* Upload */}
      <div>
        <h1 className="font-bold text-gray-800 text-lg mb-1">Sube tus documentos</h1>
        <p className="text-sm text-gray-500 mb-4">
          Adjunta los documentos de tu caso en PDF. Los analizamos automáticamente para validar tu cálculo.
        </p>
        <DocumentoUpload clienteId={cliente.id} />
      </div>

      {/* Qué necesitamos */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-2">
        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">¿Qué documentos necesitamos?</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: "📄", label: "Última liquidación de sueldo" },
            { icon: "📋", label: "Finiquito firmado" },
            { icon: "📝", label: "Contrato de trabajo" },
            { icon: "✉️", label: "Carta de despido (si la tienes)" },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-xs text-blue-800">
              <span>{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Lista de documentos subidos */}
      {documentos && documentos.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Documentos subidos ({documentos.length})
          </h2>
          {documentos.map((d) => {
            const conf = TIPO_LABELS[d.tipo] ?? { label: d.tipo, icon: "📎" };
            return (
              <div key={d.id} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="text-2xl flex-shrink-0">{conf.icon}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 text-sm">{conf.label}</p>
                      <p className="text-xs text-gray-400 truncate">{d.nombre_archivo}</p>
                      <p className="text-xs text-gray-300 mt-0.5">
                        {new Date(d.created_at).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <span className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${
                    d.estado === "procesado"  ? "bg-green-100 text-green-700" :
                    d.estado === "error"      ? "bg-red-100 text-red-600" :
                    d.estado === "procesando" ? "bg-blue-100 text-blue-700" :
                                                "bg-yellow-100 text-yellow-700"
                  }`}>
                    {d.estado === "procesado"  ? "✓ Procesado" :
                     d.estado === "procesando" ? "Procesando…" :
                     d.estado === "error"      ? "Error" : "Pendiente"}
                  </span>
                </div>

                {d.error_mensaje && (
                  <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{d.error_mensaje}</p>
                )}

                {d.datos_extraidos && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-gray-400 hover:text-gray-600 select-none">
                      Ver datos extraídos por IA
                    </summary>
                    <pre className="mt-2 bg-gray-50 rounded-xl p-3 overflow-auto text-xs text-gray-600 leading-relaxed">
                      {JSON.stringify(d.datos_extraidos, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      )}

      {(!documentos || documentos.length === 0) && (
        <div className="text-center py-8 text-gray-400 text-sm">
          Aún no has subido documentos. Usa el formulario de arriba para comenzar.
        </div>
      )}

    </div>
  );
}
