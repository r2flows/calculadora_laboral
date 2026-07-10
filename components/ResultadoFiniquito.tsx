"use client";

import Link from "next/link";
import { CAUSALES_V2 } from "@/lib/calculos/causales";

interface Props {
  resultado: Record<string, unknown>;
  fmt: (n: number) => string;
  onVolver: () => void;
  datosCalculo?: Record<string, unknown>;
  emailRegistrado?: string;
  /** ¿El usuario ya subió documentos (contrato/carta/finiquito/liquidación) en el wizard?
   * Mientras no haya documentos, se muestra solo el total y una advertencia de nulidad
   * sin desglose — el desglose completo con montos por ítem solo se revela una vez que
   * hay documentos que permitan confirmarlo. */
  tieneDocumentos?: boolean;
}

function num(v: unknown): number {
  return typeof v === "number" ? v : 0;
}

function Fila({
  label,
  detalle,
  monto,
  negativo = false,
  bold = false,
  fmt,
}: {
  label: string;
  detalle?: string;
  monto: number;
  negativo?: boolean;
  bold?: boolean;
  fmt: (n: number) => string;
}) {
  if (!monto) return null;
  return (
    <div className={`flex justify-between items-baseline py-2.5 border-b border-gray-100 last:border-0 ${bold ? "pt-3" : ""}`}>
      <div className="flex-1 pr-4">
        <span className={bold ? "font-semibold text-gray-800 text-sm" : "text-gray-600 text-sm"}>
          {label}
        </span>
        {detalle && (
          <span className="text-xs text-gray-400 ml-1.5">{detalle}</span>
        )}
      </div>
      <span
        className={`font-medium tabular-nums text-sm whitespace-nowrap ${
          negativo
            ? "text-red-600"
            : bold
            ? "text-gray-900 font-semibold"
            : "text-gray-700"
        }`}
      >
        {negativo ? "−" : ""}
        {fmt(Math.abs(monto))}
      </span>
    </div>
  );
}

const CAUSALES: Record<string, string> = Object.fromEntries(
  Object.entries(CAUSALES_V2).map(([value, meta]) => [value, meta.label])
);

export default function ResultadoFiniquito({
  resultado,
  fmt,
  onVolver,
  datosCalculo,
  emailRegistrado,
  tieneDocumentos = false,
}: Props) {
  const totalConNulidad       = num(resultado.totalConNulidad);
  const totalLiquido          = num(resultado.totalLiquido);
  const totalBruto            = num(resultado.totalBruto);
  const remUltimosDias        = num(resultado.remUltimosDias);
  const feriadoPropMonto      = num(resultado.feriadoProporcionalMonto);
  const feriadoPropDias       = num(resultado.feriadoProporcionalDias);
  const montoHorasExtra       = num(resultado.montoHorasExtra);
  // Indemnización, mes de aviso, recargo Art.168 y AFC empleador se agrupan en una sola
  // línea para el cliente: cada uno por separado implica una conclusión legal (causal
  // correcta o no, % de recargo) que un abogado debe confirmar antes de comunicarse
  // como un hecho — el detalle completo con cita legal solo se muestra en /admin.
  const indemnizacionTotal =
    num(resultado.indemnizacionAvisoPrevio) +
    num(resultado.indemnizacionAnosServicio) +
    num(resultado.montoRecargoArt168) +
    num(resultado.afcEmpleadorPendiente);
  const asignacionFamiliar    = num(resultado.asignacionFamiliar);
  const anticipoSueldo        = num(resultado.anticipoSueldo);
  const otrosDescuentos       = num(resultado.otrosDescuentos);
  const impuestoRenta         = num(resultado.impuestoRenta);
  const tributaImp            = resultado.tributaImpuesto === true;
  const diasNulidad           = num(resultado.diasNulidad);
  const montoNulidad          = num(resultado.montoNulidad);
  const mesesTrabajados       = num(resultado.mesesTrabajados);

  const causal = datosCalculo?.causal as string | undefined;
  const causalLabel = causal ? CAUSALES[causal] ?? causal : null;

  const tieneDescuentos = anticipoSueldo > 0 || otrosDescuentos > 0 || (tributaImp && impuestoRenta > 0);
  const hayNulidad = diasNulidad > 0;

  // Mientras no haya documentos que lo confirmen, el total mostrado NO incluye la
  // nulidad (Ley Bustos) — es una hipótesis legal, no un hecho, hasta que se revise el
  // certificado de cotizaciones. Se muestra aparte como advertencia, no como monto.
  const totalMostrado = tieneDocumentos ? totalConNulidad : totalLiquido;

  return (
    <div className="space-y-4">

      {/* ── Header total ── */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-2">
        <p className="text-xs text-green-700 font-semibold uppercase tracking-widest">
          Podrías llegar a demandar hoy por
        </p>
        <p className="text-4xl sm:text-5xl font-extrabold text-green-800 leading-none tabular-nums">
          {fmt(totalMostrado)}
        </p>
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          {mesesTrabajados > 0 && (
            <span className="text-xs text-green-700 bg-green-100 border border-green-200 rounded-full px-3 py-1 font-medium">
              {mesesTrabajados} meses trabajados
            </span>
          )}
          {causalLabel && (
            <span className="text-xs text-green-700 bg-green-100 border border-green-200 rounded-full px-3 py-1 font-medium">
              {causalLabel}
            </span>
          )}
        </div>
      </div>

      {!tieneDocumentos && (
        <>
          {hayNulidad && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">⚠️</span>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Posible nulidad del despido</p>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                    Según lo que respondiste, tu empleador podría no haber tenido tus cotizaciones al día —
                    eso puede darte derecho a un monto adicional. No lo incluimos en el total porque hay que
                    confirmarlo con tu certificado de cotizaciones. Sube tus documentos para revisar esto y
                    ver el monto exacto.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-900 rounded-2xl p-5 text-center space-y-1">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">
              Total estimado
            </p>
            <p className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums">
              {fmt(totalMostrado)}
            </p>
            <p className="text-xs text-gray-500">
              Estimación preliminar basada en los datos que ingresaste — un abogado revisará tu caso para confirmar el monto exacto.
            </p>
          </div>
        </>
      )}

      {tieneDocumentos && (
        <>
          {/* ── Desglose finiquito ── */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Desglose del finiquito
              </h3>
            </div>
            <div className="px-4">
              <Fila label="Remuneración pendiente (último mes)" monto={remUltimosDias} fmt={fmt} />
              <Fila
                label="Feriado proporcional"
                detalle={feriadoPropDias > 0 ? `${feriadoPropDias.toFixed(1)} días hábiles` : undefined}
                monto={feriadoPropMonto}
                fmt={fmt}
              />
              <Fila label="Horas extra" monto={montoHorasExtra} fmt={fmt} />
              <Fila
                label="Indemnización por término de contrato"
                detalle="incluye indemnización, recargos y aportes que correspondan"
                monto={indemnizacionTotal}
                fmt={fmt}
              />
              <Fila label="Asignación familiar" monto={asignacionFamiliar} fmt={fmt} />

              <Fila label="Total bruto" monto={totalBruto} bold fmt={fmt} />

              {tieneDescuentos && (
                <>
                  <Fila label="Anticipo de sueldo" monto={anticipoSueldo} negativo fmt={fmt} />
                  <Fila label="Otros descuentos" monto={otrosDescuentos} negativo fmt={fmt} />
                  {tributaImp && (
                    <Fila label="Impuesto 2ª categoría" monto={impuestoRenta} negativo fmt={fmt} />
                  )}
                </>
              )}

              <Fila label="Total líquido finiquito" monto={totalLiquido} bold fmt={fmt} />
            </div>
          </div>

          {hayNulidad && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">⚖️</span>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Nulidad del despido</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    Tu empleador acumula {diasNulidad} días sin pagar cotizaciones previsionales. La ley obliga a pagarte una remuneración adicional por cada uno.
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center bg-white rounded-xl px-4 py-3 border border-blue-100">
                <span className="text-sm text-gray-600">{diasNulidad} días × valor diario</span>
                <span className="font-semibold text-blue-700 tabular-nums">{fmt(montoNulidad)}</span>
              </div>
            </div>
          )}

          <div className="bg-gray-900 rounded-2xl p-5 text-center space-y-1">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">
              {hayNulidad ? "Total con nulidad del despido" : "Total estimado"}
            </p>
            <p className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums">
              {fmt(totalMostrado)}
            </p>
            <p className="text-xs text-gray-500">
              Estimación basada en los datos y documentos que ingresaste — un abogado confirmará el monto final.
            </p>
          </div>
        </>
      )}

      {/* ── CTA ── */}
      {emailRegistrado ? (
        <div className="border border-green-200 bg-green-50 rounded-xl p-5 space-y-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✉️</span>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Tu cuenta fue creada</p>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Enviamos un enlace de acceso a{" "}
                <span className="font-medium text-gray-800">{emailRegistrado}</span>.
                Úsalo para ingresar, subir tus documentos y validar el monto exacto.
              </p>
            </div>
          </div>
          <div className="space-y-2 text-xs text-gray-600">
            {[
              { icon: "📄", text: "Sube tu liquidación y finiquito en PDF" },
              { icon: "🤖", text: "Extraemos los datos automáticamente con IA" },
              { icon: "📊", text: "Ve el desglose exacto y el estado de tu causa" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-start gap-2">
                <span className="flex-shrink-0">{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
          <Link
            href="/login"
            className="block w-full text-center bg-green-700 hover:bg-green-800 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
          >
            Ir a mi portal →
          </Link>
          <p className="text-center text-xs text-gray-400">¿No llegó el email? Revisa la carpeta de spam.</p>
        </div>
      ) : (
        <div className="border border-blue-200 bg-blue-50 rounded-xl p-5 space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            Accede a tu portal para subir tus documentos y que validemos el monto exacto de tu demanda.
          </p>
          <Link
            href="/login"
            className="block w-full text-center bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
          >
            Acceder a mi portal →
          </Link>
        </div>
      )}

      <button
        onClick={onVolver}
        className="w-full border border-gray-200 hover:bg-gray-50 py-2.5 rounded-xl text-sm text-gray-500 transition-colors"
      >
        Hacer un nuevo cálculo
      </button>
    </div>
  );
}
