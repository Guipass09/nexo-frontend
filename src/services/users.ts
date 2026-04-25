import { apiClient } from "@/lib/api/client";
import { normalizeCollectionResponse, normalizeResourceResponse } from "@/lib/api/normalizers";
import type { ManagedUser } from "@/types/domain";

export interface UserPayload {
  name: string;
  email: string;
  role: "admin" | "operator";
  status: "active" | "blocked";
  permissions: Record<string, boolean>;
  password?: string;
  password_confirmation?: string;
}

export async function listUsers() {
  const response = await apiClient.get<unknown>("/users");
  return normalizeCollectionResponse<ManagedUser>(response).data;
}

export async function createUser(payload: UserPayload) {
  const response = await apiClient.post<unknown>("/users", payload);
  return normalizeResourceResponse<ManagedUser>(response).data;
}

export async function updateUser(userId: string, payload: UserPayload) {
  const response = await apiClient.put<unknown>(`/users/${userId}`, payload);
  return normalizeResourceResponse<ManagedUser>(response).data;
}

export async function deleteUser(userId: string) {
  await apiClient.delete(`/users/${userId}`);
}
