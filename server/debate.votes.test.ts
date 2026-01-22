
import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock DB
vi.mock("./db", () => ({
  getDebateById: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    question: "Test question",
    participantModels: ["Alpha", "Beta"],
    moderatorModel: "moderator",
    votingEnabled: true,
  }),
  getResponsesByRoundId: vi.fn().mockResolvedValue([]),
  getRoundsByDebateId: vi.fn().mockResolvedValue([{ id: 1, roundNumber: 1 }]),
  createVote: vi.fn().mockResolvedValue(1),
  getUserApiKeyByProvider: vi.fn().mockResolvedValue(null),
}));

// Mock LLM Helper
vi.mock("./llmHelper", () => ({
  invokeLLMWithModel: vi.fn().mockImplementation(async ({ model }) => {
    if (model === "FailUser") throw new Error("LLM Failed");
    if (model === "Alpha" || model === "Beta") {
      return {
        choices: [{ message: { content: `**MY VOTE:** ${model === "Alpha" ? "Beta" : "Alpha"}` } }],
        usage: { totalTokens: 100 }
      };
    }
    return {
       choices: [{ message: { content: `**MY VOTE:** Alpha` } }],
       usage: { totalTokens: 100 }
    };
  }),
}));

// Mock Models
vi.mock("../shared/models", () => ({
  getModelById: vi.fn((id) => ({ id, name: id, provider: "openai" })),
  AI_MODELS: [
    { id: "Alpha", name: "Alpha", provider: "openai" },
    { id: "Beta", name: "Beta", provider: "openai" },
    { id: "FailUser", name: "FailUser", provider: "openai" },
    { id: "SuccessUser", name: "SuccessUser", provider: "openai" }
  ]
}));

// Mock Prompts
vi.mock("./prompts", () => ({
  buildVotingPrompt: vi.fn().mockReturnValue("prompt"),
  formatResponsesForContext: vi.fn(),
  formatVotesForContext: vi.fn(),
}));

function createAuthContext(): { ctx: TrpcContext } {
  return {
    ctx: {
      user: { id: 1 } as any,
      req: {} as any,
      res: {} as any,
    }
  };
}

describe("debate.generateVotes", () => {
  it("generates votes concurrently", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.debate.generateVotes({
      debateId: 1,
      roundId: 1,
    });

    expect(result.votes).toHaveLength(2);
    // Alpha votes for Beta
    expect(result.votes).toContainEqual(expect.objectContaining({
      voterModelId: "Alpha",
      votedForModelId: "Beta"
    }));
    // Beta votes for Alpha
    expect(result.votes).toContainEqual(expect.objectContaining({
      voterModelId: "Beta",
      votedForModelId: "Alpha"
    }));
  });

  it("handles partial failures gracefully", async () => {
     // Mock getDebateById to return different participants
     const db = await import("./db");
     vi.mocked(db.getDebateById).mockResolvedValueOnce({
        id: 2,
        userId: 1,
        question: "Test question",
        participantModels: ["FailUser", "SuccessUser"],
        moderatorModel: "moderator",
        votingEnabled: true,
     } as any);

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.debate.generateVotes({
      debateId: 2,
      roundId: 1,
    });

    // Should have 1 vote (SuccessUser), FailUser failed
    expect(result.votes).toHaveLength(1);
    expect(result.votes).toContainEqual(expect.objectContaining({
      voterModelId: "SuccessUser",
    }));
  });
});
