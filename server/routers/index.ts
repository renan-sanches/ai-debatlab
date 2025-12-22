/**
 * Combined Router
 * Merges all domain routers into the main appRouter
 */
import { router } from "../_core/trpc";
import { systemRouter } from "../_core/systemRouter";
import { authRouter } from "./auth.router";
import { modelsRouter } from "./models.router";
import { debateRouter } from "./debate.router";
import { resultsRouter } from "./results.router";
import { leaderboardRouter } from "./leaderboard.router";
import { apiKeysRouter } from "./apiKeys.router";
import { voiceRouter } from "./voice.router";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  models: modelsRouter,
  debate: debateRouter,
  results: resultsRouter,
  leaderboard: leaderboardRouter,
  apiKeys: apiKeysRouter,
  voice: voiceRouter,
});

export type AppRouter = typeof appRouter;

