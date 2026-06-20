import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const docId = params.id;
  const admin = createAdminClient();

  await admin.from("documentos").update({ estado: "procesando" }).eq("id", docId);

  try {
    const { storagePath } = await req.json();

    const { data: fileData, error: downloadError } = await admin.storage
      .from("documentos-clientes")
      .download(storagePath);

    if (downloadError || !fileData) {
      throw new Error(`Error descargando PDF: ${downloadError?.message}`);
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const base64Pdf = buffer.toString("base64");

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64Pdf,
              },
            },
            {
              type: "text",
              text: `Eres un experto en documentos laborales chilenos. Extrae los datos de este documento y responde ÚNICAMENTE con un JSON válido (sin texto adicional, sin markdown).

Campos a extraer:
{
  "tipo_documento": "liquidacion | finiquito | contrato | otro",
  "empleador": "nombre de la empresa o null",
  "rut_empleador": "RUT si aparece o null",
  "periodo": "mes/año si es liquidación, ej: '2024-03', o null",
  "sueldo_base": número en pesos o null,
  "gratificacion": número en pesos o null,
  "movilizacion": número en pesos o null,
  "colacion": número en pesos o null,
  "horas_extra": número en pesos o null,
  "total_haberes": número en pesos o null,
  "afp_nombre": "nombre AFP o null",
  "descuento_afp": número en pesos o null,
  "descuento_salud": número en pesos o null,
  "total_descuentos": número en pesos o null,
  "liquido_a_pagar": número en pesos o null,
  "fecha_inicio_contrato": "YYYY-MM-DD o null",
  "fecha_termino_contrato": "YYYY-MM-DD o null",
  "causal_termino": "texto de la causal o null"
}

Todos los montos como número entero en pesos chilenos. Si un campo no aparece en el documento, usa null.`,
            },
          ],
        },
      ],
    });

    const rawText = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Respuesta sin JSON válido");

    const datosExtraidos = JSON.parse(jsonMatch[0]);

    await admin
      .from("documentos")
      .update({ estado: "procesado", datos_extraidos: datosExtraidos, error_mensaje: null })
      .eq("id", docId);

    return NextResponse.json({ ok: true, datos: datosExtraidos });
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
