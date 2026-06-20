"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ESTADOS = ["lead", "activo", "en_proceso", "cerrado"] as const;

export default function EstadoForm({
  clienteId,
  estadoActual,
}: {
  clienteId: string;
  estadoActual: string;
}) {
  const router = useRouter();
  const [estado, setEstado] = useState(estadoActual);
  const [saving, setSaving] = useState(false);

  async function handleChange(nuevoEstado: string) {
    setSaving(true);
    setEstado(nuevoEstado);
    const supabase = createClient();
    await supabase.from("clientes").update({ estado: nuevoEstado }).eq("id", clienteId);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {ESTADOS.map((s) => (
        <button
          key={s}
          onClick={() => handleChange(s)}
          disabled={saving}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            estado === s
              ? "bg-blue-700 text-white border-blue-700"
              : "border-gray-300 text-gray-600 hover:bg-gray-50"
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
