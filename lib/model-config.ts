export const OPENROUTER_MODELS = {
    // Ultra-fast, low cost (Good for dev/verify)
    "gemini-flash": "google/gemini-2.0-flash-001",

    // High intelligence, higher latency
    "gemini-pro": "google/gemini-pro-1.5",

    // Cerebras - extreme speed
    "cerebras-llama3-70b": "cerebras/llama3-70b-instruct",

    // Llama 3 via other providers
    "llama3-70b": "meta-llama/llama-3-70b-instruct",
    "llama3-8b": "meta-llama/llama-3-8b-instruct",

    // Anthropic
    "claude-3-haiku": "anthropic/claude-3-haiku",
    "claude-3.5-sonnet": "anthropic/claude-3.5-sonnet",
} as const;

export type OpenRouterModelId = keyof typeof OPENROUTER_MODELS;

export const DEFAULT_MODEL = "gemini-flash";

export function getModelId(id: string): string {
    // If it's a known alias, return the full ID
    if (id in OPENROUTER_MODELS) {
        return OPENROUTER_MODELS[id as OpenRouterModelId];
    }
    // Otherwise assume it's a direct OpenRouter ID
    return id;
}

export const OPENROUTER_HEADERS = {
    "HTTP-Referer": "https://hockeygotime.com", // Required for OpenRouter rankings
    "X-Title": "HockeyGoTime", // Required for OpenRouter rankings
};
