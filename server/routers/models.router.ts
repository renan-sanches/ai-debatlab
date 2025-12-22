/**
 * Models Router
 * Handles AI model listing, filtering, and favorites
 */
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { AI_MODELS, LEADER_MODELS, openRouterToAIModel, type OpenRouterModel, type AIModel } from "../../shared/models";

export const modelsRouter = router({
  // Get leader models (quick-select bubbles)
  leaders: publicProcedure.query(() => LEADER_MODELS),
  
  // Get all models from OpenRouter API
  all: publicProcedure.query(async () => {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/models");
      const data = await response.json() as { data: OpenRouterModel[] };
      
      // Filter to text-capable models and deduplicate by family
      const models = data.data
        .filter((m: OpenRouterModel) => {
          const inputMods = m.architecture?.input_modalities || [];
          return inputMods.includes("text") && !m.id.includes(":free");
        })
        .map((m: OpenRouterModel) => openRouterToAIModel(m));
      
      return { models, total: models.length };
    } catch (error) {
      console.error("Failed to fetch OpenRouter models:", error);
      return { models: LEADER_MODELS, total: LEADER_MODELS.length };
    }
  }),
  
  // Legacy list endpoint
  list: publicProcedure.query(() => AI_MODELS),
  
  // Get available models based on user's configured API keys
  available: protectedProcedure.query(async ({ ctx }) => {
    const userKeys = await db.getUserApiKeys(ctx.user.id);
    const configuredProviders = userKeys.map(k => k.provider) as Array<"openrouter" | "anthropic" | "openai" | "google">;
    
    // If user has OpenRouter, all models are available
    if (configuredProviders.includes("openrouter")) {
      return {
        models: AI_MODELS,
        hasApiKey: true,
        provider: "openrouter" as const,
      };
    }
    
    // If user has any provider-specific keys, filter models
    if (configuredProviders.length > 0) {
      const availableModels = AI_MODELS.filter((m: AIModel) => {
        if (m.provider === "anthropic" && configuredProviders.includes("anthropic")) return true;
        if (m.provider === "openai" && configuredProviders.includes("openai")) return true;
        if (m.provider === "google" && configuredProviders.includes("google")) return true;
        return false;
      });
      return {
        models: availableModels,
        hasApiKey: true,
        provider: "direct" as const,
        configuredProviders,
      };
    }
    
    // No API keys configured, return all models (will use default billing)
    return {
      models: AI_MODELS,
      hasApiKey: false,
      provider: "default" as const,
    };
  }),
  
  // Get user's favorite models
  favorites: protectedProcedure.query(async ({ ctx }) => {
    return db.getUserFavoriteModels(ctx.user.id);
  }),
  
  // Add a model to favorites
  addFavorite: protectedProcedure
    .input(z.object({
      openRouterId: z.string(),
      modelName: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.addUserFavoriteModel(ctx.user.id, input.openRouterId, input.modelName);
      return { success: true };
    }),
  
  // Remove a model from favorites
  removeFavorite: protectedProcedure
    .input(z.object({ openRouterId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db.removeUserFavoriteModel(ctx.user.id, input.openRouterId);
      return { success: true };
    }),
});

