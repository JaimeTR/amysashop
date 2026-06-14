import { Resend } from "resend";
import { getSiteUrl } from "@/lib/site-url";

const resendApiKey = process.env.RESEND_API_KEY || "";
const fromEmail = process.env.CONTACT_FROM_EMAIL || "no-reply@amysashop.com";

export async function sendPurchaseConfirmationEmail(input: {
  to: string;
  customerName: string;
  productName: string;
  productSlug?: string;
  downloadToken: string;
  files?: { name: string; description: string }[];
}): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!resendApiKey) {
      console.warn("RESEND_API_KEY not configured");
      return { ok: false, error: "Email service not configured" };
    }

    const resend = new Resend(resendApiKey);

    const downloadUrl = `${getSiteUrl()}/digital/descargas?token=${input.downloadToken}&email=${encodeURIComponent(input.to)}`;

    const fileList = (input.files || []).map(
      (f) => `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #f0ebe7;">
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="width:36px;vertical-align:middle;">
                  <span style="display:inline-block;width:36px;height:36px;border-radius:10px;background:#f5f0ec;text-align:center;line-height:36px;font-size:16px;">📄</span>
                </td>
                <td style="padding-left:12px;vertical-align:middle;">
                  <p style="margin:0;font-size:14px;font-weight:600;color:#1a1a1a;">${f.name}</p>
                  <p style="margin:2px 0 0;font-size:12px;color:#888;">${f.description}</p>
                </td>
                <td width="100" style="vertical-align:middle;text-align:right;">
                  <a href="${downloadUrl}&file=${encodeURIComponent(f.name)}" style="display:inline-block;padding:6px 14px;border-radius:8px;background:#7A5542;color:#fff;font-size:12px;font-weight:600;text-decoration:none;">Descargar</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>`
    ).join("");

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f0ec;font-family:Manrope,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0ec;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(122,85,66,0.08);">

        <tr>
          <td style="background:linear-gradient(135deg,#7A5542,#AE826D);padding:40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-family:Georgia,'Playfair Display',serif;letter-spacing:1px;">AMYSA SHOP</h1>
            <p style="margin:12px 0 0;color:rgba(255,255,255,0.9);font-size:15px;">¡Pago confirmado! Tus archivos están listos</p>
          </td>
        </tr>

        <tr>
          <td style="padding:36px 40px;">
            <p style="color:#1a1a1a;font-size:16px;line-height:1.6;margin:0 0 8px;">
              Hola <strong style="color:#7A5542;">${input.customerName}</strong>,
            </p>
            <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
              Hemos verificado tu pago de <strong style="color:#7A5542;">${input.productName}</strong>. ¡Gracias por confiar en nosotras!
            </p>

            <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
              <tr>
                <td align="center" style="background:#7A5542;border-radius:14px;padding:16px 36px;">
                  <a href="${downloadUrl}" style="color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;display:inline-block;letter-spacing:0.5px;">
                    ⬇ DESCARGAR TODOS MIS ARCHIVOS
                  </a>
                </td>
              </tr>
            </table>

            ${fileList ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0ebe7;border-radius:12px;overflow:hidden;margin-bottom:28px;">
              <tr>
                <td style="padding:14px 16px;background:#faf8f6;border-bottom:1px solid #f0ebe7;">
                  <p style="margin:0;font-size:13px;font-weight:700;color:#7A5542;text-transform:uppercase;letter-spacing:0.5px;">Archivos incluidos</p>
                </td>
              </tr>
              ${fileList}
            </table>
            ` : ""}

            <table cellpadding="0" cellspacing="0" style="background:#faf8f6;border-radius:12px;padding:16px 20px;margin-bottom:28px;">
              <tr>
                <td style="width:32px;vertical-align:top;padding-top:2px;">
                  <span style="font-size:18px;">💡</span>
                </td>
                <td style="padding-left:12px;">
                  <p style="margin:0;font-size:13px;color:#666;line-height:1.5;">
                    <strong style="color:#7A5542;">Recordatorio:</strong> Guardá tus archivos en un lugar seguro. 
                    Este enlace expirará por seguridad.
                  </p>
                </td>
              </tr>
            </table>

            <hr style="border:none;border-top:1px solid #eee;margin:0 0 20px;">

            <p style="color:#999;font-size:13px;line-height:1.6;margin:0;text-align:center;">
              ¿Tienes dudas o problemas con la descarga?<br>
              Escríbenos al 
              <a href="https://wa.me/51965312386" style="color:#7A5542;font-weight:600;text-decoration:none;">WhatsApp</a>
              y te ayudamos
            </p>

            <p style="color:#bbb;font-size:11px;line-height:1.5;margin:16px 0 0;text-align:center;">
              AMYSA SHOP &mdash; Todos los derechos reservados<br>
              Este es un correo automático, por favor no respondas a este mensaje.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const { error } = await resend.emails.send({
      from: `AMYSA SHOP <${fromEmail}>`,
      to: input.to,
      subject: `Descarga de ${input.productName} - AMYSA SHOP`,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err) {
    console.error("sendPurchaseConfirmationEmail error:", err);
    return { ok: false, error: "send_failed" };
  }
}
