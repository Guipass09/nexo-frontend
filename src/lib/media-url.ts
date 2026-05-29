function resolveApiOrigin() {
  try {
    return new URL(import.meta.env.VITE_API_BASE_URL ?? "/api", window.location.origin).origin;
  } catch {
    return window.location.origin;
  }
}

function resolveMediaOrigin() {
  const hostname = window.location.hostname;
  const isVercelHost = hostname.endsWith(".vercel.app");

  if (isVercelHost) {
    return window.location.origin;
  }

  return resolveApiOrigin();
}

export function resolveMediaUrl(rawUrl?: string | null) {
  if (!rawUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(rawUrl, window.location.origin);
    const isStoragePath = parsedUrl.pathname.startsWith("/storage/");

    if (isStoragePath) {
      const mediaOrigin = resolveMediaOrigin();

      return `${mediaOrigin}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
    }

    return parsedUrl.toString();
  } catch {
    return rawUrl;
  }
}
