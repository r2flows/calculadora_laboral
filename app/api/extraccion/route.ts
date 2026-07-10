import { NextRequest, NextResponse } from "next/server";
import { extraerDatos } from "@/lib/extraccion/extraerDatos";
import type { DocumentoEntrada } from "@/lib/extraccion/tipos";

// Endpoint público (sin auth) — el wizard lo usa para precargar campos ANTES de que el
// usuario cree una cuenta. No persiste nada en Supabase; eso ocurre recién cuando el
// usuario captura su lead (ver app/api/lead/route.ts), reutilizando estos mismos datos
// para no llamar a Claude dos veces por el mismo documento.
const MAX_DOCUMENTOS = 6;
const MAX_BASE64_CHARS = 8_000_000; // ~6 MB por documento en base64

export async function POST(req: NextRequest) {
  let body: { documentos?: DocumentoEntrada[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const documentos = body.documentos ?? [];

  if (documentos.length === 0) {
    return NextResponse.json({ error: "Se requiere al menos un documento" }, { status: 422 });
  }
  if (documentos.length > MAX_DOCUMENTOS) {
    return NextResponse.json({ error: `Máximo ${MAX_DOCUMENTOS} documentos por solicitud` }, { status: 422 });
  }
  if (documentos.some((d) => !d.base64 || !d.mediaType || d.base64.length > MAX_BASE64_CHARS)) {
    return NextResponse.json({ error: "Documento inválido o demasiado grande" }, { status: 422 });
  }

  try {
    const { datos } = await extraerDatos(documentos);
    return NextResponse.json({ datos });
  } catch (err: unknown) {
    const mensaje = err instanceof Error ? err.message : "Error desconocido";
    console.error("[/api/extraccion]", mensaje);
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
