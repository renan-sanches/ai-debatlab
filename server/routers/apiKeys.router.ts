/**
 * API Keys Router
 * Handles user API key management
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const apiKeysRouter = router({
  // List user's configured API keys (masked)
  list: protectedProcedure.query(async ({ ctx }) => {
    const keys = await db.getUserApiKeys(ctx.user.id);
    return keys.map(k => ({
      id: k.id,
      provider: k.provider,
      // Mask the API key, showing only last 4 characters
      maskedKey: `****${k.apiKey.slice(-4)}`,
      isActive: k.isActive,
      createdAt: k.createdAt,
    }));
  }),

  // Save or update an API key
  save: protectedProcedure
    .input(z.object({
      provider: z.enum(["openrouter", "anthropic", "openai", "google"]),
      apiKey: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.saveUserApiKey({
        userId: ctx.user.id,
        provider: input.provider,
        apiKey: input.apiKey,
      });
      return { success: true };
    }),

  // Delete an API key
  delete: protectedProcedure
    .input(z.object({
      provider: z.enum(["openrouter", "anthropic", "openai", "google"]),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteUserApiKey(ctx.user.id, input.provider);
      return { success: true };
    }),

  // Check if user has a specific provider configured
  hasProvider: protectedProcedure
    .input(z.object({
      provider: z.enum(["openrouter", "anthropic", "openai", "google"]),
    }))
    .query(async ({ ctx, input }) => {
      const key = await db.getUserApiKeyByProvider(ctx.user.id, input.provider);
      return { hasKey: !!key };
    }),
});

