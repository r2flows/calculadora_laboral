"use client";

import { useState } from "react";
import type { DocTipo, DatosExtraidos } from "@/lib/extraccion/tipos";

export interface DocSubido {
  tipo: DocTipo;
  nombre: string;
  base64: string;
  mediaType: string;
}

const TIPOS_POR_FLUJO: Record<"finiquito" | "liquidacion" | "cotizaciones", { value: DocTipo; label: string }[]> = {
  finiquito: [
    { value: "contrato", label: "Contrato de trabajo" },
    { value: "anexo", label: "Anexo de contrato" },
    { value: "carta_aviso", label: "Carta de aviso de despido" },
    { value: "finiquito", label: "Finiquito firmado" },
  ],
  liquidacion: [
    { value: "liquidacion", label: "Liquidación de sueldo" },
    { value: "transferencia", label: "Comprobante de transferencia" },
  ],
  cotizaciones: [
    { value: "liquidacion", label: "Liquidación de sueldo" },
  ],
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface Props {
  flujo: "finiquito" | "liquidacion" | "cotizaciones";
  onExtracted: (datos: DatosExtraidos, docs: DocSubido[]) => void;
  onSkip: () => void;
}

export default function DocumentUploadStep({ flujo, onExtracted, onSkip }: Props) {
  const tipos = TIPOS_POR_FLUJO[flujo];
  const [modo, setModo] = useState<"manual" | "archivos">("manual");
  const [docs, setDocs] = useState<Record<string, DocSubido | null>>({});
  const [extrayendo, setExtrayendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function agregarArchivo(tipo: DocTipo, file: File) {
    const base64 = await fileToBase64(file);
    setDocs((prev) => ({ ...prev, [tipo]: { tipo, nombre: file.name, base64, mediaType: file.type } }));
  }

  const docsListos = Object.values(docs).filter((d): d is DocSubido => d !== null);

  async function extraer() {
    if (docsListos.length === 0) return;
    setExtrayendo(true);
    setError(null);
    try {
      const resp = await fetch("/api/extraccion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentos: docsListos.map((d) => ({ tipo: d.tipo, base64: d.base64, mediaType: d.mediaType })),
        }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error ?? "No se pudo leer el documento");
      onExtracted(json.datos as DatosExtraidos, docsListos);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar los documentos");
    } finally {
      setExtrayendo(false);
    }
  }

  const inputCls =
    "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const btnPrimary =
    "flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-40";
  const btnSecondary =
    "flex-1 border border-gray-300 hover:bg-gray-50 py-3 rounded-xl text-sm text-gray-600 transition-colors";
  const tabCls = (activo: boolean) =>
    `flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
      activo ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
    }`;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">¿Cómo quieres ingresar tus datos?</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Puedes escribirlos tú mismo o subir tus documentos y los extraemos con IA.
        </p>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        <button onClick={() => setModo("manual")} className={tabCls(modo === "manual")}>Ingresar manualmente</button>
        <button onClick={() => setModo("archivos")} className={tabCls(modo === "archivos")}>Subir documentos</button>
      </div>

      {modo === "manual" && (
        <div className="flex gap-3">
          <button onClick={onSkip} className={btnPrimary}>Continuar →</button>
        </div>
      )}

      {modo === "archivos" && (
        <>
          <div className="space-y-3">
            {tipos.map((t) => (
              <div key={t.value}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.label}</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className={inputCls}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) agregarArchivo(t.value, file);
                  }}
                />
                {docs[t.value] && (
                  <p className="text-xs text-green-600 mt-1">✓ {docs[t.value]!.nombre}</p>
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
              {error} — puedes continuar e ingresar los datos manualmente.
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onSkip} className={btnSecondary}>Omitir, ingresar manual</button>
            <button onClick={extraer} disabled={docsListos.length === 0 || extrayendo} className={btnPrimary}>
              {extrayendo ? "Analizando..." : `Extraer datos (${docsListos.length})`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
