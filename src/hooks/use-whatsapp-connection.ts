import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, getApiErrorMessage } from "@/lib/api/client";
import { extractMetaAuthorizationCode, launchMetaEmbeddedSignup, loadMetaSdk } from "@/lib/meta-sdk";
import {
  completeEmbeddedSignup,
  disconnectWhatsApp,
  disconnectWhatsAppWeb,
  getWhatsAppConnectionStatus,
  getWhatsAppWebQr,
  startEmbeddedSignup,
  startWhatsAppWebConnection,
  syncProfileWhatsAppTemplates,
  testWhatsAppConnection,
} from "@/services/whatsapp-onboarding";
import type {
  ProfileWhatsAppConnection,
  WhatsAppEmbeddedSignupStartConfig,
  WhatsAppExchangeTokenResult,
  WhatsAppWebQrStatus,
} from "@/types/domain";

interface WhatsAppUiError {
  title: string;
  message: string;
  technicalDetails?: Record<string, unknown> | null;
}

const PROFILE_WHATSAPP_QUERY_KEY = ["profile", "whatsapp"] as const;

function buildTechnicalDetails(error: unknown) {
  if (error instanceof ApiError && typeof error.responseBody === "object" && error.responseBody !== null) {
    return error.responseBody as Record<string, unknown>;
  }

  if (error instanceof Error) {
    return { name: error.name, message: error.message };
  }

  return null;
}

function mapConnectionError(error: unknown): WhatsAppUiError {
  const technicalDetails = buildTechnicalDetails(error);

  if (error instanceof ApiError && typeof error.responseBody === "object" && error.responseBody !== null) {
    const responseBody = error.responseBody as Record<string, unknown>;
    const coexistenceErrorCode = responseBody.coexistence_error_code ?? responseBody.error_code ?? responseBody.meta_error_code;
    const eligibilityReason = responseBody.coexistence_reason ?? responseBody.eligibility_reason;

    if (coexistenceErrorCode || eligibilityReason) {
      return {
        title: "Numero nao elegivel para Coexistence",
        message: getApiErrorMessage(error, "A Meta informou que este numero nao pode concluir o Coexistence agora."),
        technicalDetails,
      };
    }
  }

  return {
    title: "Nao foi possivel concluir a conexao",
    message: getApiErrorMessage(error, "Falha ao conectar o WhatsApp agora."),
    technicalDetails,
  };
}

function resolveEmbeddedSignupConfig(config: WhatsAppEmbeddedSignupStartConfig) {
  const appId = config.appId ?? "";
  const configurationId = config.configurationId ?? "";
  const graphVersion = config.graphVersion ?? "v19.0";

  if (!appId || !configurationId) {
    throw new Error("META_APP_ID ou META_EMBEDDED_SIGNUP_CONFIGURATION_ID nao configurados.");
  }

  return {
    appId,
    configurationId,
    graphVersion,
    redirectUri: config.redirectUri ?? null,
    extras: config.extras ?? {
      feature: config.feature ?? "whatsapp_embedded_signup",
      sessionInfoVersion: config.sessionInfoVersion ?? 3,
    },
    state: config.state ?? null,
  };
}

export function useWhatsAppConnection() {
  const queryClient = useQueryClient();
  const [uiError, setUiError] = useState<WhatsAppUiError | null>(null);
  const [isWebQrModalOpen, setIsWebQrModalOpen] = useState(false);

  const connectionQuery = useQuery({
    queryKey: PROFILE_WHATSAPP_QUERY_KEY,
    queryFn: getWhatsAppConnectionStatus,
    retry: false,
    refetchInterval: (query) => {
      const connection = query.state.data;

      if (!isWebQrModalOpen || !connection || connection.provider !== "whatsapp_web") {
        return false;
      }

      return connection.status === "connected" ? 5000 : 3000;
    },
  });

  const startMutation = useMutation({
    mutationFn: startEmbeddedSignup,
  });

  const completeMutation = useMutation({
    mutationFn: completeEmbeddedSignup,
    onSuccess: (result) => {
      queryClient.setQueryData(PROFILE_WHATSAPP_QUERY_KEY, result.connection);
      void queryClient.invalidateQueries({ queryKey: PROFILE_WHATSAPP_QUERY_KEY });
    },
  });

  const startWebMutation = useMutation({
    mutationFn: startWhatsAppWebConnection,
    onSuccess: (result) => {
      queryClient.setQueryData(PROFILE_WHATSAPP_QUERY_KEY, result.connection ?? null);
      void queryClient.invalidateQueries({ queryKey: PROFILE_WHATSAPP_QUERY_KEY });
      setIsWebQrModalOpen(true);
    },
  });

  const testMutation = useMutation({
    mutationFn: testWhatsAppConnection,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROFILE_WHATSAPP_QUERY_KEY });
    },
  });

  const syncTemplatesMutation = useMutation({
    mutationFn: syncProfileWhatsAppTemplates,
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectWhatsApp,
    onSuccess: () => {
      queryClient.setQueryData(PROFILE_WHATSAPP_QUERY_KEY, null);
      void queryClient.invalidateQueries({ queryKey: PROFILE_WHATSAPP_QUERY_KEY });
    },
  });

  const disconnectWebMutation = useMutation({
    mutationFn: disconnectWhatsAppWeb,
    onSuccess: (result) => {
      queryClient.setQueryData(PROFILE_WHATSAPP_QUERY_KEY, result.connection ?? null);
      void queryClient.invalidateQueries({ queryKey: PROFILE_WHATSAPP_QUERY_KEY });
    },
  });

  const connection = useMemo(
    () => connectionQuery.data ?? null,
    [connectionQuery.data],
  );

  const webQrQuery = useQuery<WhatsAppWebQrStatus | null>({
    queryKey: [...PROFILE_WHATSAPP_QUERY_KEY, "web", "qr", connection?.webSessionId ?? "none"],
    queryFn: getWhatsAppWebQr,
    enabled: Boolean(isWebQrModalOpen && connection?.provider === "whatsapp_web" && connection?.webSessionId),
    retry: false,
    refetchInterval: connection?.status === "connected" ? 5000 : 3000,
  });

  const startConnection = async () => {
    setUiError(null);

    try {
      const startConfig = await startMutation.mutateAsync();
      const resolvedConfig = resolveEmbeddedSignupConfig(startConfig);
      const sdk = await loadMetaSdk({
        appId: resolvedConfig.appId,
        graphVersion: resolvedConfig.graphVersion,
      });
      const response = await launchMetaEmbeddedSignup(sdk, {
        configurationId: resolvedConfig.configurationId,
        extras: resolvedConfig.extras,
      });
      const code = extractMetaAuthorizationCode(response);

      if (!code) {
        const error = new Error("A Meta nao retornou o codigo de autorizacao do Embedded Signup.");
        Object.assign(error, {
          details: {
            response,
          },
        });
        throw error;
      }

      const savedConnection = await completeMutation.mutateAsync({
        code,
        state: resolvedConfig.state,
        authResponse: response.authResponse ?? null,
        extras: {
          ...resolvedConfig.extras,
          redirectUri: resolvedConfig.redirectUri,
        },
        sessionInfo: response.sessionInfo ?? null,
        test_to: import.meta.env.VITE_WHATSAPP_AUTO_TEST_TO ?? null,
        test_message: import.meta.env.VITE_WHATSAPP_AUTO_TEST_MESSAGE ?? null,
      });

      setUiError(null);
      return savedConnection;
    } catch (error) {
      const mappedError = mapConnectionError(error);
      setUiError(mappedError);
      throw error;
    }
  };

  const retryConnection = async () => startConnection();

  const startWebConnection = async () => {
    setUiError(null);

    try {
      return await startWebMutation.mutateAsync();
    } catch (error) {
      setUiError({
        title: "Nao foi possivel iniciar o WhatsApp Web",
        message: getApiErrorMessage(error, "Falha ao iniciar a sessao por QR Code."),
        technicalDetails: buildTechnicalDetails(error),
      });
      throw error;
    }
  };

  const clearUiError = () => {
    setUiError(null);
  };

  return {
    connection,
    connectionQuery,
    startConnection,
    retryConnection,
    startWebConnection,
    clearUiError,
    testConnection: testMutation.mutateAsync,
    syncTemplates: syncTemplatesMutation.mutateAsync,
    disconnectConnection: disconnectMutation.mutateAsync,
    disconnectWebConnection: disconnectWebMutation.mutateAsync,
    uiError,
    isWebQrModalOpen,
    setIsWebQrModalOpen,
    webQrStatus: webQrQuery.data ?? null,
    isLoadingConnection: connectionQuery.isLoading,
    isConnecting: startMutation.isPending || completeMutation.isPending,
    isStartingWeb: startWebMutation.isPending,
    isTesting: testMutation.isPending,
    isSyncingTemplates: syncTemplatesMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
    isDisconnectingWeb: disconnectWebMutation.isPending,
    isLoadingWebQr: webQrQuery.isLoading || webQrQuery.isFetching,
    lastTestResult: testMutation.data ?? null,
    lastSyncResult: syncTemplatesMutation.data ?? null,
  };
}

export function getProfileWhatsAppQueryKey() {
  return PROFILE_WHATSAPP_QUERY_KEY;
}

export function getWhatsAppConnectionErrorMessage(error: unknown) {
  return mapConnectionError(error);
}

export function resolveProfileWhatsAppConnection(connection: ProfileWhatsAppConnection | null | undefined) {
  return connection ?? null;
}

export function resolveWhatsAppExchangeTokenResult(result: WhatsAppExchangeTokenResult | null | undefined) {
  return result ?? null;
}
