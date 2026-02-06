import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

// Mock the database module
vi.mock("./db", () => ({
  getLeaderboard: vi.fn(),
  getModelStatsById: vi.fn(),
  getHeadToHeadDebateResults: vi.fn(),
  getDebateResult: vi.fn(),
  getDebateResultsByUserId: vi.fn(), // Mocked just in case
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
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

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("leaderboard routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("leaderboard.get returns empty array when no data", async () => {
    (db.getLeaderboard as any).mockResolvedValue([]);
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leaderboard.get({ timeFilter: "all" });
    
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it("leaderboard.getModelStats returns null for unknown model", async () => {
    (db.getModelStatsById as any).mockResolvedValue(null);
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leaderboard.getModelStats({ modelId: "unknown-model" });
    
    expect(result).toBeNull();
  });

  it("leaderboard.headToHead returns zero stats for models that haven't debated", async () => {
    (db.getHeadToHeadDebateResults as any).mockResolvedValue([]);
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leaderboard.headToHead({
      modelA: "claude-sonnet-4.5",
      modelB: "gpt-5.2",
    });
    
    expect(db.getHeadToHeadDebateResults).toHaveBeenCalledWith(1, "claude-sonnet-4.5", "gpt-5.2");
    expect(result.debatesTogether).toBe(0);
    expect(result.modelA.totalPoints).toBe(0);
    expect(result.modelB.totalPoints).toBe(0);
  });

  it("leaderboard.headToHead aggregates stats correctly", async () => {
    const mockResults = [
      {
        moderatorTopPick: "gpt-4",
        pointsAwarded: {
          "gpt-4": { total: 10, peerVotes: 5 },
          "claude-3": { total: 8, peerVotes: 3 }
        }
      },
      {
        moderatorTopPick: "claude-3",
        pointsAwarded: {
          "gpt-4": { total: 9, peerVotes: 4 },
          "claude-3": { total: 11, peerVotes: 6 }
        }
      }
    ];

    (db.getHeadToHeadDebateResults as any).mockResolvedValue(mockResults);
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leaderboard.headToHead({
      modelA: "gpt-4",
      modelB: "claude-3",
    });

    expect(db.getHeadToHeadDebateResults).toHaveBeenCalledWith(1, "gpt-4", "claude-3");
    expect(result.debatesTogether).toBe(2);

    // Model A (gpt-4)
    expect(result.modelA.moderatorPicks).toBe(1); // One win
    expect(result.modelA.peerVotes).toBe(9); // 5 + 4
    expect(result.modelA.totalPoints).toBe(19); // 10 + 9

    // Model B (claude-3)
    expect(result.modelB.moderatorPicks).toBe(1); // One win
    expect(result.modelB.peerVotes).toBe(9); // 3 + 6
    expect(result.modelB.totalPoints).toBe(19); // 8 + 11
  });
});

describe("results routes", () => {
  it("results.getResult returns null for non-existent debate", async () => {
    (db.getDebateResult as any).mockResolvedValue(null);
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.results.getResult({ debateId: 99999 });
    
    expect(result).toBeNull();
  });
});
