import { apiClient } from "@/lib/api/client";
import type { AuthUser } from "@/lib/auth";

interface LoginResponse {
  data: {
    token: string;
    expiresAt: string | null;
    user: AuthUser;
  };
}

interface RegisterPayload {
  name: string;
  email: string;
  company_name?: string;
  password: string;
  password_confirmation: string;
}

interface SessionUserResponse {
  data: AuthUser & { tokenExpiresAt?: string | null };
}

function isSessionUserPayload(value: unknown): value is SessionUserResponse["data"] {
  return typeof value === "object"
    && value !== null
    && "id" in value
    && "email" in value
    && "role" in value;
}

export async function login(email: string, password: string) {
  return apiClient.post<LoginResponse>("/auth/login", { email, password });
}

export async function register(payload: RegisterPayload) {
  return apiClient.post<LoginResponse>("/auth/register", payload);
}

export async function refreshSession() {
  return apiClient.post<LoginResponse>("/auth/refresh");
}

export async function logout() {
  return apiClient.post<{ message: string }>("/auth/logout");
}

export async function me() {
  const response = await apiClient.get<unknown>("/auth/me");

  if (typeof response === "object" && response !== null && "data" in response && isSessionUserPayload(response.data)) {
    return { data: response.data };
  }

  if (isSessionUserPayload(response)) {
    return { data: response };
  }

  throw new Error("Resposta invalida ao validar sessao.");
}
