import { eq, desc, and, sql, gte } from "drizzle-orm";
import { debateResults, modelStats, InsertDebateResult } from "../../drizzle/schema";
import { getDb } from "../_core/database";

// Debate Results functions
export async function saveDebateResult(result: InsertDebateResult) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const insertResult = await db.insert(debateResults).values(result).returning({ id: debateResults.id });
    return insertResult[0].id;
}

export async function getDebateResult(debateId: number) {
    const db = await getDb();
    if (!db) return null;

    const result = await db.select()
        .from(debateResults)
        .where(eq(debateResults.debateId, debateId))
        .limit(1);

    return result.length > 0 ? result[0] : null;
}

export async function getDebateResultsByUserId(userId: number) {
    const db = await getDb();
    if (!db) return [];

    return db.select()
        .from(debateResults)
        .where(eq(debateResults.userId, userId))
        .orderBy(desc(debateResults.createdAt));
}

export async function getHeadToHeadDebateResults(userId: number, modelA: string, modelB: string) {
    const db = await getDb();
    if (!db) return [];

    return db.select()
        .from(debateResults)
        .where(and(
            eq(debateResults.userId, userId),
            sql`${debateResults.pointsAwarded}->>${modelA} IS NOT NULL`,
            sql`${debateResults.pointsAwarded}->>${modelB} IS NOT NULL`
        ))
        .orderBy(desc(debateResults.createdAt));
}

// Model Stats functions
export async function upsertModelStats(userId: number, modelId: string, pointsToAdd: {
    total: number;
    moderatorPick: number;
    peerVotes: number;
    strongArguments: number;
    devilsAdvocateBonus: number;
}) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const existing = await db.select()
        .from(modelStats)
        .where(and(
            eq(modelStats.userId, userId),
            eq(modelStats.modelId, modelId)
        ))
        .limit(1);

    if (existing.length > 0) {
        await db.update(modelStats)
            .set({
                totalPoints: sql`${modelStats.totalPoints} + ${pointsToAdd.total}`,
                totalDebates: sql`${modelStats.totalDebates} + 1`,
                moderatorPicks: sql`${modelStats.moderatorPicks} + ${pointsToAdd.moderatorPick > 0 ? 1 : 0}`,
                totalPeerVotes: sql`${modelStats.totalPeerVotes} + ${pointsToAdd.peerVotes}`,
                strongArgumentMentions: sql`${modelStats.strongArgumentMentions} + ${pointsToAdd.strongArguments > 0 ? 1 : 0}`,
                devilsAdvocateWins: sql`${modelStats.devilsAdvocateWins} + ${pointsToAdd.devilsAdvocateBonus > 0 ? 1 : 0}`,
                recentPoints: pointsToAdd.total,
                updatedAt: new Date(),
            })
            .where(eq(modelStats.id, existing[0].id));
    } else {
        await db.insert(modelStats).values({
            userId,
            modelId,
            totalPoints: pointsToAdd.total,
            totalDebates: 1,
            moderatorPicks: pointsToAdd.moderatorPick > 0 ? 1 : 0,
            totalPeerVotes: pointsToAdd.peerVotes,
            strongArgumentMentions: pointsToAdd.strongArguments > 0 ? 1 : 0,
            devilsAdvocateWins: pointsToAdd.devilsAdvocateBonus > 0 ? 1 : 0,
            recentPoints: pointsToAdd.total,
        });
    }
}

export async function getLeaderboard(userId: number, timeFilter?: "all" | "30days" | "week" | "10debates") {
    const db = await getDb();
    if (!db) return [];

    // For "all" filter or no filter, return pre-aggregated stats
    if (!timeFilter || timeFilter === "all") {
        return db.select()
            .from(modelStats)
            .where(eq(modelStats.userId, userId))
            .orderBy(desc(modelStats.totalPoints));
    }

    // For time-based filters, calculate from debateResults
    let dateFilter: Date | null = null;
    let limitDebates: number | null = null;

    switch (timeFilter) {
        case "30days":
            dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            break;
        case "week":
            dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            break;
        case "10debates":
            limitDebates = 10;
            break;
    }

    // Get debate results for the time period
    let resultsQuery = db.select()
        .from(debateResults)
        .where(eq(debateResults.userId, userId))
        .orderBy(desc(debateResults.createdAt));

    if (dateFilter) {
        resultsQuery = db.select()
            .from(debateResults)
            .where(and(
                eq(debateResults.userId, userId),
                gte(debateResults.createdAt, dateFilter)
            ))
            .orderBy(desc(debateResults.createdAt));
    }

    const results = await resultsQuery;

    // Apply debate limit if needed
    const filteredResults = limitDebates ? results.slice(0, limitDebates) : results;

    // Aggregate stats from filtered results
    const statsMap = new Map<string, {
        modelId: string;
        totalPoints: number;
        totalDebates: number;
        moderatorPicks: number;
        totalPeerVotes: number;
        strongArgumentMentions: number;
        devilsAdvocateWins: number;
        recentPoints: number;
    }>();

    filteredResults.forEach(result => {
        if (!result.pointsAwarded) return;

        Object.entries(result.pointsAwarded).forEach(([modelId, points]) => {
            const existing = statsMap.get(modelId) || {
                modelId,
                totalPoints: 0,
                totalDebates: 0,
                moderatorPicks: 0,
                totalPeerVotes: 0,
                strongArgumentMentions: 0,
                devilsAdvocateWins: 0,
                recentPoints: 0,
            };

            existing.totalPoints += points.total || 0;
            existing.totalDebates += 1;
            existing.moderatorPicks += points.moderatorPick > 0 ? 1 : 0;
            existing.totalPeerVotes += points.peerVotes || 0;
            existing.strongArgumentMentions += points.strongArguments > 0 ? 1 : 0;
            existing.devilsAdvocateWins += points.devilsAdvocateBonus > 0 ? 1 : 0;

            statsMap.set(modelId, existing);
        });
    });

    // Calculate recent points (from last 3 results)
    const last3Results = filteredResults.slice(0, 3);
    last3Results.forEach(result => {
        if (!result.pointsAwarded) return;
        Object.entries(result.pointsAwarded).forEach(([modelId, points]) => {
            const existing = statsMap.get(modelId);
            if (existing) {
                existing.recentPoints += points.total || 0;
            }
        });
    });

    // Convert to array and sort by total points
    return Array.from(statsMap.values())
        .sort((a, b) => b.totalPoints - a.totalPoints);
}

export async function getModelStatsById(userId: number, modelId: string) {
    const db = await getDb();
    if (!db) return null;

    const result = await db.select()
        .from(modelStats)
        .where(and(
            eq(modelStats.userId, userId),
            eq(modelStats.modelId, modelId)
        ))
        .limit(1);

    return result.length > 0 ? result[0] : null;
}
