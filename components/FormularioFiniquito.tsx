"use client";

import { useState } from "react";
import type { AFP, CausalDespido, TipoSalud } from "@/lib/calculos/tipos";
import ResultadoFiniquito from "./ResultadoFiniquito";

const CODIGO_ADMIN = process.env.NEXT_PUBLIC_ADMIN_CODE ?? "ADMIN2024";

const CAUSALES: { value: CausalDespido; label: string }[] = [
  { value: "art159_5", label: "Renuncia voluntaria" },
  { value: "art159_1", label: "Mutuo acuerdo" },
  { value: "art159_2", label: "Vencimiento de plazo" },
  { value: "art159_3", label: "Conclusión del trabajo" },
  { value: "art160", label: "Falta grave (Art. 160)" },
  { value: "art161", label: "Necesidades de la empresa (Art. 161)" },
  { value: "art161a", label: "Desahucio" },
  { value: "autodespido", label: "Autodespido" },
];

const AFPS: AFP[] = ["Capital", "Cuprum", "Habitat", "Modelo", "PlanVital", "Provida", "Uno"];

interface Paso {
  titulo: string;
  descripcion?: string;
}

const PASOS: Paso[] = [
  { titulo: "Identificación" },
  { titulo: "Contrato y término" },
  { titulo: "Remuneración y previsión" },
  { titulo: "Vacaciones" },
  { titulo: "Último mes" },
  { titulo: "Descuentos y extras" },
  { titulo: "Beneficios adicionales" },
  { titulo: "Resultado" },
];

export default function FormularioFiniquito() {
  const [paso, setPaso] = useState(0);
  const [esAdmin, setEsAdmin] = useState(false);
  const [codigoAdmin, setCodigoAdmin] = useState("");
  const [adminVerificado, setAdminVerificado] = useState(false);
  const [errorAdmin, setErrorAdmin] = useState(false);
  const [resultado, setResultado] = useState<Record<string, unknown> | null>(null);
  const [cargando, setCargando] = useState(false);

  // Campos del formulario
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaTermino, setFechaTermino] = useState("");
  const [causal, setCausal] = useState<CausalDespido>("art161");
  const [sueldoBase, setSueldoBase] = useState("");
  const [movilizacion, setMovilizacion] = useState("");
  const [colacion, setColacion] = useState("");
  const [afp, setAfp] = useState<AFP>("Habitat");
  const [tipoSalud, setTipoSalud] = useState<TipoSalud>("Fonasa");
  const [montoIsapre, setMontoIsapre] = useState("");
  const [recibeGratificacion, setRecibeGratificacion] = useState<boolean | null>(null);
  const [gratificacionFija, setGratificacionFija] = useState("");
  const [tieneProgresivo, setTieneProgresivo] = useState(false);
  const [diasVacaciones, setDiasVacaciones] = useState("15");
  const [diasVacacionesTomados, setDiasVacacionesTomados] = useState("0");
  const [reciboUltimoMes, setReciboUltimoMes] = useState<boolean | null>(null);
  const [anticipo, setAnticipo] = useState("");
  const [otrosDescuentos, setOtrosDescuentos] = useState("");
  const [horasExtra, setHorasExtra] = useState("");
  const [minutosExtra, setMinutosExtra] = useState("");
  const [asignacionFamiliar, setAsignacionFamiliar] = useState("");
  const [movilizacionAlerta, setMovilizacionAlerta] = useState<string | null>(null);
  const [viajaRegion, setViajaRegion] = useState<boolean | null>(null);
  const [empresaPagaPasajes, setEmpresaPagaPasajes] = useState<boolean | null>(null);

  const num = (v: string) => parseInt(v.replace(/\D/g, ""), 10) || 0;
  const fmt = (v: number) =>
    v.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

  function verificarAdmin() {
    if (codigoAdmin === CODIGO_ADMIN) {
      setAdminVerificado(true);
      setErrorAdmin(false);
      avanzar();
    } else {
      setErrorAdmin(true);
    }
  }

  function avanzar() {
    setPaso((p) => p + 1);
  }

  function retroceder() {
    setPaso((p) => p - 1);
  }

  function verificarMovilizacion(valor: string) {
    setMovilizacion(valor);
    const monto = num(valor);
    if (monto > 50000) {
      setMovilizacionAlerta("advertencia");
    } else if (monto > 25000) {
      setMovilizacionAlerta("aviso");
    } else {
      setMovilizacionAlerta(null);
    }
  }

  async function calcular() {
    setCargando(true);
    try {
      const datos = {
        esAdmin: adminVerificado,
        fechaInicio,
        fechaTermino,
        fechaConsulta: new Date().toISOString().split("T")[0],
        causal,
        sueldoBase: num(sueldoBase),
        movilizacion: num(movilizacion),
        colacion: num(colacion),
        otrosBonos: [],
        afp,
        tipoSalud,
        montoIsapre: num(montoIsapre),
        recibeGratificacion: recibeGratificacion ?? false,
        gratificacionMensualFija: num(gratificacionFija),
        tieneProgressivo: tieneProgresivo,
        diasVacacionesAnuales: parseInt(diasVacaciones) || 15,
        diasVacacionesTomados: parseInt(diasVacacionesTomados) || 0,
        reciboRemuneracionUltimoMes: reciboUltimoMes ?? true,
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
        body: JSON.stringify(datos),
      });
      const json = await res.json();
      setResultado(json);
      setPaso(7);
    } finally {
      setCargando(false);
    }
  }

  const inputCls =
    "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const btnPrimary =
    "bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50";
  const btnSecondary =
    "border border-gray-300 hover:bg-gray-100 px-6 py-2 rounded-lg transition-colors";
  const btnYN = (activo: boolean) =>
    `px-6 py-2 rounded-lg font-medium border transition-colors ${
      activo
        ? "bg-blue-700 text-white border-blue-700"
        : "border-gray-300 hover:bg-gray-50"
    }`;

  return (
    <div className="max-w-lg mx-auto">
      {/* Progreso */}
      {paso < 7 && (
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{PASOS[paso]?.titulo}</span>
            <span>Paso {paso + 1} de {PASOS.length - 1}</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full">
            <div
              className="h-1.5 bg-blue-600 rounded-full transition-all"
              style={{ width: `${((paso) / (PASOS.length - 2)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* PASO 0: Identificación */}
      {paso === 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Bienvenido</h2>
          <p className="text-gray-600 text-sm">¿Eres administrador del sistema?</p>
          <div className="flex gap-3">
            <button className={btnYN(esAdmin)} onClick={() => setEsAdmin(true)}>Sí</button>
            <button className={btnYN(!esAdmin)} onClick={() => { setEsAdmin(false); avanzar(); }}>No</button>
          </div>
          {esAdmin && (
            <div className="space-y-2">
              <input
                className={inputCls}
                type="password"
                placeholder="Código de administrador"
                value={codigoAdmin}
                onChange={(e) => setCodigoAdmin(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && verificarAdmin()}
              />
              {errorAdmin && <p className="text-red-600 text-sm">Código incorrecto.</p>}
              <button className={btnPrimary} onClick={verificarAdmin}>Ingresar</button>
            </div>
          )}
        </div>
      )}

      {/* PASO 1: Contrato */}
      {paso === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Datos del contrato</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Fecha de inicio (primer día trabajado)</label>
            <input className={inputCls} type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fecha de término (día del despido)</label>
            <input className={inputCls} type="date" value={fechaTermino} onChange={(e) => setFechaTermino(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Causal de término</label>
            <select className={inputCls} value={causal} onChange={(e) => setCausal(e.target.value as CausalDespido)}>
              {CAUSALES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button className={btnSecondary} onClick={retroceder}>Atrás</button>
            <button className={btnPrimary} disabled={!fechaInicio || !fechaTermino} onClick={avanzar}>Continuar</button>
          </div>
        </div>
      )}

      {/* PASO 2: Remuneración */}
      {paso === 2 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Remuneración y previsión</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Sueldo base mensual ($)</label>
            <input className={inputCls} type="number" placeholder="Ej: 800000" value={sueldoBase} onChange={(e) => setSueldoBase(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">¿Recibe gratificacion mensual?</label>
            <p className="text-xs text-gray-500 mb-1">La gratificacion legal es el 25% del sueldo base con tope de $201.875 mensual (4,75 IMM/12).</p>
            <div className="flex gap-3">
              <button className={btnYN(recibeGratificacion === true)} onClick={() => setRecibeGratificacion(true)}>Si</button>
              <button className={btnYN(recibeGratificacion === false)} onClick={() => setRecibeGratificacion(false)}>No</button>
            </div>
            {recibeGratificacion && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-500">Si la empresa paga un monto fijo distinto al legal, ingresselo. De lo contrario deje en 0 para calcular automaticamente.</p>
                <input className={inputCls} type="number" placeholder="0 = calcular automatico" value={gratificacionFija} onChange={(e) => setGratificacionFija(e.target.value)} />
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Movilización ($)</label>
            <input className={inputCls} type="number" placeholder="0" value={movilizacion} onChange={(e) => verificarMovilizacion(e.target.value)} />
            {movilizacionAlerta === "advertencia" && (
              <p className="text-red-600 text-xs mt-1">Advertencia: monto supera $50.000 — podria existir evasion de cotizaciones.</p>
            )}
            {movilizacionAlerta === "aviso" && (
              <div className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2 mt-1 space-y-2">
                <p>Movilizacion supera $25.000. ¿Debes viajar a otra region para trabajar?</p>
                <div className="flex gap-2">
                  <button className={btnYN(viajaRegion === true)} onClick={() => setViajaRegion(true)}>Si</button>
                  <button className={btnYN(viajaRegion === false)} onClick={() => setViajaRegion(false)}>No</button>
                </div>
                {viajaRegion && (
                  <>
                    <p>¿La empresa paga tus pasajes?</p>
                    <div className="flex gap-2">
                      <button className={btnYN(empresaPagaPasajes === true)} onClick={() => setEmpresaPagaPasajes(true)}>Si</button>
                      <button className={btnYN(empresaPagaPasajes === false)} onClick={() => setEmpresaPagaPasajes(false)}>No</button>
                    </div>
                    {empresaPagaPasajes && (
                      <p className="text-yellow-800 font-medium">Aviso: podria haber evasion de cotizaciones.</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Colacion ($)</label>
            <input className={inputCls} type="number" placeholder="0" value={colacion} onChange={(e) => setColacion(e.target.value)} />
            {num(colacion) > 30000 && (
              <p className="text-red-600 text-xs mt-1">Advertencia: colacion supera $30.000 — posible evasion de cotizaciones.</p>
            )}
          </div>
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
              <input className={`${inputCls} mt-2`} type="number" placeholder="Monto mensual Isapre ($)" value={montoIsapre} onChange={(e) => setMontoIsapre(e.target.value)} />
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button className={btnSecondary} onClick={retroceder}>Atras</button>
            <button className={btnPrimary} disabled={!sueldoBase} onClick={avanzar}>Continuar</button>
          </div>
        </div>
      )}

      {/* PASO 3: Vacaciones */}
      {paso === 3 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Vacaciones</h2>
          <div>
            <p className="text-sm text-gray-600 mb-2">¿Tiene feriado progresivo (mas de 15 dias de vacaciones)?</p>
            <div className="flex gap-3">
              <button className={btnYN(tieneProgresivo)} onClick={() => setTieneProgresivo(true)}>Si</button>
              <button className={btnYN(!tieneProgresivo)} onClick={() => setTieneProgresivo(false)}>No</button>
            </div>
            {tieneProgresivo && (
              <div className="mt-2">
                <label className="block text-sm font-medium mb-1">Dias de vacaciones anuales</label>
                <input className={inputCls} type="number" value={diasVacaciones} onChange={(e) => setDiasVacaciones(e.target.value)} min="15" />
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Dias habiles de vacaciones ya gozados durante el contrato</label>
            <p className="text-xs text-gray-500 mb-1">Ingrese 0 si no tomo vacaciones o no recuerda. Estos dias se descontaran del feriado proporcional.</p>
            <input className={inputCls} type="number" placeholder="0" value={diasVacacionesTomados} onChange={(e) => setDiasVacacionesTomados(e.target.value)} min="0" />
          </div>
          <div className="flex gap-3 pt-2">
            <button className={btnSecondary} onClick={retroceder}>Atras</button>
            <button className={btnPrimary} onClick={avanzar}>Continuar</button>
          </div>
        </div>
      )}

      {/* PASO 4: Último mes */}
      {paso === 4 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Pago del ultimo mes</h2>
          <p className="text-sm text-gray-600">
            ¿Ya le cancelaron la remuneracion de los dias trabajados el mes en que fue despedido?
          </p>
          <div className="flex gap-3">
            <button className={btnYN(reciboUltimoMes === true)} onClick={() => setReciboUltimoMes(true)}>Si</button>
            <button className={btnYN(reciboUltimoMes === false)} onClick={() => setReciboUltimoMes(false)}>No</button>
          </div>
          {reciboUltimoMes === false && (
            <p className="text-sm text-blue-700 bg-blue-50 p-2 rounded">
              Se incluira el pago de los dias trabajados ese mes con los descuentos legales correspondientes.
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <button className={btnSecondary} onClick={retroceder}>Atras</button>
            <button className={btnPrimary} disabled={reciboUltimoMes === null} onClick={avanzar}>Continuar</button>
          </div>
        </div>
      )}

      {/* PASO 5: Descuentos y horas extra */}
      {paso === 5 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Descuentos y horas extra</h2>
          <div>
            <label className="block text-sm font-medium mb-1">¿Recibio anticipo de sueldo? Monto ($) — deje en 0 si no</label>
            <input className={inputCls} type="number" placeholder="0" value={anticipo} onChange={(e) => setAnticipo(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Otros descuentos del mes ($)</label>
            <input className={inputCls} type="number" placeholder="0" value={otrosDescuentos} onChange={(e) => setOtrosDescuentos(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Horas extra permanentes por mes</label>
            <input className={inputCls} type="number" placeholder="0" value={horasExtra} onChange={(e) => setHorasExtra(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Minutos extra permanentes por mes</label>
            <input className={inputCls} type="number" placeholder="0" value={minutosExtra} onChange={(e) => setMinutosExtra(e.target.value)} />
          </div>
          <div className="flex gap-3 pt-2">
            <button className={btnSecondary} onClick={retroceder}>Atras</button>
            <button className={btnPrimary} onClick={avanzar}>Continuar</button>
          </div>
        </div>
      )}

      {/* PASO 6: Asignación familiar */}
      {paso === 6 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Beneficios adicionales</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Asignacion familiar (monto total mensual, $)</label>
            <p className="text-xs text-gray-500 mb-1">Este monto no es cotizable ni se usa para calcular el valor dia o feriado.</p>
            <input className={inputCls} type="number" placeholder="0" value={asignacionFamiliar} onChange={(e) => setAsignacionFamiliar(e.target.value)} />
          </div>
          <div className="flex gap-3 pt-2">
            <button className={btnSecondary} onClick={retroceder}>Atras</button>
            <button className={btnPrimary} onClick={calcular} disabled={cargando}>
              {cargando ? "Calculando..." : "Ver resultado"}
            </button>
          </div>
        </div>
      )}

      {/* PASO 7: Resultado */}
      {paso === 7 && resultado && (
        <ResultadoFiniquito
          resultado={resultado}
          esAdmin={adminVerificado}
          fmt={fmt}
          onVolver={() => { setResultado(null); setPaso(1); }}
        />
      )}
    </div>
  );
}
