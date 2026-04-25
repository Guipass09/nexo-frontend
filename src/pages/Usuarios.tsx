import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { getApiErrorMessage } from "@/lib/api/client";
import {
  USER_PERMISSION_LABELS,
  getDefaultPermissionsForRole,
  getStoredAuthUser,
} from "@/lib/auth";
import { useCreateUser, useDeleteUser, useUpdateUser, useUsers } from "@/hooks/use-app-data";
import { toast } from "@/hooks/use-toast";
import {
  getStoredUserWhatsAppAdminOverrides,
  removeUserWhatsAppAdminOverride,
  saveUserWhatsAppAdminOverride,
  type UserWhatsAppAdminOverride,
} from "@/lib/user-whatsapp-admin";
import type { ManagedUser } from "@/types/domain";
import { Loader2, Lock, Plus, Search, ShieldCheck, Trash2, UserCog, UserRound } from "lucide-react";

type UserRole = "admin" | "operator";
type UserStatus = "active" | "blocked";

interface UserDraft {
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  permissions: Record<string, boolean>;
  password: string;
  passwordConfirmation: string;
}

interface WhatsAppAdminDraft {
  connected: boolean;
  phone: string;
}

const EMPTY_NEW_USER_DRAFT: UserDraft = {
  name: "",
  email: "",
  role: "operator",
  status: "active",
  permissions: getDefaultPermissionsForRole("operator"),
  password: "",
  passwordConfirmation: "",
};

function createDraftFromUser(user: ManagedUser): UserDraft {
  return {
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    permissions: {
      ...getDefaultPermissionsForRole(user.role),
      ...user.permissions,
    },
    password: "",
    passwordConfirmation: "",
  };
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);

  if (!parts.length) {
    return "US";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Ainda sem registro";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function roleLabel(role: UserRole) {
  return role === "admin" ? "Administrador" : "Usuario";
}

function statusLabel(status: UserStatus) {
  return status === "active" ? "Ativo" : "Bloqueado";
}

function statusBadgeClass(status: UserStatus) {
  return status === "active"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-rose-200 bg-rose-50 text-rose-700";
}

function readManagedUserField<T>(user: ManagedUser, ...keys: string[]) {
  const record = user as unknown as Record<string, unknown>;

  for (const key of keys) {
    if (key in record) {
      return record[key] as T;
    }
  }

  return undefined;
}

function getWhatsAppConnectionState(user: ManagedUser) {
  const connected = readManagedUserField<boolean | null>(
    user,
    "whatsAppConnected",
    "whatsappConnected",
    "whatsapp_connected",
  );
  const phone = readManagedUserField<string | null>(
    user,
    "whatsAppPhone",
    "whatsappPhone",
    "whatsapp_phone",
  );
  const connectedAt = readManagedUserField<string | null>(
    user,
    "whatsAppConnectedAt",
    "whatsappConnectedAt",
    "whatsapp_connected_at",
  );
  const lastMessageAt = readManagedUserField<string | null>(
    user,
    "lastWhatsAppMessageAt",
    "lastWhatsappMessageAt",
    "last_whatsapp_message_at",
  );

  return {
    connected: Boolean(connected),
    phone: phone ?? null,
    connectedAt: connectedAt ?? null,
    lastMessageAt: lastMessageAt ?? null,
  };
}

function getEffectiveWhatsAppConnectionState(
  user: ManagedUser,
  override?: UserWhatsAppAdminOverride,
) {
  const backendState = getWhatsAppConnectionState(user);

  if (!override) {
    return {
      ...backendState,
      source: backendState.connected ? "backend" : "none",
    };
  }

  return {
    connected: override.connected,
    phone: override.phone,
    connectedAt: override.connectedAt,
    lastMessageAt: override.lastMessageAt,
    source: "admin_manual" as const,
  };
}

function getWhatsAppStatusLabel(user: ManagedUser, override?: UserWhatsAppAdminOverride) {
  return getEffectiveWhatsAppConnectionState(user, override).connected ? "Conectado" : "Nao conectado";
}

function getWhatsAppStatusBadgeClass(user: ManagedUser, override?: UserWhatsAppAdminOverride) {
  return getEffectiveWhatsAppConnectionState(user, override).connected
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-slate-200 bg-slate-50 text-slate-700";
}

export default function Usuarios() {
  const sessionUser = getStoredAuthUser();
  const usersQuery = useUsers(sessionUser?.role === "admin");
  const createUserMutation = useCreateUser();
  const deleteUserMutation = useDeleteUser();
  const updateUserMutation = useUpdateUser();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | UserStatus>("all");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editorDraft, setEditorDraft] = useState<UserDraft | null>(null);
  const [whatsAppAdminDraft, setWhatsAppAdminDraft] = useState<WhatsAppAdminDraft>({ connected: false, phone: "" });
  const [newUserDraft, setNewUserDraft] = useState<UserDraft>(EMPTY_NEW_USER_DRAFT);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [whatsAppOverrides, setWhatsAppOverrides] = useState<Record<string, UserWhatsAppAdminOverride>>(
    () => getStoredUserWhatsAppAdminOverrides(),
  );

  const users = usersQuery.data ?? [];

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return users.filter((user) => {
      if (statusFilter !== "all" && user.status !== statusFilter) {
        return false;
      }

      if (roleFilter !== "all" && user.role !== roleFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [user.name, user.email].some((field) => field.toLowerCase().includes(normalizedSearch));
    });
  }, [roleFilter, search, statusFilter, users]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? filteredUsers[0] ?? null,
    [filteredUsers, selectedUserId, users],
  );

  useEffect(() => {
    if (!selectedUser && filteredUsers[0]) {
      setSelectedUserId(filteredUsers[0].id);
      return;
    }

    if (selectedUser && selectedUser.id !== selectedUserId) {
      setSelectedUserId(selectedUser.id);
    }
  }, [filteredUsers, selectedUser, selectedUserId]);

  useEffect(() => {
    if (selectedUser) {
      setEditorDraft(createDraftFromUser(selectedUser));
    } else {
      setEditorDraft(null);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (!selectedUser) {
      setWhatsAppAdminDraft({ connected: false, phone: "" });
      return;
    }

    const currentWhatsApp = getEffectiveWhatsAppConnectionState(
      selectedUser,
      whatsAppOverrides[selectedUser.id],
    );

    setWhatsAppAdminDraft({
      connected: currentWhatsApp.connected,
      phone: currentWhatsApp.phone ?? "",
    });
  }, [selectedUser, whatsAppOverrides]);

  const isSavingUser = updateUserMutation.isPending;
  const isCreatingUser = createUserMutation.isPending;
  const isDeletingUser = deleteUserMutation.isPending;
  const hasSelection = Boolean(selectedUser && editorDraft);
  const isEditingSelf = sessionUser && selectedUser && Number(sessionUser.id) === Number(selectedUser.id);
  const selectedUserWhatsApp = selectedUser
    ? getEffectiveWhatsAppConnectionState(selectedUser, whatsAppOverrides[selectedUser.id])
    : null;
  const hasUnsavedChanges = Boolean(
    selectedUser && editorDraft && JSON.stringify({
      ...editorDraft,
      password: "",
      passwordConfirmation: "",
    }) !== JSON.stringify({
      ...createDraftFromUser(selectedUser),
      password: "",
      passwordConfirmation: "",
    }),
  );

  const handlePermissionToggle = (key: string, checked: boolean) => {
    setEditorDraft((current) => current ? {
      ...current,
      permissions: {
        ...current.permissions,
        [key]: checked,
      },
    } : current);
  };

  const handleCreatePermissionToggle = (key: string, checked: boolean) => {
    setNewUserDraft((current) => ({
      ...current,
      permissions: {
        ...current.permissions,
        [key]: checked,
      },
    }));
  };

  const saveUser = async () => {
    if (!selectedUser || !editorDraft) {
      return;
    }

    if (editorDraft.password && editorDraft.password !== editorDraft.passwordConfirmation) {
      toast({
        title: "Senha inconsistente",
        description: "A confirmacao de senha precisa ser igual a nova senha.",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedUser = await updateUserMutation.mutateAsync({
        userId: selectedUser.id,
        payload: {
          name: editorDraft.name,
          email: editorDraft.email,
          role: editorDraft.role,
          status: editorDraft.status,
          permissions: editorDraft.permissions,
          ...(editorDraft.password ? {
            password: editorDraft.password,
            password_confirmation: editorDraft.passwordConfirmation,
          } : {}),
        },
      });

      setSelectedUserId(updatedUser.id);
      toast({
        title: "Usuario atualizado",
        description: "Permissoes, dados e status foram salvos com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Falha ao salvar usuario",
        description: getApiErrorMessage(error, "Nao foi possivel atualizar este usuario agora."),
        variant: "destructive",
      });
    }
  };

  const createNewUser = async () => {
    if (newUserDraft.password !== newUserDraft.passwordConfirmation) {
      toast({
        title: "Senha inconsistente",
        description: "A confirmacao de senha precisa ser igual a senha criada.",
        variant: "destructive",
      });
      return;
    }

    try {
      const createdUser = await createUserMutation.mutateAsync({
        name: newUserDraft.name,
        email: newUserDraft.email,
        role: newUserDraft.role,
        status: newUserDraft.status,
        permissions: newUserDraft.permissions,
        password: newUserDraft.password,
        password_confirmation: newUserDraft.passwordConfirmation,
      });

      setIsCreateDialogOpen(false);
      setNewUserDraft(EMPTY_NEW_USER_DRAFT);
      setSelectedUserId(createdUser.id);
      toast({
        title: "Usuario criado",
        description: "A nova conta ja pode entrar com o proprio e-mail e senha.",
      });
    } catch (error) {
      toast({
        title: "Falha ao criar usuario",
        description: getApiErrorMessage(error, "Nao foi possivel criar a conta agora."),
        variant: "destructive",
      });
    }
  };

  const deleteSelectedUser = async () => {
    if (!selectedUser) {
      return;
    }

    try {
      await deleteUserMutation.mutateAsync(selectedUser.id);

      if (whatsAppOverrides[selectedUser.id]) {
        setWhatsAppOverrides(removeUserWhatsAppAdminOverride(selectedUser.id));
      }

      setIsDeleteDialogOpen(false);
      setSelectedUserId(null);
      toast({
        title: "Usuario excluido",
        description: "A conta e os dados vinculados a ela foram removidos permanentemente.",
      });
    } catch (error) {
      toast({
        title: "Falha ao excluir usuario",
        description: getApiErrorMessage(error, "Nao foi possivel excluir este usuario agora."),
        variant: "destructive",
      });
    }
  };

  const activateUserWhatsAppManually = () => {
    if (!selectedUser) {
      return;
    }

    const override: UserWhatsAppAdminOverride = {
      connected: true,
      phone: whatsAppAdminDraft.phone.trim() || null,
      connectedAt: selectedUserWhatsApp?.connectedAt ?? new Date().toISOString(),
      lastMessageAt: selectedUserWhatsApp?.lastMessageAt ?? null,
      updatedAt: new Date().toISOString(),
    };

    setWhatsAppOverrides(saveUserWhatsAppAdminOverride(selectedUser.id, override));
    toast({
      title: "WhatsApp liberado pelo admin",
      description: "Este usuario agora aparece como conectado no seu painel administrativo.",
    });
  };

  const deactivateUserWhatsAppManually = () => {
    if (!selectedUser) {
      return;
    }

    const override: UserWhatsAppAdminOverride = {
      connected: false,
      phone: whatsAppAdminDraft.phone.trim() || null,
      connectedAt: null,
      lastMessageAt: null,
      updatedAt: new Date().toISOString(),
    };

    setWhatsAppOverrides(saveUserWhatsAppAdminOverride(selectedUser.id, override));
    toast({
      title: "WhatsApp marcado como desconectado",
      description: "O painel admin agora mostra este usuario como nao conectado.",
    });
  };

  const restoreBackendWhatsAppState = () => {
    if (!selectedUser) {
      return;
    }

    setWhatsAppOverrides(removeUserWhatsAppAdminOverride(selectedUser.id));
    toast({
      title: "Estado automatico restaurado",
      description: "O painel voltou a usar apenas o status vindo do backend para este usuario.",
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            O admin controla quem entra, o que cada perfil acessa e quando uma conta deve ser bloqueada.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Novo usuario
        </Button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="border-border/60">
          <div className="border-b border-border/60 p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nome ou e-mail"
                className="pl-9"
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | UserStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="blocked">Bloqueados</SelectItem>
                </SelectContent>
              </Select>

              <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as "all" | UserRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os perfis</SelectItem>
                  <SelectItem value="admin">Administradores</SelectItem>
                  <SelectItem value="operator">Usuarios</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <ScrollArea className="h-[680px]">
            <div className="space-y-2 p-3">
              {usersQuery.isLoading ? (
                <div className="rounded-xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
                  Carregando usuarios...
                </div>
              ) : filteredUsers.length ? filteredUsers.map((user) => {
                const isSelected = selectedUser?.id === user.id;
                const whatsappOverride = whatsAppOverrides[user.id];
                const whatsapp = getEffectiveWhatsAppConnectionState(user, whatsappOverride);
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setSelectedUserId(user.id)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? "border-primary/40 bg-primary/5 shadow-sm"
                        : "border-border/70 bg-background hover:border-primary/20 hover:bg-secondary/20"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {getInitials(user.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold">{user.name}</p>
                          <Badge variant="outline" className={statusBadgeClass(user.status)}>
                            {statusLabel(user.status)}
                          </Badge>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                        <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                          <Badge variant="secondary" className="rounded-md">
                            {roleLabel(user.role)}
                          </Badge>
                          <Badge variant="outline" className={getWhatsAppStatusBadgeClass(user, whatsappOverride)}>
                            WhatsApp {getWhatsAppStatusLabel(user, whatsappOverride)}
                          </Badge>
                          <span>Ultimo uso: {formatDateTime(user.lastActiveAt)}</span>
                        </div>
                        {whatsapp.connected && whatsapp.phone ? (
                          <p className="mt-2 text-[11px] text-muted-foreground">
                            Numero vinculado: {whatsapp.phone}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              }) : (
                <div className="rounded-xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
                  Nenhum usuario encontrado com os filtros atuais.
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>

        <Card className="border-border/60">
          {!hasSelection ? (
            <div className="flex h-full min-h-[680px] items-center justify-center p-10 text-center">
              <div className="max-w-sm space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <UserCog className="h-7 w-7" />
                </div>
                <h2 className="text-lg font-semibold">Selecione um usuario</h2>
                <p className="text-sm text-muted-foreground">
                  Abra um perfil para editar permissoes, trocar dados, bloquear acesso ou redefinir senha.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid h-full min-h-[680px] grid-rows-[auto_auto_minmax(0,1fr)_auto]">
              <div className="border-b border-border/60 p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary">
                      {getInitials(selectedUser.name)}
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold">{selectedUser.name}</h2>
                        <Badge variant="secondary" className="rounded-md">
                          {roleLabel(selectedUser.role)}
                        </Badge>
                        <Badge variant="outline" className={statusBadgeClass(selectedUser.status)}>
                          {statusLabel(selectedUser.status)}
                        </Badge>
                        <Badge variant="outline" className={getWhatsAppStatusBadgeClass(selectedUser, whatsAppOverrides[selectedUser.id])}>
                          WhatsApp {getWhatsAppStatusLabel(selectedUser, whatsAppOverrides[selectedUser.id])}
                        </Badge>
                        {selectedUserWhatsApp?.source === "admin_manual" ? (
                          <Badge variant="outline" className="rounded-md border-primary/20 bg-primary/5 text-primary">
                            Ajustado pelo admin
                          </Badge>
                        ) : null}
                        {isEditingSelf ? (
                          <Badge variant="outline" className="rounded-md border-primary/20 bg-primary/5 text-primary">
                            Sua conta
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span>Criado em {formatDateTime(selectedUser.createdAt)}</span>
                        <span>Ultima atividade {formatDateTime(selectedUser.lastActiveAt)}</span>
                        <span>
                          WhatsApp {selectedUserWhatsApp?.connected
                            ? `vinculado em ${formatDateTime(selectedUserWhatsApp.connectedAt)}`
                            : "ainda nao vinculado"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex w-full flex-col gap-3 xl:max-w-sm xl:items-end">
                    <div className="rounded-xl border border-border/70 bg-secondary/20 px-4 py-3 text-sm text-muted-foreground xl:max-w-xs">
                      Cada conta entra no proprio painel. O usuario comum usa a mesma base visual, mas sem a area de usuarios.
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => setIsDeleteDialogOpen(true)}
                      disabled={!hasSelection || isEditingSelf || isDeletingUser || isSavingUser}
                      className="w-full xl:w-auto"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir permanentemente
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 border-b border-border/60 p-5 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="user-name">Nome</Label>
                  <Input
                    id="user-name"
                    value={editorDraft.name}
                    onChange={(event) => setEditorDraft((current) => current ? { ...current, name: event.target.value } : current)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-email">E-mail</Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={editorDraft.email}
                    onChange={(event) => setEditorDraft((current) => current ? { ...current, email: event.target.value } : current)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Perfil</Label>
                  <Select
                    value={editorDraft.role}
                    onValueChange={(value) => setEditorDraft((current) => current ? {
                      ...current,
                      role: value as UserRole,
                      permissions: getDefaultPermissionsForRole(value),
                    } : current)}
                    disabled={isEditingSelf}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="operator">Usuario</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={editorDraft.status}
                    onValueChange={(value) => setEditorDraft((current) => current ? { ...current, status: value as UserStatus } : current)}
                    disabled={isEditingSelf}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="blocked">Bloqueado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid min-h-0 gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="min-h-0 rounded-2xl border border-border/70">
                  <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
                    <div>
                      <h3 className="font-semibold">Permissoes do painel</h3>
                      <p className="text-sm text-muted-foreground">
                        Defina o que esse perfil pode ver e operar no sistema.
                      </p>
                    </div>
                    {editorDraft.role === "admin" ? (
                      <Badge variant="outline" className="rounded-md border-primary/20 bg-primary/5 text-primary">
                        Acesso total
                      </Badge>
                    ) : null}
                  </div>
                  <ScrollArea className="h-[360px] xl:h-full">
                    <div className="grid gap-3 p-5 md:grid-cols-2">
                      {Object.entries(USER_PERMISSION_LABELS).map(([key, label]) => {
                        const checked = editorDraft.permissions[key];
                        const isLocked = editorDraft.role === "admin" || (isEditingSelf && key === "users");

                        return (
                          <div key={key} className="flex items-center justify-between rounded-xl border border-border/70 bg-background px-4 py-3">
                            <div>
                              <p className="text-sm font-medium">{label}</p>
                              <p className="text-xs text-muted-foreground">
                                {checked ? "Liberado no menu e na rota." : "Oculto e bloqueado para este perfil."}
                              </p>
                            </div>
                            <Switch
                              checked={checked}
                              onCheckedChange={(value) => handlePermissionToggle(key, value)}
                              disabled={isLocked}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-border/70 p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <UserRound className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold">Ativacao manual do WhatsApp</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-xl border border-border/70 bg-secondary/20 px-4 py-3">
                        <div>
                          <p className="text-sm font-medium">Usuario liberado no canal</p>
                          <p className="text-xs text-muted-foreground">
                            O admin pode marcar manualmente que este usuario ja esta apto a operar pelo WhatsApp.
                          </p>
                        </div>
                        <Switch
                          checked={whatsAppAdminDraft.connected}
                          onCheckedChange={(value) => setWhatsAppAdminDraft((current) => ({ ...current, connected: value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="user-whatsapp-phone">Numero confirmado</Label>
                        <Input
                          id="user-whatsapp-phone"
                          placeholder="5511999999999"
                          value={whatsAppAdminDraft.phone}
                          onChange={(event) => setWhatsAppAdminDraft((current) => ({ ...current, phone: event.target.value }))}
                        />
                      </div>

                      <div className="rounded-xl border border-dashed border-border/70 px-4 py-3 text-xs text-muted-foreground">
                        {selectedUserWhatsApp?.source === "admin_manual"
                          ? "Este status esta sendo controlado manualmente pelo admin neste navegador."
                          : "Sem override manual. O painel esta usando apenas o status vindo do backend."}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            if (whatsAppAdminDraft.connected) {
                              activateUserWhatsAppManually();
                            } else {
                              deactivateUserWhatsAppManually();
                            }
                          }}
                        >
                          {whatsAppAdminDraft.connected ? "Ativar usuario" : "Marcar como nao conectado"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={restoreBackendWhatsAppState}
                          disabled={!whatsAppOverrides[selectedUser.id]}
                        >
                          Voltar ao automatico
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/70 p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold">Trocar senha</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="new-password">Nova senha</Label>
                        <Input
                          id="new-password"
                          type="password"
                          placeholder="Preencha apenas se quiser trocar"
                          value={editorDraft.password}
                          onChange={(event) => setEditorDraft((current) => current ? { ...current, password: event.target.value } : current)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirmar senha</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={editorDraft.passwordConfirmation}
                          onChange={(event) => setEditorDraft((current) => current ? { ...current, passwordConfirmation: event.target.value } : current)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/70 p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold">Resumo operacional</h3>
                    </div>
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <p>
                        Perfil atual: <span className="font-medium text-foreground">{roleLabel(editorDraft.role)}</span>
                      </p>
                      <p>
                        Status da conta: <span className="font-medium text-foreground">{statusLabel(editorDraft.status)}</span>
                      </p>
                      <p>
                        Modulos ativos: <span className="font-medium text-foreground">
                          {Object.values(editorDraft.permissions).filter(Boolean).length}
                        </span>
                      </p>
                      <Separator />
                      <p>
                        WhatsApp: <span className="font-medium text-foreground">{getWhatsAppStatusLabel(selectedUser)}</span>
                      </p>
                      <p>
                        Numero vinculado: <span className="font-medium text-foreground">{selectedUserWhatsApp?.phone ?? "Ainda sem numero confirmado"}</span>
                      </p>
                      <p>
                        Conectado em: <span className="font-medium text-foreground">{formatDateTime(selectedUserWhatsApp?.connectedAt ?? null)}</span>
                      </p>
                      <p>
                        Ultima mensagem recebida: <span className="font-medium text-foreground">{formatDateTime(selectedUserWhatsApp?.lastMessageAt ?? null)}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-border/60 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  {hasUnsavedChanges ? "Existem alteracoes pendentes para este usuario." : "Sem alteracoes pendentes."}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => selectedUser && setEditorDraft(createDraftFromUser(selectedUser))}
                    disabled={!hasSelection || !hasUnsavedChanges || isSavingUser}
                  >
                    Descartar
                  </Button>
                  <Button onClick={saveUser} disabled={!hasSelection || isSavingUser}>
                    {isSavingUser ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : "Salvar usuario"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Novo usuario</DialogTitle>
            <DialogDescription>
              Crie uma conta operacional com login proprio. O token sera individual desta pessoa.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Nome</Label>
                <Input
                  id="create-name"
                  value={newUserDraft.name}
                  onChange={(event) => setNewUserDraft((current) => ({ ...current, name: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-email">E-mail</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={newUserDraft.email}
                  onChange={(event) => setNewUserDraft((current) => ({ ...current, email: event.target.value }))}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Perfil</Label>
                  <Select
                    value={newUserDraft.role}
                    onValueChange={(value) => setNewUserDraft((current) => ({
                      ...current,
                      role: value as UserRole,
                      permissions: getDefaultPermissionsForRole(value),
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operator">Usuario</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status inicial</Label>
                  <Select
                    value={newUserDraft.status}
                    onValueChange={(value) => setNewUserDraft((current) => ({ ...current, status: value as UserStatus }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="blocked">Bloqueado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="create-password">Senha</Label>
                  <Input
                    id="create-password"
                    type="password"
                    value={newUserDraft.password}
                    onChange={(event) => setNewUserDraft((current) => ({ ...current, password: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-password-confirmation">Confirmar senha</Label>
                  <Input
                    id="create-password-confirmation"
                    type="password"
                    value={newUserDraft.passwordConfirmation}
                    onChange={(event) => setNewUserDraft((current) => ({ ...current, passwordConfirmation: event.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70">
              <div className="border-b border-border/60 px-5 py-4">
                <h3 className="font-semibold">Permissoes iniciais</h3>
                <p className="text-sm text-muted-foreground">
                  O perfil comum ja nasce parecido com o admin, mas sem usuarios e sem auditoria.
                </p>
              </div>
              <ScrollArea className="h-[360px]">
                <div className="space-y-2 p-4">
                  {Object.entries(USER_PERMISSION_LABELS).map(([key, label]) => {
                    const checked = newUserDraft.permissions[key];
                    const isLocked = newUserDraft.role === "admin";

                    return (
                      <div key={key} className="flex items-center justify-between rounded-xl border border-border/70 bg-background px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-xs text-muted-foreground">
                            {checked ? "Disponivel para o usuario." : "Oculto no painel."}
                          </p>
                        </div>
                        <Switch
                          checked={checked}
                          onCheckedChange={(value) => handleCreatePermissionToggle(key, value)}
                          disabled={isLocked}
                        />
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>

          <Separator />

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isCreatingUser}>
              Cancelar
            </Button>
            <Button onClick={createNewUser} disabled={isCreatingUser}>
              {isCreatingUser ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <UserRound className="mr-2 h-4 w-4" />
                  Criar usuario
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Excluir usuario permanentemente</DialogTitle>
            <DialogDescription>
              Esta acao apaga a conta e os dados vinculados ao usuario selecionado. Nao ha desfazer.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {selectedUser ? (
              <>
                <span className="font-medium">{selectedUser.name}</span>
                {" "}sera removido de forma permanente, junto com os dados do tenant dele.
              </>
            ) : "Selecione um usuario valido antes de excluir."}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeletingUser}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={deleteSelectedUser} disabled={!selectedUser || isDeletingUser || isEditingSelf}>
              {isDeletingUser ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : "Excluir permanentemente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
