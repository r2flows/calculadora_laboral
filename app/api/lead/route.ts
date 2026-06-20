import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nombre, rut, email, telefono, resultado_total, datos_calculo } = body;

  if (!nombre || !telefono) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const supabase = await createClient();

  const { error } = await supabase.from("clientes").insert({
    nombre,
    rut: rut || null,
    email: email || null,
    telefono,
    estado: "lead",
    resultado_total: Math.round(resultado_total ?? 0),
    datos_calculo: datos_calculo ?? null,
  });

  if (error) {
    console.error("Error guardando lead:", error.message);
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
