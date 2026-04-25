import type { AuthUser } from "@/lib/auth";

export function normalizeWhatsAppNumber(value: string | null | undefined) {
  return (value ?? "").replace(/\D+/g, "");
}

export function formatWhatsAppNumber(value: string | null | undefined) {
  const normalized = normalizeWhatsAppNumber(value);

  if (!normalized) {
    return "";
  }

  return `+${normalized}`;
}

export function buildUserProfileWhatsAppMessage(user: AuthUser) {
  const connectionCode = `NEXO-USER-${user.id}`;

  return [
    "Olá! Quero conectar meu acesso à plataforma Nexo pelo WhatsApp.",
    `Código de vínculo: ${connectionCode}`,
    `Nome: ${user.name}`,
    `E-mail: ${user.email}`,
  ].join("\n");
}

export function buildWhatsAppClickToChatLink(phoneNumber: string | null | undefined, message?: string) {
  const normalizedPhoneNumber = normalizeWhatsAppNumber(phoneNumber);

  if (!normalizedPhoneNumber) {
    return null;
  }

  const baseUrl = `https://wa.me/${normalizedPhoneNumber}`;

  if (!message) {
    return baseUrl;
  }

  return `${baseUrl}?text=${encodeURIComponent(message)}`;
}
