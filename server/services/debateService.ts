/**
 * Debate Service
 * Shared logic for preparing debate prompts and context
 * Used by both debate router and streaming routes
 */
import * as db from "../db";
import { getModelById, type AIModel } from "../../shared/models";
import {
  buildStandardParticipantPrompt,
  buildDevilsAdvocatePrompt,
  formatResponsesForContext,
} from "../prompts";
import { extractPdfForPrompt } from "../pdfExtractor";
import type { Debate, Round, Response } from "../../drizzle/schema";

// Re-export PromptContext from prompts.ts for consistency
import type { PromptContext } from "../prompts";
export type { PromptContext };

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
  const previousResponses = formatResponsesForContext(
    existingResponses.map(r => ({
      modelName: r.modelName,
      content: r.content,
      isDevilsAdvocate: r.isDevilsAdvocate,
    }))
  );

  // Get round info
  const rounds = await db.getRoundsByDebateId(debate.id);
  const currentRound = rounds.find(r => r.id === roundId);
  const roundNumber = currentRound?.roundNumber || 1;

  // Get previous moderator synthesis if round > 1
  let moderatorSynthesis: string | undefined;
  if (roundNumber > 1) {
    const prevRound = rounds.find(r => r.roundNumber === roundNumber - 1);
    moderatorSynthesis = prevRound?.moderatorSynthesis || undefined;
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
  const openRouterKey = await db.getUserApiKeyByProvider(userId, "openrouter");
  if (openRouterKey) {
    return {
      userApiKey: openRouterKey.apiKey,
      apiProvider: "openrouter",
    };
  }

  // Try provider-specific key
  const provider = model.provider as "anthropic" | "openai" | "google";
  if (provider === "anthropic" || provider === "openai" || provider === "google") {
    const providerKey = await db.getUserApiKeyByProvider(userId, provider);
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
  const debate = await db.getDebateById(debateId);
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
  const responses = await db.getResponsesByRoundId(roundId);
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

