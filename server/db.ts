import { eq, desc, and, sql, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertUser, users, debates, rounds, responses, votes, userApiKeys, debateResults, modelStats, userFavoriteModels, InsertDebate, InsertRound, InsertResponse, InsertVote, InsertUserApiKey, InsertDebateResult, InsertModelStat, InsertUserFavoriteModel } from "../drizzle/schema";
import { encrypt, decrypt, isEncrypted } from './encryption';

let _db: ReturnType<typeof drizzle> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _client = postgres(process.env.DATABASE_URL);
      _db = drizzle(_client);
      console.log("[Database] Connected to PostgreSQL");
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// User functions - now using supabaseId instead of openId
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.supabaseId) {
    throw new Error("User supabaseId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    // Check if user exists
    const existing = await db.select()
      .from(users)
      .where(eq(users.supabaseId, user.supabaseId))
      .limit(1);

    if (existing.length > 0) {
      // Update existing user
      const updateSet: Partial<InsertUser> = {
        updatedAt: new Date(),
        lastSignedIn: user.lastSignedIn || new Date(),
      };
      
      if (user.name !== undefined) updateSet.name = user.name;
      if (user.email !== undefined) updateSet.email = user.email;
      if (user.loginMethod !== undefined) updateSet.loginMethod = user.loginMethod;
      if (user.role !== undefined) updateSet.role = user.role;

      await db.update(users)
        .set(updateSet)
        .where(eq(users.supabaseId, user.supabaseId));
    } else {
      // Insert new user
      await db.insert(users).values({
        supabaseId: user.supabaseId,
        name: user.name,
        email: user.email,
        loginMethod: user.loginMethod,
        role: user.role || "user",
        lastSignedIn: user.lastSignedIn || new Date(),
      });
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserBySupabaseId(supabaseId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.supabaseId, supabaseId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Debate functions
export async function createDebate(debate: InsertDebate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(debates).values(debate).returning({ id: debates.id });
  return result[0].id;
}

export async function getDebateById(debateId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(debates).where(eq(debates.id, debateId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getDebatesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(debates).where(eq(debates.userId, userId)).orderBy(desc(debates.createdAt));
}

export async function updateDebate(debateId: number, data: Partial<InsertDebate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(debates).set({ ...data, updatedAt: new Date() }).where(eq(debates.id, debateId));
}

export async function deleteDebate(debateId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete in order: votes -> responses -> rounds -> debate results -> debate
  const debateRounds = await db.select().from(rounds).where(eq(rounds.debateId, debateId));
  for (const round of debateRounds) {
    await db.delete(votes).where(eq(votes.roundId, round.id));
  }
  await db.delete(responses).where(eq(responses.debateId, debateId));
  await db.delete(rounds).where(eq(rounds.debateId, debateId));
  await db.delete(debateResults).where(eq(debateResults.debateId, debateId));
  await db.delete(debates).where(eq(debates.id, debateId));
}

// Round functions
export async function createRound(round: InsertRound) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(rounds).values(round).returning({ id: rounds.id });
  return result[0].id;
}

export async function getRoundsByDebateId(debateId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(rounds).where(eq(rounds.debateId, debateId)).orderBy(rounds.roundNumber);
}

export async function updateRound(roundId: number, data: Partial<InsertRound>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(rounds).set(data).where(eq(rounds.id, roundId));
}

// Response functions
export async function createResponse(response: InsertResponse) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(responses).values(response).returning({ id: responses.id });
  return result[0].id;
}

export async function getResponsesByRoundId(roundId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(responses).where(eq(responses.roundId, roundId)).orderBy(responses.responseOrder);
}

export async function getResponsesByDebateId(debateId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(responses).where(eq(responses.debateId, debateId)).orderBy(responses.createdAt);
}

// Vote functions
export async function createVote(vote: InsertVote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(votes).values(vote).returning({ id: votes.id });
  return result[0].id;
}

export async function getVotesByRoundId(roundId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(votes).where(eq(votes.roundId, roundId));
}

// Full debate data retrieval - optimized to avoid N+1 queries
export async function getFullDebateData(debateId: number) {
  const db = await getDb();
  if (!db) return null;
  
  // Fetch debate
  const debate = await getDebateById(debateId);
  if (!debate) return null;
  
  // Fetch all rounds for this debate
  const debateRounds = await getRoundsByDebateId(debateId);
  
  if (debateRounds.length === 0) {
    return { ...debate, rounds: [] };
  }
  
  // Batch fetch all responses for this debate
  const allResponses = await db.select()
    .from(responses)
    .where(eq(responses.debateId, debateId))
    .orderBy(responses.responseOrder);
  
  // Batch fetch all votes for all rounds in this debate
  const roundIds = debateRounds.map(r => r.id);
  const allVotes = await db.select()
    .from(votes)
    .where(sql`${votes.roundId} = ANY(${roundIds})`);
  
  // Group responses and votes by round
  const responsesByRound = new Map<number, typeof allResponses>();
  const votesByRound = new Map<number, typeof allVotes>();
  
  allResponses.forEach(response => {
    const roundResponses = responsesByRound.get(response.roundId) || [];
    roundResponses.push(response);
    responsesByRound.set(response.roundId, roundResponses);
  });
  
  allVotes.forEach(vote => {
    const roundVotes = votesByRound.get(vote.roundId) || [];
    roundVotes.push(vote);
    votesByRound.set(vote.roundId, roundVotes);
  });
  
  // Assemble rounds with their data
  const roundsWithData = debateRounds.map(round => ({
    ...round,
    responses: responsesByRound.get(round.id) || [],
    votes: votesByRound.get(round.id) || [],
  }));
  
  return {
    ...debate,
    rounds: roundsWithData,
  };
}

// User API Key functions
export async function saveUserApiKey(apiKeyData: InsertUserApiKey) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Encrypt the API key before storing
  const encryptedKey = encrypt(apiKeyData.apiKey);
  
  // Check if key for this provider already exists
  const existing = await db.select()
    .from(userApiKeys)
    .where(and(
      eq(userApiKeys.userId, apiKeyData.userId),
      eq(userApiKeys.provider, apiKeyData.provider)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    // Update existing key with encrypted value
    await db.update(userApiKeys)
      .set({ apiKey: encryptedKey, isActive: true, updatedAt: new Date() })
      .where(eq(userApiKeys.id, existing[0].id));
    return existing[0].id;
  } else {
    // Insert new key with encrypted value
    const result = await db.insert(userApiKeys).values({
      ...apiKeyData,
      apiKey: encryptedKey,
    }).returning({ id: userApiKeys.id });
    return result[0].id;
  }
}

export async function getUserApiKeys(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const keys = await db.select()
    .from(userApiKeys)
    .where(and(
      eq(userApiKeys.userId, userId),
      eq(userApiKeys.isActive, true)
    ));
  
  // Decrypt API keys before returning
  return keys.map(key => ({
    ...key,
    apiKey: isEncrypted(key.apiKey) ? decrypt(key.apiKey) : key.apiKey,
  }));
}

export async function getUserApiKeyByProvider(userId: number, provider: "openrouter" | "anthropic" | "openai" | "google") {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select()
    .from(userApiKeys)
    .where(and(
      eq(userApiKeys.userId, userId),
      eq(userApiKeys.provider, provider),
      eq(userApiKeys.isActive, true)
    ))
    .limit(1);
  
  if (result.length === 0) return null;
  
  // Decrypt API key before returning
  const key = result[0];
  return {
    ...key,
    apiKey: isEncrypted(key.apiKey) ? decrypt(key.apiKey) : key.apiKey,
  };
}

export async function deleteUserApiKey(userId: number, provider: "openrouter" | "anthropic" | "openai" | "google") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(userApiKeys)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(
      eq(userApiKeys.userId, userId),
      eq(userApiKeys.provider, provider)
    ));
}

// Debate Results functions
export async function saveDebateResult(result: InsertDebateResult) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const insertResult = await db.insert(debateResults).values(result).returning({ id: debateResults.id });
  return insertResult[0].id;
}

export async function getDebateResult(debateId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select()
    .from(debateResults)
    .where(eq(debateResults.debateId, debateId))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function getDebateResultsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(debateResults)
    .where(eq(debateResults.userId, userId))
    .orderBy(desc(debateResults.createdAt));
}

// Model Stats functions
export async function upsertModelStats(userId: number, modelId: string, pointsToAdd: {
  total: number;
  moderatorPick: number;
  peerVotes: number;
  strongArguments: number;
  devilsAdvocateBonus: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db.select()
    .from(modelStats)
    .where(and(
      eq(modelStats.userId, userId),
      eq(modelStats.modelId, modelId)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    await db.update(modelStats)
      .set({
        totalPoints: sql`${modelStats.totalPoints} + ${pointsToAdd.total}`,
        totalDebates: sql`${modelStats.totalDebates} + 1`,
        moderatorPicks: sql`${modelStats.moderatorPicks} + ${pointsToAdd.moderatorPick > 0 ? 1 : 0}`,
        totalPeerVotes: sql`${modelStats.totalPeerVotes} + ${pointsToAdd.peerVotes}`,
        strongArgumentMentions: sql`${modelStats.strongArgumentMentions} + ${pointsToAdd.strongArguments > 0 ? 1 : 0}`,
        devilsAdvocateWins: sql`${modelStats.devilsAdvocateWins} + ${pointsToAdd.devilsAdvocateBonus > 0 ? 1 : 0}`,
        recentPoints: pointsToAdd.total,
        updatedAt: new Date(),
      })
      .where(eq(modelStats.id, existing[0].id));
  } else {
    await db.insert(modelStats).values({
      userId,
      modelId,
      totalPoints: pointsToAdd.total,
      totalDebates: 1,
      moderatorPicks: pointsToAdd.moderatorPick > 0 ? 1 : 0,
      totalPeerVotes: pointsToAdd.peerVotes,
      strongArgumentMentions: pointsToAdd.strongArguments > 0 ? 1 : 0,
      devilsAdvocateWins: pointsToAdd.devilsAdvocateBonus > 0 ? 1 : 0,
      recentPoints: pointsToAdd.total,
    });
  }
}

export async function getLeaderboard(userId: number, timeFilter?: "all" | "30days" | "week" | "10debates") {
  const db = await getDb();
  if (!db) return [];
  
  // For "all" filter or no filter, return pre-aggregated stats
  if (!timeFilter || timeFilter === "all") {
    return db.select()
      .from(modelStats)
      .where(eq(modelStats.userId, userId))
      .orderBy(desc(modelStats.totalPoints));
  }
  
  // For time-based filters, calculate from debateResults
  let dateFilter: Date | null = null;
  let limitDebates: number | null = null;
  
  switch (timeFilter) {
    case "30days":
      dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "week":
      dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "10debates":
      limitDebates = 10;
      break;
  }
  
  // Get debate results for the time period
  let resultsQuery = db.select()
    .from(debateResults)
    .where(eq(debateResults.userId, userId))
    .orderBy(desc(debateResults.createdAt));
  
  if (dateFilter) {
    resultsQuery = db.select()
      .from(debateResults)
      .where(and(
        eq(debateResults.userId, userId),
        gte(debateResults.createdAt, dateFilter)
      ))
      .orderBy(desc(debateResults.createdAt));
  }
  
  const results = await resultsQuery;
  
  // Apply debate limit if needed
  const filteredResults = limitDebates ? results.slice(0, limitDebates) : results;
  
  // Aggregate stats from filtered results
  const statsMap = new Map<string, {
    modelId: string;
    totalPoints: number;
    totalDebates: number;
    moderatorPicks: number;
    totalPeerVotes: number;
    strongArgumentMentions: number;
    devilsAdvocateWins: number;
    recentPoints: number;
  }>();
  
  filteredResults.forEach(result => {
    if (!result.pointsAwarded) return;
    
    Object.entries(result.pointsAwarded).forEach(([modelId, points]) => {
      const existing = statsMap.get(modelId) || {
        modelId,
        totalPoints: 0,
        totalDebates: 0,
        moderatorPicks: 0,
        totalPeerVotes: 0,
        strongArgumentMentions: 0,
        devilsAdvocateWins: 0,
        recentPoints: 0,
      };
      
      existing.totalPoints += points.total || 0;
      existing.totalDebates += 1;
      existing.moderatorPicks += points.moderatorPick > 0 ? 1 : 0;
      existing.totalPeerVotes += points.peerVotes || 0;
      existing.strongArgumentMentions += points.strongArguments > 0 ? 1 : 0;
      existing.devilsAdvocateWins += points.devilsAdvocateBonus > 0 ? 1 : 0;
      
      statsMap.set(modelId, existing);
    });
  });
  
  // Calculate recent points (from last 3 results)
  const last3Results = filteredResults.slice(0, 3);
  last3Results.forEach(result => {
    if (!result.pointsAwarded) return;
    Object.entries(result.pointsAwarded).forEach(([modelId, points]) => {
      const existing = statsMap.get(modelId);
      if (existing) {
        existing.recentPoints += points.total || 0;
      }
    });
  });
  
  // Convert to array and sort by total points
  return Array.from(statsMap.values())
    .sort((a, b) => b.totalPoints - a.totalPoints);
}

export async function getModelStatsById(userId: number, modelId: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select()
    .from(modelStats)
    .where(and(
      eq(modelStats.userId, userId),
      eq(modelStats.modelId, modelId)
    ))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

// User Favorite Models functions
export async function getUserFavoriteModels(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(userFavoriteModels)
    .where(eq(userFavoriteModels.userId, userId))
    .orderBy(desc(userFavoriteModels.createdAt));
}

export async function addUserFavoriteModel(userId: number, openRouterId: string, modelName: string) {
  const db = await getDb();
  if (!db) return;
  
  // Check if exists, if so update, otherwise insert
  const existing = await db.select()
    .from(userFavoriteModels)
    .where(and(
      eq(userFavoriteModels.userId, userId),
      eq(userFavoriteModels.openRouterId, openRouterId)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    await db.update(userFavoriteModels)
      .set({ modelName })
      .where(eq(userFavoriteModels.id, existing[0].id));
  } else {
    await db.insert(userFavoriteModels).values({ userId, openRouterId, modelName });
  }
}

export async function removeUserFavoriteModel(userId: number, openRouterId: string) {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(userFavoriteModels)
    .where(and(
      eq(userFavoriteModels.userId, userId),
      eq(userFavoriteModels.openRouterId, openRouterId)
    ));
}
