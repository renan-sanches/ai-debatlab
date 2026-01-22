import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { TrpcContext } from "./_core/context";

// Hoisted spies
const mocks = vi.hoisted(() => {
  return {
    getUserApiKeyByProvider: vi.fn(),
    getUserApiKeys: vi.fn(),
    invokeLLMWithModel: vi.fn(),
    getDebateById: vi.fn(),
    getResponsesByRoundId: vi.fn(),
    getRoundsByDebateId: vi.fn(),
    createVote: vi.fn(),
    getModelById: vi.fn(),
    buildVotingPrompt: vi.fn(),
    formatResponsesForContext: vi.fn(),
    formatVotesForContext: vi.fn(),
  };
});

// Mock dependencies
vi.mock("./db", () => ({
  getDebateById: mocks.getDebateById,
  getResponsesByRoundId: mocks.getResponsesByRoundId,
  getRoundsByDebateId: mocks.getRoundsByDebateId,
  createVote: mocks.createVote,
  getUserApiKeyByProvider: mocks.getUserApiKeyByProvider,
  getUserApiKeys: mocks.getUserApiKeys,
}));

vi.mock("../shared/models", () => ({
  AI_MODELS: [],
  getModelById: mocks.getModelById,
}));

vi.mock("./llmHelper", () => ({
  invokeLLMWithModel: mocks.invokeLLMWithModel,
}));

vi.mock("./prompts", () => ({
  buildVotingPrompt: mocks.buildVotingPrompt,
  formatResponsesForContext: mocks.formatResponsesForContext,
  formatVotesForContext: mocks.formatVotesForContext,
}));

// Import router AFTER mocking
import { appRouter } from "./routers";

function createAuthContext(): { ctx: TrpcContext } {
  const user = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    supabaseId: "test-user-id",
  };

  const ctx: TrpcContext = {
    user,
    req: {} as any,
    res: {} as any,
  };

  return { ctx };
}

describe("Performance Check: generateVotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default return values
    mocks.getUserApiKeyByProvider.mockResolvedValue(null);
    mocks.getUserApiKeys.mockResolvedValue([]);
    mocks.invokeLLMWithModel.mockResolvedValue({
      choices: [{ message: { content: "I vote for gpt-4o because..." } }],
      usage: { totalTokens: 100 }
    });

    mocks.getDebateById.mockResolvedValue({
      id: 1,
      userId: 1,
      question: "Test question",
      participantModels: ["gpt-4o", "claude-3-opus", "gemini-pro"], // 3 models
      votingEnabled: true,
      moderatorModel: "claude-opus",
      devilsAdvocateEnabled: false,
      title: "Test Debate",
      tags: [],
      imageUrl: null,
      pdfUrl: null,
    });

    mocks.getResponsesByRoundId.mockResolvedValue([]);
    mocks.getRoundsByDebateId.mockResolvedValue([{ id: 1, roundNumber: 1, followUpQuestion: null }]);
    mocks.createVote.mockResolvedValue(1);

    mocks.getModelById.mockImplementation((id: string) => {
      const providerMap: Record<string, string> = {
        "gpt-4o": "openai",
        "claude-3-opus": "anthropic",
        "gemini-pro": "google"
      };
      return {
        id,
        name: id,
        provider: providerMap[id] || "openai",
        lens: "neutral"
      };
    });

    mocks.buildVotingPrompt.mockReturnValue("mock prompt");
    mocks.formatResponsesForContext.mockReturnValue("");
    mocks.formatVotesForContext.mockReturnValue("");
  });

  it("calls getUserApiKeys once and avoids N+1 query", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await caller.debate.generateVotes({
      debateId: 1,
      roundId: 1,
      useUserApiKey: true,
    });

    const individualCallCount = mocks.getUserApiKeyByProvider.mock.calls.length;
    const batchCallCount = mocks.getUserApiKeys.mock.calls.length;

    expect(individualCallCount).toBe(0);
    expect(batchCallCount).toBe(1);
  });
});
