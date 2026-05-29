import { apiClient } from "@/lib/api/client";
import type { AuthUser } from "@/lib/auth";

interface ProfileResponse {
  data: AuthUser & { tokenExpiresAt?: string | null };
  message?: string;
}

export interface UpdateProfilePayload {
  name: string;
  email: string;
  company_name: string;
  remove_avatar?: boolean;
  avatar_data_url?: string | null;
}

export async function getProfile() {
  return apiClient.get<ProfileResponse>("/profile");
}

export async function updateProfile(payload: UpdateProfilePayload) {
  return apiClient.post<ProfileResponse>("/profile", payload);
}
