"use client";

import { useEffect, useState } from "react";
import type { AFP, CausalDespido, ContratoTipo, TipoSalud } from "@/lib/calculos/tipos";
import { jornadaMaximaLegal, minimoLegalAplicable } from "@/lib/calculos/jornada";
import { CAUSALES_V2 } from "@/lib/calculos/causales";
import { calcularLiquidacion, type ResultadoLiquidacion } from "@/lib/calculos/liquidacion";
import {
  calcularAuditoriaCotizaciones,
  type ResultadoAuditoriaCotizaciones,
} from "@/lib/calculos/auditoriaCotizaciones";
import type { DatosExtraidos } from "@/lib/extraccion/tipos";
import DocumentUploadStep, { type DocSubido } from "./DocumentUploadStep";
import ResultadoFiniquito from "@/components/ResultadoFiniquito";
import { ResultadoLiquidacionView } from "@/components/FormularioLiquidacion";
import { ResultadoCotizaciones } from "@/components/FormularioCotizaciones";

export type Flujo = "finiquito" | "liquidacion" | "cotizaciones";

const CAUSALES: { value: CausalDespido; label: string }[] = (
  Object.keys(CAUSALES_V2) as CausalDespido[]
).map((value) => ({ value, label: CAUSALES_V2[value].label }));
const CAUSALES_160 = new Set<CausalDespido>(["160_1a", "160_1b", "160_3", "160_4", "160_5", "160_6", "160_7"]);

const CONTRATO_TIPO_MAP: Record<"indefinido" | "plazo" | "obra", ContratoTipo> = {
  indefinido: "indefinido",
  plazo: "plazo_fijo",
  obra: "obra_faena",
};

const AFPS: AFP[] = ["Capital", "Cuprum", "Habitat", "Modelo", "PlanVital", "Provida", "Uno"];

const FLUJO_INFO: Record<Flujo, { emoji: string; titulo: string; desc: string }> = {
  finiquito: { emoji: "💼", titulo: "Calcular Finiquito", desc: "Feriado, indemnización, recargo, nulidad." },
  liquidacion: { emoji: "🧾", titulo: "Verificar Liquidación", desc: "Detectamos errores en tu pago mensual." },
  cotizaciones: { emoji: "🔍", titulo: "Revisar Cotizaciones", desc: "AFP, salud, AFC y nulidad del despido." },
};

// Campos comunes que se recuerdan entre visitas al wizard (localStorage) para no
// volver a preguntarlos si el usuario ya calculó otra cosa antes en esta sesión.
const CLAVE_COMUN = "wizard_datos_comunes_v1";

interface DatosComunes {
  contratoTipoUI: "indefinido" | "plazo" | "obra";
  afp: AFP;
  tipoSalud: TipoSalud;
  montoIsapre: string;
}

const inputCls =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500";
const btnPrimary =
  "flex-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-40";
const btnSecondary =
  "flex-1 border border-gray-300 hover:bg-gray-50 py-3 rounded-xl text-sm text-gray-600 transition-colors";
const btnYN = (activo: boolean) =>
  `px-5 py-2.5 rounded-lg font-medium border text-sm transition-colors ${
    activo ? "bg-blue-700 text-white border-blue-700" : "border-gray-300 hover:bg-gray-50"
  }`;

export default function Wizard({ flujoInicial }: { flujoInicial: Flujo | null }) {
  const [flujo, setFlujo] = useState<Flujo | null>(flujoInicial);
  const [paso, setPaso] = useState(flujoInicial ? 1 : 0);

  // ── Documentos ──────────────────────────────────────────────────────────
  const [docsSubidos, setDocsSubidos] = useState<DocSubido[]>([]);
  const [datosExtraidos, setDatosExtraidos] = useState<DatosExtraidos | null>(null);

  // ── Comunes ─────────────────────────────────────────────────────────────
  const [contratoTipoUI, setContratoTipoUI] = useState<"indefinido" | "plazo" | "obra">("indefinido");
  const [sueldoBase, setSueldoBase] = useState("");
  const [afp, setAfp] = useState<AFP>("Capital");
  const [tipoSalud, setTipoSalud] = useState<TipoSalud>("Fonasa");
  const [montoIsapre, setMontoIsapre] = useState("");
  const [tieneCaja, setTieneCaja] = useState<boolean | null>(null);
  const [movilizacion, setMovilizacion] = useState("");
  const [colacion, setColacion] = useState("");
  const [recibeGratificacion, setRecibeGratificacion] = useState<boolean | null>(null);
  const [gratificacionFija, setGratificacionFija] = useState("");

  // ── Finiquito ───────────────────────────────────────────────────────────
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaTermino, setFechaTermino] = useState("");
  const [causal, setCausal] = useState<CausalDespido>("161_1");
  const [causalEsCorrecta, setCausalEsCorrecta] = useState<boolean | null>(null);
  const [tienePruebas, setTienePruebas] = useState<boolean | null>(null);
  const [recibioCarta30Dias, setRecibioCarta30Dias] = useState<boolean | null>(null);
  const [afcDescontadoEnFiniquito, setAfcDescontadoEnFiniquito] = useState("");
  const [jornada, setJornada] = useState<"completa" | "parcial" | null>(null);
  const [horasSemana, setHorasSemana] = useState("30");
  const [diasVacaciones, setDiasVacaciones] = useState("15");
  const [diasVacacionesTomados, setDiasVacacionesTomados] = useState("0");
  const [reciboUltimoMes, setReciboUltimoMes] = useState<boolean | null>(null);
  const [cotizacionesAlDia, setCotizacionesAlDia] = useState<boolean | null>(null);
  const [horasExtra, setHorasExtra] = useState("");
  const [minutosExtra, setMinutosExtra] = useState("");
  const [anticipo, setAnticipo] = useState("");
  const [otrosDescuentos, setOtrosDescuentos] = useState("");
  const [asignacionFamiliar, setAsignacionFamiliar] = useState("");
  const [viajaRegion, setViajaRegion] = useState<boolean | null>(null);
  const [empresaPagaPasajes, setEmpresaPagaPasajes] = useState<boolean | null>(null);

  // ── Liquidación ─────────────────────────────────────────────────────────
  const [horasExtraMonto, setHorasExtraMonto] = useState("");
  const [bonosImponibles, setBonosImponibles] = useState("");
  const [montoRecibido, setMontoRecibido] = useState("");

  // ── Cotizaciones ────────────────────────────────────────────────────────
  const [montoAFP, setMontoAFP] = useState("");
  const [montoSalud, setMontoSalud] = useState("");
  const [montoAFC, setMontoAFC] = useState("");
  const [fueDespedido, setFueDespedido] = useState<boolean | null>(null);
  const [fechaDespido, setFechaDespido] = useState("");

  // ── Contacto / resultado ────────────────────────────────────────────────
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [cargando, setCargando] = useState(false);
  const [emailRegistrado, setEmailRegistrado] = useState("");
  const [resultadoFiniquito, setResultadoFiniquito] = useState<Record<string, unknown> | null>(null);
  const [resultadoLiquidacion, setResultadoLiquidacion] = useState<ResultadoLiquidacion | null>(null);
  const [resultadoCotizaciones, setResultadoCotizaciones] = useState<ResultadoAuditoriaCotizaciones | null>(null);

  const num = (v: string) => parseInt(v.replace(/\D/g, ""), 10) || 0;
  const fmt = (v: number) =>
    v.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

  // Precargar datos comunes guardados en una sesión anterior del mismo navegador.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CLAVE_COMUN);
      if (!raw) return;
      const guardado: DatosComunes = JSON.parse(raw);
      setContratoTipoUI(guardado.contratoTipoUI);
      setAfp(guardado.afp);
      setTipoSalud(guardado.tipoSalud);
      setMontoIsapre(guardado.montoIsapre);
    } catch {
      /* ignorar datos corruptos */
    }
  }, []);

  function guardarComunes() {
    const datos: DatosComunes = { contratoTipoUI, afp, tipoSalud, montoIsapre };
    localStorage.setItem(CLAVE_COMUN, JSON.stringify(datos));
  }

  // Prefill NO destructivo: solo completa campos que el usuario aún no tocó.
  function aplicarExtraccion(datos: DatosExtraidos, docs: DocSubido[]) {
    setDatosExtraidos(datos);
    setDocsSubidos(docs);
    if (datos.sueldoBase && !sueldoBase) setSueldoBase(String(Math.round(datos.sueldoBase)));
    if (datos.movilizacion && !movilizacion) setMovilizacion(String(Math.round(datos.movilizacion)));
    if (datos.colacion && !colacion) setColacion(String(Math.round(datos.colacion)));
    if (datos.montoIsapre && !montoIsapre) setMontoIsapre(String(Math.round(datos.montoIsapre)));
    if (datos.afp && AFPS.includes(datos.afp as AFP)) setAfp(datos.afp as AFP);
    if (datos.prevision) setTipoSalud(datos.prevision === "isapre" ? "Isapre" : "Fonasa");
    if (datos.contratoTipo) {
      const inverso = Object.entries(CONTRATO_TIPO_MAP).find(([, v]) => v === datos.contratoTipo)?.[0];
      if (inverso) setContratoTipoUI(inverso as "indefinido" | "plazo" | "obra");
    }
    if (datos.fechaIngreso && !fechaInicio) setFechaInicio(datos.fechaIngreso);
    if (datos.fechaEgreso && !fechaTermino) setFechaTermino(datos.fechaEgreso);
    if (datos.causal && !!CAUSALES_V2[datos.causal]) setCausal(datos.causal);
    if (datos.liquidoRecibido && !montoRecibido) setMontoRecibido(String(Math.round(datos.liquidoRecibido)));
    if (datos.descuentoAfp && !montoAFP) setMontoAFP(String(Math.round(datos.descuentoAfp)));
    if (datos.descuentoSalud && !montoSalud) setMontoSalud(String(Math.round(datos.descuentoSalud)));
    avanzar();
  }

  function avanzar() { setPaso((p) => p + 1); }
  function retroceder() { setPaso((p) => p - 1); }

  function documentosPendientesPayload() {
    return docsSubidos.map((d) => ({
      tipo: d.tipo,
      nombre: d.nombre,
      base64: d.base64,
      mediaType: d.mediaType,
      datosExtraidos: datosExtraidos ?? undefined,
    }));
  }

  async function enviarLead(resultadoTotal: number, datosCalculo: Record<string, unknown>) {
    try {
      const resp = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          email: email || null,
          telefono,
          resultado_total: Math.round(resultadoTotal),
          datos_calculo: datosCalculo,
          documentosPendientes: documentosPendientesPayload(),
        }),
      });
      const data = await resp.json();
      if (data.portalCreado && email) setEmailRegistrado(email);
    } catch {
      /* no bloquear el resultado si falla el registro del lead */
    }
  }

  async function calcularYRegistrar() {
    setCargando(true);
    guardarComunes();
    try {
      if (flujo === "finiquito") {
        const fechaRef = fechaTermino || new Date().toISOString().split("T")[0];
        const jornadaSemanal = jornada === "completa" ? jornadaMaximaLegal(fechaRef) : num(horasSemana) || 30;
        const datosCalculo = {
          fechaInicio, fechaTermino,
          fechaConsulta: new Date().toISOString().split("T")[0],
          causal,
          contratoTipo: CONTRATO_TIPO_MAP[contratoTipoUI],
          causalEsCorrecta: causalEsCorrecta ?? true,
          tienePruebas: tienePruebas ?? false,
          recibioCarta30Dias: recibioCarta30Dias ?? true,
          afcDescontadoEnFiniquito: num(afcDescontadoEnFiniquito),
          jornadaSemanal,
          sueldoBase: num(sueldoBase),
          movilizacion: num(movilizacion),
          colacion: num(colacion),
          otrosBonos: [],
          afp, tipoSalud, montoIsapre: num(montoIsapre),
          recibeGratificacion: recibeGratificacion ?? false,
          gratificacionMensualFija: num(gratificacionFija),
          tieneProgressivo: parseInt(diasVacaciones) > 15,
          diasVacacionesAnuales: parseInt(diasVacaciones) || 15,
          diasVacacionesTomados: parseInt(diasVacacionesTomados) || 0,
          reciboRemuneracionUltimoMes: reciboUltimoMes ?? true,
          cotizacionesAlDia: cotizacionesAlDia ?? true,
          horasExtraPermanentes: num(horasExtra),
          minutosExtraPermanentes: num(minutosExtra),
          anticipoSueldo: num(anticipo),
          otrosDescuentos: num(otrosDescuentos),
          asignacionFamiliar: num(asignacionFamiliar),
          viajaOtraRegion: viajaRegion ?? false,
          empresaPagaPasajes: empresaPagaPasajes ?? false,
        };
        const res = await fetch("/api/calcular", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datosCalculo),
        });
        const json = await res.json();
        setResultadoFiniquito(json);
        await enviarLead(json.totalConNulidad ?? 0, { ...datosCalculo, _resultado: json });
      } else if (flujo === "liquidacion") {
        const res = calcularLiquidacion({
          contratoTipo: CONTRATO_TIPO_MAP[contratoTipoUI],
          sueldoBase: num(sueldoBase),
          horasExtraMonto: num(horasExtraMonto),
          bonosImponibles: num(bonosImponibles),
          recibeGratificacion: recibeGratificacion ?? false,
          gratificacionFija: num(gratificacionFija),
          movilizacion: num(movilizacion),
          colacion: num(colacion),
          afp, tipoSalud, montoIsapre: num(montoIsapre),
          anticipoSueldo: num(anticipo),
          otrosDescuentos: num(otrosDescuentos),
          asignacionFamiliar: num(asignacionFamiliar),
          montoRecibido: num(montoRecibido),
        });
        setResultadoLiquidacion(res);
        await enviarLead(Math.abs(res.diferencia), { tipo: "liquidacion", contratoTipo: contratoTipoUI, sueldoBase: num(sueldoBase), diferencia: res.diferencia });
      } else if (flujo === "cotizaciones") {
        const res = calcularAuditoriaCotizaciones({
          contratoTipo: CONTRATO_TIPO_MAP[contratoTipoUI],
          sueldoImponible: num(sueldoBase),
          afp,
          montoAfpDeclarado: num(montoAFP),
          tipoSalud,
          tieneCaja: tieneCaja ?? false,
          montoSaludDeclarado: num(montoSalud),
          montoAfcDeclarado: num(montoAFC),
          fueDespedido: fueDespedido ?? false,
          fechaDespido: fechaDespido || undefined,
        });
        setResultadoCotizaciones(res);
        await enviarLead(Math.abs(res.totalDiferencia) + res.montoNulidad, {
          tipo: "cotizaciones", contratoTipo: contratoTipoUI, imponible: num(sueldoBase),
          diferencia: res.totalDiferencia, nulidad: res.hayNulidad, montoNulidad: res.montoNulidad,
        });
      }
      avanzar();
    } finally {
      setCargando(false);
    }
  }

  // ── Progreso ────────────────────────────────────────────────────────────
  const PASOS_POR_FLUJO: Record<Flujo, string[]> = {
    finiquito: ["Documentos", "Contrato", "Remuneración", "Previsión", "Detalle", "Tus datos"],
    liquidacion: ["Documentos", "Contrato", "Remuneración", "Previsión", "Detalle", "Tus datos"],
    cotizaciones: ["Documentos", "Contrato", "Remuneración", "Previsión", "Detalle", "Tus datos"],
  };
  const totalPasos = flujo ? PASOS_POR_FLUJO[flujo].length : 1;
  const pasoLabel = flujo ? PASOS_POR_FLUJO[flujo][paso - 1] : "";
  const hayResultado = resultadoFiniquito || resultadoLiquidacion || resultadoCotizaciones;

  return (
    <div className="max-w-lg mx-auto">
      {flujo && !hayResultado && (
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{pasoLabel}</span>
            <span>Paso {paso} de {totalPasos}</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full">
            <div className="h-1.5 bg-blue-600 rounded-full transition-all" style={{ width: `${(paso / totalPasos) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Paso 0 — elegir flujo */}
      {paso === 0 && (
        <div className="space-y-3">
          <h1 className="text-xl font-semibold text-gray-800 mb-4">¿Qué necesitas calcular?</h1>
          {(Object.keys(FLUJO_INFO) as Flujo[]).map((f) => (
            <button
              key={f}
              onClick={() => { setFlujo(f); setPaso(1); }}
              className="w-full text-left flex items-start gap-4 p-5 rounded-2xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all"
            >
              <span className="text-2xl">{FLUJO_INFO[f].emoji}</span>
              <div>
                <p className="font-semibold text-gray-900">{FLUJO_INFO[f].titulo}</p>
                <p className="text-sm text-gray-500">{FLUJO_INFO[f].desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Paso 1 — documentos */}
      {flujo && paso === 1 && (
        <DocumentUploadStep flujo={flujo} onExtracted={aplicarExtraccion} onSkip={avanzar} />
      )}

      {/* Paso 2 — contrato */}
      {flujo && paso === 2 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Datos del contrato</h2>

          <div>
            <label className="block text-sm font-medium mb-1">Tipo de contrato</label>
            <div className="flex gap-2 flex-wrap">
              <button className={btnYN(contratoTipoUI === "indefinido")} onClick={() => setContratoTipoUI("indefinido")}>Indefinido</button>
              <button className={btnYN(contratoTipoUI === "plazo")} onClick={() => setContratoTipoUI("plazo")}>Plazo fijo</button>
              <button className={btnYN(contratoTipoUI === "obra")} onClick={() => setContratoTipoUI("obra")}>Obra o faena</button>
            </div>
          </div>

          {flujo === "finiquito" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Fecha de inicio</label>
                <input className={inputCls} type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fecha de término (despido)</label>
                <input className={inputCls} type="date" value={fechaTermino} onChange={(e) => setFechaTermino(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Causal de término</label>
                <select
                  className={inputCls}
                  value={causal}
                  onChange={(e) => {
                    setCausal(e.target.value as CausalDespido);
                    setCausalEsCorrecta(null); setTienePruebas(null); setRecibioCarta30Dias(null);
                  }}
                >
                  {CAUSALES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              {causal === "159_4" && (
                <div>
                  <label className="block text-sm font-medium mb-1">¿El contrato realmente venció en la fecha indicada?</label>
                  <div className="flex gap-3">
                    <button className={btnYN(causalEsCorrecta === true)} onClick={() => setCausalEsCorrecta(true)}>Sí</button>
                    <button className={btnYN(causalEsCorrecta === false)} onClick={() => setCausalEsCorrecta(false)}>No, se invocó mal</button>
                  </div>
                </div>
              )}
              {CAUSALES_160.has(causal) && (
                <div>
                  <label className="block text-sm font-medium mb-1">¿Tienes pruebas de que el despido fue injustificado?</label>
                  <div className="flex gap-3">
                    <button className={btnYN(tienePruebas === true)} onClick={() => setTienePruebas(true)}>Sí</button>
                    <button className={btnYN(tienePruebas === false)} onClick={() => setTienePruebas(false)}>No</button>
                  </div>
                </div>
              )}
              {causal === "161_1" && (
                <div>
                  <label className="block text-sm font-medium mb-1">¿Recibiste carta con 30 días de aviso?</label>
                  <div className="flex gap-3">
                    <button className={btnYN(recibioCarta30Dias === true)} onClick={() => setRecibioCarta30Dias(true)}>Sí</button>
                    <button className={btnYN(recibioCarta30Dias === false)} onClick={() => setRecibioCarta30Dias(false)}>No</button>
                  </div>
                </div>
              )}
              {causal === "161_1" && (
                <div>
                  <label className="block text-sm font-medium mb-1">AFC ya descontado en el finiquito firmado</label>
                  <input className={inputCls} type="number" placeholder="0" value={afcDescontadoEnFiniquito} onChange={(e) => setAfcDescontadoEnFiniquito(e.target.value)} />
                </div>
              )}
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button className={btnSecondary} onClick={retroceder}>Atrás</button>
            <button
              className={btnPrimary}
              disabled={flujo === "finiquito" && (!fechaInicio || !fechaTermino ||
                (causal === "159_4" && causalEsCorrecta === null) ||
                (CAUSALES_160.has(causal) && tienePruebas === null) ||
                (causal === "161_1" && recibioCarta30Dias === null))}
              onClick={avanzar}
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* Paso 3 — remuneración */}
      {flujo && paso === 3 && (() => {
        const fechaRef = fechaTermino || new Date().toISOString().split("T")[0];
        const jornadaMax = jornadaMaximaLegal(fechaRef);
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Remuneración</h2>

            {flujo === "finiquito" && (
              <div>
                <label className="block text-sm font-medium mb-1">¿Cuál es tu jornada laboral?</label>
                <div className="flex gap-3">
                  <button className={btnYN(jornada === "completa")} onClick={() => setJornada("completa")}>Completa ({jornadaMax} hrs)</button>
                  <button className={btnYN(jornada === "parcial")} onClick={() => setJornada("parcial")}>Parcial</button>
                </div>
                {jornada === "parcial" && (
                  <input className={`${inputCls} mt-2`} type="number" placeholder="Horas semanales" value={horasSemana} onChange={(e) => setHorasSemana(e.target.value)} />
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">
                {flujo === "cotizaciones" ? "Sueldo imponible (base + bonos + extras)" : "Sueldo base mensual ($)"}
              </label>
              <input className={inputCls} type="number" placeholder="Ej: 800000" value={sueldoBase} onChange={(e) => setSueldoBase(e.target.value)} />
              {flujo === "finiquito" && jornada && (() => {
                const horas = jornada === "completa" ? jornadaMax : (parseInt(horasSemana) || 30);
                const minimoLegal = minimoLegalAplicable(horas, fechaRef);
                const sueldo = num(sueldoBase);
                if (sueldo > 0 && sueldo < minimoLegal) {
                  return (
                    <p className="mt-1 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
                      ⚠️ Bajo el mínimo legal para {horas} hrs/semana ({fmt(minimoLegal)}).
                    </p>
                  );
                }
                return null;
              })()}
            </div>

            {flujo !== "cotizaciones" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">¿Recibe gratificación mensual?</label>
                  <div className="flex gap-3">
                    <button className={btnYN(recibeGratificacion === true)} onClick={() => setRecibeGratificacion(true)}>Sí</button>
                    <button className={btnYN(recibeGratificacion === false)} onClick={() => setRecibeGratificacion(false)}>No</button>
                  </div>
                  {recibeGratificacion && (
                    <input className={`${inputCls} mt-2`} type="number" placeholder="0 = calcular automático 25%" value={gratificacionFija} onChange={(e) => setGratificacionFija(e.target.value)} />
                  )}
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Movilización</label>
                    <input className={inputCls} type="number" placeholder="0" value={movilizacion} onChange={(e) => setMovilizacion(e.target.value)} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Colación</label>
                    <input className={inputCls} type="number" placeholder="0" value={colacion} onChange={(e) => setColacion(e.target.value)} />
                  </div>
                </div>
                {(num(movilizacion) > 25000 || num(colacion) > 30000) && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                    Montos altos de movilización/colación pueden ser evasión de cotizaciones — se revisará en el resultado.
                  </p>
                )}
              </>
            )}

            <div className="flex gap-3 pt-2">
              <button className={btnSecondary} onClick={retroceder}>Atrás</button>
              <button
                className={btnPrimary}
                disabled={!sueldoBase || (flujo === "finiquito" && !jornada)}
                onClick={avanzar}
              >
                Continuar
              </button>
            </div>
          </div>
        );
      })()}

      {/* Paso 4 — previsión */}
      {flujo && paso === 4 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Previsión</h2>
          <div>
            <label className="block text-sm font-medium mb-1">AFP</label>
            <select className={inputCls} value={afp} onChange={(e) => setAfp(e.target.value as AFP)}>
              {AFPS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Salud</label>
            <div className="flex gap-3">
              <button className={btnYN(tipoSalud === "Fonasa")} onClick={() => setTipoSalud("Fonasa")}>Fonasa</button>
              <button className={btnYN(tipoSalud === "Isapre")} onClick={() => setTipoSalud("Isapre")}>Isapre</button>
            </div>
            {tipoSalud === "Isapre" && (
              <input className={`${inputCls} mt-2`} type="number" placeholder="Monto mensual Isapre" value={montoIsapre} onChange={(e) => setMontoIsapre(e.target.value)} />
            )}
            {tipoSalud === "Fonasa" && flujo === "cotizaciones" && (
              <div className="mt-2">
                <label className="block text-sm font-medium mb-1">¿Tu empleador tiene caja de compensación?</label>
                <div className="flex gap-3">
                  <button className={btnYN(tieneCaja === true)} onClick={() => setTieneCaja(true)}>Sí</button>
                  <button className={btnYN(tieneCaja === false)} onClick={() => setTieneCaja(false)}>No</button>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button className={btnSecondary} onClick={retroceder}>Atrás</button>
            <button className={btnPrimary} onClick={avanzar}>Continuar</button>
          </div>
        </div>
      )}

      {/* Paso 5 — específico por flujo */}
      {flujo === "finiquito" && paso === 5 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Vacaciones y último mes</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Días de vacaciones anuales</label>
            <input className={inputCls} type="number" min="15" value={diasVacaciones} onChange={(e) => setDiasVacaciones(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Días de vacaciones ya tomados</label>
            <input className={inputCls} type="number" min="0" placeholder="0" value={diasVacacionesTomados} onChange={(e) => setDiasVacacionesTomados(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">¿Ya te pagaron los días trabajados del último mes?</label>
            <div className="flex gap-3">
              <button className={btnYN(reciboUltimoMes === true)} onClick={() => setReciboUltimoMes(true)}>Sí</button>
              <button className={btnYN(reciboUltimoMes === false)} onClick={() => setReciboUltimoMes(false)}>No</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">¿Tu empleador tenía tus cotizaciones (AFP, salud, AFC) al día en la fecha del despido?</label>
            <div className="flex gap-3">
              <button className={btnYN(cotizacionesAlDia === true)} onClick={() => setCotizacionesAlDia(true)}>Sí, al día</button>
              <button className={btnYN(cotizacionesAlDia === false)} onClick={() => setCotizacionesAlDia(false)}>No / tenía atraso</button>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Horas extra/mes</label>
              <input className={inputCls} type="number" placeholder="0" value={horasExtra} onChange={(e) => setHorasExtra(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Minutos extra/mes</label>
              <input className={inputCls} type="number" placeholder="0" value={minutosExtra} onChange={(e) => setMinutosExtra(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Anticipo de sueldo</label>
            <input className={inputCls} type="number" placeholder="0" value={anticipo} onChange={(e) => setAnticipo(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Otros descuentos</label>
            <input className={inputCls} type="number" placeholder="0" value={otrosDescuentos} onChange={(e) => setOtrosDescuentos(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Asignación familiar mensual</label>
            <input className={inputCls} type="number" placeholder="0" value={asignacionFamiliar} onChange={(e) => setAsignacionFamiliar(e.target.value)} />
          </div>
          <div className="flex gap-3 pt-2">
            <button className={btnSecondary} onClick={retroceder}>Atrás</button>
            <button className={btnPrimary} disabled={reciboUltimoMes === null || cotizacionesAlDia === null} onClick={avanzar}>Continuar</button>
          </div>
        </div>
      )}

      {flujo === "liquidacion" && paso === 5 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Extras y monto recibido</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Horas extra (monto en liquidación)</label>
            <input className={inputCls} type="number" placeholder="0" value={horasExtraMonto} onChange={(e) => setHorasExtraMonto(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bonos imponibles</label>
            <input className={inputCls} type="number" placeholder="0" value={bonosImponibles} onChange={(e) => setBonosImponibles(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Anticipo de sueldo</label>
            <input className={inputCls} type="number" placeholder="0" value={anticipo} onChange={(e) => setAnticipo(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Otros descuentos</label>
            <input className={inputCls} type="number" placeholder="0" value={otrosDescuentos} onChange={(e) => setOtrosDescuentos(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Asignación familiar</label>
            <input className={inputCls} type="number" placeholder="0" value={asignacionFamiliar} onChange={(e) => setAsignacionFamiliar(e.target.value)} />
          </div>
          <div className="pt-1 border-t border-gray-100">
            <label className="block text-sm font-semibold mb-1">Monto que recibiste (transferencia)</label>
            <input className={`${inputCls} border-blue-300 ring-1 ring-blue-200`} type="number" placeholder="Ej: 720000" value={montoRecibido} onChange={(e) => setMontoRecibido(e.target.value)} />
          </div>
          <div className="flex gap-3 pt-2">
            <button className={btnSecondary} onClick={retroceder}>Atrás</button>
            <button className={btnPrimary} disabled={!montoRecibido} onClick={avanzar}>Continuar</button>
          </div>
        </div>
      )}

      {flujo === "cotizaciones" && paso === 5 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Cotizaciones declaradas</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Monto AFP en tu liquidación</label>
            <input className={inputCls} type="number" placeholder="0" value={montoAFP} onChange={(e) => setMontoAFP(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Monto salud en tu liquidación</label>
            <input className={inputCls} type="number" placeholder="0" value={montoSalud} onChange={(e) => setMontoSalud(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Monto AFC en tu liquidación</label>
            <input className={inputCls} type="number" placeholder="0" value={montoAFC} onChange={(e) => setMontoAFC(e.target.value)} />
          </div>
          <div className="pt-2 border-t border-gray-100">
            <label className="block text-sm font-medium mb-1">¿Fuiste despedido de este trabajo?</label>
            <div className="flex gap-3">
              <button className={btnYN(fueDespedido === true)} onClick={() => setFueDespedido(true)}>Sí</button>
              <button className={btnYN(fueDespedido === false)} onClick={() => setFueDespedido(false)}>No, sigo trabajando</button>
            </div>
            {fueDespedido && (
              <input className={`${inputCls} mt-2`} type="date" value={fechaDespido} onChange={(e) => setFechaDespido(e.target.value)} />
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button className={btnSecondary} onClick={retroceder}>Atrás</button>
            <button className={btnPrimary} disabled={fueDespedido === true && !fechaDespido} onClick={avanzar}>Continuar</button>
          </div>
        </div>
      )}

      {/* Paso 6 — contacto */}
      {flujo && paso === 6 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Casi listo</h2>
          <p className="text-sm text-gray-500">Ingresa tus datos para ver el resultado y crear tu cuenta de seguimiento gratuita.</p>
          <div>
            <label className="block text-sm font-medium mb-1">Nombre completo *</label>
            <input className={inputCls} type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Correo electrónico</label>
            <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Teléfono *</label>
            <input className={inputCls} type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </div>
          <div className="flex gap-3 pt-2">
            <button className={btnSecondary} onClick={retroceder}>Atrás</button>
            <button className={btnPrimary} disabled={cargando || !nombre.trim() || !telefono.trim()} onClick={calcularYRegistrar}>
              {cargando ? "Calculando..." : "Ver mi resultado →"}
            </button>
          </div>
        </div>
      )}

      {/* Resultado */}
      {flujo === "finiquito" && resultadoFiniquito && (
        <ResultadoFiniquito
          resultado={resultadoFiniquito}
          fmt={fmt}
          emailRegistrado={email || undefined}
          onVolver={() => window.location.reload()}
          datosCalculo={{ causal }}
          tieneDocumentos={docsSubidos.length > 0}
        />
      )}
      {flujo === "liquidacion" && resultadoLiquidacion && (
        <ResultadoLiquidacionView resultado={resultadoLiquidacion} emailRegistrado={emailRegistrado} onVolver={() => window.location.reload()} />
      )}
      {flujo === "cotizaciones" && resultadoCotizaciones && (
        <ResultadoCotizaciones resultado={resultadoCotizaciones} emailRegistrado={emailRegistrado} onVolver={() => window.location.reload()} />
      )}
    </div>
  );
}
