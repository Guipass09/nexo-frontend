import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getAuthToken, getStoredTokenExpiresAt, setAuthSession } from "@/lib/auth";
import { me, refreshSession } from "@/services/auth";

const SESSION_REFRESH_OFFSET_MS = 5 * 60 * 1000;

export default function ProtectedRoute() {
  const location = useLocation();
  const token = getAuthToken();
  const refreshTimeoutRef = useRef<number | null>(null);
  const refreshInFlightRef = useRef(false);
  const authQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const response = await me();
      return response.data;
    },
    enabled: Boolean(token),
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (token && authQuery.data) {
      setAuthSession(token, authQuery.data, authQuery.data.tokenExpiresAt ?? null);
    }
  }, [authQuery.data, token]);

  useEffect(() => {
    if (refreshTimeoutRef.current !== null) {
      window.clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    if (!token) {
      return;
    }

    const expiresAt = getStoredTokenExpiresAt();

    if (!expiresAt) {
      return;
    }

    const expiresAtMs = new Date(expiresAt).getTime();

    if (!Number.isFinite(expiresAtMs)) {
      return;
    }

    const scheduleRefresh = () => {
      const nextExpiresAt = getStoredTokenExpiresAt();

      if (!nextExpiresAt) {
        return;
      }

      const nextExpiresAtMs = new Date(nextExpiresAt).getTime();

      if (!Number.isFinite(nextExpiresAtMs)) {
        return;
      }

      const refreshInMs = Math.max(nextExpiresAtMs - Date.now() - SESSION_REFRESH_OFFSET_MS, 5_000);

      refreshTimeoutRef.current = window.setTimeout(async () => {
        if (refreshInFlightRef.current) {
          return;
        }

        refreshInFlightRef.current = true;

        try {
          const response = await refreshSession();
          setAuthSession(response.data.token, response.data.user, response.data.expiresAt);
          scheduleRefresh();
        } catch {
          // 401 continua tratado globalmente
        } finally {
          refreshInFlightRef.current = false;
        }
      }, refreshInMs);
    };

    scheduleRefresh();

    return () => {
      if (refreshTimeoutRef.current !== null) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [token, authQuery.data?.tokenExpiresAt]);

  if (!token) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (token && authQuery.isPending && !authQuery.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="flex items-center gap-3 border-border/60 px-5 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Restaurando sua sessao...
        </Card>
      </div>
    );
  }

  if (token && authQuery.isError && !authQuery.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="max-w-md border-border/60 p-6">
          <h2 className="mb-2 text-lg font-semibold">Nao foi possivel restaurar a pagina</h2>
          <p className="text-sm text-muted-foreground">
            Sua sessao nao conseguiu ser validada no refresh. Tente entrar novamente.
          </p>
        </Card>
      </div>
    );
  }

  return <Outlet />;
}
