import { eq } from "drizzle-orm";
import { votes, InsertVote } from "../../drizzle/schema";
import { getDb } from "../_core/database";

// Vote functions
export async function createVote(vote: InsertVote) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.insert(votes).values(vote).returning({ id: votes.id });
    return result[0].id;
}

export async function getVotesByRoundId(roundId: number) {
    const db = await getDb();
    if (!db) return [];

    return db.select().from(votes).where(eq(votes.roundId, roundId));
}
