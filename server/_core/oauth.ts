/**
 * OAuth Routes (Deprecated)
 *
 * With Firebase Auth, OAuth is now handled client-side.
 * This file is kept for backwards compatibility but the routes are no longer functional.
 *
 * The auth flow now works as follows:
 * 1. Client initiates OAuth via Firebase JS SDK
 * 2. User is redirected to provider (Google, GitHub, etc.)
 * 3. Firebase handles token exchange automatically
 * 4. Client sends access token in Authorization header for API calls
 */
import type { Express, Request, Response } from "express";

export function registerOAuthRoutes(app: Express) {
  // Legacy route - redirect to client-side login
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    // With Firebase, OAuth callbacks are handled by the client
    // Redirect to the client-side auth callback handler
    const params = new URLSearchParams(req.query as Record<string, string>);
    res.redirect(302, `/auth/callback?${params.toString()}`);
  });
}
