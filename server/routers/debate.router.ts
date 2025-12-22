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
  buildStandardParticipantPrompt,
  buildDevilsAdvocatePrompt,
  buildVotingPrompt,
  buildModeratorPrompt,
  formatResponsesForContext,
  formatVotesForContext,
} from "../prompts";
import { extractPdfForPrompt } from "../pdfExtractor";

export const debateRouter = router({
  // Create a new debate
  create: protectedProcedure
    .input(z.object({
      question: z.string().min(1),
      participantModels: z.array(z.string()).min(2),
      moderatorModel: z.string(),
      devilsAdvocateEnabled: z.boolean().default(false),
      devilsAdvocateModel: z.string().nullable().default(null),
      votingEnabled: z.boolean().default(false),
      title: z.string().optional(),
      tags: z.array(z.string()).optional(),
      imageUrl: z.string().optional(),
      pdfUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const debateId = await db.createDebate({
        userId: ctx.user.id,
        question: input.question,
        participantModels: input.participantModels,
        moderatorModel: input.moderatorModel,
        devilsAdvocateEnabled: input.devilsAdvocateEnabled,
        devilsAdvocateModel: input.devilsAdvocateModel,
        votingEnabled: input.votingEnabled,
        title: input.title || input.question.slice(0, 100),
        tags: input.tags || [],
        imageUrl: input.imageUrl,
        pdfUrl: input.pdfUrl,
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

      const model = getModelById(input.modelId);
      if (!model) throw new Error("Model not found");

      // Get existing responses in this round
      const existingResponses = await db.getResponsesByRoundId(input.roundId);
      const previousResponses = formatResponsesForContext(
        existingResponses.map(r => ({
          modelName: r.modelName,
          content: r.content,
          isDevilsAdvocate: r.isDevilsAdvocate,
        }))
      );

      // Get round info
      const rounds = await db.getRoundsByDebateId(input.debateId);
      const currentRound = rounds.find(r => r.id === input.roundId);
      const roundNumber = currentRound?.roundNumber || 1;

      // Get previous moderator synthesis if round > 1
      let moderatorSynthesis: string | undefined;
      if (roundNumber > 1) {
        const prevRound = rounds.find(r => r.roundNumber === roundNumber - 1);
        moderatorSynthesis = prevRound?.moderatorSynthesis || undefined;
      }

      // Determine if this model is the devil's advocate
      const isDevilsAdvocate = debate.devilsAdvocateEnabled && debate.devilsAdvocateModel === input.modelId;

      // Extract PDF content if available
      let pdfContent: string | undefined;
      if (debate.pdfUrl) {
        try {
          pdfContent = await extractPdfForPrompt(debate.pdfUrl);
          console.log(`[PDF] Extracted ${pdfContent.length} chars from PDF for debate ${input.debateId}`);
        } catch (error) {
          console.error(`[PDF] Failed to extract PDF content:`, error);
        }
      }

      // Build prompt
      const question = currentRound?.followUpQuestion || debate.question;
      const promptContext = {
        userQuestion: question,
        previousResponses,
        roundNumber,
        moderatorSynthesis,
        modelName: model.name,
        modelLens: model.lens,
        imageUrl: debate.imageUrl || undefined,
        pdfUrl: debate.pdfUrl || undefined,
        pdfContent,
      };

      const prompt = isDevilsAdvocate
        ? buildDevilsAdvocatePrompt(promptContext)
        : buildStandardParticipantPrompt(promptContext);

      // Get user's API key if they want to use their own billing
      let userApiKey: string | null = null;
      let apiProvider: "openrouter" | "anthropic" | "openai" | "google" | null = null;
      
      if (input.useUserApiKey) {
        // Try OpenRouter first (most flexible)
        const openRouterKey = await db.getUserApiKeyByProvider(ctx.user.id, "openrouter");
        if (openRouterKey) {
          userApiKey = openRouterKey.apiKey;
          apiProvider = "openrouter";
        } else {
          // Try provider-specific key
          const providerKey = await db.getUserApiKeyByProvider(ctx.user.id, model.provider as "anthropic" | "openai" | "google");
          if (providerKey) {
            userApiKey = providerKey.apiKey;
            apiProvider = model.provider as "anthropic" | "openai" | "google";
          }
        }
      }

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

      const votes = [];

      for (const modelId of debate.participantModels) {
        const model = getModelById(modelId);
        if (!model) continue;

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
          const openRouterKey = await db.getUserApiKeyByProvider(ctx.user.id, "openrouter");
          if (openRouterKey) {
            userApiKey = openRouterKey.apiKey;
            apiProvider = "openrouter";
          } else {
            const providerKey = await db.getUserApiKeyByProvider(ctx.user.id, model.provider as "anthropic" | "openai" | "google");
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
          /I vote for\s+([^.\n]+)/i,
          /I'm voting for\s+([^.\n]+)/i,
          /best argument.*?:\s*([^.\n]+)/i,
        ];
        
        let votedForName = "";
        for (const pattern of votePatterns) {
          const match = voteContent.match(pattern);
          if (match) {
            votedForName = match[1].trim().replace(/\*+/g, "");
            break;
          }
        }
        
        // Try to find reason with multiple patterns
        const reasonPatterns = [
          /\*\*WHY:\*\*\s*([\s\S]+?)(?=\n\n|$)/i,
          /\*\*REASON:\*\*\s*([\s\S]+?)(?=\n\n|$)/i,
          /WHY:\s*([\s\S]+?)(?=\n\n|$)/i,
          /because\s+([^.]+\.)/i,
        ];
        
        let reason = "";
        for (const pattern of reasonPatterns) {
          const match = voteContent.match(pattern);
          if (match) {
            reason = match[1].trim();
            break;
          }
        }
        
        if (votedForName) {
          // More flexible model matching
          const votedForModel = AI_MODELS.find(m => {
            const nameLower = m.name.toLowerCase();
            const voteLower = votedForName.toLowerCase();
            return nameLower.includes(voteLower) ||
                   voteLower.includes(nameLower) ||
                   voteLower.includes(nameLower.split(" ")[0]) ||
                   nameLower.split(" ")[0] === voteLower.split(" ")[0];
          });

          if (votedForModel && votedForModel.id !== modelId) {
            await db.createVote({
              roundId: input.roundId,
              voterModelId: modelId,
              votedForModelId: votedForModel.id,
              reason: reason || "",
            });

            votes.push({
              voterModelId: modelId,
              votedForModelId: votedForModel.id,
              reason: reason || "",
            });
          }
        }
      }

      return { votes };
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

      const response = await invokeLLMWithModel({
        model: debate.moderatorModel,
        messages: [{ role: "user", content: prompt }],
        userApiKey,
        apiProvider,
      });

      const rawSynthesis = response.choices[0]?.message?.content;
      const synthesis = typeof rawSynthesis === 'string' ? rawSynthesis : "No synthesis generated";

      // Extract suggested follow-up if present
      const followUpMatch = synthesis.match(/(?:suggested follow-up|follow-up question)[:\s]*([^\n]+)/i);
      const suggestedFollowUp = followUpMatch?.[1]?.trim() || null;

      // Update round
      await db.updateRound(input.roundId, {
        moderatorSynthesis: synthesis,
        suggestedFollowUp,
        status: "completed",
      });

      return { synthesis, suggestedFollowUp, usage: response.usage };
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

