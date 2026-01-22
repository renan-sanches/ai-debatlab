/**
 * Results Router
 * Handles debate ending and result calculation
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { AI_MODELS, getModelById } from "../../shared/models";
import { invokeLLMWithModel } from "../llmHelper";
import { buildFinalAssessmentPrompt } from "../prompts";
import { extractPdfForPrompt } from "../pdfExtractor";

export const resultsRouter = router({
  // End debate and generate final assessment
  endDebate: protectedProcedure
    .input(z.object({
      debateId: z.number(),
      useUserApiKey: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const debate = await db.getDebateById(input.debateId);
      if (!debate || debate.userId !== ctx.user.id) {
        throw new Error("Debate not found");
      }

      // Get all rounds and their data
      const rounds = await db.getRoundsWithData(input.debateId);
      const allRoundsData = rounds.map(round => ({
        round,
        responses: round.responses,
        votes: round.votes
      }));

      // Build summary of all rounds
      const allRoundsSummary = allRoundsData.map(({ round, responses, votes }) => {
        const question = round.followUpQuestion || debate.question;
        const responseSummary = responses.map(r => 
          `${r.modelName}${r.isDevilsAdvocate ? ' [DA]' : ''}: ${r.content.slice(0, 300)}...`
        ).join('\n\n');
        const voteSummary = votes.map(v => {
          const voterName = getModelById(v.voterModelId)?.name || v.voterModelId;
          const votedForName = getModelById(v.votedForModelId)?.name || v.votedForModelId;
          return `${voterName} voted for ${votedForName}`;
        }).join(', ');
        return `=== Round ${round.roundNumber} ===\nQuestion: ${question}\n\nResponses:\n${responseSummary}\n\nVotes: ${voteSummary || 'None'}\n\nModerator: ${round.moderatorSynthesis?.slice(0, 500) || 'N/A'}...`;
      }).join('\n\n');

      // Calculate total votes across all rounds
      const totalVotes: Record<string, number> = {};
      allRoundsData.forEach(({ votes }) => {
        votes.forEach(v => {
          const modelName = getModelById(v.votedForModelId)?.name || v.votedForModelId;
          totalVotes[modelName] = (totalVotes[modelName] || 0) + 1;
        });
      });

      // Get participant model names
      const participantModels = debate.participantModels.map(id => getModelById(id)?.name || id);
      const devilsAdvocateModel = debate.devilsAdvocateModel 
        ? getModelById(debate.devilsAdvocateModel)?.name 
        : undefined;

      // Extract PDF content if available
      let pdfContent: string | undefined;
      if (debate.pdfUrl) {
        try {
          pdfContent = await extractPdfForPrompt(debate.pdfUrl);
        } catch (error) {
          console.error(`[PDF] Failed to extract PDF content for final assessment:`, error);
        }
      }

      // Build final assessment prompt
      const prompt = buildFinalAssessmentPrompt({
        userQuestion: debate.question,
        allRoundsSummary,
        totalVotes,
        participantModels,
        devilsAdvocateModel,
        imageUrl: debate.imageUrl || undefined,
        pdfUrl: debate.pdfUrl || undefined,
        pdfContent,
      });

      // Get moderator model
      const moderatorModel = getModelById(debate.moderatorModel);
      if (!moderatorModel) throw new Error("Moderator model not found");

      // Get user's API key if needed
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

      // Generate final assessment
      const response = await invokeLLMWithModel({
        model: debate.moderatorModel,
        messages: [{ role: "user", content: prompt }],
        userApiKey,
        apiProvider,
      });

      const rawAssessment = response.choices[0]?.message?.content;
      const finalAssessment = typeof rawAssessment === 'string' ? rawAssessment : "No assessment generated";

      // Parse the assessment to extract winner and other info
      const winnerMatch = finalAssessment.match(/\*\*Winner:\s*([^*\n]+)\*\*/i);
      const moderatorTopPick = winnerMatch?.[1]?.trim() || null;
      
      // Extract synthesis
      const synthesisMatch = finalAssessment.match(/##\s*💡\s*SYNTHESIS[\s\S]*?(?=##|$)/i);
      const synthesis = synthesisMatch?.[0]?.replace(/##\s*💡\s*SYNTHESIS\s*/i, '').trim() || null;

      // Check devil's advocate success
      const daSuccessMatch = finalAssessment.match(/impact:\s*(strong)/i);
      const devilsAdvocateSuccess = !!daSuccessMatch;

      // Extract models mentioned in strongest arguments
      const strongestArguments: string[] = [];
      participantModels.forEach(model => {
        if (finalAssessment.toLowerCase().includes(model.toLowerCase())) {
          strongestArguments.push(model);
        }
      });

      // Calculate points
      const pointsAwarded: Record<string, {
        total: number;
        moderatorPick: number;
        peerVotes: number;
        strongArguments: number;
        devilsAdvocateBonus: number;
      }> = {};

      // Initialize points for all participants
      participantModels.forEach(model => {
        pointsAwarded[model] = {
          total: 0,
          moderatorPick: 0,
          peerVotes: 0,
          strongArguments: 0,
          devilsAdvocateBonus: 0,
        };
      });

      // Award moderator's top pick: 3 points
      if (moderatorTopPick && pointsAwarded[moderatorTopPick]) {
        pointsAwarded[moderatorTopPick].moderatorPick = 3;
        pointsAwarded[moderatorTopPick].total += 3;
      }

      // Award peer votes: 1 point each
      Object.entries(totalVotes).forEach(([model, votes]) => {
        if (pointsAwarded[model]) {
          pointsAwarded[model].peerVotes = votes;
          pointsAwarded[model].total += votes;
        }
      });

      // Award strong arguments mention: 1 point
      strongestArguments.forEach(model => {
        if (pointsAwarded[model]) {
          pointsAwarded[model].strongArguments = 1;
          pointsAwarded[model].total += 1;
        }
      });

      // Award devil's advocate bonus: 1 point if successful
      if (devilsAdvocateSuccess && devilsAdvocateModel && pointsAwarded[devilsAdvocateModel]) {
        pointsAwarded[devilsAdvocateModel].devilsAdvocateBonus = 1;
        pointsAwarded[devilsAdvocateModel].total += 1;
      }

      // Convert model names to IDs for storage
      const peerVotesById: Record<string, number> = {};
      Object.entries(totalVotes).forEach(([modelName, votes]) => {
        const model = AI_MODELS.find(m => m.name === modelName);
        if (model) peerVotesById[model.id] = votes;
      });

      // Save debate result
      await db.saveDebateResult({
        debateId: input.debateId,
        userId: ctx.user.id,
        finalAssessment,
        synthesis,
        moderatorTopPick,
        moderatorReasoning: winnerMatch ? finalAssessment.match(/\*\*Why:\*\*\s*([^\n]+)/i)?.[1]?.trim() || null : null,
        peerVotes: peerVotesById,
        strongestArguments: strongestArguments.map(name => AI_MODELS.find(m => m.name === name)?.id || name),
        devilsAdvocateSuccess,
        pointsAwarded: Object.fromEntries(
          Object.entries(pointsAwarded).map(([name, points]) => {
            const model = AI_MODELS.find(m => m.name === name);
            return [model?.id || name, points];
          })
        ),
        roundCount: rounds.length,
        topicTags: debate.tags || [],
      });

      // Update model stats for leaderboard
      for (const [modelName, points] of Object.entries(pointsAwarded)) {
        const model = AI_MODELS.find(m => m.name === modelName);
        if (model) {
          await db.upsertModelStats(ctx.user.id, model.id, points);
        }
      }

      // Mark debate as completed
      await db.updateDebate(input.debateId, { status: "completed" });

      return {
        finalAssessment,
        synthesis,
        moderatorTopPick,
        peerVotes: totalVotes,
        strongestArguments,
        devilsAdvocateSuccess,
        pointsAwarded,
        usage: response.usage,
      };
    }),

  // Get debate result
  getResult: protectedProcedure
    .input(z.object({ debateId: z.number() }))
    .query(async ({ ctx, input }) => {
      const result = await db.getDebateResult(input.debateId);
      if (!result || result.userId !== ctx.user.id) {
        return null;
      }
      return result;
    }),
});

