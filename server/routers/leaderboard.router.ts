/**
 * Leaderboard Router
 * Handles leaderboard data and model statistics
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { getModelById } from "../../shared/models";

export const leaderboardRouter = router({
  // Get leaderboard data
  get: protectedProcedure
    .input(z.object({
      timeFilter: z.enum(["all", "30days", "week", "10debates"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const stats = await db.getLeaderboard(ctx.user.id, input.timeFilter);
      
      // Enrich with model info
      return stats.map((stat, index) => {
        const model = getModelById(stat.modelId);
        return {
          rank: index + 1,
          modelId: stat.modelId,
          modelName: model?.name || stat.modelId,
          modelColor: model?.color || "#888",
          totalPoints: stat.totalPoints,
          totalDebates: stat.totalDebates,
          avgPointsPerDebate: stat.totalDebates > 0 
            ? Math.round((stat.totalPoints / stat.totalDebates) * 10) / 10 
            : 0,
          moderatorPicks: stat.moderatorPicks,
          totalPeerVotes: stat.totalPeerVotes,
          strongArgumentMentions: stat.strongArgumentMentions,
          devilsAdvocateWins: stat.devilsAdvocateWins,
          recentPoints: stat.recentPoints,
        };
      });
    }),

  // Get model performance breakdown
  getModelStats: protectedProcedure
    .input(z.object({ modelId: z.string() }))
    .query(async ({ ctx, input }) => {
      const stat = await db.getModelStatsById(ctx.user.id, input.modelId);
      if (!stat) return null;
      
      const model = getModelById(input.modelId);
      const moderatorPickRate = stat.totalDebates > 0 
        ? Math.round((stat.moderatorPicks / stat.totalDebates) * 100) 
        : 0;

      return {
        modelId: stat.modelId,
        modelName: model?.name || stat.modelId,
        modelColor: model?.color || "#888",
        totalPoints: stat.totalPoints,
        totalDebates: stat.totalDebates,
        moderatorPicks: stat.moderatorPicks,
        moderatorPickRate,
        totalPeerVotes: stat.totalPeerVotes,
        strongArgumentMentions: stat.strongArgumentMentions,
        devilsAdvocateWins: stat.devilsAdvocateWins,
        recentPoints: stat.recentPoints,
      };
    }),

  // Get head-to-head comparison
  headToHead: protectedProcedure
    .input(z.object({
      modelA: z.string(),
      modelB: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // Get all debate results where both models participated
      const results = await db.getHeadToHeadDebateResults(ctx.user.id, input.modelA, input.modelB);
      
      let debatesTogether = 0;
      let modelAModeratorPicks = 0;
      let modelBModeratorPicks = 0;
      let modelAPeerVotes = 0;
      let modelBPeerVotes = 0;
      let modelAPoints = 0;
      let modelBPoints = 0;

      results.forEach(result => {
        const pointsA = result.pointsAwarded?.[input.modelA];
        const pointsB = result.pointsAwarded?.[input.modelB];
        
        if (pointsA && pointsB) {
          debatesTogether++;
          
          if (result.moderatorTopPick === input.modelA || 
              result.moderatorTopPick === getModelById(input.modelA)?.name) {
            modelAModeratorPicks++;
          }
          if (result.moderatorTopPick === input.modelB ||
              result.moderatorTopPick === getModelById(input.modelB)?.name) {
            modelBModeratorPicks++;
          }
          
          modelAPeerVotes += pointsA.peerVotes || 0;
          modelBPeerVotes += pointsB.peerVotes || 0;
          modelAPoints += pointsA.total || 0;
          modelBPoints += pointsB.total || 0;
        }
      });

      const modelA = getModelById(input.modelA);
      const modelB = getModelById(input.modelB);

      return {
        modelA: {
          id: input.modelA,
          name: modelA?.name || input.modelA,
          color: modelA?.color || "#888",
          moderatorPicks: modelAModeratorPicks,
          peerVotes: modelAPeerVotes,
          totalPoints: modelAPoints,
        },
        modelB: {
          id: input.modelB,
          name: modelB?.name || input.modelB,
          color: modelB?.color || "#888",
          moderatorPicks: modelBModeratorPicks,
          peerVotes: modelBPeerVotes,
          totalPoints: modelBPoints,
        },
        debatesTogether,
      };
    }),
});

