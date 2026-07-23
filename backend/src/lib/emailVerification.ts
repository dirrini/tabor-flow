import { createHmac, timingSafeEqual } from "node:crypto";

type VerificationPayload = {
  email: string;
  expiresAt: number;
  purpose: "verify-email";
  userId: number;
};

const verificationExpirationMs = 60 * 60 * 1000;

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET environment variable is required.");
  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getAuthSecret()).update(value).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;"
  })[character] ?? character);
}

export function createEmailVerificationToken(user: { email: string; id: number }) {
  const payload: VerificationPayload = {
    email: user.email,
    expiresAt: Date.now() + verificationExpirationMs,
    purpose: "verify-email",
    userId: user.id
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyEmailVerificationToken(token: string) {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature || !safeEqual(signature, sign(encodedPayload))) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as VerificationPayload;
    if (
      payload.purpose !== "verify-email" ||
      typeof payload.userId !== "number" ||
      typeof payload.email !== "string" ||
      typeof payload.expiresAt !== "number" ||
      payload.expiresAt < Date.now()
    ) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function sendVerificationEmail(user: { email: string; id: number; name: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const appUrl = process.env.APP_URL;
  if (!apiKey || !from || !appUrl) {
    throw new Error("RESEND_API_KEY, RESEND_FROM_EMAIL and APP_URL are required.");
  }

  const verificationUrl = new URL("/verify-email", appUrl);
  verificationUrl.searchParams.set("token", createEmailVerificationToken(user));
  const safeName = escapeHtml(user.name);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [user.email],
      subject: "Verifique seu e-mail no TaborFlow | Verify your TaborFlow email",
      html: `<div style="background:#f7f8f2;padding:32px;font-family:Arial,sans-serif;color:#15231d"><div style="max-width:560px;margin:auto;background:#fff;border:1px solid #dfe3dc;border-radius:16px;padding:32px"><h1 style="margin:0 0 16px">Olá, ${safeName}!</h1><p>Confirme seu endereço de e-mail para liberar as ferramentas do seu workspace no TaborFlow.</p><p>Confirm your email address to unlock your TaborFlow workspace.</p><p style="margin:28px 0"><a href="${verificationUrl.toString()}" style="background:#163c2d;color:#fff;text-decoration:none;padding:13px 20px;border-radius:999px;font-weight:bold">Verificar e-mail / Verify email</a></p><p style="color:#66736c;font-size:14px">Este link expira em 60 minutos. This link expires in 60 minutes.</p></div></div>`
    })
  });

  if (!response.ok) {
    throw new Error(`Resend rejected the email: ${response.status} ${await response.text()}`);
  }
}
