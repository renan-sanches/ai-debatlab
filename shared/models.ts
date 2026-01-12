// AI Model definitions for the debate platform
// Using OpenRouter model IDs for unified API access

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  openRouterId: string;
  icon: string;
  color: string;
  lens: string;
  supportsImages?: boolean;
  contextLength?: number;
  isLeader?: boolean;
}

// Leader models - featured in quick-select bubbles (curated top models)
// Also exported as AI_MODELS for backward compatibility
export const LEADER_MODELS: AIModel[] = [
  {
    id: "claude-sonnet-4.5",
    name: "Claude Sonnet 4.5",
    provider: "anthropic",
    openRouterId: "anthropic/claude-sonnet-4.5",
    icon: "🟠",
    color: "#D97706",
    lens: "Balanced thinker who weighs pros and cons carefully",
    supportsImages: true,
    contextLength: 200000,
    isLeader: true,
  },
  {
    id: "claude-opus-4.5",
    name: "Claude Opus 4.5",
    provider: "anthropic",
    openRouterId: "anthropic/claude-opus-4.5",
    icon: "🟣",
    color: "#7C3AED",
    lens: "Deep thinker who connects dots others miss",
    supportsImages: true,
    contextLength: 200000,
    isLeader: true,
  },
  {
    id: "gpt-5.2",
    name: "GPT-5.2",
    provider: "openai",
    openRouterId: "openai/gpt-5.2",
    icon: "🟢",
    color: "#10B981",
    lens: "Practical problem-solver focused on what actually works",
    supportsImages: true,
    contextLength: 400000,
    isLeader: true,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    openRouterId: "openai/gpt-4o",
    icon: "🔵",
    color: "#3B82F6",
    lens: "Quick thinker who sees the big picture fast",
    supportsImages: true,
    contextLength: 128000,
    isLeader: true,
  },
  {
    id: "gemini-3-pro",
    name: "Gemini 3 Pro",
    provider: "google",
    openRouterId: "google/gemini-3-pro-preview",
    icon: "🔴",
    color: "#EF4444",
    lens: "Research-focused analyst who backs claims with evidence",
    supportsImages: true,
    contextLength: 1000000,
    isLeader: true,
  },
  {
    id: "grok-3",
    name: "Grok 3",
    provider: "x-ai",
    openRouterId: "x-ai/grok-3-beta",
    icon: "🚀",
    color: "#1DA1F2",
    lens: "Unconventional thinker who challenges assumptions",
    supportsImages: true,
    contextLength: 131072,
    isLeader: true,
  },
];

// Provider colors for consistent UI
export const PROVIDER_COLORS: Record<string, string> = {
  anthropic: "#D97706",
  openai: "#10B981",
  google: "#EF4444",
  "x-ai": "#1DA1F2",
  deepseek: "#6366F1",
  mistralai: "#06B6D4",
  meta: "#8B5CF6",
  "meta-llama": "#8B5CF6",
  qwen: "#EC4899",
  cohere: "#14B8A6",
  amazon: "#FF9900",
  nvidia: "#76B900",
  minimax: "#F97316",
  perplexity: "#22D3EE",
  xiaomi: "#FF4A00",
  default: "#6B7280",
};

// Provider icons
export const PROVIDER_ICONS: Record<string, string> = {
  anthropic: "🟠",
  openai: "🟢",
  google: "🔴",
  "x-ai": "🚀",
  deepseek: "🧠",
  mistralai: "🌊",
  meta: "🦙",
  "meta-llama": "🦙",
  qwen: "🌟",
  cohere: "💎",
  amazon: "📦",
  nvidia: "💚",
  minimax: "🎯",
  perplexity: "🔍",
  xiaomi: "📱",
  default: "🤖",
};

export function getProviderColor(provider: string): string {
  return PROVIDER_COLORS[provider.toLowerCase()] || PROVIDER_COLORS.default;
}

export function getProviderIcon(provider: string): string {
  return PROVIDER_ICONS[provider.toLowerCase()] || PROVIDER_ICONS.default;
}

// OpenRouter API response types
export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  architecture?: {
    modality?: string;
    input_modalities?: string[];
    output_modalities?: string[];
  };
  pricing?: {
    prompt: string;
    completion: string;
    image?: string;
  };
}

export interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}

// Convert OpenRouter model to AIModel
export function openRouterToAIModel(orModel: OpenRouterModel): AIModel {
  const provider = orModel.id.split("/")[0] || "unknown";
  const supportsImages = orModel.architecture?.input_modalities?.includes("image") || false;

  return {
    id: orModel.id.replace(/\//g, "-").replace(/:/g, "-"),
    name: orModel.name,
    provider,
    openRouterId: orModel.id,
    icon: getProviderIcon(provider),
    color: getProviderColor(provider),
    lens: orModel.description?.slice(0, 80) || `${orModel.name} from ${provider}`,
    supportsImages,
    contextLength: orModel.context_length || 8192,
    isLeader: false,
  };
}

// Get model by ID (handles both internal ID format and OpenRouter ID format)
export const getModelById = (id: string): AIModel | undefined => {
  // Check leader models by internal ID first
  const leaderById = LEADER_MODELS.find((m) => m.id === id);
  if (leaderById) return leaderById;

  // Check leader models by OpenRouter ID (e.g., "anthropic/claude-sonnet-4.5")
  const leaderByOpenRouterId = LEADER_MODELS.find((m) => m.openRouterId === id);
  if (leaderByOpenRouterId) return leaderByOpenRouterId;

  // For dynamic models, handle OpenRouter ID format (provider/model-name)
  if (id.includes('/')) {
    const [provider, ...modelParts] = id.split('/');
    const modelName = modelParts.join('/');
    const openRouterId = id.replace(/:free$/, ':free'); // Keep :free suffix

    return {
      id: id.replace(/\//g, '-').replace(/:free$/, '-free'),
      name: modelName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ').replace(':Free', ' (Free)'),
      provider,
      openRouterId,
      icon: getProviderIcon(provider),
      color: getProviderColor(provider),
      lens: `${provider} model`,
      supportsImages: false,
      contextLength: 8192,
      isLeader: false,
    };
  }

  // For internal ID format (provider-model-name), reconstruct OpenRouter ID
  const parts = id.split('-');
  if (parts.length < 2) return undefined;

  const provider = parts[0];
  const modelName = parts.slice(1).join('-');
  const openRouterId = `${provider}/${modelName}`.replace(/-free$/, ':free');

  // Create a dynamic model object
  return {
    id,
    name: modelName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    provider,
    openRouterId,
    icon: getProviderIcon(provider),
    color: getProviderColor(provider),
    lens: `${provider} model`,
    supportsImages: false,
    contextLength: 8192,
    isLeader: false,
  };
};

export const getModelByOpenRouterId = (openRouterId: string): AIModel | undefined => {
  return LEADER_MODELS.find((m) => m.openRouterId === openRouterId);
};

// Debate state types
export interface DebateSettings {
  question: string;
  participantModels: string[];
  moderatorModel: string;
  devilsAdvocateEnabled: boolean;
  devilsAdvocateModel: string | null;
  votingEnabled: boolean;
  imageUrl?: string;
}

export interface DebateResponse {
  id: number;
  modelId: string;
  modelName: string;
  content: string;
  isDevilsAdvocate: boolean;
  responseOrder: number;
  createdAt: Date;
}

export interface VoteResult {
  voterModelId: string;
  votedForModelId: string;
  reason: string | null;
}

export interface RoundData {
  id: number;
  roundNumber: number;
  followUpQuestion: string | null;
  responses: DebateResponse[];
  votes: VoteResult[];
  moderatorSynthesis: string | null;
  suggestedFollowUp: string | null;
}

export interface DebateData {
  id: number;
  question: string;
  participantModels: string[];
  moderatorModel: string;
  devilsAdvocateEnabled: boolean;
  devilsAdvocateModel: string | null;
  votingEnabled: boolean;
  status: string;
  rounds: RoundData[];
  createdAt: Date;
  imageUrl?: string;
}

// API Provider types for user API keys
export type APIProvider = "openrouter" | "anthropic" | "openai" | "google";

export interface APIKeyConfig {
  provider: APIProvider;
  apiKey: string;
}

// Backward compatibility - AI_MODELS is an alias for LEADER_MODELS
export const AI_MODELS = LEADER_MODELS;

// Favorite model type
export interface FavoriteModel {
  id: number;
  userId: number;
  openRouterId: string;
  modelName: string;
  createdAt: Date;
}
