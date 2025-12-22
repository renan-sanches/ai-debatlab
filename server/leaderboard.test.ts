import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

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
  it("leaderboard.get returns empty array when no data", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // This will return empty since there's no data for this test user
    const result = await caller.leaderboard.get({ timeFilter: "all" });
    
    expect(Array.isArray(result)).toBe(true);
  });

  it("leaderboard.getModelStats returns null for unknown model", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leaderboard.getModelStats({ modelId: "unknown-model" });
    
    expect(result).toBeNull();
  });

  it("leaderboard.headToHead returns zero stats for models that haven't debated", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leaderboard.headToHead({
      modelA: "claude-sonnet-4.5",
      modelB: "gpt-5.2",
    });
    
    expect(result.debatesTogether).toBe(0);
    expect(result.modelA.totalPoints).toBe(0);
    expect(result.modelB.totalPoints).toBe(0);
  });
});

describe("results routes", () => {
  it("results.getResult returns null for non-existent debate", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.results.getResult({ debateId: 99999 });
    
    expect(result).toBeNull();
  });
});
