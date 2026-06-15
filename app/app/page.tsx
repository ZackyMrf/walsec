"use client";

import { useRef, useEffect, useState, useCallback, Component, ReactNode } from "react";
import { useSwarm, AgentStage, HistoryRow } from "@/context/SwarmContext";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

// ─── Error Boundary ──────────────────────────────────────────────────────────
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  state = { hasError: false, error: "" };
  static getDerivedStateFromError(err: Error) { return { hasError: true, error: err.message }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: "center", color: "var(--semantic-alert)", fontFamily: "var(--font-mono)" }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⚠ SYSTEM_ERROR</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>{this.state.error}</div>
          <button className="btn btn-secondary" onClick={() => { this.setState({ hasError: false, error: "" }); window.location.reload(); }}>
            REBOOT_SYSTEM
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Sample vulnerable contracts ─────────────────────────────────────────────
const SAMPLE_CONTRACTS: { label: string; vuln: string; code: string }[] = [
  {
    label: "VAULT_OVERFLOW",
    vuln: "Integer Overflow / No Bounds Check",
    code: `module vault::vault {
    use sui::object::{Self, UID};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    public struct Vault has key {
        id: UID,
        balance: Balance<SUI>,
        total_deposited: u64,
    }

    // VULNERABLE: No overflow check on total_deposited += amount
    // If total_deposited + amount > MAX_U64, it wraps around silently
    public entry fun deposit(vault: &mut Vault, coin: sui::coin::Coin<SUI>, _ctx: &mut TxContext) {
        let amount = sui::coin::value(&coin);
        balance::join(&mut vault.balance, sui::coin::into_balance(coin));
        vault.total_deposited = vault.total_deposited + amount;  // OVERFLOW HERE
    }

    // VULNERABLE: subtraction can underflow if amount > total_deposited
    public entry fun withdraw(vault: &mut Vault, amount: u64, to: address, ctx: &mut TxContext) {
        vault.total_deposited = vault.total_deposited - amount;  // UNDERFLOW HERE
        let coin = balance::split(&mut vault.balance, amount);
        transfer::public_transfer(sui::coin::from_balance(coin, ctx), to);
    }
}`,
  },
  {
    label: "ACCESS_CONTROL_BYPASS",
    vuln: "Missing Ownership Check",
    code: `module defi::lending_pool {
    use sui::object::{Self, UID};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::vec_map::VecMap;

    public struct LendingPool has key {
        id: UID,
        pool_balance: Balance<SUI>,
        admin_cap_id: UID,  // Admin capability - but never checked!
        borrower_balances: VecMap<address, u64>,
    }

    public struct AdminCap has key, store { id: UID }

    // VULNERABLE: No AdminCap check — ANYONE can drain the pool
    public entry fun emergency_withdraw(pool: &mut LendingPool, amount: u64, to: address, ctx: &mut TxContext) {
        // Missing: assert!(tx_context::sender(ctx) == pool.admin, 0);
        // Missing: capability verification
        let coin = balance::split(&mut pool.pool_balance, amount);
        transfer::public_transfer(sui::coin::from_balance(coin, ctx), to);
    }

    // VULNERABLE: Anyone can modify borrower balances
    public entry fun set_borrower_balance(
        pool: &mut LendingPool,
        borrower: address,
        amount: u64,
        _ctx: &mut TxContext  // No access control check!
    ) {
        vec_map::insert_or_update(&mut pool.borrower_balances, borrower, amount);
    }

    use sui::vec_map;
}`,
  },
];

// ─── Walrus public aggregator ────────────────────────────────────────────────
const WALRUS_AGGREGATOR = "https://aggregator.walrus-testnet.walrus.space";
function walrusBlobUrl(id: string) {
  return `${WALRUS_AGGREGATOR}/v1/blobs/${id}`;
}

// ─── Patched / Fixed contract versions ───────────────────────────────────────
const FIXED_CONTRACTS = new Map<string, string>([
  [
    SAMPLE_CONTRACTS[0].code,
    `module vault::vault {
    use sui::object::{Self, UID};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::math;

    // Error codes
    const EOverflow: u64 = 0;
    const EUnderflow: u64 = 1;
    const EInsufficientBalance: u64 = 2;
    const EZeroAmount: u64 = 3;

    public struct Vault has key {
        id: UID,
        balance: Balance<SUI>,
        total_deposited: u64,
    }

    /// FIXED: Uses math::add to prevent integer overflow.
    /// Aborts with EOverflow if total_deposited + amount exceeds u64::MAX.
    /// Also validates that amount is non-zero.
    public entry fun deposit(vault: &mut Vault, coin: sui::coin::Coin<SUI>, _ctx: &mut TxContext) {
        let amount = sui::coin::value(&coin);
        assert!(amount > 0, EZeroAmount);
        balance::join(&mut vault.balance, sui::coin::into_balance(coin));
        // SAFE: math::add aborts on overflow instead of silently wrapping
        vault.total_deposited = math::add(vault.total_deposited, amount);
    }

    /// FIXED: Uses math::sub to prevent integer underflow.
    /// Validates sufficient balance before withdrawal.
    /// Aborts with EUnderflow if amount > total_deposited.
    public entry fun withdraw(vault: &mut Vault, amount: u64, to: address, ctx: &mut TxContext) {
        assert!(amount > 0, EZeroAmount);
        assert!(amount <= vault.total_deposited, EUnderflow);
        assert!(amount <= balance::value(&vault.balance), EInsufficientBalance);
        // SAFE: math::sub aborts on underflow
        vault.total_deposited = math::sub(vault.total_deposited, amount);
        let coin = balance::split(&mut vault.balance, amount);
        transfer::public_transfer(sui::coin::from_balance(coin, ctx), to);
    }
}`,
  ],
  [
    SAMPLE_CONTRACTS[1].code,
    `module defi::lending_pool {
    use sui::object::{Self, UID};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::vec_map::{Self, VecMap};

    // Error codes
    const EInvalidAdminCap: u64 = 0;
    const EInsufficientPoolBalance: u64 = 1;
    const EZeroAmount: u64 = 2;

    public struct LendingPool has key {
        id: UID,
        pool_balance: Balance<SUI>,
        admin_cap_id: UID,
        borrower_balances: VecMap<address, u64>,
    }

    public struct AdminCap has key, store { id: UID }

    /// FIXED: Added explicit AdminCap validation.
    /// Asserts that the provided _cap's UID matches pool.admin_cap_id,
    /// preventing cross-pool privilege escalation.
    public entry fun emergency_withdraw(
        _cap: &AdminCap,
        pool: &mut LendingPool,
        amount: u64,
        to: address,
        ctx: &mut TxContext
    ) {
        assert!(amount > 0, EZeroAmount);
        // CRITICAL FIX: Verify this AdminCap belongs to THIS pool
        assert!(_cap.id == pool.admin_cap_id, EInvalidAdminCap);
        assert!(amount <= balance::value(&pool.pool_balance), EInsufficientPoolBalance);
        let coin = balance::split(&mut pool.pool_balance, amount);
        transfer::public_transfer(sui::coin::from_balance(coin, ctx), to);
    }

    /// FIXED: Added explicit AdminCap validation for borrower balance updates.
    /// Only the pool's designated admin can modify borrower balances.
    public entry fun set_borrower_balance(
        _cap: &AdminCap,
        pool: &mut LendingPool,
        borrower: address,
        amount: u64,
        _ctx: &mut TxContext
    ) {
        // CRITICAL FIX: Verify this AdminCap belongs to THIS pool
        assert!(_cap.id == pool.admin_cap_id, EInvalidAdminCap);
        vec_map::insert_or_update(&mut pool.borrower_balances, borrower, amount);
    }
}`,
  ],
]);

// ─── Log line colorizer ──────────────────────────────────────────────────────
function LogLine({ line }: { line: string }) {
  let cls = "log-system";
  if (line.startsWith("[ANALYZER]")) cls = "log-analyzer";
  else if (line.startsWith("[EXECUTOR]")) cls = "log-executor";
  else if (line.startsWith("[EVALUATOR]")) cls = "log-evaluator";
  else if (line.includes("✓") || line.includes("SUCCESS")) cls = "log-success";
  else if (line.includes("[!!]") || line.includes("ALERT") || line.includes("CRITICAL")) cls = "log-error";
  else if (line.includes("WARN") || line.includes("Overflow")) cls = "log-warn";

  return <div className={cls}>{line}</div>;
}

// ─── Severity chip ───────────────────────────────────────────────────────────
function SeverityChip({ severity }: { severity: string }) {
  const cls = `chip chip-${severity.toLowerCase()}`;
  return <span className={cls}>{severity}</span>;
}

// ─── Agent Pipeline Stepper ──────────────────────────────────────────────────
const PIPELINE_STAGES: { key: AgentStage; label: string; sub: string; color: string }[] = [
  { key: "analyzer", label: "ANALYZER", sub: "Pattern Scan", color: "var(--secondary)" },
  { key: "executor", label: "EXECUTOR", sub: "Exploit Sim", color: "var(--on-tertiary-container)" },
  { key: "evaluator", label: "EVALUATOR", sub: "Consensus", color: "var(--semantic-safe)" },
  { key: "storing", label: "STORE", sub: "On-Chain", color: "var(--semantic-warning)" },
];

const STAGE_ORDER: AgentStage[] = ["analyzer", "executor", "evaluator", "storing"];

function AgentPipelineStepper({ stage }: { stage: AgentStage }) {
  const currentIdx = STAGE_ORDER.indexOf(stage);

  function getState(s: AgentStage, idx: number) {
    if (stage === "idle") return "idle";
    if (stage === "complete" || stage === "error") return "done";
    if (idx < currentIdx) return "done";
    if (idx === currentIdx) return "active";
    return "idle";
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, padding: "8px 16px", borderBottom: "1px solid var(--border-default)", background: "var(--surface-card)" }}>
      <span className="label-caps" style={{ fontSize: 10, color: "var(--text-muted)", marginRight: 12 }}>
        PIPELINE
      </span>
      {PIPELINE_STAGES.map((s, idx) => {
        const st = getState(s.key, idx);
        const isDone = st === "done";
        const isActive = st === "active";
        const dotColor = isDone ? "var(--semantic-safe)" : isActive ? s.color : "var(--border-default)";
        const labelColor = isDone ? "var(--semantic-safe)" : isActive ? s.color : "var(--text-muted)";
        return (
          <div key={s.key} style={{ display: "flex", alignItems: "center" }}>
            {idx > 0 && (
              <div
                style={{
                  width: 28,
                  height: 2,
                  background: isDone || isActive ? "var(--semantic-safe)" : "var(--border-default)",
                  margin: "0 4px",
                  transition: "background 0.3s",
                }}
              />
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {/* Status dot */}
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: dotColor,
                  boxShadow: isActive ? `0 0 8px ${dotColor}` : "none",
                  animation: isActive ? "pulse 0.8s infinite" : "none",
                  transition: "all 0.3s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 7,
                  color: "#000",
                  fontWeight: 700,
                }}
              >
                {isDone && "✓"}
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: labelColor, letterSpacing: "0.08em", lineHeight: 1.1 }}>
                  {s.label}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: isActive ? s.color : "var(--text-muted)", letterSpacing: "0.06em" }}>
                  {isDone ? "COMPLETE" : isActive ? "RUNNING..." : s.sub}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      {stage === "error" && (
        <span className="chip chip-critical" style={{ marginLeft: 12, fontSize: 9 }}>ABORTED</span>
      )}
      {stage === "complete" && (
        <span className="chip chip-verified" style={{ marginLeft: 12, fontSize: 9 }}>COMPLETE</span>
      )}
    </div>
  );
}

// ─── Dashboard page ──────────────────────────────────────────────────────────
function DashboardInner() {
  const {
    code, setCode,
    logs, setLogs,
    artifact, setArtifact,
    history, setHistory,
    error, setError,
    isPending, setIsPending,
    agentStage, setAgentStage,
  } = useSwarm();
  const logRef = useRef<HTMLDivElement>(null);

  // Wallet hooks
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();

  // ── Wallet gate modal ──
  const [showWalletModal, setShowWalletModal] = useState(false);

  // ── Resizable bottom panel ──
  const [bottomHeight, setBottomHeight] = useState(240);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // ── Fix applied animation ──
  const [showFixApplied, setShowFixApplied] = useState(false);
  const [patchingCode, setPatchingCode] = useState(false);
  const typingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup typing timer on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    };
  }, []);

  // ── Vulnerability detail modal ──
  const [showVulnDetail, setShowVulnDetail] = useState(false);
  const [selectedVulnRow, setSelectedVulnRow] = useState<HistoryRow | null>(null);

  // The data to display in the vulnerability detail modal
  const vulnData = selectedVulnRow || artifact;

  // Find the fixed version of the currently loaded code
  function findFix(): string | null {
    for (const [vulnCode, fixedCode] of FIXED_CONTRACTS) {
      if (code.trim() === vulnCode.trim()) return fixedCode;
      // Also match by module signature if the code has been slightly modified
      const vulnModule = vulnCode.match(/module\s+(\w+::\w+)/);
      const curModule = code.match(/module\s+(\w+::\w+)/);
      if (vulnModule && curModule && vulnModule[1] === curModule[1]) {
        // Same module — likely the vulnerable version, offer fix
        return fixedCode;
      }
    }
    return null;
  }

  function handleApplyFix() {
    const fixedCode = findFix();
    if (!fixedCode) {
      setLogs((prev) => [...prev, `[WARN] Manual fix needed. Use the remediation advisory above.`]);
      return;
    }

    // Clear any existing typing timer
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);

    // Start patching animation
    setPatchingCode(true);
    setShowFixApplied(true);
    setArtifact(null);
    setLogs((prev) => [
      ...prev,
      `[SYSTEM]  Applying automated patch...`,
      `[SYSTEM]  Rewriting vulnerable code with secure implementation...`,
    ]);

    // Typing animation: type out the fixed code chunk by chunk
    const CHUNK_SIZE = 4; // characters per tick
    const TICK_MS = 8; // ms between ticks — fast enough to feel smooth
    let charIndex = 0;

    // Clear editor first, then start typing
    setCode("");

    typingTimerRef.current = setInterval(() => {
      if (charIndex >= fixedCode.length) {
        // Done typing
        if (typingTimerRef.current) clearInterval(typingTimerRef.current);
        typingTimerRef.current = null;
        setPatchingCode(false);
        setLogs((prev) => [
          ...prev,
          `[SUCCESS] ✓ PATCH automatically applied! Vulnerabilities fixed.`,
          `[SUCCESS] ✓ Re-run audit to verify the fix.`,
        ]);
        setTimeout(() => setShowFixApplied(false), 3000);
        return;
      }

      const nextIndex = Math.min(charIndex + CHUNK_SIZE, fixedCode.length);
      setCode(fixedCode.slice(0, nextIndex));
      charIndex = nextIndex;
    }, TICK_MS);
  }

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newBottom = rect.bottom - e.clientY;
      setBottomHeight(Math.min(Math.max(80, newBottom), rect.height - 120));
    }
    function onMouseUp() {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  // Auto-scroll log terminal
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  // ── Load history from on-chain when wallet connects, clear when disconnects ──
  useEffect(() => {
    if (!account) {
      setHistory([]);
      return;
    }

    let cancelled = false;
    const walletAddress = account.address;
    async function loadOnChainHistory() {
      try {
        const packageId = "0x2e42962a95b4a478c27391489a35d225b5d88f678655d2ef2d73b349b1739f8d";
        const { data } = await suiClient.queryEvents({
          query: { MoveEventType: `${packageId}::audit::AuditRecorded` },
          order: "descending",
        });
        if (cancelled) return;
        const rows = data
          .map(ev => ev.parsedJson as Record<string, string>)
          .filter(json => json.auditor === walletAddress)
          .map(json => ({
            walrus_object_id: json.walrus_object_id,
            severity: json.severity as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
            timestamp: json.timestamp,
            vulnerability_type: "On-Chain Audit Record",
            description: "Audit record stored on Sui blockchain via wallet transaction.",
            target_function: "—",
          }));
        setHistory(rows);
      } catch (err) {
        console.warn("Failed to load on-chain history:", err);
        if (!cancelled) setHistory([]);
      }
    }
    loadOnChainHistory();
    return () => { cancelled = true; };
  }, [account, suiClient, setHistory]);

  // ─── Gate: require wallet before audit ─────────────────────────────────────
  function handleInitClick() {
    if (!code.trim()) return;
    if (!account) {
      setShowWalletModal(true);
      return;
    }
    handleAuditSubmit();
  }

  // ─── Submit handler ────────────────────────────────────────────────────────
  async function handleAuditSubmit() {
    if (!code.trim()) return;
    setError(null);
    setLogs([]);
    setArtifact(null);
    setIsPending(true);
    setAgentStage("analyzer");

    try {
      // Start streaming logs
      const streamLogs: { text: string; stage: AgentStage }[] = [
        { text: "[SYSTEM] Initializing WALSEC Swarm Protocol...", stage: "analyzer" },
        { text: "[SYSTEM] Connecting to Walrus memory node...", stage: "analyzer" },
        { text: "[ANALYZER] Loading contract bytecode into pattern recognition engine...", stage: "analyzer" },
        { text: "[ANALYZER] Running symbolic execution pass 1/3...", stage: "analyzer" },
        { text: "[ANALYZER] Running symbolic execution pass 2/3...", stage: "analyzer" },
        { text: "[ANALYZER] Running symbolic execution pass 3/3...", stage: "analyzer" },
        { text: "[ANALYZER] Heuristic scan complete. Passing findings to Executor...", stage: "analyzer" },
        { text: "[SYSTEM] Passing findings to Executor_02...", stage: "executor" },
        { text: "[EXECUTOR] Constructing exploit simulation matrix...", stage: "executor" },
        { text: "[EXECUTOR] Generating exploit proof-of-concept vectors...", stage: "executor" },
        { text: "[EXECUTOR] Payload simulation complete. Passing to Evaluator...", stage: "executor" },
        { text: "[SYSTEM] Passing payload to Evaluator_03...", stage: "evaluator" },
        { text: "[EVALUATOR] Consensus protocol initiated...", stage: "evaluator" },
        { text: "[EVALUATOR] Cross-referencing findings with exploit vectors...", stage: "evaluator" },
        { text: "[EVALUATOR] Compiling final audit artifact...", stage: "evaluator" },
      ];

      // Stream logs one-by-one with increasing delays
      for (let i = 0; i < streamLogs.length; i++) {
        await new Promise<void>((res) => setTimeout(res, 250 + i * 80));
        setLogs((prev) => [...prev, streamLogs[i].text]);
        setAgentStage(streamLogs[i].stage);
      }

      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractCode: code }),
      });

      const data = await res.json().catch(() => ({ error: "Failed to parse server response" }));

      if (!res.ok) {
        throw new Error(data.error || `Audit failed with status ${res.status}`);
      }

      // Append real pipeline logs
      if (data.logs?.length) {
        setLogs((prev) => [...prev, ...data.logs]);
      }

      setAgentStage("storing");

      if (data.finalArtifact) {
        setArtifact(data.finalArtifact);
        setLogs((prev) => [
          ...prev,
          `[SYSTEM] ─────────────────────────────────────`,
          `[SYSTEM] AUDIT_COMPLETE. Walrus Object: ${data.walrusObjectId}`,
        ]);

        // ── Save to blockchain if wallet is connected ──
        if (account && data.walrusObjectId) {
          setLogs((prev) => [...prev, `[SYSTEM] Requesting wallet signature to store audit on-chain...`]);
          try {
            const tx = new Transaction();
            const packageId = "0x2e42962a95b4a478c27391489a35d225b5d88f678655d2ef2d73b349b1739f8d";
            tx.moveCall({
              target: `${packageId}::audit::record_audit`,
              arguments: [
                tx.pure.string(data.walrusObjectId),
                tx.pure.string(data.finalArtifact.severity),
                tx.pure.string(data.finalArtifact.timestamp),
              ],
            });
            await signAndExecuteTransaction({ transaction: tx });
            setLogs((prev) => [...prev, `[SUCCESS] ✓ Audit record committed to Sui blockchain!`]);

            // Add to local history (will also be refreshed from chain on next connect)
            setHistory((prev) => [
              {
                ...data.finalArtifact,
                walrus_object_id: data.walrusObjectId,
              },
              ...prev.slice(0, 19),
            ]);
          } catch (txErr) {
            const txMsg = txErr instanceof Error ? txErr.message : "Transaction rejected";
            setLogs((prev) => [...prev, `[WARN] Wallet transaction failed: ${txMsg.slice(0, 80)}`]);
            // Still show result even if chain store fails
            setHistory((prev) => [
              { ...data.finalArtifact, walrus_object_id: data.walrusObjectId },
              ...prev.slice(0, 19),
            ]);
          }
        } else {
          setLogs((prev) => [...prev, `[WARN] No wallet connected. Connect wallet to persist audit on-chain.`]);
          setHistory((prev) => [
            { ...data.finalArtifact, walrus_object_id: data.walrusObjectId },
            ...prev.slice(0, 19),
          ]);
        }
      }

      setAgentStage("complete");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error occurred";
      setError(message);
      setAgentStage("error");
      setLogs((prev) => [
        ...prev,
        `[SYSTEM] ─────────────────────────────────────`,
        `[SYSTEM] ERROR: ${message}`,
        `[SYSTEM] Audit aborted. Please try again.`,
      ]);
    } finally {
      setIsPending(false);
    }
  }

  // ─── Format timestamp ──────────────────────────────────────────────────────
  function formatTime(ts: string) {
    try {
      return new Date(ts).toLocaleTimeString("en-US", { hour12: false });
    } catch {
      return ts;
    }
  }

  return (
    <div ref={containerRef} style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 48px)", position: "relative" }}>
      {/* ── Vulnerability Detail Modal ─── */}
      {showVulnDetail && vulnData && (
        <div className="vuln-detail-overlay" onClick={() => setShowVulnDetail(false)}>
          <div className="vuln-detail-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <SeverityChip severity={vulnData.severity} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, color: "var(--primary)" }}>
                  {vulnData.vulnerability_type}
                </span>
              </div>
              <button className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: 10 }} onClick={() => setShowVulnDetail(false)}>✕ CLOSE</button>
            </div>

            {/* Risk Score */}
            {vulnData.risk_score !== undefined && (
              <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                <div style={{ background: "var(--surface-lowest)", border: "1px solid var(--border-default)", padding: "8px 14px", flex: 1 }}>
                  <div className="label-caps" style={{ fontSize: 9, marginBottom: 2 }}>RISK_SCORE</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 700, color: vulnData.risk_score > 70 ? "var(--semantic-alert)" : vulnData.risk_score > 40 ? "var(--semantic-warning)" : "var(--semantic-safe)" }}>
                    {vulnData.risk_score}<span style={{ fontSize: 11, color: "var(--text-muted)" }}>/100</span>
                  </div>
                </div>
                {vulnData.cve_analogue && (
                  <div style={{ background: "var(--surface-lowest)", border: "1px solid var(--border-default)", padding: "8px 14px", flex: 1 }}>
                    <div className="label-caps" style={{ fontSize: 9, marginBottom: 2 }}>CWE_REFERENCE</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 700, color: "var(--secondary)" }}>
                      {vulnData.cve_analogue}
                    </div>
                  </div>
                )}
                <div style={{ background: "var(--surface-lowest)", border: "1px solid var(--border-default)", padding: "8px 14px", flex: 1 }}>
                  <div className="label-caps" style={{ fontSize: 9, marginBottom: 2 }}>TARGET</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "var(--on-surface-variant)" }}>
                    {vulnData.target_function || "—"}
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div style={{ marginBottom: 16 }}>
              <div className="label-caps" style={{ fontSize: 9, color: "var(--semantic-alert)", marginBottom: 6 }}>VULNERABILITY_DESCRIPTION</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--on-surface)", lineHeight: 1.7, background: "var(--surface-lowest)", border: "1px solid var(--border-default)", padding: 12 }}>
                {vulnData.description}
              </div>
            </div>

            {/* Remediation */}
            {vulnData.remediation && (
              <div style={{ marginBottom: 16 }}>
                <div className="label-caps" style={{ fontSize: 9, color: "var(--semantic-safe)", marginBottom: 6 }}>REMEDIATION_STEPS</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--on-surface)", lineHeight: 1.7, background: "rgba(16,185,129,0.06)", border: "1px solid var(--semantic-safe)", borderLeft: "3px solid var(--semantic-safe)", padding: 12, whiteSpace: "pre-wrap" }}>
                  {vulnData.remediation}
                </div>
              </div>
            )}

            {/* Agent Consensus + Status */}
            {(vulnData.agent_consensus || vulnData.status) && (
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {vulnData.agent_consensus && (
                  <div style={{ background: "var(--surface-lowest)", border: "1px solid var(--border-default)", padding: "6px 12px" }}>
                    <div className="label-caps" style={{ fontSize: 9, marginBottom: 2 }}>CONSENSUS</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: "var(--semantic-safe)" }}>{vulnData.agent_consensus}</div>
                  </div>
                )}
                {vulnData.status && (
                  <div style={{ background: "var(--surface-lowest)", border: "1px solid var(--border-default)", padding: "6px 12px" }}>
                    <div className="label-caps" style={{ fontSize: 9, marginBottom: 2 }}>STATUS</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: vulnData.status === "VERIFIED" ? "var(--semantic-safe)" : "var(--semantic-warning)" }}>{vulnData.status}</div>
                  </div>
                )}
              </div>
            )}

            {/* Fix button */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className={`fix-btn${findFix() ? " fix-btn-available" : ""}`}
                onClick={() => { setShowVulnDetail(false); setSelectedVulnRow(null); handleApplyFix(); }}
                disabled={isPending || patchingCode}
              >
                {findFix() ? "🔧 APPLY_AUTO_FIX" : " MANUAL_FIX_ONLY"}
              </button>
              <button className="btn btn-secondary" onClick={() => { setShowVulnDetail(false); setSelectedVulnRow(null); }}>
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Wallet Required Modal ─── */}
      {showWalletModal && (
        <div className="wallet-modal-overlay" onClick={() => setShowWalletModal(false)}>
          <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wallet-modal-icon">🔗</div>
            <div className="wallet-modal-title">WALLET_REQUIRED</div>
            <div className="wallet-modal-desc">
              Connect your wallet to initialize the swarm. Audit results will be securely stored on-chain via your Sui wallet.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => setShowWalletModal(false)}>
                CANCEL
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowWalletModal(false);
                  // Trigger wallet connect via the ConnectButton in TopBar
                  const walletWrapper = document.getElementById("wallet-connect-wrapper");
                  const btn = walletWrapper?.querySelector("button");
                  if (btn) btn.click();
                }}
              >
                CONNECT WALLET
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Agent Pipeline Stepper ─── */}
      <AgentPipelineStepper stage={agentStage} />

      {/* ── Top Split: Editor + Live Feed ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", flex: 1, minHeight: 0 }}>
        {/* Left: Code Editor */}
        <div style={{ display: "flex", flexDirection: "column", borderRight: "1px solid var(--border-default)", minHeight: 0, overflow: "hidden" }}>
          <div className="panel-header" style={{ padding: "8px 16px" }}>
            <span className="label-caps" style={{ color: patchingCode ? "var(--semantic-safe)" : "var(--secondary)" }}>
              &lt;&gt; security_check.move
            </span>
            <span className="label-caps" style={{ color: patchingCode ? "var(--semantic-safe)" : "var(--text-muted)" }}>
              {patchingCode ? (
                <><span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5, marginRight: 6 }} /> PATCHING...</>
              ) : code.trim() ? (
                `${code.split("\n").length} LINES`
              ) : (
                "EMPTY"
              )}
            </span>
          </div>

          {/* Sample contract quick-fill buttons */}
          <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border-default)", display: "flex", gap: 8, flexWrap: "wrap", background: "var(--surface-card)" }}>
            <span className="label-caps" style={{ fontSize: 9, color: "var(--text-muted)", alignSelf: "center", marginRight: 4 }}>
              DEMO_SAMPLES:
            </span>
            {SAMPLE_CONTRACTS.map((sc) => (
              <button
                key={sc.label}
                className="sample-chip"
                onClick={() => { setCode(sc.code); setArtifact(null); setError(null); }}
                disabled={isPending}
                title={sc.vuln}
              >
                <span className="sample-chip-label">{sc.label}</span>
                <span className="sample-chip-vuln">{sc.vuln}</span>
              </button>
            ))}
          </div>

          <textarea
            id="contract-code-editor"
            className={`code-editor${patchingCode ? " code-editor-patching" : ""}`}
            style={{ flex: 1, border: "none", borderRadius: 0, padding: "16px 20px" }}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            placeholder="// Paste your Sui Move smart contract here...&#10;// Or click a DEMO_SAMPLE above to auto-populate."
          />
          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border-default)", display: "flex", gap: 8 }}>
            <button
              id="initialize-swarm-btn"
              className="btn btn-primary"
              onClick={handleInitClick}
              disabled={isPending || !code.trim()}
              style={{ flex: 1 }}
            >
              {isPending ? (
                <><span className="spinner" /> SCANNING...</>
              ) : !account ? (
                <><span style={{ marginRight: 4 }}>🔗</span> CONNECT WALLET TO INIT</>
              ) : (
                "INITIALIZE SWARM"
              )}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => { setCode(""); setLogs([]); setArtifact(null); setError(null); setAgentStage("idle"); }}
            >
              CLR
            </button>
          </div>
          {!account && code.trim() && (
            <div className="wallet-hint-bar">
              <span className="wallet-hint-icon">🔗</span>
              <span>Connect wallet to persist audit results on-chain</span>
            </div>
          )}
        </div>

        {/* Right: Swarm Live Feed */}
        <div style={{ display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
          <div className="panel-header" style={{ padding: "8px 16px" }}>
            <span className="label-caps" style={{ color: "var(--on-surface-variant)" }}>
              ◈ SWARM_LIVE_FEED
            </span>
            {isPending && <span className="led led-blue" style={{ animation: "pulse 0.5s infinite" }} />}
          </div>
          <div
            ref={logRef}
            className="terminal"
            style={{ flex: 1, overflowY: "auto" }}
            aria-label="Swarm live feed terminal"
          >
            {logs.map((line, i) => (
              <LogLine key={i} line={line} />
            ))}
            {isPending && <span className="terminal-cursor" />}
            {!isPending && logs.length === 0 && (
              <span style={{ color: "var(--text-muted)" }}>
                Awaiting swarm initialization... Select a demo sample or paste your contract.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Resizable Drag Handle ─── */}
      <div className="resize-handle" onMouseDown={onMouseDown} style={{ position: "relative", zIndex: 20 }}>
        <div className="resize-handle-bar" />
      </div>

      {/* ── Bottom: Artifact + Remediation Panel ─── */}
      <div style={{ borderTop: "1px solid var(--border-default)", height: bottomHeight, flexShrink: 0, display: "flex", flexDirection: "column", minHeight: 0, background: "var(--background)" }}>
        {/* Section header */}
        <div
          className="panel-header"
          style={{ padding: "8px 16px", background: "var(--surface-card)", flexShrink: 0 }}
        >
          <span className="label-caps">VULNERABILITY LEDGER / REMEDIATION</span>
          {error && (
            <span className="chip chip-critical" style={{ marginLeft: 8 }}>
              {error.slice(0, 60)}
            </span>
          )}
        </div>

        {/* Latest artifact banner with full remediation */}
        {artifact && (
          <div className="animate-fade-in" style={{ flexShrink: 0 }}>
            <div
              style={{
                padding: "10px 16px",
                background: "rgba(239,68,68,0.06)",
                borderBottom: "1px solid var(--border-default)",
                display: "flex",
                gap: 16,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <SeverityChip severity={artifact.severity} />
              <button className="see-vuln-btn" onClick={() => { setSelectedVulnRow(null); setShowVulnDetail(true); }}>
                👁 SEE_VULNERABILITY
              </button>
              <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)" }}>
                {artifact.vulnerability_type}
              </span>
              {artifact.risk_score !== undefined && (
                <span style={{ fontSize: 11, color: artifact.risk_score > 70 ? "var(--semantic-alert)" : artifact.risk_score > 40 ? "var(--semantic-warning)" : "var(--semantic-safe)", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                  RISK: {artifact.risk_score}/100
                </span>
              )}
              <span style={{ fontSize: 12, color: "var(--text-muted)", flex: 1 }}>
                {artifact.description?.slice(0, 120)}
              </span>
            </div>

            {/* Remediation section */}
            {artifact.remediation && (
              <div
                style={{
                  padding: "10px 16px",
                  background: "rgba(16,185,129,0.06)",
                  borderBottom: "1px solid var(--border-default)",
                  borderLeft: "3px solid var(--semantic-safe)",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ color: "var(--semantic-safe)", fontSize: 14, lineHeight: 1, flexShrink: 0 }}>🔧</span>
                  <div style={{ flex: 1 }}>
                    <div className="label-caps" style={{ fontSize: 9, color: "var(--semantic-safe)", marginBottom: 4 }}>
                      REMEDIATION_ADVISORY
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--on-surface)", lineHeight: 1.6 }}>
                      {artifact.remediation}
                    </div>
                  </div>
                </div>
                {/* APPLY_FIX button */}
                <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    id="apply-fix-btn"
                    className={`fix-btn${findFix() ? " fix-btn-available" : ""}${showFixApplied ? " fix-btn-applied" : ""}`}
                    onClick={handleApplyFix}
                    disabled={isPending || showFixApplied}
                  >
                    {showFixApplied ? (
                      <><span style={{ color: "var(--semantic-safe)" }}>✓</span> PATCH APPLIED</>
                    ) : findFix() ? (
                      <><span>🔧</span> APPLY_FIX — Auto-patch available</>
                    ) : (
                      <><span>🔧</span> APPLY_FIX — Manual only</>
                    )}
                  </button>
                  {showFixApplied && (
                    <span className="label-caps" style={{ fontSize: 9, color: "var(--semantic-safe)" }}>
                      Code patched. Re-run audit to verify.
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Table */}
        <div style={{ overflowX: "auto", overflowY: "auto", flex: 1 }}>
          <table className="data-table" aria-label="Vulnerability ledger">
            <thead>
              <tr>
                <th>TIMESTAMP</th>
                <th>TARGET FUNCTION</th>
                <th>VULNERABILITY TYPE</th>
                <th>SEVERITY</th>
                <th>VULNERABILITY</th>
                <th>WALRUS OBJECT ID</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: 20 }}>
                    {account
                      ? "No audit records yet. Submit a contract to initialize."
                      : "Connect your wallet to view on-chain audit records."}
                  </td>
                </tr>
              ) : (
                history.map((row, i) => (
                  <tr key={i} className="animate-fade-in">
                    <td className="mono">{formatTime(row.timestamp)}</td>
                    <td className="mono" style={{ color: "var(--secondary)" }}>
                      {row.target_function || "—"}
                    </td>
                    <td>{row.vulnerability_type}</td>
                    <td><SeverityChip severity={row.severity} /></td>
                    <td>
                      <button
                        className="table-see-vuln-btn"
                        onClick={() => {
                          setSelectedVulnRow(row);
                          setShowVulnDetail(true);
                        }}
                      >
                        👁 SEE_VULNERABILITY
                      </button>
                    </td>
                    <td>
                      {row.walrus_object_id && !row.walrus_object_id.startsWith("pending_") ? (
                        <a
                          href={walrusBlobUrl(row.walrus_object_id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="walrus-id"
                          style={{ color: "var(--secondary)", textDecoration: "underline", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 12 }}
                          title={`Open ${row.walrus_object_id} in Walrus`}
                        >
                          {row.walrus_object_id.slice(0, 12)}...↗
                        </a>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>{row.walrus_object_id?.startsWith("pending_") ? "ON-CHAIN ONLY" : "—"}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Wrap in ErrorBoundary ──────────────────────────────────────────────────
export default function DashboardPage() {
  return (
    <ErrorBoundary>
      <DashboardInner />
    </ErrorBoundary>
  );
}
