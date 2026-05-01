import { NextResponse } from "next/server";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const TO_EMAIL = process.env.CONTACT_TO_EMAIL ?? "contacto@amysashop.com";
const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL ?? "no-reply@amysashop.com";

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();

    if (!SENDGRID_API_KEY) {
      console.error("SENDGRID_API_KEY no configurada");
      return NextResponse.json({ ok: false, error: "missing_api_key" }, { status: 500 });
    }

    const payload = {
      personalizations: [
        {
          to: [{ email: TO_EMAIL }],
          subject: `Nuevo mensaje desde formulario de contacto: ${name || "(sin nombre)"}`,
        },
      ],
      from: { email: FROM_EMAIL, name: "Amysa Shop" },
      reply_to: { email: email || FROM_EMAIL, name: name || "Cliente" },
      content: [
        {
          type: "text/plain",
          value: `Nombre: ${name || "-"}\nCorreo: ${email || "-"}\n\nMensaje:\n${message || "-"}`,
        },
      ],
    };

    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("SendGrid error:", res.status, text);
      return NextResponse.json({ ok: false, error: "send_failed", detail: text }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("/api/contact error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

