"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EliminarClienteButton({
  clienteId,
  nombre,
  redirectTo,
  variant = "icono",
}: {
  clienteId: string;
  nombre: string;
  redirectTo?: string;
  variant?: "icono" | "boton";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`¿Eliminar a "${nombre}"? Se borrarán también sus documentos. Esta acción no se puede deshacer.`)) {
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/admin/clientes/${clienteId}`, { method: "DELETE" });
    setLoading(false);

    if (!res.ok) {
      alert("No se pudo eliminar al cliente.");
      return;
    }

    if (redirectTo) router.push(redirectTo);
    else router.refresh();
  }

  if (variant === "boton") {
    return (
      <button
        onClick={handleDelete}
        disabled={loading}
        className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        {loading ? "Eliminando..." : "Eliminar cliente"}
      </button>
    );
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      title={`Eliminar a ${nombre}`}
      className="p-1.5 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
    >
      {loading ? (
        <span className="text-xs">…</span>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m2 0v13a1 1 0 01-1 1H8a1 1 0 01-1-1V7h10z" />
        </svg>
      )}
    </button>
  );
}
