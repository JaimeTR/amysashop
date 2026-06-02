import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.titan.email";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "465");
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const TO_EMAIL = process.env.CONTACT_TO_EMAIL || "";
const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || "";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_PER_IP = 3;

const ipRequests = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipRequests.get(ip);

  if (!entry || now > entry.resetAt) {
    ipRequests.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX_PER_IP;
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json({ ok: false, error: "too_many_requests" }, { status: 429 });
    }

    if (!SMTP_PASS || !SMTP_USER || !TO_EMAIL) {
      console.error("SMTP credentials not configured");
      return NextResponse.json({ ok: false, error: "missing_credentials" }, { status: 500 });
    }

    const { name, email, message } = await req.json();

    if (!name || typeof name !== "string" || name.trim().length < 2 || name.length > 100) {
      return NextResponse.json({ ok: false, error: "invalid_name" }, { status: 400 });
    }

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }

    if (!message || typeof message !== "string" || message.trim().length < 10 || message.length > 5000) {
      return NextResponse.json({ ok: false, error: "invalid_message" }, { status: 400 });
    }

    const sanitizedName = name.trim();
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedMessage = message.trim();

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const mailOptions = {
      from: FROM_EMAIL,
      to: TO_EMAIL,
      replyTo: sanitizedEmail,
      subject: `Nuevo mensaje desde formulario de contacto: ${sanitizedName}`,
      text: `Nombre: ${sanitizedName}\nCorreo: ${sanitizedEmail}\n\nMensaje:\n${sanitizedMessage}`,
    };

    const info = await transporter.sendMail(mailOptions);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("/api/contact error:", err);
    return NextResponse.json(
      { ok: false, error: "send_failed" },
      { status: 500 }
    );
  }
}
