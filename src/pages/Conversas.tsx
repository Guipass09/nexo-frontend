import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/nexo/StatusBadge";
import {
  syncConversationListFromMessage,
  syncConversationSummaryCaches,
  queryKeys,
  useContacts,
  useConversationById,
  useConversationRealtime,
  useConversationMessages,
  useConversationsRealtime,
  useConversations,
  useCreateContact,
  useCreateConversation,
  useDeleteConversation,
  useMarkConversationAsRead,
  useMediaAssets,
  useSaveMediaAssetToLibrary,
  useSendConversationMediaMessage,
  useSendConversationMessage,
  useSendConversationTemplateMessage,
  useTemplates,
  useUploadMediaAsset,
} from "@/hooks/use-app-data";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Send, Paperclip, Bot, User, Workflow, AlertTriangle, Plus, MessageSquare as MessageSquareIcon, Sparkles, Trash2, Phone, Image as ImageIcon, Film, FileText, ExternalLink, Download, MoreHorizontal, Save, ChevronLeft, SlidersHorizontal, Play, Pause, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { ApiError, getApiErrorMessage } from "@/lib/api/client";
import { useBrowserMediaUrl } from "@/hooks/use-browser-media-url";
import { toast } from "@/hooks/use-toast";
import type { Conversation, ConversationMessage, MediaAssetType } from "@/types/domain";
import type { RealtimeStatus } from "@/services/conversation-realtime";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/nexo/EmptyState";
import { getStoredAuthUser, subscribeToAuthUserChanges } from "@/lib/auth";
import { resolveMediaUrl } from "@/lib/media-url";

type ConversationDraft = {
  contactId: string;
  status: "ativo" | "aguardando" | "humano" | "finalizado" | "erro";
  tag: string;
  flow: string;
  lastMessage: string;
};

type ContactDraft = {
  name: string;
  phone: string;
  origin: string;
  status: string;
  tags: string;
  avatarUrl: string;
  flow: string;
  responsible: string;
};

const emptyConversationDraft: ConversationDraft = {
  contactId: "",
  status: "ativo",
  tag: "",
  flow: "",
  lastMessage: "",
};

const emptyContactDraft: ContactDraft = {
  name: "",
  phone: "",
  origin: "Manual",
  status: "ativo",
  tags: "",
  avatarUrl: "",
  flow: "",
  responsible: "",
};

function fallbackContactName(phone: string) {
  const digits = phone.replace(/\D+/g, "");

  if (!digits) {
    return "Novo contato";
  }

  return `Contato ${digits.slice(-4)}`;
}

function messageTypeLabel(type: ConversationMessage["type"]) {
  switch (type) {
    case "audio":
      return "Audio";
    case "image":
      return "Imagem";
    case "video":
      return "Video";
    case "document":
      return "Documento";
    case "template":
      return "Template";
    default:
      return null;
  }
}

function deliveryStatusLabel(status: ConversationMessage["deliveryStatus"]) {
  switch (status) {
    case "pending":
      return "enviando";
    case "sent":
      return "enviado";
    case "delivered":
      return "entregue";
    case "read":
      return "lida";
    case "failed":
      return "falhou";
    case "skipped":
      return "salva";
    default:
      return null;
  }
}

function isRecentClientMessage(message: ConversationMessage | null) {
  if (!message || message.from !== "client") {
    return false;
  }

  const rawTimestamp = message.updatedAt ?? message.sentAt ?? message.createdAt;
  const timestamp = rawTimestamp ? Date.parse(rawTimestamp) : Number.NaN;

  if (Number.isNaN(timestamp)) {
    return true;
  }

  return Date.now() - timestamp <= 90_000;
}

function realtimeStatusView(status: RealtimeStatus, idleLabel = "Aguardando") {
  switch (status) {
    case "connected":
      return {
        label: "Conectado",
        className: "border-success/25 bg-success/10 text-success",
        dotClassName: "bg-success",
      };
    case "connecting":
      return {
        label: "Reconectando",
        className: "border-warning/25 bg-warning/10 text-warning",
        dotClassName: "bg-warning animate-pulse",
      };
    case "error":
    case "disconnected":
      return {
        label: "Fallback polling",
        className: "border-muted-foreground/20 bg-secondary/60 text-muted-foreground",
        dotClassName: "bg-muted-foreground",
      };
    case "idle":
    default:
      return {
        label: idleLabel,
        className: "border-muted-foreground/20 bg-secondary/40 text-muted-foreground",
        dotClassName: "bg-muted-foreground/70",
      };
  }
}

function AiProcessingBubble() {
  return (
    <div className="flex gap-2.5 justify-start">
      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#4f46e5,#7c3aed)] shadow-[0_8px_18px_-12px_rgba(79,70,229,0.5)]">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="max-w-[78%] rounded-[1.35rem] rounded-bl-md border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(243,246,255,0.88))] px-4 py-3 text-foreground shadow-[0_20px_44px_-34px_rgba(5,11,46,0.28)] backdrop-blur">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Nexo IA analisando o atendimento</span>
          <span className="inline-flex gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/70 [animation-delay:-0.2s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/70 [animation-delay:-0.1s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/70" />
          </span>
        </div>
      </div>
    </div>
  );
}

function formatPhoneForDisplay(phone?: string | null) {
  if (!phone) {
    return "Sem telefone";
  }

  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("55") && digits.length >= 12) {
    const area = digits.slice(2, 4);
    const subscriber = digits.slice(4);
    const formattedSubscriber = subscriber.length === 9
      ? `${subscriber.slice(0, 5)}-${subscriber.slice(5)}`
      : subscriber.length === 8
        ? `${subscriber.slice(0, 4)}-${subscriber.slice(4)}`
        : subscriber;

    return `+55 ${area} ${formattedSubscriber}`;
  }

  if (digits.startsWith("1") && digits.length === 11) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  return phone.startsWith("+") ? phone : `+${digits || phone}`;
}

function formatConversationPreviewText(text?: string | null) {
  const normalized = (text ?? "").trim();

  if (normalized === "") {
    return "";
  }

  if (/^[a-zA-ZÀ-ÿ]{1,3}$/.test(normalized)) {
    return normalized.split("").join("\u2060");
  }

  return normalized;
}

function RealtimeBadge({
  label,
  status,
  idleLabel,
}: {
  label: string;
  status: RealtimeStatus;
  idleLabel?: string;
}) {
  const view = realtimeStatusView(status, idleLabel);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap",
        view.className,
      )}
      title={`${label}: ${view.label}`}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", view.dotClassName)} />
      <span className="hidden sm:inline">{label}: </span>{view.label}
    </span>
  );
}

function ContactAvatar({
  name,
  fallback,
  avatarUrl,
  size = "md",
  active,
}: {
  name: string;
  fallback: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  active?: boolean;
}) {
  const sizeClass = {
    sm: "h-8 w-8",
    md: "h-11 w-11",
    lg: "h-12 w-12",
  }[size];

  return (
    <div className="relative shrink-0">
      <Avatar className={cn(sizeClass, "border border-white/80 shadow-sm ring-1 ring-border/60")}>
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} className="object-cover" /> : null}
        <AvatarFallback className="bg-gradient-to-br from-cyan-50 via-blue-50 to-white text-primary text-xs font-semibold">
          {fallback}
        </AvatarFallback>
      </Avatar>
      {active ? (
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500 shadow-sm" />
      ) : null}
    </div>
  );
}

function OperatorAvatar({
  name,
  fallback,
  avatarUrl,
  size = "sm",
}: {
  name: string;
  fallback: string;
  avatarUrl?: string | null;
  size?: "sm" | "md";
}) {
  const sizeClass = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
  }[size];

  return (
    <Avatar className={cn(sizeClass, "border border-white/80 shadow-sm ring-1 ring-primary/10")}>
      {avatarUrl ? <AvatarImage src={resolveMediaUrl(avatarUrl) ?? undefined} alt={name} className="object-cover" /> : null}
      <AvatarFallback className="gradient-primary text-primary-foreground text-xs font-semibold">
        {fallback}
      </AvatarFallback>
    </Avatar>
  );
}

function shouldAutoScrollToBottom(element: HTMLDivElement) {
  const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;

  return distanceFromBottom <= 120;
}

function scrollConversationToBottom(element: HTMLDivElement | null, behavior: ScrollBehavior = "auto") {
  if (!element) {
    return;
  }

  element.scrollTo({
    top: element.scrollHeight,
    behavior,
  });
}

function isMediaPlaceholder(text: string | undefined, type: ConversationMessage["type"]) {
  const normalized = (text ?? "").trim().toLowerCase();

  return normalized === `[${type}]` || normalized === "";
}

function useConversationMediaUrl(rawUrl?: string | null) {
  return useBrowserMediaUrl(rawUrl);
}

function canManageInboundMedia(message: ConversationMessage) {
  return message.from === "client" && Boolean(message.mediaAsset?.id);
}

function isInboundMediaAlreadySaved(message: ConversationMessage) {
  return (message.mediaAsset?.status ?? "active") !== "pending";
}

function ConversationMediaLibraryMenu({
  message,
  onSaveToLibrary,
  isSavingToLibrary,
}: {
  message: ConversationMessage;
  onSaveToLibrary?: (message: ConversationMessage) => void;
  isSavingToLibrary?: boolean;
}) {
  if (!canManageInboundMedia(message)) {
    return null;
  }

  const alreadySaved = isInboundMediaAlreadySaved(message);

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onSaveToLibrary?.(message)} disabled={isSavingToLibrary || alreadySaved}>
            <Save className="mr-2 h-4 w-4" />
            {alreadySaved ? "Ja salva na biblioteca" : "Salvar na biblioteca"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function ConversationImageContent({
  message,
  isClient,
  onOpenMedia,
  onSaveToLibrary,
  isSavingToLibrary,
}: {
  message: ConversationMessage;
  isClient: boolean;
  onOpenMedia?: (message: ConversationMessage) => void;
  onSaveToLibrary?: (message: ConversationMessage) => void;
  isSavingToLibrary?: boolean;
}) {
  const mediaUrl = useConversationMediaUrl(message.mediaAsset?.downloadUrl ?? message.mediaAsset?.publicUrl);
  const mediaName = message.mediaAsset?.originalName ?? message.text;

  return (
    <div className="space-y-2" translate="no">
      {mediaUrl ? (
        <button
          type="button"
          className="group relative block overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5"
          onClick={() => onOpenMedia?.({ ...message, mediaAsset: message.mediaAsset ? { ...message.mediaAsset, publicUrl: mediaUrl } : message.mediaAsset })}
          title="Abrir imagem"
        >
          <img
            src={mediaUrl}
            alt={mediaName || "Imagem recebida"}
            className="max-h-80 w-full max-w-[340px] object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <span className="pointer-events-none absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
            <Maximize2 className="h-3.5 w-3.5" />
          </span>
        </button>
      ) : (
        <div className={cn("flex items-center gap-2 rounded-xl border px-3 py-2 text-xs", isClient ? "border-slate-200 bg-slate-100/80 text-slate-600" : "border-white/20 bg-white/10 text-white/80")}>
          <ImageIcon className="h-4 w-4" />
          Imagem recebida, mas o arquivo ainda nao esta disponivel.
        </div>
      )}
      {!isMediaPlaceholder(message.rawText ?? message.text, "image") ? (
        <pre className="notranslate whitespace-pre-wrap break-words text-sm leading-relaxed font-sans bg-transparent p-0 m-0" translate="no" lang="pt-BR">
          {message.rawText ?? message.text}
        </pre>
      ) : null}
      <ConversationMediaLibraryMenu message={message} onSaveToLibrary={onSaveToLibrary} isSavingToLibrary={isSavingToLibrary} />
    </div>
  );
}

function ConversationVideoContent({
  message,
  isClient,
  onOpenMedia,
  onSaveToLibrary,
  isSavingToLibrary,
}: {
  message: ConversationMessage;
  isClient: boolean;
  onOpenMedia?: (message: ConversationMessage) => void;
  onSaveToLibrary?: (message: ConversationMessage) => void;
  isSavingToLibrary?: boolean;
}) {
  const mediaUrl = useConversationMediaUrl(message.mediaAsset?.downloadUrl ?? message.mediaAsset?.publicUrl);

  return (
    <div className="space-y-2" translate="no">
      {mediaUrl ? (
        <button
          type="button"
          className="group relative block overflow-hidden rounded-2xl bg-black shadow-sm ring-1 ring-black/5"
          onClick={() => onOpenMedia?.({ ...message, mediaAsset: message.mediaAsset ? { ...message.mediaAsset, publicUrl: mediaUrl } : message.mediaAsset })}
          title="Abrir video"
        >
          <video
            src={mediaUrl}
            className="max-h-80 w-full max-w-[340px] object-cover opacity-95 transition-opacity group-hover:opacity-100"
            preload="metadata"
            muted
            playsInline
          />
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-transform duration-200 group-hover:scale-110">
              <Play className="h-6 w-6 translate-x-[2px]" />
            </span>
          </span>
        </button>
      ) : (
        <div className={cn("flex items-center gap-2 rounded-xl border px-3 py-2 text-xs", isClient ? "border-slate-200 bg-slate-100/80 text-slate-600" : "border-white/20 bg-white/10 text-white/80")}>
          <Film className="h-4 w-4" />
          Video recebido, mas o arquivo ainda nao esta disponivel.
        </div>
      )}
      {!isMediaPlaceholder(message.rawText ?? message.text, "video") ? (
        <pre className="notranslate whitespace-pre-wrap break-words text-sm leading-relaxed font-sans bg-transparent p-0 m-0" translate="no" lang="pt-BR">
          {message.rawText ?? message.text}
        </pre>
      ) : null}
      <ConversationMediaLibraryMenu message={message} onSaveToLibrary={onSaveToLibrary} isSavingToLibrary={isSavingToLibrary} />
    </div>
  );
}

function formatMediaTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function PremiumAudioPlayer({ src, isClient }: { src: string; isClient: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) {
      return;
    }
    if (el.paused) {
      void el.play();
    } else {
      el.pause();
    }
  };

  const pct = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className={cn(
      "flex items-center gap-3 rounded-2xl border px-3 py-2",
      isClient ? "border-slate-200 bg-white" : "border-white/20 bg-white/10",
    )}>
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-105",
          isClient ? "bg-violet-600 text-white" : "bg-white text-violet-700",
        )}
        aria-label={playing ? "Pausar" : "Reproduzir"}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-[1px]" />}
      </button>
      <div className="min-w-[140px] flex-1">
        <div
          className={cn("h-1.5 w-full cursor-pointer overflow-hidden rounded-full", isClient ? "bg-slate-200" : "bg-white/25")}
          onClick={(event) => {
            const el = audioRef.current;
            if (!el || !duration) {
              return;
            }
            const rect = event.currentTarget.getBoundingClientRect();
            const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
            el.currentTime = ratio * duration;
          }}
        >
          <div className={cn("h-full rounded-full", isClient ? "bg-violet-600" : "bg-white")} style={{ width: `${pct}%` }} />
        </div>
        <div className={cn("mt-1 text-[10px] tabular-nums", isClient ? "text-slate-500" : "text-white/75")}>
          {formatMediaTime(current)} / {formatMediaTime(duration)}
        </div>
      </div>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        className="hidden"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
      />
    </div>
  );
}

function ConversationAudioContent({
  message,
  isClient,
  onSaveToLibrary,
  isSavingToLibrary,
}: {
  message: ConversationMessage;
  isClient: boolean;
  onSaveToLibrary?: (message: ConversationMessage) => void;
  isSavingToLibrary?: boolean;
}) {
  const mediaUrl = useConversationMediaUrl(message.mediaAsset?.downloadUrl ?? message.mediaAsset?.publicUrl);

  return (
    <div className="space-y-2 min-w-[240px]" translate="no">
      {mediaUrl ? (
        <PremiumAudioPlayer src={mediaUrl} isClient={isClient} />
      ) : (
        <div className={cn("flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs", isClient ? "border-slate-200 bg-slate-50 text-slate-500" : "border-white/20 bg-white/10 text-white/80")}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-500"><Play className="h-3.5 w-3.5" /></span>
          <span>Audio recebido, mas o arquivo ainda nao esta disponivel.</span>
        </div>
      )}
      {!isMediaPlaceholder(message.rawText ?? message.text, "audio") ? (
        <pre className="notranslate whitespace-pre-wrap break-words text-sm leading-relaxed font-sans bg-transparent p-0 m-0" translate="no" lang="pt-BR">
          {message.rawText ?? message.text}
        </pre>
      ) : null}
      <ConversationMediaLibraryMenu message={message} onSaveToLibrary={onSaveToLibrary} isSavingToLibrary={isSavingToLibrary} />
    </div>
  );
}

function ConversationDocumentContent({
  message,
  isClient,
  onSaveToLibrary,
  isSavingToLibrary,
}: {
  message: ConversationMessage;
  isClient: boolean;
  onSaveToLibrary?: (message: ConversationMessage) => void;
  isSavingToLibrary?: boolean;
}) {
  const mediaUrl = useConversationMediaUrl(message.mediaAsset?.downloadUrl ?? message.mediaAsset?.publicUrl);
  const mediaName = message.mediaAsset?.originalName ?? message.text;

  return (
    <div className="space-y-2" translate="no">
      {mediaUrl ? (
        <a
          href={mediaUrl}
          target="_blank"
          rel="noreferrer"
          className={cn("flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-xs transition-colors", isClient ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50" : "border-white/20 bg-white/10 text-white hover:bg-white/15")}
        >
          <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", isClient ? "bg-violet-50 text-violet-600" : "bg-white/15 text-white")}>
            <FileText className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{mediaName || "Documento recebido"}</span>
            <span className={cn("block text-[11px]", isClient ? "text-slate-400" : "text-white/65")}>Toque para abrir</span>
          </span>
          <Download className="h-4 w-4 shrink-0 opacity-70" />
        </a>
      ) : (
        <div className={cn("flex items-center gap-2 rounded-xl border px-3 py-2 text-xs", isClient ? "border-slate-200 bg-slate-100/80 text-slate-600" : "border-white/20 bg-white/10 text-white/80")}>
          <FileText className="h-4 w-4" />
          Documento recebido, mas o arquivo ainda nao esta disponivel.
        </div>
      )}
      {!isMediaPlaceholder(message.rawText ?? message.text, "document") ? (
        <pre className="notranslate whitespace-pre-wrap break-words text-sm leading-relaxed font-sans bg-transparent p-0 m-0" translate="no" lang="pt-BR">
          {message.rawText ?? message.text}
        </pre>
      ) : null}
      <ConversationMediaLibraryMenu message={message} onSaveToLibrary={onSaveToLibrary} isSavingToLibrary={isSavingToLibrary} />
    </div>
  );
}

function renderMessageBody(
  message: ConversationMessage,
  isClient: boolean,
  onOpenMedia?: (message: ConversationMessage) => void,
  onSaveToLibrary?: (message: ConversationMessage) => void,
  isSavingToLibrary?: boolean,
) {
  if (message.type === "image") {
    return <ConversationImageContent message={message} isClient={isClient} onOpenMedia={onOpenMedia} onSaveToLibrary={onSaveToLibrary} isSavingToLibrary={isSavingToLibrary} />;
  }

  if (message.type === "video") {
    return <ConversationVideoContent message={message} isClient={isClient} onOpenMedia={onOpenMedia} onSaveToLibrary={onSaveToLibrary} isSavingToLibrary={isSavingToLibrary} />;
  }

  if (message.type === "document") {
    return <ConversationDocumentContent message={message} isClient={isClient} onSaveToLibrary={onSaveToLibrary} isSavingToLibrary={isSavingToLibrary} />;
  }

  if (message.type === "audio") {
    return <ConversationAudioContent message={message} isClient={isClient} onSaveToLibrary={onSaveToLibrary} isSavingToLibrary={isSavingToLibrary} />;
  }

  const label = messageTypeLabel(message.type);

  return (
      <div className="space-y-1" translate="no">
      {message.type === "template" && message.templateName ? (
        <p className="text-[11px] uppercase tracking-wide opacity-70">Template oficial: {message.templateName}</p>
      ) : null}
      {label && message.type !== "template" ? (
        <p className="text-[11px] uppercase tracking-wide opacity-70">{label}</p>
      ) : null}
      {message.mediaAsset?.originalName && message.type === "document" ? (
        <p className="text-[11px] opacity-70">{message.mediaAsset.originalName}</p>
      ) : null}
      <pre
        className="notranslate whitespace-pre-wrap break-words text-sm leading-relaxed font-sans bg-transparent p-0 m-0"
        translate="no"
        lang="pt-BR"
      >
        {message.rawText ?? message.text}
      </pre>
    </div>
  );
}

export default function Conversas() {
  const [operatorUser, setOperatorUser] = useState(() => getStoredAuthUser());
  const [conversationDialogOpen, setConversationDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationDraft, setConversationDraft] = useState<ConversationDraft>(emptyConversationDraft);
  const [conversationContactMode, setConversationContactMode] = useState<"existing" | "new">("existing");
  const [contactDraft, setContactDraft] = useState<ContactDraft>(emptyContactDraft);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [unreadFilter, setUnreadFilter] = useState<"all" | "true" | "false">("all");
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [flowFilter, setFlowFilter] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const conversationFilters = useMemo(() => ({
    status: statusFilter,
    unread: unreadFilter,
    deliveryStatus: deliveryStatusFilter,
    tag: tagFilter,
    flow: flowFilter,
    search: debouncedSearch,
  }), [debouncedSearch, deliveryStatusFilter, flowFilter, statusFilter, tagFilter, unreadFilter]);
  const listRealtime = useConversationsRealtime(conversationFilters);
  const conversationsQuery = useConversations(conversationFilters, { realtimeConnected: listRealtime.isConnected });
  const conversations = useMemo(
    () => conversationsQuery.data ?? [],
    [conversationsQuery.data],
  );
  const isInitialConversationsLoading = conversationsQuery.isPending && conversations.length === 0;
  const [draftMessage, setDraftMessage] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [templateMedia, setTemplateMedia] = useState({ source: "url" as "url" | "id" | "asset", url: "", id: "", assetId: "", filename: "" });
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [showMediaComposer, setShowMediaComposer] = useState(false);
  const [mediaDraft, setMediaDraft] = useState({
    type: "image" as MediaAssetType,
    source: "url" as "url" | "id" | "asset",
    url: "",
    id: "",
    assetId: "",
    caption: "",
    filename: "",
  });
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [previewMessage, setPreviewMessage] = useState<ConversationMessage | null>(null);

  useEffect(() => subscribeToAuthUserChanges(setOperatorUser), []);

  const operatorInitials = useMemo(() => operatorUser?.name
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "NX", [operatorUser?.name]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [search]);

  const realtime = useConversationRealtime(selectedId);
  const selectedQuery = useConversationById(selectedId, { realtimeConnected: realtime.isConnected });
  const conversationMessagesQuery = useConversationMessages(selectedId, { realtimeConnected: realtime.isConnected });
  const conversationMessages = useMemo(
    () => conversationMessagesQuery.data ?? [],
    [conversationMessagesQuery.data],
  );
  const latestRenderableMessage = useMemo(
    () => [...conversationMessages].reverse().find((message) => message.type !== "event") ?? null,
    [conversationMessages],
  );
  const showAiProcessingBubble = isRecentClientMessage(latestRenderableMessage);
  const sidebarConversations = useMemo(() => {
    if (!selectedId || !latestRenderableMessage) {
      return conversations;
    }

    return conversations.map((conversation) => {
      if (conversation.id !== selectedId) {
        return conversation;
      }

      return {
        ...conversation,
        lastMessage: latestRenderableMessage.rawText ?? latestRenderableMessage.text ?? conversation.lastMessage,
        time: latestRenderableMessage.time || conversation.time,
        deliveryStatus: latestRenderableMessage.deliveryStatus ?? conversation.deliveryStatus,
      };
    });
  }, [conversations, latestRenderableMessage, selectedId]);
  const selectedListConversation = useMemo(
    () => sidebarConversations.find((conversation) => conversation.id === selectedId) ?? null,
    [selectedId, sidebarConversations],
  );
  const selected = selectedListConversation ?? selectedQuery.data ?? null;
  const lastSyncedMessageRef = useRef<string | null>(null);
  const messagesViewportRef = useRef<HTMLDivElement | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const selectedConversationChangeRef = useRef(false);
  const lastSeenConversationKeyRef = useRef<string | null>(null);
  const lastRenderedMessageKeyRef = useRef<string | null>(null);
  const queryClient = useQueryClient();
  const { data: templates = [] } = useTemplates();
  const markAsReadMutation = useMarkConversationAsRead();
  const sendMessageMutation = useSendConversationMessage();
  const sendMediaMutation = useSendConversationMediaMessage();
  const saveMediaToLibraryMutation = useSaveMediaAssetToLibrary();
  const sendTemplateMutation = useSendConversationTemplateMessage();
  const uploadMediaMutation = useUploadMediaAsset();
  const { data: contacts = [] } = useContacts();
  const createContactMutation = useCreateContact();
  const createConversationMutation = useCreateConversation();
  const deleteConversationMutation = useDeleteConversation();

  useEffect(() => {
    if (conversationsQuery.isPending) {
      return;
    }

    if (conversations.length === 0) {
      setSelectedId(null);
      return;
    }

    if (!selectedId || !conversations.some((conversation) => conversation.id === selectedId)) {
      selectedConversationChangeRef.current = true;
      setSelectedId(conversations[0].id);
    }
  }, [conversations, conversationsQuery.isPending, selectedId]);

  useEffect(() => {
    if (!selectedId || !selected || selected.unread <= 0 || markAsReadMutation.isPending) {
      return;
    }

    markAsReadMutation.mutate(selectedId);
  }, [markAsReadMutation, selected, selectedId]);

  useEffect(() => {
    if (!selectedQuery.data) {
      return;
    }

    syncConversationSummaryCaches(queryClient, selectedQuery.data, conversationFilters);
  }, [conversationFilters, queryClient, selectedQuery.data]);

  useEffect(() => {
    if (!selectedId || conversationMessages.length === 0) {
      lastSyncedMessageRef.current = null;
      return;
    }

    const latestMessage = latestRenderableMessage;

    if (!latestMessage) {
      return;
    }

    const syncKey = `${selectedId}:${latestMessage.id}:${latestMessage.deliveryStatus ?? ""}`;

    if (lastSyncedMessageRef.current === syncKey) {
      return;
    }

    lastSyncedMessageRef.current = syncKey;

    syncConversationListFromMessage(queryClient, selectedId, latestMessage, {
      prioritize: true,
      unread: 0,
    });
  }, [conversationMessages.length, latestRenderableMessage, queryClient, selectedId]);

  useLayoutEffect(() => {
    const viewport = messagesViewportRef.current;

    if (!viewport) {
      return;
    }

    const conversationChanged = lastSeenConversationKeyRef.current !== selectedId;

    if (conversationChanged) {
      lastSeenConversationKeyRef.current = selectedId;
      lastRenderedMessageKeyRef.current = null;
      shouldStickToBottomRef.current = true;
      scrollConversationToBottom(viewport, "auto");
      return;
    }

    const latestRenderableMessage = [...conversationMessages]
      .reverse()
      .find((message) => message.type !== "event");
    const latestMessageKey = latestRenderableMessage
      ? latestRenderableMessage.id
      : null;
    const messageChanged = latestMessageKey !== lastRenderedMessageKeyRef.current;

    lastRenderedMessageKeyRef.current = latestMessageKey;

    if (!messageChanged || !latestRenderableMessage) {
      return;
    }

    if (selectedConversationChangeRef.current) {
      selectedConversationChangeRef.current = false;
      scrollConversationToBottom(viewport, "auto");
      return;
    }

    if (latestRenderableMessage.from !== "client" || shouldStickToBottomRef.current) {
      scrollConversationToBottom(viewport, "auto");
    }
  }, [conversationMessages, selectedId]);

  const handleSendMessage = () => {
    if (!selectedId || sendMessageMutation.isPending || selected?.serviceWindow?.requiresTemplate) {
      return;
    }

    const normalizedText = draftMessage.trim();

    if (!normalizedText) {
      return;
    }

    sendMessageMutation.mutate(
      { conversationId: selectedId, text: normalizedText },
      {
        onSuccess: (message) => {
          setDraftMessage("");
          if (message.deliveryStatus === "failed") {
            toast({
              title: "Mensagem registrada com falha",
              description: message.deliveryError ?? "A Cloud API nao confirmou o envio.",
              variant: "destructive",
            });
            return;
          }

          toast({
            title: message.deliveryStatus === "skipped" ? "Mensagem salva" : "Mensagem enviada",
            description: message.deliveryStatus === "skipped"
              ? "O envio externo foi ignorado ou nao esta configurado."
              : "A conversa foi atualizada com a mensagem manual.",
          });
        },
        onError: (error) => {
          const message = error instanceof ApiError && typeof error.responseBody === "object" && error.responseBody !== null && "message" in error.responseBody
            ? String(error.responseBody.message)
            : "Nao foi possivel enviar a mensagem.";
          toast({ title: "Falha no envio", description: message, variant: "destructive" });
        },
      },
    );
  };

  const handleSendTemplate = () => {
    if (!selectedId || !selectedTemplateId || sendTemplateMutation.isPending) {
      return;
    }

    const selectedTemplate = availableTemplates.find((template) => template.id === selectedTemplateId);
    const mediaHeader = selectedTemplate?.mediaHeader ?? null;
    const requiredMissing = (selectedTemplate?.bodyVariables ?? []).filter((variable) => {
      const value = templateVariables[variable.key]?.trim();
      const hasContactFallback = variable.source === "contact.name" || variable.source === "contact.phone";

      return variable.required && !value && !hasContactFallback;
    });

    if (requiredMissing.length > 0) {
      setTemplateError(`Preencha: ${requiredMissing.map((variable) => variable.label).join(", ")}`);
      return;
    }

    if (mediaHeader) {
      const mediaValue = templateMedia.source === "url"
        ? templateMedia.url.trim()
        : templateMedia.source === "id"
          ? templateMedia.id.trim()
          : templateMedia.assetId.trim();

      if (!mediaValue) {
        setTemplateError(`Informe a midia do header (${mediaHeader.type}).`);
        return;
      }
    }

    const variables = Object.fromEntries(
      Object.entries(templateVariables)
        .map(([key, value]) => [key, value.trim()])
        .filter(([, value]) => value !== ""),
    );
    const media = mediaHeader ? {
      type: mediaHeader.type,
      source: templateMedia.source,
      ...(templateMedia.source === "url" ? { url: templateMedia.url.trim() } : {}),
      ...(templateMedia.source === "id" ? { id: templateMedia.id.trim() } : {}),
      ...(templateMedia.source === "asset" ? { asset_id: templateMedia.assetId } : {}),
      ...(templateMedia.filename.trim() ? { filename: templateMedia.filename.trim() } : {}),
    } : undefined;

    setTemplateError(null);
    sendTemplateMutation.mutate(
      { conversationId: selectedId, templateId: selectedTemplateId, variables, media },
      {
        onSuccess: () => {
          setSelectedTemplateId("");
          setTemplateVariables({});
          setTemplateMedia({ source: "url", url: "", id: "", assetId: "", filename: "" });
          toast({ title: "Template enviado", description: "A mensagem oficial foi registrada na conversa." });
        },
        onError: (error) => {
          const message = error instanceof ApiError && typeof error.responseBody === "object" && error.responseBody !== null && "message" in error.responseBody
            ? String(error.responseBody.message)
            : "Nao foi possivel enviar este template.";
          setTemplateError(message);
          toast({ title: "Falha no template", description: message, variant: "destructive" });
        },
      },
    );
  };

  const handleSendMedia = () => {
    if (!selectedId || sendMediaMutation.isPending || requiresTemplate) {
      return;
    }

    const value = mediaDraft.source === "url"
      ? mediaDraft.url.trim()
      : mediaDraft.source === "id"
        ? mediaDraft.id.trim()
        : mediaDraft.assetId.trim();

    if (!value) {
      setMediaError("Informe uma URL publica, ID de midia ou asset enviado.");
      return;
    }

    setMediaError(null);
    sendMediaMutation.mutate(
      {
        conversationId: selectedId,
        media: {
          type: mediaDraft.type,
          source: mediaDraft.source,
          ...(mediaDraft.source === "url" ? { url: mediaDraft.url.trim() } : {}),
          ...(mediaDraft.source === "id" ? { id: mediaDraft.id.trim() } : {}),
          ...(mediaDraft.source === "asset" ? { asset_id: mediaDraft.assetId } : {}),
          ...(mediaDraft.caption.trim() ? { caption: mediaDraft.caption.trim() } : {}),
          ...(mediaDraft.filename.trim() ? { filename: mediaDraft.filename.trim() } : {}),
        },
      },
      {
        onSuccess: () => {
          setMediaDraft({ type: "image", source: "url", url: "", id: "", assetId: "", caption: "", filename: "" });
          setShowMediaComposer(false);
          toast({ title: "Midia enviada", description: "A mensagem de midia foi registrada na conversa." });
        },
        onError: (error) => {
          const message = error instanceof ApiError && typeof error.responseBody === "object" && error.responseBody !== null && "message" in error.responseBody
            ? String(error.responseBody.message)
            : "Nao foi possivel enviar esta midia.";
          setMediaError(message);
          toast({ title: "Falha no envio da midia", description: message, variant: "destructive" });
        },
      },
    );
  };

  const handleSaveConversationMedia = (message: ConversationMessage) => {
    const assetId = message.mediaAsset?.id;

    if (!assetId) {
      return;
    }

    saveMediaToLibraryMutation.mutate(assetId, {
      onSuccess: (savedAsset) => {
        toast({
          title: "Midia salva",
          description: "A midia agora esta disponivel na aba Midias e pode ser usada em fluxos.",
        });

        if (!selectedId) {
          return;
        }

        queryClient.setQueryData<ConversationMessage[]>(
          queryKeys.conversationMessages(selectedId),
          (current = []) => current.map((currentMessage) => (
            currentMessage.id === message.id
              ? {
                ...currentMessage,
                mediaAsset: currentMessage.mediaAsset ? {
                  ...currentMessage.mediaAsset,
                  ...savedAsset,
                } : currentMessage.mediaAsset,
              }
              : currentMessage
          )),
        );
      },
      onError: (error) => {
        toast({
          title: "Falha ao salvar midia",
          description: getApiErrorMessage(error, "Nao foi possivel mover essa midia para a biblioteca agora."),
          variant: "destructive",
        });
      },
    });
  };

  const handleUploadMedia = (file: File | undefined, type: MediaAssetType, target: "template" | "manual") => {
    if (!file || uploadMediaMutation.isPending) {
      return;
    }

    const maxBytes = type === "image" ? 5 * 1024 * 1024 : type === "document" ? 20 * 1024 * 1024 : 16 * 1024 * 1024;

    if (file.size > maxBytes) {
      const message = `Arquivo muito grande para ${type}. Limite: ${Math.round(maxBytes / 1024 / 1024)} MB.`;
      if (target === "template") {
        setTemplateError(message);
      } else {
        setMediaError(message);
      }
      return;
    }

    if (target === "template") {
      setTemplateError(null);
    } else {
      setMediaError(null);
    }

    uploadMediaMutation.mutate(
      { type, file },
      {
        onSuccess: (response) => {
          if (!response.data.metaMediaId) {
            const message = response.upload.error ?? "Upload salvo, mas a Meta nao retornou Media ID.";
            if (target === "template") {
              setTemplateError(message);
            } else {
              setMediaError(message);
            }
            toast({ title: "Upload salvo com aviso", description: message, variant: "destructive" });
            return;
          }

          if (target === "template") {
            setTemplateMedia((current) => ({ ...current, source: "asset", assetId: response.data.id, filename: response.data.originalName ?? current.filename }));
          } else {
            setMediaDraft((current) => ({ ...current, source: "asset", assetId: response.data.id, filename: response.data.originalName ?? current.filename }));
          }
          toast({ title: "Upload concluido", description: "A midia foi enviada para a Meta e selecionada no composer." });
        },
        onError: (error) => {
          const message = error instanceof ApiError && typeof error.responseBody === "object" && error.responseBody !== null && "message" in error.responseBody
            ? String(error.responseBody.message)
            : "Nao foi possivel subir esta midia.";
          if (target === "template") {
            setTemplateError(message);
          } else {
            setMediaError(message);
          }
          toast({ title: "Falha no upload", description: message, variant: "destructive" });
        },
      },
    );
  };

  const openCreateConversation = () => {
    setConversationDraft({
      ...emptyConversationDraft,
      contactId: contacts[0]?.id ?? "",
    });
    setConversationContactMode(contacts.length > 0 ? "existing" : "new");
    setContactDraft(emptyContactDraft);
    setConversationDialogOpen(true);
  };

  const createOrReuseContact = async () => {
    if (conversationContactMode === "existing") {
      if (!conversationDraft.contactId) {
        throw new Error("Selecione um contato para criar a conversa.");
      }

      return conversationDraft.contactId;
    }

    if (!contactDraft.phone.trim()) {
      throw new Error("Informe o telefone do contato.");
    }

    const resolvedName = contactDraft.name.trim() || fallbackContactName(contactDraft.phone);

    const contact = await createContactMutation.mutateAsync({
      name: resolvedName,
      phone: contactDraft.phone.trim(),
      origin: contactDraft.origin.trim() || "Manual",
      status: contactDraft.status.trim() || "ativo",
      tags: contactDraft.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      avatar_url: contactDraft.avatarUrl.trim() || undefined,
      flow: contactDraft.flow.trim(),
      responsible: contactDraft.responsible.trim(),
    });

    return contact.id;
  };

  const saveConversation = async () => {
    let createdConversationId: string | null = null;

    try {
      const contactId = await createOrReuseContact();
      const initialMessage = conversationDraft.lastMessage.trim();

      const conversation = await createConversationMutation.mutateAsync({
        contact_id: contactId,
        status: conversationDraft.status,
        tag: conversationDraft.tag.trim(),
        flow_name: conversationDraft.flow.trim(),
        last_message: initialMessage,
      });
      createdConversationId = conversation.id;

      let initialMessageResult: ConversationMessage | null = null;

      if (initialMessage) {
        initialMessageResult = await sendMessageMutation.mutateAsync({
          conversationId: conversation.id,
          text: initialMessage,
        });
      }

      const initialMessageWasBlocked = initialMessageResult?.deliveryStatus === "skipped";

      toast({
        title: initialMessage
          ? initialMessageWasBlocked
            ? "Conversa criada; use template para enviar"
            : "Conversa criada e mensagem enviada"
          : "Conversa criada",
        description: initialMessage
          ? initialMessageWasBlocked
            ? "O contato foi cadastrado, mas mensagens comuns exigem janela de 24h aberta."
            : "A primeira mensagem foi registrada no atendimento."
          : "A conversa foi salva no backend.",
        variant: initialMessageWasBlocked ? "destructive" : undefined,
      });
      setSelectedId(conversation?.id ?? null);
      setConversationDialogOpen(false);
      setConversationDraft(emptyConversationDraft);
      setContactDraft(emptyContactDraft);
    } catch (error) {
      toast({
        title: createdConversationId ? "Conversa criada com falha na mensagem inicial" : "Falha ao criar conversa",
        description: error instanceof Error
          ? error.message
          : getApiErrorMessage(
            error,
            createdConversationId
              ? "A conversa foi criada, mas a mensagem inicial nao foi enviada."
              : "Nao foi possivel criar a conversa.",
          ),
        variant: "destructive",
      });

      if (createdConversationId) {
        setSelectedId(createdConversationId);
        setConversationDialogOpen(false);
      }
    }
  };

  const confirmDeleteConversation = () => {
    if (!selectedId || deleteConversationMutation.isPending) {
      return;
    }

    const deletingId = selectedId;
    const nextConversationId = conversations.find((conversation) => conversation.id !== deletingId)?.id ?? null;

    setDeleteDialogOpen(false);
    setSelectedId(nextConversationId);
    deleteConversationMutation.mutate(deletingId, {
      onSuccess: () => {
        toast({
          title: "Conversa apagada",
          description: "A conversa foi removida. O contato continua salvo para novos atendimentos.",
        });
      },
      onError: (error) => {
        setSelectedId(deletingId);
        toast({
          title: "Falha ao apagar conversa",
          description: getApiErrorMessage(error, "Nao foi possivel apagar esta conversa."),
          variant: "destructive",
        });
      },
    });
  };

  const availableTags = Array.from(new Set(conversations.map((conversation) => conversation.tag).filter(Boolean)));
  const availableFlows = Array.from(new Set(conversations.map((conversation) => conversation.flow).filter(Boolean)));
  const availableTemplates = templates.filter(
    (template) => template.isOfficial === true
      && template.metaName
      && template.metaStatus === "APPROVED",
  );
  const selectedTemplate = availableTemplates.find((template) => template.id === selectedTemplateId);
  const selectedTemplateVariables = selectedTemplate?.bodyVariables ?? [];
  const selectedTemplateMediaHeader = selectedTemplate?.mediaHeader ?? null;
  const serviceWindow = selected?.serviceWindow;
  const requiresTemplate = serviceWindow?.requiresTemplate ?? false;
  const { data: mediaAssets = [] } = useMediaAssets(mediaDraft.type, { enabled: showMediaComposer && !requiresTemplate });
  const { data: templateMediaAssets = [] } = useMediaAssets(selectedTemplateMediaHeader?.type ?? null, { enabled: Boolean(selectedTemplateMediaHeader) });
  const selectedMediaAsset = mediaAssets.find((asset) => asset.id === mediaDraft.assetId);
  const selectedTemplateMediaAsset = templateMediaAssets.find((asset) => asset.id === templateMedia.assetId);
  const selectedTemplateMediaAssetUrl = useConversationMediaUrl(selectedTemplateMediaAsset?.downloadUrl ?? selectedTemplateMediaAsset?.publicUrl);
  const hasDataError = conversationsQuery.isError;
  const dataError = conversationsQuery.error;
  const activeConversationError = selectedQuery.error ?? conversationMessagesQuery.error;
  const hasConversationData = conversations.length > 0;
  const selectedMediaAssetUrl = useConversationMediaUrl(selectedMediaAsset?.downloadUrl ?? selectedMediaAsset?.publicUrl);
  const previewMessageMediaUrl = useConversationMediaUrl(previewMessage?.mediaAsset?.downloadUrl ?? previewMessage?.mediaAsset?.publicUrl);
  const activeConversationNotFound = activeConversationError instanceof ApiError && activeConversationError.status === 404;

  useEffect(() => {
    if (!selectedId || !activeConversationNotFound) {
      return;
    }

    queryClient.setQueriesData<Conversation[]>(
      { queryKey: queryKeys.conversations },
      (current) => Array.isArray(current)
        ? current.filter((conversation) => conversation.id !== selectedId)
        : current,
    );
    queryClient.removeQueries({ queryKey: queryKeys.conversation(selectedId) });
    queryClient.removeQueries({ queryKey: queryKeys.conversationMessages(selectedId) });

    const fallbackConversation = conversations.find((conversation) => conversation.id !== selectedId) ?? null;
    selectedConversationChangeRef.current = true;
    setSelectedId(fallbackConversation?.id ?? null);
  }, [activeConversationNotFound, conversations, queryClient, selectedId]);

  if (hasDataError && !hasConversationData) {
    return (
      <Card className="p-4 border-destructive/40 text-sm text-destructive">
        Erro ao carregar dados de conversas: {getApiErrorMessage(dataError)}
      </Card>
    );
  }

  return (
    <div className="grid h-[calc(100vh-9rem)] grid-cols-1 gap-5 lg:grid-cols-[380px_1fr]">
      {/* List */}
      <Card className={cn("nexo-premium-surface flex-col overflow-hidden", selectedId ? "hidden lg:flex" : "flex")}>
        <div className="space-y-3 border-b border-slate-200/80 p-4 bg-white">
          {hasDataError && listRealtime.enabled ? (
            <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
              Oscilacao de conexao detectada. Mantendo os dados carregados e tentando reconectar.
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-2">
            {listRealtime.enabled ? <RealtimeBadge label="Lista ao vivo" status={listRealtime.status} /> : <span />}
            <Button variant="outline" size="sm" className="gap-1.5 border-slate-200 bg-white shadow-sm hover:bg-slate-50" onClick={openCreateConversation}>
              <Plus className="h-3.5 w-3.5" /> Nova conversa
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar conversas, contatos ou mensagens..." className="nexo-soft-input rounded-[1.15rem] pl-9" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex flex-1 gap-1.5 overflow-x-auto scrollbar-thin pb-1">
              {["Todos", "Ativos", "Aguardando", "Humano", "Finalizado"].map((f, i) => (
                <button key={f} onClick={() => setStatusFilter(f)} className={cn(
                  "shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-smooth",
                  statusFilter === f || (i === 0 && statusFilter === "Todos")
                    ? "bg-[linear-gradient(135deg,#4f46e5,#7c3aed)] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}>{f}</button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowAdvancedFilters((value) => !value)}
              className={cn(
                "shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-smooth",
                showAdvancedFilters || unreadFilter !== "all" || deliveryStatusFilter || tagFilter || flowFilter
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
              aria-label="Filtros avançados"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>
          {showAdvancedFilters && (
            <div className="grid grid-cols-2 gap-2">
              <select className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 focus:border-violet-400 focus:outline-none" value={unreadFilter} onChange={(event) => setUnreadFilter(event.target.value as "all" | "true" | "false")}>
                <option value="all">Todas</option>
                <option value="true">Nao lidas</option>
                <option value="false">Lidas</option>
              </select>
              <select className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 focus:border-violet-400 focus:outline-none" value={deliveryStatusFilter} onChange={(event) => setDeliveryStatusFilter(event.target.value)}>
                <option value="">Envio</option>
                <option value="pending">pending</option>
                <option value="sent">sent</option>
                <option value="delivered">delivered</option>
                <option value="read">read</option>
                <option value="failed">failed</option>
                <option value="skipped">skipped</option>
              </select>
              <select className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 focus:border-violet-400 focus:outline-none" value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>
                <option value="">Tag</option>
                {availableTags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
              </select>
              <select className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 focus:border-violet-400 focus:outline-none" value={flowFilter} onChange={(event) => setFlowFilter(event.target.value)}>
                <option value="">Fluxo</option>
                {availableFlows.map((flow) => <option key={flow} value={flow}>{flow}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin bg-slate-50/60">
          {isInitialConversationsLoading ? (
            <div className="space-y-3 p-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-24 rounded-2xl" />
              ))}
            </div>
          ) : sidebarConversations.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={MessageSquareIcon}
                title="Nenhuma conversa encontrada ainda."
                description="Quando seus atendimentos começarem, eles aparecerão aqui com histórico, status e contexto."
              />
            </div>
          ) : (
            sidebarConversations.map((c) => (
              (() => {
                const isActiveConversation = c.id === selectedId;
                const previewText = isActiveConversation
                  ? (latestRenderableMessage?.rawText ?? latestRenderableMessage?.text ?? c.lastMessage)
                  : c.lastMessage;
                const previewTime = isActiveConversation
                  ? (latestRenderableMessage?.time || c.time)
                  : c.time;

                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      if (c.id === selectedId) {
                        return;
                      }

                      selectedConversationChangeRef.current = true;
                      shouldStickToBottomRef.current = true;
                      setSelectedId(c.id);
                    }}
                    className={cn(
                      "group mx-2 my-1 flex w-[calc(100%-1rem)] items-start gap-3 rounded-[1.45rem] border border-transparent px-4 py-3 text-left transition-smooth hover:border-primary/10 hover:bg-white/88",
                      selected?.id === c.id && "border-primary/15 bg-[linear-gradient(155deg,rgba(255,255,255,0.92),rgba(239,244,255,0.86))] shadow-[inset_3px_0_0_hsl(var(--primary)),0_24px_52px_-34px_rgba(37,99,255,0.5)]",
                    )}
                  >
                    <ContactAvatar name={c.name} fallback={c.avatar} avatarUrl={c.avatarUrl} active={c.status === "ativo" || c.status === "humano"} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className="font-semibold text-sm truncate text-foreground notranslate" translate="no" lang="pt-BR">{c.name}</p>
                        <span className="text-[10px] text-muted-foreground shrink-0">{previewTime}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground/80 truncate mb-1 notranslate" translate="no" lang="pt-BR">{formatPhoneForDisplay(c.phone)}</p>
                      <p
                        className="text-xs text-muted-foreground truncate mb-2 notranslate"
                        translate="no"
                        lang="pt-BR"
                        title={previewText || "Sem mensagens recentes"}
                      >
                        {formatConversationPreviewText(previewText) || "Sem mensagens recentes"}
                      </p>
                      <div className="flex items-center gap-1.5 min-h-5">
                        <StatusBadge status={c.status} className="text-[10px] py-0" />
                        {c.deliveryStatus === "failed" ? (
                          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                            Falha
                          </span>
                        ) : null}
                        {c.unread > 0 && (
                          <span className="ml-auto h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-sm">
                            {c.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })()
            ))
          )}
        </div>
      </Card>

      {/* Chat */}
      <Card className={cn("nexo-premium-surface flex-col overflow-hidden", selectedId ? "flex" : "hidden lg:flex")}>
        {selected ? (
          <>
            <div className="flex items-center gap-3 border-b border-slate-200/80 p-4 bg-white">
              <button type="button" onClick={() => setSelectedId(null)} className="lg:hidden -ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100" aria-label="Voltar para conversas">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <ContactAvatar name={selected.name} fallback={selected.avatar} avatarUrl={selected.avatarUrl} size="lg" active={selected.status === "ativo" || selected.status === "humano"} />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-sm truncate">{selected.name}</h3>
                  <StatusBadge status={selected.status} withDot />
                  {serviceWindow ? (
                    <span className={cn(
                      "text-[10px] rounded-full px-2 py-0.5 border",
                      requiresTemplate
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-slate-200 bg-slate-50 text-slate-500",
                    )}>
                      {requiresTemplate ? "Template necessario" : `Janela 24h${serviceWindow.hoursRemaining ? ` · ${serviceWindow.hoursRemaining}h` : ""}`}
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex min-w-0 items-center gap-1">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span className="shrink-0 font-medium text-foreground/70">Cliente</span>
                    <span className="truncate">{formatPhoneForDisplay(selected.phone)}</span>
                  </span>
                  {selected.flow ? <span className="truncate">· {selected.flow}</span> : null}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={deleteConversationMutation.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Apagar</span>
                </Button>
                <Link to={`/jornada?conversationId=${selected.id}`}>
                  <Button variant="outline" size="sm" className="gap-1.5 hidden md:inline-flex"><Workflow className="h-3.5 w-3.5" /> Ver jornada</Button>
                </Link>
              </div>
            </div>

            <div
              ref={messagesViewportRef}
              onScroll={(event) => {
                shouldStickToBottomRef.current = shouldAutoScrollToBottom(event.currentTarget);
              }}
              className="flex-1 overflow-y-auto p-4 scrollbar-thin md:p-6 bg-slate-50"
            >
              <div className="mx-auto max-w-4xl space-y-5">
              {activeConversationError ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  Nao foi possivel carregar o detalhe desta conversa agora. A lista continua ativa por realtime/polling.
                </div>
              ) : null}
              {conversationMessagesQuery.isPending && conversationMessages.length === 0 ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-2/3 rounded-[1.35rem]" />
                  <Skeleton className="ml-auto h-16 w-1/2 rounded-[1.35rem]" />
                  <Skeleton className="h-20 w-3/4 rounded-[1.35rem]" />
                </div>
              ) : conversationMessages.length === 0 ? (
                <div className="flex h-full min-h-[320px] items-center justify-center">
                  <EmptyState
                    icon={MessageSquareIcon}
                    title="Contato cadastrado"
                    description={
                      requiresTemplate
                        ? "Use um template oficial para iniciar essa conversa fora da janela de 24h."
                        : "Nenhuma mensagem registrada ainda. Envie uma mensagem para iniciar o atendimento."
                    }
                    action={(
                      <div className="inline-flex max-w-full items-center gap-1 rounded-full border border-border/70 bg-secondary/40 px-3 py-1 text-[11px] text-muted-foreground">
                        <Phone className="h-3 w-3 shrink-0" />
                        <span className="truncate">{formatPhoneForDisplay(selected.phone)}</span>
                      </div>
                    )}
                  />
                </div>
              ) : null}
              {conversationMessages.map((m) => {
                if (m.type === "event") {
                  return (
                    <div key={m.id} className="flex justify-center my-2">
                      <div className="px-3 py-1 rounded-full border border-white/60 bg-white/72 text-muted-foreground text-[11px] font-medium shadow-sm inline-flex items-center gap-1.5 backdrop-blur">
                        <Workflow className="h-3 w-3" /> {m.text}
                      </div>
                    </div>
                  );
                }
                const isClient = m.from === "client";
                const isHumanAgent = m.from === "agent";
                const isFailed = m.deliveryStatus === "failed";

                return (
                  <div key={m.id} className={cn("flex gap-2.5", isClient ? "justify-end" : "justify-start")}>
                    {!isClient && (
                      isHumanAgent ? (
                        <div className="mt-1 shrink-0">
                          <OperatorAvatar
                            name={operatorUser?.name ?? "Voce"}
                            fallback={operatorInitials}
                            avatarUrl={operatorUser?.avatarUrl}
                            size="sm"
                          />
                        </div>
                      ) : (
                        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#4f46e5,#7c3aed)] shadow-[0_8px_18px_-12px_rgba(79,70,229,0.5)]">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                      )
                    )}
                    <div className={cn(
                      "max-w-[78%] rounded-[1.35rem] px-4 py-3 shadow-sm ring-1 backdrop-blur",
                      isClient
                        ? "border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(243,246,255,0.9))] text-foreground rounded-br-md ring-primary/10 shadow-[0_22px_48px_-36px_rgba(148,163,184,0.34)]"
                        : isHumanAgent
                          ? "border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(241,245,255,0.9))] text-foreground rounded-bl-md ring-primary/10 shadow-[0_22px_48px_-36px_rgba(13,91,255,0.4)]"
                          : "bg-[linear-gradient(135deg,#4f46e5_0%,#7c3aed_100%)] text-white rounded-bl-md ring-violet-500/15 shadow-[0_8px_20px_-12px_rgba(79,70,229,0.45)]",
                      isFailed && "ring-destructive/30"
                    )}>
                      {!isClient ? (
                        <div className={cn("mb-2 text-[10px] font-semibold uppercase tracking-[0.2em]", isHumanAgent ? "text-muted-foreground/80" : "text-white/70")}>
                          {isHumanAgent ? (operatorUser?.name ?? "Humano") : "Nexo IA"}
                        </div>
                      ) : null}
                      {renderMessageBody(
                        m,
                        isClient,
                        setPreviewMessage,
                        handleSaveConversationMedia,
                        saveMediaToLibraryMutation.isPending,
                      )}
                      <div className={cn("mt-2 flex items-center gap-1.5 text-[10px]", !isClient && !isHumanAgent ? "text-white/72" : "text-muted-foreground")}>
                        <span>{m.time}</span>
                        {deliveryStatusLabel(m.deliveryStatus) ? <span>· {deliveryStatusLabel(m.deliveryStatus)}</span> : null}
                        {m.isOptimistic ? <Sparkles className="h-3 w-3 animate-pulse" /> : null}
                      </div>
                      {m.canRetry ? (
                        <div className={cn("mt-1 text-[10px]", !isClient && !isHumanAgent ? "text-white/72" : "text-muted-foreground")}>
                          Pronta para reenvio quando esse fluxo for habilitado.
                        </div>
                      ) : null}
                      {m.deliveryError ? (
                        <div className={cn("mt-2 rounded-lg px-2 py-1 text-[10px]", !isClient && !isHumanAgent ? "bg-white/12 text-white/85" : "bg-destructive/10 text-destructive")}>
                          {m.deliveryError}
                        </div>
                      ) : null}
                    </div>
                    {isClient && (
                      <ContactAvatar name={selected.name} fallback={selected.avatar} avatarUrl={selected.avatarUrl} size="sm" />
                    )}
                  </div>
                );
              })}
              {showAiProcessingBubble ? <AiProcessingBubble /> : null}
              </div>
            </div>

            <div className="border-t border-slate-200 bg-white p-3">
              {requiresTemplate ? (
                <div className="mb-2 rounded-md border border-warning/25 bg-warning/10 px-3 py-2 text-xs text-muted-foreground flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" />
                  <span>Fora da janela de 24h. Use um template oficial aprovado para reabrir o atendimento.</span>
                </div>
              ) : null}
              <div className="mb-2 flex items-center gap-2 px-1 text-[11px] text-slate-500">
                <OperatorAvatar
                  name={operatorUser?.name ?? "Voce"}
                  fallback={operatorInitials}
                  avatarUrl={operatorUser?.avatarUrl}
                  size="sm"
                />
                <span className="truncate">Respondendo como <span className="font-medium text-slate-700">{operatorUser?.name ?? "sua conta"}</span></span>
              </div>
              {availableTemplates.length > 0 ? (
                <div className="mb-2 space-y-2">
              <div className="flex items-center gap-2">
                <select
                  className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-xs"
                  value={selectedTemplateId}
                  onChange={(event) => {
                    setSelectedTemplateId(event.target.value);
                    setTemplateVariables({});
                    setTemplateMedia({ source: "url", url: "", id: "", assetId: "", filename: "" });
                    setTemplateError(null);
                  }}
                >
                  <option value="">Selecionar template oficial...</option>
                  {availableTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}{template.language ? ` · ${template.language}` : ""}{template.metaStatus ? ` · ${template.metaStatus}` : ""}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSendTemplate}
                  disabled={!selectedTemplateId || sendTemplateMutation.isPending}
                >
                  {sendTemplateMutation.isPending ? "Enviando..." : "Enviar template"}
                </Button>
              </div>
              {selectedTemplateVariables.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedTemplateVariables.map((variable) => (
                    <Input
                      key={variable.key}
                      className="h-8 bg-secondary/40 text-xs"
                      placeholder={`${variable.label}${variable.required ? " *" : ""}`}
                      value={templateVariables[variable.key] ?? ""}
                      onChange={(event) => setTemplateVariables((current) => ({
                        ...current,
                        [variable.key]: event.target.value,
                      }))}
                    />
                  ))}
                </div>
              ) : null}
              {selectedTemplateMediaHeader ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-[110px_1fr_140px] gap-2">
                    <select
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                      value={templateMedia.source}
                      onChange={(event) => setTemplateMedia((current) => ({ ...current, source: event.target.value as "url" | "id" | "asset" }))}
                    >
                      <option value="url">URL</option>
                      <option value="id">Media ID</option>
                      <option value="asset">Asset</option>
                    </select>
                    {templateMedia.source === "asset" ? (
                      <select
                        className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                        value={templateMedia.assetId}
                        onChange={(event) => setTemplateMedia((current) => ({ ...current, assetId: event.target.value }))}
                      >
                        <option value="">Midia enviada...</option>
                        {templateMediaAssets.map((asset) => (
                          <option key={asset.id} value={asset.id}>
                            {asset.originalName ?? asset.metaMediaId ?? `Asset ${asset.id}`}{asset.usageCount ? ` · ${asset.usageCount} usos` : ""}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        className="h-8 bg-secondary/40 text-xs"
                        placeholder={templateMedia.source === "url" ? `${selectedTemplateMediaHeader.type} do header por URL` : "Media ID da Meta"}
                        value={templateMedia.source === "url" ? templateMedia.url : templateMedia.id}
                        onChange={(event) => setTemplateMedia((current) => ({
                          ...current,
                          [current.source === "url" ? "url" : "id"]: event.target.value,
                        }))}
                      />
                    )}
                    {selectedTemplateMediaHeader.type === "document" ? (
                      <Input
                        className="h-8 bg-secondary/40 text-xs"
                        placeholder="Nome do arquivo"
                        value={templateMedia.filename}
                        onChange={(event) => setTemplateMedia((current) => ({ ...current, filename: event.target.value }))}
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    <Input
                      type="file"
                      className="h-8 max-w-[260px] bg-secondary/40 text-xs"
                      accept={selectedTemplateMediaHeader.type === "image" ? "image/png,image/jpeg,image/webp" : selectedTemplateMediaHeader.type === "video" ? "video/mp4,video/3gpp,video/quicktime" : ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"}
                      onChange={(event) => handleUploadMedia(event.target.files?.[0], selectedTemplateMediaHeader.type, "template")}
                    />
                    {uploadMediaMutation.isPending ? <span>Subindo para Meta...</span> : null}
                    {selectedTemplateMediaAsset ? <span>Selecionado: {selectedTemplateMediaAsset.originalName ?? selectedTemplateMediaAsset.metaMediaId}</span> : null}
                    {selectedTemplateMediaAsset?.type === "image" && selectedTemplateMediaAssetUrl ? (
                      <img src={selectedTemplateMediaAssetUrl} alt="Preview" className="h-8 w-8 rounded object-cover border border-border" />
                    ) : null}
                  </div>
                </div>
              ) : null}
              {templateError ? <p className="text-xs text-destructive">{templateError}</p> : null}
                </div>
              ) : null}
              {showMediaComposer && !requiresTemplate ? (
                <div className="mb-2 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="grid grid-cols-2 sm:grid-cols-[110px_90px_1fr_140px] gap-2">
                <select
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                  value={mediaDraft.type}
                  onChange={(event) => setMediaDraft((current) => ({ ...current, type: event.target.value as MediaAssetType, assetId: "" }))}
                >
                  <option value="image">Imagem</option>
                  <option value="video">Video</option>
                  <option value="audio">Audio</option>
                  <option value="document">Documento</option>
                </select>
                <select
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                  value={mediaDraft.source}
                  onChange={(event) => setMediaDraft((current) => ({ ...current, source: event.target.value as "url" | "id" | "asset" }))}
                >
                  <option value="url">URL</option>
                  <option value="id">Media ID</option>
                  <option value="asset">Asset</option>
                </select>
                {mediaDraft.source === "asset" ? (
                  <select
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                    value={mediaDraft.assetId}
                    onChange={(event) => setMediaDraft((current) => ({ ...current, assetId: event.target.value }))}
                  >
                    <option value="">Midia enviada...</option>
                    {mediaAssets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.originalName ?? asset.metaMediaId ?? `Asset ${asset.id}`}{asset.usageCount ? ` · ${asset.usageCount} usos` : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    className="h-8 bg-secondary/40 text-xs"
                    placeholder={mediaDraft.source === "url" ? "URL publica da midia" : "ID de midia da Meta"}
                    value={mediaDraft.source === "url" ? mediaDraft.url : mediaDraft.id}
                    onChange={(event) => setMediaDraft((current) => ({
                      ...current,
                      [current.source === "url" ? "url" : "id"]: event.target.value,
                    }))}
                  />
                )}
                {mediaDraft.type === "document" ? (
                  <Input
                    className="h-8 bg-secondary/40 text-xs"
                    placeholder="Arquivo.pdf"
                    value={mediaDraft.filename}
                    onChange={(event) => setMediaDraft((current) => ({ ...current, filename: event.target.value }))}
                  />
                ) : null}
              </div>
              <div className="flex gap-2">
                <Input
                  className="h-8 bg-secondary/40 text-xs"
                  placeholder="Legenda opcional"
                  value={mediaDraft.caption}
                  onChange={(event) => setMediaDraft((current) => ({ ...current, caption: event.target.value }))}
                />
                <Button variant="outline" size="sm" onClick={handleSendMedia} disabled={sendMediaMutation.isPending}>
                  {sendMediaMutation.isPending ? "Enviando..." : "Enviar midia"}
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <Input
                  type="file"
                  className="h-9 w-full bg-white text-xs file:mr-2 file:rounded-md file:border-0 file:bg-slate-200 file:px-2 file:py-1 file:text-slate-700 hover:file:bg-slate-300"
                  accept={mediaDraft.type === "image" ? "image/png,image/jpeg,image/webp" : mediaDraft.type === "video" ? "video/mp4,video/3gpp,video/quicktime" : mediaDraft.type === "audio" ? "audio/aac,audio/mp4,audio/mpeg,audio/ogg,audio/opus,audio/webm,audio/wav" : ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"}
                  onChange={(event) => handleUploadMedia(event.target.files?.[0], mediaDraft.type, "manual")}
                />
                {uploadMediaMutation.isPending ? <span>Subindo para Meta...</span> : null}
                {selectedMediaAsset ? <span>Selecionado: {selectedMediaAsset.originalName ?? selectedMediaAsset.metaMediaId}</span> : null}
                {selectedMediaAsset?.type === "image" && selectedMediaAssetUrl ? (
                  <img src={selectedMediaAssetUrl} alt="Preview" className="h-8 w-8 rounded object-cover border border-border" />
                ) : null}
                {mediaDraft.source === "url" && mediaDraft.type === "image" && mediaDraft.url ? (
                  <img src={mediaDraft.url} alt="Preview" className="h-8 w-8 rounded object-cover border border-border" />
                ) : null}
                {mediaDraft.source === "url" && mediaDraft.type === "video" && mediaDraft.url ? <span>Preview de video por URL informado</span> : null}
                {mediaDraft.source === "url" && mediaDraft.type === "audio" && mediaDraft.url ? <audio src={mediaDraft.url} controls preload="metadata" className="h-8 max-w-[240px]" /> : null}
                {selectedMediaAsset?.type === "audio" && selectedMediaAssetUrl ? <audio src={selectedMediaAssetUrl} controls preload="metadata" className="h-8 max-w-[240px]" /> : null}
                {mediaDraft.type === "document" && (mediaDraft.filename || selectedMediaAsset?.originalName) ? <span>Documento: {mediaDraft.filename || selectedMediaAsset?.originalName}</span> : null}
              </div>
              {mediaError ? <p className="text-xs text-destructive">{mediaError}</p> : null}
                </div>
              ) : null}
              <div className="flex items-center gap-2 rounded-[1.65rem] border border-border/70 bg-background/88 p-2 shadow-[0_18px_40px_-32px_rgba(5,10,43,0.3)]">
                <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setShowMediaComposer((current) => !current)} disabled={requiresTemplate}>
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  placeholder={requiresTemplate ? "Use um template oficial para esta conversa..." : "Digite uma mensagem ou intervenha no atendimento..."}
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-[15px]"
                  value={draftMessage}
                  disabled={requiresTemplate}
                  translate="no"
                  autoCorrect="off"
                  autoCapitalize="off"
                  autoComplete="off"
                  spellCheck={false}
                  inputMode="text"
                  onChange={(event) => setDraftMessage(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={sendMessageMutation.isPending || requiresTemplate || !draftMessage.trim()}
                  title={sendMessageMutation.isPending ? "Enviando mensagem..." : "Enviar mensagem"}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : isInitialConversationsLoading ? (
          <div className="flex flex-1 flex-col justify-center gap-4 p-8">
            <Skeleton className="mx-auto h-16 w-16 rounded-full" />
            <Skeleton className="mx-auto h-5 w-52" />
            <Skeleton className="mx-auto h-4 w-72" />
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <EmptyState
              icon={MessageSquareIcon}
              title="Nenhuma conversa encontrada ainda."
              description="Quando seus atendimentos começarem, eles aparecerão aqui."
              action={(
                <Button className="gap-2" onClick={openCreateConversation}>
              <Plus className="h-4 w-4" />
              Nova conversa
            </Button>
              )}
            />
          </div>
        )}
      </Card>

      <Dialog open={conversationDialogOpen} onOpenChange={setConversationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova conversa</DialogTitle>
            <DialogDescription>Crie a conversa a partir de um contato existente ou cadastre um novo contato e ja envie a primeira mensagem.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Origem do contato</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={conversationContactMode === "existing" ? "default" : "outline"}
                  onClick={() => setConversationContactMode("existing")}
                  disabled={contacts.length === 0}
                >
                  Contato existente
                </Button>
                <Button
                  type="button"
                  variant={conversationContactMode === "new" ? "default" : "outline"}
                  onClick={() => setConversationContactMode("new")}
                >
                  Novo contato
                </Button>
              </div>
              {conversationContactMode === "existing" ? (
                <select
                  id="conversation-contact"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={conversationDraft.contactId}
                  onChange={(event) => setConversationDraft((draft) => ({ ...draft, contactId: event.target.value }))}
                >
                  <option value="">Selecione um contato...</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>{contact.name} · {contact.phone}</option>
                  ))}
                </select>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-md border border-border/60 bg-secondary/20 p-3">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name-inline">Nome</Label>
                    <Input
                      id="contact-name-inline"
                      value={contactDraft.name}
                      onChange={(event) => setContactDraft((draft) => ({ ...draft, name: event.target.value }))}
                      placeholder="Nome do contato"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-phone-inline">Telefone</Label>
                    <Input
                      id="contact-phone-inline"
                      value={contactDraft.phone}
                      onChange={(event) => setContactDraft((draft) => ({ ...draft, phone: event.target.value }))}
                      placeholder="5511999999999"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-origin-inline">Origem</Label>
                    <Input
                      id="contact-origin-inline"
                      value={contactDraft.origin}
                      onChange={(event) => setContactDraft((draft) => ({ ...draft, origin: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-status-inline">Status</Label>
                    <Input
                      id="contact-status-inline"
                      value={contactDraft.status}
                      onChange={(event) => setContactDraft((draft) => ({ ...draft, status: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-tags-inline">Tags</Label>
                    <Input
                      id="contact-tags-inline"
                      value={contactDraft.tags}
                      onChange={(event) => setContactDraft((draft) => ({ ...draft, tags: event.target.value }))}
                      placeholder="lead, premium"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-avatar-inline">Foto de perfil</Label>
                    <Input
                      id="contact-avatar-inline"
                      value={contactDraft.avatarUrl}
                      onChange={(event) => setContactDraft((draft) => ({ ...draft, avatarUrl: event.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-responsible-inline">Responsavel</Label>
                    <Input
                      id="contact-responsible-inline"
                      value={contactDraft.responsible}
                      onChange={(event) => setContactDraft((draft) => ({ ...draft, responsible: event.target.value }))}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="conversation-status">Status</Label>
                <select
                  id="conversation-status"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={conversationDraft.status}
                  onChange={(event) => setConversationDraft((draft) => ({ ...draft, status: event.target.value as ConversationDraft["status"] }))}
                >
                  <option value="ativo">Ativo</option>
                  <option value="aguardando">Aguardando</option>
                  <option value="humano">Humano</option>
                  <option value="finalizado">Finalizado</option>
                  <option value="erro">Erro</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="conversation-tag">Tag</Label>
                <Input id="conversation-tag" value={conversationDraft.tag} onChange={(event) => setConversationDraft((draft) => ({ ...draft, tag: event.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="conversation-flow">Fluxo</Label>
              <Input id="conversation-flow" value={conversationDraft.flow} onChange={(event) => setConversationDraft((draft) => ({ ...draft, flow: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conversation-last-message">Mensagem inicial</Label>
              <Input
                id="conversation-last-message"
                value={conversationDraft.lastMessage}
                onChange={(event) => setConversationDraft((draft) => ({ ...draft, lastMessage: event.target.value }))}
                placeholder="Essa mensagem sera enviada logo apos criar a conversa"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConversationDialogOpen(false)} disabled={createConversationMutation.isPending || createContactMutation.isPending || sendMessageMutation.isPending}>Cancelar</Button>
            <Button onClick={saveConversation} disabled={createConversationMutation.isPending || createContactMutation.isPending || sendMessageMutation.isPending}>
              {createConversationMutation.isPending || createContactMutation.isPending || sendMessageMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(previewMessage)} onOpenChange={(open) => !open && setPreviewMessage(null)}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden">
          <DialogHeader className="border-b border-border px-4 py-3">
            <DialogTitle className="flex items-center gap-2 text-base">
              {previewMessage?.type === "image" ? <ImageIcon className="h-4 w-4" /> : <Film className="h-4 w-4" />}
              {previewMessage?.type === "image" ? "Imagem recebida" : "Video recebido"}
            </DialogTitle>
            <DialogDescription className="truncate">
              {previewMessage?.mediaAsset?.originalName ?? previewMessage?.rawText ?? previewMessage?.text ?? "Midia da conversa"}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[78vh] bg-black p-3">
            {previewMessage?.type === "image" && previewMessageMediaUrl ? (
              <img
                src={previewMessageMediaUrl}
                alt={previewMessage.mediaAsset.originalName ?? "Imagem recebida"}
                className="mx-auto max-h-[72vh] max-w-full rounded object-contain"
              />
            ) : null}
            {previewMessage?.type === "video" && previewMessageMediaUrl ? (
              <video
                src={previewMessageMediaUrl}
                className="mx-auto max-h-[72vh] max-w-full rounded"
                controls
                autoPlay
                playsInline
              />
            ) : null}
          </div>
          {previewMessageMediaUrl ? (
            <DialogFooter className="border-t border-border px-4 py-3">
              <a
                href={previewMessageMediaUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir em nova aba
              </a>
              <a
                href={previewMessageMediaUrl}
                download={previewMessage.mediaAsset.originalName ?? true}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Download className="h-4 w-4" />
                Baixar
              </a>
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apagar conversa?</DialogTitle>
            <DialogDescription>
              Isso remove a conversa, mensagens, jornada e execucoes de fluxo desta conversa. O contato continua salvo para novos testes.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-muted-foreground">
            Para testar primeira mensagem de novo, apague a conversa e envie uma nova mensagem pelo WhatsApp desse contato.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleteConversationMutation.isPending}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteConversation} disabled={deleteConversationMutation.isPending}>
              {deleteConversationMutation.isPending ? "Apagando..." : "Apagar conversa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
