import { useEffect, useRef, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  audioSequences,
} from "@/data/mocks";
import {
  archiveMediaAsset,
  createTemplate,
  deleteTemplate,
  getMediaAsset,
  listAudioSequences,
  listMediaAssetLibrary,
  listMediaAssets,
  saveMediaAssetToLibrary,
  listTemplates,
  restoreMediaAsset,
  syncTemplates,
  updateTemplate,
  uploadMediaAsset,
  type MediaAssetFilters,
  type TemplatePayload,
} from "@/services/assets";
import { listAuditEventTypes, listAuditEvents, listOperators, type AuditFilters } from "@/services/audit";
import {
  createConversationRealtimeStream,
  createConversationsRealtimeStream,
  isRealtimeSupported,
  type RealtimeStatus,
} from "@/services/conversation-realtime";
import { getDashboardOverview } from "@/services/dashboard";
import {
  createConversation,
  deleteConversation,
  type ConversationFilters,
  type ConversationPayload,
  getConversationById,
  listConversationMessages,
  listConversations,
  listJourneyEvents,
  markConversationAsRead,
  sendConversationMessage,
  sendConversationMediaMessage,
  sendConversationTemplateMessage,
} from "@/services/conversations";
import { createContact, deleteContact, listContacts, type ContactPayload } from "@/services/contacts";
import {
  createFlow,
  createFlowBlock,
  deleteFlow,
  deleteFlowBlock,
  generateFlowDraft,
  listFlowBlocks,
  listFlows,
  updateFlow,
  updateFlowBlock,
  type FlowBlockPayload,
  type GenerateFlowDraftPayload,
  type FlowPayload,
} from "@/services/flows";
import { listReports } from "@/services/reports";
import {
  getWhatsAppSettings,
  listAiVocabularyMappings,
  sendAiVocabularyChatMessage,
  updateWhatsAppSettings,
  type UpdateWhatsAppSettingsPayload,
} from "@/services/settings";
import {
  createSequence,
  createSequenceMessage,
  deleteSequence,
  deleteSequenceMessage,
  listSequenceMessages,
  listSequences,
  updateSequence,
  updateSequenceMessage,
  type SequenceMessagePayload,
  type SequencePayload,
} from "@/services/sequences";
import { createUser, deleteUser, listUsers, updateUser, type UserPayload } from "@/services/users";
import { ApiError } from "@/lib/api/client";
import type { Conversation, ConversationMessage, MediaAssetType } from "@/types/domain";

const CONVERSATIONS_POLL_INTERVAL_MS = 8_000;
const ACTIVE_CONVERSATION_POLL_INTERVAL_MS = 2_500;
const ACTIVE_CONVERSATION_SUMMARY_POLL_INTERVAL_MS = 5_000;
const OPTIMISTIC_MATCH_WINDOW_MS = 120_000;

function shouldRetryTransientError(failureCount: number, error: unknown) {
  if (failureCount >= 2) {
    return false;
  }

  if (!(error instanceof ApiError)) {
    return true;
  }

  return error.status >= 500 || error.status === 429;
}

function formatLocalMessageTime(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getConversationMessageTimestamp(message: ConversationMessage) {
  return message.updatedAt ?? message.sentAt ?? message.createdAt ?? null;
}

function getConversationMessageSortTimestamp(message: ConversationMessage) {
  const rawTimestamp = getConversationMessageTimestamp(message);
  const parsed = rawTimestamp ? Date.parse(rawTimestamp) : Number.NaN;

  return Number.isNaN(parsed) ? null : parsed;
}

function getConversationMessageFingerprint(message: ConversationMessage) {
  return JSON.stringify([
    message.from,
    message.type,
    (message.rawText ?? message.text ?? "").trim(),
    message.templateId ?? "",
    message.templateName ?? "",
    message.mediaAsset?.id ?? "",
    message.mediaAsset?.originalName ?? "",
  ]);
}

function areConversationMessagesEquivalent(a: ConversationMessage, b: ConversationMessage) {
  if (a.id === b.id) {
    return true;
  }

  if (a.externalId && b.externalId && a.externalId === b.externalId) {
    return true;
  }

  const sameFingerprint = getConversationMessageFingerprint(a) === getConversationMessageFingerprint(b);

  if (!sameFingerprint) {
    return false;
  }

  const aTimestamp = getConversationMessageSortTimestamp(a);
  const bTimestamp = getConversationMessageSortTimestamp(b);

  if (aTimestamp === null || bTimestamp === null) {
    return a.isOptimistic || b.isOptimistic;
  }

  return Math.abs(aTimestamp - bTimestamp) <= OPTIMISTIC_MATCH_WINDOW_MS;
}

function mergeConversationMessageState(
  current: ConversationMessage,
  incoming: ConversationMessage,
): ConversationMessage {
  return {
    ...current,
    ...incoming,
    id: incoming.id || current.id,
    rawText: incoming.rawText ?? current.rawText,
    text: incoming.text || current.text,
    time: incoming.time || current.time,
    sentAt: incoming.sentAt ?? current.sentAt,
    createdAt: incoming.createdAt ?? current.createdAt,
    updatedAt: incoming.updatedAt ?? current.updatedAt,
    deliveryStatus: incoming.deliveryStatus ?? current.deliveryStatus,
    deliveryError: incoming.deliveryError ?? current.deliveryError,
    externalId: incoming.externalId ?? current.externalId,
    isOptimistic: incoming.isOptimistic ?? false,
    canRetry: incoming.canRetry ?? current.canRetry,
  };
}

function sortConversationMessages(messages: ConversationMessage[]) {
  return [...messages].sort((left, right) => {
    const leftTimestamp = getConversationMessageSortTimestamp(left);
    const rightTimestamp = getConversationMessageSortTimestamp(right);

    if (leftTimestamp === null && rightTimestamp === null) {
      return left.id.localeCompare(right.id);
    }

    if (leftTimestamp === null) {
      return 1;
    }

    if (rightTimestamp === null) {
      return -1;
    }

    if (leftTimestamp === rightTimestamp) {
      return left.id.localeCompare(right.id);
    }

    return leftTimestamp - rightTimestamp;
  });
}

function isDocumentVisible() {
  if (typeof document === "undefined") {
    return true;
  }

  return document.visibilityState === "visible";
}

function resolvePollingInterval(enabled: boolean, intervalMs: number) {
  return enabled && isDocumentVisible() ? intervalMs : false;
}

function useDocumentVisibility() {
  const [visible, setVisible] = useState(() => isDocumentVisible());

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const handleVisibilityChange = () => {
      setVisible(isDocumentVisible());
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return visible;
}

function buildOptimisticConversationMessage(conversationId: string, text: string): ConversationMessage {
  const timestamp = new Date().toISOString();
  const optimisticId = `optimistic:${conversationId}:${timestamp}`;

  return {
    id: optimisticId,
    from: "bot",
    type: "text",
    text,
    rawText: text,
    isOptimistic: true,
    canRetry: false,
    time: formatLocalMessageTime(timestamp),
    sentAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    deliveryStatus: "pending",
    deliveryError: null,
    externalId: null,
  };
}

function updateConversationSummaryInList(
  conversation: Conversation,
  message: ConversationMessage,
): Conversation {
  return {
    ...conversation,
    lastMessage: message.rawText ?? message.text,
    time: message.time || conversation.time,
    deliveryStatus: message.deliveryStatus ?? conversation.deliveryStatus ?? "pending",
  };
}

function normalizeSearchValue(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizePhoneSearch(value: string) {
  return value.replace(/\D+/g, "");
}

function conversationMatchesFilters(conversation: Conversation, filters: ConversationFilters) {
  const normalizedStatus = filters.status && filters.status !== "Todos"
    ? ({
      Ativos: "ativo",
      Aguardando: "aguardando",
      Humano: "humano",
      Finalizado: "finalizado",
    }[filters.status] ?? filters.status.toLowerCase())
    : undefined;

  if (normalizedStatus && conversation.status !== normalizedStatus) {
    return false;
  }

  if (filters.unread === "true" && conversation.unread <= 0) {
    return false;
  }

  if (filters.unread === "false" && conversation.unread > 0) {
    return false;
  }

  if (filters.deliveryStatus && conversation.deliveryStatus !== filters.deliveryStatus) {
    return false;
  }

  if (filters.tag && conversation.tag !== filters.tag) {
    return false;
  }

  if (filters.flow && conversation.flow !== filters.flow) {
    return false;
  }

  const search = filters.search?.trim();

  if (search) {
    const normalizedSearch = normalizeSearchValue(search);
    const normalizedPhone = normalizePhoneSearch(search);
    const haystack = normalizeSearchValue(`${conversation.name} ${conversation.phone}`);

    if (!haystack.includes(normalizedSearch) && (!normalizedPhone || !normalizePhoneSearch(conversation.phone).includes(normalizedPhone))) {
      return false;
    }
  }

  return true;
}

function areConversationSummariesEqual(a: Conversation, b: Conversation) {
  return a.id === b.id
    && a.lastMessage === b.lastMessage
    && a.time === b.time
    && a.unread === b.unread
    && a.status === b.status
    && a.tag === b.tag
    && a.flow === b.flow
    && a.deliveryStatus === b.deliveryStatus
    && a.serviceWindow?.isOpen === b.serviceWindow?.isOpen
    && a.serviceWindow?.requiresTemplate === b.serviceWindow?.requiresTemplate
    && a.serviceWindow?.closesAt === b.serviceWindow?.closesAt;
}

function sortConversationCollection(conversations: Conversation[], prioritizedConversationId?: string) {
  if (!prioritizedConversationId) {
    return conversations;
  }

  const prioritizedConversation = conversations.find((conversation) => conversation.id === prioritizedConversationId);

  if (!prioritizedConversation) {
    return conversations;
  }

  return [
    prioritizedConversation,
    ...conversations.filter((conversation) => conversation.id !== prioritizedConversationId),
  ];
}

function upsertConversationSummary(
  conversations: Conversation[] | undefined,
  summary: Conversation,
  options?: {
    prependIfMissing?: boolean;
    removeIfMissing?: boolean;
  },
) {
  if (!conversations) {
    return conversations;
  }

  if (!Array.isArray(conversations)) {
    return conversations;
  }

  const existingIndex = conversations.findIndex((conversation) => conversation.id === summary.id);

  if (existingIndex === -1) {
    return options?.prependIfMissing ? [summary, ...conversations] : conversations;
  }

  if (options?.removeIfMissing) {
    return conversations.filter((conversation) => conversation.id !== summary.id);
  }

  if (areConversationSummariesEqual(conversations[existingIndex], summary)) {
    return conversations;
  }

  return sortConversationCollection(
    conversations.map((conversation) => (
      conversation.id === summary.id ? { ...conversation, ...summary } : conversation
    )),
    summary.id,
  );
}

function updateConversationCaches(
  queryClient: QueryClient,
  conversationId: string,
  updater: (conversation: Conversation) => Conversation,
  options?: {
    prioritize?: boolean;
  },
) {
  queryClient.setQueryData<Conversation | null>(queryKeys.conversation(conversationId), (current) => {
    if (!current) {
      return current;
    }

    return updater(current);
  });

  queryClient.setQueriesData<Conversation[]>(
    { queryKey: queryKeys.conversations },
    (current) => {
      if (!current || !Array.isArray(current)) {
        return current;
      }

      const updated = current.map((conversation) => (
        conversation.id === conversationId ? updater(conversation) : conversation
      ));

      return sortConversationCollection(updated, options?.prioritize ? conversationId : undefined);
    },
  );
}

function removeConversationFromListCaches(queryClient: QueryClient, conversationId: string) {
  queryClient.setQueriesData<Conversation[]>(
    { queryKey: queryKeys.conversations },
    (current) => {
      if (!current || !Array.isArray(current)) {
        return current;
      }

      return current.filter((conversation) => conversation.id !== conversationId);
    },
  );
}

export function syncConversationSummaryCaches(
  queryClient: QueryClient,
  summary: Conversation,
  filters: ConversationFilters,
) {
  queryClient.setQueryData<Conversation | null>(queryKeys.conversation(summary.id), (current) => {
    if (!current || areConversationSummariesEqual(current, summary)) {
      return current;
    }

    return { ...current, ...summary };
  });

  queryClient.setQueriesData<Conversation[]>(
    { queryKey: queryKeys.conversations },
    (current) => upsertConversationSummary(current, summary),
  );

  const matchesActiveFilters = conversationMatchesFilters(summary, filters);

  queryClient.setQueryData<Conversation[]>(
    [...queryKeys.conversations, filters],
    (current) => upsertConversationSummary(current, summary, {
      prependIfMissing: matchesActiveFilters,
      removeIfMissing: !matchesActiveFilters,
    }),
  );
}

function syncConversationMessageCaches(
  queryClient: QueryClient,
  conversationId: string,
  message: ConversationMessage,
  optimisticId?: string,
) {
  queryClient.setQueryData<ConversationMessage[]>(
    queryKeys.conversationMessages(conversationId),
    (current) => {
      const existing = current ?? [];
      let matched = false;

      const nextMessages = existing.reduce<ConversationMessage[]>((accumulator, currentMessage) => {
        const shouldReplaceByOptimisticId = optimisticId && currentMessage.id === optimisticId;
        const shouldMergeEquivalent = areConversationMessagesEquivalent(currentMessage, message);

        if (!shouldReplaceByOptimisticId && !shouldMergeEquivalent) {
          accumulator.push(currentMessage);
          return accumulator;
        }

        if (!matched) {
          accumulator.push(mergeConversationMessageState(currentMessage, message));
          matched = true;
        }

        return accumulator;
      }, []);

      if (!matched) {
        nextMessages.push(message);
      }

      return sortConversationMessages(nextMessages);
    },
  );
}

function markOptimisticConversationMessageAsFailed(
  queryClient: QueryClient,
  conversationId: string,
  optimisticMessageId: string,
  errorMessage: string,
) {
  queryClient.setQueryData<ConversationMessage[]>(
    queryKeys.conversationMessages(conversationId),
    (current) => current?.map((message) => (
      message.id === optimisticMessageId
        ? {
          ...message,
          isOptimistic: false,
          canRetry: true,
          deliveryStatus: "failed",
          deliveryError: errorMessage,
        }
        : message
    )) ?? current,
  );
}

function updateConversationListFromMessage(
  queryClient: QueryClient,
  conversationId: string,
  message: ConversationMessage,
  options?: {
    prioritize?: boolean;
    unread?: number | ((currentUnread: number) => number);
  },
) {
  updateConversationCaches(
    queryClient,
    conversationId,
    (conversation) => {
      const nextUnread = typeof options?.unread === "function"
        ? options.unread(conversation.unread)
        : options?.unread;

      return {
        ...updateConversationSummaryInList(conversation, message),
        unread: nextUnread ?? conversation.unread,
      };
    },
    { prioritize: options?.prioritize },
  );
}

export function syncConversationListFromMessage(
  queryClient: QueryClient,
  conversationId: string,
  message: ConversationMessage,
  options?: {
    prioritize?: boolean;
    unread?: number | ((currentUnread: number) => number);
  },
) {
  syncConversationMessageCaches(queryClient, conversationId, message);
  updateConversationListFromMessage(queryClient, conversationId, message, options);
}

export const queryKeys = {
  dashboard: ["dashboard"] as const,
  conversations: ["conversations"] as const,
  conversation: (id: string) => ["conversations", id] as const,
  conversationMessages: (id: string) => ["conversations", id, "messages"] as const,
  journey: (id: string) => ["conversations", id, "journey"] as const,
  flows: ["flows"] as const,
  flowBlocks: (id: string) => ["flows", id, "blocks"] as const,
  sequences: ["sequences"] as const,
  sequenceMessages: (id: string) => ["sequences", id, "messages"] as const,
  contacts: ["contacts"] as const,
  reports: ["reports"] as const,
  audioSequences: ["audio-sequences"] as const,
  templates: ["templates"] as const,
  mediaAssets: (type?: string | null) => ["media-assets", type ?? "all"] as const,
  mediaAssetLibrary: (filters: MediaAssetFilters) => ["media-assets", "library", filters] as const,
  mediaAsset: (id: string) => ["media-assets", id] as const,
  operators: ["operators"] as const,
  users: ["users"] as const,
  auditEvents: ["audit-events"] as const,
  auditEventTypes: ["audit-event-types"] as const,
  whatsAppSettings: ["settings", "whatsapp"] as const,
  aiVocabularyMappings: ["settings", "ai-vocabulary", "mappings"] as const,
};

export function useDashboardOverview() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: getDashboardOverview,
    retry: shouldRetryTransientError,
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });
}

export function useConversations(filters: ConversationFilters = {}, options?: { realtimeConnected?: boolean }) {
  return useQuery({
    queryKey: [...queryKeys.conversations, filters],
    queryFn: () => listConversations(filters),
    retry: shouldRetryTransientError,
    placeholderData: keepPreviousData,
    staleTime: 3_000,
    refetchInterval: () => resolvePollingInterval(!options?.realtimeConnected, CONVERSATIONS_POLL_INTERVAL_MS),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  });
}

export function useConversationsRealtime(filters: ConversationFilters = {}) {
  const queryClient = useQueryClient();
  const streamRef = useRef<ReturnType<typeof createConversationsRealtimeStream> | null>(null);
  const [status, setStatus] = useState<RealtimeStatus>("idle");
  const enabled = isRealtimeSupported();
  const isVisible = useDocumentVisibility();

  useEffect(() => {
    streamRef.current?.close();
    streamRef.current = null;

    if (!enabled || !isVisible) {
      setStatus("idle");
      return;
    }

    streamRef.current = createConversationsRealtimeStream({
      onStatusChange: setStatus,
      onSummaryUpsert: ({ conversation }) => {
        syncConversationSummaryCaches(queryClient, conversation, filters);
      },
    });

    return () => {
      streamRef.current?.close();
      streamRef.current = null;
    };
  }, [enabled, filters, isVisible, queryClient]);

  return {
    enabled,
    status,
    isConnected: status === "connected",
  };
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ConversationPayload) => createConversation(payload),
    onSuccess: (conversation) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
      if (conversation?.id) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.conversation(conversation.id) });
      }
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => deleteConversation(conversationId),
    onMutate: async (conversationId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.conversations });
      removeConversationFromListCaches(queryClient, conversationId);
      queryClient.removeQueries({ queryKey: queryKeys.conversation(conversationId) });
      queryClient.removeQueries({ queryKey: queryKeys.conversationMessages(conversationId) });
    },
    onSuccess: (_response, conversationId) => {
      removeConversationFromListCaches(queryClient, conversationId);
      queryClient.removeQueries({ queryKey: queryKeys.conversation(conversationId) });
      queryClient.removeQueries({ queryKey: queryKeys.conversationMessages(conversationId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });
}

export function useConversationById(id: string | null, options?: { realtimeConnected?: boolean }) {
  return useQuery({
    queryKey: queryKeys.conversation(id ?? "preview"),
    queryFn: () => getConversationById(id ?? ""),
    enabled: Boolean(id),
    retry: shouldRetryTransientError,
    placeholderData: keepPreviousData,
    refetchInterval: () => resolvePollingInterval(
      Boolean(id),
      options?.realtimeConnected ? 10_000 : ACTIVE_CONVERSATION_SUMMARY_POLL_INTERVAL_MS,
    ),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  });
}

export function useConversationMessages(id: string | null, options?: { realtimeConnected?: boolean }) {
  return useQuery({
    queryKey: queryKeys.conversationMessages(id ?? "preview"),
    queryFn: () => listConversationMessages(id ?? ""),
    enabled: Boolean(id),
    retry: shouldRetryTransientError,
    placeholderData: keepPreviousData,
    refetchInterval: () => resolvePollingInterval(
      Boolean(id),
      options?.realtimeConnected ? 8_000 : ACTIVE_CONVERSATION_POLL_INTERVAL_MS,
    ),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  });
}

export function useConversationRealtime(conversationId: string | null) {
  const queryClient = useQueryClient();
  const streamRef = useRef<ReturnType<typeof createConversationRealtimeStream> | null>(null);
  const [status, setStatus] = useState<RealtimeStatus>("idle");
  const enabled = isRealtimeSupported();
  const isVisible = useDocumentVisibility();

  useEffect(() => {
    streamRef.current?.close();
    streamRef.current = null;

    if (!enabled || !conversationId || !isVisible) {
      setStatus("idle");
      return;
    }

    streamRef.current = createConversationRealtimeStream({
      conversationId,
      getCursor: () => {
        const messages = queryClient.getQueryData<ConversationMessage[]>(
          queryKeys.conversationMessages(conversationId),
        ) ?? [];

        const lastMessage = [...messages].reverse().find((message) => message.type !== "event");

        return {
          updatedAt: lastMessage?.updatedAt ?? lastMessage?.createdAt ?? lastMessage?.sentAt ?? null,
          messageId: lastMessage?.id ?? null,
        };
      },
      onStatusChange: setStatus,
      onMessageUpsert: ({ message }) => {
        syncConversationListFromMessage(queryClient, conversationId, message, {
          prioritize: true,
          unread: 0,
        });
      },
      onError: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.conversationMessages(conversationId) });
      },
    });

    return () => {
      streamRef.current?.close();
      streamRef.current = null;
    };
  }, [conversationId, enabled, isVisible, queryClient]);

  return {
    enabled,
    status,
    isConnected: status === "connected",
  };
}

export function useMarkConversationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => markConversationAsRead(conversationId),
    onSuccess: (_response, conversationId) => {
      updateConversationCaches(queryClient, conversationId, (conversation) => ({
        ...conversation,
        unread: 0,
      }));
    },
  });
}

export function useSendConversationMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, text }: { conversationId: string; text: string }) =>
      sendConversationMessage(conversationId, text),
    onMutate: async ({ conversationId, text }) => {
      const normalizedText = text.trim();

      await queryClient.cancelQueries({ queryKey: queryKeys.conversationMessages(conversationId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.conversation(conversationId) });

      const optimisticMessage = buildOptimisticConversationMessage(conversationId, normalizedText);

      syncConversationMessageCaches(queryClient, conversationId, optimisticMessage);
      updateConversationListFromMessage(queryClient, conversationId, optimisticMessage, {
        prioritize: true,
        unread: 0,
      });

      return {
        conversationId,
        optimisticMessageId: optimisticMessage.id,
      };
    },
    onSuccess: (_response, { conversationId }) => {
      const message = _response;

      syncConversationMessageCaches(queryClient, conversationId, message);
      updateConversationListFromMessage(queryClient, conversationId, message, {
        prioritize: true,
        unread: 0,
      });
    },
    onError: (_error, { conversationId }, context) => {
      const message = _error instanceof Error ? _error.message : "Nao foi possivel enviar a mensagem.";

      if (context?.optimisticMessageId) {
        markOptimisticConversationMessageAsFailed(
          queryClient,
          conversationId,
          context.optimisticMessageId,
          message,
        );
      }

    },
    onSettled: (_response, _error, { conversationId }, context) => {
      if (_response && context?.optimisticMessageId) {
        syncConversationMessageCaches(queryClient, conversationId, _response, context.optimisticMessageId);
      }
    },
  });
}

export function useSendConversationTemplateMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, templateId, variables, media }: { conversationId: string; templateId: string; variables?: Record<string, unknown>; media?: Record<string, unknown> }) =>
      sendConversationTemplateMessage(conversationId, templateId, variables, media),
    onSuccess: (message, { conversationId }) => {
      syncConversationMessageCaches(queryClient, conversationId, message);
      syncConversationListFromMessage(queryClient, conversationId, message, {
        prioritize: true,
        unread: 0,
      });
    },
  });
}

export function useSendConversationMediaMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, media }: {
      conversationId: string;
      media: {
        type: MediaAssetType;
        source: "url" | "id" | "asset";
        url?: string;
        id?: string;
        asset_id?: string | number;
        caption?: string;
        filename?: string;
      };
    }) => sendConversationMediaMessage(conversationId, media),
    onSuccess: (message, { conversationId }) => {
      syncConversationMessageCaches(queryClient, conversationId, message);
      syncConversationListFromMessage(queryClient, conversationId, message, {
        prioritize: true,
        unread: 0,
      });
    },
  });
}

export function useJourneyEvents(id: string | null) {
  return useQuery({
    queryKey: queryKeys.journey(id ?? "preview"),
    queryFn: () => listJourneyEvents(id ?? ""),
    enabled: Boolean(id),
    retry: false,
  });
}

export function useWhatsAppSettings() {
  return useQuery({
    queryKey: queryKeys.whatsAppSettings,
    queryFn: getWhatsAppSettings,
    retry: false,
  });
}

export function useUpdateWhatsAppSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateWhatsAppSettingsPayload) => updateWhatsAppSettings(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.whatsAppSettings });
    },
  });
}

export function useAiVocabularyMappings(enabled = true) {
  return useQuery({
    queryKey: queryKeys.aiVocabularyMappings,
    queryFn: listAiVocabularyMappings,
    retry: false,
    enabled,
  });
}

export function useAiVocabularyChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (message: string) => sendAiVocabularyChatMessage(message),
    onSuccess: (result) => {
      queryClient.setQueryData(queryKeys.aiVocabularyMappings, result.recentMappings);
      void queryClient.invalidateQueries({ queryKey: queryKeys.aiVocabularyMappings });
    },
  });
}

export function useFlows() {
  return useQuery({
    queryKey: queryKeys.flows,
    queryFn: listFlows,
    retry: false,
  });
}

export function useFlowBlocks(id: string | null) {
  return useQuery({
    queryKey: queryKeys.flowBlocks(id ?? "preview"),
    queryFn: () => listFlowBlocks(id ?? ""),
    enabled: Boolean(id),
    retry: false,
  });
}

export function useCreateFlow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FlowPayload) => createFlow(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.flows });
    },
  });
}

export function useGenerateFlowDraft() {
  return useMutation({
    mutationFn: (payload: GenerateFlowDraftPayload) => generateFlowDraft(payload),
  });
}

export function useUpdateFlow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ flowId, payload }: { flowId: string; payload: Partial<FlowPayload> }) => updateFlow(flowId, payload),
    onSuccess: (_response, { flowId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.flows });
      void queryClient.invalidateQueries({ queryKey: queryKeys.flowBlocks(flowId) });
    },
  });
}

export function useDeleteFlow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (flowId: string) => deleteFlow(flowId),
    onSuccess: (_response, flowId) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.flows });
      void queryClient.removeQueries({ queryKey: queryKeys.flowBlocks(flowId) });
    },
  });
}

export function useCreateFlowBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ flowId, payload }: { flowId: string; payload: FlowBlockPayload }) => createFlowBlock(flowId, payload),
    onSuccess: (_response, { flowId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.flows });
      void queryClient.invalidateQueries({ queryKey: queryKeys.flowBlocks(flowId) });
    },
  });
}

export function useUpdateFlowBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ flowId, blockId, payload }: { flowId: string; blockId: string; payload: Partial<FlowBlockPayload> }) =>
      updateFlowBlock(flowId, blockId, payload),
    onSuccess: (_response, { flowId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.flows });
      void queryClient.invalidateQueries({ queryKey: queryKeys.flowBlocks(flowId) });
    },
  });
}

export function useDeleteFlowBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ flowId, blockId }: { flowId: string; blockId: string }) => deleteFlowBlock(flowId, blockId),
    onSuccess: (_response, { flowId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.flows });
      void queryClient.invalidateQueries({ queryKey: queryKeys.flowBlocks(flowId) });
    },
  });
}

export function useSequences() {
  return useQuery({
    queryKey: queryKeys.sequences,
    queryFn: listSequences,
    retry: false,
  });
}

export function useSequenceMessages(id: string | null) {
  return useQuery({
    queryKey: queryKeys.sequenceMessages(id ?? "preview"),
    queryFn: () => listSequenceMessages(id ?? ""),
    enabled: Boolean(id),
    retry: false,
  });
}

export function useCreateSequence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SequencePayload) => createSequence(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sequences });
    },
  });
}

export function useUpdateSequence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sequenceId, payload }: { sequenceId: string; payload: Partial<SequencePayload> }) =>
      updateSequence(sequenceId, payload),
    onSuccess: (_response, { sequenceId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sequences });
      void queryClient.invalidateQueries({ queryKey: queryKeys.sequenceMessages(sequenceId) });
    },
  });
}

export function useDeleteSequence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sequenceId: string) => deleteSequence(sequenceId),
    onSuccess: (_response, sequenceId) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sequences });
      void queryClient.removeQueries({ queryKey: queryKeys.sequenceMessages(sequenceId) });
    },
  });
}

export function useCreateSequenceMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sequenceId, payload }: { sequenceId: string; payload: SequenceMessagePayload }) =>
      createSequenceMessage(sequenceId, payload),
    onSuccess: (_response, { sequenceId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sequences });
      void queryClient.invalidateQueries({ queryKey: queryKeys.sequenceMessages(sequenceId) });
    },
  });
}

export function useUpdateSequenceMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sequenceId, messageId, payload }: { sequenceId: string; messageId: string; payload: Partial<SequenceMessagePayload> }) =>
      updateSequenceMessage(sequenceId, messageId, payload),
    onSuccess: (_response, { sequenceId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sequences });
      void queryClient.invalidateQueries({ queryKey: queryKeys.sequenceMessages(sequenceId) });
    },
  });
}

export function useDeleteSequenceMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sequenceId, messageId }: { sequenceId: string; messageId: string }) => deleteSequenceMessage(sequenceId, messageId),
    onSuccess: (_response, { sequenceId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sequences });
      void queryClient.invalidateQueries({ queryKey: queryKeys.sequenceMessages(sequenceId) });
    },
  });
}

export function useContacts() {
  return useQuery({
    queryKey: queryKeys.contacts,
    queryFn: listContacts,
    retry: false,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ContactPayload) => createContact(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.contacts });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contactId: string) => deleteContact(contactId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.contacts });
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });
}

export function useReports() {
  return useQuery({
    queryKey: queryKeys.reports,
    queryFn: listReports,
    retry: false,
  });
}

export function useAudioSequences() {
  return useQuery({
    queryKey: queryKeys.audioSequences,
    queryFn: listAudioSequences,
    initialData: audioSequences,
  });
}

export function useTemplates() {
  return useQuery({
    queryKey: queryKeys.templates,
    queryFn: listTemplates,
    retry: false,
  });
}

export function useSyncTemplates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncTemplates,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.templates });
    },
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TemplatePayload) => createTemplate(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.templates });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ templateId, payload }: { templateId: string; payload: TemplatePayload }) => updateTemplate(templateId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.templates });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) => deleteTemplate(templateId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.templates });
    },
  });
}

export function useMediaAssets(type?: MediaAssetType | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.mediaAssets(type),
    queryFn: () => listMediaAssets(type),
    retry: false,
    enabled: options?.enabled ?? true,
  });
}

export function useMediaAssetLibrary(filters: MediaAssetFilters) {
  return useQuery({
    queryKey: queryKeys.mediaAssetLibrary(filters),
    queryFn: () => listMediaAssetLibrary(filters),
    retry: false,
  });
}

export function useMediaAsset(assetId: string | null) {
  return useQuery({
    queryKey: queryKeys.mediaAsset(assetId ?? "preview"),
    queryFn: () => getMediaAsset(assetId ?? ""),
    enabled: Boolean(assetId),
  });
}

export function useUploadMediaAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ type, file }: { type: MediaAssetType; file: File }) =>
      uploadMediaAsset(type, file),
    onSuccess: (_response, { type }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.mediaAssets(type) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.mediaAssets(null) });
      void queryClient.invalidateQueries({ queryKey: ["media-assets", "library"] });
    },
  });
}

export function useSaveMediaAssetToLibrary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assetId: string) => saveMediaAssetToLibrary(assetId),
    onSuccess: (asset) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.mediaAssets });
      void queryClient.invalidateQueries({ queryKey: ["media-assets", "library"] });
      if (asset?.id) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.mediaAsset(String(asset.id)) });
      }
    },
  });
}

export function useArchiveMediaAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archiveMediaAsset,
    onSuccess: (asset) => {
      void queryClient.invalidateQueries({ queryKey: ["media-assets"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.mediaAsset(asset.id) });
    },
  });
}

export function useRestoreMediaAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: restoreMediaAsset,
    onSuccess: (asset) => {
      void queryClient.invalidateQueries({ queryKey: ["media-assets"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.mediaAsset(asset.id) });
    },
  });
}

export function useOperators(enabled = true) {
  return useQuery({
    queryKey: queryKeys.operators,
    queryFn: listOperators,
    retry: false,
    enabled,
  });
}

export function useUsers(enabled = true) {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: listUsers,
    retry: false,
    enabled,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UserPayload) => createUser(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users });
      void queryClient.invalidateQueries({ queryKey: queryKeys.operators });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: UserPayload }) => updateUser(userId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users });
      void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.operators });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users });
      void queryClient.invalidateQueries({ queryKey: queryKeys.operators });
    },
  });
}

export function useAuditEvents(filters: AuditFilters = {}, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.auditEvents, filters],
    queryFn: () => listAuditEvents(filters),
    retry: false,
    enabled,
  });
}

export function useAuditEventTypes(filters: Omit<AuditFilters, "type" | "page" | "perPage"> = {}, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.auditEventTypes, filters],
    queryFn: () => listAuditEventTypes(filters),
    retry: false,
    enabled,
  });
}
