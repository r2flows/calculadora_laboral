import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import EstadoForm from "@/app/abogados/clientes/[id]/EstadoForm";
import EliminarClienteButton from "@/components/admin/EliminarClienteButton";
import DescargarReportePDF from "@/components/admin/DescargarReportePDF";
import { CAMPO, TIPO_DOC, CAMPO_EXTRAIDO, fmtCLP, fmtFecha, renderValor } from "@/lib/reportes/labels";

// ─── Componente ─────────────────────────────────────────────────────────────

export default async function AuditoriaCliente({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const [{ data: cliente }, { data: documentos }] = await Promise.all([
    supabase
      .from("clientes")
      .select("id, nombre, rut, email, telefono, estado, resultado_total, datos_calculo, created_at, perfiles(nombre)")
      .eq("id", params.id)
      .single(),
    supabase
      .from("documentos")
      .select("id, tipo, nombre_archivo, estado, datos_extraidos, error_mensaje, storage_path, created_at")
      .eq("cliente_id", params.id)
      .order("created_at", { ascending: false }),
  ]);

  if (!cliente) notFound();

  const abogado    = cliente.perfiles as unknown as { nombre: string } | null;
  const datosRaw   = cliente.datos_calculo as Record<string, unknown> | null;
  const resultado  = datosRaw?._resultado as Record<string, unknown> | null;
  const datos      = datosRaw
    ? Object.fromEntries(Object.entries(datosRaw).filter(([k]) => k !== "_resultado"))
    : null;

  return (
    <div className="max-w-2xl space-y-5">

      {/* Encabezado */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/admin/calculos" className="text-xs text-gray-400 hover:text-gray-600 mb-1 block">
            ← Volver a cálculos
          </Link>
          <h1 className="text-xl font-bold text-gray-800">{cliente.nombre}</h1>
          <p className="text-sm text-gray-400">
            Ingresó el {new Date(cliente.created_at).toLocaleDateString("es-CL")}
            {abogado ? ` · Abogado: ${abogado.nombre}` : ""}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <EstadoForm clienteId={cliente.id} estadoActual={cliente.estado} />
          <div className="flex gap-2">
            <DescargarReportePDF
              cliente={{
                nombre: cliente.nombre,
                rut: cliente.rut,
                email: cliente.email,
                telefono: cliente.telefono,
                estado: cliente.estado,
                resultado_total: cliente.resultado_total,
                created_at: cliente.created_at,
              }}
              abogado={abogado}
              datos={datos}
              resultado={resultado}
              documentos={documentos ?? []}
            />
            <EliminarClienteButton
              clienteId={cliente.id}
              nombre={cliente.nombre}
              redirectTo="/admin/calculos"
              variant="boton"
            />
          </div>
        </div>
      </div>

      {/* Contacto */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Contacto</h2>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          {[
            ["RUT",       cliente.rut      || "—"],
            ["Email",     cliente.email    || "—"],
            ["Teléfono",  cliente.telefono || "—"],
          ].map(([k, v]) => (
            <div key={k} className="contents">
              <span className="text-gray-400">{k}</span>
              <span className="font-medium text-gray-800">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Resultado calculado */}
      {cliente.resultado_total > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
          <p className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-1">
            Estimación de la demanda
          </p>
          <p className="text-4xl font-bold text-green-800">{fmtCLP(cliente.resultado_total)}</p>
          <p className="text-xs text-green-600 mt-1">Calculado por el propio usuario en la calculadora</p>
        </div>
      )}

      {/* Desglose del cálculo */}
      {resultado && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Desglose del cálculo
          </h2>
          {(() => {
            const n = (v: unknown) => (typeof v === "number" ? v : 0);
            const pctFmt = (v: unknown) => `${(n(v) * 100).toFixed(2)}%`;
            const cotiz = (resultado.cotizacionesUltimosDias as Record<string, number>) ?? {};
            const alertas = Array.isArray(resultado.alertas) ? (resultado.alertas as string[]) : [];
            const alertasInternas = Array.isArray(resultado.alertasInternas) ? (resultado.alertasInternas as string[]) : [];
            return (
              <div className="space-y-2">
                {alertasInternas.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 space-y-1.5">
                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                      ⚠️ Alertas internas — solo admin/abogado, requieren validación legal
                    </p>
                    {alertasInternas.map((a, i) => <p key={i} className="text-xs text-red-700 leading-relaxed">{a}</p>)}
                    <p className="text-[10px] text-red-400 pt-1">
                      Nunca comunicar estas conclusiones al cliente sin que un abogado confirme la causal y las pruebas declaradas.
                    </p>
                  </div>
                )}
                {alertas.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 space-y-1">
                    <p className="text-xs font-semibold text-amber-700">Alertas (histórico — leads antiguos)</p>
                    {alertas.map((a, i) => <p key={i} className="text-xs text-amber-700">{a}</p>)}
                  </div>
                )}

                <DesgSeccion titulo="Tiempos y remuneración base" />
                <div className="divide-y divide-gray-100 text-sm">
                  <DesgRow label="Tiempo trabajado" value={`${n(resultado.mesesTrabajados)} meses ${n(resultado.diasTrabajados)} días`} />
                  <DesgRow label="· Años de servicio (tope 11)" value={`${n(resultado.anosServicio)} años`} muted />
                  <DesgRow label="Tope gratificación mensual (4,75 × IMM / 12)" value={fmtCLP(resultado.topeGratificacionMensual)} muted />
                  <DesgRow label="Remuneración imponible mensual" value={fmtCLP(resultado.remuneracionImponibleTotal)} />
                  {n(resultado.gratificacionMensual) > 0 && (
                    <DesgRow label="· Gratificación mensual incluida" value={fmtCLP(resultado.gratificacionMensual)} muted />
                  )}
                  <DesgRow label="Valor día (imponible / 30)" value={fmtCLP(resultado.valorDia)} muted />
                  <DesgRow label={`Tasa AFP aplicada`} value={pctFmt(resultado.tasaAfpAplicada)} muted />
                </div>

                {n(resultado.remUltimosDias) > 0 && (<>
                  <DesgSeccion titulo="Remuneración últimos días" />
                  <div className="divide-y divide-gray-100 text-sm">
                    <DesgRow label="Líquido últimos días" value={fmtCLP(resultado.remUltimosDias)} />
                    <DesgRow label="· AFP descontado" value={fmtCLP(cotiz.afp ?? 0)} muted />
                    <DesgRow label="· Salud descontado" value={fmtCLP(cotiz.salud ?? 0)} muted />
                    <DesgRow label="· AFC descontado" value={fmtCLP(cotiz.afc ?? 0)} muted />
                  </div>
                </>)}

                <DesgSeccion titulo="Feriado proporcional" />
                <div className="divide-y divide-gray-100 text-sm">
                  {n(resultado.feriadoProporcionalDiasDescontados) > 0 ? (
                    <DesgRow
                      label={`${n(resultado.feriadoProporcionalDiasCalculados)} días calc. − ${n(resultado.feriadoProporcionalDiasDescontados)} gozados = ${n(resultado.feriadoProporcionalDias)} días`}
                      value={fmtCLP(resultado.feriadoProporcionalMonto)}
                    />
                  ) : (
                    <DesgRow label={`${n(resultado.feriadoProporcionalDias)} días hábiles a pagar`} value={fmtCLP(resultado.feriadoProporcionalMonto)} />
                  )}
                </div>

                <DesgSeccion titulo="Indemnización y causal" />
                <div className="divide-y divide-gray-100 text-sm">
                  {n(resultado.montoPorAnoIndemnizacion) > 0 && (
                    <DesgRow label="Monto por año (tope 90 UF)" value={fmtCLP(resultado.montoPorAnoIndemnizacion)} muted />
                  )}
                  {n(resultado.indemnizacionAnosServicio) > 0 && (
                    <DesgRow label={`Indemnización años de servicio (${n(resultado.anosServicio)} × monto por año)`} value={fmtCLP(resultado.indemnizacionAnosServicio)} />
                  )}
                  {n(resultado.indemnizacionAvisoPrevio) > 0 && (
                    <DesgRow label="Mes de aviso sustitutivo" value={fmtCLP(resultado.indemnizacionAvisoPrevio)} />
                  )}
                  {n(resultado.montoRecargoArt168) > 0 && (
                    <DesgRow label={`Recargo Art. 168 (${n(resultado.recargoArt168Porcentaje)}%)`} value={fmtCLP(resultado.montoRecargoArt168)} />
                  )}
                  {n(resultado.afcEmpleadorPendiente) > 0 && (
                    <DesgRow label="AFC empleador pendiente" value={fmtCLP(resultado.afcEmpleadorPendiente)} />
                  )}
                  {n(resultado.asignacionFamiliar) > 0 && (
                    <DesgRow label="Asignación familiar (no cotizable)" value={fmtCLP(resultado.asignacionFamiliar)} />
                  )}
                </div>

                {n(resultado.montoHorasExtra) > 0 && (<>
                  <DesgSeccion titulo="Horas extra" />
                  <div className="divide-y divide-gray-100 text-sm">
                    <DesgRow label="Valor hora extra" value={fmtCLP(resultado.valorHoraExtra)} muted />
                    <DesgRow label="Monto horas extra" value={fmtCLP(resultado.montoHorasExtra)} />
                  </div>
                </>)}

                <DesgSeccion titulo="Impuesto e ítems finales" />
                <div className="divide-y divide-gray-100 text-sm">
                  {!!resultado.tributaImpuesto && (
                    <DesgRow label={`(-) Impuesto 2ª cat. (base ${fmtCLP(resultado.baseImpuesto)})`} value={`-${fmtCLP(resultado.impuestoRenta)}`} negative />
                  )}
                  {n(resultado.anticipoSueldo) > 0 && (
                    <DesgRow label="(-) Anticipo de sueldo" value={`-${fmtCLP(resultado.anticipoSueldo)}`} negative />
                  )}
                  {n(resultado.otrosDescuentos) > 0 && (
                    <DesgRow label="(-) Otros descuentos" value={`-${fmtCLP(resultado.otrosDescuentos)}`} negative />
                  )}
                  <DesgRow label="Total líquido (sin nulidad)" value={fmtCLP(resultado.totalLiquido)} bold />
                  <DesgRow label={`Nulidad del despido (${n(resultado.diasNulidad)} días)`} value={fmtCLP(resultado.montoNulidad)} />
                  <DesgRow label="TOTAL CON NULIDAD" value={fmtCLP(resultado.totalConNulidad)} bold highlight />
                </div>

                <DesgSeccion titulo="Valores legales vigentes usados en este cálculo" />
                <div className="divide-y divide-gray-100 text-sm">
                  <DesgRow label="IMM vigente" value={fmtCLP(resultado.immVigente)} muted />
                  <DesgRow label="UF vigente" value={fmtCLP(resultado.ufVigente)} muted />
                  <DesgRow label="UTM vigente" value={fmtCLP(resultado.utmVigente)} muted />
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Datos ingresados en la calculadora */}
      {datos && Object.keys(datos).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Datos ingresados en la calculadora
          </h2>
          <div className="divide-y divide-gray-100 text-sm">
            {Object.entries(CAMPO).map(([key, { label, fmt }]) => {
              if (!(key in datos)) return null;
              return (
                <div key={key} className="flex justify-between items-start py-2 gap-4">
                  <span className="text-gray-400 flex-shrink-0">{label}</span>
                  <span className={`font-medium text-right ${
                    fmt === "currency" && Number(datos[key]) > 0 ? "text-gray-800" : "text-gray-600"
                  }`}>
                    {renderValor(datos[key], fmt)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Documentos */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Documentos ({documentos?.length ?? 0})
        </h2>

        {!documentos || documentos.length === 0 ? (
          <p className="text-sm text-gray-400">El cliente aún no ha subido documentos.</p>
        ) : (
          <div className="space-y-4">
            {documentos.map((d) => {
              const extraido = d.datos_extraidos as Record<string, unknown> | null;
              return (
                <div key={d.id} className="border border-gray-100 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{TIPO_DOC[d.tipo] ?? d.tipo}</p>
                      <p className="text-xs text-gray-400">{d.nombre_archivo} · {new Date(d.created_at).toLocaleDateString("es-CL")}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                      d.estado === "procesado"  ? "bg-green-100 text-green-700" :
                      d.estado === "error"      ? "bg-red-100 text-red-600" :
                      d.estado === "procesando" ? "bg-blue-100 text-blue-700" :
                                                  "bg-yellow-100 text-yellow-700"
                    }`}>{d.estado}</span>
                  </div>

                  {d.error_mensaje && (
                    <p className="text-xs text-red-500 bg-red-50 rounded p-2">{d.error_mensaje}</p>
                  )}

                  {extraido && (
                    <div className="divide-y divide-gray-50 text-xs">
                      {Object.entries(CAMPO_EXTRAIDO).map(([key, { label, fmt }]) => {
                        const v = extraido[key];
                        if (v === null || v === undefined) return null;
                        return (
                          <div key={key} className="flex justify-between py-1.5 gap-3">
                            <span className="text-gray-400">{label}</span>
                            <span className="font-medium text-gray-700 text-right">
                              {fmt === "currency" ? fmtCLP(v) :
                               fmt === "date"     ? fmtFecha(v) :
                               String(v)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

function DesgSeccion({ titulo }: { titulo: string }) {
  return (
    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide pt-4 pb-1 first:pt-0">
      {titulo}
    </p>
  );
}

function DesgRow({
  label, value, bold, highlight, negative, muted,
}: {
  label: string; value: string;
  bold?: boolean; highlight?: boolean; negative?: boolean; muted?: boolean;
}) {
  return (
    <div className={`flex justify-between items-center px-3 py-2 ${highlight ? "bg-green-50 rounded-lg" : ""}`}>
      <span className={`text-sm ${bold ? "font-semibold text-gray-800" : muted ? "text-gray-400" : "text-gray-600"}`}>
        {label}
      </span>
      <span className={`text-sm font-medium ${highlight ? "text-green-700 font-bold" : negative ? "text-red-600" : muted ? "text-gray-400" : "text-gray-800"}`}>
        {value}
      </span>
    </div>
  );
}
