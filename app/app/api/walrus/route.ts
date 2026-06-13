/**
 * GET /api/walrus
 * Returns previously stored audit artifacts from the Walrus decentralized network.
 */
import { NextResponse } from "next/server";
import { fetchArtifacts } from "@/lib/walrus";

export async function GET() {
  try {
    const artifacts = await fetchArtifacts();
    return NextResponse.json({ success: true, artifacts }, { status: 200 });
  } catch (err: unknown) {
    console.error("[/api/walrus] Error fetching artifacts:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch artifacts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
