import { createClient } from "@/lib/supabase/server";

export default async function GestionAbogados() {
  const supabase = await createClient();

  const { data: abogados } = await supabase
    .from("perfiles")
    .select("id, nombre, telefono, role")
    .eq("role", "abogado")
    .order("nombre");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-800">Equipo de abogados</h1>
      <p className="text-sm text-gray-400">
        Para agregar o desactivar abogados, ingresa al panel de Supabase → Authentication → Users.
      </p>
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 text-sm">
        {abogados?.map((a) => (
          <div key={a.id} className="px-4 py-3 flex justify-between">
            <div>
              <p className="font-medium text-gray-800">{a.nombre}</p>
              <p className="text-xs text-gray-400">{a.telefono}</p>
            </div>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              {a.role}
            </span>
          </div>
        ))}
        {(!abogados || abogados.length === 0) && (
          <p className="px-4 py-3 text-gray-400 text-sm">No hay abogados registrados.</p>
        )}
      </div>
    </div>
  );
}
