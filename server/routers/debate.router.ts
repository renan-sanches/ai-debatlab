/**
 * Debate Router
 * Handles debate CRUD operations and AI response generation
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { AI_MODELS, getModelById } from "../../shared/models";
import { invokeLLMWithModel } from "../llmHelper";
import {
  buildVotingPrompt,
  buildModeratorPrompt,
  buildDiscourseAnalyticsPrompt,
  formatResponsesForContext,
  formatVotesForContext,
} from "../prompts";
import { extractPdfForPrompt } from "../pdfExtractor";
import { assignRandomAvatars } from "../config/avatarConfig";
import { evaluateResponse } from "../services/scoringService";
import { asyncPool } from "../utils";
import { prepareDebatePrompt, getUserApiKeyForModel } from "../services/debateService";

/**
 * Generate a short, descriptive title for a debate question
 * Uses GPT-4o for fast, reliable title generation
 */
async function generateDebateTitle(question: string): Promise<string> {
  try {
    const response = await invokeLLMWithModel({
      model: "gpt-4o", // Fast and reliable model
      messages: [
        {
          role: "system",
          content: "You are a title generator. Generate a short, concise title (3-8 words) that summarizes the main topic of the debate question. Return ONLY the title, no quotes, no punctuation at the end, no explanation.",
        },
        {
          role: "user",
          content: `Generate a short title for this debate question:\n\n${question}`,
        },
      ],
      maxTokens: 50,
    });

    const rawTitle = response.choices[0]?.message?.content;
    if (typeof rawTitle === "string" && rawTitle.trim().length > 0) {
      // Clean up the title: remove quotes, trim, limit length
      return rawTitle.trim().replace(/^["']|["']$/g, "").slice(0, 100);
    }
  } catch (error) {
    console.error("[Title Generation] Failed to generate title:", error);
  }

  // Fallback: use first 50 chars of question
  return question.slice(0, 50) + (question.length > 50 ? "..." : "");
}

export const debateRouter = router({
  // Create a new debate
  create: protectedProcedure
    .input(z.object({
      question: z.string().min(1).max(10000),
      participantModels: z.array(z.string()).min(2).max(20),
      moderatorModel: z.string(),
      devilsAdvocateEnabled: z.boolean().default(false),
      devilsAdvocateModel: z.string().nullable().default(null),
      votingEnabled: z.boolean().default(false),
      isBlindMode: z.boolean().default(false),
      title: z.string().optional(),
      tags: z.array(z.string()).optional(),
      imageUrl: z.string().optional(),
      pdfUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Generate AI title if not provided
      const title = input.title || await generateDebateTitle(input.question);

      // Assign random avatars to participant models
      const modelAvatars = assignRandomAvatars(input.participantModels);

      const debateId = await db.createDebate({
        userId: ctx.user.id,
        question: input.question,
        participantModels: input.participantModels,
        moderatorModel: input.moderatorModel,
        devilsAdvocateEnabled: input.devilsAdvocateEnabled,
        devilsAdvocateModel: input.devilsAdvocateModel,
        votingEnabled: input.votingEnabled,
        isBlindMode: input.isBlindMode,
        title,
        tags: input.tags || [],
        imageUrl: input.imageUrl,
        pdfUrl: input.pdfUrl,
        modelAvatars,
      });

      // Create first round
      const roundId = await db.createRound({
        debateId,
        roundNumber: 1,
      });

      return { debateId, roundId };
    }),

  // Get debate by ID
  get: protectedProcedure
    .input(z.object({ debateId: z.number() }))
    .query(async ({ ctx, input }) => {
      const debate = await db.getFullDebateData(input.debateId);
      if (!debate || debate.userId !== ctx.user.id) {
        return null;
      }
      return debate;
    }),

  // List user's debates (library)
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getDebatesByUserId(ctx.user.id);
  }),

  // Update debate metadata
  update: protectedProcedure
    .input(z.object({
      debateId: z.number(),
      title: z.string().optional(),
      tags: z.array(z.string()).optional(),
      status: z.enum(["active", "completed", "archived"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const debate = await db.getDebateById(input.debateId);
      if (!debate || debate.userId !== ctx.user.id) {
        throw new Error("Debate not found");
      }
      await db.updateDebate(input.debateId, {
        title: input.title,
        tags: input.tags,
        status: input.status,
      });
      return { success: true };
    }),

  // Delete debate
  delete: protectedProcedure
    .input(z.object({ debateId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const debate = await db.getDebateById(input.debateId);
      if (!debate || debate.userId !== ctx.user.id) {
        throw new Error("Debate not found");
      }
      await db.deleteDebate(input.debateId);
      return { success: true };
    }),

  // Regenerate title using AI
  regenerateTitle: protectedProcedure
    .input(z.object({ debateId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const debate = await db.getDebateById(input.debateId);
      if (!debate || debate.userId !== ctx.user.id) {
        throw new Error("Debate not found");
      }

      const newTitle = await generateDebateTitle(debate.question);
      await db.updateDebate(input.debateId, { title: newTitle });

      return { title: newTitle };
    }),

  // Upload image for debate
  uploadImage: protectedProcedure
    .input(z.object({
      imageData: z.string(), // Base64 encoded image
      mimeType: z.string(),
      extension: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { storagePut } = await import("../storage");
      const { nanoid } = await import("nanoid");

      const buffer = Buffer.from(input.imageData, "base64");
      const fileKey = `debates/${ctx.user.id}/${nanoid()}.${input.extension}`;

      const { url } = await storagePut(fileKey, buffer, input.mimeType);
      return { url };
    }),

  // Generate AI response for a participant
  generateResponse: protectedProcedure
    .input(z.object({
      debateId: z.number(),
      roundId: z.number(),
      modelId: z.string(),
      responseOrder: z.number(),
      useUserApiKey: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const debate = await db.getDebateById(input.debateId);
      if (!debate || debate.userId !== ctx.user.id) {
        throw new Error("Debate not found");
      }

      // Get existing responses in this round
      const existingResponses = await db.getResponsesByRoundId(input.roundId);

      // Prepare prompt using shared service
      const { prompt, isDevilsAdvocate, model, promptContext } = await prepareDebatePrompt({
        debate,
        roundId: input.roundId,
        modelId: input.modelId,
        existingResponses,
      });

      // Get user's API key if they want to use their own billing
      const { userApiKey, apiProvider } = await getUserApiKeyForModel(
        ctx.user.id,
        model,
        input.useUserApiKey || false
      );

      // Call LLM
      const response = await invokeLLMWithModel({
        model: input.modelId,
        messages: [
          { role: "user", content: prompt },
        ],
        userApiKey,
        apiProvider,
      });

      const rawContent = response.choices[0]?.message?.content;
      const content = typeof rawContent === 'string' ? rawContent : "No response generated";

      // Save response
      const responseId = await db.createResponse({
        roundId: input.roundId,
        debateId: input.debateId,
        modelId: input.modelId,
        modelName: model.name,
        content,
        isDevilsAdvocate,
        responseOrder: input.responseOrder,
      });

      // Trigger async scoring
      if (model) {
        evaluateResponse(responseId, content, promptContext.userQuestion, model.name).catch(e =>
          console.error("[Scoring Trigger Failed]", e)
        );
      }

      return {
        id: responseId,
        modelId: input.modelId,
        modelName: model.name,
        content,
        isDevilsAdvocate,
        responseOrder: input.responseOrder,
        usage: response.usage,
      };
    }),

  // Generate voting for all participants
  generateVotes: protectedProcedure
    .input(z.object({
      debateId: z.number(),
      roundId: z.number(),
      useUserApiKey: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const debate = await db.getDebateById(input.debateId);
      if (!debate || debate.userId !== ctx.user.id) {
        throw new Error("Debate not found");
      }

      if (!debate.votingEnabled) {
        return { votes: [] };
      }

      const responses = await db.getResponsesByRoundId(input.roundId);
      const allResponses = formatResponsesForContext(
        responses.map(r => ({
          modelName: r.modelName,
          content: r.content,
          isDevilsAdvocate: r.isDevilsAdvocate,
        }))
      );

      const rounds = await db.getRoundsByDebateId(input.debateId);
      const currentRound = rounds.find(r => r.id === input.roundId);
      const question = currentRound?.followUpQuestion || debate.question;
      // Build a map of all participant models for matching
      const participantModelsMap = debate.participantModels.map(id => {
        const m = getModelById(id);
        return { id, name: m?.name || id, model: m };
      });

      // Pre-fetch user keys if needed, to avoid race conditions or repeated DB calls in the loop
      const userKeys = input.useUserApiKey ? await db.getUserApiKeys(ctx.user.id) : [];

      const processVote = async (modelId: string) => {
        const model = getModelById(modelId);
        if (!model) return null;

        const prompt = buildVotingPrompt({
          userQuestion: question,
          previousResponses: "",
          roundNumber: currentRound?.roundNumber || 1,
          modelName: model.name,
          modelLens: model.lens,
          allParticipantResponses: allResponses,
        });

        // Get user's API key if they want to use their own billing
        let userApiKey: string | null = null;
        let apiProvider: "openrouter" | "anthropic" | "openai" | "google" | null = null;

        if (input.useUserApiKey) {
          const openRouterKey = userKeys.find((k: { provider: string }) => k.provider === "openrouter");
          if (openRouterKey) {
            userApiKey = openRouterKey.apiKey;
            apiProvider = "openrouter";
          } else {
            const providerKey = userKeys.find((k: { provider: string }) => k.provider === model.provider);
            if (providerKey) {
              userApiKey = providerKey.apiKey;
              apiProvider = model.provider as "anthropic" | "openai" | "google";
            }
          }
        }

        const response = await invokeLLMWithModel({
          model: modelId,
          messages: [{ role: "user", content: prompt }],
          userApiKey,
          apiProvider,
        });

        const rawVoteContent = response.choices[0]?.message?.content;
        const voteContent = typeof rawVoteContent === 'string' ? rawVoteContent : "";

        // Parse vote from response - handle multiple formats
        const votePatterns = [
          /\*\*MY VOTE:\s*([^*\n]+)\*\*/i,
          /\*\*MY VOTE:\*\*\s*([^\n*]+)/i,
          /MY VOTE:\s*([^\n]+)/i,
          /I vote for\s+([^.\n,]+)/i,
          /I'm voting for\s+([^.\n,]+)/i,
          /I cast my vote for\s+([^.\n,]+)/i,
          /my vote goes to\s+([^.\n,]+)/i,
          /voting for\s+([^.\n,]+)/i,
          /best argument.*?:\s*([^.\n,]+)/i,
          /strongest argument.*?:\s*([^.\n,]+)/i,
          /winner.*?:\s*([^.\n,]+)/i,
          /I choose\s+([^.\n,]+)/i,
          /I select\s+([^.\n,]+)/i,
        ];

        let votedForName = "";
        for (const pattern of votePatterns) {
          const match = voteContent.match(pattern);
          if (match) {
            votedForName = match[1].trim().replace(/\*+/g, "").replace(/^["']|["']$/g, "");
            break;
          }
        }

        // Try to find reason with multiple patterns
        const reasonPatterns = [
          /\*\*WHY:\*\*\s*([\s\S]+?)(?=\n\n|$)/i,
          /\*\*REASON:\*\*\s*([\s\S]+?)(?=\n\n|$)/i,
          /WHY:\s*([\s\S]+?)(?=\n\n|$)/i,
          /REASON:\s*([\s\S]+?)(?=\n\n|$)/i,
          /because\s+([^.]+\.)/i,
          /Their argument\s+([^.]+\.)/i,
        ];

        let reason = "";
        for (const pattern of reasonPatterns) {
          const match = voteContent.match(pattern);
          if (match) {
            reason = match[1].trim();
            break;
          }
        }

        // If no explicit pattern matched, use the first sentence as reason
        if (!reason && voteContent.length > 0) {
          const firstSentence = voteContent.match(/^[^.!?]+[.!?]/);
          if (firstSentence) {
            reason = firstSentence[0].trim();
          }
        }

        if (votedForName) {
          // More flexible model matching - check against all participants
          const voteLower = votedForName.toLowerCase();

          // First try exact or close matches with participant models
          let votedForParticipant = participantModelsMap.find(p => {
            const nameLower = p.name.toLowerCase();
            // Exact match
            if (nameLower === voteLower) return true;
            // Name contains vote
            if (nameLower.includes(voteLower)) return true;
            // Vote contains name
            if (voteLower.includes(nameLower)) return true;
            // First word matches
            if (nameLower.split(/[\s-]/)[0] === voteLower.split(/[\s-]/)[0]) return true;
            // Check if vote contains key part of model name (e.g., "Gemini" in "Gemini 2.5 Pro")
            const nameWords = nameLower.split(/[\s-]+/);
            const voteWords = voteLower.split(/[\s-]+/);
            return nameWords.some(w => w.length > 3 && voteWords.includes(w)) ||
              voteWords.some(w => w.length > 3 && nameWords.includes(w));
          });

          // If no participant match, try AI_MODELS as fallback
          if (!votedForParticipant) {
            const aiModel = AI_MODELS.find(m => {
              const nameLower = m.name.toLowerCase();
              return nameLower.includes(voteLower) ||
                voteLower.includes(nameLower) ||
                nameLower.split(/[\s-]/)[0] === voteLower.split(/[\s-]/)[0];
            });
            if (aiModel) {
              votedForParticipant = { id: aiModel.id, name: aiModel.name, model: aiModel };
            }
          }

          if (votedForParticipant && votedForParticipant.id !== modelId) {
            // Return vote object for batch insertion
            return {
              roundId: input.roundId,
              voterModelId: modelId,
              votedForModelId: votedForParticipant.id,
              reason: reason || voteContent.slice(0, 200),
            };
          }
        }
        return null;
      };

      const poolResults = await asyncPool(5, debate.participantModels, processVote);

      const votesToInsert = poolResults
        .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled" && r.value != null)
        .map(r => r.value);

      if (votesToInsert.length > 0) {
        await db.createVotes(votesToInsert);
      }

      return { votes: votesToInsert };
    }),

  // Generate moderator synthesis
  generateModeratorSynthesis: protectedProcedure
    .input(z.object({
      debateId: z.number(),
      roundId: z.number(),
      useUserApiKey: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const debate = await db.getDebateById(input.debateId);
      if (!debate || debate.userId !== ctx.user.id) {
        throw new Error("Debate not found");
      }

      const moderatorModel = getModelById(debate.moderatorModel);
      if (!moderatorModel) throw new Error("Moderator model not found");

      const responses = await db.getResponsesByRoundId(input.roundId);
      const allResponses = formatResponsesForContext(
        responses.map(r => ({
          modelName: r.modelName,
          content: r.content,
          isDevilsAdvocate: r.isDevilsAdvocate,
        }))
      );

      const rounds = await db.getRoundsByDebateId(input.debateId);
      const currentRound = rounds.find(r => r.id === input.roundId);
      const question = currentRound?.followUpQuestion || debate.question;

      // Get votes if enabled
      let votingResults: string | undefined;
      if (debate.votingEnabled) {
        const votes = await db.getVotesByRoundId(input.roundId);
        const modelMap: Record<string, string> = {};
        AI_MODELS.forEach(m => { modelMap[m.id] = m.name; });
        votingResults = formatVotesForContext(votes, modelMap);
      }

      // Extract PDF content if available
      let pdfContent: string | undefined;
      if (debate.pdfUrl) {
        try {
          pdfContent = await extractPdfForPrompt(debate.pdfUrl);
        } catch (error) {
          console.error(`[PDF] Failed to extract PDF content for moderator:`, error);
        }
      }

      const prompt = buildModeratorPrompt({
        userQuestion: question,
        previousResponses: "",
        roundNumber: currentRound?.roundNumber || 1,
        modelName: moderatorModel.name,
        modelLens: moderatorModel.lens,
        allParticipantResponses: allResponses,
        votingResults,
        listOfModels: debate.participantModels.map(id => getModelById(id)?.name || id),
        imageUrl: debate.imageUrl || undefined,
        pdfUrl: debate.pdfUrl || undefined,
        pdfContent,
      });

      // Get user's API key if they want to use their own billing
      let userApiKey: string | null = null;
      let apiProvider: "openrouter" | "anthropic" | "openai" | "google" | null = null;

      if (input.useUserApiKey) {
        const openRouterKey = await db.getUserApiKeyByProvider(ctx.user.id, "openrouter");
        if (openRouterKey) {
          userApiKey = openRouterKey.apiKey;
          apiProvider = "openrouter";
        } else {
          const providerKey = await db.getUserApiKeyByProvider(ctx.user.id, moderatorModel.provider as "anthropic" | "openai" | "google");
          if (providerKey) {
            userApiKey = providerKey.apiKey;
            apiProvider = moderatorModel.provider as "anthropic" | "openai" | "google";
          }
        }
      }

      // Build analytics prompt
      const analyticsPrompt = buildDiscourseAnalyticsPrompt({
        userQuestion: question,
        previousResponses: "",
        roundNumber: currentRound?.roundNumber || 1,
        modelName: moderatorModel.name,
        modelLens: "Analyst",
        allParticipantResponses: allResponses,
        pdfContent,
      });

      // Execute both requests in parallel
      const [synthesisResponse, analyticsResponse] = await Promise.all([
        invokeLLMWithModel({
          model: debate.moderatorModel,
          messages: [{ role: "user", content: prompt }],
          userApiKey,
          apiProvider,
        }),
        invokeLLMWithModel({
          model: "openai/gpt-4o-mini", // Use a fast, smart model for analytics JSON
          messages: [{ role: "user", content: analyticsPrompt }],
          // Use same API key strategy if applicable, or fallback to system
          // For simplicity, we'll try to use the user's key if it works for OpenAI, otherwise system
          userApiKey: apiProvider === "openai" ? userApiKey : undefined,
          apiProvider: apiProvider === "openai" ? "openai" : undefined,
        }).catch(err => {
          console.error("Failed to generate analytics:", err);
          return { choices: [], usage: undefined }; // Return empty on fail so synthesis still succeeds
        })
      ]);

      const rawSynthesis = synthesisResponse.choices[0]?.message?.content;
      const synthesis = typeof rawSynthesis === 'string' ? rawSynthesis : "No synthesis generated";

      // Process analytics
      let discourseAnalytics = null;
      try {
        const rawAnalytics = analyticsResponse.choices?.[0]?.message?.content;
        if (rawAnalytics) {
          // clean markdown code blocks if present
          const jsonStr = rawAnalytics.replace(/```json\n?|\n?```/g, "").trim();
          discourseAnalytics = JSON.parse(jsonStr);
        }
      } catch (e) {
        console.error("Failed to parse analytics JSON:", e);
      }

      // Extract suggested follow-up if present
      const followUpMatch = synthesis.match(/(?:suggested follow-up|follow-up question)[:\s]*([^\n]+)/i);
      const suggestedFollowUp = followUpMatch?.[1]?.trim() || null;

      // Update round
      await db.updateRound(input.roundId, {
        moderatorSynthesis: synthesis,
        suggestedFollowUp,
        discourseAnalytics,
        status: "completed",
      });

      // Combine usage
      const totalUsage = {
        totalTokens: (synthesisResponse.usage?.totalTokens || 0) + (analyticsResponse.usage?.totalTokens || 0),
        estimatedCost: (synthesisResponse.usage?.estimatedCost || 0) + (analyticsResponse.usage?.estimatedCost || 0),
      };

      return { synthesis, suggestedFollowUp, discourseAnalytics, usage: totalUsage };
    }),

  // Start a new round with follow-up question
  startNewRound: protectedProcedure
    .input(z.object({
      debateId: z.number(),
      followUpQuestion: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const debate = await db.getDebateById(input.debateId);
      if (!debate || debate.userId !== ctx.user.id) {
        throw new Error("Debate not found");
      }

      const rounds = await db.getRoundsByDebateId(input.debateId);
      const newRoundNumber = rounds.length + 1;

      const roundId = await db.createRound({
        debateId: input.debateId,
        roundNumber: newRoundNumber,
        followUpQuestion: input.followUpQuestion,
      });

      return { roundId, roundNumber: newRoundNumber };
    }),
});

