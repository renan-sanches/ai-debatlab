/**
 * Auth Router
 * Handles authentication-related procedures
 *
 * Note: With Supabase Auth, most auth operations happen client-side.
 * This router provides server-side endpoints for session verification.
 */
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const authRouter = router({
  // Get current user from context (populated by Supabase auth in context.ts)
  me: publicProcedure.query(opts => opts.ctx.user),

  // Logout is handled client-side with Supabase, but we provide a server endpoint
  // in case any server-side cleanup is needed
  logout: publicProcedure.mutation(async ({ ctx }) => {
    // With Supabase, logout is handled client-side via supabase.auth.signOut()
    // This endpoint can be used for any server-side cleanup if needed
    return { success: true } as const;
  }),

  // Get account stats for the current user
  accountStats: protectedProcedure.query(async ({ ctx }) => {
    const debates = await db.getDebatesByUserId(ctx.user.id);

    const activeDebates = debates.filter(d => d.status === "active").length;
    const completedDebates = debates.filter(d => d.status === "completed").length;
    const archivedDebates = debates.filter(d => d.status === "archived").length;

    return {
      user: {
        id: ctx.user.id,
        name: ctx.user.name,
        email: ctx.user.email,
        loginMethod: ctx.user.loginMethod,
        createdAt: ctx.user.createdAt,
        lastSignedIn: ctx.user.lastSignedIn,
      },
      stats: {
        totalDebates: debates.length,
        activeDebates,
        completedDebates,
        archivedDebates,
      },
    };
  }),
});
