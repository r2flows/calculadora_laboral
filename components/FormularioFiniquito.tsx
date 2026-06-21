"use client";

import { useState } from "react";
import type { AFP, CausalDespido, TipoSalud } from "@/lib/calculos/tipos";
import { jornadaMaximaLegal, minimoLegalAplicable } from "@/lib/calculos/jornada";
import ResultadoFiniquito from "./ResultadoFiniquito";

function Tooltip({ text }: { text: string }) {
  return (
    <span className="relative group inline-block ml-1 align-middle">
      <span className="cursor-help text-gray-400 text-xs border border-gray-300 rounded-full w-4 h-4 inline-flex items-center justify-center hover:bg-gray-100 select-none">?</span>
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 bg-gray-800 text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-lg leading-relaxed">
        {text}
      </span>
    </span>
  );
}

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
  { titulo: "Contrato y término" },
  { titulo: "Remuneración y previsión" },
  { titulo: "Vacaciones" },
  { titulo: "Último mes" },
  { titulo: "Descuentos y extras" },
  { titulo: "Beneficios adicionales" },
  { titulo: "Tus datos" },
  { titulo: "Resultado" },
];

export default function FormularioFiniquito() {
  const [paso, setPaso] = useState(1);
  const [resultado, setResultado] = useState<Record<string, unknown> | null>(null);
  const [cargando, setCargando] = useState(false);

  // Datos de contacto — recopilados en paso 7 antes de mostrar el resultado
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");

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
  const [jornada, setJornada] = useState<"completa" | "parcial" | null>(null);
  const [horasSemana, setHorasSemana] = useState("30");

  const num = (v: string) => parseInt(v.replace(/\D/g, ""), 10) || 0;
  const fmt = (v: number) =>
    v.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

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

  async function calcularYRegistrar() {
    setCargando(true);
    try {
      const datosCalculo = {
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
        body: JSON.stringify(datosCalculo),
      });
      const json = await res.json();

      // Crear lead y cuenta en paralelo con la respuesta del cálculo
      fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          email: email || null,
          telefono: telefono || null,
          resultado_total: Math.round((json as Record<string, unknown>).totalConNulidad as number ?? 0),
          datos_calculo: {
            fechaInicio, fechaTermino, causal,
            sueldoBase: num(sueldoBase), movilizacion: num(movilizacion), colacion: num(colacion),
            afp, tipoSalud, montoIsapre: num(montoIsapre),
            recibeGratificacion,
            diasVacacionesAnuales: parseInt(diasVacaciones) || 15,
            diasVacacionesTomados: parseInt(diasVacacionesTomados) || 0,
            _resultado: json,
          },
        }),
      }).catch(() => { /* no bloquear si falla */ });

      setResultado(json);
      setPaso(8);
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
      {paso < 8 && (
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{PASOS[paso - 1]?.titulo}</span>
            <span>Paso {paso} de {PASOS.length - 1}</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full">
            <div
              className="h-1.5 bg-blue-600 rounded-full transition-all"
              style={{ width: `${((paso - 1) / (PASOS.length - 2)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* PASO 1: Contrato */}
      {paso === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Datos del contrato</h2>
          <div>
            <label className="block text-sm font-medium mb-1">
              Fecha de inicio (primer día trabajado)
              <Tooltip text="El primer día en que empezaste a trabajar o firmaste contrato. Lo encuentras en tu contrato o en la primera liquidación de sueldo." />
            </label>
            <input className={inputCls} type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Fecha de término (día del despido)
              <Tooltip text="El día en que te comunicaron el despido. Es la fecha que figura en la carta de aviso o en el finiquito que te entregaron." />
            </label>
            <input className={inputCls} type="date" value={fechaTermino} onChange={(e) => setFechaTermino(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Causal de término
              <Tooltip text="La razón legal del despido que figura en tu carta de aviso. Si no la tienes, elige la que mejor describe tu situación. Art. 161 es el más común en despidos por la empresa." />
            </label>
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

          {/* Jornada laboral — debe responderse primero */}
          {(() => {
            const jornadaMax = jornadaMaximaLegal(fechaTermino || new Date().toISOString().split("T")[0]);
            return (
              <div>
                <label className="block text-sm font-medium mb-1">
                  ¿Cuál es tu jornada laboral?
                  <Tooltip text={`La jornada máxima legal vigente a la fecha de tu despido es ${jornadaMax} horas semanales (Ley 21.561). Si trabajas menos horas, el mínimo legal se calcula en proporción.`} />
                </label>
                <div className="flex gap-3">
                  <button className={btnYN(jornada === "completa")} onClick={() => setJornada("completa")}>
                    Completa ({jornadaMax} hrs)
                  </button>
                  <button className={btnYN(jornada === "parcial")} onClick={() => setJornada("parcial")}>Parcial</button>
                </div>
                {jornada === "parcial" && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium mb-1">
                      Horas semanales pactadas en contrato
                      <Tooltip text={`Si trabajas más de 30 hrs semanales te corresponde el sueldo mínimo íntegro ($${minimoLegalAplicable(31, fechaTermino || new Date().toISOString().split("T")[0]).toLocaleString("es-CL")}). Si trabajas 30 hrs o menos, se calcula en proporción a las ${jornadaMax} hrs de jornada completa.`} />
                    </label>
                    <input
                      className={inputCls}
                      type="number"
                      placeholder="Ej: 30"
                      value={horasSemana}
                      onChange={(e) => setHorasSemana(e.target.value)}
                      min="1"
                      max={jornadaMax - 1}
                    />
                  </div>
                )}
              </div>
            );
          })()}

          {/* Resto del paso visible solo después de seleccionar jornada */}
          {jornada && (
          <>
          <div>
            <label className="block text-sm font-medium mb-1">
              Sueldo base mensual ($)
              <Tooltip text="El monto fijo mensual acordado en tu contrato, antes de descuentos. No incluyas bonos variables ni horas extra. Aparece en tus liquidaciones como 'Sueldo Base'." />
            </label>
            <input className={inputCls} type="number" placeholder="Ej: 800000" value={sueldoBase} onChange={(e) => setSueldoBase(e.target.value)} />
            {(() => {
              const fechaRef = fechaTermino || new Date().toISOString().split("T")[0];
              const horas = jornada === "completa"
                ? jornadaMaximaLegal(fechaRef)
                : (parseInt(horasSemana) || 30);
              const minimoLegal = minimoLegalAplicable(horas, fechaRef);
              const sueldo = num(sueldoBase);
              if (sueldo > 0 && sueldo < minimoLegal) {
                return (
                  <div className="mt-1 bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-700 space-y-0.5">
                    <p className="font-semibold">⚠️ Sueldo bajo el mínimo legal</p>
                    <p>Para una jornada de {horas} hrs/semana, el mínimo es <strong>{fmt(minimoLegal)}</strong>. El empleador podría enfrentar sanciones de la Inspección del Trabajo.</p>
                  </div>
                );
              }
              return null;
            })()}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              ¿Recibe gratificacion mensual?
              <Tooltip text="La gratificación es un beneficio obligatorio por ley equivalente al 25% del sueldo (tope $201.875/mes). Muchas empresas la pagan mensualmente junto con el sueldo." />
            </label>
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
            <label className="block text-sm font-medium mb-1">
              Movilización mensual ($)
              <Tooltip text="Monto mensual que la empresa te entrega para cubrir el traslado al trabajo. No forma parte del sueldo imponible si es razonable. Aparece en tu liquidación como 'Asig. Movilización'." />
            </label>
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
            <label className="block text-sm font-medium mb-1">
              Colación mensual ($)
              <Tooltip text="Monto mensual que la empresa te da para alimentación. No es cotizable si está dentro de rangos normales. Aparece en tu liquidación como 'Asig. Colación'." />
            </label>
            <input className={inputCls} type="number" placeholder="0" value={colacion} onChange={(e) => setColacion(e.target.value)} />
            {num(colacion) > 30000 && (
              <p className="text-red-600 text-xs mt-1">Advertencia: colacion supera $30.000 — posible evasion de cotizaciones.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              AFP
              <Tooltip text="La administradora de fondos de pensiones donde cotizas. Aparece en tus liquidaciones de sueldo. Si no recuerdas, puedes consultarlo en el sitio de la Superintendencia de Pensiones." />
            </label>
            <select className={inputCls} value={afp} onChange={(e) => setAfp(e.target.value as AFP)}>
              {AFPS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Salud
              <Tooltip text="Si cotizas en Fonasa (sistema público) o en una Isapre (sistema privado). Lo encuentras en tu liquidación de sueldo en el descuento de salud." />
            </label>
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
            <button className={btnPrimary} disabled={!jornada || !sueldoBase} onClick={avanzar}>Continuar</button>
          </div>
          </>
          )}
        </div>
      )}

      {/* PASO 3: Vacaciones */}
      {paso === 3 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Vacaciones</h2>
          <div>
            <label className="block text-sm font-medium mb-1">
              ¿Cuantos dias de vacaciones al año te corresponden?
              <Tooltip text="La ley establece un mínimo de 15 días hábiles. Si llevas más de 10 años trabajando en total (sumando todos tus empleos anteriores), puede ser más. Revisa tu contrato o consulta con RRHH." />
            </label>
            <input
              className={inputCls}
              type="number"
              value={diasVacaciones}
              onChange={(e) => {
                setDiasVacaciones(e.target.value);
                setTieneProgresivo(parseInt(e.target.value) > 15);
              }}
              min="15"
            />
            {parseInt(diasVacaciones) > 15 && (
              <p className="text-xs text-blue-600 mt-1">Feriado progresivo aplicado ({diasVacaciones} dias habiles).</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Dias habiles de vacaciones ya gozados durante el contrato
              <Tooltip text="Los días hábiles (lunes a viernes, sin feriados) de vacaciones que efectivamente disfrutaste en este trabajo. Se restan del proporcional que te corresponde al término. Si no recuerdas, pon 0 y se calculará a tu favor." />
            </label>
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
            <Tooltip text="Si te despidieron a mediados de mes, la empresa debe pagarte los días trabajados de ese mes. Si ya lo recibiste en tu último depósito, marca Sí. Si no, lo incluiremos en el cálculo." />
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
            <label className="block text-sm font-medium mb-1">
              ¿Recibio anticipo de sueldo? Monto ($) — deje en 0 si no
              <Tooltip text="Si recibiste un adelanto de sueldo durante el mes del despido, indícalo aquí. Se descontará del total a pagar porque ya lo recibiste." />
            </label>
            <input className={inputCls} type="number" placeholder="0" value={anticipo} onChange={(e) => setAnticipo(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Otros descuentos del mes ($)
              <Tooltip text="Cualquier descuento adicional del mes: cuota de crédito con la empresa, arriendo de casa patronal, etc. No incluyas AFP ni salud, esos se calculan automáticamente." />
            </label>
            <input className={inputCls} type="number" placeholder="0" value={otrosDescuentos} onChange={(e) => setOtrosDescuentos(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Horas extra permanentes por mes
              <Tooltip text="Las horas extra que realizas regularmente cada mes según pacto escrito con el empleador. Solo incluye las habituales, no las eventuales. Aumentan la base de cálculo de la indemnización." />
            </label>
            <input className={inputCls} type="number" placeholder="0" value={horasExtra} onChange={(e) => setHorasExtra(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Minutos extra permanentes por mes
              <Tooltip text="Los minutos adicionales que se suman a las horas extra permanentes. Por ejemplo, si trabajas 1 hora y 30 minutos extra, pon 1 hora y 30 minutos." />
            </label>
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
            <label className="block text-sm font-medium mb-1">
              Asignacion familiar (monto total mensual, $)
              <Tooltip text="Subsidio estatal que paga la empresa a trabajadores con cargas familiares reconocidas (hijos, cónyuge, etc.). No es parte del sueldo imponible y no afecta el cálculo de la indemnización. Si no la recibes, deja en 0." />
            </label>
            <p className="text-xs text-gray-500 mb-1">Este monto no es cotizable ni se usa para calcular el valor dia o feriado.</p>
            <input className={inputCls} type="number" placeholder="0" value={asignacionFamiliar} onChange={(e) => setAsignacionFamiliar(e.target.value)} />
          </div>
          <div className="flex gap-3 pt-2">
            <button className={btnSecondary} onClick={retroceder}>Atras</button>
            <button className={btnPrimary} onClick={avanzar}>
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* PASO 7: Datos de contacto */}
      {paso === 7 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-semibold">Casi listo</h2>
            <p className="text-sm text-gray-500 mt-1">
              Ingresa tus datos para ver el resultado y crear tu cuenta de seguimiento gratuita.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700 space-y-1">
            <p className="font-semibold">¿Por qué pedimos esto?</p>
            <p>Guardaremos tu estimación y podrás subir tus documentos para que nuestro equipo valide el monto exacto de tu causa.</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nombre completo *</label>
            <input
              className={inputCls}
              type="text"
              placeholder="Ej: Juan Pérez"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Correo electrónico</label>
            <input
              className={inputCls}
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">Recibirás un enlace directo para acceder a tu portal de seguimiento.</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Teléfono <span className="text-gray-400 font-normal">(opcional)</span></label>
            <input
              className={inputCls}
              type="tel"
              placeholder="+56 9 1234 5678"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button className={btnSecondary} onClick={retroceder}>Atrás</button>
            <button
              className={btnPrimary}
              onClick={calcularYRegistrar}
              disabled={cargando || !nombre.trim()}
            >
              {cargando ? "Calculando..." : "Ver mi resultado →"}
            </button>
          </div>
        </div>
      )}

      {/* PASO 8: Resultado */}
      {paso === 8 && resultado && (
        <ResultadoFiniquito
          resultado={resultado}
          fmt={fmt}
          emailRegistrado={email || undefined}
          onVolver={() => { setResultado(null); setPaso(1); setNombre(""); setEmail(""); setTelefono(""); }}
          datosCalculo={{
            fechaInicio,
            fechaTermino,
            causal,
            sueldoBase: num(sueldoBase),
            movilizacion: num(movilizacion),
            colacion: num(colacion),
            afp,
            tipoSalud,
            montoIsapre: num(montoIsapre),
            recibeGratificacion,
            diasVacacionesAnuales: parseInt(diasVacaciones) || 15,
            diasVacacionesTomados: parseInt(diasVacacionesTomados) || 0,
            _resultado: resultado,
          }}
        />
      )}
    </div>
  );
}
