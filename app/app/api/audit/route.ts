/**
 * POST /api/audit
 * Runs the Walsec 3-agent LangGraph pipeline on a submitted Sui Move contract.
 * Robust error handling — never crashes the app.
 */
import { NextRequest, NextResponse } from "next/server";
import { auditGraph } from "@/lib/langgraph";
import { fetchArtifacts } from "@/lib/walrus";

export const maxDuration = 180; // 3 min timeout for LangGraph pipeline

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body." },
        { status: 400 }
      );
    }

    const contractCode = body?.contractCode as string;

    if (!contractCode || contractCode.trim().length < 10) {
      return NextResponse.json(
        { error: "contractCode is required and must be at least 10 characters of Sui Move code." },
        { status: 400 }
      );
    }

    // Pull recent audit context from Walrus (non-blocking, short timeout)
    let pastContext = "";
    try {
      const fetchPromise = fetchArtifacts();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Walrus fetch timeout")), 8_000)
      );
      const pastArtifacts = await Promise.race([fetchPromise, timeoutPromise.catch(() => [])]) as Awaited<ReturnType<typeof fetchArtifacts>>;
      if (Array.isArray(pastArtifacts)) {
        pastContext = pastArtifacts
          .slice(0, 3)
          .map(
            (a) =>
              `[${a.timestamp}] ${a.vulnerability_type} (${a.severity}) — ${a.description.slice(0, 120)}`
          )
          .join("\n");
      }
    } catch {
      pastContext = "No prior audit context available.";
    }

    // Run the LangGraph pipeline with timeout
    let finalState: Record<string, unknown>;
    try {
      const timeoutMs = 170_000; // 170s timeout (under maxDuration of 180s)
      console.log("[/api/audit] Starting LangGraph pipeline...");
      const pipelinePromise = auditGraph.invoke({
        contractCode,
        pastContext,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Audit pipeline timed out after ${timeoutMs / 1000}s`)), timeoutMs)
      );

      finalState = await Promise.race([pipelinePromise, timeoutPromise]) as Record<string, unknown>;
      console.log("[/api/audit] Pipeline completed successfully.");
    } catch (pipelineErr) {
      const msg = pipelineErr instanceof Error ? pipelineErr.message : "Pipeline execution failed";
      console.error("[/api/audit] Pipeline error:", msg);
      return NextResponse.json(
        {
          error: `Audit pipeline error: ${msg}`,
          logs: [
            "[SYSTEM] ─────────────────────────────────────",
            `[SYSTEM] PIPELINE_ERROR: ${msg}`,
            "[SYSTEM] Audit aborted. Check GEMINI_API_KEY configuration.",
          ],
        },
        { status: 500 }
      );
    }

    // Safely extract and parse the final artifact
    let finalArtifact = null;
    try {
      const raw = finalState.finalArtifact as string;
      if (raw) {
        finalArtifact = typeof raw === "string" ? JSON.parse(raw) : raw;
      }
    } catch {
      // If parsing fails, create a fallback artifact from logs
      finalArtifact = {
        vulnerability_type: "Analysis Complete",
        severity: "MEDIUM",
        description: "Audit completed but artifact parsing encountered issues. Check logs for details.",
        timestamp: new Date().toISOString(),
        target_function: "unknown",
        namespace: "AUDIT_LOG_V1",
        remediation: "Review the analysis logs for specific findings and recommendations.",
        risk_score: 50,
      };
    }

    return NextResponse.json({
      success: true,
      logs: (finalState.logs as string[]) || [],
      analyzerFindings: finalState.analyzerFindings,
      executorPayload: finalState.executorPayload,
      finalArtifact,
      walrusObjectId: finalState.walrusObjectId || "",
    });
  } catch (err: unknown) {
    console.error("[/api/audit] Unexpected error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      {
        error: message,
        logs: [
          "[SYSTEM] ─────────────────────────────────────",
          `[SYSTEM] UNEXPECTED_ERROR: ${message}`,
        ],
      },
      { status: 500 }
    );
  }
}
