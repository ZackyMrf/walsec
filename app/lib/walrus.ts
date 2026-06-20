import { MemWal } from "@mysten-incubation/memwal";

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

let memwalInstance: MemWal | null = null;

export function getMemWal() {
  if (memwalInstance) return memwalInstance;
  
  const key = process.env.MEMWAL_PRIVATE_KEY;
  const accountId = process.env.MEMWAL_ACCOUNT_ID;
  const serverUrl = process.env.MEMWAL_SERVER_URL;

  if (key && accountId) {
    memwalInstance = MemWal.create({
      key,
      accountId,
      serverUrl: serverUrl || "https://relayer.memory.walrus.xyz",
    });
  }
  return memwalInstance;
}

/**
 * Stores an audit artifact on the Walrus network and indexes it via Memwal SDK.
 * Returns the Walrus blob ID, or a fallback ID if Walrus is unreachable.
 */
export async function storeArtifact(data: AuditArtifact): Promise<string> {
  const memwal = getMemWal();
  const payload = JSON.stringify(data);
  let blobId = "";

  // 1. Upload to Walrus Publisher first to get a deterministic blob_id
  const publisherUrl = process.env.WALRUS_PUBLISHER_URL || "https://publisher.walrus-testnet.walrus.space";
  try {
    const response = await fetch(`${publisherUrl}/v1/blobs?epochs=5`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });
    if (!response.ok) throw new Error(`Walrus publisher returned ${response.status}`);
    const result = await response.json();
    blobId = result?.newlyCreated?.blobObject?.blobId || result?.alreadyCertified?.blobId || `walrus_${Date.now().toString(16)}`;
  } catch (err) {
    console.warn("[Walrus] Publisher unavailable:", (err as Error).message);
    blobId = `pending_${Date.now().toString(16)}_${Math.random().toString(16).slice(2, 8)}`;
  }

  // 2. Persist semantic memory in MemWal using the payload
  if (memwal && !blobId.startsWith("pending_")) {
    try {
      // We inject the correct blobId so Memwal's semantic search has it too
      const enrichedData = { ...data, walrus_object_id: blobId };
      await memwal.remember(JSON.stringify(enrichedData), "walsec_audit");
    } catch (err) {
      console.warn("[MemWal] Failed to store artifact:", err);
    }
  }

  return blobId;
}

/**
 * Fetches stored audit artifacts from Walrus aggregator or Memwal Semantic Search.
 */
export async function fetchArtifacts(): Promise<AuditArtifact[]> {
  const memwal = getMemWal();
  if (memwal) {
    try {
      // Recall using semantic vector search on MemWal
      const result = await memwal.recall({ 
        query: "audit vulnerability report", 
        limit: 50, 
        namespace: "walsec_audit" 
      });
      const artifacts: AuditArtifact[] = [];
      for (const item of result.results) {
        try {
          artifacts.push(JSON.parse(item.text));
        } catch {
          // ignore malformed JSON
        }
      }
      return artifacts;
    } catch (err) {
      console.warn("[MemWal] Failed to recall artifacts:", err);
    }
  }

  // Fallback
  const aggregatorUrl = process.env.WALRUS_AGGREGATOR_URL;
  if (aggregatorUrl) {
    try {
      const response = await fetch(`${aggregatorUrl}/v1/objects?namespace=walsec_audit`, {
        headers: { Accept: "application/json" },
        next: { revalidate: 15 }
      });
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // fall through
    }
  }

  return [];
}
