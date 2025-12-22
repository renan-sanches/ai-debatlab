// Streaming LLM helper with Server-Sent Events support
import { ENV } from "./_core/env";
import { getModelById, AIModel } from "../shared/models";
import type { LLMMessage, UsageInfo } from "./llmHelper";

export interface StreamingCallbacks {
  onToken: (token: string) => void;
  onComplete: (fullText: string, usage?: UsageInfo) => void;
  onError: (error: Error) => void;
}

// Cost per 1M tokens (input/output) for different models
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "anthropic/claude-sonnet-4": { input: 3.0, output: 15.0 },
  "anthropic/claude-opus-4": { input: 15.0, output: 75.0 },
  "openai/gpt-4.1": { input: 2.0, output: 8.0 },
  "openai/gpt-4o": { input: 2.5, output: 10.0 },
  "google/gemini-2.5-pro-preview": { input: 1.25, output: 5.0 },
  "google/gemini-2.0-flash-001": { input: 0.075, output: 0.3 },
  "meta-llama/llama-4-maverick": { input: 0.2, output: 0.2 },
  "mistralai/mistral-large-2411": { input: 2.0, output: 6.0 },
};

function calculateCost(openRouterId: string, promptTokens: number, completionTokens: number): number {
  const pricing = MODEL_PRICING[openRouterId] || { input: 1.0, output: 3.0 };
  const inputCost = (promptTokens / 1_000_000) * pricing.input;
  const outputCost = (completionTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}

// Estimate tokens from text (rough approximation: ~4 chars per token)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Helper to extract text from message content
function extractTextFromContent(content: LLMMessage['content']): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter((c): c is { type: 'text'; text: string } => typeof c === 'object' && c.type === 'text')
      .map(c => c.text)
      .join(' ');
  }
  if (typeof content === 'object' && content.type === 'text') {
    return content.text;
  }
  return '';
}

const resolveDefaultApiUrl = () =>
  ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
    ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
    : "https://forge.manus.im/v1/chat/completions";

const PROVIDER_ENDPOINTS: Record<string, string> = {
  openrouter: "https://openrouter.ai/api/v1/chat/completions",
  anthropic: "https://api.anthropic.com/v1/messages",
  openai: "https://api.openai.com/v1/chat/completions",
};

function getProviderModelName(model: AIModel, provider: string): string {
  switch (provider) {
    case "anthropic":
      if (model.id.includes("sonnet-4.5")) return "claude-sonnet-4-20250514";
      if (model.id.includes("opus-4.5")) return "claude-opus-4-20250514";
      return model.openRouterId.replace("anthropic/", "");
    case "openai":
      if (model.id === "gpt-5.2") return "gpt-4.1";
      if (model.id === "gpt-4o") return "gpt-4o";
      return model.openRouterId.replace("openai/", "");
    default:
      return model.openRouterId;
  }
}

// Parse SSE data from a chunk
function parseSSEChunk(chunk: string): string[] {
  const lines = chunk.split('\n');
  const tokens: string[] = [];
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;
      
      try {
        const parsed = JSON.parse(data);
        // OpenAI/OpenRouter format
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          tokens.push(content);
        }
        // Anthropic format
        const anthropicContent = parsed.delta?.text;
        if (anthropicContent) {
          tokens.push(anthropicContent);
        }
      } catch {
        // Ignore parse errors for incomplete chunks
      }
    }
  }
  
  return tokens;
}

// Stream from OpenAI-compatible API (OpenRouter, OpenAI, default)
async function streamOpenAICompatible(
  apiUrl: string,
  apiKey: string,
  modelName: string,
  messages: LLMMessage[],
  maxTokens: number,
  callbacks: StreamingCallbacks,
  headers: Record<string, string> = {}
): Promise<void> {
  const payload = {
    model: modelName,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    max_tokens: maxTokens,
    stream: true,
  };

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${apiKey}`,
      ...headers,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error: ${response.status} – ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ""; // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              callbacks.onToken(content);
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    }

    // Estimate usage
    const promptTokens = estimateTokens(messages.map(m => extractTextFromContent(m.content)).join(' '));
    const completionTokens = estimateTokens(fullText);
    const usage: UsageInfo = {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      estimatedCost: calculateCost(modelName, promptTokens, completionTokens),
    };

    callbacks.onComplete(fullText, usage);
  } catch (error) {
    callbacks.onError(error as Error);
  }
}

// Stream from Anthropic API
async function streamAnthropicAPI(
  apiKey: string,
  model: AIModel,
  messages: LLMMessage[],
  maxTokens: number,
  callbacks: StreamingCallbacks
): Promise<void> {
  const modelName = getProviderModelName(model, "anthropic");
  
  const systemMessage = messages.find(m => m.role === "system");
  const nonSystemMessages = messages.filter(m => m.role !== "system");
  
  const payload: Record<string, unknown> = {
    model: modelName,
    max_tokens: maxTokens,
    stream: true,
    messages: nonSystemMessages.map(m => ({
      role: m.role,
      content: m.content,
    })),
  };
  
  if (systemMessage) {
    payload.system = systemMessage.content;
  }

  const response = await fetch(PROVIDER_ENDPOINTS.anthropic, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} – ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      const lines = buffer.split('\n');
      buffer = lines.pop() || "";
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          
          try {
            const parsed = JSON.parse(data);
            
            // Content block delta
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              fullText += parsed.delta.text;
              callbacks.onToken(parsed.delta.text);
            }
            
            // Message start with usage
            if (parsed.type === 'message_start' && parsed.message?.usage) {
              inputTokens = parsed.message.usage.input_tokens || 0;
            }
            
            // Message delta with usage
            if (parsed.type === 'message_delta' && parsed.usage) {
              outputTokens = parsed.usage.output_tokens || 0;
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    }

    const usage: UsageInfo = {
      promptTokens: inputTokens || estimateTokens(messages.map(m => extractTextFromContent(m.content)).join(' ')),
      completionTokens: outputTokens || estimateTokens(fullText),
      totalTokens: (inputTokens || 0) + (outputTokens || 0),
      estimatedCost: calculateCost(model.openRouterId, inputTokens, outputTokens),
    };

    callbacks.onComplete(fullText, usage);
  } catch (error) {
    callbacks.onError(error as Error);
  }
}

export interface StreamingParams {
  modelId: string;
  messages: LLMMessage[];
  maxTokens?: number;
  userApiKey?: string | null;
  apiProvider?: "openrouter" | "anthropic" | "openai" | "google" | null;
}

export async function streamLLMResponse(
  params: StreamingParams,
  callbacks: StreamingCallbacks
): Promise<void> {
  const model = getModelById(params.modelId);
  if (!model) {
    callbacks.onError(new Error(`Unknown model: ${params.modelId}`));
    return;
  }

  const maxTokens = params.maxTokens || 4096;
  const userApiKey = params.userApiKey;
  const apiProvider = params.apiProvider;

  try {
    if (userApiKey && apiProvider) {
      switch (apiProvider) {
        case "openrouter":
          await streamOpenAICompatible(
            PROVIDER_ENDPOINTS.openrouter,
            userApiKey,
            model.openRouterId,
            params.messages,
            maxTokens,
            callbacks,
            {
              "HTTP-Referer": "https://ai-debatelab.manus.space",
              "X-Title": "AI DebateLab",
            }
          );
          return;
          
        case "anthropic":
          if (model.provider !== "anthropic") {
            callbacks.onError(new Error(`Model ${model.name} is not an Anthropic model.`));
            return;
          }
          await streamAnthropicAPI(userApiKey, model, params.messages, maxTokens, callbacks);
          return;
          
        case "openai":
          if (model.provider !== "openai") {
            callbacks.onError(new Error(`Model ${model.name} is not an OpenAI model.`));
            return;
          }
          await streamOpenAICompatible(
            PROVIDER_ENDPOINTS.openai,
            userApiKey,
            getProviderModelName(model, "openai"),
            params.messages,
            maxTokens,
            callbacks
          );
          return;
          
        case "google":
          // Google doesn't support standard SSE streaming well, fall back to non-streaming
          callbacks.onError(new Error("Google API streaming not supported. Using non-streaming mode."));
          return;
      }
    }

    // Default: prefer OpenRouter direct if configured (faster, no proxy)
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (openRouterKey) {
      await streamOpenAICompatible(
        PROVIDER_ENDPOINTS.openrouter,
        openRouterKey,
        model.openRouterId,
        params.messages,
        maxTokens,
        callbacks,
        {
          "HTTP-Referer": "https://ai-debatelab.app",
          "X-Title": "AI DebateLab",
        }
      );
      return;
    }
    
    // Fall back to Manus Forge API
    if (!ENV.forgeApiKey) {
      callbacks.onError(new Error("No API key configured. Set OPENROUTER_API_KEY or BUILT_IN_FORGE_API_KEY in your environment."));
      return;
    }

    await streamOpenAICompatible(
      resolveDefaultApiUrl(),
      ENV.forgeApiKey,
      model.openRouterId,
      params.messages,
      maxTokens,
      callbacks
    );
  } catch (error) {
    callbacks.onError(error as Error);
  }
}
