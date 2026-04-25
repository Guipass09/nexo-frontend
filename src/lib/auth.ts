const TOKEN_KEY = "nexo_auth_token";
const USER_KEY = "nexo_auth_user";
const NOTICE_KEY = "nexo_auth_notice";
const TOKEN_EXPIRES_AT_KEY = "nexo_auth_token_expires_at";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  companyName?: string | null;
  role: string;
  status?: "active" | "blocked";
  permissions?: Record<string, boolean> | null;
  tokenExpiresAt?: string | null;
}

export type UserPermissionKey =
  | "dashboard"
  | "conversations"
  | "journey"
  | "flows"
  | "sequences"
  | "audios"
  | "templates"
  | "contacts"
  | "media"
  | "reports"
  | "settings"
  | "audit"
  | "users";

export const USER_PERMISSION_LABELS: Record<UserPermissionKey, string> = {
  dashboard: "Dashboard",
  conversations: "Conversas",
  journey: "Jornada",
  flows: "Fluxos",
  sequences: "Sequencias",
  audios: "Audios",
  templates: "Templates",
  contacts: "Contatos",
  media: "Midia",
  reports: "Relatorios",
  settings: "Configuracoes",
  audit: "Auditoria",
  users: "Usuarios",
};

export function getDefaultPermissionsForRole(role: string): Record<UserPermissionKey, boolean> {
  if (role === "admin") {
    return {
      dashboard: true,
      conversations: true,
      journey: true,
      flows: true,
      sequences: true,
      audios: true,
      templates: true,
      contacts: true,
      media: true,
      reports: true,
      settings: true,
      audit: true,
      users: true,
    };
  }

  return {
    dashboard: true,
    conversations: true,
    journey: true,
    flows: true,
    sequences: true,
    audios: true,
    templates: true,
    contacts: true,
    media: true,
    reports: true,
    settings: true,
    audit: false,
    users: false,
  };
}

export function resolveUserPermissions(user: AuthUser | null | undefined): Record<UserPermissionKey, boolean> {
  const defaults = getDefaultPermissionsForRole(user?.role ?? "operator");

  if (!user?.permissions) {
    return defaults;
  }

  return {
    ...defaults,
    ...Object.fromEntries(
      Object.entries(user.permissions).map(([key, value]) => [key, Boolean(value)]),
    ),
  } as Record<UserPermissionKey, boolean>;
}

export function hasPermission(user: AuthUser | null | undefined, permission: UserPermissionKey) {
  return resolveUserPermissions(user)[permission];
}

function isBrowser() {
  return typeof window !== "undefined";
}

function buildHashLoginUrl() {
  if (!isBrowser()) {
    return "/";
  }

  return `${window.location.origin}${window.location.pathname}${window.location.search}#/`;
}

function maskToken(token: string | null) {
  if (!token) {
    return "none";
  }

  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

export function getAuthToken() {
  if (!isBrowser()) {
    return null;
  }

  if (isStoredTokenExpired()) {
    console.debug("[auth] stored token expired; clearing session");
    clearAuthSession();
    setAuthNotice("Sua sessao expirou. Entre novamente para continuar.");
    return null;
  }

  const token = window.localStorage.getItem(TOKEN_KEY);
  console.debug("[auth] read token", {
    hasToken: Boolean(token),
    token: maskToken(token),
  });

  return token;
}

export function setAuthSession(token: string, user: AuthUser, expiresAt?: string | null) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(TOKEN_KEY, token);
  if (expiresAt) {
    window.localStorage.setItem(TOKEN_EXPIRES_AT_KEY, expiresAt);
  } else {
    window.localStorage.removeItem(TOKEN_EXPIRES_AT_KEY);
  }
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.sessionStorage.removeItem(NOTICE_KEY);
  console.debug("[auth] session saved", {
    userEmail: user.email,
    role: user.role,
    expiresAt: expiresAt ?? null,
    token: maskToken(token),
  });
}

export function clearAuthSession() {
  if (!isBrowser()) {
    return;
  }

  console.debug("[auth] clearing session");
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem(TOKEN_EXPIRES_AT_KEY);
}

export function setAuthNotice(message: string) {
  if (!isBrowser()) {
    return;
  }

  window.sessionStorage.setItem(NOTICE_KEY, message);
}

export function consumeAuthNotice() {
  if (!isBrowser()) {
    return null;
  }

  const message = window.sessionStorage.getItem(NOTICE_KEY);

  if (!message) {
    return null;
  }

  window.sessionStorage.removeItem(NOTICE_KEY);

  return message;
}

export function getStoredAuthUser(): AuthUser | null {
  if (!isBrowser()) {
    return null;
  }

  const raw = window.localStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(getAuthToken());
}

export function getStoredTokenExpiresAt() {
  if (!isBrowser()) {
    return null;
  }

  return window.localStorage.getItem(TOKEN_EXPIRES_AT_KEY);
}

export function isStoredTokenExpired() {
  const expiresAt = getStoredTokenExpiresAt();

  if (!expiresAt) {
    return false;
  }

  const expiresAtMs = new Date(expiresAt).getTime();

  return Number.isFinite(expiresAtMs) && expiresAtMs <= Date.now();
}

export function handleUnauthorizedSession(message = "Sua sessao expirou. Entre novamente para continuar.") {
  if (!isBrowser()) {
    return;
  }

  console.debug("[auth] unauthorized session", { message });
  clearAuthSession();
  setAuthNotice(message);
  window.location.replace(buildHashLoginUrl());
}
