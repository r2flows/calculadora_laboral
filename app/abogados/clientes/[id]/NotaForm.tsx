"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NotaForm({ clienteId }: { clienteId: string }) {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from("notas_caso").insert({
      cliente_id: clienteId,
      abogado_id: user!.id,
      contenido: texto.trim(),
    });

    setTexto("");
    setSaving(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        rows={3}
        placeholder="Agregar nota del caso..."
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />
      <button
        type="submit"
        disabled={saving || !texto.trim()}
        className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-1.5 rounded-lg disabled:opacity-50"
      >
        {saving ? "Guardando..." : "Agregar nota"}
      </button>
    </form>
  );
}
