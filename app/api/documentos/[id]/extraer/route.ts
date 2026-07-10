import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extraerDatos } from "@/lib/extraccion/extraerDatos";
import type { DocTipo } from "@/lib/extraccion/tipos";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const docId = params.id;
  const admin = createAdminClient();

  await admin.from("documentos").update({ estado: "procesando" }).eq("id", docId);

  try {
    const { storagePath, tipo } = await req.json();

    const { data: fileData, error: downloadError } = await admin.storage
      .from("documentos-clientes")
      .download(storagePath);

    if (downloadError || !fileData) {
      throw new Error(`Error descargando PDF: ${downloadError?.message}`);
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const base64Pdf = buffer.toString("base64");

    const { datos } = await extraerDatos([
      { tipo: (tipo as DocTipo) ?? "otro", base64: base64Pdf, mediaType: "application/pdf" },
    ]);

    await admin
      .from("documentos")
      .update({ estado: "procesado", datos_extraidos: datos, error_mensaje: null })
      .eq("id", docId);

    return NextResponse.json({ ok: true, datos });
  } catch (err: unknown) {
    const mensaje = err instanceof Error ? err.message : "Error desconocido";
    console.error(`Error extrayendo documento ${docId}:`, mensaje);

    await admin
      .from("documentos")
      .update({ estado: "error", error_mensaje: mensaje })
      .eq("id", docId);

    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
