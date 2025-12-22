import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database functions
vi.mock("./db", () => ({
  createDebate: vi.fn().mockResolvedValue(1),
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
  }),
  getDebatesByUserId: vi.fn().mockResolvedValue([]),
  updateDebate: vi.fn().mockResolvedValue(undefined),
  deleteDebate: vi.fn().mockResolvedValue(undefined),
  createRound: vi.fn().mockResolvedValue(1),
  getRoundsByDebateId: vi.fn().mockResolvedValue([
    { id: 1, debateId: 1, roundNumber: 1, status: "in_progress" },
  ]),
  updateRound: vi.fn().mockResolvedValue(undefined),
  createResponse: vi.fn().mockResolvedValue(1),
  getResponsesByRoundId: vi.fn().mockResolvedValue([]),
  getResponsesByDebateId: vi.fn().mockResolvedValue([]),
  createVote: vi.fn().mockResolvedValue(1),
  getVotesByRoundId: vi.fn().mockResolvedValue([]),
  getFullDebateData: vi.fn().mockResolvedValue({
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
    rounds: [
      {
        id: 1,
        debateId: 1,
        roundNumber: 1,
        status: "in_progress",
        responses: [],
        votes: [],
      },
    ],
  }),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
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

describe("debate.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new debate with valid input", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.debate.create({
      question: "Should AI be regulated?",
      participantModels: ["claude-sonnet", "gpt-4o"],
      moderatorModel: "claude-opus",
      devilsAdvocateEnabled: false,
      devilsAdvocateModel: null,
      votingEnabled: false,
    });

    expect(result).toHaveProperty("debateId");
    expect(result).toHaveProperty("roundId");
    expect(result.debateId).toBe(1);
    expect(result.roundId).toBe(1);
  });

  it("creates a debate with devil's advocate mode enabled", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.debate.create({
      question: "Is remote work better than office work?",
      participantModels: ["claude-sonnet", "gpt-4o", "gemini-pro"],
      moderatorModel: "claude-opus",
      devilsAdvocateEnabled: true,
      devilsAdvocateModel: "gpt-4o",
      votingEnabled: true,
    });

    expect(result.debateId).toBe(1);
    expect(result.roundId).toBe(1);
  });
});

describe("debate.get", () => {
  it("returns debate data for valid debate id", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.debate.get({ debateId: 1 });

    expect(result).not.toBeNull();
    expect(result?.question).toBe("Test question");
    expect(result?.participantModels).toEqual(["claude-sonnet", "gpt-4o"]);
  });
});

describe("debate.list", () => {
  it("returns empty array when user has no debates", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.debate.list();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("debate.delete", () => {
  it("deletes a debate successfully", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.debate.delete({ debateId: 1 });

    expect(result).toEqual({ success: true });
  });
});

describe("models.list", () => {
  it("returns available AI models", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.models.list();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("id");
    expect(result[0]).toHaveProperty("name");
    expect(result[0]).toHaveProperty("provider");
    expect(result[0]).toHaveProperty("openRouterId");
  });
});
