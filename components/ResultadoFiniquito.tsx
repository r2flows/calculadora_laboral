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
      <div className="space-y-6">
        {showModal && (
          <LeadCaptureModal
            totalConNulidad={totalConNulidad}
            datosCalculo={datosCalculo ?? {}}
            onClose={() => setShowModal(false)}
          />
        )}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center space-y-3">
          <p className="text-sm text-green-700 font-medium uppercase tracking-wide">
            Podrías llegar a demandar al día de hoy por
          </p>
          <p className="text-4xl font-bold text-green-800">{fmt(totalConNulidad)}</p>
          {diasNulidad > 0 && (
            <p className="text-xs text-green-700 font-medium bg-green-100 rounded-lg px-3 py-1.5 inline-block">
              Incluye {diasNulidad} días de nulidad del despido
            </p>
          )}
          <p className="text-xs text-gray-500">
            Finiquito + indemnizaciones + todos los conceptos legales que te corresponden
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="w-full bg-blue-700 text-white py-3 rounded-xl font-semibold hover:bg-blue-800 transition-colors"
        >
          Quiero que me contacten
        </button>
        <button
          onClick={onVolver}
          className="w-full border border-gray-300 hover:bg-gray-50 py-2 rounded-lg text-sm transition-colors"
        >
          Hacer un nuevo calculo
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
