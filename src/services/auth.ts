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
  return apiClient.get<{ data: AuthUser & { tokenExpiresAt?: string | null } }>("/auth/me");
}
