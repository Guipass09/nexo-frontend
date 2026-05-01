import type {
  LaravelCollectionResponse,
  LaravelLinksObject,
  LaravelPaginationMeta,
  LaravelResourceResponse,
  NormalizedCollectionResponse,
  NormalizedResourceResponse,
} from "@/types/laravel";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPaginationMeta(value: unknown): value is LaravelPaginationMeta {
  return (
    isRecord(value) &&
    typeof value.current_page === "number" &&
    typeof value.last_page === "number" &&
    typeof value.per_page === "number" &&
    typeof value.total === "number"
  );
}

function isLinksObject(value: unknown): value is LaravelLinksObject {
  return isRecord(value);
}

export function normalizeCollectionResponse<T>(payload: unknown): NormalizedCollectionResponse<T> {
  if (Array.isArray(payload)) {
    return { data: payload as T[] };
  }

  if (payload === null || payload === undefined) {
    return { data: [] };
  }

  if (!isRecord(payload)) {
    throw new Error("Invalid collection response format");
  }

  if (payload.data === null || payload.data === undefined) {
    const normalized: NormalizedCollectionResponse<T> = {
      data: [],
    };

    if (typeof payload.message === "string") {
      normalized.message = payload.message;
    }

    if (isLinksObject(payload.links)) {
      normalized.links = payload.links;
    }

    if (isPaginationMeta(payload.meta)) {
      normalized.meta = payload.meta;
    }

    return normalized;
  }

  if (Array.isArray(payload.data)) {
    const normalized: NormalizedCollectionResponse<T> = {
      data: payload.data as T[],
    };

    if (typeof payload.message === "string") {
      normalized.message = payload.message;
    }

    if (isLinksObject(payload.links)) {
      normalized.links = payload.links;
    }

    if (isPaginationMeta(payload.meta)) {
      normalized.meta = payload.meta;
    }

    return normalized;
  }

  if (isRecord(payload.data) && Array.isArray(payload.data.data)) {
    const nested = payload.data;
    const normalized: NormalizedCollectionResponse<T> = {
      data: nested.data as T[],
    };

    if (typeof payload.message === "string") {
      normalized.message = payload.message;
    }

    if (isLinksObject(nested.links)) {
      normalized.links = nested.links;
    } else if (isLinksObject(payload.links)) {
      normalized.links = payload.links;
    }

    if (isPaginationMeta(nested.meta)) {
      normalized.meta = nested.meta;
    } else if (isPaginationMeta(payload.meta)) {
      normalized.meta = payload.meta;
    }

    return normalized;
  }

  throw new Error("Collection response must be an array or an object with a data array");
}

export function normalizeResourceResponse<T>(payload: unknown): NormalizedResourceResponse<T> {
  if (!isRecord(payload) || !("data" in payload)) {
    return { data: payload as T };
  }

  const response = payload as LaravelResourceResponse<T>;
  return {
    data: response.data,
    message: response.message,
  };
}

export type SupportedLaravelCollection<T> = T[] | LaravelCollectionResponse<T>;
export type SupportedLaravelResource<T> = T | LaravelResourceResponse<T>;
