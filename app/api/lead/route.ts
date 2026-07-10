import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createSupabasePublic } from "@supabase/supabase-js";
import { Resend } from "resend";

const FROM   = process.env.FROM_EMAIL ?? "onboarding@resend.dev";
const SITE   = process.env.NEXT_PUBLIC_SITE_URL ?? "https://calculadoralaboral-three.vercel.app";

interface DocumentoPendiente {
  tipo: string;
  nombre: string;
  base64: string;
  mediaType: string;
  datosExtraidos?: Record<string, unknown>;
}

const EXTENSION_POR_MEDIA_TYPE: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

interface LeadBody {
  nombre: string;
  rut?: string;
  email?: string;
  telefono: string;
  resultado_total?: number;
  datos_calculo?: Record<string, unknown>;
  documentosPendientes?: DocumentoPendiente[];
}

export async function POST(req: NextRequest) {
  const body: LeadBody = await req.json();
  const {
    nombre, rut, email, telefono, resultado_total, datos_calculo,
    documentosPendientes,
  } = body;

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

  // Persistir documentos que el usuario subió durante el wizard (ya extraídos por
  // app/api/extraccion antes de tener cuenta) — no se vuelve a llamar a Claude aquí,
  // solo se guarda el archivo + el resultado de la extracción ya obtenido.
  if (documentosPendientes?.length) {
    await Promise.all(
      documentosPendientes.map(async (doc) => {
        try {
          const ext = EXTENSION_POR_MEDIA_TYPE[doc.mediaType] ?? "bin";
          const storagePath = `${cliente.id}/${crypto.randomUUID()}.${ext}`;
          const buffer = Buffer.from(doc.base64, "base64");

          const { error: uploadError } = await supabase.storage
            .from("documentos-clientes")
            .upload(storagePath, buffer, { contentType: doc.mediaType, upsert: false });

          if (uploadError) throw new Error(uploadError.message);

          await supabase.from("documentos").insert({
            cliente_id: cliente.id,
            tipo: doc.tipo,
            nombre_archivo: doc.nombre,
            storage_path: storagePath,
            estado: doc.datosExtraidos ? "procesado" : "pendiente",
            datos_extraidos: doc.datosExtraidos ?? null,
          });
        } catch (docError) {
          console.error("Error guardando documento pendiente del wizard:", docError);
        }
      })
    );
  }

  let portalCreado = false;

  if (email) {
    try {
      // Crear usuario en Supabase Auth
      const { data: authData, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { nombre, tipo: "cliente" },
      });

      // Si el correo ya tiene una cuenta de Auth (otro lead anterior con el mismo
      // email, o incluso una cuenta de staff), createUser falla — reutilizamos esa
      // cuenta existente en vez de dejar auth_user_id sin vincular (lo que dejaba
      // al cliente sin acceso permanente a su portal).
      let authUserId = authData?.user?.id ?? null;
      if (!authUserId && createError) {
        const { data: existentes } = await supabase.auth.admin.listUsers();
        authUserId = existentes?.users.find(
          (u) => u.email?.toLowerCase() === email.toLowerCase()
        )?.id ?? null;
      }

      if (authUserId) {
        await supabase
          .from("clientes")
          .update({ auth_user_id: authUserId })
          .eq("id", cliente.id);

        // Generamos el link nosotros (generateLink no envía correo, solo lo crea)
        // para poder decidir qué canal lo entrega.
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email,
          options: { redirectTo: `${SITE}/auth/callback?next=/cliente` },
        });

        if (linkError) {
          console.error("Error generando magic link:", linkError.message);
        }

        let emailEnviado = false;

        // Canal primario: email de bienvenida con marca propia (monto, pasos, botón) vía Resend
        if (linkData?.properties?.action_link && process.env.RESEND_API_KEY) {
          try {
            await new Resend(process.env.RESEND_API_KEY).emails.send({
              from: FROM,
              to: email,
              subject: "Tu estimación está lista — Accede a tu portal",
              html: bienvenidaTemplate(nombre, linkData.properties.action_link, resultado_total ?? 0),
            });
            emailEnviado = true;
          } catch (resendError) {
            console.error("Error enviando email de bienvenida via Resend:", resendError);
          }
        }

        // Canal de respaldo: si Resend no está configurado o falló, usamos el envío
        // nativo de Supabase Auth (plantilla genérica) para que el cliente igual
        // reciba un correo con el que entrar a su portal.
        if (!emailEnviado) {
          const supabasePublic = createSupabasePublic(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          );
          const { error: otpError } = await supabasePublic.auth.signInWithOtp({
            email,
            options: { shouldCreateUser: false, emailRedirectTo: `${SITE}/auth/callback?next=/cliente` },
          });

          if (otpError) {
            console.error("Error enviando OTP via Supabase:", otpError.message);
          } else {
            emailEnviado = true;
          }
        }

        portalCreado = emailEnviado;
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
