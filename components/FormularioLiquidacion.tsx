"use client";

import { useState } from "react";
import Link from "next/link";

/* ── constantes ───────────────────────────────────────────────────────── */
const AFP_RATES: Record<string, number> = {
  Capital: 0.1127,
  Cuprum: 0.1144,
  Habitat: 0.1127,
  Modelo: 0.1058,
  PlanVital: 0.1116,
  Provida: 0.1145,
  Uno: 0.1069,
};
const AFPS = Object.keys(AFP_RATES);
const UTM = 67_294;
const TOPE_GRATIFICACION = 209_750; // 4.75 × IMM 2025 / 12

function calcImpuesto(base: number): number {
  const tramos = [
    { lim: 13.5, tasa: 0, ded: 0 },
    { lim: 30, tasa: 0.04, ded: 0.54 },
    { lim: 50, tasa: 0.08, ded: 1.74 },
    { lim: 70, tasa: 0.135, ded: 4.49 },
    { lim: 90, tasa: 0.23, ded: 11.14 },
    { lim: 120, tasa: 0.304, ded: 17.8 },
    { lim: 150, tasa: 0.35, ded: 23.32 },
    { lim: Infinity, tasa: 0.4, ded: 30.82 },
  ];
  const t = tramos.find((r) => base / UTM <= r.lim)!;
  return t.tasa === 0 ? 0 : Math.max(0, Math.round(base * t.tasa - t.ded * UTM));
}

const fmt = (n: number) =>
  n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

const inputCls =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500";
const selectCls = inputCls;
const btnPrimary =
  "flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors";
const btnSecondary =
  "flex-1 border border-gray-300 hover:bg-gray-50 py-3 rounded-xl text-sm text-gray-600 transition-colors";

const PASOS = ["Contrato", "Remuneración", "Previsión", "Descuentos", "Tus datos", "Resultado"];

/* ── tipos ────────────────────────────────────────────────────────────── */
interface Resultado {
  totalImponible: number;
  gratificacionMonto: number;
  descAFP: number;
  descSalud: number;
  descAFC: number;
  descImpuesto: number;
  totalHaberes: number;
  totalDescuentos: number;
  totalLiquidoCalculado: number;
  montoRecibido: number;
  diferencia: number;
  alertas: string[];
}

/* ── componente ───────────────────────────────────────────────────────── */
export default function FormularioLiquidacion() {
  const [paso, setPaso] = useState(1);

  // Paso 1 — Contrato
  const [tipoContrato, setTipoContrato] = useState<"indefinido" | "plazo" | "obra">("indefinido");

  // Paso 2 — Remuneración
  const [sueldoBase, setSueldoBase] = useState("");
  const [horasExtraMonto, setHorasExtraMonto] = useState("");
  const [bonosImponibles, setBonosImponibles] = useState("");
  const [recibeGratificacion, setRecibeGratificacion] = useState<boolean | null>(null);
  const [gratificacionFija, setGratificacionFija] = useState("");
  const [movilizacion, setMovilizacion] = useState("");
  const [colacion, setColacion] = useState("");

  // Paso 3 — Previsión
  const [afp, setAfp] = useState("Capital");
  const [tipoSalud, setTipoSalud] = useState<"Fonasa" | "Isapre">("Fonasa");
  const [montoIsapre, setMontoIsapre] = useState("");

  // Paso 4 — Descuentos + monto recibido
  const [anticipoSueldo, setAnticipoSueldo] = useState("");
  const [otrosDescuentos, setOtrosDescuentos] = useState("");
  const [asignacionFamiliar, setAsignacionFamiliar] = useState("");
  const [montoRecibido, setMontoRecibido] = useState("");

  // Paso 5 — Lead
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");

  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [emailRegistrado, setEmailRegistrado] = useState("");
  const [enviando, setEnviando] = useState(false);

  /* ── navegación ─────────────────────────────────────────────────────── */
  function avanzar() { setPaso((p) => p + 1); }
  function retroceder() { setPaso((p) => p - 1); }

  /* ── calcular ────────────────────────────────────────────────────────── */
  function calcular(): Resultado {
    const base = Number(sueldoBase) || 0;
    const extras = Number(horasExtraMonto) || 0;
    const bonos = Number(bonosImponibles) || 0;
    const mov = Number(movilizacion) || 0;
    const col = Number(colacion) || 0;
    const anticipo = Number(anticipoSueldo) || 0;
    const otros = Number(otrosDescuentos) || 0;
    const asig = Number(asignacionFamiliar) || 0;
    const recibido = Number(montoRecibido) || 0;

    let grat = 0;
    if (recibeGratificacion) {
      grat = Number(gratificacionFija) > 0
        ? Number(gratificacionFija)
        : Math.min(Math.round(base * 0.25), TOPE_GRATIFICACION);
    }

    const totalImponible = base + extras + bonos + grat;

    const descAFP = Math.round(totalImponible * (AFP_RATES[afp] ?? 0.1127));
    const descSalud =
      tipoSalud === "Fonasa"
        ? Math.round(totalImponible * 0.07)
        : Number(montoIsapre) || 0;
    const descAFC =
      tipoContrato === "indefinido"
        ? Math.round(totalImponible * 0.006)
        : 0;

    const baseImpuesto = totalImponible - descAFP - descSalud;
    const descImpuesto = calcImpuesto(baseImpuesto);

    const totalHaberes = totalImponible + mov + col + asig;
    const totalDescuentos = descAFP + descSalud + descAFC + descImpuesto + anticipo + otros;
    const totalLiquidoCalculado = totalHaberes - totalDescuentos;
    const diferencia = recibido - totalLiquidoCalculado;

    const alertas: string[] = [];
    if (Math.abs(diferencia) > 1000) {
      alertas.push(
        diferencia < 0
          ? `Te pagaron ${fmt(Math.abs(diferencia))} menos de lo que corresponde.`
          : `Recibiste ${fmt(diferencia)} más de lo calculado. Revisa si hay conceptos adicionales.`
      );
    }
    if (tipoContrato !== "indefinido") {
      alertas.push("En contratos a plazo fijo u obra, el AFC lo paga íntegramente el empleador (3%). No debe descontarse de tu sueldo.");
    }

    return {
      totalImponible,
      gratificacionMonto: grat,
      descAFP,
      descSalud,
      descAFC,
      descImpuesto,
      totalHaberes,
      totalDescuentos,
      totalLiquidoCalculado,
      montoRecibido: recibido,
      diferencia,
      alertas,
    };
  }

  async function calcularYRegistrar() {
    if (!nombre.trim() || !telefono.trim()) return;
    setEnviando(true);
    const res = calcular();
    setResultado(res);

    try {
      const resp = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          email: email || null,
          telefono,
          resultado_total: Math.abs(res.diferencia),
          datos_calculo: {
            tipo: "liquidacion",
            tipoContrato,
            sueldoBase: Number(sueldoBase),
            diferencia: res.diferencia,
          },
        }),
      });
      const data = await resp.json();
      if (data.portalCreado && email) setEmailRegistrado(email);
    } catch (_) { /* silencioso */ }

    setEnviando(false);
    setPaso(6);
  }

  function reiniciar() {
    setPaso(1);
    setSueldoBase(""); setHorasExtraMonto(""); setBonosImponibles("");
    setRecibeGratificacion(null); setGratificacionFija(""); setMovilizacion(""); setColacion("");
    setAfp("Capital"); setTipoSalud("Fonasa"); setMontoIsapre("");
    setAnticipoSueldo(""); setOtrosDescuentos(""); setAsignacionFamiliar(""); setMontoRecibido("");
    setNombre(""); setEmail(""); setTelefono("");
    setResultado(null); setEmailRegistrado("");
  }

  /* ── render ──────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* Barra progreso */}
      {paso < 6 && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>{PASOS[paso - 1]}</span>
            <span>{paso} / {PASOS.length - 1}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all"
              style={{ width: `${((paso - 1) / (PASOS.length - 2)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Paso 1: Contrato ── */}
      {paso === 1 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Tipo de contrato</h2>
            <p className="text-sm text-gray-500 mt-0.5">¿Qué tipo de contrato tienes?</p>
          </div>
          <div className="space-y-2">
            {(["indefinido", "plazo", "obra"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTipoContrato(t)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                  tipoContrato === t
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
              >
                {t === "indefinido" && "Contrato indefinido"}
                {t === "plazo" && "Plazo fijo"}
                {t === "obra" && "Obra o faena"}
              </button>
            ))}
          </div>
          <button onClick={avanzar} className={btnPrimary}>Continuar →</button>
        </div>
      )}

      {/* ── Paso 2: Remuneración ── */}
      {paso === 2 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Remuneración</h2>
            <p className="text-sm text-gray-500 mt-0.5">Datos de tu liquidación mensual</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sueldo base</label>
              <input
                type="number"
                inputMode="numeric"
                className={inputCls}
                placeholder="Ej: 800000"
                value={sueldoBase}
                onChange={(e) => setSueldoBase(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Horas extra (monto en liquidación)</label>
              <input
                type="number"
                inputMode="numeric"
                className={inputCls}
                placeholder="0 si no aplica"
                value={horasExtraMonto}
                onChange={(e) => setHorasExtraMonto(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bonos imponibles mensuales</label>
              <input
                type="number"
                inputMode="numeric"
                className={inputCls}
                placeholder="0 si no aplica"
                value={bonosImponibles}
                onChange={(e) => setBonosImponibles(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">¿Recibe gratificación mensual?</label>
              <div className="flex gap-3">
                {([true, false] as const).map((v) => (
                  <button
                    key={String(v)}
                    onClick={() => setRecibeGratificacion(v)}
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      recibeGratificacion === v
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {v ? "Sí" : "No"}
                  </button>
                ))}
              </div>
            </div>
            {recibeGratificacion && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Monto gratificación <span className="text-gray-400 font-normal">(vacío = calcular automático 25%)</span>
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  className={inputCls}
                  placeholder="Dejar vacío para cálculo automático"
                  value={gratificacionFija}
                  onChange={(e) => setGratificacionFija(e.target.value)}
                />
              </div>
            )}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Movilización</label>
                <input
                  type="number"
                  inputMode="numeric"
                  className={inputCls}
                  placeholder="0"
                  value={movilizacion}
                  onChange={(e) => setMovilizacion(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Colación</label>
                <input
                  type="number"
                  inputMode="numeric"
                  className={inputCls}
                  placeholder="0"
                  value={colacion}
                  onChange={(e) => setColacion(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={retroceder} className={btnSecondary}>← Atrás</button>
            <button
              onClick={avanzar}
              disabled={!sueldoBase || recibeGratificacion === null}
              className={`${btnPrimary} disabled:opacity-40`}
            >
              Continuar →
            </button>
          </div>
        </div>
      )}

      {/* ── Paso 3: Previsión ── */}
      {paso === 3 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Previsión</h2>
            <p className="text-sm text-gray-500 mt-0.5">AFP y sistema de salud</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">AFP</label>
              <select className={selectCls} value={afp} onChange={(e) => setAfp(e.target.value)}>
                {AFPS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sistema de salud</label>
              <div className="flex gap-3">
                {(["Fonasa", "Isapre"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setTipoSalud(s)}
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      tipoSalud === s
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {tipoSalud === "Isapre" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Monto Isapre (UF o pesos)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  className={inputCls}
                  placeholder="Monto mensual en liquidación"
                  value={montoIsapre}
                  onChange={(e) => setMontoIsapre(e.target.value)}
                />
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={retroceder} className={btnSecondary}>← Atrás</button>
            <button onClick={avanzar} className={btnPrimary}>Continuar →</button>
          </div>
        </div>
      )}

      {/* ── Paso 4: Descuentos y monto recibido ── */}
      {paso === 4 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Descuentos y monto recibido</h2>
            <p className="text-sm text-gray-500 mt-0.5">¿Hubo descuentos y cuánto recibiste?</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Anticipo de sueldo</label>
              <input
                type="number"
                inputMode="numeric"
                className={inputCls}
                placeholder="0 si no aplica"
                value={anticipoSueldo}
                onChange={(e) => setAnticipoSueldo(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Otros descuentos</label>
              <input
                type="number"
                inputMode="numeric"
                className={inputCls}
                placeholder="0 si no aplica"
                value={otrosDescuentos}
                onChange={(e) => setOtrosDescuentos(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Asignación familiar</label>
              <input
                type="number"
                inputMode="numeric"
                className={inputCls}
                placeholder="0 si no aplica"
                value={asignacionFamiliar}
                onChange={(e) => setAsignacionFamiliar(e.target.value)}
              />
            </div>
            <div className="pt-1 border-t border-gray-100">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Monto que recibiste (transferencia)</label>
              <input
                type="number"
                inputMode="numeric"
                className={`${inputCls} border-blue-300 ring-1 ring-blue-200`}
                placeholder="Ej: 720000"
                value={montoRecibido}
                onChange={(e) => setMontoRecibido(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={retroceder} className={btnSecondary}>← Atrás</button>
            <button
              onClick={avanzar}
              disabled={!montoRecibido}
              className={`${btnPrimary} disabled:opacity-40`}
            >
              Continuar →
            </button>
          </div>
        </div>
      )}

      {/* ── Paso 5: Tus datos ── */}
      {paso === 5 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Tus datos</h2>
            <p className="text-sm text-gray-500 mt-0.5">Para enviarte el informe y crear tu acceso</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre completo</label>
              <input
                type="text"
                autoComplete="name"
                className={inputCls}
                placeholder="Tu nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Correo electrónico <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                type="email"
                autoComplete="email"
                className={inputCls}
                placeholder="Para enviarte el acceso"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono</label>
              <input
                type="tel"
                autoComplete="tel"
                className={inputCls}
                placeholder="+56 9 xxxx xxxx"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={retroceder} className={btnSecondary}>← Atrás</button>
            <button
              onClick={calcularYRegistrar}
              disabled={!nombre.trim() || !telefono.trim() || enviando}
              className={`${btnPrimary} disabled:opacity-40`}
            >
              {enviando ? "Calculando..." : "Ver resultado →"}
            </button>
          </div>
        </div>
      )}

      {/* ── Paso 6: Resultado ── */}
      {paso === 6 && resultado && <ResultadoLiquidacion resultado={resultado} emailRegistrado={emailRegistrado} onVolver={reiniciar} />}
    </div>
  );
}

/* ── ResultadoLiquidacion ─────────────────────────────────────────────── */
function Fila({
  label, monto, negativo = false, bold = false,
}: {
  label: string; monto: number; negativo?: boolean; bold?: boolean;
}) {
  if (!monto && !bold) return null;
  return (
    <div className={`flex justify-between items-center py-2.5 border-b border-gray-100 last:border-0 ${bold ? "pt-3" : ""}`}>
      <span className={bold ? "font-semibold text-gray-800 text-sm" : "text-gray-600 text-sm"}>{label}</span>
      <span
        className={`font-medium tabular-nums text-sm whitespace-nowrap ${
          negativo ? "text-red-600" : bold ? "text-gray-900 font-semibold" : "text-gray-700"
        }`}
      >
        {negativo ? "−" : ""}{fmt(Math.abs(monto))}
      </span>
    </div>
  );
}

function ResultadoLiquidacion({
  resultado, emailRegistrado, onVolver,
}: {
  resultado: Resultado;
  emailRegistrado: string;
  onVolver: () => void;
}) {
  const diferencia = resultado.diferencia;
  const correcto = Math.abs(diferencia) <= 1000;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className={`rounded-2xl p-6 text-center space-y-2 ${
          correcto
            ? "bg-green-50 border border-green-200"
            : diferencia < 0
            ? "bg-red-50 border border-red-200"
            : "bg-amber-50 border border-amber-200"
        }`}
      >
        <p className={`text-xs font-semibold uppercase tracking-widest ${correcto ? "text-green-700" : diferencia < 0 ? "text-red-700" : "text-amber-700"}`}>
          {correcto ? "Liquidación correcta" : diferencia < 0 ? "Posible error en tu pago" : "Diferencia detectada"}
        </p>
        <p className={`text-4xl font-extrabold leading-none tabular-nums ${correcto ? "text-green-800" : diferencia < 0 ? "text-red-800" : "text-amber-800"}`}>
          {correcto ? "✓" : fmt(Math.abs(diferencia))}
        </p>
        {!correcto && (
          <p className={`text-sm font-medium ${diferencia < 0 ? "text-red-600" : "text-amber-600"}`}>
            {diferencia < 0 ? "pagado de menos" : "pagado de más"}
          </p>
        )}
      </div>

      {/* Desglose haberes */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Haberes calculados</h3>
        </div>
        <div className="px-4">
          <Fila label="Sueldo imponible (base + extras + bonos + grat.)" monto={resultado.totalImponible} />
          <Fila label="Movilización + Colación" monto={resultado.totalHaberes - resultado.totalImponible} />
          <Fila label="Total haberes" monto={resultado.totalHaberes} bold />
        </div>
      </div>

      {/* Desglose descuentos */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Descuentos calculados</h3>
        </div>
        <div className="px-4">
          <Fila label="AFP" monto={resultado.descAFP} negativo />
          <Fila label="Salud (Fonasa/Isapre)" monto={resultado.descSalud} negativo />
          <Fila label="AFC (trabajador)" monto={resultado.descAFC} negativo />
          <Fila label="Impuesto 2ª categoría" monto={resultado.descImpuesto} negativo />
          <Fila label="Total descuentos legales" monto={resultado.descAFP + resultado.descSalud + resultado.descAFC + resultado.descImpuesto} bold />
        </div>
      </div>

      {/* Comparación */}
      <div className="bg-gray-900 rounded-2xl p-5 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Liquidación calculada</span>
          <span className="text-white font-semibold tabular-nums">{fmt(resultado.totalLiquidoCalculado)}</span>
        </div>
        <div className="flex justify-between text-sm border-t border-gray-700 pt-3">
          <span className="text-gray-400">Monto recibido</span>
          <span className="text-white font-semibold tabular-nums">{fmt(resultado.montoRecibido)}</span>
        </div>
        <div className={`flex justify-between text-sm border-t pt-3 ${diferencia < -1000 ? "border-red-700" : "border-gray-700"}`}>
          <span className={diferencia < -1000 ? "text-red-400 font-medium" : "text-gray-400"}>Diferencia</span>
          <span className={`font-bold tabular-nums ${diferencia < -1000 ? "text-red-400" : "text-green-400"}`}>
            {diferencia >= 0 ? "+" : "−"}{fmt(Math.abs(diferencia))}
          </span>
        </div>
      </div>

      {/* Alertas */}
      {resultado.alertas.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Observaciones</p>
          {resultado.alertas.map((a, i) => (
            <p key={i} className="text-xs text-amber-800 leading-relaxed">• {a}</p>
          ))}
        </div>
      )}

      {/* CTA */}
      {emailRegistrado ? (
        <div className="border border-green-200 bg-green-50 rounded-xl p-5 space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✉️</span>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Tu cuenta fue creada</p>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Enviamos un enlace a <span className="font-medium text-gray-800">{emailRegistrado}</span>.
                Ingresa para subir tu liquidación y validar el informe completo.
              </p>
            </div>
          </div>
          <Link
            href="/login"
            className="block w-full text-center bg-green-700 hover:bg-green-800 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
          >
            Ir a mi portal →
          </Link>
        </div>
      ) : (
        <div className="border border-blue-200 bg-blue-50 rounded-xl p-5 space-y-3">
          <p className="text-sm text-gray-700 leading-relaxed">
            ¿Necesitas que un abogado laboral valide este resultado? Sube tu liquidación en formato PDF.
          </p>
          <Link
            href="/login"
            className="block w-full text-center bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
          >
            Subir liquidación →
          </Link>
        </div>
      )}

      <button
        onClick={onVolver}
        className="w-full border border-gray-200 hover:bg-gray-50 py-2.5 rounded-xl text-sm text-gray-500 transition-colors"
      >
        Nueva verificación
      </button>
    </div>
  );
}
