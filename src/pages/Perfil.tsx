import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { Bell, Camera, Globe, Loader2, LogOut, Moon, Trash2 } from "lucide-react";
import { queryClient } from "@/App";
import { clearAuthSession, getAuthToken, getStoredAuthUser, subscribeToAuthUserChanges, updateStoredAuthUser } from "@/lib/auth";
import { logout } from "@/services/auth";
import { toast } from "@/hooks/use-toast";
import { getWhatsAppConnectionErrorMessage, useWhatsAppConnection } from "@/hooks/use-whatsapp-connection";
import { getApiErrorMessage } from "@/lib/api/client";
import { WhatsAppConnectionCard } from "@/components/profile/WhatsAppConnectionCard";
import { resolveMediaUrl } from "@/lib/media-url";
import { updateProfile } from "@/services/profile";

const AVATAR_HARD_LIMIT_BYTES = 2 * 1024 * 1024;
const AVATAR_TARGET_BYTES = Math.floor(1.8 * 1024 * 1024);
const AVATAR_MAX_DIMENSION = 1024;

async function loadImageFromFile(file: File) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Nao foi possivel ler a imagem selecionada."));
      element.src = objectUrl;
    });

    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Nao foi possivel preparar a imagem para upload."));
        return;
      }

      resolve(blob);
    }, type, quality);
  });
}

async function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string" || reader.result.length === 0) {
        reject(new Error("Nao foi possivel preparar a foto selecionada."));
        return;
      }

      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(new Error("Nao foi possivel preparar a foto selecionada."));
    };

    reader.readAsDataURL(file);
  });
}

async function optimizeAvatarForUpload(file: File) {
  const image = await loadImageFromFile(file);
  const largestSide = Math.max(image.naturalWidth, image.naturalHeight);
  const requiresResize = largestSide > AVATAR_MAX_DIMENSION;
  const requiresCompression = file.size > AVATAR_TARGET_BYTES;

  if (!requiresResize && !requiresCompression) {
    return file;
  }

  const scale = requiresResize ? AVATAR_MAX_DIMENSION / largestSide : 1;
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Nao foi possivel preparar a foto selecionada.");
  }

  context.drawImage(image, 0, 0, width, height);

  const candidates = [
    { type: "image/webp", quality: 0.9 },
    { type: "image/webp", quality: 0.82 },
    { type: "image/jpeg", quality: 0.86 },
    { type: "image/jpeg", quality: 0.76 },
  ];

  let bestBlob: Blob | null = null;

  for (const candidate of candidates) {
    const blob = await canvasToBlob(canvas, candidate.type, candidate.quality);

    if (!bestBlob || blob.size < bestBlob.size) {
      bestBlob = blob;
    }

    if (blob.size <= AVATAR_TARGET_BYTES) {
      bestBlob = blob;
      break;
    }
  }

  if (!bestBlob) {
    throw new Error("Nao foi possivel preparar a foto selecionada.");
  }

  return new File([bestBlob], `${file.name.replace(/\.[^.]+$/, "") || "avatar"}.${bestBlob.type === "image/png" ? "png" : bestBlob.type === "image/jpeg" ? "jpg" : "webp"}`, {
    type: bestBlob.type,
    lastModified: Date.now(),
  });
}

function getProfileSaveErrorMessage(error: unknown) {
  const message = getApiErrorMessage(error, "Nao foi possivel salvar suas alteracoes agora.");

  if (message.toLowerCase().includes("avatar failed to upload")) {
    return "A foto escolhida ultrapassou o limite do servidor. Tente uma imagem menor ou aguarde a compactacao automatica.";
  }

  return message;
}

export default function Perfil() {
  const nav = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [user, setUser] = useState(() => getStoredAuthUser());
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [companyName, setCompanyName] = useState(user?.companyName ?? "");
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isPreparingAvatar, setIsPreparingAvatar] = useState(false);

  useEffect(() => subscribeToAuthUserChanges(setUser), []);

  useEffect(() => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setCompanyName(user?.companyName ?? "");
  }, [user?.companyName, user?.email, user?.name]);

  useEffect(() => () => {
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }
  }, [avatarPreviewUrl]);

  const currentAvatarUrl = avatarPreviewUrl ?? (removeAvatar ? null : resolveMediaUrl(user?.avatarUrl ?? null));
  const initials = user?.name
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "NX";
  const {
    connection,
    connectionQuery,
    startConnection,
    retryConnection,
    startWebConnection,
    testConnection,
    syncTemplates,
    disconnectConnection,
    disconnectWebConnection,
    uiError,
    isWebQrModalOpen,
    setIsWebQrModalOpen,
    webQrStatus,
    isLoadingConnection,
    isConnecting,
    isStartingWeb,
    isTesting,
    isSyncingTemplates,
    isDisconnecting,
    isDisconnectingWeb,
    isLoadingWebQr,
  } = useWhatsAppConnection();

  const queryErrorMessage = useMemo(
    () => connectionQuery.isError ? getApiErrorMessage(connectionQuery.error, "Nao foi possivel carregar o status do WhatsApp.") : null,
    [connectionQuery.error, connectionQuery.isError],
  );

  const handleAvatarSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      return;
    }

    setIsPreparingAvatar(true);

    try {
      const optimizedFile = await optimizeAvatarForUpload(file);

      if (optimizedFile.size > AVATAR_HARD_LIMIT_BYTES) {
        throw new Error("A imagem ainda ficou acima do limite de 2MB. Escolha uma foto menor.");
      }

      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }

      setAvatarDataUrl(await readFileAsDataUrl(optimizedFile));
      setRemoveAvatar(false);
      setAvatarPreviewUrl(URL.createObjectURL(optimizedFile));

      if (optimizedFile.size < file.size) {
        toast({
          title: "Foto ajustada para upload",
          description: "Otimizamos automaticamente a imagem para ela caber melhor no perfil.",
        });
      }
    } catch (error) {
      toast({
        title: "Nao foi possivel usar essa foto",
        description: error instanceof Error ? error.message : "Escolha uma imagem menor e tente novamente.",
        variant: "destructive",
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } finally {
      setIsPreparingAvatar(false);
    }
  };

  const handleRemoveAvatar = () => {
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }

    setAvatarPreviewUrl(null);
    setAvatarDataUrl(null);
    setRemoveAvatar(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async () => {
    if (!user) {
      return;
    }

    setIsSavingProfile(true);

    try {
      const response = await updateProfile({
        name: name.trim(),
        email: email.trim(),
        company_name: companyName.trim(),
        ...(removeAvatar ? { remove_avatar: true } : {}),
        ...(avatarDataUrl ? { avatar_data_url: avatarDataUrl } : {}),
      });

      updateStoredAuthUser({
        ...response.data,
        tokenExpiresAt: response.data.tokenExpiresAt ?? user.tokenExpiresAt ?? null,
      });
      const token = getAuthToken();
      if (token) {
        queryClient.setQueryData(["auth", "me", token], {
          ...response.data,
          tokenExpiresAt: response.data.tokenExpiresAt ?? user.tokenExpiresAt ?? null,
        });
      }

      setAvatarDataUrl(null);
      setRemoveAvatar(false);
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
      setAvatarPreviewUrl(null);

      toast({
        title: "Perfil atualizado",
        description: response.message ?? "Sua foto e seus dados foram salvos com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Falha ao salvar perfil",
        description: getProfileSaveErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleStartConnection = async () => {
    try {
      const result = await startConnection();
      toast({
        title: "WhatsApp conectado",
        description: "A autorizacao foi concluida e a conexao do usuario foi salva no backend.",
      });

      if (result?.testMessage) {
        toast({
          title: result.testMessage.status === "ok" ? "Mensagem teste enviada" : "Mensagem teste nao enviada",
          description: result.testMessage.message,
          variant: result.testMessage.status === "ok" ? "default" : "destructive",
        });
      }
    } catch (error) {
      const connectionError = getWhatsAppConnectionErrorMessage(error);
      toast({
        title: connectionError.title,
        description: connectionError.message,
        variant: "destructive",
      });
    }
  };

  const handleRetryConnection = async () => {
    try {
      const result = await retryConnection();
      toast({
        title: "Nova tentativa concluida",
        description: "O fluxo de onboarding foi reexecutado com sucesso.",
      });

      if (result?.testMessage) {
        toast({
          title: result.testMessage.status === "ok" ? "Mensagem teste enviada" : "Mensagem teste nao enviada",
          description: result.testMessage.message,
          variant: result.testMessage.status === "ok" ? "default" : "destructive",
        });
      }
    } catch (error) {
      const connectionError = getWhatsAppConnectionErrorMessage(error);
      toast({
        title: connectionError.title,
        description: connectionError.message,
        variant: "destructive",
      });
    }
  };

  const handleTestConnection = async () => {
    try {
      const result = await testConnection();
      toast({
        title: "Conexao verificada",
        description: result.message,
      });
    } catch (error) {
      toast({
        title: "Falha ao testar conexao",
        description: getApiErrorMessage(error, "Nao foi possivel testar a integracao agora."),
        variant: "destructive",
      });
    }
  };

  const handleSyncTemplates = async () => {
    try {
      const result = await syncTemplates();
      toast({
        title: "Templates sincronizados",
        description: result.message,
      });
    } catch (error) {
      toast({
        title: "Falha ao sincronizar templates",
        description: getApiErrorMessage(error, "Nao foi possivel sincronizar os templates agora."),
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectConnection();
      toast({
        title: "Integracao removida",
        description: "A conexao foi removida do usuario sem executar nenhuma acao destrutiva na conta Meta.",
      });
    } catch (error) {
      toast({
        title: "Falha ao desconectar",
        description: getApiErrorMessage(error, "Nao foi possivel remover a integracao agora."),
        variant: "destructive",
      });
    }
  };

  const handleStartWebConnection = async () => {
    try {
      await startWebConnection();
      toast({
        title: "QR Code iniciado",
        description: "Escaneie com o celular para concluir a conexao do WhatsApp Web.",
      });
    } catch (error) {
      toast({
        title: "Falha ao iniciar QR Code",
        description: getApiErrorMessage(error, "Nao foi possivel iniciar a sessao do WhatsApp Web."),
        variant: "destructive",
      });
    }
  };

  const handleDisconnectWeb = async () => {
    try {
      await disconnectWebConnection();
      toast({
        title: "WhatsApp Web desconectado",
        description: "A sessao conectada por QR Code foi encerrada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Falha ao desconectar QR Code",
        description: getApiErrorMessage(error, "Nao foi possivel desconectar a sessao do WhatsApp Web."),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="p-6 border-border/60 bg-gradient-to-br from-card via-card to-primary/5">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="relative">
            <Avatar className="h-24 w-24 ring-4 ring-background shadow-elegant">
              {currentAvatarUrl ? <AvatarImage src={currentAvatarUrl} alt={user?.name ?? "Conta Nexo"} className="object-cover" /> : null}
              <AvatarFallback className="gradient-primary text-primary-foreground text-2xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-card border-2 border-background shadow-md flex items-center justify-center hover:scale-110 transition-smooth"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/jpg"
              className="hidden"
            onChange={(event) => {
              void handleAvatarSelection(event);
            }}
            />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-semibold">{user?.name ?? "Conta Nexo"}</h2>
            <p className="text-sm text-muted-foreground mb-2">{user?.email ?? "Sem e-mail vinculado"}</p>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              {user?.role === "admin" ? "Administrador" : "Usuario"}
            </span>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isPreparingAvatar}>
                {isPreparingAvatar ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                {isPreparingAvatar ? "Preparando..." : "Trocar foto"}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={handleRemoveAvatar} disabled={isPreparingAvatar || (!user?.avatarUrl && !avatarPreviewUrl)}>
                <Trash2 className="mr-1.5 h-4 w-4" />
                Remover foto
              </Button>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await logout();
              } catch {
                // noop
              } finally {
                queryClient.clear();
                clearAuthSession();
                nav("/");
              }
            }}
            className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </Card>

      <Card className="p-6 border-border/60">
        <h3 className="font-semibold mb-5 pb-5 border-b border-border/60">Informacoes pessoais</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Nome completo</Label><Input value={name} onChange={(event) => setName(event.target.value)} /></div>
          <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></div>
          <div className="space-y-2"><Label>Empresa</Label><Input value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="Empresa ou negocio" /></div>
          <div className="space-y-2"><Label>Cargo</Label><Input value={user?.role === "admin" ? "Administrador do sistema" : "Usuario operacional"} readOnly /></div>
        </div>
        <div className="flex justify-end mt-5">
          <Button className="gradient-primary text-primary-foreground" onClick={() => void handleSaveProfile()} disabled={isSavingProfile || isPreparingAvatar}>
            {isSavingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Salvar alteracoes
          </Button>
        </div>
      </Card>

      <WhatsAppConnectionCard
        connection={connection}
        isLoading={isLoadingConnection}
        isConnecting={isConnecting}
        isStartingWeb={isStartingWeb}
        isTesting={isTesting}
        isSyncingTemplates={isSyncingTemplates}
        isDisconnecting={isDisconnecting}
        isDisconnectingWeb={isDisconnectingWeb}
        isWebQrModalOpen={isWebQrModalOpen}
        onWebQrModalOpenChange={setIsWebQrModalOpen}
        webQrStatus={webQrStatus}
        isLoadingWebQr={isLoadingWebQr}
        error={uiError}
        queryErrorMessage={queryErrorMessage}
        onConnect={() => {
          void handleStartConnection();
        }}
        onConnectWeb={() => {
          void handleStartWebConnection();
        }}
        onRetry={() => {
          void handleRetryConnection();
        }}
        onTest={() => {
          void handleTestConnection();
        }}
        onSyncTemplates={() => {
          void handleSyncTemplates();
        }}
        onDisconnect={() => {
          void handleDisconnect();
        }}
        onDisconnectWeb={() => {
          void handleDisconnectWeb();
        }}
      />

      <Card className="p-6 border-border/60">
        <h3 className="font-semibold mb-5 pb-5 border-b border-border/60">Preferencias</h3>
        <div className="space-y-4">
          {[
            { icon: Globe, title: "Idioma", desc: "Portugues (Brasil)" },
            { icon: Moon, title: "Tema escuro", desc: "Reduz fadiga visual a noite", toggle: true },
            { icon: Bell, title: "Notificacoes por e-mail", desc: "Resumos e alertas importantes", toggle: true, on: true },
          ].map((p) => (
            <div key={p.title} className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <p.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{p.title}</p>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </div>
              {p.toggle ? <Switch defaultChecked={p.on} /> : <Button variant="ghost" size="sm">Alterar</Button>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
