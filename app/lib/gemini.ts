/**
 * Gemini LLM Factory with API Key Rotation & Cost-Optimized Models
 *
 * Key Rotation:
 *   Tries GEMINI_API_KEY_1 → _2 → _3 in order.
 *   On rate-limit (429) or quota errors, automatically falls back to next key.
 *
 * Model Strategy (cost-optimized):
 *   - "primary"  → gemini-2.5-flash  (Analyzer & Evaluator — need quality)
 *   - "cheap"    → gemini-2.0-flash  (Executor — simpler exploit simulation)
 */
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// ─── Key Pool ────────────────────────────────────────────────────────────────

function getGeminiKeys(): string[] {
  return [
    process.env.GEMINI_API_KEY_1 || "",
    process.env.GEMINI_API_KEY_2 || "",
    process.env.GEMINI_API_KEY_3 || "",
    // Legacy fallback
    process.env.GEMINI_API_KEY || "",
    process.env.GOOGLE_API_KEY || "",
  ].filter(Boolean);
}

// ─── Model Presets ───────────────────────────────────────────────────────────

type ModelPreset = "primary" | "cheap";

const MODEL_MAP: Record<ModelPreset, string> = {
  primary: process.env.GEMINI_MODEL_PRIMARY || "gemini-2.5-flash",
  cheap: process.env.GEMINI_MODEL_CHEAP || "gemini-2.0-flash",
};

// ─── Rate-limit tracking ─────────────────────────────────────────────────────
// Tracks which key index is currently failing so next call skips it.
let currentKeyIndex = 0;

function isRateLimitError(err: unknown): boolean {
  const msg = String((err as Error)?.message || err || "");
  return (
    msg.includes("429") ||
    msg.includes("rate limit") ||
    msg.includes("quota") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("Too Many Requests")
  );
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export function createGeminiLLM(
  preset: ModelPreset = "primary",
  overrideApiKey?: string
): ChatGoogleGenerativeAI {
  const apiKey = overrideApiKey || getGeminiKeys()[currentKeyIndex] || getGeminiKeys()[0];

  if (!apiKey) {
    throw new Error(
      "No GEMINI_API_KEY found. Set GEMINI_API_KEY_1 in .env.local."
    );
  }

  return new ChatGoogleGenerativeAI({
    model: MODEL_MAP[preset],
    apiKey,
    temperature: 0.2,
    maxOutputTokens: 4096,
  });
}

/**
 * Invoke an LLM call with automatic key rotation on rate-limit errors.
 * Tries up to 3 keys before giving up.
 */
export async function invokeWithKeyFallback(
  preset: ModelPreset,
  messages: Parameters<ChatGoogleGenerativeAI["invoke"]>[0]
): Promise<string> {
  const keys = getGeminiKeys();
  const maxAttempts = Math.max(keys.length, 1);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const keyIndex = (currentKeyIndex + attempt) % keys.length;
    const llm = createGeminiLLM(preset, keys[keyIndex]);

    try {
      const response = await llm.invoke(messages);
      // Success — update current key index for future calls
      currentKeyIndex = keyIndex;
      return String((response as { content: unknown }).content);
    } catch (err) {
      if (isRateLimitError(err) && attempt < maxAttempts - 1) {
        console.warn(
          `[API Key Rotation] Key #${keyIndex + 1} rate-limited, trying key #${((keyIndex + 1) % keys.length) + 1}...`
        );
        continue; // try next key
      }
      throw err; // non-rate-limit error or all keys exhausted
    }
  }

  throw new Error("All Gemini API keys exhausted (rate limited).");
}
