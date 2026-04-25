export interface LaravelPaginationLink {
  url: string | null;
  label: string;
  active: boolean;
  page?: number | null;
}

export interface LaravelPaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  links: LaravelPaginationLink[];
  path: string;
  per_page: number;
  to: number | null;
  total: number;
}

export interface LaravelLinksObject {
  first?: string | null;
  last?: string | null;
  prev?: string | null;
  next?: string | null;
}

export interface LaravelResourceResponse<T> {
  data: T;
  message?: string;
}

export interface LaravelPaginatedResponse<T> {
  data: T[];
  links: LaravelLinksObject;
  meta: LaravelPaginationMeta;
  message?: string;
}

export type LaravelCollectionResponse<T> = LaravelResourceResponse<T[]> | LaravelPaginatedResponse<T>;

export interface NormalizedCollectionResponse<T> {
  data: T[];
  links?: LaravelLinksObject;
  meta?: LaravelPaginationMeta;
  message?: string;
}

export interface NormalizedResourceResponse<T> {
  data: T;
  message?: string;
}
