import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const tipo = formData.get("tipo") as string | null;
  const clienteId = formData.get("clienteId") as string | null;

  if (!file || !tipo || !clienteId) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }

  // Verify the session user owns this clienteId
  const { data: cliente } = await supabase
    .from("clientes")
    .select("id")
    .eq("id", clienteId)
    .eq("auth_user_id", user.id)
    .single();

  if (!cliente) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const admin = createAdminClient();
  const fileName = `${crypto.randomUUID()}.pdf`;
  const storagePath = `${clienteId}/${fileName}`;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const { error: uploadError } = await admin.storage
    .from("documentos-clientes")
    .upload(storagePath, buffer, { contentType: "application/pdf", upsert: false });

  if (uploadError) {
    console.error("Error subiendo PDF:", uploadError.message);
    return NextResponse.json({ error: "Error al subir archivo" }, { status: 500 });
  }

  const { data: doc, error: insertError } = await admin
    .from("documentos")
    .insert({
      cliente_id: clienteId,
      tipo,
      nombre_archivo: file.name,
      storage_path: storagePath,
      estado: "pendiente",
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("Error guardando documento:", insertError.message);
    return NextResponse.json({ error: "Error al registrar documento" }, { status: 500 });
  }

  // Trigger extraction asynchronously — fire and forget
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  fetch(`${baseUrl}/api/documentos/${doc.id}/extraer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ storagePath, tipo }),
  }).catch((err) => console.error("Error lanzando extracción:", err));

  return NextResponse.json({ ok: true, id: doc.id, estado: "pendiente" });
}
