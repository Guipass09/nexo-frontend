import { describe, expect, it } from "vitest";
import {
  buildUserProfileWhatsAppMessage,
  buildWhatsAppClickToChatLink,
  formatWhatsAppNumber,
  normalizeWhatsAppNumber,
} from "@/lib/whatsapp";

describe("whatsapp helpers", () => {
  it("normalizes and formats the business number", () => {
    expect(normalizeWhatsAppNumber("+55 (11) 99888-7766")).toBe("5511998887766");
    expect(formatWhatsAppNumber("+55 (11) 99888-7766")).toBe("+5511998887766");
  });

  it("builds the user profile onboarding message", () => {
    expect(buildUserProfileWhatsAppMessage({
      id: 42,
      name: "Maria Silva",
      email: "maria@nexo.test",
      role: "operator",
    })).toContain("Código de vínculo: NEXO-USER-42");
  });

  it("builds a click-to-chat link with the encoded message", () => {
    const link = buildWhatsAppClickToChatLink("5511998887766", "Ola, mundo");

    expect(link).toBe("https://wa.me/5511998887766?text=Ola%2C%20mundo");
  });
});
