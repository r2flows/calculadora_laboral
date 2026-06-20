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

    // Si no es admin, omitir alertas y desglose interno
    if (!datos.esAdmin) {
      return NextResponse.json({
        totalConNulidad: resultado.totalConNulidad,
        diasNulidad: resultado.diasNulidad,
        hayError: false, // se calculará al comparar con monto declarado pagado
      });
    }

    return NextResponse.json(resultado);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
