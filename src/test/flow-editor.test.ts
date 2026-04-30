import { describe, expect, it } from "vitest";
import {
  MAX_CONDITION_BRANCHES,
  buildFlowBuilderChart,
  buildFlowPayloadFromDraft,
  buildConditionKeywordConfig,
  createFlowBuilderBlocksFromPayloadBlocks,
  createEmptyFlowBuilderBlock,
  formatFlowTrigger,
  normalizeFlowBuilderBlocks,
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
});
