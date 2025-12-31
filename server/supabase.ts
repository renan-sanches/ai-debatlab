import { createClient } from "@supabase/supabase-js";
import type { Request } from "express";
import * as db from "./db";

// Server-side Supabase client
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("[Supabase] Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Extract the access token from the Authorization header or query parameter
 * Query parameter is needed for SSE (EventSource) which cannot send custom headers
 */
function extractToken(req: Request): string | null {
  // First try Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  // Fallback to query parameter (for SSE/EventSource)
  const queryToken = req.query.token as string;
  if (queryToken) {
    return queryToken;
  }

  return null;
}

/**
 * Verify a Supabase JWT token and return the user
 */
export async function verifySupabaseToken(token: string) {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error("[Supabase Auth] Token verification failed:", error?.message);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error("[Supabase Auth] Error verifying token:", error);
    return null;
  }
}

/**
 * Authenticate a request using Supabase
 * Returns the user from our database (creating if needed)
 */
export async function authenticateRequest(req: Request) {
  // Dev mode bypass
  if (process.env.DEV_MODE === "true" && process.env.NODE_ENV === "development") {
    const devUserId = "dev-user-123";
    let user = await db.getUserBySupabaseId(devUserId);
    
    if (!user) {
      await db.upsertUser({
        supabaseId: devUserId,
        name: "Dev User",
        email: "dev@example.com",
        loginMethod: "dev",
        lastSignedIn: new Date(),
      });
      user = await db.getUserBySupabaseId(devUserId);
    }
    
    return user;
  }

  // Extract token from request
  const token = extractToken(req);
  if (!token) {
    return null;
  }

  // Verify with Supabase
  const supabaseUser = await verifySupabaseToken(token);
  if (!supabaseUser) {
    return null;
  }

  // Get or create user in our database
  let user = await db.getUserBySupabaseId(supabaseUser.id);
  
  if (!user) {
    // Create user in our database
    await db.upsertUser({
      supabaseId: supabaseUser.id,
      name: supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name || null,
      email: supabaseUser.email || null,
      loginMethod: supabaseUser.app_metadata?.provider || "email",
      lastSignedIn: new Date(),
    });
    user = await db.getUserBySupabaseId(supabaseUser.id);
  } else {
    // Update last signed in
    await db.upsertUser({
      supabaseId: supabaseUser.id,
      lastSignedIn: new Date(),
    });
  }

  return user;
}

/**
 * Get the Supabase user from a request (without creating in DB)
 */
export async function getSupabaseUser(req: Request) {
  const token = extractToken(req);
  if (!token) {
    return null;
  }
  return verifySupabaseToken(token);
}

