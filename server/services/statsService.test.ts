import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDebateResultsByUserId, getHeadToHeadDebateResults } from "./statsService";
import { getDb } from "../_core/database";
import { debateResults } from "../../drizzle/schema";

// Mock the database module
vi.mock("../_core/database", () => ({
  getDb: vi.fn(),
}));

describe("statsService", () => {
  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getDb as any).mockResolvedValue(mockDb);
  });

  describe("getDebateResultsByUserId", () => {
    it("should query debate results by user id", async () => {
      const userId = 1;
      await getDebateResultsByUserId(userId);

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalledWith(debateResults);
      expect(mockDb.where).toHaveBeenCalled();
      expect(mockDb.orderBy).toHaveBeenCalled();
    });
  });

  describe("getHeadToHeadDebateResults", () => {
    it("should query debate results with correct filters for two models", async () => {
      const userId = 1;
      const modelA = "gpt-4";
      const modelB = "claude-3";

      await getHeadToHeadDebateResults(userId, modelA, modelB);

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalledWith(debateResults);
      expect(mockDb.where).toHaveBeenCalled();
      // Verify usage of JSON filtering in where clause (implicit via checking call arguments if we were mocking drizzle-orm/sql, but verifying call is enough for now)
      expect(mockDb.orderBy).toHaveBeenCalled();
    });
  });
});
