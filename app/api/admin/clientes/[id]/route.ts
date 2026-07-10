import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const clienteId = params.id;

  // Solo admin autenticado puede eliminar clientes
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (perfil?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: cliente, error: clienteError } = await admin
    .from("clientes")
    .select("id, auth_user_id")
    .eq("id", clienteId)
    .single();

  if (clienteError || !cliente) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  // Borrar archivos del storage asociados a sus documentos
  const { data: documentos } = await admin
    .from("documentos")
    .select("storage_path")
    .eq("cliente_id", clienteId);

  if (documentos?.length) {
    await admin.storage
      .from("documentos-clientes")
      .remove(documentos.map((d) => d.storage_path));
  }

  // Tablas hijas que no necesariamente tienen ON DELETE CASCADE
  try { await admin.from("notas_caso").delete().eq("cliente_id", clienteId); } catch {}
  try { await admin.from("reuniones").delete().eq("cliente_id", clienteId); } catch {}
  await admin.from("documentos").delete().eq("cliente_id", clienteId);

  // Cuenta de acceso al portal, si se creó una
  if (cliente.auth_user_id) {
    await admin.auth.admin.deleteUser(cliente.auth_user_id).catch(() => {});
  }

  const { error: deleteError } = await admin.from("clientes").delete().eq("id", clienteId);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
