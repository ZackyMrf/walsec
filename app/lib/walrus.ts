/**
 * Walrus Storage Helpers
 * Uses the Walrus HTTP Publisher/Aggregator API to store and retrieve audit artifacts.
 * NO LOCAL STORAGE — all records live on Walrus + Sui on-chain only.
 */

export interface AuditArtifact {
  walrus_object_id: string;
  vulnerability_type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  timestamp: string;
  target_function?: string;
  namespace: string;
  size_kb?: number;
  status?: "VERIFIED" | "SYNCING" | "CORRUPT";
  remediation?: string;
  risk_score?: number;
  cve_analogue?: string;
  agent_consensus?: string;
}

/**
 * Stores an audit artifact on the Walrus network.
 * Returns the Walrus blob ID, or a fallback ID if Walrus is unreachable.
 * No local file persistence — data lives only on Walrus + Sui on-chain.
 */
export async function storeArtifact(data: AuditArtifact): Promise<string> {
  const publisherUrl =
    process.env.WALRUS_PUBLISHER_URL ||
    "https://publisher.walrus-testnet.walrus.space";

  const payload = JSON.stringify(data);

  try {
    const response = await fetch(`${publisherUrl}/v1/blobs?epochs=5`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });

    if (!response.ok) {
      throw new Error(`Walrus publisher returned ${response.status}`);
    }

    const result = await response.json();

    const blobId =
      result?.newlyCreated?.blobObject?.blobId ||
      result?.alreadyCertified?.blobId ||
      `walrus_${Date.now().toString(16)}`;

    return blobId;
  } catch (err) {
    console.warn("[Walrus] Publisher unavailable:", (err as Error).message);
    // Return a fallback ID — artifact still gets stored on-chain via wallet tx
    const fallbackId = `pending_${Date.now().toString(16)}_${Math.random().toString(16).slice(2, 8)}`;
    return fallbackId;
  }
}

/**
 * Fetches stored audit artifacts from Walrus aggregator (if configured).
 * Returns empty array if Walrus is unavailable — on-chain data is fetched separately via Sui RPC.
 */
export async function fetchArtifacts(): Promise<AuditArtifact[]> {
  const aggregatorUrl = process.env.WALRUS_AGGREGATOR_URL;

  if (aggregatorUrl) {
    try {
      const response = await fetch(
        `${aggregatorUrl}/v1/objects?namespace=walsec_audit`,
        { headers: { Accept: "application/json" }, next: { revalidate: 15 } }
      );
      if (response.ok) {
        const items: AuditArtifact[] = await response.json();
        return items;
      }
    } catch {
      // fall through
    }
  }

  return [];
}
