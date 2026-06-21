import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import EstadoForm from "@/app/abogados/clientes/[id]/EstadoForm";

// ─── Mapas de traducción ────────────────────────────────────────────────────

const CAUSAL: Record<string, string> = {
  art159_1:   "Art. 159 N°1 — Mutuo acuerdo",
  art159_2:   "Art. 159 N°2 — Vencimiento de plazo",
  art159_3:   "Art. 159 N°3 — Conclusión del trabajo",
  art159_4:   "Art. 159 N°4 — Caso fortuito",
  art159_5:   "Art. 159 N°5 — Renuncia voluntaria",
  art159_6:   "Art. 159 N°6 — Muerte del trabajador",
  art160:     "Art. 160 — Causal grave (sin indemnización)",
  art161:     "Art. 161 — Necesidades de la empresa",
  art161a:    "Art. 161a — Desahucio",
  autodespido:"Autodespido / Despido indirecto",
};

const CAMPO: Record<string, { label: string; fmt: "currency" | "date" | "bool" | "causal" | "dias" | "text" }> = {
  fechaInicio:           { label: "Fecha inicio contrato",       fmt: "date" },
  fechaTermino:          { label: "Fecha término",               fmt: "date" },
  causal:                { label: "Causal de término",           fmt: "causal" },
  sueldoBase:            { label: "Sueldo base",                 fmt: "currency" },
  movilizacion:          { label: "Movilización mensual",        fmt: "currency" },
  colacion:              { label: "Colación mensual",            fmt: "currency" },
  afp:                   { label: "AFP",                         fmt: "text" },
  tipoSalud:             { label: "Previsión de salud",          fmt: "text" },
  montoIsapre:           { label: "Monto Isapre mensual",        fmt: "currency" },
  recibeGratificacion:   { label: "Recibe gratificación",        fmt: "bool" },
  diasVacacionesAnuales: { label: "Vacaciones anuales",          fmt: "dias" },
  diasVacacionesTomados: { label: "Días de vacaciones tomados",  fmt: "dias" },
};

const TIPO_DOC: Record<string, string> = {
  liquidacion: "Liquidación de sueldo",
  finiquito:   "Finiquito",
  contrato:    "Contrato de trabajo",
  otro:        "Otro documento",
};

const CAMPO_EXTRAIDO: Record<string, { label: string; fmt: "currency" | "text" | "date" }> = {
  empleador:               { label: "Empleador",             fmt: "text" },
  rut_empleador:           { label: "RUT empleador",         fmt: "text" },
  periodo:                 { label: "Período",               fmt: "text" },
  sueldo_base:             { label: "Sueldo base",           fmt: "currency" },
  gratificacion:           { label: "Gratificación",         fmt: "currency" },
  movilizacion:            { label: "Movilización",          fmt: "currency" },
  colacion:                { label: "Colación",              fmt: "currency" },
  horas_extra:             { label: "Horas extra",           fmt: "currency" },
  total_haberes:           { label: "Total haberes",         fmt: "currency" },
  afp_nombre:              { label: "AFP",                   fmt: "text" },
  descuento_afp:           { label: "Descuento AFP",         fmt: "currency" },
  descuento_salud:         { label: "Descuento salud",       fmt: "currency" },
  total_descuentos:        { label: "Total descuentos",      fmt: "currency" },
  liquido_a_pagar:         { label: "Líquido a pagar",       fmt: "currency" },
  fecha_inicio_contrato:   { label: "Inicio contrato",       fmt: "date" },
  fecha_termino_contrato:  { label: "Término contrato",      fmt: "date" },
  causal_termino:          { label: "Causal de término",     fmt: "text" },
};

// ─── Helpers de formateo ────────────────────────────────────────────────────

function fmtCLP(v: unknown) {
  const n = Number(v);
  if (!n && n !== 0) return "—";
  return n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
}

function fmtFecha(v: unknown) {
  if (!v) return "—";
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString("es-CL");
}

function renderValor(v: unknown, tipo: "currency" | "date" | "bool" | "causal" | "dias" | "text") {
  if (v === null || v === undefined) return "—";
  if (tipo === "currency")  return fmtCLP(v);
  if (tipo === "date")      return fmtFecha(v);
  if (tipo === "bool")      return v ? "Sí" : "No";
  if (tipo === "causal")    return CAUSAL[String(v)] ?? String(v);
  if (tipo === "dias")      return `${v} días hábiles`;
  return String(v);
}

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
          <Link href="/admin/clientes" className="text-xs text-gray-400 hover:text-gray-600 mb-1 block">
            ← Volver a clientes
          </Link>
          <h1 className="text-xl font-bold text-gray-800">{cliente.nombre}</h1>
          <p className="text-sm text-gray-400">
            Ingresó el {new Date(cliente.created_at).toLocaleDateString("es-CL")}
            {abogado ? ` · Abogado: ${abogado.nombre}` : ""}
          </p>
        </div>
        <EstadoForm clienteId={cliente.id} estadoActual={cliente.estado} />
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
            const cotiz = (resultado.cotizacionesUltimosDias as Record<string, number>) ?? {};
            const alertas = Array.isArray(resultado.alertas) ? (resultado.alertas as string[]) : [];
            return (
              <div className="space-y-2">
                {alertas.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 space-y-1">
                    <p className="text-xs font-semibold text-red-700">Alertas</p>
                    {alertas.map((a, i) => <p key={i} className="text-xs text-red-600">{a}</p>)}
                  </div>
                )}
                <div className="divide-y divide-gray-100 text-sm">
                  <DesgRow label="Meses trabajados" value={`${n(resultado.mesesTrabajados)} meses ${n(resultado.diasTrabajados)} días`} />
                  <DesgRow label="Remuneración imponible mensual" value={fmtCLP(resultado.remuneracionImponibleTotal)} />
                  {n(resultado.gratificacionMensual) > 0 && (
                    <DesgRow label="· Gratificación mensual incluida" value={fmtCLP(resultado.gratificacionMensual)} muted />
                  )}
                  {n(resultado.remUltimosDias) > 0 && (<>
                    <DesgRow label="Remuneración últimos días (líquido)" value={fmtCLP(resultado.remUltimosDias)} />
                    <DesgRow label="· AFP descontado" value={fmtCLP(cotiz.afp ?? 0)} muted />
                    <DesgRow label="· Salud descontado" value={fmtCLP(cotiz.salud ?? 0)} muted />
                    <DesgRow label="· AFC descontado" value={fmtCLP(cotiz.afc ?? 0)} muted />
                  </>)}
                  {n(resultado.feriadoProporcionalDiasDescontados) > 0 ? (
                    <DesgRow
                      label={`Feriado proporcional (${n(resultado.feriadoProporcionalDiasCalculados)} calc. − ${n(resultado.feriadoProporcionalDiasDescontados)} gozados = ${n(resultado.feriadoProporcionalDias)} días)`}
                      value={fmtCLP(resultado.feriadoProporcionalMonto)}
                    />
                  ) : (
                    <DesgRow label={`Feriado proporcional (${n(resultado.feriadoProporcionalDias)} días hábiles)`} value={fmtCLP(resultado.feriadoProporcionalMonto)} />
                  )}
                  {n(resultado.indemnizacionAvisoPrevio) > 0 && (
                    <DesgRow label="Indemnización aviso previo" value={fmtCLP(resultado.indemnizacionAvisoPrevio)} />
                  )}
                  {n(resultado.indemnizacionAnosServicio) > 0 && (
                    <DesgRow label="Indemnización años de servicio" value={fmtCLP(resultado.indemnizacionAnosServicio)} />
                  )}
                  {n(resultado.asignacionFamiliar) > 0 && (
                    <DesgRow label="Asignación familiar (no cotizable)" value={fmtCLP(resultado.asignacionFamiliar)} />
                  )}
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
