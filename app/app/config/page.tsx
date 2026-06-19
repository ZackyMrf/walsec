"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";

// ─── Config keys ─────────────────────────────────────────────────────────────
const STORAGE_KEYS = {
  GEMINI_API_KEY: "walsec_gemini_api_key",
  MEMWAL_DELEGATE_KEY: "walsec_memwal_delegate_key",
} as const;

// ─── Terminal command history ─────────────────────────────────────────────────
const BOOT_SEQUENCE = [
  { text: "    _    ____  _  __  __        __    _     ____  _____ ____ ", cls: "log-analyzer" },
  { text: "   / \\  / ___|| |/ /  \\ \\      / /_ _| |   / ___|| ____/ ___|", cls: "log-analyzer" },
  { text: "  / _ \\ \\___ \\| ' /    \\ \\ /\\ / / _` | |   \\___ \\|  _|| |    ", cls: "log-analyzer" },
  { text: " / ___ \\ ___) | . \\     \\ V  V / (_| | |___ ___) | |__| |___ ", cls: "log-analyzer" },
  { text: "/_/   \\_\\____/|_|\\_\\     \\_/\\_/ \\__,_|_____|____/|_____\\____|", cls: "log-analyzer" },
  { text: "", cls: "" },
  { text: "Welcome to WALSEC AI Assistant. Type your question below or use 'help'.", cls: "log-system" },
  { text: "", cls: "" },
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
  const [aiSidePanel, setAiSidePanel] = useState("");
  const [displayedCode, setDisplayedCode] = useState("");
  const [codeTitle, setCodeTitle] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [pendingTerminalLines, setPendingTerminalLines] = useState<{ text: string; cls: string }[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const termRef = useRef<HTMLDivElement>(null);
  const account = useCurrentAccount();

  // Load from localStorage on mount or account change
  useEffect(() => {
    if (account?.address) {
      const savedHistory = localStorage.getItem(`walsec_terminal_history_${account.address}`);
      if (savedHistory) {
        try {
          setTerminalLines(JSON.parse(savedHistory));
        } catch (e) {
          console.error("Failed to parse terminal history", e);
        }
      } else {
        setTerminalLines(BOOT_SEQUENCE);
      }
      const savedPanel = localStorage.getItem(`walsec_ai_sidepanel_${account.address}`);
      const savedTitle = localStorage.getItem(`walsec_ai_code_title_${account.address}`);
      if (savedPanel) {
        setAiSidePanel(savedPanel);
        setDisplayedCode(savedPanel);
        setCodeTitle(savedTitle || "code_snippet");
      } else {
        setAiSidePanel("");
        setDisplayedCode("");
        setCodeTitle("");
      }
    } else {
      setTerminalLines([{ text: "[SYS] NO_WALLET_CONNECTED: Activity persistence suspended.", cls: "log-warn" }, ...BOOT_SEQUENCE]);
      setAiSidePanel("");
      setDisplayedCode("");
      setCodeTitle("");
    }
    setIsLoaded(true);
  }, [account?.address]);

  // Save terminal lines to localStorage when they change
  useEffect(() => {
    if (isLoaded && account?.address) {
      localStorage.setItem(`walsec_terminal_history_${account.address}`, JSON.stringify(terminalLines));
    }
  }, [terminalLines, isLoaded, account?.address]);

  // Save side panel to localStorage
  useEffect(() => {
    if (isLoaded && account?.address) {
      localStorage.setItem(`walsec_ai_sidepanel_${account.address}`, aiSidePanel);
      localStorage.setItem(`walsec_ai_code_title_${account.address}`, codeTitle);
    }
  }, [aiSidePanel, codeTitle, isLoaded, account?.address]);

  // Matrix Typing Animation
  useEffect(() => {
    if (isTyping && aiSidePanel) {
      let i = 0;
      setDisplayedCode("");
      const interval = setInterval(() => {
        setDisplayedCode(aiSidePanel.slice(0, i + 1));
        i++;
        if (i >= aiSidePanel.length) {
          clearInterval(interval);
          setIsTyping(false);
        }
      }, 10);
      return () => clearInterval(interval);
    }
  }, [isTyping, aiSidePanel]);

  // Push pending terminal lines when typing finishes
  useEffect(() => {
    if (!isTyping && pendingTerminalLines.length > 0) {
      setTerminalLines((prev) => {
        const filtered = prev.filter((l) => l.text !== `[SYS] COMPILING_AND_STREAMING_CODE_MATRIX...`);
        return [...filtered, ...pendingTerminalLines];
      });
      setPendingTerminalLines([]);
    }
  }, [isTyping, pendingTerminalLines]);

  // Auto-scroll terminal
  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight;
    }
  }, [terminalLines]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(aiSidePanel);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Terminal command handler
  function handleCommand(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    const input = cmd.trim();
    setCmd("");

    const echo = { text: `>> ${input}`, cls: "log-system" };

    if (!input) return;

    if (input === "clear") {
      setTerminalLines([echo, { text: "", cls: "" }]);
      setAiSidePanel("");
      setDisplayedCode("");
      setCodeTitle("");
      if (account?.address) {
        localStorage.removeItem(`walsec_terminal_history_${account.address}`);
        localStorage.removeItem(`walsec_ai_sidepanel_${account.address}`);
        localStorage.removeItem(`walsec_ai_code_title_${account.address}`);
      }
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
      // Fallback to AI Chatbot via Memwal
      setTerminalLines((prev) => [
        ...prev,
        echo,
        { text: `[SYS] AWAITING_AI_RESPONSE...`, cls: "log-analyzer" },
      ]);

      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.response) {
            const fullResponse = data.response;
            const codeRegex = /```(.*)\n([\s\S]*?)```/g;
            let match;
            const codeBlocks = [];
            let lastIndex = 0;
            let textOnly = "";
            let firstLang = "";

            while ((match = codeRegex.exec(fullResponse)) !== null) {
              if (!firstLang && match[1]) firstLang = match[1].trim();
              textOnly += fullResponse.slice(lastIndex, match.index);
              codeBlocks.push(match[2].trim());
              lastIndex = codeRegex.lastIndex;
            }
            textOnly += fullResponse.slice(lastIndex);

            const finalCode = codeBlocks.join("\n\n");
            const finalText = textOnly.trim();

            if (finalCode) {
              setAiSidePanel(finalCode);
              setCodeTitle(firstLang || "code_snippet");
              setIsTyping(true);
              const lines = finalText.split("\n").filter(Boolean).map((line: string) => ({
                text: line,
                cls: "",
              }));
              setPendingTerminalLines(lines);

              setTerminalLines((prev) => {
                const filtered = prev.filter((l) => l.text !== `[SYS] AWAITING_AI_RESPONSE...`);
                return [...filtered, { text: `[SYS] COMPILING_AND_STREAMING_CODE_MATRIX...`, cls: "log-analyzer" }];
              });
            } else {
              // No code, just push text immediately
              setTerminalLines((prev) => {
                const filtered = prev.filter((l) => l.text !== `[SYS] AWAITING_AI_RESPONSE...`);
                const lines = finalText.split("\n").filter(Boolean).map((line: string) => ({
                  text: line,
                  cls: "",
                }));
                return [...filtered, ...lines];
              });
            }
          } else {
            setTerminalLines((prev) => {
              const filtered = prev.filter((l) => l.text !== `[SYS] AWAITING_AI_RESPONSE...`);
              return [...filtered, { text: `[ERROR] AI Chat failed: ${data.error || "Unknown error"}`, cls: "log-error" }];
            });
          }
        })
        .catch(() => {
          setTerminalLines((prev) => {
            const filtered = prev.filter((l) => l.text !== `[SYS] AWAITING_AI_RESPONSE...`);
            return [...filtered, { text: `[ERROR] Network failure communicating with AI.`, cls: "log-error" }];
          });
        });
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 48px)", overflow: "auto" }}>
      {/* ── Header ─── */}
      <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid var(--border-default)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 className="headline-md" style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>
              ASK_WALSEC
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
        {/* ── Left: Terminal ─── */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "1px solid var(--border-default)" }}>
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
              <div key={i} className={line.cls || "log-system"} style={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
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
              disabled={!account?.address}
              style={{
                background: "transparent",
                border: "none",
                flex: 1,
                padding: 0,
                fontSize: 12,
                cursor: !account?.address ? "not-allowed" : "text",
                color: !account?.address ? "var(--text-muted)" : "inherit"
              }}
              placeholder={account?.address ? "ENTER OVERRIDE COMMAND..." : "TERMINAL LOCKED: PLEASE CONNECT WALLET..."}
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

        {/* ── Right: AI Output Panel ─── */}
        <div
          style={{
            overflowY: "auto",
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            background: "var(--surface-base)",
          }}
        >
          <div className="label-caps" style={{ fontSize: 10, color: "var(--secondary)" }}>
            AI_OUTPUT_VIEWER
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, border: '1px solid var(--border-default)' }}>
            {displayedCode && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', background: '#1e1e1e', borderBottom: '1px solid var(--border-default)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>{codeTitle}</span>
                <button 
                  onClick={handleCopyCode} 
                  style={{ background: 'none', border: 'none', color: isCopied ? 'var(--semantic-safe)' : 'var(--text-muted)', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, transition: 'color 0.2s' }}
                >
                  {isCopied ? "✓ COPIED" : "📋 COPY"}
                </button>
              </div>
            )}
            <div
              style={{
                flex: 1,
                background: "var(--surface-card)",
                padding: 20,
                overflowY: "auto",
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                whiteSpace: "pre-wrap",
                color: "var(--text-default)",
                boxShadow: "inset 0 0 10px rgba(0,0,0,0.5)",
              }}
            >
              {displayedCode}
              {isTyping && <span style={{ animation: "blink 1s step-end infinite", background: "var(--semantic-safe)", color: "black" }}>█</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
