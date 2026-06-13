/**
 * Gemini LLM Factory
 * Returns a ChatGoogleGenerativeAI instance, respecting env overrides.
 */
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export function createGeminiLLM(overrideApiKey?: string): ChatGoogleGenerativeAI {
  const apiKey =
    overrideApiKey ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env.local or pass via the Config page."
    );
  }

  return new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",   // Returning to the original model that worked
    apiKey,
    temperature: 0.2,
    maxOutputTokens: 4096,
  });
}

