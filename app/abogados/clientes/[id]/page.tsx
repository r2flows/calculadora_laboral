import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import NotaForm from "./NotaForm";
import EstadoForm from "./EstadoForm";

export default async function DetalleCliente({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: cliente } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!cliente) notFound();

  const { data: notas } = await supabase
    .from("notas_caso")
    .select("id, contenido, created_at")
    .eq("cliente_id", params.id)
    .order("created_at", { ascending: false });

  const { data: reuniones } = await supabase
    .from("reuniones")
    .select("id, fecha, hora, modalidad, estado, notas")
    .eq("cliente_id", params.id)
    .order("fecha", { ascending: true });

  const { data: documentos } = await supabase
    .from("documentos")
    .select("id, tipo, nombre_archivo, estado, datos_extraidos, error_mensaje, created_at")
    .eq("cliente_id", params.id)
    .order("created_at", { ascending: false });

  const fmt = (v: number) =>
    v?.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{cliente.nombre}</h1>
          <p className="text-sm text-gray-400">{cliente.rut} · {cliente.email} · {cliente.telefono}</p>
        </div>
        {cliente.resultado_total > 0 && (
          <div className="text-right">
            <p className="text-xs text-gray-400">Podria demandar por</p>
            <p className="text-xl font-bold text-green-700">{fmt(cliente.resultado_total)}</p>
          </div>
        )}
      </div>

      <EstadoForm clienteId={cliente.id} estadoActual={cliente.estado} />

      {/* Reuniones */}
      <section className="space-y-2">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-gray-700">Reuniones</h2>
          <a href={`/abogados/reuniones/nueva?cliente=${cliente.id}`}
            className="text-xs text-blue-600 hover:underline">+ Agendar</a>
        </div>
        {reuniones && reuniones.length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 text-sm">
            {reuniones.map((r) => (
              <div key={r.id} className="px-4 py-2 flex justify-between">
                <span>{r.fecha} {r.hora} — {r.modalidad}</span>
                <span className="text-gray-400">{r.estado}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Sin reuniones agendadas.</p>
        )}
      </section>

      {/* Documentos del cliente */}
      <section className="space-y-2">
        <h2 className="font-semibold text-gray-700">Documentos del cliente</h2>
        {documentos && documentos.length > 0 ? (
          <div className="space-y-2">
            {documentos.map((d) => (
              <div key={d.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-2 text-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium capitalize text-gray-800">{d.tipo}</span>
                    <span className="text-gray-400 ml-2 text-xs">{d.nombre_archivo}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
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
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800">Ver datos extraídos por IA</summary>
                    <pre className="mt-2 bg-gray-50 rounded-lg p-3 overflow-auto text-xs text-gray-600 leading-relaxed">
                      {JSON.stringify(d.datos_extraidos, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">El cliente aún no ha subido documentos.</p>
        )}
      </section>

      {/* Notas */}
      <section className="space-y-2">
        <h2 className="font-semibold text-gray-700">Notas del caso</h2>
        <NotaForm clienteId={cliente.id} />
        {notas && notas.length > 0 && (
          <div className="space-y-2 mt-3">
            {notas.map((n) => (
              <div key={n.id} className="bg-white rounded-lg border border-gray-200 px-4 py-3 text-sm">
                <p className="text-gray-700 whitespace-pre-wrap">{n.contenido}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(n.created_at).toLocaleDateString("es-CL")}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
