import { ChatAnthropic } from "@langchain/anthropic";
import { BaseMessage } from "@langchain/core/messages";

type ModelPreset = "primary" | "cheap";

const MODEL_MAP: Record<ModelPreset, string> = {
  primary: process.env.ANTHROPIC_MODEL_PRIMARY || "claude-sonnet-4-6",
  cheap: process.env.ANTHROPIC_MODEL_CHEAP || "claude-haiku-4-5-20251001",
};

export function createAnthropicLLM(preset: ModelPreset = "primary"): ChatAnthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("No ANTHROPIC_API_KEY found in environment variables.");
  }

  return new ChatAnthropic({
    model: MODEL_MAP[preset],
    apiKey,
    temperature: 0.2,
    maxTokens: 4096,
  });
}

export async function invokeAnthropic(
  preset: ModelPreset,
  messages: BaseMessage[]
): Promise<string> {
  const llm = createAnthropicLLM(preset);
  try {
    const response = await llm.invoke(messages);
    return String(response.content);
  } catch (err) {
    console.error(`[Anthropic] Error invoking ${MODEL_MAP[preset]}:`, err);
    throw err;
  }
}
