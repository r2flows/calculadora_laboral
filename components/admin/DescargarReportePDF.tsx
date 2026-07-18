"use client";

import { useState } from "react";

interface ClienteInfo {
  nombre: string;
  rut: string | null;
  email: string | null;
  telefono: string | null;
  estado: string;
  resultado_total: number;
  created_at: string;
}

interface Documento {
  id: string;
  tipo: string;
  nombre_archivo: string;
  estado: string;
  datos_extraidos: Record<string, unknown> | null;
  error_mensaje: string | null;
  created_at: string;
}

interface Props {
  cliente: ClienteInfo;
  abogado: { nombre: string } | null;
  datos: Record<string, unknown> | null;
  resultado: Record<string, unknown> | null;
  documentos: Documento[];
}

export default function DescargarReportePDF({ cliente, abogado, datos, resultado, documentos }: Props) {
  const [generando, setGenerando] = useState(false);

  async function handleClick() {
    setGenerando(true);
    try {
      const [{ pdf }, { default: ReporteDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./ReporteDocument"),
      ]);

      const blob = await pdf(
        <ReporteDocument cliente={cliente} abogado={abogado} datos={datos} resultado={resultado} documentos={documentos} />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const slug = cliente.nombre.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      a.href = url;
      a.download = `reporte-${slug || "cliente"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setGenerando(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={generando}
      className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-50 text-gray-600 text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-50"
    >
      {generando ? "Generando..." : "📄 Descargar reporte PDF"}
    </button>
  );
}
