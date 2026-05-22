import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AiAgentAssistantWidget } from "@/components/ai-agent/AiAgentAssistantWidget";

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock("@/lib/auth", () => ({
  getStoredAuthUser: () => ({
    id: 1,
    name: "Francisco",
    email: "teste@nexo.app",
    role: "admin",
  }),
}));

vi.mock("@/hooks/use-app-data", () => ({
  useAiAgentProfile: () => ({
    data: {
      id: "13",
      name: "Assistente principal",
    },
  }),
  useAiAgentAssistantWorkspace: () => ({
    data: {
      profileId: "13",
      assistantName: "Nexo bot",
      introMessage: "Ola",
      messages: [],
      rules: {
        affirmationAliases: [],
        negationAliases: [],
        completionAliases: [],
        forbiddenReplyFragments: [],
        globalNotes: [],
        topicGuidance: [],
        resourceConfirmationRules: [],
      },
      profileSummary: {
        agentName: "Nexo",
        businessName: "Empresa X",
        segment: "SaaS",
        primaryGoal: "Converter",
        desiredOutcome: "Demo",
        conversationApproach: "guided",
        responseLength: "balanced",
      },
      trainingSnapshot: {
        averageScore: 97,
        passedScenarios: 7,
        scenarioCount: 8,
        issues: [],
        nextFocus: [],
        criticSummary: "Bom",
      },
      recentConversations: [],
      selectedConversation: null,
      suggestions: ["Nao repita a mesma resposta."],
    },
    isLoading: false,
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

describe("AiAgentAssistantWidget", () => {
  it("opens the adjustment modal when the user clicks the launcher", () => {
    render(<AiAgentAssistantWidget />);

    fireEvent.click(screen.getByRole("button", { name: /nexo bot/i }));

    expect(screen.getByText(/ajustes finos, leitura de conversas/i)).toBeInTheDocument();
    expect(screen.getByText(/frases que eu entendo bem/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /minimizar/i })).toBeInTheDocument();
  });
});
