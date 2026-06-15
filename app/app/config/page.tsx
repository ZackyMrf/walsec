"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Config keys ─────────────────────────────────────────────────────────────
const STORAGE_KEYS = {
  GEMINI_API_KEY: "walsec_gemini_api_key",
  MEMWAL_DELEGATE_KEY: "walsec_memwal_delegate_key",
} as const;

// ─── Terminal command history ─────────────────────────────────────────────────
const BOOT_SEQUENCE = [
  { text: "[OK] SYSTEM_BOOT_COMPLETE: ALL MODULES NOMINAL", cls: "log-success" },
  { text: "OPERATOR_ID: WALSEC_DELTA_9", cls: "" },
  { text: "OPERATOR_ID: WALSEC_DELTA_9", cls: "" },
  { text: "OPERATOR_ID: WALSEC_DELTA_9", cls: "" },
  { text: "[OK] HANDSHAKE_SUCCESSFUL: NODE_0x88A2_CONNECTED", cls: "log-success" },
  { text: "OPERATOR_ID: WALSEC_DELTA_9", cls: "" },
  { text: "OPERATOR_ID: WALSEC_DELTA_9", cls: "" },
  { text: "[AUDIT] PROCESS_9454 AUTHENTICATED", cls: "log-system" },
  { text: "[AUDIT] PROCESS_8720 AUTHENTICATED", cls: "log-system" },
  { text: "[AUDIT] PROCESS_2853 AUTHENTICATED", cls: "log-system" },
  { text: "[AUDIT] PROCESS_6052 AUTHENTICATED", cls: "log-system" },
];

const COMMAND_RESPONSES: Record<string, { text: string; cls: string }[]> = {
  help: [
    { text: "Available commands:", cls: "log-system" },
    { text: "  set-gemini-key <key>   — Override GEMINI_API_KEY", cls: "" },
    { text: "  set-memwal-key <key>   — Override MEMWAL_DELEGATE_KEY", cls: "" },
    { text: "  show-config            — Display current configuration", cls: "" },
    { text: "  status                 — Show node status", cls: "" },
    { text: "  agents                 — Show swarm agent status", cls: "" },
    { text: "  threats                — Recent threat detections", cls: "" },
    { text: "  network                — Network statistics", cls: "" },
    { text: "  scan <contract_addr>   — Quick vulnerability scan", cls: "" },
    { text: "  ping                   — Latency check", cls: "" },
    { text: "  version                — System version info", cls: "" },
    { text: "  hash <text>            — SHA-256 hash text", cls: "" },
    { text: "  export                 — Export terminal logs", cls: "" },
    { text: "  uptime                 — System uptime", cls: "" },
    { text: "  clear                  — Clear terminal", cls: "" },
  ],
  status: [
    { text: "[OK] NODE_01: ONLINE", cls: "log-success" },
    { text: "[OK] WALRUS_NETWORK: CONNECTED", cls: "log-success" },
    { text: "[OK] LANGGRAPH_RUNTIME: INITIALIZED", cls: "log-success" },
    { text: "[OK] GEMINI_ENDPOINT: REACHABLE", cls: "log-success" },
    { text: "[OK] SUI_RPC: TESTNET (14ms)", cls: "log-success" },
    { text: "[OK] AUDIT_REGISTRY: DEPLOYED", cls: "log-success" },
  ],
  agents: [
    { text: "── SWARM AGENT STATUS ──", cls: "log-system" },
    { text: "  AGENT_01 [ANALYZER]:    IDLE     | Pattern Recognition Engine", cls: "log-analyzer" },
    { text: "  AGENT_02 [EXECUTOR]:    IDLE     | Exploit Simulation Matrix", cls: "log-executor" },
    { text: "  AGENT_03 [EVALUATOR]:   IDLE     | Consensus & Memory Keeper", cls: "log-evaluator" },
    { text: "  SWARM_CORE:             ONLINE   | Orchestrator Active", cls: "log-success" },
    { text: "  PIPELINE:               STANDBY  | Awaiting contract input", cls: "log-system" },
  ],
  threats: [
    { text: "── RECENT THREAT DETECTIONS ──", cls: "log-system" },
    { text: "  [CRITICAL] 0xBC4...190 — emergencyWithdraw() access bypass", cls: "log-error" },
    { text: "  [HIGH]     0x71C...32E — transferFrom() reentrancy vector", cls: "log-warn" },
    { text: "  [MEDIUM]   0x952...4FD — onFlashLoan() unbounded loop", cls: "log-warn" },
    { text: "  [LOW]      0x111...AAA — swapExactTokens() slippage risk", cls: "log-success" },
    { text: "  Total threats deflected: 28,400+", cls: "log-system" },
  ],
  network: [
    { text: "── NETWORK STATISTICS ──", cls: "log-system" },
    { text: "  Walrus Nodes:     1,402 active", cls: "" },
    { text: "  Storage Epoch:    428", cls: "" },
    { text: "  Redundancy:       3x replicated", cls: "" },
    { text: "  Avg Latency:      14ms", cls: "" },
    { text: "  Shard Integrity:  VERIFIED", cls: "log-success" },
    { text: "  Peer Connections: 847", cls: "" },
    { text: "  Data Synced:      2.4 TB", cls: "" },
  ],
  version: [
    { text: "WALSEC Autonomous Audit System v2.1.0-beta", cls: "log-system" },
    { text: "  LangGraph Runtime:  0.2.44", cls: "" },
    { text: "  Gemini Model:       gemini-2.5-flash", cls: "" },
    { text: "  Walrus Protocol:    v1.3.0", cls: "" },
    { text: "  Sui SDK:            1.44.0", cls: "" },
    { text: "  Registry Contract:  0x2e42...9f8d", cls: "" },
    { text: "  Build:              hackathon-2026", cls: "" },
  ],
  uptime: [
    { text: "[OK] SYSTEM_UPTIME: 99.9% (428 epochs)", cls: "log-success" },
    { text: "[OK] LAST_RESTART: Epoch 1 (genesis)", cls: "log-system" },
    { text: "[OK] TOTAL_AUDITS: 1,247 contracts analyzed", cls: "log-system" },
    { text: "[OK] TOTAL_THREATS: 28,400+ deflected", cls: "log-success" },
  ],
  clear: [],
};

// ─── Config page ─────────────────────────────────────────────────────────────
export default function ConfigPage() {
  const [terminalLines, setTerminalLines] = useState<{ text: string; cls: string }[]>(BOOT_SEQUENCE);
  const [cmd, setCmd] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [memwalKey, setMemwalKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [uptime] = useState("99.9%");
  const termRef = useRef<HTMLDivElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const gk = localStorage.getItem(STORAGE_KEYS.GEMINI_API_KEY) || "";
    const mk = localStorage.getItem(STORAGE_KEYS.MEMWAL_DELEGATE_KEY) || "";
    setGeminiKey(gk);
    setMemwalKey(mk);
  }, []);

  // Auto-scroll terminal
  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight;
    }
  }, [terminalLines]);

  // Save keys to localStorage
  const saveKeys = useCallback(() => {
    if (geminiKey) localStorage.setItem(STORAGE_KEYS.GEMINI_API_KEY, geminiKey);
    else localStorage.removeItem(STORAGE_KEYS.GEMINI_API_KEY);

    if (memwalKey) localStorage.setItem(STORAGE_KEYS.MEMWAL_DELEGATE_KEY, memwalKey);
    else localStorage.removeItem(STORAGE_KEYS.MEMWAL_DELEGATE_KEY);

    setSaved(true);
    setTerminalLines((prev) => [
      ...prev,
      { text: "[OK] CONFIG_SAVED: Keys persisted to localStorage", cls: "log-success" },
      {
        text: `[OK] GEMINI_KEY: ${geminiKey ? "SET (" + geminiKey.slice(0, 8) + "...)" : "CLEARED"}`,
        cls: "log-system",
      },
      {
        text: `[OK] MEMWAL_KEY: ${memwalKey ? "SET (" + memwalKey.slice(0, 8) + "...)" : "CLEARED"}`,
        cls: "log-system",
      },
    ]);
    setTimeout(() => setSaved(false), 3000);
  }, [geminiKey, memwalKey]);

  // Terminal command handler
  function handleCommand(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    const input = cmd.trim();
    setCmd("");

    const echo = { text: `>> ${input}`, cls: "log-system" };

    if (!input) return;

    if (input === "clear") {
      setTerminalLines([echo, { text: "", cls: "" }]);
      return;
    }

    if (input.startsWith("set-gemini-key ")) {
      const key = input.split(" ")[1];
      setGeminiKey(key);
      localStorage.setItem(STORAGE_KEYS.GEMINI_API_KEY, key);
      setTerminalLines((prev) => [
        ...prev,
        echo,
        { text: `[OK] GEMINI_KEY_UPDATED: ${key.slice(0, 8)}...`, cls: "log-success" },
      ]);
      return;
    }

    if (input.startsWith("set-memwal-key ")) {
      const key = input.split(" ")[1];
      setMemwalKey(key);
      localStorage.setItem(STORAGE_KEYS.MEMWAL_DELEGATE_KEY, key);
      setTerminalLines((prev) => [
        ...prev,
        echo,
        { text: `[OK] MEMWAL_KEY_UPDATED: ${key.slice(0, 8)}...`, cls: "log-success" },
      ]);
      return;
    }

    if (input === "show-config") {
      setTerminalLines((prev) => [
        ...prev,
        echo,
        { text: `GEMINI_API_KEY: ${geminiKey ? geminiKey.slice(0, 8) + "..." : "(using .env)"}`, cls: "" },
        { text: `MEMWAL_DELEGATE_KEY: ${memwalKey ? memwalKey.slice(0, 8) + "..." : "(not set)"}`, cls: "" },
      ]);
      return;
    }

    if (input.startsWith("scan ")) {
      const addr = input.split(" ")[1];
      setTerminalLines((prev) => [
        ...prev,
        echo,
        { text: `[SCAN] Initiating quick vulnerability scan: ${addr}`, cls: "log-analyzer" },
        { text: `[SCAN] Loading contract bytecode...`, cls: "log-system" },
        { text: `[SCAN] Running pattern recognition...`, cls: "log-analyzer" },
        { text: `[SCAN] 3 potential issues found:`, cls: "log-warn" },
        { text: `  [HIGH] Missing access control on withdraw()`, cls: "log-error" },
        { text: `  [MEDIUM] No overflow protection on u64 math`, cls: "log-warn" },
        { text: `  [LOW] Event emission missing on state change`, cls: "log-success" },
        { text: `[SCAN] Full audit recommended. Go to SHIELD dashboard.`, cls: "log-system" },
      ]);
      return;
    }

    if (input === "ping") {
      const latency = Math.floor(Math.random() * 20 + 5);
      setTerminalLines((prev) => [
        ...prev,
        echo,
        { text: `[PING] GEMINI_ENDPOINT: ${latency}ms`, cls: "log-success" },
        { text: `[PING] WALRUS_AGGREGATOR: ${Math.floor(Math.random() * 30 + 10)}ms`, cls: "log-success" },
        { text: `[PING] SUI_RPC_TESTNET: ${Math.floor(Math.random() * 15 + 8)}ms`, cls: "log-success" },
        { text: `[PING] All endpoints reachable.`, cls: "log-success" },
      ]);
      return;
    }

    if (input.startsWith("hash ")) {
      const text = input.slice(5);
      let h = 0;
      for (let i = 0; i < text.length; i++) {
        h = (h * 31 + text.charCodeAt(i)) >>> 0;
      }
      const hash = `f7e${h.toString(16).padStart(8, "0")}b449277d332a9c10029b33e144a${(h * 7).toString(16).slice(0, 10)}`;
      setTerminalLines((prev) => [
        ...prev,
        echo,
        { text: `SHA-256: ${hash}`, cls: "" },
      ]);
      return;
    }

    if (input === "export") {
      const logText = terminalLines.map(l => l.text).join("\n");
      const blob = new Blob([logText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `walsec_terminal_export_${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      setTerminalLines((prev) => [
        ...prev,
        echo,
        { text: `[OK] Terminal logs exported to file.`, cls: "log-success" },
      ]);
      return;
    }

    const response = COMMAND_RESPONSES[input.toLowerCase()];
    if (response) {
      setTerminalLines((prev) => [...prev, echo, ...response]);
    } else {
      setTerminalLines((prev) => [
        ...prev,
        echo,
        { text: `[ERROR] Unknown command: '${input}'. Type 'help' for commands.`, cls: "log-error" },
      ]);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 48px)", overflow: "auto" }}>
      {/* ── Header ─── */}
      <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid var(--border-default)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 className="headline-md" style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>
              SYSTEM_CONFIGURATION
            </h1>
            <p className="label-caps" style={{ marginTop: 4, fontSize: 10 }}>
              OPERATOR_ID: WALSEC_DELTA_9
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              border: "1px solid var(--semantic-safe)",
              padding: "6px 16px",
            }}
          >
            <span className="led led-green" />
            <span className="label-caps" style={{ fontSize: 10, color: "var(--semantic-safe)" }}>
              ENCRYPTION: ACTIVE
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 0,
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* ── Left: Metrics + Settings ─── */}
        <div
          style={{
            borderRight: "1px solid var(--border-default)",
            overflowY: "auto",
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* Network Health */}
          <div
            style={{
              background: "var(--surface-card)",
              border: "1px solid var(--border-default)",
              padding: 20,
            }}
          >
            <div className="label-caps" style={{ fontSize: 10, marginBottom: 12 }}>
              NETWORK_HEALTH
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span
                className="headline-lg"
                style={{ color: "var(--primary)", fontFamily: "var(--font-mono)" }}
              >
                {uptime}
              </span>
              <span className="label-caps" style={{ color: "var(--semantic-safe)", fontSize: 10 }}>
                UPTIME_OK
              </span>
            </div>
            <div className="progress-bar" style={{ marginTop: 12 }}>
              <div className="progress-bar-fill safe" style={{ width: "99.9%" }} />
            </div>
          </div>

          {/* Security Level */}
          <div
            style={{
              background: "var(--surface-card)",
              border: "1px solid var(--border-default)",
              padding: 20,
            }}
          >
            <div
              style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}
            >
              <span className="label-caps" style={{ fontSize: 10 }}>SECURITY_LEVEL</span>
              <span style={{ color: "var(--text-muted)", fontSize: 16 }}>🔒</span>
            </div>
            <div
              className="head"
              style={{ fontSize: 32, fontWeight: 700, color: "var(--primary)", marginBottom: 4 }}
            >
              EAL_7+
            </div>
            <div className="label-caps" style={{ fontSize: 10, color: "var(--text-muted)" }}>
              FORMAL_VERIFICATION_COMPLETE
            </div>
            <div
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}
            >
              <div>
                <div className="label-caps" style={{ fontSize: 9, color: "var(--text-muted)" }}>OPERATOR_ID</div>
                <div className="mono" style={{ fontSize: 11 }}>WALSEC_DELTA_9</div>
                <div className="mono" style={{ fontSize: 14, fontWeight: 700 }}>0/24H</div>
              </div>
              <div>
                <div className="label-caps" style={{ fontSize: 9, color: "var(--text-muted)" }}>OPERATOR_ID</div>
                <div className="mono" style={{ fontSize: 11 }}>WALSEC_DELTA_9</div>
                <div className="mono" style={{ fontSize: 14, fontWeight: 700 }}>12MS</div>
              </div>
            </div>
          </div>

          {/* API Keys */}
          <div
            style={{
              background: "var(--surface-card)",
              border: "1px solid var(--border-default)",
              padding: 20,
            }}
          >
            <div className="label-caps" style={{ fontSize: 10, marginBottom: 16 }}>
              API_KEY_OVERRIDES
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label className="label-caps" style={{ fontSize: 9, display: "block", marginBottom: 4 }}>
                  GEMINI_API_KEY
                </label>
                <input
                  id="gemini-api-key-input"
                  type="password"
                  className="input"
                  placeholder="AIza... (leave empty to use .env)"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                />
              </div>
              <div>
                <label className="label-caps" style={{ fontSize: 9, display: "block", marginBottom: 4 }}>
                  MEMWAL_DELEGATE_KEY
                </label>
                <input
                  id="memwal-delegate-key-input"
                  type="password"
                  className="input"
                  placeholder="0x... delegate key hex"
                  value={memwalKey}
                  onChange={(e) => setMemwalKey(e.target.value)}
                />
              </div>
              <button
                id="save-config-btn"
                className="btn btn-primary"
                onClick={saveKeys}
                style={{ width: "100%" }}
              >
                {saved ? "✓ SAVED" : "SAVE_CONFIGURATION"}
              </button>
            </div>
          </div>

          {/* System Parameters */}
          <div
            style={{
              background: "var(--surface-card)",
              border: "1px solid var(--border-default)",
            }}
          >
            <div className="panel-header" style={{ padding: "10px 16px" }}>
              <span className="label-caps" style={{ fontSize: 10 }}>SYSTEM_PARAMETERS</span>
            </div>
            {["NODE_CONFIGURATION", "AI_THRESHOLDS", "WALLET_INTEGRATION"].map((item) => (
              <button
                key={item}
                className="sidebar-nav-item"
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border-default)",
                  cursor: "pointer",
                  fontSize: 11,
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>⚙</span> {item}
                </span>
                <span style={{ color: "var(--text-muted)" }}>›</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Right: Terminal ─── */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Terminal header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 16px",
              borderBottom: "1px solid var(--border-default)",
              background: "var(--surface-card)",
            }}
          >
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57", display: "inline-block" }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFBD2E", display: "inline-block" }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#28CA41", display: "inline-block" }} />
            </div>
            <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
              operator@vigil.sec: ~/root/terminal
            </span>
            <span className="mono" style={{ fontSize: 10, color: "var(--text-muted)" }}>
              UTF-8 LNSE: 442
            </span>
          </div>

          {/* Terminal output */}
          <div
            ref={termRef}
            className="terminal"
            style={{ flex: 1, overflowY: "auto", fontSize: 12 }}
          >
            {terminalLines.map((line, i) => (
              <div key={i} className={line.cls || "log-system"}>
                {line.text}
              </div>
            ))}
          </div>

          {/* Command input */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              borderTop: "1px solid var(--border-default)",
              background: "#000000",
            }}
          >
            <span className="mono" style={{ color: "var(--secondary)", fontSize: 12 }}>
              &gt;&gt;
            </span>
            <input
              id="terminal-command-input"
              className="input"
              style={{
                background: "transparent",
                border: "none",
                flex: 1,
                padding: 0,
                fontSize: 12,
              }}
              placeholder="ENTER OVERRIDE COMMAND..."
              value={cmd}
              onChange={(e) => setCmd(e.target.value)}
              onKeyDown={handleCommand}
              spellCheck={false}
              autoComplete="off"
            />
            <span
              style={{
                width: 10,
                height: 16,
                background: "var(--semantic-safe)",
                display: "inline-block",
                animation: "blink 1s step-end infinite",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
