import { getAuthToken, handleUnauthorizedSessionForToken } from "@/lib/auth";

type Primitive = string | number | boolean | null | undefined;
type QueryValue = Primitive | Primitive[];

export interface ApiClientConfig {
  baseURL?: string;
  headers?: HeadersInit;
}

export interface ApiRequestConfig extends RequestInit {
  query?: Record<string, QueryValue>;
}

const API_REQUEST_TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly responseBody?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getApiErrorMessage(error: unknown, fallback = "Falha ao carregar dados da API.") {
  if (error instanceof ApiError) {
    const body = error.responseBody;

    if (typeof body === "object" && body !== null && "message" in body && typeof body.message === "string") {
      return body.message;
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function buildUrl(path: string, baseURL?: string, query?: Record<string, QueryValue>) {
  const normalizedBaseUrl = baseURL?.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const target = normalizedBaseUrl ? `${normalizedBaseUrl}${normalizedPath}` : normalizedPath;
  const url = new URL(target, window.location.origin);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }

      const values = Array.isArray(value) ? value : [value];
      values.forEach((item) => {
        if (item !== undefined && item !== null) {
          url.searchParams.append(key, String(item));
        }
      });
    });
  }

  return url.toString();
}

export function buildApiUrl(path: string, baseURL?: string, query?: Record<string, QueryValue>) {
  return buildUrl(path, baseURL, query);
}

export function resolveApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  if (typeof window === "undefined") {
    return "/api";
  }

  const hostname = window.location.hostname;
  const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";

  if (isLocalHost) {
    return configuredBaseUrl || "/api";
  }

  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  if (hostname.endsWith(".vercel.app")) {
    return "/api";
  }

  return "/api";
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

function maskToken(token: string | null) {
  if (!token) {
    return "none";
  }

  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

export function shouldSendNgrokBrowserWarningHeader(url: string) {
  try {
    const target = new URL(url, window.location.origin);

    if (target.hostname.endsWith(".ngrok-free.dev") || target.hostname.endsWith(".ngrok.app")) {
      return true;
    }

    const currentHostname = window.location.hostname;
    const isVercelPreview = currentHostname.endsWith(".vercel.app");
    const isSameOriginApiRequest = target.origin === window.location.origin && target.pathname.startsWith("/api/");

    return isVercelPreview && isSameOriginApiRequest;
  } catch {
    return false;
  }
}

function shouldSkipNgrokBrowserWarning(url: string) {
  return shouldSendNgrokBrowserWarningHeader(url);
}

function buildRequestSignal(signal?: AbortSignal | null) {
  const controller = new AbortController();
  let timeoutId: number | null = null;

  const abortWithReason = (reason?: unknown) => {
    if (!controller.signal.aborted) {
      controller.abort(reason);
    }
  };

  if (signal) {
    if (signal.aborted) {
      abortWithReason(signal.reason);
    } else {
      signal.addEventListener("abort", () => abortWithReason(signal.reason), { once: true });
    }
  }

  timeoutId = window.setTimeout(() => {
    abortWithReason(new Error("API request timed out."));
  }, API_REQUEST_TIMEOUT_MS);

  return {
    signal: controller.signal,
    cleanup() {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    },
  };
}

export class ApiClient {
  constructor(private readonly config: ApiClientConfig = {}) {}

  async request<T>(path: string, init: ApiRequestConfig = {}): Promise<T> {
    const { query, headers, ...requestInit } = init;
    const isFormData = typeof FormData !== "undefined" && requestInit.body instanceof FormData;
    const token = getAuthToken();
    const url = buildUrl(path, this.config.baseURL, query);
    const method = requestInit.method ?? "GET";
    const skipNgrokBrowserWarning = shouldSkipNgrokBrowserWarning(url);
    const requestSignal = buildRequestSignal(requestInit.signal);

    console.debug("[api] request", {
      method,
      path,
      url,
      hasToken: Boolean(token),
      token: maskToken(token),
    });

    let response: Response;

    try {
      response = await fetch(url, {
        ...requestInit,
        signal: requestSignal.signal,
        headers: {
          Accept: "application/json",
          ...(!isFormData ? { "Content-Type": "application/json" } : {}),
          ...(skipNgrokBrowserWarning ? { "ngrok-skip-browser-warning": "true" } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...this.config.headers,
          ...headers,
        },
      });
    } catch (error) {
      requestSignal.cleanup();

      if (requestSignal.signal.aborted) {
        throw new ApiError("Request timed out.", 408);
      }

      throw error;
    }

    requestSignal.cleanup();

    const data = await parseResponse(response);

    console.debug("[api] response", {
      method,
      path,
      url,
      status: response.status,
      ok: response.ok,
      hasToken: Boolean(token),
      token: maskToken(token),
    });

    if (!response.ok) {
      if (response.status === 401) {
        const message = typeof data === "object" && data !== null && "message" in data && typeof data.message === "string"
          ? data.message
          : undefined;
        handleUnauthorizedSessionForToken(token, message === "Session expired."
          ? "Sua sessao expirou. Entre novamente para continuar."
          : message);
      }

      throw new ApiError(`Request failed with status ${response.status}`, response.status, data);
    }

    return data as T;
  }

  get<T>(path: string, init?: Omit<ApiRequestConfig, "method" | "body">) {
    return this.request<T>(path, { ...init, method: "GET" });
  }

  post<T>(path: string, body?: unknown, init?: Omit<ApiRequestConfig, "method" | "body">) {
    return this.request<T>(path, {
      ...init,
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  put<T>(path: string, body?: unknown, init?: Omit<ApiRequestConfig, "method" | "body">) {
    return this.request<T>(path, {
      ...init,
      method: "PUT",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  delete<T>(path: string, init?: Omit<ApiRequestConfig, "method" | "body">) {
    return this.request<T>(path, {
      ...init,
      method: "DELETE",
    });
  }

  postForm<T>(path: string, body: FormData, init?: Omit<ApiRequestConfig, "method" | "body">) {
    return this.request<T>(path, {
      ...init,
      method: "POST",
      body,
    });
  }
}

export const apiClient = new ApiClient({
  baseURL: resolveApiBaseUrl(),
});
