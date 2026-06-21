import { NextRequest, NextResponse } from "next/server";
import { calcularFiniquito } from "@/lib/calculos/calcularFiniquito";
import type { DatosFiniquito } from "@/lib/calculos/tipos";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const datos: DatosFiniquito = {
      ...body,
      fechaInicio: new Date(body.fechaInicio),
      fechaTermino: new Date(body.fechaTermino),
      fechaConsulta: new Date(body.fechaConsulta ?? Date.now()),
    };

    const resultado = calcularFiniquito(datos);

    return NextResponse.json(resultado);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
