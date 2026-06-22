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

/* ── tipos ────────────────────────────────────────────────────────────── */
interface ItemAuditoria {
  label: string;
  esperado: number;
  declarado: number;
  diferencia: number;
  tasaEsperada: string;
}

interface Resultado {
  imponible: number;
  items: ItemAuditoria[];
  totalEsperado: number;
  totalDeclarado: number;
  totalDiferencia: number;
  alertas: string[];
  nulidad: boolean;
}

/* ── componente ───────────────────────────────────────────────────────── */
export default function FormularioCotizaciones() {
  const [paso, setPaso] = useState(1);

  // Paso 1 — Contrato + imponible
  const [tipoContrato, setTipoContrato] = useState<"indefinido" | "plazo" | "obra">("indefinido");
  const [sueldoImponible, setSueldoImponible] = useState("");

  // Paso 2 — AFP
  const [afpNombre, setAfpNombre] = useState("Capital");
  const [montoAFP, setMontoAFP] = useState("");

  // Paso 3 — Salud
  const [tipoSalud, setTipoSalud] = useState<"Fonasa" | "Isapre">("Fonasa");
  const [tieneCaja, setTieneCaja] = useState<boolean | null>(null);
  const [montoSalud, setMontoSalud] = useState("");

  // Paso 4 — AFC
  const [montoAFC, setMontoAFC] = useState("");

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
    const imponible = Number(sueldoImponible) || 0;
    const afpDeclarado = Number(montoAFP) || 0;
    const saludDeclarado = Number(montoSalud) || 0;
    const afcDeclarado = Number(montoAFC) || 0;

    // AFP esperado
    const afpEsperado = Math.round(imponible * (AFP_RATES[afpNombre] ?? 0.1127));
    const afpTasa = `${((AFP_RATES[afpNombre] ?? 0.1127) * 100).toFixed(2)}%`;

    // Salud esperada
    let saludEsperado = 0;
    let saludTasa = "7%";
    if (tipoSalud === "Fonasa") {
      const tasa = tieneCaja ? 0.028 : 0.07;
      saludEsperado = Math.round(imponible * tasa);
      saludTasa = tieneCaja ? "2,8% (con caja compensación)" : "7%";
    } else {
      // Isapre: el monto declarado es el correcto (no calculamos)
      saludEsperado = saludDeclarado;
      saludTasa = "Monto pactado";
    }

    // AFC esperado (trabajador)
    const afcEsperado = tipoContrato === "indefinido"
      ? Math.round(imponible * 0.006)
      : 0;
    const afcTasa = tipoContrato === "indefinido"
      ? "0,6% (indefinido)"
      : "0% (obra/plazo — solo empleador)";

    const items: ItemAuditoria[] = [
      {
        label: `AFP ${afpNombre}`,
        esperado: afpEsperado,
        declarado: afpDeclarado,
        diferencia: afpEsperado - afpDeclarado,
        tasaEsperada: afpTasa,
      },
      {
        label: `Salud (${tipoSalud})`,
        esperado: saludEsperado,
        declarado: saludDeclarado,
        diferencia: saludEsperado - saludDeclarado,
        tasaEsperada: saludTasa,
      },
      {
        label: "AFC (Seguro Cesantía)",
        esperado: afcEsperado,
        declarado: afcDeclarado,
        diferencia: afcEsperado - afcDeclarado,
        tasaEsperada: afcTasa,
      },
    ];

    const totalEsperado = afpEsperado + saludEsperado + afcEsperado;
    const totalDeclarado = afpDeclarado + saludDeclarado + afcDeclarado;
    const totalDiferencia = totalEsperado - totalDeclarado;

    const alertas: string[] = [];
    const nulidad = afpEsperado > 0 && afpDeclarado === 0;

    if (items.some((i) => Math.abs(i.diferencia) > 500)) {
      alertas.push("Se detectaron diferencias en las cotizaciones. Esto puede ser causal de nulidad del despido.");
    }
    if (nulidad) {
      alertas.push("No se declaró AFP. Si el empleador no cotizó, el despido puede ser nulo y corresponde pagar remuneraciones hasta regularizar.");
    }
    if (tipoContrato !== "indefinido" && afcDeclarado > 0) {
      alertas.push(
        "En contratos a plazo fijo u obra, el AFC lo paga el empleador (3%). No debe descontarse al trabajador. Solicita devolución."
      );
    }
    if (tieneCaja && tipoSalud === "Fonasa" && saludDeclarado > Math.round(imponible * 0.028) + 2000) {
      alertas.push(
        "Con caja de compensación, Fonasa corresponde al 2,8% (la caja aporta el resto). Verifica el descuento."
      );
    }

    return { imponible, items, totalEsperado, totalDeclarado, totalDiferencia, alertas, nulidad };
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
          resultado_total: Math.abs(res.totalDiferencia),
          datos_calculo: {
            tipo: "cotizaciones",
            tipoContrato,
            imponible: Number(sueldoImponible),
            diferencia: res.totalDiferencia,
            nulidad: res.nulidad,
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
              <select className={selectCls} value={afpNombre} onChange={(e) => setAfpNombre(e.target.value)}>
                {AFPS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
            {sueldoImponible && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-700">
                AFP esperado ({((AFP_RATES[afpNombre] ?? 0.1127) * 100).toFixed(2)}%):&nbsp;
                <span className="font-semibold">
                  {fmt(Math.round(Number(sueldoImponible) * (AFP_RATES[afpNombre] ?? 0.1127)))}
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
          </div>
          <div className="flex gap-3">
            <button onClick={retroceder} className={btnSecondary}>← Atrás</button>
            <button onClick={avanzar} className={btnPrimary}>Continuar →</button>
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

function ResultadoCotizaciones({
  resultado, emailRegistrado, onVolver,
}: {
  resultado: Resultado;
  emailRegistrado: string;
  onVolver: () => void;
}) {
  const correcto = Math.abs(resultado.totalDiferencia) <= 500;
  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className={`rounded-2xl p-6 text-center space-y-2 ${
          correcto ? "bg-green-50 border border-green-200" : resultado.nulidad ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"
        }`}
      >
        <p className={`text-xs font-semibold uppercase tracking-widest ${correcto ? "text-green-700" : resultado.nulidad ? "text-red-700" : "text-amber-700"}`}>
          {correcto ? "Cotizaciones al día" : resultado.nulidad ? "Nulidad del despido detectada" : "Errores en cotizaciones"}
        </p>
        <p className={`text-4xl font-extrabold leading-none ${correcto ? "text-green-800" : resultado.nulidad ? "text-red-800" : "text-amber-800"}`}>
          {correcto ? "✓" : resultado.nulidad ? "⚖️" : fmt(Math.abs(resultado.totalDiferencia))}
        </p>
        {!correcto && !resultado.nulidad && (
          <p className={`text-sm font-medium text-amber-600`}>diferencia total detectada</p>
        )}
        {resultado.nulidad && (
          <p className="text-sm font-medium text-red-600">No se declaró AFP → despido puede ser nulo</p>
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
