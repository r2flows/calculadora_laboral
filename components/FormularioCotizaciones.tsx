"use client";

import { useState } from "react";
import Link from "next/link";
import type { AFP, ContratoTipo, TipoSalud } from "@/lib/calculos/tipos";
import {
  calcularAuditoriaCotizaciones,
  type ResultadoAuditoriaCotizaciones,
} from "@/lib/calculos/auditoriaCotizaciones";

/* ── constantes ───────────────────────────────────────────────────────── */
const AFPS: AFP[] = ["Capital", "Cuprum", "Habitat", "Modelo", "PlanVital", "Provida", "Uno"];

// Tasas AFP solo para el texto informativo en vivo mientras se completa el formulario
// (el cálculo real, con tasas vigentes por fecha, ocurre en calcularAuditoriaCotizaciones).
const AFP_RATES_REFERENCIA: Record<AFP, number> = {
  Capital: 0.1127,
  Cuprum: 0.1144,
  Habitat: 0.1127,
  Modelo: 0.1058,
  PlanVital: 0.1116,
  Provida: 0.1145,
  Uno: 0.1069,
};

// Mapeo entre las etiquetas de UI y el ContratoTipo del motor de cálculo.
const CONTRATO_TIPO_MAP: Record<"indefinido" | "plazo" | "obra", ContratoTipo> = {
  indefinido: "indefinido",
  plazo: "plazo_fijo",
  obra: "obra_faena",
};

const fmt = (n: number) =>
  n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

const inputCls =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500";
const selectCls = inputCls;
const btnPrimary =
  "flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors";
const btnSecondary =
  "flex-1 border border-gray-300 hover:bg-gray-50 py-3 rounded-xl text-sm text-gray-600 transition-colors";

const PASOS = ["Contrato", "AFP", "Salud", "AFC", "Tus datos", "Resultado"];

/* ── componente ───────────────────────────────────────────────────────── */
export default function FormularioCotizaciones() {
  const [paso, setPaso] = useState(1);

  // Paso 1 — Contrato + imponible
  const [tipoContrato, setTipoContrato] = useState<"indefinido" | "plazo" | "obra">("indefinido");
  const [sueldoImponible, setSueldoImponible] = useState("");

  // Paso 2 — AFP
  const [afpNombre, setAfpNombre] = useState<AFP>("Capital");
  const [montoAFP, setMontoAFP] = useState("");

  // Paso 3 — Salud
  const [tipoSalud, setTipoSalud] = useState<TipoSalud>("Fonasa");
  const [tieneCaja, setTieneCaja] = useState<boolean | null>(null);
  const [montoSalud, setMontoSalud] = useState("");

  // Paso 4 — AFC + despido
  const [montoAFC, setMontoAFC] = useState("");
  const [fueDespedido, setFueDespedido] = useState<boolean | null>(null);
  const [fechaDespido, setFechaDespido] = useState("");

  // Paso 5 — Lead
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");

  const [resultado, setResultado] = useState<ResultadoAuditoriaCotizaciones | null>(null);
  const [emailRegistrado, setEmailRegistrado] = useState("");
  const [enviando, setEnviando] = useState(false);

  /* ── navegación ─────────────────────────────────────────────────────── */
  function avanzar() { setPaso((p) => p + 1); }
  function retroceder() { setPaso((p) => p - 1); }

  /* ── calcular ────────────────────────────────────────────────────────── */
  function calcular(): ResultadoAuditoriaCotizaciones {
    return calcularAuditoriaCotizaciones({
      contratoTipo: CONTRATO_TIPO_MAP[tipoContrato],
      sueldoImponible: Number(sueldoImponible) || 0,
      afp: afpNombre,
      montoAfpDeclarado: Number(montoAFP) || 0,
      tipoSalud,
      tieneCaja: tieneCaja ?? false,
      montoSaludDeclarado: Number(montoSalud) || 0,
      montoAfcDeclarado: Number(montoAFC) || 0,
      fueDespedido: fueDespedido ?? false,
      fechaDespido: fechaDespido || undefined,
    });
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
          resultado_total: Math.abs(res.totalDiferencia) + res.montoNulidad,
          datos_calculo: {
            tipo: "cotizaciones",
            tipoContrato,
            imponible: Number(sueldoImponible),
            diferencia: res.totalDiferencia,
            nulidad: res.hayNulidad,
            montoNulidad: res.montoNulidad,
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
    setSueldoImponible(""); setMontoAFP(""); setMontoSalud(""); setMontoAFC("");
    setTipoContrato("indefinido"); setAfpNombre("Capital"); setTipoSalud("Fonasa"); setTieneCaja(null);
    setFueDespedido(null); setFechaDespido("");
    setNombre(""); setEmail(""); setTelefono("");
    setResultado(null); setEmailRegistrado("");
  }

  /* ── render ──────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* Barra de progreso */}
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

      {/* ── Paso 1: Contrato + Imponible ── */}
      {paso === 1 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Datos del contrato</h2>
            <p className="text-sm text-gray-500 mt-0.5">El tipo de contrato define las tasas de cotización</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de contrato</label>
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
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Sueldo imponible <span className="text-gray-400 font-normal">(base + bonos + extras — sin movilización ni colación)</span>
              </label>
              <input
                type="number"
                inputMode="numeric"
                className={inputCls}
                placeholder="Ej: 850000"
                value={sueldoImponible}
                onChange={(e) => setSueldoImponible(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={avanzar}
            disabled={!sueldoImponible}
            className={`${btnPrimary} disabled:opacity-40 w-full`}
          >
            Continuar →
          </button>
        </div>
      )}

      {/* ── Paso 2: AFP ── */}
      {paso === 2 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">AFP</h2>
            <p className="text-sm text-gray-500 mt-0.5">¿A cuál AFP cotizas y cuánto te descontaron?</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">AFP</label>
              <select className={selectCls} value={afpNombre} onChange={(e) => setAfpNombre(e.target.value as AFP)}>
                {AFPS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
            {sueldoImponible && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-700">
                AFP esperado ({((AFP_RATES_REFERENCIA[afpNombre] ?? 0.1127) * 100).toFixed(2)}%):&nbsp;
                <span className="font-semibold">
                  {fmt(Math.round(Number(sueldoImponible) * (AFP_RATES_REFERENCIA[afpNombre] ?? 0.1127)))}
                </span>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Monto AFP en tu liquidación</label>
              <input
                type="number"
                inputMode="numeric"
                className={inputCls}
                placeholder="Según tu liquidación"
                value={montoAFP}
                onChange={(e) => setMontoAFP(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={retroceder} className={btnSecondary}>← Atrás</button>
            <button
              onClick={avanzar}
              disabled={!montoAFP}
              className={`${btnPrimary} disabled:opacity-40`}
            >
              Continuar →
            </button>
          </div>
        </div>
      )}

      {/* ── Paso 3: Salud ── */}
      {paso === 3 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Salud</h2>
            <p className="text-sm text-gray-500 mt-0.5">Sistema de salud y descuento declarado</p>
          </div>
          <div className="space-y-4">
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
            {tipoSalud === "Fonasa" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  ¿Tu empleador tiene caja de compensación?
                </label>
                <div className="flex gap-3">
                  {([true, false] as const).map((v) => (
                    <button
                      key={String(v)}
                      onClick={() => setTieneCaja(v)}
                      className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                        tieneCaja === v
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {v ? "Sí" : "No"}
                    </button>
                  ))}
                </div>
                {tieneCaja !== null && sueldoImponible && (
                  <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-700">
                    Fonasa esperado ({tieneCaja ? "2,8% con caja" : "7%"}):&nbsp;
                    <span className="font-semibold">
                      {fmt(Math.round(Number(sueldoImponible) * (tieneCaja ? 0.028 : 0.07)))}
                    </span>
                  </div>
                )}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Monto salud en tu liquidación</label>
              <input
                type="number"
                inputMode="numeric"
                className={inputCls}
                placeholder="Según tu liquidación"
                value={montoSalud}
                onChange={(e) => setMontoSalud(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={retroceder} className={btnSecondary}>← Atrás</button>
            <button
              onClick={avanzar}
              disabled={!montoSalud || (tipoSalud === "Fonasa" && tieneCaja === null)}
              className={`${btnPrimary} disabled:opacity-40`}
            >
              Continuar →
            </button>
          </div>
        </div>
      )}

      {/* ── Paso 4: AFC ── */}
      {paso === 4 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">AFC — Seguro de Cesantía</h2>
            <p className="text-sm text-gray-500 mt-0.5">¿Cuánto aparece descontado en tu liquidación?</p>
          </div>
          <div className="space-y-4">
            {sueldoImponible && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-700">
                {tipoContrato === "indefinido" ? (
                  <>AFC esperado (0,6%): <span className="font-semibold">{fmt(Math.round(Number(sueldoImponible) * 0.006))}</span></>
                ) : (
                  <>En contrato a plazo/obra el <span className="font-semibold">AFC lo paga el empleador</span> — no debe descontarse al trabajador.</>
                )}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Monto AFC en tu liquidación <span className="text-gray-400 font-normal">(0 si no aparece)</span>
              </label>
              <input
                type="number"
                inputMode="numeric"
                className={inputCls}
                placeholder="0"
                value={montoAFC}
                onChange={(e) => setMontoAFC(e.target.value)}
              />
            </div>
            <div className="pt-2 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">¿Fuiste despedido de este trabajo?</label>
              <div className="flex gap-3">
                {([true, false] as const).map((v) => (
                  <button
                    key={String(v)}
                    onClick={() => setFueDespedido(v)}
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      fueDespedido === v
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {v ? "Sí" : "No, sigo trabajando ahí"}
                  </button>
                ))}
              </div>
              {fueDespedido && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha del despido</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={fechaDespido}
                    onChange={(e) => setFechaDespido(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Si hay diferencias en tus cotizaciones, calculamos cuánto te corresponde por nulidad del despido.
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={retroceder} className={btnSecondary}>← Atrás</button>
            <button
              onClick={avanzar}
              disabled={fueDespedido === true && !fechaDespido}
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
      {paso === 6 && resultado && (
        <ResultadoCotizaciones resultado={resultado} emailRegistrado={emailRegistrado} onVolver={reiniciar} />
      )}
    </div>
  );
}

/* ── ResultadoCotizaciones ────────────────────────────────────────────── */
function ItemFila({ item }: { item: { label: string; esperado: number; declarado: number; diferencia: number; tasaEsperada: string } }) {
  const ok = Math.abs(item.diferencia) <= 500;
  return (
    <div className={`rounded-xl border p-4 space-y-2 ${ok ? "border-gray-200 bg-white" : "border-red-200 bg-red-50"}`}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-800">{item.label}</span>
        {ok ? (
          <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">✓ Correcto</span>
        ) : (
          <span className="text-xs font-semibold text-red-600 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full">⚠ Error</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-500">Esperado ({item.tasaEsperada})</span>
          <p className="font-semibold text-gray-800 mt-0.5 tabular-nums">{fmt(item.esperado)}</p>
        </div>
        <div>
          <span className="text-gray-500">Declarado en liquidación</span>
          <p className={`font-semibold mt-0.5 tabular-nums ${ok ? "text-gray-800" : "text-red-700"}`}>{fmt(item.declarado)}</p>
        </div>
      </div>
      {!ok && (
        <p className="text-xs text-red-600 font-medium">
          Diferencia: {item.diferencia > 0 ? "cotizaron de menos" : "cotizaron de más"} — {fmt(Math.abs(item.diferencia))}
        </p>
      )}
    </div>
  );
}

export function ResultadoCotizaciones({
  resultado, emailRegistrado, onVolver,
}: {
  resultado: ResultadoAuditoriaCotizaciones;
  emailRegistrado: string;
  onVolver: () => void;
}) {
  const correcto = Math.abs(resultado.totalDiferencia) <= 500;
  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className={`rounded-2xl p-6 text-center space-y-2 ${
          correcto ? "bg-green-50 border border-green-200" : resultado.hayNulidad ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"
        }`}
      >
        <p className={`text-xs font-semibold uppercase tracking-widest ${correcto ? "text-green-700" : resultado.hayNulidad ? "text-red-700" : "text-amber-700"}`}>
          {correcto ? "Cotizaciones al día" : resultado.hayNulidad ? "Nulidad del despido detectada" : "Errores en cotizaciones"}
        </p>
        <p className={`text-4xl font-extrabold leading-none ${correcto ? "text-green-800" : resultado.hayNulidad ? "text-red-800" : "text-amber-800"}`}>
          {correcto ? "✓" : resultado.hayNulidad ? fmt(resultado.montoNulidad) : fmt(Math.abs(resultado.totalDiferencia))}
        </p>
        {!correcto && !resultado.hayNulidad && (
          <p className={`text-sm font-medium text-amber-600`}>diferencia total detectada</p>
        )}
        {resultado.hayNulidad && (
          <p className="text-sm font-medium text-red-600">
            {resultado.diasNulidad} días sin cotizar correctamente desde el despido
          </p>
        )}
      </div>

      {/* Detalle por cotización */}
      <div className="space-y-3">
        {resultado.items.map((item) => (
          <ItemFila key={item.label} item={item} />
        ))}
      </div>

      {/* Alertas */}
      {resultado.alertas.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1.5">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Observaciones importantes</p>
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
                Ingresa para subir tus planillas y que un abogado valide el resultado.
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
            ¿Quieres que un abogado laboral valide estas cotizaciones con tus planillas reales?
          </p>
          <Link
            href="/login"
            className="block w-full text-center bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
          >
            Subir planillas →
          </Link>
        </div>
      )}

      <button
        onClick={onVolver}
        className="w-full border border-gray-200 hover:bg-gray-50 py-2.5 rounded-xl text-sm text-gray-500 transition-colors"
      >
        Nueva revisión
      </button>
    </div>
  );
}
