import OpenAI from "openai";

export const ai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "X-Title": "AI Smetchik",
  },
});

// Models via OpenRouter
export const MODELS = {
  main: "openai/gpt-4o",           // основная модель (normalizer, extractor, verifier)
  fast: "openai/gpt-4o-mini",      // быстрая модель (summary, price extraction)
} as const;
