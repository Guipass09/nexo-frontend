import type { ComponentProps } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WhatsAppConnectionCard } from "@/components/profile/WhatsAppConnectionCard";
import type { ProfileWhatsAppConnection } from "@/types/domain";

function renderCard(overrides?: Partial<ComponentProps<typeof WhatsAppConnectionCard>>) {
  const props: ComponentProps<typeof WhatsAppConnectionCard> = {
    connection: null,
    isLoading: false,
    isConnecting: false,
    isStartingWeb: false,
    isTesting: false,
    isSyncingTemplates: false,
    isDisconnecting: false,
    isDisconnectingWeb: false,
    isWebQrModalOpen: false,
    onWebQrModalOpenChange: vi.fn(),
    webQrStatus: null,
    isLoadingWebQr: false,
    error: null,
    queryErrorMessage: null,
    onConnect: vi.fn(),
    onConnectWeb: vi.fn(),
    onRetry: vi.fn(),
    onTest: vi.fn(),
    onSyncTemplates: vi.fn(),
    onDisconnect: vi.fn(),
    onDisconnectWeb: vi.fn(),
    ...overrides,
  };

  return {
    ...render(<WhatsAppConnectionCard {...props} />),
    props,
  };
}

function buildConnectedConnection(overrides?: Partial<ProfileWhatsAppConnection>): ProfileWhatsAppConnection {
  return {
    id: "wa-1",
    provider: "cloud_api",
    businessAccountId: "waba_123",
    phoneNumberId: "phone_456",
    phoneNumber: "5511999999999",
    status: "connected",
    connectionType: "cloud_api",
    health: "active",
    webhookStatus: "active",
    connectedAt: "2026-04-24T10:00:00.000Z",
    updatedAt: "2026-04-24T10:30:00.000Z",
    ...overrides,
  };
}

describe("WhatsAppConnectionCard", () => {
  it("renders both connection modes when disconnected", () => {
    const { props } = renderCard();

    expect(screen.getByText("WhatsApp oficial da Meta")).toBeInTheDocument();
    expect(screen.getByText("Manter WhatsApp no celular")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Conectar pela Meta" }));
    fireEvent.click(screen.getByRole("button", { name: "Conectar por QR Code" }));

    expect(props.onConnect).toHaveBeenCalledTimes(1);
    expect(props.onConnectWeb).toHaveBeenCalledTimes(1);
  });

  it("renders cloud actions when connected via official provider", () => {
    const { props } = renderCard({
      connection: buildConnectedConnection(),
    });

    expect(screen.getByText("Seu WhatsApp esta conectado e pronto para automacoes.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sincronizar templates" }));
    fireEvent.click(screen.getByRole("button", { name: "Testar conexao" }));
    fireEvent.click(screen.getByRole("button", { name: "Desconectar" }));

    expect(props.onSyncTemplates).toHaveBeenCalledTimes(1);
    expect(props.onTest).toHaveBeenCalledTimes(1);
    expect(props.onDisconnect).toHaveBeenCalledTimes(1);
  });

  it("renders qr actions when connected via whatsapp web", () => {
    const { props } = renderCard({
      connection: buildConnectedConnection({
        provider: "whatsapp_web",
        connectionType: "whatsapp_web",
        businessAccountId: null,
        phoneNumberId: null,
        webSessionId: "session-123",
      }),
    });

    fireEvent.click(screen.getByRole("button", { name: "Ver QR / status" }));
    fireEvent.click(screen.getByRole("button", { name: "Desconectar" }));

    expect(props.onWebQrModalOpenChange).toHaveBeenCalledWith(true);
    expect(props.onDisconnectWeb).toHaveBeenCalledTimes(1);
  });
});
