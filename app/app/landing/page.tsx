"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ─── Animated counter ────────────────────────────────────────────────────────
function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let start = 0;
    const step = target / 60;
    const interval = setInterval(() => {
      start += step;
      if (start >= target) {
        setVal(target);
        clearInterval(interval);
      } else {
        setVal(Math.floor(start));
      }
    }, 20);
    return () => clearInterval(interval);
  }, [target]);

  return (
    <span suppressHydrationWarning>
      {mounted ? val.toLocaleString("en-US") : "0"}
      {suffix}
    </span>
  );
}

// ─── Feature card ────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="landing-feature-card">
      <div className="landing-feature-icon">{icon}</div>
      <div className="landing-feature-title">{title}</div>
      <div className="landing-feature-desc">{desc}</div>
    </div>
  );
}

// ─── Pipeline step ───────────────────────────────────────────────────────────
function PipelineStep({ num, label, sub, color, desc }: { num: string; label: string; sub: string; color: string; desc: string }) {
  return (
    <div className="landing-pipeline-step">
      <div className="landing-step-num" style={{ color, borderColor: color }}>{num}</div>
      <div className="landing-step-label" style={{ color }}>{label}</div>
      <div className="landing-step-sub">{sub}</div>
      <div className="landing-step-desc">{desc}</div>
    </div>
  );
}

// ─── Landing page ────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="landing-page">
      {/* ── Navigation ─── */}
      <nav className="landing-nav" style={{ transform: `translateY(${scrollY > 50 ? "-2px" : "0"})` }}>
        <div className="landing-nav-inner">
          <Link href="/landing" className="landing-nav-brand">
            <span className="landing-nav-logo">◈</span> WALSEC
          </Link>
          <div className="landing-nav-links">
            <a href="#features" className="landing-nav-link">Features</a>
            <a href="#pipeline" className="landing-nav-link">Pipeline</a>
            <a href="#stats" className="landing-nav-link">Network</a>
            <Link href="/docs" className="landing-nav-link">Docs</Link>
          </div>
          <div className="landing-nav-actions">
            <Link href="/" className="btn btn-secondary" style={{ fontSize: 10, padding: "6px 16px" }}>
              LAUNCH APP
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ─── */}
      <section className="landing-hero">
        <div className="landing-hero-bg" />
        <div className="landing-hero-content">
          <div className="landing-hero-badge">
            <span className="led led-green" style={{ width: 6, height: 6 }} />
            <span>MAINNET READY — EPOCH 428</span>
          </div>
          <h1 className="landing-hero-title">
            Autonomous Smart Contract<br />
            <span className="landing-hero-title-accent">Security Auditing</span>
          </h1>
          <p className="landing-hero-sub">
            Multi-agent AI swarm that analyzes, exploits, and evaluates Sui Move smart contracts.
            Results stored on Walrus decentralized storage with on-chain proof via Sui blockchain.
          </p>
          <div className="landing-hero-ctas">
            <Link href="/" className="btn btn-primary landing-cta-primary">
              INITIALIZE SWARM →
            </Link>
            <a href="#pipeline" className="btn btn-secondary">
              VIEW PIPELINE
            </a>
          </div>
          <div className="landing-hero-tech">
            <span className="landing-tech-tag">Sui Move</span>
            <span className="landing-tech-tag">LangGraph</span>
            <span className="landing-tech-tag">Gemini AI</span>
            <span className="landing-tech-tag">Walrus Storage</span>
            <span className="landing-tech-tag">On-Chain Proof</span>
          </div>
        </div>
        {/* Animated grid background */}
        <div className="landing-grid-overlay" />
      </section>

      {/* ── Features Section ─── */}
      <section id="features" className="landing-section">
        <div className="landing-section-header">
          <span className="landing-section-tag">CAPABILITIES</span>
          <h2 className="landing-section-title">Three-Agent Security Swarm</h2>
          <p className="landing-section-desc">
            Each agent specializes in a phase of the audit pipeline, working autonomously to deliver comprehensive security analysis.
          </p>
        </div>
        <div className="landing-features-grid">
          <FeatureCard
            icon="🔍"
            title="AGENT_01 — ANALYZER"
            desc="Deep pattern recognition engine. Scans for arithmetic overflow, reentrancy, missing capability checks, access control bypass, and 15+ vulnerability categories using symbolic execution."
          />
          <FeatureCard
            icon="⚔"
            title="AGENT_02 — EXECUTOR"
            desc="Autonomous exploit simulation. Constructs theoretical attack vectors, estimates exploitable value, rates difficulty, and models step-by-step transaction sequences."
          />
          <FeatureCard
            icon="⚖"
            title="AGENT_03 — EVALUATOR"
            desc="Final arbiter and memory keeper. Synthesizes findings into a definitive audit artifact with severity rating, CWE mapping, risk score, and actionable remediation steps."
          />
          <FeatureCard
            icon="🐙"
            title="WALRUS STORAGE"
            desc="All audit artifacts stored on Walrus decentralized storage network. Sharded, replicated, and censorship-resistant. No central point of failure."
          />
          <FeatureCard
            icon="⛓"
            title="ON-CHAIN PROOF"
            desc="Every audit record committed to Sui blockchain via wallet transaction. Immutable, verifiable, and tied to your wallet identity. Full provenance trail."
          />
          <FeatureCard
            icon="🔧"
            title="AUTO-REMEDIATION"
            desc="One-click vulnerability patching. Generates secure, production-ready fixed code with proper assertions, capability checks, and safe arithmetic patterns."
          />
        </div>
      </section>

      {/* ── Pipeline Section ─── */}
      <section id="pipeline" className="landing-section landing-section-alt">
        <div className="landing-section-header">
          <span className="landing-section-tag">WORKFLOW</span>
          <h2 className="landing-section-title">How The Swarm Works</h2>
          <p className="landing-section-desc">
            Submit your Sui Move contract and watch the three-agent pipeline analyze, simulate, and evaluate in real-time.
          </p>
        </div>
        <div className="landing-pipeline-grid">
          <PipelineStep
            num="01"
            label="SUBMIT"
            sub="Contract Upload"
            color="var(--secondary)"
            desc="Paste your Sui Move smart contract code or select from pre-loaded vulnerable demo samples. Wallet connection required for on-chain persistence."
          />
          <PipelineStep
            num="02"
            label="ANALYZE"
            sub="Pattern Recognition"
            color="var(--secondary)"
            desc="AGENT_01 scans the bytecode for vulnerability patterns using symbolic execution and heuristic analysis. Identifies all potential attack surfaces."
          />
          <PipelineStep
            num="03"
            label="EXECUTE"
            sub="Exploit Simulation"
            color="var(--on-tertiary-container)"
            desc="AGENT_02 constructs theoretical exploit vectors for each finding. Models attack sequences, estimates impact, and rates exploit difficulty."
          />
          <PipelineStep
            num="04"
            label="EVALUATE"
            sub="Consensus & Artifact"
            color="var(--semantic-safe)"
            desc="AGENT_03 synthesizes all findings into a final audit artifact with severity, risk score, CWE mapping, and detailed remediation steps."
          />
          <PipelineStep
            num="05"
            label="STORE"
            sub="Walrus + On-Chain"
            color="var(--semantic-warning)"
            desc="Artifact stored on Walrus decentralized storage. Audit record committed to Sui blockchain via your wallet. Immutable proof of audit."
          />
          <PipelineStep
            num="06"
            label="FIX"
            sub="Auto-Patch"
            color="var(--semantic-safe)"
            desc="Review vulnerability details and apply one-click auto-fix. Code is rewritten with secure patterns, proper assertions, and capability checks."
          />
        </div>
      </section>

      {/* ── Stats Section ─── */}
      <section id="stats" className="landing-section">
        <div className="landing-section-header">
          <span className="landing-section-tag">NETWORK</span>
          <h2 className="landing-section-title">Swarm Statistics</h2>
        </div>
        <div className="landing-stats-grid">
          <div className="landing-stat-card">
            <div className="landing-stat-value">
              <AnimatedNumber target={1402} />
            </div>
            <div className="landing-stat-label">TOTAL NODES</div>
          </div>
          <div className="landing-stat-card">
            <div className="landing-stat-value" style={{ color: "var(--secondary)" }}>
              <AnimatedNumber target={28400} suffix="" />
            </div>
            <div className="landing-stat-label">THREATS DEFLECTED</div>
          </div>
          <div className="landing-stat-card">
            <div className="landing-stat-value" style={{ color: "var(--semantic-safe)" }}>
              99.9<span style={{ fontSize: 16 }}>%</span>
            </div>
            <div className="landing-stat-label">UPTIME</div>
          </div>
          <div className="landing-stat-card">
            <div className="landing-stat-value" style={{ color: "var(--on-tertiary-container)" }}>
              428
            </div>
            <div className="landing-stat-label">CURRENT EPOCH</div>
          </div>
        </div>
      </section>

      {/* ── CTA Section ─── */}
      <section className="landing-cta-section">
        <div className="landing-cta-content">
          <h2 className="landing-cta-title">Ready to Audit Your Contract?</h2>
          <p className="landing-cta-desc">
            Connect your Sui wallet and initialize the swarm. Your audit results will be permanently stored on-chain.
          </p>
          <Link href="/" className="btn btn-primary landing-cta-btn">
            INITIALIZE SWARM →
          </Link>
        </div>
      </section>

      {/* ── Footer ─── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <span className="landing-nav-logo"></span> WALSEC
            <span className="landing-footer-tagline">Autonomous Smart Contract Audit System</span>
          </div>
          <div className="landing-footer-links">
            <div>
              <div className="landing-footer-col-title">Platform</div>
              <Link href="/" className="landing-footer-link">Dashboard</Link>
              <Link href="/swarm" className="landing-footer-link">Swarm Hub</Link>
              <Link href="/explorer" className="landing-footer-link">Explorer</Link>
              <Link href="/config" className="landing-footer-link">Terminal</Link>
            </div>
            <div>
              <div className="landing-footer-col-title">Resources</div>
              <a href="#" className="landing-footer-link">Documentation</a>
              <a href="#" className="landing-footer-link">API Reference</a>
              <a href="#" className="landing-footer-link">Move Security Guide</a>
            </div>
            <div>
              <div className="landing-footer-col-title">Network</div>
              <a href="https://walruscan.com" target="_blank" rel="noopener" className="landing-footer-link">Walruscan</a>
              <a href="https://sui.io" target="_blank" rel="noopener" className="landing-footer-link">Sui Network</a>
              <a href="https://walrus.space" target="_blank" rel="noopener" className="landing-footer-link">Walrus Protocol</a>
            </div>
          </div>
        </div>
        <div className="landing-footer-bottom">
          <span>© 2026 WALSEC. Built for Sui Hackathon.</span>
          <span className="label-caps" style={{ fontSize: 9, color: "var(--text-muted)" }}>
            PROTOCOL_V: 2.1.0-BETA
          </span>
        </div>
      </footer>
    </div>
  );
}
