import { invokeLLMWithModel } from "../llmHelper";

export interface DiscourseAnalytics {
    consensusScore: number;       // 0-100: How unified the panel is
    tensionScore: number;         // 0-100: Level of disagreement
    agreementRate: number;        // 0-100: Percentage of similar reasoning
    topicDrift: number;           // 0-100: How far discussion drifted from original question
    tensionPoints: Array<{
        claim: string;
        tensionLevel: number;
        description: string;
    }>;
}

export interface AnalyticsContext {
    question: string;
    responses: Array<{
        modelName: string;
        content: string;
        isDevilsAdvocate: boolean;
    }>;
}

/**
 * Calculates discourse analytics by analyzing responses using AI
 */
export async function calculateDiscourseAnalytics(
    context: AnalyticsContext,
    userApiKey: string | null = null,
    apiProvider: "openrouter" | "anthropic" | "openai" | "google" | null = null
): Promise<DiscourseAnalytics> {
    const prompt = buildAnalyticsPrompt(context);

    try {
        const response = await invokeLLMWithModel({
            model: "openai/gpt-4o-mini", // Fast, cheap model for analytics
            messages: [
                {
                    role: "system",
                    content: "You are an expert discourse analyst. Analyze debates objectively and extract structured metrics."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            userApiKey,
            apiProvider,
            maxTokens: 2048,
        });

        // Parse JSON response
        const analytics = parseAnalyticsResponse(response.choices[0]?.message?.content || "");

        return analytics;
    } catch (error) {
        console.error("[Analytics] Error calculating discourse analytics:", error);

        // Return default values on error
        return {
            consensusScore: 0,
            tensionScore: 0,
            agreementRate: 0,
            topicDrift: 0,
            tensionPoints: [],
        };
    }
}

function buildAnalyticsPrompt(context: AnalyticsContext): string {
    const responsesText = context.responses
        .map((r, i) => `**${r.modelName}** ${r.isDevilsAdvocate ? "(Devil's Advocate)" : ""}:\n${r.content}`)
        .join("\n\n---\n\n");

    return `Analyze the following debate and extract precise discourse metrics.

**Original Question:**
${context.question}

**Responses:**
${responsesText}

**Task:**
Calculate the following metrics as percentages (0-100):

1. **consensusScore**: How unified are the responses? 100 = complete agreement, 0 = completely opposed views
2. **tensionScore**: Level of disagreement/conflict in arguments. 0 = harmonious, 100 = highly contentious
3. **agreementRate**: What percentage of models share similar core reasoning paths?
4. **topicDrift**: How much did the discussion drift from the original question? 0 = perfectly on-topic, 100 = completely off-topic

Also identify the top 3 tension points (specific claims causing disagreement).

**Output Format (JSON only, no markdown):**
{
  "consensusScore": <number 0-100>,
  "tensionScore": <number 0-100>,
  "agreementRate": <number 0-100>,
  "topicDrift": <number 0-100>,
  "tensionPoints": [
    {
      "claim": "<the specific claim>",
      "tensionLevel": <number 0-100>,
      "description": "<why it's controversial>"
    }
  ]
}`;
}

function parseAnalyticsResponse(content: string): DiscourseAnalytics {
    try {
        // Remove markdown code blocks if present
        let cleaned = content.trim();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replace(/```json\n?|\n?```/g, "").trim();
        }

        const parsed = JSON.parse(cleaned);

        // Validate and clamp values
        return {
            consensusScore: clamp(parsed.consensusScore ?? 0, 0, 100),
            tensionScore: clamp(parsed.tensionScore ?? 0, 0, 100),
            agreementRate: clamp(parsed.agreementRate ?? 0, 0, 100),
            topicDrift: clamp(parsed.topicDrift ?? 0, 0, 100),
            tensionPoints: (parsed.tensionPoints ?? []).slice(0, 3).map((tp: any) => ({
                claim: String(tp.claim ?? ""),
                tensionLevel: clamp(tp.tensionLevel ?? 0, 0, 100),
                description: String(tp.description ?? ""),
            })),
        };
    } catch (error) {
        console.error("[Analytics] Failed to parse analytics response:", error);
        throw new Error("Failed to parse analytics response");
    }
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}
