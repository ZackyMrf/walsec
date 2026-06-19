import { NextResponse } from "next/server";
import { getMemWal } from "@/lib/walrus";
import { invokeWithKeyFallback } from "@/lib/gemini";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    const memwal = getMemWal();
    let context = "";

    // 1. Recall past conversation context using Memwal
    if (memwal) {
      try {
        const recallRes = await memwal.recall({ query: message, limit: 5, namespace: "walsec_chat" });
        context = recallRes.results.map(r => r.text).join("\n");
      } catch (e) {
        console.warn("[MemWal] Recall failed:", e);
      }
    }

    // 2. Query Gemini LLM with context
    const systemPrompt = `You are a helpful, relaxed AI assistant integrated into the WALSEC terminal. 
Your tone should be casual and friendly, like a normal assistant, but you are also highly capable of generating code and assisting with technical tasks.
Keep responses relatively concise to fit well in a terminal UI. 
If the user asks you to write code, provide it clearly.

Here is relevant past context from our conversation memory (use it if it's relevant to the user's current prompt, otherwise ignore it):
${context ? context : "No previous memory found."}`;

    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(message),
    ];

    const aiResponse = await invokeWithKeyFallback("chat", messages);

    // 3. Store the new interaction in Memwal memory
    if (memwal) {
      try {
        const memoryEntry = `User asked: ${message}\nAI responded: ${aiResponse}`;
        await memwal.remember(memoryEntry, "walsec_chat");
      } catch (e) {
        console.warn("[MemWal] Remember failed:", e);
      }
    }

    return NextResponse.json({ response: aiResponse }, { status: 200 });
  } catch (err) {
    console.error("[/api/chat] Error processing chat:", err);
    return NextResponse.json({ error: "Failed to process chat" }, { status: 500 });
  }
}
