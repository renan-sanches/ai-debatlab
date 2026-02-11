import { eq, desc, inArray } from "drizzle-orm";
import { debates, rounds, responses, votes, debateResults, InsertDebate, InsertRound, InsertResponse, Debate, Response } from "../../drizzle/schema";
import { getDb } from "../_core/database";
import { getVotesByRoundId } from "./voteService";
import { getUserApiKeyByProvider } from "./userService";
import { getModelById, type AIModel } from "../../shared/models";
import {
  buildStandardParticipantPrompt,
  buildDevilsAdvocatePrompt,
  formatResponsesForContext,
} from "../prompts";
import { extractPdfForPrompt } from "../pdfExtractor";

// Re-export PromptContext from prompts.ts for consistency
import type { PromptContext } from "../prompts";
export type { PromptContext };

// --- DB CRUD Functions ---

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

// Helper to get rounds with data efficiently
export async function getRoundsWithData(debateId: number) {
  const db = await getDb();
  if (!db) return [];

  // Fetch all rounds for this debate
  const debateRounds = await getRoundsByDebateId(debateId);

  if (debateRounds.length === 0) {
    return [];
  }

  // Batch fetch all responses for this debate
  const allResponses = await db.select()
    .from(responses)
    .where(eq(responses.debateId, debateId))
    .orderBy(responses.responseOrder);

  // Batch fetch all votes for all rounds in this debate
  const roundIds = debateRounds.map(r => r.id);
  const allVotes = roundIds.length > 0
    ? await db.select().from(votes).where(inArray(votes.roundId, roundIds))
    : [];

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
  return debateRounds.map(round => ({
    ...round,
    responses: responsesByRound.get(round.id) || [],
    votes: votesByRound.get(round.id) || [],
  }));
}

// Full debate data retrieval - optimized to avoid N+1 queries
export async function getFullDebateData(debateId: number) {
  const db = await getDb();
  if (!db) return null;

  // Fetch debate
  const debate = await getDebateById(debateId);
  if (!debate) return null;

  const roundsWithData = await getRoundsWithData(debateId);

  return {
    ...debate,
    rounds: roundsWithData,
  };
}

// --- Business Logic Functions ---

export interface PreparedPromptResult {
  prompt: string;
  isDevilsAdvocate: boolean;
  model: AIModel;
  promptContext: PromptContext;
}

/**
 * Prepares all context needed for generating a debate response
 */
export async function prepareDebatePrompt(params: {
  debate: Debate;
  roundId: number;
  modelId: string;
  existingResponses: Response[];
}): Promise<PreparedPromptResult> {
  const { debate, roundId, modelId, existingResponses } = params;

  const model = getModelById(modelId);
  if (!model) {
    throw new Error(`Model not found: ${modelId}`);
  }

  // Format existing responses for context
  // In Blind Mode, we hide other participants' responses for the current round
  const responsesToFormat = debate.isBlindMode ? [] : existingResponses;

  const previousResponses = formatResponsesForContext(
    responsesToFormat.map(r => ({
      modelName: r.modelName,
      content: r.content,
      isDevilsAdvocate: r.isDevilsAdvocate,
    }))
  );

  // Get round info
  const rounds = await getRoundsByDebateId(debate.id); // Use local function
  const currentRound = rounds.find(r => r.id === roundId);
  const roundNumber = currentRound?.roundNumber || 1;

  // Get previous moderator synthesis if round > 1
  let moderatorSynthesis: string | undefined;
  let debateHistory: string | undefined;

  if (roundNumber > 1) {
    const prevRound = rounds.find(r => r.roundNumber === roundNumber - 1);
    moderatorSynthesis = prevRound?.moderatorSynthesis || undefined;

    // Build debate history for previous rounds
    const previousRounds = rounds
      .filter(r => r.roundNumber < roundNumber)
      .sort((a, b) => a.roundNumber - b.roundNumber);

    debateHistory = previousRounds.map(r => {
      // For round 1, question is in debate.question
      // For subsequent rounds, question is in r.followUpQuestion
      const q = r.roundNumber === 1 ? debate.question : (r.followUpQuestion || "No question recorded");
      const summary = r.moderatorSynthesis || "No summary available.";
      return `ROUND ${r.roundNumber}:\nQuestion: ${q}\nModerator Summary: ${summary}`;
    }).join("\n\n");
  }

  // Determine if this model is the devil's advocate
  const isDevilsAdvocate = debate.devilsAdvocateEnabled && debate.devilsAdvocateModel === modelId;

  // Extract PDF content if available
  let pdfContent: string | undefined;
  if (debate.pdfUrl) {
    try {
      pdfContent = await extractPdfForPrompt(debate.pdfUrl);
      console.log(`[PDF] Extracted ${pdfContent.length} chars from PDF for debate ${debate.id}`);
    } catch (error) {
      console.error(`[PDF] Failed to extract PDF content:`, error);
    }
  }

  // Build prompt context
  const question = currentRound?.followUpQuestion || debate.question;
  const promptContext: PromptContext = {
    userQuestion: question,
    previousResponses,
    roundNumber,
    moderatorSynthesis,
    debateHistory,
    modelName: model.name,
    modelLens: model.lens || "general analysis", // Provide default for models without specific lens
    imageUrl: debate.imageUrl || undefined,
    pdfUrl: debate.pdfUrl || undefined,
    pdfContent,
  };

  // Build the appropriate prompt
  const prompt = isDevilsAdvocate
    ? buildDevilsAdvocatePrompt(promptContext)
    : buildStandardParticipantPrompt(promptContext);

  return {
    prompt,
    isDevilsAdvocate,
    model,
    promptContext,
  };
}

/**
 * Gets user API key for a specific model if available
 */
export async function getUserApiKeyForModel(
  userId: number,
  model: AIModel,
  useUserApiKey: boolean
): Promise<{
  userApiKey: string | null;
  apiProvider: "openrouter" | "anthropic" | "openai" | "google" | null;
}> {
  if (!useUserApiKey) {
    return { userApiKey: null, apiProvider: null };
  }

  // Try OpenRouter first (most flexible)
  const openRouterKey = await getUserApiKeyByProvider(userId, "openrouter"); // imported from userService
  if (openRouterKey) {
    return {
      userApiKey: openRouterKey.apiKey,
      apiProvider: "openrouter",
    };
  }

  // Try provider-specific key
  const provider = model.provider as "anthropic" | "openai" | "google";
  if (provider === "anthropic" || provider === "openai" || provider === "google") {
    const providerKey = await getUserApiKeyByProvider(userId, provider);
    if (providerKey) {
      return {
        userApiKey: providerKey.apiKey,
        apiProvider: provider,
      };
    }
  }

  return { userApiKey: null, apiProvider: null };
}

/**
 * Validates that a user owns a debate
 */
export async function validateDebateOwnership(
  debateId: number,
  userId: number
): Promise<Debate> {
  const debate = await getDebateById(debateId); // Use local function
  if (!debate) {
    throw new Error("Debate not found");
  }
  if (debate.userId !== userId) {
    throw new Error("Access denied");
  }
  return debate;
}

/**
 * Gets full round context including responses
 */
export async function getRoundContext(roundId: number) {
  const responses = await getResponsesByRoundId(roundId); // Use local function
  return {
    responses,
    previousResponses: formatResponsesForContext(
      responses.map(r => ({
        modelName: r.modelName,
        content: r.content,
        isDevilsAdvocate: r.isDevilsAdvocate,
      }))
    ),
  };
}
