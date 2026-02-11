
import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database functions
vi.mock("./db", () => ({
  getDebateById: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    question: "Test question",
    participantModels: ["claude-sonnet", "gpt-4o"],
    moderatorModel: "claude-opus",
    devilsAdvocateEnabled: false,
    devilsAdvocateModel: null,
    votingEnabled: false,
    status: "active",
    title: "Test debate",
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    rounds: [], // Added rounds property if needed by getFullDebateData but this is getDebateById
  }),
  getRoundsByDebateId: vi.fn().mockResolvedValue([
    { id: 1, debateId: 1, roundNumber: 1, status: "completed" },
  ]),
  getResponsesByRoundId: vi.fn().mockResolvedValue([]),
  getVotesByRoundId: vi.fn().mockResolvedValue([]),

  // New function
  getRoundsWithData: vi.fn().mockResolvedValue([
    {
      id: 1,
      debateId: 1,
      roundNumber: 1,
      status: "completed",
      responses: [
          { id: 1, roundId: 1, modelName: "claude-sonnet", content: "Response 1", isDevilsAdvocate: false }
      ],
      votes: [
          { id: 1, roundId: 1, voterModelId: "gpt-4o", votedForModelId: "claude-sonnet" }
      ]
    }
  ]),

  getUserApiKeyByProvider: vi.fn().mockResolvedValue(null),
  saveDebateResult: vi.fn().mockResolvedValue({}),
  upsertModelStats: vi.fn().mockResolvedValue({}),
  updateDebate: vi.fn().mockResolvedValue({}),
  getDebateResult: vi.fn().mockResolvedValue(null),
}));

// Mock LLM Helper
vi.mock("./llmHelper", () => ({
  invokeLLMWithModel: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "**Winner: claude-sonnet**\n**Why:** Good points.\n## 💡 SYNTHESIS\nSome synthesis." } }],
    usage: { total_tokens: 100 }
  })
}));

// Mock PDF Extractor
vi.mock("./pdfExtractor", () => ({
  extractPdfForPrompt: vi.fn().mockResolvedValue("PDF Content")
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    firebaseUid: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

describe("results.endDebate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("successfully ends debate and generates results", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.results.endDebate({
      debateId: 1,
    });

    expect(result).toHaveProperty("finalAssessment");
    expect(result).toHaveProperty("moderatorTopPick", "claude-sonnet");
    expect(result.peerVotes).toHaveProperty("Sonnet", 1);
  });
});
