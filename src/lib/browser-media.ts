import { getAuthToken } from "@/lib/auth";

const browserSafeMediaUrlCache = new Map<string, Promise<string> | string>();

function shouldBypassDirectBrowserLoad(sourceUrl: string) {
  try {
    const url = new URL(sourceUrl, window.location.origin);

    return url.hostname.endsWith(".ngrok-free.dev") || url.hostname.endsWith(".ngrok.app");
  } catch {
    return false;
  }
}

async function fetchAsObjectUrl(sourceUrl: string) {
  const headers = new Headers({
    "ngrok-skip-browser-warning": "true",
  });

  try {
    const url = new URL(sourceUrl, window.location.origin);
    const token = getAuthToken();

    if (token && url.pathname.startsWith("/api/media-assets/")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  } catch {
    // Ignore malformed URLs and let fetch handle the failure.
  }

  const response = await fetch(sourceUrl, { headers });

  if (!response.ok) {
    throw new Error(`Media request failed with status ${response.status}`);
  }

  const blob = await response.blob();

  return URL.createObjectURL(blob);
}

export async function getBrowserSafeMediaUrl(sourceUrl: string) {
  if (!shouldBypassDirectBrowserLoad(sourceUrl)) {
    return sourceUrl;
  }

  const cached = browserSafeMediaUrlCache.get(sourceUrl);

  if (typeof cached === "string") {
    return cached;
  }

  if (cached) {
    return cached;
  }

  const pendingUrl = fetchAsObjectUrl(sourceUrl)
    .then((objectUrl) => {
      browserSafeMediaUrlCache.set(sourceUrl, objectUrl);

      return objectUrl;
    })
    .catch((error) => {
      browserSafeMediaUrlCache.delete(sourceUrl);

      console.warn("Falling back to direct media URL after browser-safe fetch failure.", {
        sourceUrl,
        message: error instanceof Error ? error.message : String(error),
      });

      return sourceUrl;
    });

  browserSafeMediaUrlCache.set(sourceUrl, pendingUrl);

  return pendingUrl;
}
