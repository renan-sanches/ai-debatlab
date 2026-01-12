import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { ENV } from "./env";

let _db: ReturnType<typeof drizzle> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

export async function getDb() {
    if (!_db && ENV.databaseUrl) {
        try {
            _client = postgres(ENV.databaseUrl);
            _db = drizzle(_client);
            console.log("[Database] Connected to PostgreSQL");
        } catch (error) {
            console.warn("[Database] Failed to connect:", error);
            _db = null;
        }
    }

    if (!_db) {
        // Attempt fallback if ENV wasn't ready (though it should be)
        // or just return null and let caller handle it
        if (process.env.DATABASE_URL && !_client) {
            try {
                _client = postgres(process.env.DATABASE_URL);
                _db = drizzle(_client);
                console.log("[Database] Connected to PostgreSQL (fallback env)");
            } catch (e) {
                console.warn("[Database] Failed to connect (fallback):", e);
            }
        }
    }

    return _db;
}
