import { useEffect, useMemo, useState } from "react";
import { getBrowserSafeMediaUrl } from "@/lib/browser-media";
import { resolveMediaUrl } from "@/lib/media-url";

export function useBrowserMediaUrl(rawUrl?: string | null) {
  const resolvedUrl = useMemo(() => resolveMediaUrl(rawUrl), [rawUrl]);
  const [mediaUrl, setMediaUrl] = useState<string | null>(resolvedUrl);

  useEffect(() => {
    let cancelled = false;

    if (!resolvedUrl) {
      setMediaUrl(null);
      return undefined;
    }

    setMediaUrl(null);

    void getBrowserSafeMediaUrl(resolvedUrl)
      .then((nextUrl) => {
        if (!cancelled) {
          setMediaUrl(nextUrl);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMediaUrl(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [resolvedUrl]);

  return mediaUrl;
}
