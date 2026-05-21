import { composeVirtualAgentFromWizard } from "@/lib/ai-agent-persona";

describe("ai agent persona builder", () => {
  it("builds a richer virtual agent context from the automatic wizard answers", () => {
    const profile = composeVirtualAgentFromWizard({
      agentName: "Sofia",
      businessName: "Sementes da Fala",
      segment: "Fonoaudiologia infantil online",
      audience: "Famílias com crianças a partir de 4 anos",
      mainGoal: "Acolher, orientar e conduzir para a avaliação inicial",
      businessSummary: "A clínica avalia a fala da criança, orienta a família e indica o melhor caminho terapêutico.",
      services: "Avaliação inicial, sessões online, relatórios e atividades interativas.",
      process: "Primeiro acontece a avaliação, depois a família recebe um plano e segue com o acompanhamento.",
      faq: "",
      hours: "Segunda a sexta, das 8h às 21h.",
      pricing: "A avaliação inicial é gratuita e os valores completos são apresentados depois da avaliação.",
      scheduling: "",
      handoff: "",
      limits: "",
      tone: "acolhedor, leve e profissional",
    });

    expect(profile.roleTitle).toContain("Especialista virtual");
    expect(profile.tone).toContain("português do Brasil impecável");
    expect(profile.businessDescription).toContain("Público atendido");
    expect(profile.services).toContain("Como o atendimento, a plataforma ou o processo funcionam");
    expect(profile.faq).toContain("Como funciona:");
    expect(profile.faq).toContain("Valores e pagamento:");
    expect(profile.schedulingInstructions).toContain("uma pergunta por vez");
    expect(profile.handoffRules).toContain("Encaminhe para atendimento humano");
    expect(profile.boundaries).toContain("linguagem robótica");
    expect(profile.extraKnowledge).toContain("boa acentuação");
  });

  it("keeps explicit faq and language guidance without overwriting them", () => {
    const profile = composeVirtualAgentFromWizard({
      agentName: "Nexo IA",
      businessName: "Clinica Horizonte",
      segment: "Saúde integrativa",
      audience: "",
      mainGoal: "Responder dúvidas com clareza",
      businessSummary: "",
      services: "",
      process: "",
      faq: "A primeira consulta é online e dura cerca de 50 minutos.",
      hours: "",
      pricing: "",
      scheduling: "Pergunte primeiro o melhor período e confirme o fuso horário.",
      handoff: "Encaminhe para uma pessoa quando houver queixa clínica sensível.",
      limits: "Não diagnosticar e não prometer resultados.",
      tone: "humano, direto e com português do Brasil impecável",
    });

    expect(profile.faq).toBe("A primeira consulta é online e dura cerca de 50 minutos.");
    expect(profile.tone).toBe("humano, direto e com português do Brasil impecável");
    expect(profile.schedulingInstructions).toContain("melhor período");
    expect(profile.handoffRules).toContain("queixa clínica sensível");
    expect(profile.boundaries).toContain("Não diagnosticar e não prometer resultados.");
  });
});
