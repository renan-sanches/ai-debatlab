import { eq, and } from "drizzle-orm";
import { users, userApiKeys, userFavoriteModels, InsertUser, InsertUserApiKey } from "../../drizzle/schema";
import { getDb } from "../_core/database";
import { encrypt, decrypt, isEncrypted } from '../encryption';

// User functions
export async function upsertUser(user: InsertUser): Promise<void> {
    if (!user.supabaseId) {
        throw new Error("User supabaseId is required for upsert");
    }

    const db = await getDb();
    if (!db) {
        console.warn("[Database] Cannot upsert user: database not available");
        return;
    }

    try {
        // Check if user exists
        const existing = await db.select()
            .from(users)
            .where(eq(users.supabaseId, user.supabaseId))
            .limit(1);

        if (existing.length > 0) {
            // Update existing user
            const updateSet: Partial<InsertUser> = {
                updatedAt: new Date(),
                lastSignedIn: user.lastSignedIn || new Date(),
            };

            if (user.name !== undefined) updateSet.name = user.name;
            if (user.email !== undefined) updateSet.email = user.email;
            if (user.loginMethod !== undefined) updateSet.loginMethod = user.loginMethod;
            if (user.role !== undefined) updateSet.role = user.role;

            await db.update(users)
                .set(updateSet)
                .where(eq(users.supabaseId, user.supabaseId));
        } else {
            // Insert new user
            await db.insert(users).values({
                supabaseId: user.supabaseId,
                name: user.name,
                email: user.email,
                loginMethod: user.loginMethod,
                role: user.role || "user",
                lastSignedIn: user.lastSignedIn || new Date(),
            });
        }
    } catch (error) {
        console.error("[Database] Failed to upsert user:", error);
        throw error;
    }
}

export async function getUserBySupabaseId(supabaseId: string) {
    const db = await getDb();
    if (!db) {
        console.warn("[Database] Cannot get user: database not available");
        return undefined;
    }

    const result = await db.select().from(users).where(eq(users.supabaseId, supabaseId)).limit(1);
    return result.length > 0 ? result[0] : undefined;
}

// User API Key functions
export async function saveUserApiKey(apiKeyData: InsertUserApiKey) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Encrypt the API key before storing
    const encryptedKey = encrypt(apiKeyData.apiKey);

    // Check if key for this provider already exists
    const existing = await db.select()
        .from(userApiKeys)
        .where(and(
            eq(userApiKeys.userId, apiKeyData.userId),
            eq(userApiKeys.provider, apiKeyData.provider)
        ))
        .limit(1);

    if (existing.length > 0) {
        // Update existing key with encrypted value
        await db.update(userApiKeys)
            .set({ apiKey: encryptedKey, isActive: true, updatedAt: new Date() })
            .where(eq(userApiKeys.id, existing[0].id));
        return existing[0].id;
    } else {
        // Insert new key with encrypted value
        const result = await db.insert(userApiKeys).values({
            ...apiKeyData,
            apiKey: encryptedKey,
        }).returning({ id: userApiKeys.id });
        return result[0].id;
    }
}

export async function getUserApiKeys(userId: number) {
    const db = await getDb();
    if (!db) return [];

    const keys = await db.select()
        .from(userApiKeys)
        .where(and(
            eq(userApiKeys.userId, userId),
            eq(userApiKeys.isActive, true)
        ));

    // Decrypt API keys before returning
    return keys.map(key => ({
        ...key,
        apiKey: isEncrypted(key.apiKey) ? decrypt(key.apiKey) : key.apiKey,
    }));
}

export async function getUserApiKeyByProvider(userId: number, provider: "openrouter" | "anthropic" | "openai" | "google") {
    const db = await getDb();
    if (!db) return null;

    const result = await db.select()
        .from(userApiKeys)
        .where(and(
            eq(userApiKeys.userId, userId),
            eq(userApiKeys.provider, provider),
            eq(userApiKeys.isActive, true)
        ))
        .limit(1);

    if (result.length === 0) return null;

    // Decrypt API key before returning
    const key = result[0];
    return {
        ...key,
        apiKey: isEncrypted(key.apiKey) ? decrypt(key.apiKey) : key.apiKey,
    };
}

export async function deleteUserApiKey(userId: number, provider: "openrouter" | "anthropic" | "openai" | "google") {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db.update(userApiKeys)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(
            eq(userApiKeys.userId, userId),
            eq(userApiKeys.provider, provider)
        ));
}

// User Favorite Models functions
export async function getUserFavoriteModels(userId: number) {
    const db = await getDb();
    if (!db) return [];

    return db.select()
        .from(userFavoriteModels)
        .where(eq(userFavoriteModels.userId, userId))
        .orderBy(desc(userFavoriteModels.createdAt));
}

// Need to import desc for getUserFavoriteModels
import { desc } from "drizzle-orm";

export async function addUserFavoriteModel(userId: number, openRouterId: string, modelName: string) {
    const db = await getDb();
    if (!db) return;

    // Check if exists, if so update, otherwise insert
    const existing = await db.select()
        .from(userFavoriteModels)
        .where(and(
            eq(userFavoriteModels.userId, userId),
            eq(userFavoriteModels.openRouterId, openRouterId)
        ))
        .limit(1);

    if (existing.length > 0) {
        await db.update(userFavoriteModels)
            .set({ modelName })
            .where(eq(userFavoriteModels.id, existing[0].id));
    } else {
        await db.insert(userFavoriteModels).values({ userId, openRouterId, modelName });
    }
}

export async function removeUserFavoriteModel(userId: number, openRouterId: string) {
    const db = await getDb();
    if (!db) return;

    await db.delete(userFavoriteModels)
        .where(and(
            eq(userFavoriteModels.userId, userId),
            eq(userFavoriteModels.openRouterId, openRouterId)
        ));
}
