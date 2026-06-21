import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.FROM_EMAIL ?? "portal@laboral.agentloop.cl";
const SITE   = process.env.NEXT_PUBLIC_SITE_URL ?? "https://calculadoralaboral-three.vercel.app";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email requerido" }, { status: 400 });

  const supabase = createAdminClient();

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${SITE}/cliente` },
  });

  if (error || !data?.properties?.action_link) {
    console.error("Error generando magic link:", error?.message);
    return NextResponse.json({ error: "No se pudo generar el enlace" }, { status: 500 });
  }

  const link = data.properties.action_link;

  const { error: sendError } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Tu enlace de acceso al portal laboral",
    html: emailTemplate(link),
  });

  if (sendError) {
    console.error("Error enviando email:", sendError);
    return NextResponse.json({ error: "No se pudo enviar el email" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

function emailTemplate(link: string) {
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

        <!-- Body -->
        <tr><td style="padding:36px 32px;">
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">Tu enlace de acceso</h1>
          <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.6;">
            Haz click en el botón para acceder a tu portal. El enlace es válido por <strong>1 hora</strong> y es de uso único.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${link}"
                style="display:inline-block;background:linear-gradient(135deg,#2563eb,#0891b2);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:10px;letter-spacing:0.01em;">
                Entrar a mi portal →
              </a>
            </td></tr>
          </table>

          <p style="margin:28px 0 0;font-size:12px;color:#94a3b8;line-height:1.6;">
            Si no solicitaste este enlace, puedes ignorar este correo. Tu cuenta permanece segura.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:16px 32px;border-top:1px solid #f1f5f9;background:#f8fafc;">
          <p style="margin:0;font-size:11px;color:#cbd5e1;text-align:center;">
            Este enlace expira en 1 hora · Solo funciona una vez
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
