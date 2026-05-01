import { buildApiUrl, resolveApiBaseUrl, shouldSendNgrokBrowserWarningHeader } from "@/lib/api/client";
import { getAuthToken, handleUnauthorizedSessionForToken } from "@/lib/auth";
import type { Conversation, ConversationMessage } from "@/types/domain";

type RealtimeStatus = "idle" | "connecting" | "connected" | "disconnected" | "error";

interface ConversationRealtimeCursor {
  updatedAt?: string | null;
  messageId?: string | null;
}

interface ConversationRealtimeEventMap {
  "conversation.message.upsert": {
    conversationId: string;
    message: ConversationMessage;
  };
  "conversation.stream.ready": {
    conversationId: string;
    cursorUpdatedAt?: string | null;
    cursorMessageId?: string | null;
  };
  "conversation.stream.ping": {
    conversationId: string;
    timestamp: string;
  };
  "conversation.stream.closed": {
    conversationId: string;
  };
}

interface ConversationsRealtimeEventMap {
  "conversation.summary.upsert": {
    conversation: Conversation;
    cursorUpdatedAt?: string | null;
    cursorConversationId?: string | null;
  };
  "conversations.stream.ready": {
    cursorUpdatedAt?: string | null;
    cursorConversationId?: string | null;
  };
  "conversations.stream.ping": {
    timestamp: string;
  };
  "conversations.stream.closed": Record<string, never>;
}

interface CreateConversationRealtimeStreamOptions {
  conversationId: string;
  getCursor?: () => ConversationRealtimeCursor;
  onStatusChange?: (status: RealtimeStatus) => void;
  onMessageUpsert?: (payload: ConversationRealtimeEventMap["conversation.message.upsert"]) => void;
  onError?: (error: unknown) => void;
}

interface CreateConversationsRealtimeStreamOptions {
  onStatusChange?: (status: RealtimeStatus) => void;
  onSummaryUpsert?: (payload: ConversationsRealtimeEventMap["conversation.summary.upsert"]) => void;
  onError?: (error: unknown) => void;
}

interface SseEvent {
  event: string;
  data: string;
}

const RETRY_DELAY_MS = 600;

export function isRealtimeSupported() {
  return typeof window !== "undefined"
    && typeof window.fetch === "function"
    && typeof ReadableStream !== "undefined"
    && typeof TextDecoder !== "undefined";
}

function buildRealtimeHeaders(token: string, url: string): HeadersInit {
  return {
    Accept: "text/event-stream",
    Authorization: `Bearer ${token}`,
    ...(shouldSendNgrokBrowserWarningHeader(url) ? { "ngrok-skip-browser-warning": "true" } : {}),
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function parseSseEvents(buffer: string) {
  const chunks = buffer.split("\n\n");
  const remainder = chunks.pop() ?? "";
  const events: SseEvent[] = [];

  for (const chunk of chunks) {
    const lines = chunk.split("\n");
    let event = "message";
    const dataLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith("event:")) {
        event = line.slice("event:".length).trim();
        continue;
      }

      if (line.startsWith("data:")) {
        dataLines.push(line.slice("data:".length).trim());
      }
    }

    if (dataLines.length > 0) {
      events.push({
        event,
        data: dataLines.join("\n"),
      });
    }
  }

  return { events, remainder };
}

export function createConversationRealtimeStream(options: CreateConversationRealtimeStreamOptions) {
  let active = true;
  let abortController: AbortController | null = null;
  let status: RealtimeStatus = "idle";

  const setStatus = (nextStatus: RealtimeStatus) => {
    if (status === nextStatus) {
      return;
    }

    status = nextStatus;
    options.onStatusChange?.(nextStatus);
  };

  const readStream = async (response: Response) => {
    const reader = response.body?.getReader();

    if (!reader) {
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (active) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const parsed = parseSseEvents(buffer);
      buffer = parsed.remainder;

      for (const event of parsed.events) {
        if (event.event === "conversation.message.upsert") {
          options.onMessageUpsert?.(JSON.parse(event.data) as ConversationRealtimeEventMap["conversation.message.upsert"]);
        }
      }
    }
  };

  const connect = async () => {
    while (active) {
      const token = getAuthToken();

      if (!token) {
        setStatus("disconnected");
        return;
      }

      abortController = new AbortController();

      try {
        setStatus("connecting");

        const cursor = options.getCursor?.() ?? {};
        const url = buildApiUrl(`/conversations/${options.conversationId}/stream`, resolveApiBaseUrl(), {
          ...(cursor.updatedAt ? { cursor_updated_at: cursor.updatedAt } : {}),
          ...(cursor.messageId ? { cursor_message_id: cursor.messageId } : {}),
        });
        const response = await fetch(
          url,
          {
            method: "GET",
            headers: buildRealtimeHeaders(token, url),
            signal: abortController.signal,
          },
        );

        if (response.status === 401) {
          handleUnauthorizedSessionForToken(token);
          return;
        }

        if (!response.ok) {
          throw new Error(`Realtime request failed with status ${response.status}`);
        }

        setStatus("connected");
        await readStream(response);

        if (!active) {
          break;
        }

        setStatus("disconnected");
      } catch (error) {
        if (!active || abortController.signal.aborted) {
          break;
        }

        setStatus("error");
        options.onError?.(error);
      }

      if (!active) {
        break;
      }

      await sleep(RETRY_DELAY_MS);
    }
  };

  void connect();

  return {
    close() {
      active = false;
      abortController?.abort();
      setStatus("disconnected");
    },
  };
}

export function createConversationsRealtimeStream(options: CreateConversationsRealtimeStreamOptions) {
  let active = true;
  let abortController: AbortController | null = null;
  let status: RealtimeStatus = "idle";
  let cursorUpdatedAt: string | null = null;
  let cursorConversationId: string | null = null;

  const setStatus = (nextStatus: RealtimeStatus) => {
    if (status === nextStatus) {
      return;
    }

    status = nextStatus;
    options.onStatusChange?.(nextStatus);
  };

  const readStream = async (response: Response) => {
    const reader = response.body?.getReader();

    if (!reader) {
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (active) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const parsed = parseSseEvents(buffer);
      buffer = parsed.remainder;

      for (const event of parsed.events) {
        if (event.event === "conversations.stream.ready") {
          const payload = JSON.parse(event.data) as ConversationsRealtimeEventMap["conversations.stream.ready"];
          cursorUpdatedAt = payload.cursorUpdatedAt ?? cursorUpdatedAt;
          cursorConversationId = payload.cursorConversationId ?? cursorConversationId;
        }

        if (event.event === "conversation.summary.upsert") {
          const payload = JSON.parse(event.data) as ConversationsRealtimeEventMap["conversation.summary.upsert"];
          cursorUpdatedAt = payload.cursorUpdatedAt ?? cursorUpdatedAt;
          cursorConversationId = payload.cursorConversationId ?? cursorConversationId;
          options.onSummaryUpsert?.(payload);
        }
      }
    }
  };

  const connect = async () => {
    while (active) {
      const token = getAuthToken();

      if (!token) {
        setStatus("disconnected");
        return;
      }

      abortController = new AbortController();

      try {
        setStatus("connecting");

        const url = buildApiUrl("/conversations/stream", resolveApiBaseUrl(), {
          ...(cursorUpdatedAt ? { cursor_updated_at: cursorUpdatedAt } : {}),
          ...(cursorConversationId ? { cursor_conversation_id: cursorConversationId } : {}),
        });
        const response = await fetch(
          url,
          {
            method: "GET",
            headers: buildRealtimeHeaders(token, url),
            signal: abortController.signal,
          },
        );

        if (response.status === 401) {
          handleUnauthorizedSessionForToken(token);
          return;
        }

        if (!response.ok) {
          throw new Error(`Conversations realtime request failed with status ${response.status}`);
        }

        setStatus("connected");
        await readStream(response);

        if (!active) {
          break;
        }

        setStatus("disconnected");
      } catch (error) {
        if (!active || abortController.signal.aborted) {
          break;
        }

        setStatus("error");
        options.onError?.(error);
      }

      if (!active) {
        break;
      }

      await sleep(RETRY_DELAY_MS);
    }
  };

  void connect();

  return {
    close() {
      active = false;
      abortController?.abort();
      setStatus("disconnected");
    },
  };
}

export type { ConversationRealtimeCursor, RealtimeStatus };
