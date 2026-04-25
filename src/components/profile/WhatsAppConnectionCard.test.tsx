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
    isTesting: false,
    isSyncingTemplates: false,
    isDisconnecting: false,
    error: null,
    queryErrorMessage: null,
    onConnect: vi.fn(),
    onRetry: vi.fn(),
    onTest: vi.fn(),
    onSyncTemplates: vi.fn(),
    onDisconnect: vi.fn(),
    ...overrides,
  };

  return {
    ...render(<WhatsAppConnectionCard {...props} />),
    props,
  };
}

function buildConnectedConnection(): ProfileWhatsAppConnection {
  return {
    id: "wa-1",
    businessAccountId: "waba_123",
    phoneNumberId: "phone_456",
    phoneNumber: "5511999999999",
    status: "connected",
    connectionType: "coexistence",
    health: "active",
    webhookStatus: "active",
    connectedAt: "2026-04-24T10:00:00.000Z",
    updatedAt: "2026-04-24T10:30:00.000Z",
  };
}

describe("WhatsAppConnectionCard", () => {
  it("renders disconnected state and triggers embedded signup", () => {
    const { props } = renderCard();

    expect(screen.getByText("WhatsApp conectado")).toBeInTheDocument();
    expect(screen.getByText("Conectar WhatsApp")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Conectar WhatsApp" }));

    expect(props.onConnect).toHaveBeenCalledTimes(1);
  });

  it("renders connected state details and action buttons", () => {
    const { props } = renderCard({
      connection: buildConnectedConnection(),
    });

    expect(screen.getByText("Seu WhatsApp esta conectado e pronto para automacoes.")).toBeInTheDocument();
    expect(screen.getByText("5511999999999")).toBeInTheDocument();
    expect(screen.getByText("waba_123")).toBeInTheDocument();
    expect(screen.getByText("phone_456")).toBeInTheDocument();
    expect(screen.getByText("Business Account ID")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sincronizar templates" }));
    fireEvent.click(screen.getByRole("button", { name: "Testar conexao" }));
    fireEvent.click(screen.getByRole("button", { name: "Desconectar" }));

    expect(props.onSyncTemplates).toHaveBeenCalledTimes(1);
    expect(props.onTest).toHaveBeenCalledTimes(1);
    expect(props.onDisconnect).toHaveBeenCalledTimes(1);
  });

  it("renders error state with retry and technical details", () => {
    const { props } = renderCard({
      error: {
        title: "Numero nao elegivel para Coexistence",
        message: "A Meta informou que este numero nao pode concluir o Coexistence agora.",
        technicalDetails: {
          coexistence_error_code: "COEXISTENCE_NOT_ELIGIBLE",
        },
      },
    });

    expect(screen.getByText("Numero nao elegivel para Coexistence")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Tentar novamente" })).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Detalhes tecnicos" }));
    expect(screen.getByText(/COEXISTENCE_NOT_ELIGIBLE/)).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Tentar novamente" })[0]);
    expect(props.onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders connecting state feedback in the profile card", () => {
    renderCard({
      isConnecting: true,
    });

    expect(screen.getByText("Abrindo conexao com a Meta...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrindo Meta..." })).toBeDisabled();
  });
});
