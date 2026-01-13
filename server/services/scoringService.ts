import { eq } from "drizzle-orm";
import { responses } from "../../drizzle/schema";
import { getDb } from "../_core/database";
import { buildScoringPrompt } from "../prompts";
import OpenAI from "openai";

// Initialize OpenAI client (can use OpenRouter base URL if configured)
const getClient = () => {
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
    const baseURL = process.env.OPENROUTER_API_KEY ? "https://openrouter.ai/api/v1" : undefined;

    if (!apiKey) return null;

    return new OpenAI({
        apiKey,
        baseURL,
        defaultHeaders: process.env.OPENROUTER_API_KEY ? {
            "HTTP-Referer": "https://ai-debatelab.com",
            "X-Title": "AI DebateLab"
        } : undefined
    });
};

// Use a fast, smart model for scoring
const JUDGE_MODEL = "openai/gpt-4o"; // Or "anthropic/claude-3-5-sonnet"

export async function evaluateResponse(responseId: number, content: string, topic: string, modelName: string) {
    try {
        const db = await getDb();
        if (!db) return;

        const client = getClient();
        if (!client) {
            console.warn("[Scoring] No API key enabled for scoring service");
            return;
        }

        const prompt = buildScoringPrompt({
            topic,
            response: content,
            modelName
        });

        console.log(`[Scoring] Evaluating response ${responseId} for ${modelName}...`);

        const completion = await client.chat.completions.create({
            model: JUDGE_MODEL,
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.2 // Low temperature for consistent scoring
        });

        const result = completion.choices[0]?.message?.content;
        if (!result) return;

        const parsed = JSON.parse(result);
        const score = parseFloat(parsed.score);
        const reasoning = parsed.reasoning;

        // Update DB
        await db.update(responses)
            .set({
                score,
                scoreReasoning: reasoning
            })
            .where(eq(responses.id, responseId));

        console.log(`[Scoring] Response ${responseId} scored: ${score}/10`);

    } catch (error) {
        console.error("[Scoring Error]", error);
    }
}
