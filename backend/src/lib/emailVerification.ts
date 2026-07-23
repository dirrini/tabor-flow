import { createHmac, timingSafeEqual } from "node:crypto";

type VerificationPayload = {
  email: string;
  expiresAt: number;
  purpose: "verify-email" | "accept-invitation";
  userId: number;
};

const verificationExpirationMs = 60 * 60 * 1000;
const invitationExpirationMs = 7 * 24 * 60 * 60 * 1000;

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

function createActionToken(
  user: { email: string; id: number },
  purpose: VerificationPayload["purpose"],
  expirationMs: number
) {
  const payload: VerificationPayload = {
    email: user.email,
    expiresAt: Date.now() + expirationMs,
    purpose,
    userId: user.id
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function createEmailVerificationToken(user: { email: string; id: number }) {
  return createActionToken(user, "verify-email", verificationExpirationMs);
}

export function createInvitationToken(user: { email: string; id: number }) {
  return createActionToken(user, "accept-invitation", invitationExpirationMs);
}

export function verifyEmailVerificationToken(token: string) {
  return verifyActionToken(token, "verify-email");
}

export function verifyInvitationToken(token: string) {
  return verifyActionToken(token, "accept-invitation");
}

function verifyActionToken(token: string, expectedPurpose: VerificationPayload["purpose"]) {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature || !safeEqual(signature, sign(encodedPayload))) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as VerificationPayload;
    if (
      payload.purpose !== expectedPurpose ||
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

export async function sendInvitationEmail(
  user: { email: string; id: number; name: string },
  workspaceName: string
) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const appUrl = process.env.APP_URL;
  if (!apiKey || !from || !appUrl) {
    throw new Error("RESEND_API_KEY, RESEND_FROM_EMAIL and APP_URL are required.");
  }

  const invitationUrl = new URL("/accept-invitation", appUrl);
  invitationUrl.searchParams.set("token", createInvitationToken(user));
  const safeName = escapeHtml(user.name);
  const safeWorkspaceName = escapeHtml(workspaceName);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [user.email],
      subject: "Você foi convidado para o TaborFlow | TaborFlow invitation",
      html: `<div style="background:#f7f8f2;padding:32px;font-family:Arial,sans-serif;color:#15231d"><div style="max-width:560px;margin:auto;background:#fff;border:1px solid #dfe3dc;border-radius:16px;padding:32px"><h1 style="margin:0 0 16px">Olá, ${safeName}!</h1><p>Você foi convidado para colaborar no workspace <strong>${safeWorkspaceName}</strong> no TaborFlow. Defina sua senha para aceitar o convite.</p><p>You were invited to collaborate in the <strong>${safeWorkspaceName}</strong> workspace on TaborFlow. Set your password to accept the invitation.</p><p style="margin:28px 0"><a href="${invitationUrl.toString()}" style="background:#163c2d;color:#fff;text-decoration:none;padding:13px 20px;border-radius:999px;font-weight:bold">Aceitar convite / Accept invitation</a></p><p style="color:#66736c;font-size:14px">Este link expira em 7 dias. This link expires in 7 days.</p></div></div>`
    })
  });

  if (!response.ok) {
    throw new Error(`Resend rejected the invitation: ${response.status} ${await response.text()}`);
  }
}
