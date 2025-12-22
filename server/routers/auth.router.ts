/**
 * Auth Router
 * Handles authentication-related procedures
 * 
 * Note: With Supabase Auth, most auth operations happen client-side.
 * This router provides server-side endpoints for session verification.
 */
import { publicProcedure, router } from "../_core/trpc";

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
});
