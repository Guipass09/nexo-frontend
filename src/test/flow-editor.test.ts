import { describe, expect, it } from "vitest";
import {
  MAX_CONDITION_BRANCHES,
  buildFlowBuilderChart,
  buildFlowPayloadFromDraft,
  buildConditionKeywordConfig,
  createFlowBuilderBlocksFromPayloadBlocks,
  createEmptyFlowBuilderBlock,
  formatFlowTrigger,
  getFlowBuilderManualLayout,
  normalizeFlowBuilderBlocks,
  organizeFlowBuilderBlocks,
  parseConditionKeywordDraft,
  parseFlowTrigger,
} from "@/services/flow-editor";

describe("flow editor helpers", () => {
  it("parses and formats trigger drafts", () => {
    expect(parseFlowTrigger("Primeira mensagem")).toEqual({
      mode: "first_message",
      value: "",
    });

    expect(parseFlowTrigger("Palavra-chave: premium")).toEqual({
      mode: "keyword",
      value: "premium",
    });

    expect(formatFlowTrigger({ mode: "tag", value: "vip" })).toBe("Tag: vip");
    expect(formatFlowTrigger({ mode: "contains", value: "quero ajuda" })).toBe("quero ajuda");
  });

  it("parses keyword condition metadata into editable fields", () => {
    const draft = parseConditionKeywordDraft({
      branches: [
        { name: "premium", keywords: ["premium", "valor"], next_position: 40 },
      ],
      default_next_position: 60,
      keyword: "humano",
      next_position: 80,
    });

    expect(draft).toEqual({
      simpleKeyword: "humano",
      simpleNextPosition: "80",
      defaultNextPosition: "60",
      fallbackNextPosition: "",
      branches: [
        {
          id: "branch-1",
          name: "premium",
          keywords: "premium, valor",
          nextPosition: "40",
        },
      ],
    });
  });

  it("builds keyword condition metadata from editable fields", () => {
    expect(buildConditionKeywordConfig({
      simpleKeyword: "humano",
      simpleNextPosition: "80",
      defaultNextPosition: "60",
      fallbackNextPosition: "",
      branches: [
        {
          id: "1",
          name: "premium",
          keywords: "premium, valor",
          nextPosition: "40",
        },
      ],
    })).toEqual({
      keyword: "humano",
      next_position: 80,
      default_next_position: 60,
      branches: [
        {
          name: "premium",
          keywords: ["premium", "valor"],
          next_position: 40,
        },
      ],
    });
  });

  it("caps generated condition branches at eight", () => {
    const branches = Array.from({ length: 10 }, (_, index) => ({
      id: String(index + 1),
      name: `ramo ${index + 1}`,
      keywords: `opcao ${index + 1}`,
      nextPosition: String((index + 2) * 10),
    }));

    const config = buildConditionKeywordConfig({
      simpleKeyword: "",
      simpleNextPosition: "",
      defaultNextPosition: "140",
      fallbackNextPosition: "",
      branches,
    });

    expect(Array.isArray(config.branches) ? config.branches : []).toHaveLength(MAX_CONDITION_BRANCHES);
  });

  it("creates builder blocks from generated payload blocks", () => {
    const blocks = createFlowBuilderBlocksFromPayloadBlocks([
      {
        type: "start",
        label: "Inicio",
        description: "Entrada",
        position: 10,
        config: {},
      },
      {
        type: "condition_keyword",
        label: "Condicao",
        description: "Decide caminho",
        position: 20,
        config: {
          branches: [
            { name: "Sim", keywords: ["sim"], next_position: 30 },
          ],
        },
      },
    ]);

    expect(blocks).toHaveLength(2);
    expect(blocks[1].type).toBe("condition_keyword");
    expect(parseConditionKeywordDraft(blocks[1].config).branches[0]?.name).toBe("Sim");
  });

  it("auto-organizes generated decision branches for canvas editing", () => {
    const blocks = createFlowBuilderBlocksFromPayloadBlocks([
      {
        type: "start",
        label: "Inicio",
        description: "Entrada",
        position: 10,
        config: {},
      },
      {
        type: "condition_keyword",
        label: "Escolha",
        description: "Decide caminho",
        position: 20,
        config: {
          branches: [
            { name: "Agendar", keywords: ["agendar"], next_position: 30 },
            { name: "Duvidas", keywords: ["duvidas"], next_position: 40 },
          ],
          default_next_position: 50,
        },
      },
      {
        type: "send_message",
        label: "Resposta agenda",
        description: "Seguimos para agendar",
        position: 30,
        config: {
          text: "Seguimos para agendar",
          next_position: 50,
        },
      },
      {
        type: "send_message",
        label: "Resposta duvidas",
        description: "Vou te explicar melhor",
        position: 40,
        config: {
          text: "Vou te explicar melhor",
          next_position: 50,
        },
      },
      {
        type: "wait_for_reply",
        label: "Aguardar",
        description: "Aguarda resposta",
        position: 50,
        config: {
          reason: "customer_reply",
        },
      },
    ]);

    const agendar = blocks.find((block) => block.position === 30);
    const duvidas = blocks.find((block) => block.position === 40);

    expect(getFlowBuilderManualLayout(agendar!).branchParentPosition).toBe(20);
    expect(getFlowBuilderManualLayout(duvidas!).branchParentPosition).toBe(20);
    expect(getFlowBuilderManualLayout(agendar!).lane).not.toBe(0);
    expect(getFlowBuilderManualLayout(duvidas!).lane).not.toBe(0);

    const chart = buildFlowBuilderChart(blocks);
    const agendarNode = chart.nodes.find((node) => node.position === 30);
    const duvidasNode = chart.nodes.find((node) => node.position === 40);
    const waitNode = chart.nodes.find((node) => node.position === 50);

    expect(agendarNode?.depth).toBe(duvidasNode?.depth);
    expect(agendarNode?.lane).not.toBe(duvidasNode?.lane);
    expect(waitNode?.lane).toBe(0);
    expect(waitNode?.depth).toBeGreaterThan(agendarNode?.depth ?? 0);
  });

  it("reorganizes an existing messy flow without changing its branch targets", () => {
    const blocks = normalizeFlowBuilderBlocks([
      {
        ...createEmptyFlowBuilderBlock("condition_keyword", 20),
        config: {
          branches: [
            { name: "Agendar", keywords: ["agendar"], next_position: 30 },
            { name: "Duvidas", keywords: ["duvidas"], next_position: 40 },
          ],
          default_next_position: 50,
          ui: {
            lane: 4,
            depth: 8,
          },
        },
      },
      {
        ...createEmptyFlowBuilderBlock("send_message", 30),
        config: {
          text: "Seguimos para agendar",
          next_position: 50,
          ui: {
            lane: 3,
            depth: 11,
            branch_side: "right",
          },
        },
      },
      {
        ...createEmptyFlowBuilderBlock("send_message", 40),
        config: {
          text: "Vou te explicar melhor",
          next_position: 50,
          ui: {
            lane: -4,
            depth: 1,
            branch_side: "left",
          },
        },
      },
      createEmptyFlowBuilderBlock("wait_for_reply", 50),
    ]);

    const organized = organizeFlowBuilderBlocks(blocks);
    const condition = organized.find((block) => block.position === 10 || block.position === 20)?.type === "condition_keyword"
      ? organized.find((block) => block.type === "condition_keyword")
      : organized.find((block) => block.type === "condition_keyword");
    const leftBranch = organized.find((block) => block.position === 20 || block.position === 30);
    const rightBranch = organized.find((block) => block.position === 30 || block.position === 40);

    const conditionBlock = organized.find((block) => block.type === "condition_keyword");
    const conditionConfig = conditionBlock?.config as Record<string, unknown> | undefined;
    const branchTargets = Array.isArray(conditionConfig?.branches)
      ? conditionConfig?.branches.map((branch) => (branch as Record<string, unknown>).next_position)
      : [];

    expect(branchTargets).toHaveLength(2);
    expect(branchTargets).toContain(20);
    expect(branchTargets).toContain(30);

    const messageBlocks = organized.filter((block) => block.type === "send_message");
    expect(messageBlocks).toHaveLength(2);
    expect(messageBlocks.every((block) => getFlowBuilderManualLayout(block).branchParentPosition === 10)).toBe(true);
    expect(new Set(messageBlocks.map((block) => getFlowBuilderManualLayout(block).lane)).size).toBe(2);
  });

  it("remaps branch targets when block order changes before save", () => {
    const conditionBlock = createEmptyFlowBuilderBlock("condition_keyword", 30);

    conditionBlock.config = {
      branches: [
        { name: "premium", keywords: ["premium"], next_position: 40 },
      ],
      default_next_position: 50,
    };

    const blocks = normalizeFlowBuilderBlocks([
      createEmptyFlowBuilderBlock("send_message", 40),
      createEmptyFlowBuilderBlock("send_message", 10),
      conditionBlock,
      createEmptyFlowBuilderBlock("end", 50),
    ]);

    const payload = buildFlowPayloadFromDraft({
      id: "1",
      name: "Fluxo teste",
      status: "rascunho",
      triggerMode: "contains",
      triggerValue: "oi",
      aiCompanyPrompt: "",
      confirmedAiCompanyPrompt: "",
      created: "22/04/2026",
    }, blocks);

    expect(payload.blocks?.map((block) => block.position)).toEqual([10, 20, 30, 40]);
    expect(payload.blocks?.find((block) => block.type === "condition_keyword")?.config).toEqual({
      branches: [
        {
          name: "premium",
          keywords: ["premium"],
          next_position: 30,
        },
      ],
      default_next_position: 40,
    });
  });

  it("branches a message into sibling condition nodes instead of chaining them", () => {
    const message = createEmptyFlowBuilderBlock("send_message", 10);
    const leftCondition = createEmptyFlowBuilderBlock("condition_keyword", 20);
    const rightCondition = createEmptyFlowBuilderBlock("condition_keyword", 30);

    const chart = buildFlowBuilderChart([message, leftCondition, rightCondition]);

    const branchEdges = chart.edges.filter((edge) => edge.fromId === message.clientId);
    expect(branchEdges).toHaveLength(2);
    expect(branchEdges.map((edge) => edge.toId).sort()).toEqual([leftCondition.clientId, rightCondition.clientId].sort());

    const chainedConditionEdge = chart.edges.find((edge) => edge.fromId === leftCondition.clientId && edge.toId === rightCondition.clientId);
    expect(chainedConditionEdge).toBeUndefined();

    const leftNode = chart.nodes.find((node) => node.clientId === leftCondition.clientId);
    const rightNode = chart.nodes.find((node) => node.clientId === rightCondition.clientId);
    expect(leftNode?.depth).toBe(rightNode?.depth);
  });

  it("keeps sibling conditions branched when one side gains its own next step", () => {
    const message = createEmptyFlowBuilderBlock("send_message", 10);
    const leftCondition = createEmptyFlowBuilderBlock("condition_keyword", 20);
    const rightCondition = createEmptyFlowBuilderBlock("condition_keyword", 30);
    const leftMessage = createEmptyFlowBuilderBlock("send_message", 40);

    leftCondition.config = {
      ui: {
        branch_parent_position: 10,
        branch_side: "left",
        next_position: 40,
      },
    };

    rightCondition.config = {
      ui: {
        branch_parent_position: 10,
        branch_side: "right",
      },
    };

    const chart = buildFlowBuilderChart([message, leftCondition, rightCondition, leftMessage]);

    const messageEdges = chart.edges.filter((edge) => edge.fromId === message.clientId);
    expect(messageEdges).toHaveLength(2);
    expect(messageEdges.map((edge) => edge.toId).sort()).toEqual([leftCondition.clientId, rightCondition.clientId].sort());

    const leftPathEdge = chart.edges.find((edge) => edge.fromId === leftCondition.clientId && edge.toId === leftMessage.clientId);
    expect(leftPathEdge?.kind).toBe("sequential");

    const chainedConditionEdge = chart.edges.find((edge) => edge.fromId === leftCondition.clientId && edge.toId === rightCondition.clientId);
    expect(chainedConditionEdge).toBeUndefined();
  });

  it("does not let a side-branch message fall through into the opposite branch", () => {
    const leftMessage = createEmptyFlowBuilderBlock("send_message", 10);
    const rightCondition = createEmptyFlowBuilderBlock("condition_keyword", 20);

    leftMessage.config = {
      ui: {
        lane: -1,
        depth: 2,
        branch_side: "left",
      },
    };

    rightCondition.config = {
      ui: {
        lane: 1,
        depth: 2,
        branch_side: "right",
      },
    };

    const chart = buildFlowBuilderChart([leftMessage, rightCondition]);
    const leakedEdge = chart.edges.find((edge) => edge.fromId === leftMessage.clientId && edge.toId === rightCondition.clientId);
    expect(leakedEdge).toBeUndefined();
  });

  it("does not auto-branch a side-branch message with conditions from another branch context", () => {
    const branchMessage = createEmptyFlowBuilderBlock("send_message", 10);
    const leftCondition = createEmptyFlowBuilderBlock("condition_keyword", 20);
    const rightCondition = createEmptyFlowBuilderBlock("condition_keyword", 30);

    branchMessage.config = {
      ui: {
        lane: -1,
        depth: 2,
        branch_side: "left",
      },
    };

    rightCondition.config = {
      ui: {
        lane: 1,
        depth: 3,
        branch_side: "right",
      },
    };

    const chart = buildFlowBuilderChart([branchMessage, leftCondition, rightCondition]);
    const leakedEdge = chart.edges.find((edge) => edge.fromId === branchMessage.clientId && edge.toId === rightCondition.clientId);
    expect(leakedEdge).toBeUndefined();
  });

  it("does not let a side-branch condition fall through into another ramified condition", () => {
    const topMessage = createEmptyFlowBuilderBlock("send_message", 10);
    const leftCondition = createEmptyFlowBuilderBlock("condition_keyword", 20);
    const leftMessage = createEmptyFlowBuilderBlock("send_message", 30);
    const lowerLeftCondition = createEmptyFlowBuilderBlock("condition_keyword", 40);
    const rightCondition = createEmptyFlowBuilderBlock("condition_keyword", 50);

    leftCondition.config = {
      ui: {
        branch_parent_position: 10,
        branch_side: "left",
      },
    };

    rightCondition.config = {
      ui: {
        branch_parent_position: 10,
        branch_side: "right",
      },
    };

    leftMessage.config = {
      ui: {
        lane: -1,
        depth: 2,
        branch_side: "left",
      },
    };

    lowerLeftCondition.config = {
      ui: {
        lane: -1,
        depth: 3,
        branch_side: "left",
      },
    };

    const chart = buildFlowBuilderChart([topMessage, leftCondition, leftMessage, lowerLeftCondition, rightCondition]);
    const leakedEdge = chart.edges.find((edge) => edge.fromId === lowerLeftCondition.clientId && edge.toId === rightCondition.clientId);
    expect(leakedEdge).toBeUndefined();
  });

  it("branches again when a side-branch message has two consecutive conditions", () => {
    const parentMessage = createEmptyFlowBuilderBlock("send_message", 10);
    const firstNestedCondition = createEmptyFlowBuilderBlock("condition_keyword", 20);
    const secondNestedCondition = createEmptyFlowBuilderBlock("condition_keyword", 30);

    parentMessage.config = {
      ui: {
        lane: 1,
        depth: 2,
        branch_side: "right",
      },
    };

    const chart = buildFlowBuilderChart([parentMessage, firstNestedCondition, secondNestedCondition]);
    const branchEdges = chart.edges.filter((edge) => edge.fromId === parentMessage.clientId);
    expect(branchEdges).toHaveLength(2);
    expect(branchEdges.map((edge) => edge.toId).sort()).toEqual([firstNestedCondition.clientId, secondNestedCondition.clientId].sort());

    const chainedConditionEdge = chart.edges.find((edge) => edge.fromId === firstNestedCondition.clientId && edge.toId === secondNestedCondition.clientId);
    expect(chainedConditionEdge).toBeUndefined();
  });

  it("keeps both conditions attached when one nested condition already points to the same parent", () => {
    const parentMessage = createEmptyFlowBuilderBlock("send_message", 10);
    const firstNestedCondition = createEmptyFlowBuilderBlock("condition_keyword", 20);
    const secondNestedCondition = createEmptyFlowBuilderBlock("condition_keyword", 30);

    parentMessage.config = {
      ui: {
        lane: 1,
        depth: 2,
        branch_side: "right",
      },
    };

    firstNestedCondition.config = {
      ui: {
        branch_parent_position: 10,
        branch_side: "left",
      },
    };

    const chart = buildFlowBuilderChart([parentMessage, firstNestedCondition, secondNestedCondition]);
    const branchEdges = chart.edges.filter((edge) => edge.fromId === parentMessage.clientId);
    expect(branchEdges).toHaveLength(2);
    expect(branchEdges.map((edge) => edge.toId).sort()).toEqual([firstNestedCondition.clientId, secondNestedCondition.clientId].sort());
  });

  it("keeps ai-generated condition responses grouped vertically and merged into the next main step", () => {
    const condition = createEmptyFlowBuilderBlock("condition_keyword", 10);
    const responseA = createEmptyFlowBuilderBlock("send_message", 20);
    const responseB = createEmptyFlowBuilderBlock("send_message", 30);
    const responseC = createEmptyFlowBuilderBlock("send_message", 40);
    const responseD = createEmptyFlowBuilderBlock("send_message", 50);
    const nextMainStep = createEmptyFlowBuilderBlock("send_message", 60);

    condition.config = {
      branches: [
        { name: "A", keywords: ["a"], next_position: 20 },
        { name: "B", keywords: ["b"], next_position: 30 },
        { name: "C", keywords: ["c"], next_position: 40 },
        { name: "D", keywords: ["d"], next_position: 50 },
      ],
      default_next_position: 60,
    };

    responseA.config = { text: "Resposta A", next_position: 60 };
    responseB.config = { text: "Resposta B", next_position: 60 };
    responseC.config = { text: "Resposta C", next_position: 60 };
    responseD.config = { text: "Resposta D", next_position: 60 };

    const chart = buildFlowBuilderChart([condition, responseA, responseB, responseC, responseD, nextMainStep]);

    expect(chart.edges.find((edge) => edge.fromId === responseA.clientId && edge.toId === responseB.clientId)).toBeUndefined();
    expect(chart.edges.find((edge) => edge.fromId === responseB.clientId && edge.toId === responseC.clientId)).toBeUndefined();

    const nextStepIncomingEdges = chart.edges.filter((edge) => edge.toId === nextMainStep.clientId);
    expect(nextStepIncomingEdges).toHaveLength(5);

    const responseNodes = [responseA, responseB, responseC, responseD]
      .map((block) => chart.nodes.find((node) => node.clientId === block.clientId));
    const nextMainNode = chart.nodes.find((node) => node.clientId === nextMainStep.clientId);

    expect(responseNodes.every((node) => typeof node?.depth === "number")).toBe(true);
    expect(new Set(responseNodes.map((node) => node?.depth)).size).toBe(1);
    expect(new Set(responseNodes.map((node) => node?.lane)).size).toBe(4);
    expect(nextMainNode?.lane).toBe(0);
    expect(nextMainNode?.depth).toBeGreaterThan(Math.max(...responseNodes.map((node) => node?.depth ?? 0)));
  });
});
