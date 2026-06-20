import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const ESTADOS = [
  { key: "",          label: "Todos" },
  { key: "lead",      label: "Leads nuevos" },
  { key: "activo",    label: "Activos" },
  { key: "en_proceso",label: "En proceso" },
  { key: "cerrado",   label: "Cerrados" },
];

const ESTADO_COLOR: Record<string, string> = {
  lead:       "bg-yellow-100 text-yellow-800",
  activo:     "bg-blue-100 text-blue-800",
  en_proceso: "bg-purple-100 text-purple-800",
  cerrado:    "bg-green-100 text-green-800",
};

export default async function TodosClientes({
  searchParams,
}: {
  searchParams: { estado?: string };
}) {
  const supabase = await createClient();
  const filtro = searchParams.estado ?? "";

  let query = supabase
    .from("clientes")
    .select("id, nombre, rut, email, telefono, estado, resultado_total, created_at, perfiles(nombre)")
    .order("created_at", { ascending: false });

  if (filtro) query = query.eq("estado", filtro);

  const { data: clientes } = await query;

  const fmt = (v: number) =>
    v?.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

  const fmtFecha = (iso: string) =>
    new Date(iso).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "2-digit" });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <h1 className="text-xl font-bold text-gray-800">Clientes</h1>
        <p className="text-sm text-gray-400">{clientes?.length ?? 0} resultado{clientes?.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {ESTADOS.map(({ key, label }) => (
          <Link
            key={key}
            href={key ? `/admin/clientes?estado=${key}` : "/admin/clientes"}
            className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
              filtro === key
                ? "bg-gray-800 text-white border-gray-800"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden text-sm">
        {/* Cabecera */}
        <div className="grid grid-cols-12 px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-100">
          <span className="col-span-4">Nombre</span>
          <span className="col-span-3 hidden md:block">Contacto</span>
          <span className="col-span-2 hidden md:block">Abogado</span>
          <span className="col-span-2 text-right">Monto</span>
          <span className="col-span-1 text-right">Estado</span>
        </div>

        <div className="divide-y divide-gray-100">
          {clientes?.length === 0 && (
            <p className="px-4 py-6 text-gray-400 text-center">Sin clientes con este filtro.</p>
          )}
          {clientes?.map((c) => {
            const abogado = c.perfiles as unknown as { nombre: string } | null;
            return (
              <Link
                key={c.id}
                href={`/admin/calculos/${c.id}`}
                className="grid grid-cols-12 px-4 py-3 items-center hover:bg-gray-50 transition-colors"
              >
                <div className="col-span-4">
                  <p className="font-medium text-gray-800 truncate">{c.nombre}</p>
                  <p className="text-xs text-gray-400">{c.rut || "—"} · {fmtFecha(c.created_at)}</p>
                </div>
                <div className="col-span-3 hidden md:block">
                  <p className="text-gray-600 truncate">{c.email || "—"}</p>
                  <p className="text-xs text-gray-400">{c.telefono}</p>
                </div>
                <div className="col-span-2 hidden md:block">
                  <p className="text-gray-500 truncate text-xs">{abogado?.nombre ?? "sin asignar"}</p>
                </div>
                <div className="col-span-2 text-right">
                  {c.resultado_total > 0 && (
                    <span className="font-semibold text-green-700">{fmt(c.resultado_total)}</span>
                  )}
                </div>
                <div className="col-span-1 flex justify-end">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLOR[c.estado] ?? "bg-gray-100 text-gray-600"}`}>
                    {c.estado}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
