"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const TIPOS = [
  { value: "liquidacion", label: "Liquidación de sueldo" },
  { value: "finiquito",   label: "Finiquito" },
  { value: "contrato",    label: "Contrato de trabajo" },
  { value: "otro",        label: "Otro documento" },
] as const;

type Tipo = typeof TIPOS[number]["value"];

export default function DocumentoUpload({ clienteId }: { clienteId: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [tipo, setTipo] = useState<Tipo>("liquidacion");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError("Selecciona un archivo."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("El archivo no puede superar 10 MB."); return; }
    if (file.type !== "application/pdf") { setError("Solo se aceptan archivos PDF."); return; }

    setCargando(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("tipo", tipo);
    formData.append("clienteId", clienteId);

    try {
      const res = await fetch("/api/documentos", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Error al subir");
      }
      setExito(true);
      setFile(null);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al subir el archivo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <h2 className="font-semibold text-gray-700">Subir documento</h2>

      {exito ? (
        <div className="text-center py-3 space-y-2">
          <p className="text-green-600 font-medium text-sm">
            Documento subido. Lo analizaremos y actualizaremos el estado en breve.
          </p>
          <button onClick={() => setExito(false)} className="text-sm text-blue-600 hover:underline">
            Subir otro
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as Tipo)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <label className={`block border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
            file ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300"
          }`}>
            <input
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(""); }}
            />
            {file ? (
              <span className="text-sm text-blue-700 font-medium">{file.name}</span>
            ) : (
              <span className="text-sm text-gray-400">Haz click para seleccionar un PDF (máx. 10 MB)</span>
            )}
          </label>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={cargando || !file}
            className="w-full bg-blue-700 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-800 disabled:opacity-50 transition-colors"
          >
            {cargando ? "Subiendo..." : "Subir documento"}
          </button>
        </form>
      )}
    </div>
  );
}
