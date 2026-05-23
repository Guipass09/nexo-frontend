import { Archive, ArrowLeft, FileAudio, FileImage, FileText, Film, RotateCcw } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useBrowserMediaUrl } from "@/hooks/use-browser-media-url";
import { useArchiveMediaAsset, useMediaAsset, useRestoreMediaAsset } from "@/hooks/use-app-data";
import { ApiError } from "@/lib/api/client";
import { getStoredAuthUser } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";

const typeLabels = {
  image: "Imagem",
  video: "Video",
  audio: "Audio",
  document: "Documento",
} as const;

const sourceLabels = {
  upload: "Upload",
  url: "URL",
  meta_id: "Media ID",
} as const;

export default function MidiaDetalhe() {
  const { id } = useParams();
  const { data: asset, isLoading } = useMediaAsset(id ?? null);
  const archiveMutation = useArchiveMediaAsset();
  const restoreMutation = useRestoreMediaAsset();
  const isAdmin = getStoredAuthUser()?.role === "admin";
  const assetMediaUrl = useBrowserMediaUrl(asset?.downloadUrl ?? asset?.publicUrl);

  if (isLoading) {
    return <Card className="p-6 border-border/60 text-sm text-muted-foreground">Carregando midia...</Card>;
  }

  if (!asset) {
    return <Card className="p-6 border-border/60 text-sm text-muted-foreground">Midia nao encontrada.</Card>;
  }

  const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof ApiError && typeof error.responseBody === "object" && error.responseBody !== null && "message" in error.responseBody
      ? String(error.responseBody.message)
      : fallback;
  const handleArchive = () => archiveMutation.mutate(asset.id, {
    onSuccess: () => toast({ title: "Asset arquivado", description: "O asset foi preservado e removido do reuso operacional." }),
    onError: (error) => toast({ title: "Nao foi possivel arquivar", description: getErrorMessage(error, "Tente novamente ou verifique suas permissoes."), variant: "destructive" }),
  });
  const handleRestore = () => restoreMutation.mutate(asset.id, {
    onSuccess: () => toast({ title: "Asset restaurado", description: "O asset voltou a ficar disponivel para reuso." }),
    onError: (error) => toast({ title: "Nao foi possivel restaurar", description: getErrorMessage(error, "Tente novamente ou verifique suas permissoes."), variant: "destructive" }),
  });
  const Icon = asset.type === "image" ? FileImage : asset.type === "video" ? Film : asset.type === "audio" ? FileAudio : FileText;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <Button asChild variant="ghost" size="sm" className="gap-1.5 px-0">
            <Link to="/midias"><ArrowLeft className="h-4 w-4" /> Voltar para biblioteca</Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{asset.originalName ?? asset.publicUrl ?? `Asset ${asset.id}`}</h1>
          <p className="text-sm text-muted-foreground">Detalhes, governanca e uso deste asset.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={asset.status === "archived" ? "secondary" : "outline"}>{asset.status === "archived" ? "Arquivado" : "Ativo"}</Badge>
          {isAdmin ? (
            asset.status === "archived" ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5" disabled={restoreMutation.isPending}>
                    <RotateCcw className="h-3.5 w-3.5" /> {restoreMutation.isPending ? "Restaurando..." : "Restaurar"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Restaurar este asset?</AlertDialogTitle>
                    <AlertDialogDescription>
                      O asset voltara a ficar disponivel para reuso no composer e em templates com midia.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="rounded-md border border-border/60 bg-secondary/30 p-3 text-sm">
                    <p className="font-medium">{asset.originalName ?? asset.publicUrl ?? `Asset ${asset.id}`}</p>
                    <p className="text-xs text-muted-foreground">{asset.type} · {asset.sourceType} · {asset.usageCount ?? 0} usos</p>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRestore}>Restaurar asset</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5" disabled={archiveMutation.isPending}>
                    <Archive className="h-3.5 w-3.5" /> {archiveMutation.isPending ? "Arquivando..." : "Arquivar"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Arquivar este asset?</AlertDialogTitle>
                    <AlertDialogDescription>
                      O asset sera preservado para auditoria, mas nao podera ser reutilizado no composer ate ser restaurado por um admin.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="rounded-md border border-border/60 bg-secondary/30 p-3 text-sm">
                    <p className="font-medium">{asset.originalName ?? asset.publicUrl ?? `Asset ${asset.id}`}</p>
                    <p className="text-xs text-muted-foreground">{asset.type} · {asset.sourceType} · {asset.usageCount ?? 0} usos</p>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleArchive}>Arquivar com segurança</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-4">
        <Card className="p-4 border-border/60 space-y-4">
          <div className="aspect-video rounded-lg border border-border bg-secondary/40 flex items-center justify-center overflow-hidden">
            {asset.type === "image" && assetMediaUrl ? (
              <img src={assetMediaUrl} alt={asset.originalName ?? "Preview"} className="h-full w-full object-cover" />
            ) : asset.type === "audio" && assetMediaUrl ? (
              <div className="w-full px-4">
                <FileAudio className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                <audio src={assetMediaUrl} controls preload="metadata" className="h-9 w-full" />
              </div>
            ) : asset.type === "video" && assetMediaUrl ? (
              <video src={assetMediaUrl} controls preload="metadata" className="h-full w-full object-contain bg-black" />
            ) : (
              <div className="text-center text-sm text-muted-foreground">
                <Icon className="h-8 w-8 mx-auto mb-2" />
                {asset.type === "image" || asset.type === "audio" || asset.type === "video"
                  ? "Arquivo ainda nao disponivel para preview."
                  : "Documento registrado"}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Info label="Tipo" value={typeLabels[asset.type]} />
            <Info label="Tamanho" value={asset.sizeLabel || "-"} />
            <Info label="Origem" value={sourceLabels[asset.sourceType] ?? asset.sourceType} />
            <Info label="Uso total" value={`${asset.usageCount ?? 0} mensagens`} />
          </div>
        </Card>

        <Card className="p-4 border-border/60">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <Info label="Meta Media ID" value={asset.metaMediaId ?? "-"} mono />
            <Info label="MIME type" value={asset.mimeType ?? "-"} />
            <Info label="Enviado por" value={asset.uploadedByName ?? asset.uploadedBy ?? "-"} />
            <Info label="Criado em" value={asset.createdAt ? new Date(asset.createdAt).toLocaleString("pt-BR") : "-"} />
            <Info label="Arquivado por" value={asset.archivedByName ?? asset.archivedBy ?? "-"} />
            <Info label="Arquivado em" value={asset.archivedAt ? new Date(asset.archivedAt).toLocaleString("pt-BR") : "-"} />
            <Info label="Storage disk" value={asset.storageDisk ?? "-"} />
            <Info label="Storage path" value={asset.storagePath ?? "-"} mono />
            <Info label="Storage visibility" value={asset.storageVisibility ?? "-"} />
            <Info label="Checksum" value={asset.checksum ?? "-"} mono />
          </div>
        </Card>
      </div>

      <Card className="border-border/60 overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold">Mensagens relacionadas</h2>
          <p className="text-xs text-muted-foreground">Ultimos usos do asset em conversas e templates.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Contato</th>
                <th className="px-4 py-3 text-left font-medium">Tipo</th>
                <th className="px-4 py-3 text-left font-medium">Mensagem</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {(asset.relatedMessages ?? []).map((message) => (
                <tr key={message.id} className="border-t border-border/60">
                  <td className="px-4 py-3">{message.contactName ?? "-"}</td>
                  <td className="px-4 py-3">{message.templateName ? `Template: ${message.templateName}` : message.type}</td>
                  <td className="px-4 py-3 max-w-[360px] truncate">{message.text ?? "-"}</td>
                  <td className="px-4 py-3">{message.deliveryStatus ?? "-"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{message.sentAt ? new Date(message.sentAt).toLocaleString("pt-BR") : "-"}</td>
                </tr>
              ))}
              {(asset.relatedMessages ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Nenhuma mensagem relacionada encontrada.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="border-border/60 overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold">Auditoria de governanca</h2>
          <p className="text-xs text-muted-foreground">Acoes manuais registradas para este asset.</p>
        </div>
        <div className="divide-y divide-border/60">
          {(asset.auditEvents ?? []).map((event) => (
            <div key={event.id} className="p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{event.title}</p>
                <span className="text-xs text-muted-foreground">{event.createdAt ? new Date(event.createdAt).toLocaleString("pt-BR") : "-"}</span>
              </div>
              <p className="text-xs text-muted-foreground">{event.description ?? ""}</p>
              <p className="text-xs text-muted-foreground mt-1">Operador: {event.operatorName ?? event.operatorEmail ?? "Nao informado"}</p>
            </div>
          ))}
          {(asset.auditEvents ?? []).length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground text-center">Nenhum evento de governanca registrado.</div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}

function Info({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-md border border-border/60 bg-secondary/20 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={mono ? "font-mono text-xs break-all" : "text-sm break-words"}>{value}</p>
    </div>
  );
}
