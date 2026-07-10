import Anthropic from "@anthropic-ai/sdk";
import type { DocumentoEntrada, DatosExtraidos } from "./tipos";
import { buildPrompt } from "./prompts";

export interface ExtraerDatosResultado {
  datos: DatosExtraidos;
}

/**
 * Extrae datos estructurados de uno o más documentos laborales (imagen o PDF) usando
 * Claude vision. Módulo compartido entre:
 *  - app/api/extraccion/route.ts — público, síncrono, para prefill del wizard antes de
 *    que el usuario tenga cuenta (imágenes, sin persistencia).
 *  - app/api/documentos/[id]/extraer/route.ts — autenticado, asíncrono, para el portal
 *    de cliente (PDF descargado desde Supabase Storage).
 * Antes existían dos prompts y dos implementaciones separadas — este módulo es la
 * única fuente de verdad para ambos flujos.
 */
export async function extraerDatos(documentos: DocumentoEntrada[]): Promise<ExtraerDatosResultado> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY no configurada. Ingresa los datos manualmente.");
  }
  if (documentos.length === 0) {
    throw new Error("Se requiere al menos un documento");
  }

  const client = new Anthropic({ apiKey });
  const content: Anthropic.MessageParam["content"] = [];

  for (const doc of documentos) {
    if (doc.mediaType === "application/pdf") {
      content.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: doc.base64 },
      });
    } else {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: doc.mediaType as "image/jpeg" | "image/png" | "image/webp",
          data: doc.base64,
        },
      });
    }
    content.push({ type: "text", text: `Documento tipo: ${doc.tipo}` });
  }

  content.push({ type: "text", text: buildPrompt(documentos.map((d) => d.tipo)) });

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [{ role: "user", content }],
  });

  const rawText = message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Respuesta sin JSON válido");

  const datos = JSON.parse(jsonMatch[0]) as DatosExtraidos;
  return { datos };
}
