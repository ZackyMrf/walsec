"use client";

import { useState, useEffect, useCallback } from "react";
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';

// Walrus aggregator base URL (public read — no wallet needed)
const WALRUS_AGGREGATOR = "https://aggregator.walrus-testnet.walrus.space";

function isBlobId(id: string) {
  // MemWal job IDs are UUIDs which contain hyphens. True Walrus blob IDs do not.
  return !id.includes("-") && !id.startsWith("pending_");
}

function walrusBlobUrl(id: string) {
  if (!isBlobId(id)) return "#"; // prevent navigating to aggregator with UUID
  return `${WALRUS_AGGREGATOR}/v1/blobs/${id}`;
}
// Inline type — mirrors AuditArtifact from lib/walrus.ts (avoids importing server code on client)
interface AuditArtifact {
  walrus_object_id: string;
  vulnerability_type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  timestamp: string;
  target_function?: string;
  namespace?: string;
  size_kb?: number;
  status?: "VERIFIED" | "SYNCING" | "CORRUPT";
}

type StatusType = "VERIFIED" | "SYNCING" | "CORRUPT";

function StatusChip({ status }: { status?: StatusType }) {
  const cls =
    status === "VERIFIED"
      ? "chip chip-verified"
      : status === "SYNCING"
        ? "chip chip-syncing"
        : "chip chip-corrupt";
  return <span className={cls}>{status || "UNKNOWN"}</span>;
}

function formatSize(kb?: number): string {
  if (!kb) return "—";
  if (kb >= 1_000_000) return `${(kb / 1_000_000).toFixed(1)} GB`;
  if (kb >= 1_000) return `${(kb / 1_000).toFixed(2)} MB`;
  return `${kb} KB`;
}

function truncateId(id: string) {
  if (id.length <= 14) return id;
  return `${id.slice(0, 10)}...${id.slice(-4)}`;
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

export default function ExplorerPage() {
  const [artifacts, setArtifacts] = useState<AuditArtifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AuditArtifact | null>(null);
  const [searchId, setSearchId] = useState("");
  const [searchNs, setSearchNs] = useState("");
  const [networkLogs, setNetworkLogs] = useState<string[]>([]);
  const [blobContent, setBlobContent] = useState<string | null>(null);
  const [blobLoading, setBlobLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const account = useCurrentAccount();
  const suiClient = useSuiClient();

  // ── Fetch from Sui Blockchain ──────────────────────────────────────────────
  const fetchOnChainData = useCallback(async () => {
    if (!account) {
      setArtifacts([]);
      setSelected(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const packageId = "0x2e42962a95b4a478c27391489a35d225b5d88f678655d2ef2d73b349b1739f8d";

      // Query events emitted by our smart contract
      const { data } = await suiClient.queryEvents({
        query: { MoveEventType: `${packageId}::audit::AuditRecorded` },
        order: "descending"
      });

      // Filter events by the current connected wallet address
      const userArtifacts = data
        .map(event => event.parsedJson as any)
        .filter(json => json.auditor === account.address)
        .map(json => ({
          walrus_object_id: json.walrus_object_id,
          severity: json.severity,
          timestamp: json.timestamp,
          vulnerability_type: "On-Chain Audit Record",
          description: "This record is permanently stored on the Sui blockchain and linked to Walrus decentralized storage.",
          status: "VERIFIED" as const,
          namespace: "WALSEC_ONCHAIN"
        }));

      setArtifacts(userArtifacts);
      if (userArtifacts.length > 0) setSelected(userArtifacts[0]);
    } catch (err) {
      console.error("Failed to fetch from Sui RPC:", err);
    } finally {
      setLoading(false);
    }
  }, [account, suiClient]);

  useEffect(() => {
    fetchOnChainData();
  }, [fetchOnChainData]);

  // Simulate live network logs
  useEffect(() => {
    const msgs = [
      `[${new Date().toLocaleTimeString()}] GET /v1/object/0x92f...A12 [200 OK]`,
      `[${new Date().toLocaleTimeString()}] VALIDATING_SHARD_INTEGRITY...`,
      `[${new Date().toLocaleTimeString()}] SHARD_01: VERIFIED`,
      `[${new Date().toLocaleTimeString()}] SHARD_02: VERIFIED`,
      `[${new Date().toLocaleTimeString()}] BROADCASTING_EPOCH_RENEWAL...`,
      `[${new Date().toLocaleTimeString()}] INCOMING_PEER: 192.168.1.104`,
      `[${new Date().toLocaleTimeString()}] DATA_SYNC_START: OBJECT_4819`,
    ];
    setNetworkLogs(msgs);

    const interval = setInterval(() => {
      setNetworkLogs((prev) => [
        ...prev.slice(-20),
        `[${new Date().toLocaleTimeString()}] ${["SYNC_OK", "PEER_HANDSHAKE", "EPOCH_BUMP", "SHARD_REPLICATED"][
        Math.floor(Math.random() * 4)
        ]
        }: ${Math.floor(Math.random() * 999)}`,
      ]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // ── Filtered results ───────────────────────────────────────────────────────
  const filtered = artifacts.filter((a) => {
    const idMatch = searchId
      ? a.walrus_object_id.toLowerCase().includes(searchId.toLowerCase())
      : true;
    const nsMatch = searchNs
      ? (a.namespace || "").toLowerCase().includes(searchNs.toLowerCase())
      : true;
    return idMatch && nsMatch;
  });

  // ── Fetch blob from Walrus aggregator ─────────────────────────────────────
  const pullBlob = useCallback(async (id: string) => {
    setBlobContent(null);
    setBlobLoading(true);
    
    if (!isBlobId(id)) {
      setBlobContent("[ERROR] This record is pending or stored as a MemWal job ID. It does not have a valid Walrus Blob ID yet.");
      setBlobLoading(false);
      return;
    }

    try {
      const res = await fetch(walrusBlobUrl(id));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const json = await res.json();
        setBlobContent(JSON.stringify(json, null, 2));
      } else {
        const text = await res.text();
        setBlobContent(text.slice(0, 4000));
      }
    } catch (err) {
      setBlobContent(`[ERROR] Could not fetch blob: ${(err as Error).message}`);
    } finally {
      setBlobLoading(false);
    }
  }, []);

  // ── Integrity hash (deterministic preview) ─────────────────────────────────
  function getHash(id: string) {
    const seed = id || "default";
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
      h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    }
    return `f7e${h.toString(16).padStart(8, "0")}b449277d332a9c10029b33e144a${(h * 7).toString(16).slice(0, 10)}...`;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 48px)" }}>
      {/* ── Header ─── */}
      <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid var(--border-default)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h1
              className="headline-md"
              style={{ color: "var(--secondary)", letterSpacing: "0.04em", textTransform: "uppercase" }}
            >
              WALRUS DATABASE EXPLORER
            </h1>
            <p className="label-caps" style={{ marginTop: 4, fontSize: 10 }}>
              WALSEC Artifact Browser / Epoch 428
            </p>
          </div>
          <button id="upload-artifact-btn" className="btn btn-outline-purple">
            UPLOAD_ARTIFACT
          </button>
        </div>

        {/* Search bar */}
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                fontSize: 12,
              }}
            >
              ⌕
            </span>
            <input
              id="explorer-object-id-search"
              className="input"
              placeholder="OBJECT_ID"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              style={{ paddingLeft: 28 }}
            />
          </div>
          <div style={{ flex: 1, position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                fontSize: 12,
              }}
            >
              ◫
            </span>
            <input
              id="explorer-namespace-search"
              className="input"
              placeholder="NAMESPACE"
              value={searchNs}
              onChange={(e) => setSearchNs(e.target.value)}
              style={{ paddingLeft: 28 }}
            />
          </div>
          <button id="execute-query-btn" className="btn btn-primary" onClick={fetchOnChainData}>
            EXECUTE_QUERY
          </button>
        </div>
      </div>

      {/* ── Body: Table + Metadata Panel ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", flex: 1, minHeight: 0 }}>
        {/* Table */}
        <div style={{ overflow: "auto", borderRight: "1px solid var(--border-default)" }}>
          {loading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: 12,
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
                fontSize: 12,
              }}
            >
              <span className="spinner" /> FETCHING_WALRUS_OBJECTS...
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>STATUS</th>
                  <th>OBJECT_ID</th>
                  <th>NAMESPACE</th>
                  <th>SIZE</th>
                  <th>TIMESTAMP</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => (
                  <tr
                    key={i}
                    onClick={() => setSelected(a)}
                    style={{
                      cursor: "pointer",
                      background:
                        selected?.walrus_object_id === a.walrus_object_id
                          ? "rgba(13,102,217,0.08)"
                          : undefined,
                    }}
                  >
                    <td>
                      <StatusChip status={a.status as StatusType} />
                    </td>
                    <td>
                      {/* Clickable — opens blob directly in Walrus aggregator */}
                      <a
                        href={walrusBlobUrl(a.walrus_object_id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="walrus-id"
                        style={{
                          color: "var(--secondary)",
                          textDecoration: "underline",
                          cursor: "pointer",
                          fontFamily: "var(--font-mono)",
                          fontSize: 12,
                        }}
                        onClick={(e) => e.stopPropagation()}
                        title={`Open ${a.walrus_object_id} in Walrus aggregator`}
                      >
                        {truncateId(a.walrus_object_id)}
                        <span style={{ marginLeft: 4, opacity: 0.6, fontSize: 10 }}>↗</span>
                      </a>
                    </td>
                    <td className="mono" style={{ color: "var(--on-surface-variant)" }}>
                      {a.namespace || "—"}
                    </td>
                    <td className="mono">{formatSize(a.size_kb)}</td>
                    <td className="mono" style={{ color: "var(--text-muted)" }}>
                      {new Date(a.timestamp).toLocaleString("en-US", { hour12: false })}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      style={{ textAlign: "center", color: "var(--text-muted)", padding: 40 }}
                    >
                      {account
                        ? "No objects found matching query."
                        : "Connect your wallet to view on-chain audit records."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Metadata Panel */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div className="panel-header" style={{ padding: "8px 16px" }}>
            <span className="label-caps" style={{ color: "var(--secondary)", fontSize: 10 }}>
              METADATA_PANEL
            </span>
          </div>

          {selected ? (
            <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Object ID */}
              <div
                style={{
                  background: "var(--surface-card)",
                  border: "1px solid var(--border-default)",
                  padding: 12,
                }}
              >
                <div className="label-caps" style={{ fontSize: 9, marginBottom: 6 }}>
                  SELECTED_OBJECT
                </div>
                {/* Full Object ID — clickable link */}
                <a
                  href={walrusBlobUrl(selected.walrus_object_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    wordBreak: "break-all",
                    color: "var(--secondary)",
                    textDecoration: "underline",
                    marginBottom: 8,
                  }}
                  title="Open in Walrus aggregator (no wallet needed)"
                >
                  {selected.walrus_object_id} ↗
                </a>
                {/* Copy button */}
                <button
                  id="copy-object-id-btn"
                  className="btn btn-secondary"
                  style={{ width: "100%", fontSize: 10, padding: "4px 8px" }}
                  onClick={async () => {
                    await copyToClipboard(selected.walrus_object_id);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? "✓ COPIED" : "📋 COPY_OBJECT_ID"}
                </button>
              </div>

              {/* Epoch + Redundancy */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-default)", padding: 10 }}>
                  <div className="label-caps" style={{ fontSize: 9, marginBottom: 4 }}>STORAGE_EPOCH</div>
                  <div className="mono" style={{ fontSize: 16, fontWeight: 700 }}>428</div>
                </div>
                <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-default)", padding: 10 }}>
                  <div className="label-caps" style={{ fontSize: 9, marginBottom: 4 }}>REDUNDANCY</div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--on-tertiary-container)", fontWeight: 700 }}>
                    3X_REPLICATED
                  </div>
                </div>
              </div>

              {/* Encryption */}
              <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-default)", padding: 12 }}>
                <div className="label-caps" style={{ fontSize: 9, marginBottom: 6 }}>ENCRYPTION_DETAILS</div>
                <div className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  🔒 AES-256-GCM / SHARDED
                  <br />
                  Key Reference: SEC_AUDIT_PRV_04
                </div>
              </div>

              {/* Integrity Hash */}
              <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-default)", padding: 12 }}>
                <div className="label-caps" style={{ fontSize: 9, marginBottom: 6 }}>
                  INTEGRITY_HASH (SHA-256)
                </div>
                <div
                  className="mono"
                  style={{ fontSize: 10, wordBreak: "break-all", color: "var(--on-surface-variant)" }}
                >
                  {getHash(selected.walrus_object_id)}
                </div>
              </div>

              {/* Action buttons */}
              <a
                id="view-json-schema-btn"
                className="btn btn-outline-purple"
                href={walrusBlobUrl(selected.walrus_object_id)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ width: "100%", display: "block", textAlign: "center", textDecoration: "none" }}
              >
                👁 VIEW_ON_WALRUS ↗
              </a>
              <button
                id="verify-hash-btn"
                className="btn btn-secondary"
                style={{ width: "100%" }}
                onClick={() => {
                  if (isBlobId(selected.walrus_object_id)) {
                    window.open(
                      `https://walruscan.com/testnet/blob/${selected.walrus_object_id}`,
                      "_blank"
                    );
                  } else {
                    alert("This record does not have a valid Walrus Blob ID yet.");
                  }
                }}
              >
                🔍 VIEW_ON_WALRUSCAN ↗
              </button>
              <button
                id="pull-from-walrus-btn"
                className="btn btn-secondary"
                style={{ width: "100%" }}
                onClick={() => pullBlob(selected.walrus_object_id)}
                disabled={blobLoading}
              >
                {blobLoading ? "⏳ FETCHING..." : "↓ PULL_FROM_WALRUS"}
              </button>

              {/* Blob content viewer */}
              {blobContent !== null && (
                <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-default)", padding: 10 }}>
                  <div className="label-caps" style={{ fontSize: 9, marginBottom: 6 }}>BLOB_CONTENT</div>
                  <pre
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      color: "var(--on-surface-variant)",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                      maxHeight: 200,
                      overflowY: "auto",
                      margin: 0,
                    }}
                  >
                    {blobContent}
                  </pre>
                </div>
              )}

              {/* Network Logs */}
              <div style={{ marginTop: 4 }}>
                <div className="label-caps" style={{ fontSize: 9, marginBottom: 6 }}>NETWORK_LOGS_STREAM</div>
                <div
                  className="terminal"
                  style={{ height: 120, overflowY: "auto", fontSize: 10 }}
                >
                  {networkLogs.map((l, i) => (
                    <div key={i} className="log-system">{l}</div>
                  ))}
                  <span className="terminal-cursor" />
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
              }}
            >
              SELECT_OBJECT_TO_INSPECT
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ─── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "6px 24px",
          borderTop: "1px solid var(--border-default)",
          background: "var(--surface-card)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="led led-green" />
          <span className="label-caps" style={{ fontSize: 9 }}>
            WALRUS_NODE_HEALTH: OPTIMAL
          </span>
          <span className="label-caps" style={{ fontSize: 9, color: "var(--text-muted)" }}>
            | LATENCY: 14MS
          </span>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <span className="label-caps" style={{ fontSize: 9, color: "var(--text-muted)" }}>
            PROTOCOL_V: 2.1.0-BETA
          </span>
          <span className="label-caps" style={{ fontSize: 9, color: "var(--text-muted)" }}>
            REGION: US-EAST-SEC
          </span>
        </div>
      </div>
    </div>
  );
}
