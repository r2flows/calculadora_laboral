"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const LeadCaptureModal = dynamic(() => import("./LeadCaptureModal"), { ssr: false });

interface Props {
  resultado: Record<string, unknown>;
  esAdmin: boolean;
  fmt: (n: number) => string;
  onVolver: () => void;
  datosCalculo?: Record<string, unknown>;
}

function num(v: unknown): number {
  return typeof v === "number" ? v : 0;
}

export default function ResultadoFiniquito({ resultado, esAdmin, fmt, onVolver, datosCalculo }: Props) {
  const totalConNulidad = num(resultado.totalConNulidad);
  const totalLiquido = num(resultado.totalLiquido);
  const diasNulidad = num(resultado.diasNulidad);
  const [showModal, setShowModal] = useState(false);

  if (!esAdmin) {
    return (
      <div className="space-y-4">
        {showModal && (
          <LeadCaptureModal
            totalConNulidad={totalConNulidad}
            datosCalculo={datosCalculo ?? {}}
            onClose={() => setShowModal(false)}
          />
        )}

        {/* Resultado */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center space-y-3">
          <p className="text-xs text-green-700 font-semibold uppercase tracking-widest">
            Podrías llegar a demandar al día de hoy por
          </p>
          <p className="text-5xl font-extrabold text-green-800 leading-none">{fmt(totalConNulidad)}</p>
          {diasNulidad > 0 && (
            <span className="inline-block text-xs text-green-700 font-medium bg-green-100 border border-green-200 rounded-full px-3 py-1">
              Incluye {diasNulidad} días de nulidad del despido
            </span>
          )}
          <p className="text-xs text-gray-500">
            Finiquito + indemnizaciones + todos los conceptos legales
          </p>
        </div>

        {/* CTA cuenta */}
        <div className="border border-blue-200 bg-blue-50 rounded-xl p-5 space-y-4">
          <div>
            <p className="font-semibold text-gray-800 text-sm leading-snug">
              Este es un cálculo estimado basado en los datos que ingresaste.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Crea tu cuenta gratuita, sube tus documentos y verificamos el monto exacto con tu liquidación real.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-1.5">
            {[
              { icon: "📄", text: "Sube tu liquidación de sueldo y finiquito en PDF" },
              { icon: "🤖", text: "Extraemos los datos automáticamente con IA" },
              { icon: "📊", text: "Ve el desglose exacto y el estado de tu causa en tu portal" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-start gap-2 text-xs text-gray-600">
                <span className="mt-0.5 flex-shrink-0">{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl font-semibold text-sm transition-colors shadow-sm"
          >
            Crear mi cuenta gratis →
          </button>
          <p className="text-center text-xs text-gray-400">Sin costo · Recibes un email para activar tu acceso</p>
        </div>

        <button
          onClick={onVolver}
          className="w-full border border-gray-200 hover:bg-gray-50 py-2 rounded-lg text-sm text-gray-500 transition-colors"
        >
          Hacer un nuevo cálculo
        </button>
      </div>
    );
  }

  // Vista administrador — desglose completo
  const alertas = Array.isArray(resultado.alertas) ? (resultado.alertas as string[]) : [];
  const cotiz = (resultado.cotizacionesUltimosDias as Record<string, number>) ?? {};

  return (
    <div className="space-y-6">
      {alertas.length > 0 && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-4 space-y-1">
          <p className="font-semibold text-red-700 text-sm">Alertas internas</p>
          {alertas.map((a, i) => (
            <p key={i} className="text-xs text-red-700">{a}</p>
          ))}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 text-sm">
        <Row label="Meses trabajados" value={`${num(resultado.mesesTrabajados)} meses ${num(resultado.diasTrabajados)} dias`} />
        <Row label="Remuneracion imponible mensual" value={fmt(num(resultado.remuneracionImponibleTotal))} />
        {num(resultado.gratificacionMensual) > 0 && (
          <Row label="  · Gratificacion mensual incluida" value={fmt(num(resultado.gratificacionMensual))} muted />
        )}
        {num(resultado.remUltimosDias) > 0 && (
          <>
            <Row label="Remuneracion ultimos dias (liquido)" value={fmt(num(resultado.remUltimosDias))} />
            <Row label="  · AFP descontado" value={fmt(cotiz.afp ?? 0)} muted />
            <Row label="  · Salud descontado" value={fmt(cotiz.salud ?? 0)} muted />
            <Row label="  · AFC descontado" value={fmt(cotiz.afc ?? 0)} muted />
          </>
        )}
        {num(resultado.feriadoProporcionalDiasDescontados) > 0 ? (
          <Row
            label={`Feriado proporcional (${num(resultado.feriadoProporcionalDiasCalculados)} calculados − ${num(resultado.feriadoProporcionalDiasDescontados)} gozados = ${num(resultado.feriadoProporcionalDias)} dias habiles)`}
            value={fmt(num(resultado.feriadoProporcionalMonto))}
          />
        ) : (
          <Row label={`Feriado proporcional (${num(resultado.feriadoProporcionalDias)} dias habiles)`} value={fmt(num(resultado.feriadoProporcionalMonto))} />
        )}
        {num(resultado.indemnizacionAvisoPrevio) > 0 && (
          <Row label="Indemnizacion aviso previo" value={fmt(num(resultado.indemnizacionAvisoPrevio))} />
        )}
        {num(resultado.indemnizacionAnosServicio) > 0 && (
          <Row label="Indemnizacion anos de servicio" value={fmt(num(resultado.indemnizacionAnosServicio))} />
        )}
        {num(resultado.asignacionFamiliar) > 0 && (
          <Row label="Asignacion familiar (no cotizable)" value={fmt(num(resultado.asignacionFamiliar))} />
        )}
        {!!resultado.tributaImpuesto && (
          <Row
            label={`(-) Impuesto 2a categoria (base neta ${fmt(num(resultado.baseImpuesto))})`}
            value={`-${fmt(num(resultado.impuestoRenta))}`}
            negative
          />
        )}
        {num(resultado.anticipoSueldo) > 0 && (
          <Row label="(-) Anticipo de sueldo" value={`-${fmt(num(resultado.anticipoSueldo))}`} negative />
        )}
        {num(resultado.otrosDescuentos) > 0 && (
          <Row label="(-) Otros descuentos" value={`-${fmt(num(resultado.otrosDescuentos))}`} negative />
        )}
        <Row label="Total liquido (sin nulidad)" value={fmt(totalLiquido)} bold />
        <Row label={`Nulidad del despido (${diasNulidad} dias)`} value={fmt(num(resultado.montoNulidad))} />
        <Row label="TOTAL CON NULIDAD" value={fmt(totalConNulidad)} bold highlight />
      </div>

      <button
        onClick={onVolver}
        className="w-full border border-gray-300 hover:bg-gray-50 py-2 rounded-lg text-sm transition-colors"
      >
        Nuevo calculo
      </button>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  highlight,
  negative,
  muted,
}: {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: boolean;
  negative?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex justify-between items-center px-4 py-2 ${
        highlight ? "bg-green-50" : ""
      }`}
    >
      <span className={`${bold ? "font-semibold" : ""} ${muted ? "text-gray-400" : "text-gray-700"}`}>
        {label}
      </span>
      <span
        className={`${bold ? "font-semibold" : ""} ${
          highlight ? "text-green-700 font-bold text-base" : ""
        } ${negative ? "text-red-600" : ""} ${muted ? "text-gray-400" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
