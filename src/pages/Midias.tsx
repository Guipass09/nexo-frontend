import { useEffect, useMemo, useState } from "react";
import { Archive, FileAudio, FileImage, FileText, Film, RotateCcw, Search, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useArchiveMediaAsset, useMediaAssetLibrary, useOperators, useRestoreMediaAsset, useUploadMediaAsset } from "@/hooks/use-app-data";
import { ApiError } from "@/lib/api/client";
import { getStoredAuthUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import type { MediaAsset, MediaAssetType } from "@/types/domain";

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

function MediaAssetThumb({ asset }: { asset: MediaAsset }) {
  const mediaUrl = useBrowserMediaUrl(asset.downloadUrl ?? asset.publicUrl);
  const Icon = asset.type === "image" ? FileImage : asset.type === "video" ? Film : asset.type === "audio" ? FileAudio : FileText;

  return (
    <div className={cn("h-9 w-9 rounded-md border border-border bg-secondary/50 flex items-center justify-center", asset.type === "image" && mediaUrl && "overflow-hidden")}>
      {asset.type === "image" && mediaUrl ? (
        <img src={mediaUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <Icon className="h-4 w-4 text-muted-foreground" />
      )}
    </div>
  );
}

export default function Midias() {
  const [type, setType] = useState<"" | MediaAssetType>("");
  const [sourceType, setSourceType] = useState<"" | "upload" | "url" | "meta_id">("");
  const [status, setStatus] = useState<"active" | "archived" | "all">("active");
  const [uploadedBy, setUploadedBy] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [unused, setUnused] = useState(false);
  const [page, setPage] = useState(1);
  const [pendingAssetId, setPendingAssetId] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<MediaAssetType>("image");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const isAdmin = getStoredAuthUser()?.role === "admin";
  const { data: operators = [] } = useOperators(isAdmin);
  const mediaAssetsQuery = useMediaAssetLibrary({
    type,
    sourceType,
    status,
    uploadedBy,
    dateFrom,
    dateTo,
    unused,
    page,
    perPage: 20,
  });
  const { data: response, isFetching } = mediaAssetsQuery;
  const archiveMutation = useArchiveMediaAsset();
  const restoreMutation = useRestoreMediaAsset();
  const uploadMutation = useUploadMediaAsset();

  const assets = response?.data ?? [];
  const meta = response?.meta;
  const totalUnused = useMemo(() => assets.filter((asset) => asset.isUsed === false).length, [assets]);
  const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof ApiError && typeof error.responseBody === "object" && error.responseBody !== null && "message" in error.responseBody
      ? String(error.responseBody.message)
      : fallback;

  useEffect(() => {
    if (mediaAssetsQuery.isError) {
      toast({
        title: "Falha ao listar midias",
        description: getErrorMessage(mediaAssetsQuery.error, "Nao foi possivel carregar a biblioteca agora."),
        variant: "destructive",
      });
    }
  }, [mediaAssetsQuery.error, mediaAssetsQuery.isError]);

  const resetFilters = () => {
    setType("");
    setSourceType("");
    setStatus("active");
    setUploadedBy("");
    setDateFrom("");
    setDateTo("");
    setUnused(false);
    setPage(1);
  };
  const handleArchive = (assetId: string) => {
    setPendingAssetId(assetId);
    archiveMutation.mutate(assetId, {
      onSuccess: () => toast({ title: "Asset arquivado", description: "Ele nao aparecera mais no composer ate ser restaurado." }),
      onError: (error) => toast({ title: "Nao foi possivel arquivar", description: getErrorMessage(error, "Tente novamente ou verifique suas permissoes."), variant: "destructive" }),
      onSettled: () => setPendingAssetId(null),
    });
  };
  const handleRestore = (assetId: string) => {
    setPendingAssetId(assetId);
    restoreMutation.mutate(assetId, {
      onSuccess: () => toast({ title: "Asset restaurado", description: "Ele voltou a ficar disponivel para reuso." }),
      onError: (error) => toast({ title: "Nao foi possivel restaurar", description: getErrorMessage(error, "Tente novamente ou verifique suas permissoes."), variant: "destructive" }),
      onSettled: () => setPendingAssetId(null),
    });
  };
  const handleUpload = () => {
    if (!uploadFile) {
      toast({ title: "Selecione um arquivo", description: "Escolha uma midia antes de enviar.", variant: "destructive" });
      return;
    }

    uploadMutation.mutate({ type: uploadType, file: uploadFile }, {
      onSuccess: (response) => {
        const uploadStatus = response.upload.status === "uploaded" ? "enviado para Meta" : response.upload.status;
        toast({ title: "Asset criado", description: `Upload ${uploadStatus}. O asset ja esta disponivel na biblioteca.` });
        setUploadFile(null);
        setFileInputKey((current) => current + 1);
        setPage(1);
      },
      onError: (error) => toast({ title: "Falha no upload", description: getErrorMessage(error, "Nao foi possivel enviar a midia."), variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Biblioteca de Midia</h1>
          <p className="text-sm text-muted-foreground">Assets cadastrados para envio manual e templates oficiais.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">{meta?.total ?? assets.length} assets</Badge>
          <Badge variant={totalUnused > 0 ? "secondary" : "outline"}>{totalUnused} sem uso nesta página atual</Badge>
        </div>
      </div>

      <Card className="p-4 border-border/60">
        <div className="grid grid-cols-1 md:grid-cols-[180px_1fr_auto] gap-3 md:items-end">
          <div className="space-y-2">
            <label htmlFor="upload-type" className="text-xs font-medium text-muted-foreground">Tipo do asset</label>
            <select
              id="upload-type"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              value={uploadType}
              onChange={(event) => setUploadType(event.target.value as typeof uploadType)}
            >
              <option value="image">Imagem</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="document">Documento</option>
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="upload-file" className="text-xs font-medium text-muted-foreground">Arquivo</label>
            <Input
              key={fileInputKey}
              id="upload-file"
              type="file"
              className="h-9 bg-secondary/40 text-xs"
              accept={uploadType === "image" ? "image/png,image/jpeg,image/webp" : uploadType === "video" ? "video/mp4,video/3gpp,video/quicktime" : uploadType === "audio" ? "audio/aac,audio/mp4,audio/mpeg,audio/ogg,audio/opus,audio/webm,audio/wav" : ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"}
              onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
            />
          </div>
          <Button className="gap-1.5" onClick={handleUpload} disabled={uploadMutation.isPending}>
            <Upload className="h-4 w-4" /> {uploadMutation.isPending ? "Enviando..." : "Enviar asset"}
          </Button>
        </div>
      </Card>

      <Card className="p-4 border-border/60">
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-7 gap-2">
          <select className="h-9 rounded-md border border-input bg-background px-3 text-xs" value={type} onChange={(event) => { setType(event.target.value as typeof type); setPage(1); }}>
            <option value="">Tipo</option>
            <option value="image">Imagem</option>
            <option value="video">Video</option>
            <option value="audio">Audio</option>
            <option value="document">Documento</option>
          </select>
          <select className="h-9 rounded-md border border-input bg-background px-3 text-xs" value={sourceType} onChange={(event) => { setSourceType(event.target.value as typeof sourceType); setPage(1); }}>
            <option value="">Origem</option>
            <option value="upload">Upload</option>
            <option value="url">URL</option>
            <option value="meta_id">Media ID</option>
          </select>
          <select className="h-9 rounded-md border border-input bg-background px-3 text-xs" value={status} onChange={(event) => { setStatus(event.target.value as typeof status); setPage(1); }}>
            <option value="active">Ativos</option>
            <option value="archived">Arquivados</option>
            <option value="all">Todos</option>
          </select>
          {isAdmin ? (
            <select className="h-9 rounded-md border border-input bg-background px-3 text-xs" value={uploadedBy} onChange={(event) => { setUploadedBy(event.target.value); setPage(1); }}>
              <option value="">Operador</option>
              {operators.map((operator) => (
                <option key={operator.id} value={operator.id}>{operator.name}</option>
              ))}
            </select>
          ) : (
            <Input className="h-9 bg-secondary/40 text-xs" placeholder="Operador disponível para admin" disabled />
          )}
          <Input type="date" className="h-9 bg-secondary/40 text-xs" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setPage(1); }} />
          <Input type="date" className="h-9 bg-secondary/40 text-xs" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setPage(1); }} />
          <div className="flex gap-2">
            <Button variant={unused ? "default" : "outline"} size="sm" className="flex-1" onClick={() => { setUnused((current) => !current); setPage(1); }}>
              Sem uso
            </Button>
            <Button variant="ghost" size="sm" onClick={resetFilters}>Limpar</Button>
          </div>
        </div>
      </Card>

      <Card className="border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Arquivo</th>
                <th className="px-4 py-3 text-left font-medium">Tipo</th>
                <th className="px-4 py-3 text-left font-medium">Origem</th>
                <th className="px-4 py-3 text-left font-medium">Meta Media ID</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Uso</th>
                <th className="px-4 py-3 text-left font-medium">Criado em</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => {
                return (
                  <tr key={asset.id} className="border-t border-border/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <MediaAssetThumb asset={asset} />
                        <div className="min-w-0">
                          <Link to={`/midias/${asset.id}`} className="font-medium truncate max-w-[260px] hover:text-primary block">
                            {asset.originalName ?? asset.publicUrl ?? `Asset ${asset.id}`}
                          </Link>
                          <p className="text-xs text-muted-foreground">{asset.mimeType ?? "mime nao informado"} {asset.sizeLabel ? `· ${asset.sizeLabel}` : ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{typeLabels[asset.type]}</td>
                    <td className="px-4 py-3">{sourceLabels[asset.sourceType] ?? asset.sourceType}</td>
                    <td className="px-4 py-3 font-mono text-xs max-w-[220px] truncate">{asset.metaMediaId ?? "-"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={asset.status === "archived" ? "secondary" : "outline"}>{asset.status === "archived" ? "Arquivado" : "Ativo"}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={asset.isUsed ? "outline" : "secondary"}>{asset.usageCount ?? 0} mensagens</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{asset.createdAt ? new Date(asset.createdAt).toLocaleDateString("pt-BR") : "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/midias/${asset.id}`}>Detalhe</Link>
                        </Button>
                        {isAdmin ? (
                          asset.status === "archived" ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-1.5" disabled={pendingAssetId === asset.id}>
                                  <RotateCcw className="h-3.5 w-3.5" /> {pendingAssetId === asset.id ? "Restaurando..." : "Restaurar"}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Restaurar este asset?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    O asset voltara a aparecer nos seletores de midia e podera ser usado em novos envios manuais.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="rounded-md border border-border/60 bg-secondary/30 p-3 text-sm">
                                  <p className="font-medium">{asset.originalName ?? asset.publicUrl ?? `Asset ${asset.id}`}</p>
                                  <p className="text-xs text-muted-foreground">{asset.type} · {asset.sourceType} · {asset.usageCount ?? 0} usos</p>
                                </div>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleRestore(asset.id)}>Restaurar asset</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-1.5" disabled={pendingAssetId === asset.id}>
                                  <Archive className="h-3.5 w-3.5" /> {pendingAssetId === asset.id ? "Arquivando..." : "Arquivar"}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Arquivar este asset?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    O asset nao sera apagado, mas deixara de aparecer no seletor do composer e nao podera ser usado em novos envios ate ser restaurado.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="rounded-md border border-border/60 bg-secondary/30 p-3 text-sm">
                                  <p className="font-medium">{asset.originalName ?? asset.publicUrl ?? `Asset ${asset.id}`}</p>
                                  <p className="text-xs text-muted-foreground">{asset.type} · {asset.sourceType} · {asset.usageCount ?? 0} usos</p>
                                </div>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleArchive(asset.id)}>Arquivar com segurança</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    <Search className="h-5 w-5 mx-auto mb-2 opacity-60" />
                    Nenhuma midia encontrada para os filtros atuais.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <span>{isFetching ? "Atualizando..." : `Pagina ${meta?.current_page ?? page} de ${meta?.last_page ?? 1}`}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Anterior</Button>
            <Button variant="outline" size="sm" disabled={meta ? page >= meta.last_page : true} onClick={() => setPage((current) => current + 1)}>Proxima</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
