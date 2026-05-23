import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import NexoBot from "@/pages/NexoBot";

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-app-data", () => ({
  useAiAgentProfile: () => ({
    data: {
      profiles: [
        { id: "13", name: "Agent principal" },
      ],
    },
    isLoading: false,
    isError: false,
    error: null,
  }),
  useAiAgentAssistantWorkspace: () => ({
    data: {
      assistantName: "Nexo bot",
      introMessage: "Ola! Me conte o erro que voce identificou.",
      messages: [null, { id: 1, role: "assistant", text: "Tudo bem?" }],
      suggestions: [null, "Nao repita a mesma resposta."],
      trainingSnapshot: {
        averageScore: "97.2",
        passedScenarios: "7",
        scenarioCount: 8,
        criticSummary: "Resumo do treino",
      },
      recentConversations: [
        null,
        {
          conversationId: 99,
          contactName: "Guilherme",
          status: "ativo",
          recentMessages: [null, { id: 10, from: "agent", text: "Mensagem do agent" }],
        },
      ],
      profileSummary: {
        businessName: "Empresa X",
      },
    },
    isLoading: false,
    isError: false,
    error: null,
  }),
  useAiAgentAssistantChat: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useAiAgentAssistantReset: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

describe("NexoBot", () => {
  it("renders safely even with partial or malformed assistant data", () => {
    render(
      <MemoryRouter>
        <NexoBot />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /nexo bot .* empresa x/i })).toBeInTheDocument();
    expect(screen.getByText(/97.2 \/ 100/i)).toBeInTheDocument();
    expect(screen.getByText(/nao repita a mesma resposta/i)).toBeInTheDocument();
  });
});
