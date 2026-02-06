import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database functions
vi.mock("./db", () => ({
  getUserApiKeys: vi.fn().mockResolvedValue([
    {
      id: 1,
      userId: 1,
      provider: "openrouter",
      apiKey: "sk-or-test-key-12345678",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  saveUserApiKey: vi.fn().mockResolvedValue(1),
  deleteUserApiKey: vi.fn().mockResolvedValue(undefined),
  getUserApiKeyByProvider: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    provider: "openrouter",
    apiKey: "sk-or-test-key-12345678",
    isActive: true,
  }),
  // Include other mocks needed for the router
  createDebate: vi.fn().mockResolvedValue(1),
  getDebateById: vi.fn().mockResolvedValue(null),
  getDebatesByUserId: vi.fn().mockResolvedValue([]),
  createRound: vi.fn().mockResolvedValue(1),
  getRoundsByDebateId: vi.fn().mockResolvedValue([]),
  getFullDebateData: vi.fn().mockResolvedValue(null),
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

describe("apiKeys.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns masked API keys for the user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.apiKeys.list();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0].provider).toBe("openrouter");
    // Key should be masked
    expect(result[0].maskedKey).toBe("****5678");
    expect(result[0].maskedKey).not.toContain("sk-or-test");
  });
});

describe("apiKeys.save", () => {
  it("saves a new API key", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.apiKeys.save({
      provider: "anthropic",
      apiKey: "sk-ant-test-key",
    });

    expect(result).toEqual({ success: true });
  });
});

describe("apiKeys.delete", () => {
  it("deletes an API key", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.apiKeys.delete({
      provider: "openrouter",
    });

    expect(result).toEqual({ success: true });
  });
});

describe("apiKeys.hasProvider", () => {
  it("returns true when user has the provider configured", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.apiKeys.hasProvider({
      provider: "openrouter",
    });

    expect(result).toEqual({ hasKey: true });
  });
});
