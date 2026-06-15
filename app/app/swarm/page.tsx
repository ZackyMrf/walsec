"use client";

import { useState, useEffect, useRef } from "react";
import { useSwarm } from "@/context/SwarmContext";

// ─── Metric types ─────────────────────────────────────────────────────────────
interface SystemMetrics {
  cpuCycles: number;
  neuralLatency: number;
  entropyLevel: "LOW" | "MEDIUM" | "HIGH";
}

interface ActiveThread {
  fn: string;
  contract: string;
  tag: string;
  tagType: "info" | "danger" | "warning" | "safe";
  icon: string;
}

// ─── Swarm Intelligence Hub ───────────────────────────────────────────────────
export default function SwarmPage() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpuCycles: 84,
    neuralLatency: 0.42,
    entropyLevel: "HIGH",
  });
  const { logs, isPending, agentStage } = useSwarm();

  // Determine active agent from context stage (more reliable than log parsing)
  const isAnalyzerActive = isPending && agentStage === "analyzer";
  const isExecutorActive = isPending && agentStage === "executor";
  const isEvaluatorActive = isPending && (agentStage === "evaluator" || agentStage === "storing");
  const [totalNodes, setTotalNodes] = useState(1402);
  const [threatsDeflected, setThreatsDeflected] = useState(28400);
  const [mounted, setMounted] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const threads: ActiveThread[] = [
    { fn: "transferFrom()", contract: "0x71C...32E", tag: "DEEP_SCAN", tagType: "info", icon: "✓" },
    { fn: "emergencyWithdraw()", contract: "0xBC4...190", tag: "MALICIOUS_LOGIC", tagType: "danger", icon: "⚠" },
    { fn: "onFlashLoan()", contract: "0x952...4FD", tag: "SIMULATING", tagType: "warning", icon: "↻" },
    { fn: "swapExactTokens()", contract: "0x111...AAA", tag: "STABLE", tagType: "safe", icon: "✓" },
  ];

  // Simulate live metric updates
  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setMetrics((m) => ({
        cpuCycles: Math.min(99, Math.max(60, m.cpuCycles + (Math.random() - 0.5) * 5)),
        neuralLatency: parseFloat((Math.max(0.1, m.neuralLatency + (Math.random() - 0.5) * 0.08)).toFixed(2)),
        entropyLevel: m.cpuCycles > 85 ? "HIGH" : m.cpuCycles > 70 ? "MEDIUM" : "LOW",
      }));
      setTotalNodes((n) => n + Math.floor(Math.random() * 3));
      setThreatsDeflected((t) => t + Math.floor(Math.random() * 2));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  // Colorizer helper
  function getLogClass(line: string) {
    if (line.startsWith("[ANALYZER]")) return "log-analyzer";
    if (line.startsWith("[EXECUTOR]")) return "log-executor";
    if (line.startsWith("[EVALUATOR]")) return "log-evaluator";
    if (line.includes("✓") || line.includes("SUCCESS")) return "log-success";
    if (line.includes("[!!]") || line.includes("ALERT") || line.includes("CRITICAL")) return "log-error";
    if (line.includes("WARN") || line.includes("Overflow")) return "log-warn";
    return "log-system";
  }

  const tagColors: Record<string, string> = {
    info: "var(--secondary)",
    danger: "var(--semantic-alert)",
    warning: "var(--semantic-warning)",
    safe: "var(--semantic-safe)",
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "260px 1fr 280px",
        height: "calc(100vh - 48px)",
        overflow: "hidden",
      }}
    >
      {/* ── Left: Metrics + Log Stream ───────────────────────── */}
      <div
        style={{
          borderRight: "1px solid var(--border-default)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* System Vitality */}
        <div style={{ padding: 16, borderBottom: "1px solid var(--border-default)" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <span
              className="label-caps"
              style={{ color: "var(--secondary)", fontSize: 10 }}
            >
              SYSTEM_VITALITY
            </span>
            <span style={{ color: "var(--secondary)", fontSize: 16 }}>⚡</span>
          </div>

          {/* CPU Cycles */}
          <div className="metric-row">
            <span className="metric-label">CPU_CYCLES</span>
            <span className="metric-value">{Math.round(metrics.cpuCycles)}%</span>
          </div>
          <div className="progress-bar" style={{ marginBottom: 12, marginTop: 4 }}>
            <div
              className="progress-bar-fill"
              style={{ width: `${metrics.cpuCycles}%` }}
            />
          </div>

          {/* Neural Latency */}
          <div className="metric-row">
            <span className="metric-label">NEURAL_LATENCY</span>
            <span className="metric-value">{metrics.neuralLatency}ms</span>
          </div>
          <div className="progress-bar" style={{ marginBottom: 12, marginTop: 4 }}>
            <div
              className="progress-bar-fill safe"
              style={{ width: `${metrics.neuralLatency * 200}%` }}
            />
          </div>

          {/* Entropy */}
          <div className="metric-row" style={{ border: "none" }}>
            <span className="metric-label">ENTROPY_LEVEL</span>
            <span
              className="metric-value"
              style={{
                color:
                  metrics.entropyLevel === "HIGH"
                    ? "var(--semantic-alert)"
                    : metrics.entropyLevel === "MEDIUM"
                      ? "var(--semantic-warning)"
                      : "var(--semantic-safe)",
              }}
            >
              {metrics.entropyLevel}
            </span>
          </div>
        </div>

        {/* Neural Log Stream */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div
            className="panel-header"
            style={{ padding: "8px 16px" }}
          >
            <span className="label-caps" style={{ fontSize: 10 }}>
              NEURAL_LOG_STREAM
            </span>
            <span style={{ color: "var(--secondary)", fontSize: 14 }}>⌘</span>
          </div>
          <div
            ref={logRef}
            className="terminal"
            style={{ flex: 1, overflowY: "auto", fontSize: 11 }}
          >
            {logs.map((line, i) => (
              <div key={i} className={getLogClass(line)}>
                {line}
              </div>
            ))}
            {logs.length === 0 && !isPending && (
              <div style={{ color: "var(--text-muted)" }}>
                Awaiting swarm task from dashboard...
              </div>
            )}
            {isPending && <span className="terminal-cursor" />}
          </div>
        </div>
      </div>

      {/* ── Center: Agent Topology ────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px 24px",
          position: "relative",
          flex: 1,
        }}
      >
        {/* AGENT_01 ANALYZER */}
        <div className={`agent-card active animate-fade-in ${isAnalyzerActive ? "processing" : ""}`} style={{ color: "var(--secondary)" }}>
          <div className="agent-card-label">AGENT_01</div>
          <div className="agent-card-title">ANALYZER</div>
          <div className="agent-card-sub">Pattern Recognition Mode</div>
        </div>

        {/* Connection line down */}
        <div
          className={`data-stream ${isPending ? "active" : ""}`}
          style={{
            width: 2,
            height: 40,
            background: "var(--border-default)",
            color: "var(--secondary)",
            margin: "8px 0",
          }}
        />

        {/* SWARM CORE */}
        <div
          className={`swarm-core ${isPending ? "processing" : ""}`}
          style={{
            border: "1px dashed var(--border-default)",
            borderRadius: "50%",
            width: 100,
            height: 100,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s ease",
            background: "var(--surface-lowest)",
            zIndex: 10,
          }}
        >
          <div style={{ fontSize: 20, color: "var(--text-muted)", transition: "color 0.3s" }}>◈</div>
          <div className="label-caps" style={{ fontSize: 9, marginTop: 4, transition: "color 0.3s" }}>
            SWARM_CORE
          </div>
        </div>

        {/* Branching lines to Agent 2 and Agent 3 */}
        <div style={{ display: "flex", gap: 120, marginTop: 8 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              className={`data-stream ${isPending ? "active" : ""}`}
              style={{
                width: 2,
                height: 40,
                background: "var(--border-default)",
                color: "var(--semantic-alert)",
                marginBottom: 8,
              }}
            />
            {/* AGENT_02 EXECUTOR */}
            <div className={`agent-card executor animate-fade-in ${isExecutorActive ? "processing" : ""}`} style={{ color: "var(--semantic-alert)" }}>
              <div className="agent-card-label">AGENT_02</div>
              <div className="agent-card-title" style={{ color: "inherit" }}>EXECUTOR</div>
              <div className="agent-card-sub" style={{ color: "var(--text-muted)" }}>Mitigation Pipeline</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              className={`data-stream ${isPending ? "active" : ""}`}
              style={{
                width: 2,
                height: 40,
                background: "var(--border-default)",
                color: "var(--semantic-safe)",
                marginBottom: 8,
              }}
            />
            {/* AGENT_03 EVALUATOR */}
            <div className={`agent-card evaluator animate-fade-in ${isEvaluatorActive ? "processing" : ""}`} style={{ color: "var(--semantic-safe)" }}>
              <div className="agent-card-label">AGENT_03</div>
              <div className="agent-card-title" style={{ color: "inherit" }}>EVALUATOR</div>
              <div className="agent-card-sub" style={{ color: "var(--text-muted)" }}>Memory Keeper</div>
            </div>
          </div>
        </div>

        {/* ── Stats Bar ── */}
        <div
          style={{
            marginTop: 32,
            width: "100%",
            border: "1px solid var(--border-default)",
            background: "var(--surface-card)",
            padding: 16,
            display: "flex",
            gap: 24,
            alignItems: "center",
            justifyContent: "space-around",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div className="label-caps" style={{ fontSize: 9, marginBottom: 4 }}>
              TOTAL_NODES
            </div>
            <div
              className="headline-md"
              style={{ color: "var(--primary)", fontFamily: "var(--font-mono)" }}
              suppressHydrationWarning
            >
              {mounted ? totalNodes.toLocaleString("en-US") : "1,402"}
            </div>
          </div>
          <div style={{ width: 1, height: 40, background: "var(--border-default)" }} />
          <div style={{ textAlign: "center" }}>
            <div className="label-caps" style={{ fontSize: 9, marginBottom: 4 }}>
              THREATS_DEFLECTED
            </div>
            <div
              className="headline-md"
              style={{ color: "var(--secondary)", fontFamily: "var(--font-mono)" }}
              suppressHydrationWarning
            >
              {mounted ? `${(threatsDeflected / 1000).toFixed(1)}k` : "28.4k"}
            </div>
          </div>
          <button id="init-global-sync-btn" className="btn btn-secondary">
            INIT_GLOBAL_SYNC
          </button>
        </div>
      </div>

      {/* ── Right: Active Threads ─────────────────────────────── */}
      <div
        style={{
          borderLeft: "1px solid var(--border-default)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="panel-header" style={{ padding: "8px 16px" }}>
          <span className="label-caps" style={{ fontSize: 10 }}>
            ACTIVE_THREADS
          </span>
          <span
            className="label-caps"
            style={{
              fontSize: 9,
              padding: "2px 8px",
              border: "1px solid var(--secondary)",
              color: "var(--secondary)",
            }}
          >
            LIVE_FEED
          </span>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {threads.map((t, i) => (
            <div
              key={i}
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid var(--border-default)",
              }}
              className="animate-fade-in"
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <span
                  className="mono"
                  style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)" }}
                >
                  {t.fn}
                </span>
                <span style={{ color: tagColors[t.tagType], fontSize: 14 }}>{t.icon}</span>
              </div>
              <div
                className="mono"
                style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 8 }}
              >
                Contract: {t.contract}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <span
                  className="chip"
                  style={{ color: tagColors[t.tagType], borderColor: tagColors[t.tagType] }}
                >
                  {t.tag}
                </span>
                {i === 0 && (
                  <span
                    className="chip"
                    style={{ color: "var(--text-muted)", borderColor: "var(--border-default)" }}
                  >
                    EVM_TRACE
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "8px 16px",
            borderTop: "1px solid var(--border-default)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span className="led led-green" />
          <span className="label-caps" style={{ fontSize: 9 }}>
            EVALUATOR_LINK: ACTIVE
          </span>
        </div>
      </div>
    </div>
  );
}
