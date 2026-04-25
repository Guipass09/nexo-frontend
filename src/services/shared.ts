import { apiClient } from "@/lib/api/client";
import { normalizeCollectionResponse, normalizeResourceResponse } from "@/lib/api/normalizers";
import type { ApiRequestConfig } from "@/lib/api/client";
import type { NormalizedCollectionResponse, NormalizedResourceResponse } from "@/types/laravel";

type FallbackFactory<T> = () => T;

export async function getWithFallback<T>(path: string, fallback: FallbackFactory<T>) {
  try {
    return await apiClient.get<T>(path);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn(`[services] Falling back to mock data for ${path}`, error);
    }

    return fallback();
  }
}

export async function getCollectionWithFallback<T>(
  path: string,
  fallback: FallbackFactory<T[]>,
  init?: Omit<ApiRequestConfig, "method" | "body">,
): Promise<NormalizedCollectionResponse<T>> {
  try {
    const response = await apiClient.get<unknown>(path, init);
    return normalizeCollectionResponse<T>(response);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn(`[services] Falling back to mock collection for ${path}`, error);
    }

    return { data: fallback() };
  }
}

export async function getResourceWithFallback<T>(
  path: string,
  fallback: FallbackFactory<T>,
  init?: Omit<ApiRequestConfig, "method" | "body">,
): Promise<NormalizedResourceResponse<T>> {
  try {
    const response = await apiClient.get<unknown>(path, init);
    return normalizeResourceResponse<T>(response);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn(`[services] Falling back to mock resource for ${path}`, error);
    }

    return { data: fallback() };
  }
}
