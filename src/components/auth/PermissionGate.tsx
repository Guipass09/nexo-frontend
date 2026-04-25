import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { getStoredAuthUser, hasPermission, type UserPermissionKey } from "@/lib/auth";

interface PermissionGateProps {
  permission: UserPermissionKey;
  children: ReactNode;
}

export default function PermissionGate({ permission, children }: PermissionGateProps) {
  const user = getStoredAuthUser();

  if (!hasPermission(user, permission)) {
    return (
      <Card className="p-6 border-border/60">
        <h2 className="text-lg font-semibold mb-2">Acesso restrito</h2>
        <p className="text-sm text-muted-foreground">
          Sua conta nao tem permissao para acessar esta area.
        </p>
      </Card>
    );
  }

  return <>{children}</>;
}
