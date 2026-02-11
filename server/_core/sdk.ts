/**
 * SDK Server (Deprecated)
 *
 * This file previously handled Manus OAuth authentication.
 * With the migration to Firebase Auth, use the following instead:
 *
 * - For authentication: import { authenticateRequest } from "../auth"
 * - For user lookup: import { getUserByFirebaseUid } from "../services/userService"
 *
 * This file is kept for reference only and should be removed once all
 * legacy code has been migrated.
 */

import type { Request } from "express";
import type { User } from "../../drizzle/schema";
import { authenticateRequest } from "../auth";

// Legacy type - kept for backwards compatibility
export type SessionPayload = {
  openId: string;
  appId: string;
  name: string;
};

/**
 * @deprecated Use authenticateRequest from "../auth" instead
 */
class SDKServer {
  /**
   * @deprecated Use authenticateRequest from "../auth" instead
   */
  async authenticateRequest(req: Request): Promise<User> {
    const user = await authenticateRequest(req);
    if (!user) {
      throw new Error("Authentication required");
    }
    return user;
  }
}

export const sdk = new SDKServer();
