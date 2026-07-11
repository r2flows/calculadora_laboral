import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const ESTADO_CONF: Record<string, { label: string; color: string; desc: string }> = {
  lead:       { label: "En revisión",       color: "bg-yellow-100 text-yellow-800 border-yellow-200", desc: "Hemos recibido tu caso. Súbenos los documentos para avanzar." },
  contactado: { label: "Contactado",        color: "bg-blue-100 text-blue-800 border-blue-200",       desc: "Un abogado revisará tu información pronto." },
  en_proceso: { label: "En proceso legal",  color: "bg-purple-100 text-purple-800 border-purple-200", desc: "Tu causa está siendo gestionada por nuestro equipo." },
  cerrado:    { label: "Cerrado",           color: "bg-green-100 text-green-800 border-green-200",    desc: "El proceso de tu causa ha concluido." },
};

const DOCS_REQUERIDOS = [
  { tipo: "liquidacion",    label: "Última liquidación de sueldo",  desc: "El mes anterior al despido", icon: "📄" },
  { tipo: "finiquito",      label: "Finiquito",                      desc: "Documento de término de contrato", icon: "📋" },
  { tipo: "contrato",       label: "Contrato de trabajo",            desc: "El contrato original firmado", icon: "📝" },
  { tipo: "carta_despido",  label: "Carta de despido",               desc: "Si la recibiste del empleador", icon: "✉️" },
];

export default async function ClienteDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: cliente } = await supabase
    .from("clientes")
    .select("id, nombre, estado, resultado_total, created_at")
    .eq("auth_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!cliente) redirect("/login");

  const { data: documentos } = await supabase
    .from("documentos")
    .select("id, tipo, estado")
    .eq("cliente_id", cliente.id);

  const fmt = (v: number) =>
    v?.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

  const estadoConf = ESTADO_CONF[cliente.estado] ?? {
    label: cliente.estado,
    color: "bg-gray-100 text-gray-700 border-gray-200",
    desc: "",
  };

  const tiposSubidos = new Set((documentos ?? []).map((d) => d.tipo));
  const docsCompletos = DOCS_REQUERIDOS.filter((d) => tiposSubidos.has(d.tipo)).length;

  return (
    <div className="space-y-5">

      {/* Bienvenida + estado */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Tu causa</p>
          <h1 className="text-lg font-bold text-gray-800">{cliente.nombre}</h1>
        </div>

        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${estadoConf.color}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
          {estadoConf.label}
        </div>
        {estadoConf.desc && (
          <p className="text-sm text-gray-500">{estadoConf.desc}</p>
        )}

        {cliente.resultado_total > 0 && (
          <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3">
            <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Estimación de tu demanda</p>
            <p className="text-3xl font-extrabold text-green-700 mt-0.5">{fmt(cliente.resultado_total)}</p>
            <p className="text-xs text-green-600 mt-1">
              Calculado con los datos que ingresaste. Se ajustará al validar tus documentos.
            </p>
          </div>
        )}
      </div>

      {/* Checklist de documentos */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-semibold text-gray-800">Documentos requeridos</h2>
            <p className="text-xs text-gray-400 mt-0.5">{docsCompletos} de {DOCS_REQUERIDOS.length} entregados</p>
          </div>
          <Link
            href="/cliente/documentos"
            className="text-xs bg-blue-700 hover:bg-blue-800 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            Subir documentos →
          </Link>
        </div>

        {/* Barra de progreso */}
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all"
            style={{ width: `${(docsCompletos / DOCS_REQUERIDOS.length) * 100}%` }}
          />
        </div>

        <div className="grid grid-cols-1 gap-2">
          {DOCS_REQUERIDOS.map((doc) => {
            const subido = tiposSubidos.has(doc.tipo);
            const docData = (documentos ?? []).find((d) => d.tipo === doc.tipo);
            return (
              <div
                key={doc.tipo}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                  subido ? "border-green-200 bg-green-50" : "border-gray-100 bg-gray-50"
                }`}
              >
                <span className="text-xl flex-shrink-0">{doc.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${subido ? "text-green-800" : "text-gray-700"}`}>
                    {doc.label}
                  </p>
                  <p className="text-xs text-gray-400">{doc.desc}</p>
                </div>
                <div className="flex-shrink-0">
                  {subido ? (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      docData?.estado === "procesado"  ? "bg-green-200 text-green-800" :
                      docData?.estado === "error"      ? "bg-red-100 text-red-700" :
                                                          "bg-yellow-100 text-yellow-700"
                    }`}>
                      {docData?.estado === "procesado" ? "✓ Procesado" :
                       docData?.estado === "error"     ? "Error" : "Pendiente"}
                    </span>
                  ) : (
                    <Link
                      href="/cliente/documentos"
                      className="text-xs text-blue-600 hover:underline font-medium"
                    >
                      Subir
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
