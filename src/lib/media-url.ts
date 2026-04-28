function resolveApiOrigin() {
  try {
    return new URL(import.meta.env.VITE_API_BASE_URL ?? "/api", window.location.origin).origin;
  } catch {
    return window.location.origin;
  }
}

function isRewriteCandidateHostname(hostname: string) {
  return hostname === "localhost"
    || hostname === "127.0.0.1"
    || hostname === "0.0.0.0"
    || hostname.endsWith(".ngrok-free.dev")
    || hostname.endsWith(".ngrok.app");
}

export function resolveMediaUrl(rawUrl?: string | null) {
  if (!rawUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(rawUrl, window.location.origin);
    const apiOrigin = resolveApiOrigin();

    if (parsedUrl.pathname.startsWith("/storage/") && parsedUrl.origin !== apiOrigin && isRewriteCandidateHostname(parsedUrl.hostname)) {
      return `${apiOrigin}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
    }

    return parsedUrl.toString();
  } catch {
    return rawUrl;
  }
}
