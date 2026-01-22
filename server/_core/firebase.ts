import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import { ENV } from "./env";

// Helper to format private key (handle newlines if passed as single string in env)
const formatPrivateKey = (key: string) => {
  return key.replace(/\\n/g, "\n");
};

if (getApps().length === 0) {
  try {
    if (ENV.firebaseProjectId && ENV.firebaseClientEmail && ENV.firebasePrivateKey) {
      initializeApp({
        credential: cert({
          projectId: ENV.firebaseProjectId,
          clientEmail: ENV.firebaseClientEmail,
          privateKey: formatPrivateKey(ENV.firebasePrivateKey),
        }),
        // Optional: storageBucket: `${ENV.firebaseProjectId}.appspot.com`
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
