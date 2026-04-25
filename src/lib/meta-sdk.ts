declare global {
  interface Window {
    FB?: MetaFacebookSdk;
    fbAsyncInit?: () => void;
  }
}

export interface MetaEmbeddedSignupSessionInfo {
  businessAccountId?: string | null;
  wabaId?: string | null;
  phoneNumberId?: string | null;
  phoneNumber?: string | null;
  displayName?: string | null;
  connectionType?: string | null;
  event?: string | null;
  eventType?: string | null;
  raw?: Record<string, unknown> | null;
}

export interface MetaFacebookAuthResponse {
  accessToken?: string;
  code?: string;
  data_access_expiration_time?: number;
  expiresIn?: number;
  expires_in?: number;
  grantedScopes?: string;
  reauthorize_required_in?: number;
  signedRequest?: string;
  userID?: string;
}

export interface MetaFacebookLoginResponse {
  status?: "connected" | "not_authorized" | "unknown";
  authResponse?: MetaFacebookAuthResponse;
  code?: string;
  auth_code?: string;
  authorization_code?: string;
  rawResponse?: Record<string, unknown> | null;
}

export interface MetaEmbeddedSignupLaunchResult extends MetaFacebookLoginResponse {
  sessionInfo?: MetaEmbeddedSignupSessionInfo | null;
}

export interface MetaFacebookLoginOptions {
  config_id: string;
  response_type: "code";
  override_default_response_type: boolean;
  extras?: Record<string, unknown>;
}

export interface MetaFacebookInitConfig {
  appId: string;
  autoLogAppEvents?: boolean;
  cookie?: boolean;
  status?: boolean;
  xfbml?: boolean;
  version: string;
}

export interface MetaFacebookSdk {
  init: (config: MetaFacebookInitConfig) => void;
  login: (
    callback: (response: MetaFacebookLoginResponse | Record<string, unknown>) => void,
    options: MetaFacebookLoginOptions,
  ) => void;
}

export function extractMetaAuthorizationCode(value: unknown): string | null {
  const records = collectRecords(value);

  if (records.length === 0 && isRecord(value)) {
    records.push(value);
  }

  for (const record of records) {
    const code = firstString(
      record.code,
      record.auth_code,
      record.authorization_code,
      isRecord(record.authResponse) ? record.authResponse.code : null,
      isRecord(record.auth_response) ? record.auth_response.code : null,
      isRecord(record.data) ? firstString(
        record.data.code,
        record.data.auth_code,
        record.data.authorization_code,
        isRecord(record.data.authResponse) ? record.data.authResponse.code : null,
        isRecord(record.data.auth_response) ? record.data.auth_response.code : null,
      ) : null,
    );

    if (code) {
      return code;
    }
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJsonValue(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function collectRecords(value: unknown, bucket: Record<string, unknown>[] = []) {
  const normalized = parseJsonValue(value);

  if (Array.isArray(normalized)) {
    for (const item of normalized) {
      collectRecords(item, bucket);
    }

    return bucket;
  }

  if (!isRecord(normalized)) {
    return bucket;
  }

  bucket.push(normalized);

  for (const nestedValue of Object.values(normalized)) {
    const parsedNestedValue = parseJsonValue(nestedValue);

    if (Array.isArray(parsedNestedValue) || isRecord(parsedNestedValue)) {
      collectRecords(parsedNestedValue, bucket);
    }
  }

  return bucket;
}

export function extractMetaEmbeddedSignupSessionInfo(value: unknown): MetaEmbeddedSignupSessionInfo | null {
  const records = collectRecords(value);

  if (records.length === 0) {
    return null;
  }

  const info: MetaEmbeddedSignupSessionInfo = {
    businessAccountId: null,
    wabaId: null,
    phoneNumberId: null,
    phoneNumber: null,
    displayName: null,
    connectionType: null,
    event: null,
    eventType: null,
    raw: null,
  };

  for (const record of records) {
    info.businessAccountId ??= firstString(
      record.business_account_id,
      record.businessAccountId,
      record.business_id,
      record.businessId,
    );
    info.wabaId ??= firstString(
      record.waba_id,
      record.wabaId,
      record.whatsapp_business_account_id,
      record.whatsappBusinessAccountId,
    );
    info.phoneNumberId ??= firstString(
      record.phone_number_id,
      record.phoneNumberId,
    );
    info.phoneNumber ??= firstString(
      record.phone_number,
      record.phoneNumber,
      record.display_phone_number,
      record.displayPhoneNumber,
    );
    info.displayName ??= firstString(
      record.display_name,
      record.displayName,
      record.verified_name,
      record.verifiedName,
    );
    info.connectionType ??= firstString(
      record.connection_type,
      record.connectionType,
      record.onboarding_type,
      record.onboardingType,
    );
    info.event ??= firstString(
      record.event,
      record.current_step,
      record.currentStep,
    );
    info.eventType ??= firstString(
      record.event_type,
      record.eventType,
      record.type,
    );
  }

  if (
    !info.businessAccountId &&
    !info.wabaId &&
    !info.phoneNumberId &&
    !info.phoneNumber &&
    !info.displayName &&
    !info.connectionType &&
    !info.event &&
    !info.eventType
  ) {
    return null;
  }

  const firstRecord = records[0];
  info.raw = firstRecord;

  return info;
}

let sdkPromise: Promise<MetaFacebookSdk> | null = null;
let initializedAppId: string | null = null;
let initializedVersion: string | null = null;

export async function loadMetaSdk({
  appId,
  graphVersion,
}: {
  appId: string;
  graphVersion: string;
}) {
  if (window.FB && initializedAppId === appId && initializedVersion === graphVersion) {
    return window.FB;
  }

  if (!sdkPromise) {
    sdkPromise = new Promise<MetaFacebookSdk>((resolve, reject) => {
      const existingScript = document.getElementById("meta-facebook-jssdk");

      window.fbAsyncInit = () => {
        if (!window.FB) {
          reject(new Error("Meta SDK nao ficou disponivel apos o carregamento."));
          return;
        }

        window.FB.init({
          appId,
          autoLogAppEvents: false,
          cookie: true,
          status: false,
          xfbml: false,
          version: graphVersion,
        });
        initializedAppId = appId;
        initializedVersion = graphVersion;
        resolve(window.FB);
      };

      if (existingScript) {
        if (window.FB) {
          window.fbAsyncInit?.();
        }
        return;
      }

      const script = document.createElement("script");
      script.id = "meta-facebook-jssdk";
      script.async = true;
      script.defer = true;
      script.crossOrigin = "anonymous";
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.onerror = () => reject(new Error("Nao foi possivel carregar o SDK da Meta."));
      document.body.appendChild(script);
    });
  }

  const sdk = await sdkPromise;

  if (initializedAppId !== appId || initializedVersion !== graphVersion) {
    sdk.init({
      appId,
      autoLogAppEvents: false,
      cookie: true,
      status: false,
      xfbml: false,
      version: graphVersion,
    });
    initializedAppId = appId;
    initializedVersion = graphVersion;
  }

  return sdk;
}

export async function launchMetaEmbeddedSignup(
  sdk: MetaFacebookSdk,
  {
    configurationId,
    extras,
  }: {
    configurationId: string;
    extras?: Record<string, unknown> | null;
  },
) {
  return new Promise<MetaEmbeddedSignupLaunchResult>((resolve) => {
    let latestSessionInfo: MetaEmbeddedSignupSessionInfo | null = null;
    const originMatcher = /(^https:\/\/([a-z0-9-]+\.)?(facebook|fb)\.com$)|(^https:\/\/([a-z0-9-]+\.)?facebook\.net$)/i;

    const handleMessage = (event: MessageEvent) => {
      if (typeof event.origin !== "string" || !originMatcher.test(event.origin)) {
        return;
      }

      const extracted = extractMetaEmbeddedSignupSessionInfo(event.data);

      if (extracted) {
        latestSessionInfo = {
          ...latestSessionInfo,
          ...Object.fromEntries(
            Object.entries(extracted).filter(([, value]) => value !== null && value !== undefined),
          ),
        };
      }
    };

    window.addEventListener("message", handleMessage);

    sdk.login((response) => {
      const normalizedResponse = isRecord(response)
        ? {
            ...response,
            rawResponse: response,
            authResponse: isRecord(response.authResponse)
              ? response.authResponse as MetaFacebookAuthResponse
              : undefined,
            code: firstString(
              (response as Record<string, unknown>).code,
              (response as Record<string, unknown>).auth_code,
              (response as Record<string, unknown>).authorization_code,
            ) ?? undefined,
          }
        : response;

      window.setTimeout(() => {
        window.removeEventListener("message", handleMessage);
        resolve({
          ...normalizedResponse,
          sessionInfo: latestSessionInfo,
        });
      }, 600);
    }, {
      config_id: configurationId,
      response_type: "code",
      override_default_response_type: true,
      extras: extras ?? {
        feature: "whatsapp_embedded_signup",
        sessionInfoVersion: 3,
      },
    });
  });
}
