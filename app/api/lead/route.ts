import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.FROM_EMAIL ?? "portal@laboral.agentloop.cl";
const SITE   = process.env.NEXT_PUBLIC_SITE_URL ?? "https://calculadoralaboral-three.vercel.app";

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
      // Crear usuario en Supabase Auth (sin enviar email de Supabase)
      const { data: authData } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { nombre, tipo: "cliente" },
      });

      if (authData?.user) {
        await supabase
          .from("clientes")
          .update({ auth_user_id: authData.user.id })
          .eq("id", cliente.id);

        // Generar magic link de activación y enviarlo via Resend
        const { data: linkData } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email,
          options: { redirectTo: `${SITE}/cliente` },
        });

        if (linkData?.properties?.action_link) {
          await resend.emails.send({
            from: FROM,
            to: email,
            subject: "Activa tu portal — Tu estimación está lista",
            html: bienvenidaTemplate(nombre, linkData.properties.action_link, resultado_total),
          });
        }

        portalCreado = true;
      }
    } catch (authError) {
      console.error("Error creando acceso portal:", authError);
    }
  }

  return NextResponse.json({ ok: true, portalCreado });
}

function fmt(v: number) {
  return v?.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }) ?? "";
}

function bienvenidaTemplate(nombre: string, link: string, total: number) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">

        <!-- Header -->
        <tr><td style="background:#0f172a;padding:28px 32px;">
          <p style="margin:0;font-size:12px;color:#94a3b8;letter-spacing:0.1em;text-transform:uppercase;">empowered by</p>
          <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">AgentLoop</p>
        </td></tr>

        <!-- Monto -->
        ${total > 0 ? `
        <tr><td style="background:#f0fdf4;border-bottom:1px solid #dcfce7;padding:20px 32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#16a34a;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">Tu estimación de demanda</p>
          <p style="margin:6px 0 0;font-size:32px;font-weight:800;color:#15803d;letter-spacing:-0.02em;">${fmt(total)}</p>
        </td></tr>` : ""}

        <!-- Body -->
        <tr><td style="padding:36px 32px;">
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">Hola, ${nombre} 👋</h1>
          <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.6;">
            Tu cuenta está lista. Accede a tu portal para subir tus documentos y que nuestro equipo valide el monto exacto de tu causa.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr>
              <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;width:50%;">
                <p style="margin:0;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">📄 Paso 1</p>
                <p style="margin:4px 0 0;font-size:13px;color:#374151;font-weight:500;">Sube tu liquidación y finiquito</p>
              </td>
              <td style="width:12px;"></td>
              <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;width:50%;">
                <p style="margin:0;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">🤖 Paso 2</p>
                <p style="margin:4px 0 0;font-size:13px;color:#374151;font-weight:500;">IA extrae y valida tus datos</p>
              </td>
            </tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${link}"
                style="display:inline-block;background:linear-gradient(135deg,#2563eb,#0891b2);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:10px;">
                Acceder a mi portal →
              </a>
            </td></tr>
          </table>

          <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;line-height:1.6;">
            Este enlace es de uso único y expira en 24 horas. Si tienes problemas, responde este correo.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:16px 32px;border-top:1px solid #f1f5f9;background:#f8fafc;">
          <p style="margin:0;font-size:11px;color:#cbd5e1;text-align:center;">
            Asesoría laboral · Chile · empowered by AgentLoop
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
