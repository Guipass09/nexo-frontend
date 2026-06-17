import { apiClient } from "@/lib/api/client";
import { normalizeCollectionResponse, normalizeResourceResponse } from "@/lib/api/normalizers";

export type AppointmentStatus = "pending" | "confirmed" | "cancelled";

export type Appointment = {
  id: number;
  customerName: string | null;
  service: string | null;
  scheduleDay: string | null;
  schedulePeriod: string | null;
  scheduleTime: string | null;
  scheduledText: string | null;
  startsAt: string | null;
  status: AppointmentStatus;
  source: "ai_agent" | "manual";
  notes: string | null;
  conversationId: number | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AppointmentPayload = {
  customer_name?: string;
  service?: string;
  schedule_day?: string;
  schedule_period?: string;
  schedule_time?: string;
  starts_at?: string;
  status?: AppointmentStatus;
  notes?: string;
};

export async function listAppointments(status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const response = normalizeCollectionResponse<Appointment>(await apiClient.get<unknown>(`/appointments${query}`));
  return response.data;
}

export async function createAppointment(payload: AppointmentPayload) {
  const response = normalizeResourceResponse<Appointment>(await apiClient.post<unknown>("/appointments", payload));
  return response.data;
}

export async function updateAppointment(id: number, payload: Partial<AppointmentPayload>) {
  const response = normalizeResourceResponse<Appointment>(await apiClient.put<unknown>(`/appointments/${id}`, payload));
  return response.data;
}

export async function deleteAppointment(id: number) {
  await apiClient.delete(`/appointments/${id}`);
}
