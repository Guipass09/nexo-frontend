import { describe, expect, it } from "vitest";
import { extractMetaAuthorizationCode, extractMetaEmbeddedSignupSessionInfo } from "@/lib/meta-sdk";

describe("extractMetaEmbeddedSignupSessionInfo", () => {
  it("extracts normalized session info from nested meta payloads", () => {
    const payload = JSON.stringify({
      type: "WA_EMBEDDED_SIGNUP",
      data: {
        event: "FINISH",
        sessionInfo: {
          waba_id: "waba-123",
          phone_number_id: "phone-123",
          display_phone_number: "+55 11 99999-1111",
          verified_name: "Nexo Cliente",
          connection_type: "coexistence",
        },
      },
    });

    expect(extractMetaEmbeddedSignupSessionInfo(payload)).toEqual(
      expect.objectContaining({
        wabaId: "waba-123",
        phoneNumberId: "phone-123",
        phoneNumber: "+55 11 99999-1111",
        displayName: "Nexo Cliente",
        connectionType: "coexistence",
        event: "FINISH",
      }),
    );
  });

  it("returns null when no useful session info is present", () => {
    expect(extractMetaEmbeddedSignupSessionInfo({ foo: "bar" })).toBeNull();
  });

  it("extracts the authorization code from nested Meta login payloads", () => {
    expect(extractMetaAuthorizationCode({
      status: "connected",
      authResponse: {
        code: "meta-code-123",
      },
    })).toBe("meta-code-123");

    expect(extractMetaAuthorizationCode({
      code: "meta-code-top-level",
    })).toBe("meta-code-top-level");
  });
});
