import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBrowserMediaUrl } from "@/hooks/use-browser-media-url";
import { useMediaAssets, useUploadMediaAsset } from "@/hooks/use-app-data";
import { toast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, Library, Mic, Plus, Upload } from "lucide-react";
import type { MediaAsset } from "@/types/domain";

const AUDIO_ACCEPT = "audio/aac,audio/mp4,audio/mpeg,audio/ogg,audio/opus,audio/webm,audio/wav";
const MAX_AUDIO_BYTES = 16 * 1024 * 1024;

function AudioLibraryPlayer({ asset }: { asset: MediaAsset }) {
  const mediaUrl = useBrowserMediaUrl(asset.downloadUrl ?? asset.publicUrl);

  if (!mediaUrl) {
    return (
      <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-muted-foreground">
        Este audio existe na biblioteca, mas o arquivo ainda nao esta disponivel para ouvir no painel.
      </div>
    );
  }

  return <audio src={mediaUrl} controls preload="metadata" className="h-9 w-full" />;
}

export default function Audios() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [search, setSearch] = useState("");
  const { data: audioAssets = [], isLoading, isError, error } = useMediaAssets("audio");
  const uploadAudioMutation = useUploadMediaAsset();

  const filteredAudios = audioAssets.filter((asset) => {
    const haystack = [
      asset.originalName,
      asset.metaMediaId,
      asset.publicUrl,
      asset.mimeType,
    ].filter(Boolean).join(" ").toLowerCase();

    return haystack.includes(search.trim().toLowerCase());
  });

  const handleUploadAudio = (file: File | undefined) => {
    if (!file || uploadAudioMutation.isPending) {
      return;
    }

    if (file.size > MAX_AUDIO_BYTES) {
      toast({
        title: "Audio muito grande",
        description: "Envie um arquivo de ate 16 MB.",
        variant: "destructive",
      });
      return;
    }

    uploadAudioMutation.mutate(
      { type: "audio", file },
      {
        onSuccess: (response) => {
          const uploadStatus = response.upload?.status;

          toast({
            title: uploadStatus === "uploaded" ? "Audio salvo e enviado para Meta" : "Audio salvo",
            description: uploadStatus === "uploaded"
              ? "Ele ja esta disponivel para usar no chat e nos fluxos."
              : response.upload?.error ?? "O arquivo ficou disponivel no painel.",
          });

          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        },
        onError: (uploadError) => {
          toast({
            title: "Falha ao enviar audio",
            description: getApiErrorMessage(uploadError, "Nao foi possivel salvar este audio."),
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audios</h1>
          <p className="text-sm text-muted-foreground">
            Biblioteca real de audios para enviar no chat e encaixar nos fluxos.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar audio..."
            className="w-full sm:w-72 bg-secondary/40"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept={AUDIO_ACCEPT}
            className="hidden"
            onChange={(event) => handleUploadAudio(event.target.files?.[0])}
          />
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadAudioMutation.isPending}
          >
            <Upload className="h-4 w-4" />
            {uploadAudioMutation.isPending ? "Enviando..." : "Upload"}
          </Button>
        </div>
      </div>

      <Card className="p-5 md:p-6 border-border/60">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold mb-1">Biblioteca de audios</h3>
            <p className="text-xs text-muted-foreground">
              Selecione estes audios em Fluxos usando Enviar midia, tipo Audio, origem Biblioteca.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs text-muted-foreground">
            <Library className="h-3.5 w-3.5" />
            {audioAssets.length} {audioAssets.length === 1 ? "audio" : "audios"}
          </div>
        </div>

        {isError ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {getApiErrorMessage(error, "Nao foi possivel carregar os audios.")}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex min-h-[220px] items-center justify-center text-sm text-muted-foreground">
            Carregando audios...
          </div>
        ) : filteredAudios.length === 0 ? (
          <button
            className="flex min-h-[220px] w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-secondary/20 p-6 text-center text-muted-foreground transition-smooth hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
            onClick={() => fileInputRef.current?.click()}
          >
            <Plus className="h-7 w-7" />
            <span className="text-sm font-medium">
              {search ? "Nenhum audio encontrado" : "Adicionar primeiro audio"}
            </span>
            <span className="max-w-sm text-xs">
              Use arquivos MP3, OGG, OPUS, M4A, WAV ou WEBM. Depois eles aparecem no chat e no builder de fluxo.
            </span>
          </button>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredAudios.map((audio) => (
              <Card key={audio.id} className="p-4 border-border/60 transition-smooth hover:shadow-md">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Mic className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-medium">
                        {audio.originalName ?? `Audio #${audio.id}`}
                      </h4>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {audio.sizeLabel || audio.mimeType || "Audio"}
                        </span>
                        {audio.metaMediaId ? (
                          <span className="flex items-center gap-1 text-success">
                            <CheckCircle2 className="h-3 w-3" />
                            Meta ID
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <AudioLibraryPlayer asset={audio} />
                    <div className="rounded-md bg-secondary/45 px-2 py-1 text-[11px] text-muted-foreground">
                      Use no fluxo como Asset #{audio.id}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
