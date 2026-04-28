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
  const response = await fetch(sourceUrl, {
    headers: {
      "ngrok-skip-browser-warning": "true",
    },
  });

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
      throw error;
    });

  browserSafeMediaUrlCache.set(sourceUrl, pendingUrl);

  return pendingUrl;
}
