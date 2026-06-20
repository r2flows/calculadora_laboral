import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nombre, rut, email, telefono, resultado_total, datos_calculo } = body;

  if (!nombre || !telefono) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: cliente, error } = await supabase
    .from("clientes")
    .insert({
      nombre,
      rut: rut || null,
      email: email || null,
      telefono,
      estado: "lead",
      resultado_total: Math.round(resultado_total ?? 0),
      datos_calculo: datos_calculo ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error guardando lead:", error.message);
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
  }

  let portalCreado = false;

  if (email) {
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://calculadoralaboral-three.vercel.app";
      const { data: authData } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: { nombre, tipo: "cliente" },
        redirectTo: `${siteUrl}/cliente`,
      });

      if (authData?.user) {
        await supabase
          .from("clientes")
          .update({ auth_user_id: authData.user.id })
          .eq("id", cliente.id);
        portalCreado = true;
      }
    } catch (authError) {
      console.error("Error creando acceso portal:", authError);
    }
  }

  return NextResponse.json({ ok: true, portalCreado });
}
