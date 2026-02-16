import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import { ENV } from "./env";

// Helper to format private key
// The deploy pipeline base64-encodes the key to preserve newlines through
// gcloud substitutions. This function detects and decodes it, then handles
// escaped newlines for backwards compatibility with raw keys.
const formatPrivateKey = (key: string) => {
  // Try base64 decode first (deployed via pipeline)
  try {
    const decoded = Buffer.from(key, "base64").toString("utf-8");
    if (decoded.includes("PRIVATE KEY")) {
      console.log("[Firebase] Private key decoded from base64");
      return decoded;
    }
  } catch {
    // Not base64, continue
  }
  // Fallback: replace escaped newlines (local dev / raw key)
  return key.replace(/\\n/g, "\n");
};

if (getApps().length === 0) {
  try {
    console.log("[Firebase] projectId:", ENV.firebaseProjectId ? "SET" : "EMPTY");
    console.log("[Firebase] clientEmail:", ENV.firebaseClientEmail ? "SET" : "EMPTY");
    console.log("[Firebase] privateKey length:", ENV.firebasePrivateKey.length, "starts with:", ENV.firebasePrivateKey.substring(0, 10));
    if (ENV.firebaseProjectId && ENV.firebaseClientEmail && ENV.firebasePrivateKey) {
      const storageBucket =
        ENV.firebaseStorageBucket ||
        `${ENV.firebaseProjectId}.firebasestorage.app`;
      initializeApp({
        credential: cert({
          projectId: ENV.firebaseProjectId,
          clientEmail: ENV.firebaseClientEmail,
          privateKey: formatPrivateKey(ENV.firebasePrivateKey),
        }),
        storageBucket,
      });
      console.log("[Firebase] Admin SDK initialized");
    } else {
      console.warn("[Firebase] Missing credentials, Admin SDK not initialized. Check ENV variables.");
    }
  } catch (error) {
    console.error("[Firebase] Initialization error:", error);
  }
}

// Export auth and storage instances
// They will throw if app is not initialized, so we wrap them or access them lazily if needed.
// But for simplicity, we export them directly. If init failed, accessing them might fail.

export const firebaseAuth = getApps().length > 0 ? getAuth() : null;
export const firebaseStorage = getApps().length > 0 ? getStorage() : null;
