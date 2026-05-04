import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.titan.email";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "465");
const SMTP_USER = process.env.SMTP_USER || "contacto@amysashop.com";
const SMTP_PASS = process.env.SMTP_PASS || "";
const TO_EMAIL = process.env.CONTACT_TO_EMAIL || "contacto@amysashop.com";
const EXTRA_TO_EMAIL = "jaimetr1309@gmail.com";
const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || "contacto@amysashop.com";

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();

    if (!SMTP_PASS) {
      console.error("SMTP_PASS no configurada");
      return NextResponse.json({ ok: false, error: "missing_credentials" }, { status: 500 });
    }

    // Configurar transporte SMTP
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // true para puerto 465, false para otros
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    // Contenido del correo
    const mailOptions = {
      from: FROM_EMAIL,
      to: `${TO_EMAIL}, ${EXTRA_TO_EMAIL}`,
      replyTo: email || FROM_EMAIL,
      subject: `Nuevo mensaje desde formulario de contacto: ${name || "(sin nombre)"}`,
      text: `Nombre: ${name || "-"}\nCorreo: ${email || "-"}\n\nMensaje:\n${message || "-"}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Nuevo mensaje de contacto</h2>
          <p><strong>Nombre:</strong> ${name || "-"}</p>
          <p><strong>Correo:</strong> ${email || "-"}</p>
          <p><strong>Mensaje:</strong></p>
          <p style="background-color: #f5f5f5; padding: 10px; border-left: 4px solid #666; white-space: pre-wrap;">
            ${message || "-"}
          </p>
        </div>
      `,
    };

    // Enviar correo
    const info = await transporter.sendMail(mailOptions);
    console.log("Correo enviado exitosamente:", info.messageId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("/api/contact error:", err);
    const errorMessage = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json(
      { ok: false, error: "send_failed", detail: errorMessage },
      { status: 500 }
    );
  }
}

