import {
  agentBrainFormFromProfile,
  completionSignalsForStep,
  deriveAgentBrainPayload,
  emptyAgentBrainForm,
  type AgentBrainForm,
} from "@/lib/agent-brain";

describe("agent brain composition", () => {
  it("derives enrollment payload for a school (matrícula)", () => {
    const form: AgentBrainForm = {
      ...emptyAgentBrainForm,
      businessType: "school",
      mainGoal: "enroll",
      advanceStep: "matricula",
      serviceMode: "in_person",
      supportedTopics: ["pricing", "registration"],
    };

    const { tenantBrain, operationalContext } = deriveAgentBrainPayload(form);

    expect(tenantBrain.businessType).toBe("school");
    expect(tenantBrain.primaryActionLabel).toBe("matrícula");
    expect(tenantBrain.completionSignals).toEqual([
      "me matriculei",
      "finalizei a matrícula",
      "já fiz a matrícula",
    ]);
    expect(operationalContext.conversionFlowType).toBe("enrollment");
    expect(operationalContext.requiresRegistration).toBe(true);
  });

  it("derives reservation payload for a restaurant (reserva)", () => {
    const form: AgentBrainForm = {
      ...emptyAgentBrainForm,
      businessType: "restaurant",
      mainGoal: "reserve",
      advanceStep: "reserva",
      serviceMode: "in_person",
    };

    const { tenantBrain, operationalContext } = deriveAgentBrainPayload(form);

    expect(tenantBrain.primaryActionLabel).toBe("reserva");
    expect(tenantBrain.completionSignals).toEqual(["reservei", "já reservei", "confirmei a reserva"]);
    expect(operationalContext.conversionFlowType).toBe("reservation");
    expect(operationalContext.requiresRegistration).toBe(true);
  });

  it("derives cadastro signals and registration flow", () => {
    const form: AgentBrainForm = {
      ...emptyAgentBrainForm,
      businessType: "clinic",
      advanceStep: "cadastro",
      serviceMode: "online",
    };

    const { tenantBrain, operationalContext } = deriveAgentBrainPayload(form);

    expect(tenantBrain.primaryActionLabel).toBe("cadastro");
    expect(tenantBrain.completionSignals).toEqual(["cadastrei", "já cadastrei", "finalizei o cadastro"]);
    expect(operationalContext.conversionFlowType).toBe("registration_then_schedule");
    expect(operationalContext.hasSessionLink).toBe(true);
  });

  it("sets requiresRegistration false for 'nenhuma etapa obrigatória'", () => {
    const form: AgentBrainForm = {
      ...emptyAgentBrainForm,
      businessType: "store",
      mainGoal: "support",
      advanceStep: "none",
      serviceMode: "both",
    };

    const { tenantBrain, operationalContext } = deriveAgentBrainPayload(form);

    expect(operationalContext.requiresRegistration).toBe(false);
    expect(operationalContext.conversionFlowType).toBe("none");
    expect(tenantBrain.primaryActionLabel).toBe("");
    expect(tenantBrain.completionSignals).toEqual([]);
  });

  it("maps service mode 'both' to hybrid + session link", () => {
    const { tenantBrain, operationalContext } = deriveAgentBrainPayload({
      ...emptyAgentBrainForm,
      advanceStep: "reserva",
      serviceMode: "both",
    });

    expect(operationalContext.serviceDeliveryMode).toBe("hybrid");
    expect(operationalContext.hasSessionLink).toBe(true);
    expect((tenantBrain.location as Record<string, unknown>).online_only ?? (tenantBrain.location as Record<string, unknown>).onlineOnly).toBe(false);
  });

  it("exposes suggested completion signals per step", () => {
    expect(completionSignalsForStep("documentos")).toEqual([
      "enviei os documentos",
      "já mandei os documentos",
      "documentos enviados",
    ]);
    expect(completionSignalsForStep("none")).toEqual([]);
  });

  it("round-trips a school profile back into the form (best-effort)", () => {
    const form = agentBrainFormFromProfile(
      { business_type: "school", forbidden_claims: ["resultado garantido"] },
      { business_type: "school", conversion_flow_type: "enrollment", requires_registration: true, service_delivery_mode: "in_person" },
    );

    expect(form.businessType).toBe("school");
    expect(form.advanceStep).toBe("matricula");
    expect(form.serviceMode).toBe("in_person");
    expect(form.forbiddenClaims).toContain("resultado garantido");
  });

  it("leaves Sementes da Fala (platform) businessType empty so the form stays untouched", () => {
    const form = agentBrainFormFromProfile(
      { business_type: "platform" },
      { business_type: "platform", conversion_flow_type: "registration_then_schedule", requires_registration: true },
    );

    // 'platform' is not a UI option → businessType stays empty (no accidental dirty/overwrite).
    expect(form.businessType).toBe("");
  });
});
