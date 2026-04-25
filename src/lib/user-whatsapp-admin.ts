export interface UserWhatsAppAdminOverride {
  connected: boolean;
  phone: string | null;
  connectedAt: string | null;
  lastMessageAt: string | null;
  updatedAt: string;
}

const STORAGE_KEY = "nexo_admin_user_whatsapp_overrides";

function isBrowser() {
  return typeof window !== "undefined";
}

function readStorage() {
  if (!isBrowser()) {
    return {} as Record<string, UserWhatsAppAdminOverride>;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return {} as Record<string, UserWhatsAppAdminOverride>;
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, UserWhatsAppAdminOverride>;
    return parsed ?? {};
  } catch {
    return {} as Record<string, UserWhatsAppAdminOverride>;
  }
}

function writeStorage(value: Record<string, UserWhatsAppAdminOverride>) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function getStoredUserWhatsAppAdminOverrides() {
  return readStorage();
}

export function saveUserWhatsAppAdminOverride(userId: string, override: UserWhatsAppAdminOverride) {
  const current = readStorage();
  const next = {
    ...current,
    [userId]: override,
  };

  writeStorage(next);

  return next;
}

export function removeUserWhatsAppAdminOverride(userId: string) {
  const current = readStorage();

  if (!(userId in current)) {
    return current;
  }

  const next = { ...current };
  delete next[userId];
  writeStorage(next);

  return next;
}
