// Custom LLM helper that supports model selection via OpenRouter or user API keys
import { ENV } from "./_core/env";
import { getModelById, AIModel } from "../shared/models";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4";
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: MessageContent | MessageContent[];
}

export interface LLMInvokeParams {
  model: string; // Model ID from shared/models.ts
  messages: LLMMessage[];
  maxTokens?: number;
  userApiKey?: string | null; // User's API key (if provided)
  apiProvider?: "openrouter" | "anthropic" | "openai" | "google" | null;
}

export interface UsageInfo {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number; // In USD
}

export interface LLMInvokeResult {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
  usage?: UsageInfo;
  model?: string;
}

// Cost per 1M tokens (input/output) for different models
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // Claude models
  "anthropic/claude-sonnet-4": { input: 3.0, output: 15.0 },
  "anthropic/claude-opus-4": { input: 15.0, output: 75.0 },
  // OpenAI models
  "openai/gpt-4.1": { input: 2.0, output: 8.0 },
  "openai/gpt-4o": { input: 2.5, output: 10.0 },
  // Google models
  "google/gemini-2.5-pro-preview": { input: 1.25, output: 5.0 },
  "google/gemini-2.0-flash-001": { input: 0.075, output: 0.3 },
  // Meta models
  "meta-llama/llama-4-maverick": { input: 0.2, output: 0.2 },
  // Mistral models
  "mistralai/mistral-large-2411": { input: 2.0, output: 6.0 },
};

function calculateCost(openRouterId: string, promptTokens: number, completionTokens: number): number {
  const pricing = MODEL_PRICING[openRouterId] || { input: 1.0, output: 3.0 }; // Default fallback
  const inputCost = (promptTokens / 1_000_000) * pricing.input;
  const outputCost = (completionTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}

// Default Manus Forge API
const resolveDefaultApiUrl = () =>
  ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
    ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
    : "https://forge.manus.im/v1/chat/completions";

// Provider-specific API endpoints
const PROVIDER_ENDPOINTS: Record<string, string> = {
  openrouter: "https://openrouter.ai/api/v1/chat/completions",
  anthropic: "https://api.anthropic.com/v1/messages",
  openai: "https://api.openai.com/v1/chat/completions",
  google: "https://generativelanguage.googleapis.com/v1beta/models",
};

// Map our model IDs to provider-specific model names
function getProviderModelName(model: AIModel, provider: string): string {
  switch (provider) {
    case "anthropic":
      // Anthropic uses different model names
      if (model.id.includes("sonnet-4.5")) return "claude-sonnet-4-20250514";
      if (model.id.includes("opus-4.5")) return "claude-opus-4-20250514";
      return model.openRouterId.replace("anthropic/", "");
    case "openai":
      // OpenAI model names
      if (model.id === "gpt-5.2") return "gpt-4.1";
      if (model.id === "gpt-4o") return "gpt-4o";
      return model.openRouterId.replace("openai/", "");
    case "google":
      // Google Gemini model names
      if (model.id === "gemini-3-pro") return "gemini-2.5-pro-preview";
      if (model.id === "gemini-2-flash") return "gemini-2.0-flash";
      return model.openRouterId.replace("google/", "");
    default:
      return model.openRouterId;
  }
}

// Call Anthropic API directly
async function callAnthropicAPI(
  apiKey: string,
  model: AIModel,
  messages: LLMMessage[],
  maxTokens: number
): Promise<LLMInvokeResult> {
  const modelName = getProviderModelName(model, "anthropic");
  
  // Convert messages to Anthropic format
  const systemMessage = messages.find(m => m.role === "system");
  const nonSystemMessages = messages.filter(m => m.role !== "system");
  
  const payload: Record<string, unknown> = {
    model: modelName,
    max_tokens: maxTokens,
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

  const data = await response.json();
  
  // Convert Anthropic response to our format
  const promptTokens = data.usage?.input_tokens || 0;
  const completionTokens = data.usage?.output_tokens || 0;
  
  return {
    choices: [{
      message: {
        role: "assistant",
        content: data.content?.[0]?.text || "",
      },
    }],
    usage: {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      estimatedCost: calculateCost(model.openRouterId, promptTokens, completionTokens),
    },
    model: modelName,
  };
}

// Call OpenAI API directly
async function callOpenAIAPI(
  apiKey: string,
  model: AIModel,
  messages: LLMMessage[],
  maxTokens: number
): Promise<LLMInvokeResult> {
  const modelName = getProviderModelName(model, "openai");
  
  const payload = {
    model: modelName,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
    max_tokens: maxTokens,
  };

  const response = await fetch(PROVIDER_ENDPOINTS.openai, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} – ${errorText}`);
  }

  const data = await response.json();
  
  const promptTokens = data.usage?.prompt_tokens || 0;
  const completionTokens = data.usage?.completion_tokens || 0;
  
  return {
    choices: data.choices,
    usage: {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      estimatedCost: calculateCost(model.openRouterId, promptTokens, completionTokens),
    },
    model: modelName,
  };
}

// Call Google Gemini API directly
async function callGoogleAPI(
  apiKey: string,
  model: AIModel,
  messages: LLMMessage[],
  maxTokens: number
): Promise<LLMInvokeResult> {
  const modelName = getProviderModelName(model, "google");
  const endpoint = `${PROVIDER_ENDPOINTS.google}/${modelName}:generateContent?key=${apiKey}`;
  
  // Convert messages to Gemini format
  const systemMessage = messages.find(m => m.role === "system");
  const nonSystemMessages = messages.filter(m => m.role !== "system");
  
  const contents = nonSystemMessages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  
  const payload: Record<string, unknown> = {
    contents,
    generationConfig: {
      maxOutputTokens: maxTokens,
    },
  };
  
  if (systemMessage) {
    payload.systemInstruction = { parts: [{ text: systemMessage.content }] };
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google API error: ${response.status} – ${errorText}`);
  }

  const data = await response.json();
  
  const promptTokens = data.usageMetadata?.promptTokenCount || 0;
  const completionTokens = data.usageMetadata?.candidatesTokenCount || 0;
  
  return {
    choices: [{
      message: {
        role: "assistant",
        content: data.candidates?.[0]?.content?.parts?.[0]?.text || "",
      },
    }],
    usage: {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      estimatedCost: calculateCost(model.openRouterId, promptTokens, completionTokens),
    },
    model: modelName,
  };
}

// Call OpenRouter API
async function callOpenRouterAPI(
  apiKey: string,
  model: AIModel,
  messages: LLMMessage[],
  maxTokens: number
): Promise<LLMInvokeResult> {
  const payload = {
    model: model.openRouterId,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
    max_tokens: maxTokens,
  };

  const response = await fetch(PROVIDER_ENDPOINTS.openrouter, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "https://ai-debatelab.manus.space",
      "X-Title": "AI DebateLab",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} – ${errorText}`);
  }

  const data = await response.json();
  
  const promptTokens = data.usage?.prompt_tokens || 0;
  const completionTokens = data.usage?.completion_tokens || 0;
  
  return {
    choices: data.choices,
    usage: {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      estimatedCost: calculateCost(model.openRouterId, promptTokens, completionTokens),
    },
    model: model.openRouterId,
  };
}

// Call default API - uses OpenRouter directly if OPENROUTER_API_KEY is set, otherwise falls back to Manus Forge
async function callDefaultAPI(
  model: AIModel,
  messages: LLMMessage[],
  maxTokens: number
): Promise<LLMInvokeResult> {
  // Prefer OpenRouter direct if configured (faster, no proxy)
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (openRouterKey) {
    return callOpenRouterAPI(openRouterKey, model, messages, maxTokens);
  }
  
  // Fall back to Manus Forge if configured
  if (!ENV.forgeApiKey) {
    throw new Error("No API key configured. Set OPENROUTER_API_KEY or BUILT_IN_FORGE_API_KEY in your environment.");
  }

  const payload = {
    model: model.openRouterId,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
    max_tokens: maxTokens,
  };

  const response = await fetch(resolveDefaultApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`);
  }

  const data = await response.json();
  
  const promptTokens = data.usage?.prompt_tokens || 0;
  const completionTokens = data.usage?.completion_tokens || 0;
  
  return {
    choices: data.choices,
    usage: {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      estimatedCost: calculateCost(model.openRouterId, promptTokens, completionTokens),
    },
    model: model.openRouterId,
  };
}

export async function invokeLLMWithModel(params: LLMInvokeParams): Promise<LLMInvokeResult> {
  const model = getModelById(params.model);
  if (!model) {
    throw new Error(`Unknown model: ${params.model}`);
  }

  const maxTokens = params.maxTokens || 4096;
  const userApiKey = params.userApiKey;
  const apiProvider = params.apiProvider;

  // If user has provided an API key, use it
  if (userApiKey && apiProvider) {
    switch (apiProvider) {
      case "openrouter":
        return callOpenRouterAPI(userApiKey, model, params.messages, maxTokens);
      case "anthropic":
        if (model.provider !== "anthropic") {
          throw new Error(`Model ${model.name} is not an Anthropic model. Use OpenRouter for multi-provider access.`);
        }
        return callAnthropicAPI(userApiKey, model, params.messages, maxTokens);
      case "openai":
        if (model.provider !== "openai") {
          throw new Error(`Model ${model.name} is not an OpenAI model. Use OpenRouter for multi-provider access.`);
        }
        return callOpenAIAPI(userApiKey, model, params.messages, maxTokens);
      case "google":
        if (model.provider !== "google") {
          throw new Error(`Model ${model.name} is not a Google model. Use OpenRouter for multi-provider access.`);
        }
        return callGoogleAPI(userApiKey, model, params.messages, maxTokens);
    }
  }

  // Fall back to default Manus Forge API
  return callDefaultAPI(model, params.messages, maxTokens);
}

// Helper to get available models based on user's API keys
export function getAvailableModels(
  configuredProviders: Array<"openrouter" | "anthropic" | "openai" | "google">
): string[] {
  const { AI_MODELS } = require("../shared/models");
  
  // If user has OpenRouter, all models are available
  if (configuredProviders.includes("openrouter")) {
    return AI_MODELS.map((m: AIModel) => m.id);
  }
  
  // Otherwise, filter by provider
  return AI_MODELS
    .filter((m: AIModel) => {
      if (m.provider === "anthropic" && configuredProviders.includes("anthropic")) return true;
      if (m.provider === "openai" && configuredProviders.includes("openai")) return true;
      if (m.provider === "google" && configuredProviders.includes("google")) return true;
      return false;
    })
    .map((m: AIModel) => m.id);
}
