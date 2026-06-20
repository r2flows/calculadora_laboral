import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function Reuniones() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: reuniones } = await supabase
    .from("reuniones")
    .select("id, fecha, hora, modalidad, estado, notas, clientes(nombre)")
    .eq("abogado_id", user!.id)
    .order("fecha", { ascending: true });

  const ESTADO_COLOR: Record<string, string> = {
    pendiente: "bg-yellow-100 text-yellow-800",
    realizada: "bg-green-100 text-green-800",
    cancelada: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Reuniones</h1>
        <Link href="/abogados/reuniones/nueva"
          className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg">
          + Nueva reunion
        </Link>
      </div>

      {(!reuniones || reuniones.length === 0) ? (
        <p className="text-sm text-gray-400">No hay reuniones agendadas.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 text-sm">
          {reuniones.map((r) => {
            const cliente = r.clientes as unknown as { nombre: string } | null;
            return (
              <div key={r.id} className="px-4 py-3 flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-800">{cliente?.nombre}</p>
                  <p className="text-gray-500 text-xs">{r.fecha} a las {r.hora} · {r.modalidad}</p>
                  {r.notas && <p className="text-gray-400 text-xs mt-0.5 italic">{r.notas}</p>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLOR[r.estado] ?? ""}`}>
                  {r.estado}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
