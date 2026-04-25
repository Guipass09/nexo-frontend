import type { Contact } from "@/types/domain";
import { apiClient } from "@/lib/api/client";
import { normalizeCollectionResponse, normalizeResourceResponse } from "@/lib/api/normalizers";

export type ContactPayload = {
  name: string;
  phone: string;
  origin?: string;
  status?: string;
  tags?: string[];
  avatar_url?: string;
  flow?: string;
  responsible?: string;
};

export async function listContacts() {
  const response = normalizeCollectionResponse<Contact>(await apiClient.get<unknown>("/contacts"));
  return response.data;
}

export async function createContact(payload: ContactPayload) {
  const response = normalizeResourceResponse<Contact>(await apiClient.post<unknown>("/contacts", payload));
  return response.data;
}
