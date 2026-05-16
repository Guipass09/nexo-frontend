import { apiClient } from "@/lib/api/client";
import { normalizeResourceResponse } from "@/lib/api/normalizers";
import type { MetaEmbeddedSignupSessionInfo } from "@/lib/meta-sdk";
import type {
  ProfileWhatsAppConnection,
  WhatsAppConnectionActionResult,
  WhatsAppExchangeTokenResult,
  WhatsAppEmbeddedSignupStartConfig,
  WhatsAppWebQrStatus,
} from "@/types/domain";

export interface CompleteEmbeddedSignupPayload {
  code: string;
  state?: string | null;
  authResponse?: Record<string, unknown> | null;
  extras?: Record<string, unknown> | null;
  sessionInfo?: MetaEmbeddedSignupSessionInfo | null;
  test_to?: string | null;
  test_message?: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

function normalizeStartConfig(payload: unknown): WhatsAppEmbeddedSignupStartConfig {
  if (!isRecord(payload)) {
    return {
      appId: null,
      configurationId: null,
      graphVersion: null,
      redirectUri: null,
      feature: null,
      sessionInfoVersion: null,
      state: null,
      extras: null,
    };
  }

  return {
    appId: firstString(payload.appId, payload.app_id),
    configurationId: firstString(payload.configurationId, payload.configuration_id),
    graphVersion: firstString(payload.graphVersion, payload.graph_version),
    redirectUri: firstString(payload.redirectUri, payload.redirect_uri),
    feature: firstString(payload.feature),
    sessionInfoVersion: firstNumber(payload.sessionInfoVersion, payload.session_info_version),
    state: firstString(payload.state),
    extras: isRecord(payload.extras) ? payload.extras : null,
  };
}

export async function getWhatsAppConnectionStatus() {
  const response = normalizeResourceResponse<ProfileWhatsAppConnection | null>(
    await apiClient.get<unknown>("/profile/whatsapp"),
  );

  return response.data;
}

export async function startEmbeddedSignup() {
  const response = normalizeResourceResponse<unknown>(
    await apiClient.post<unknown>("/profile/whatsapp/cloud/start"),
  );

  return normalizeStartConfig(response.data);
}

export async function completeEmbeddedSignup(payload: CompleteEmbeddedSignupPayload): Promise<WhatsAppExchangeTokenResult> {
  const response = normalizeResourceResponse<ProfileWhatsAppConnection | null>(
    await apiClient.post<unknown>("/profile/whatsapp/cloud/complete", payload),
  );

  return {
    connection: response.data,
    testMessage: null,
  };
}

export async function testWhatsAppConnection() {
  const response = normalizeResourceResponse<WhatsAppConnectionActionResult>(
    await apiClient.post<unknown>("/profile/whatsapp/test"),
  );

  return response.data;
}

export async function syncProfileWhatsAppTemplates() {
  const response = normalizeResourceResponse<WhatsAppConnectionActionResult>(
    await apiClient.post<unknown>("/profile/whatsapp/sync-templates"),
  );

  return response.data;
}

export async function disconnectWhatsApp() {
  const response = normalizeResourceResponse<{ message?: string }>(
    await apiClient.delete<unknown>("/profile/whatsapp"),
  );

  return response.data;
}

export async function startWhatsAppWebConnection() {
  const response = normalizeResourceResponse<{
    connection: ProfileWhatsAppConnection | null;
    service?: Record<string, unknown> | null;
  }>(
    await apiClient.post<unknown>("/profile/whatsapp/web/start"),
  );

  return response.data;
}

export async function getWhatsAppWebQr() {
  const response = normalizeResourceResponse<WhatsAppWebQrStatus>(
    await apiClient.get<unknown>("/profile/whatsapp/web/qr"),
  );

  return response.data;
}

export async function disconnectWhatsAppWeb() {
  const response = normalizeResourceResponse<{
    message?: string;
    connection?: ProfileWhatsAppConnection | null;
  }>(
    await apiClient.post<unknown>("/profile/whatsapp/web/disconnect"),
  );

  return response.data;
}
