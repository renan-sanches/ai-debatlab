/**
 * Streaming API routes for real-time AI responses
 * Uses Server-Sent Events (SSE) for streaming LLM responses
 */
import { Router, Request, Response } from "express";
import { streamLLMResponse } from "./llmStreaming";
import * as db from "./db";
import { sdk } from "./_core/sdk";
import {
  prepareDebatePrompt,
  getUserApiKeyForModel,
  validateDebateOwnership,
} from "./services/debateService";

const router = Router();

// SSE endpoint for streaming debate responses
router.get("/api/stream/debate/:debateId/response", async (req: Request, res: Response) => {
  const debateId = parseInt(req.params.debateId);
  const roundId = parseInt(req.query.roundId as string);
  const modelId = req.query.modelId as string;
  const responseOrder = parseInt(req.query.responseOrder as string);
  const useUserApiKey = req.query.useUserApiKey === "true";

  // Verify authentication
  let user;
  try {
    user = await sdk.authenticateRequest(req);
  } catch {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Validate debate ownership using shared service
  let debate;
  try {
    debate = await validateDebateOwnership(debateId, user.id);
  } catch (error) {
    res.status(404).json({ error: "Debate not found" });
    return;
  }

  // Get existing responses
  const existingResponses = await db.getResponsesByRoundId(roundId);

  // Prepare prompt using shared service
  let preparedPrompt;
  try {
    preparedPrompt = await prepareDebatePrompt({
      debate,
      roundId,
      modelId,
      existingResponses,
    });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Failed to prepare prompt" });
    return;
  }

  const { prompt, isDevilsAdvocate, model } = preparedPrompt;

  // Set up SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  // Get user's API key using shared service
  const { userApiKey, apiProvider } = await getUserApiKeyForModel(
    user.id,
    model,
    useUserApiKey
  );

  let fullContent = "";

  // Stream the response
  await streamLLMResponse(
    {
      modelId,
      messages: [{ role: "user", content: prompt }],
      userApiKey,
      apiProvider,
    },
    {
      onToken: (token) => {
        fullContent += token;
        // Send token as SSE event
        res.write(`data: ${JSON.stringify({ type: "token", content: token })}\n\n`);
      },
      onComplete: async (text, usage) => {
        // Save the complete response to database
        const responseId = await db.createResponse({
          roundId,
          debateId,
          modelId,
          modelName: model.name,
          content: text,
          isDevilsAdvocate,
          responseOrder,
        });

        // Send completion event with usage info
        res.write(`data: ${JSON.stringify({
          type: "complete",
          responseId,
          modelId,
          modelName: model.name,
          content: text,
          isDevilsAdvocate,
          responseOrder,
          usage,
        })}\n\n`);
        
        res.end();
      },
      onError: (error) => {
        res.write(`data: ${JSON.stringify({ type: "error", message: error.message })}\n\n`);
        res.end();
      },
    }
  );

  // Handle client disconnect
  req.on("close", () => {
    // Client disconnected - cleanup if needed
  });
});

export default router;
