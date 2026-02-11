import type { Request } from "express";
import * as db from "./db";
import { firebaseAuth } from "./_core/firebase";
import { DecodedIdToken } from "firebase-admin/auth";

/**
 * Extract the access token from the Authorization header or query parameter
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
 * Verify a Firebase ID token and return the decoded token
 */
export async function verifyFirebaseToken(token: string): Promise<DecodedIdToken | null> {
  if (!firebaseAuth) {
      console.warn("[Auth] Firebase Auth not initialized");
      return null;
  }
  try {
    const decodedToken = await firebaseAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error("[Auth] Error verifying token:", error);
    return null;
  }
}

/**
 * Authenticate a request using Firebase
 * Returns the user from our database (creating if needed)
 */
export async function authenticateRequest(req: Request) {
  // Dev mode bypass
  if (process.env.DEV_MODE === "true" && process.env.NODE_ENV === "development") {
    const devUserId = "dev-user-123";
    // NOTE: This assumes db layer has been updated to use firebaseUid
    let user = await db.getUserByFirebaseUid(devUserId);

    if (!user) {
      await db.upsertUser({
        firebaseUid: devUserId,
        name: "Dev User",
        email: "dev@example.com",
        loginMethod: "dev",
        lastSignedIn: new Date(),
      });
      user = await db.getUserByFirebaseUid(devUserId);
    }

    return user;
  }

  // Extract token from request
  const token = extractToken(req);
  if (!token) {
    return null;
  }

  // Verify with Firebase
  const decodedToken = await verifyFirebaseToken(token);
  if (!decodedToken) {
    return null;
  }

  // Get or create user in our database using upsert (ON CONFLICT) to prevent race conditions
  await db.upsertUser({
    firebaseUid: decodedToken.uid,
    name: decodedToken.name || decodedToken.email || "Anonymous",
    email: decodedToken.email || null,
    loginMethod: decodedToken.firebase.sign_in_provider || "unknown",
    lastSignedIn: new Date(),
  });

  return await db.getUserByFirebaseUid(decodedToken.uid);
}
