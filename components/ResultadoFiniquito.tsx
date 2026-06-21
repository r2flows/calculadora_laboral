"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const LeadCaptureModal = dynamic(() => import("./LeadCaptureModal"), { ssr: false });

interface Props {
  resultado: Record<string, unknown>;
  fmt: (n: number) => string;
  onVolver: () => void;
  datosCalculo?: Record<string, unknown>;
}

function num(v: unknown): number {
  return typeof v === "number" ? v : 0;
}

export default function ResultadoFiniquito({ resultado, fmt, onVolver, datosCalculo }: Props) {
  const totalConNulidad = num(resultado.totalConNulidad);
  const diasNulidad = num(resultado.diasNulidad);
  const [showModal, setShowModal] = useState(false);

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

