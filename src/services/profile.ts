import { apiClient } from "@/lib/api/client";
import type { AuthUser } from "@/lib/auth";

interface ProfileResponse {
  data: AuthUser & { tokenExpiresAt?: string | null };
  message?: string;
}

export async function getProfile() {
  return apiClient.get<ProfileResponse>("/profile");
}

export async function updateProfile(formData: FormData) {
  return apiClient.postForm<ProfileResponse>("/profile", formData);
}
