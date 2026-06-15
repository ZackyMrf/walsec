"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "architecture", label: "Architecture" },
  { id: "getting-started", label: "Getting Started" },
  { id: "vulnerabilities", label: "Vulnerability Types" },
  { id: "pipeline", label: "Audit Pipeline" },
  { id: "api", label: "API Reference" },
  { id: "on-chain", label: "On-Chain Integration" },
  { id: "samples", label: "Contract Samples" },
  { id: "tech-stack", label: "Tech Stack" },
  { id: "faq", label: "FAQ" },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setSidebarOpen(false);
  };

  return (
    <div className="docs-page">
      {/* Mobile sidebar toggle */}
      <button
        className="docs-sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <span className="docs-hamburger">{sidebarOpen ? "\u2715" : "\u2630"}</span>
        <span>Docs Navigation</span>
      </button>

      {/* Sidebar */}
      <aside className={`docs-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="docs-sidebar-header">
          <Link href="/landing" className="docs-logo-link">
            <span className="docs-logo-icon">{"\u25C6"}</span>
            <span className="docs-logo-text">WALSEC</span>
          </Link>
          <span className="docs-version-badge">v1.0</span>
        </div>

        <nav className="docs-nav">
          <p className="docs-nav-label">Documentation</p>
          {SECTIONS.map(({ id, label }) => (
            <button
              key={id}
              className={`docs-nav-item ${activeSection === id ? "active" : ""}`}
              onClick={() => scrollTo(id)}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="docs-sidebar-footer">
          <Link href="/" className="docs-sidebar-link">
            {"\u2192"} Launch App
          </Link>
          <Link href="/landing" className="docs-sidebar-link">
            {"\u2190"} Back to Home
          </Link>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="docs-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="docs-content">
        {/* ─── Overview ─── */}
        <section id="overview" className="docs-section">
          <h1 className="docs-title">WALSEC Documentation</h1>
          <p className="docs-subtitle">
            Autonomous Smart Contract Security Auditing on Sui
          </p>

          <div className="docs-card">
            <h3>What is WALSEC?</h3>
            <p>
              WALSEC is an autonomous multi-agent AI system that analyzes, exploits,
              and evaluates Sui Move smart contracts for security vulnerabilities.
              Built for the Sui Hackathon 2026, it combines three specialized AI
              agents with decentralized storage (Walrus) and on-chain proof (Sui
              blockchain) to deliver comprehensive, immutable audit results.
            </p>
          </div>

          <div className="docs-grid-2">
            <div className="docs-card">
              <h3>Key Features</h3>
              <ul className="docs-list">
                <li>Three-agent autonomous audit pipeline</li>
                <li>15+ vulnerability pattern detection</li>
                <li>Auto-exploit simulation & impact estimation</li>
                <li>One-click vulnerability patching</li>
                <li>Decentralized storage via Walrus</li>
                <li>Immutable on-chain audit records on Sui</li>
                <li>Real-time terminal interface</li>
                <li>Audit history with full JSON details</li>
              </ul>
            </div>
            <div className="docs-card">
              <h3>Why WALSEC?</h3>
              <ul className="docs-list">
                <li><strong>Autonomous:</strong> No manual review needed — agents work independently</li>
                <li><strong>Comprehensive:</strong> Covers arithmetic, access control, reentrancy, and more</li>
                <li><strong>Immutable:</strong> Results stored on-chain, cannot be tampered with</li>
                <li><strong>Decentralized:</strong> Walrus storage ensures no single point of failure</li>
                <li><strong>Actionable:</strong> Auto-fix generates production-ready secure code</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ─── Architecture ── */}
        <section id="architecture" className="docs-section">
          <h2 className="docs-section-title">Architecture</h2>
          <p className="docs-lead">
            WALSEC uses a three-agent pipeline powered by LangGraph, where each
            agent specializes in a distinct phase of the security audit.
          </p>

          <div className="docs-agent-cards">
            <div className="docs-agent-card">
              <div className="docs-agent-badge agent-01">AGENT_01</div>
              <h3>Analyzer</h3>
              <p>
                Deep pattern recognition engine that scans Sui Move bytecode for
                vulnerability patterns using symbolic execution and heuristic
                analysis.
              </p>
              <div className="docs-agent-tasks">
                <span>Overflow detection</span>
                <span>Reentrancy analysis</span>
                <span>Access control audit</span>
                <span>CWE mapping</span>
              </div>
            </div>

            <div className="docs-agent-card">
              <div className="docs-agent-badge agent-02">AGENT_02</div>
              <h3>Executor</h3>
              <p>
                Autonomous exploit simulation agent that constructs theoretical
                attack vectors and estimates the real-world impact of each finding.
              </p>
              <div className="docs-agent-tasks">
                <span>Attack vector construction</span>
                <span>Value estimation</span>
                <span>Difficulty rating</span>
                <span>Tx sequence modeling</span>
              </div>
            </div>

            <div className="docs-agent-card">
              <div className="docs-agent-badge agent-03">AGENT_03</div>
              <h3>Evaluator</h3>
              <p>
                Final arbiter that synthesizes all findings into a definitive audit
                artifact with severity rating, risk score, and remediation steps.
              </p>
              <div className="docs-agent-tasks">
                <span>Severity classification</span>
                <span>Risk scoring</span>
                <span>Remediation guidance</span>
                <span>Artifact generation</span>
              </div>
            </div>
          </div>

          <div className="docs-card">
            <h3>Supporting Infrastructure</h3>
            <div className="docs-grid-2">
              <div>
                <h4>Walrus Decentralized Storage</h4>
                <p>
                  All audit artifacts are stored on Walrus — a decentralized storage
                  network that shards and replicates data across nodes. No central
                  point of failure, censorship-resistant, and permanently accessible.
                </p>
              </div>
              <div>
                <h4>Sui On-Chain Proof</h4>
                <p>
                  Every audit record is committed to the Sui blockchain via a wallet
                  transaction. This creates an immutable, verifiable record tied to
                  your wallet identity with full provenance trail.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Getting Started ── */}
        <section id="getting-started" className="docs-section">
          <h2 className="docs-section-title">Getting Started</h2>

          <div className="docs-steps">
            <div className="docs-step">
              <div className="docs-step-num">1</div>
              <div>
                <h3>Connect Your Wallet</h3>
                <p>
                  Click <code>Connect Wallet</code> in the top bar. WALSEC requires a
                  Sui wallet (Sui Wallet, Ethos, etc.) for on-chain audit persistence.
                  The app will not initialize the swarm until a wallet is connected.
                </p>
              </div>
            </div>

            <div className="docs-step">
              <div className="docs-step-num">2</div>
              <div>
                <h3>Submit a Contract</h3>
                <p>
                  Paste your Sui Move smart contract code into the editor, or select
                  from pre-loaded vulnerable demo samples (
                  <code>VAULT_OVERFLOW</code>, <code>ACCESS_CONTROL_BYPASS</code>).
                </p>
              </div>
            </div>

            <div className="docs-step">
              <div className="docs-step-num">3</div>
              <div>
                <h3>Initialize the Swarm</h3>
                <p>
                  Click <code>Initialize Swarm</code> to start the three-agent audit
                  pipeline. Watch real-time progress as each agent completes its phase.
                  The pipeline typically takes 30-90 seconds.
                </p>
              </div>
            </div>

            <div className="docs-step">
              <div className="docs-step-num">4</div>
              <div>
                <h3>Review Results</h3>
                <p>
                  Once complete, review the audit artifact showing vulnerability
                  details, severity, risk score, and CWE classification. Click{" "}
                  <code>See Vulnerability</code> for full JSON details.
                </p>
              </div>
            </div>

            <div className="docs-step">
              <div className="docs-step-num">5</div>
              <div>
                <h3>Apply Fix (Optional)</h3>
                <p>
                  Click <code>Apply Fix</code> to auto-generate secure, production-ready
                  code. The fix is applied with a typing animation and includes proper
                  assertions, capability checks, and safe arithmetic patterns.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Vulnerability Types ─── */}
        <section id="vulnerabilities" className="docs-section">
          <h2 className="docs-section-title">Vulnerability Types</h2>
          <p className="docs-lead">
            WALSEC detects 15+ vulnerability categories in Sui Move smart contracts.
          </p>

          <div className="docs-vuln-grid">
            {[
              { name: "Arithmetic Overflow", severity: "Critical", desc: "Integer overflow/underflow in arithmetic operations without bounds checking." },
              { name: "Access Control Bypass", severity: "Critical", desc: "Missing or incorrect capability checks allowing unauthorized operations." },
              { name: "Reentrancy", severity: "High", desc: "State modification after external call allowing recursive re-entry attacks." },
              { name: "Unauthorized Withdrawal", severity: "Critical", desc: "Missing ownership verification enabling fund theft." },
              { name: "Integer Underflow", severity: "Critical", desc: "Subtraction below zero without underflow protection." },
              { name: "Missing Capability Check", severity: "High", desc: "Admin functions lacking proper AdminCap verification." },
              { name: "Unchecked Return Value", severity: "Medium", desc: "Ignoring return values from critical function calls." },
              { name: "Type Confusion", severity: "High", desc: "Improper type handling leading to unexpected behavior." },
              { name: "Resource Leak", severity: "Medium", desc: "Failure to properly transfer or destroy resources." },
              { name: "Infinite Loop", severity: "Medium", desc: "Unbounded loops that can exhaust gas or hang execution." },
              { name: "Privilege Escalation", severity: "Critical", desc: "Ability to gain elevated permissions through contract manipulation." },
              { name: "Oracle Manipulation", severity: "High", desc: "Price feed or external data source manipulation." },
              { name: "Front-Running", severity: "Medium", desc: "Transaction ordering exploitation in DEX or auction contracts." },
              { name: "Zero-Amount Bypass", severity: "Medium", desc: "Missing zero-value checks allowing dust attacks." },
              { name: "Logic Error", severity: "Low", desc: "Business logic flaws that deviate from intended behavior." },
            ].map((v) => (
              <div key={v.name} className="docs-vuln-card">
                <div className="docs-vuln-header">
                  <span className="docs-vuln-name">{v.name}</span>
                  <span className={`docs-severity-badge sev-${v.severity.toLowerCase()}`}>
                    {v.severity}
                  </span>
                </div>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Pipeline ─── */}
        <section id="pipeline" className="docs-section">
          <h2 className="docs-section-title">Audit Pipeline</h2>
          <p className="docs-lead">
            The audit pipeline is orchestrated by LangGraph and runs through six phases.
          </p>

          <div className="docs-pipeline-flow">
            {[
              { phase: "SUBMIT", desc: "Contract code is received and validated. Wallet connection verified for on-chain persistence." },
              { phase: "ANALYZE", desc: "AGENT_01 scans bytecode for vulnerability patterns using symbolic execution and heuristic analysis." },
              { phase: "EXECUTE", desc: "AGENT_02 constructs theoretical exploit vectors, models attack sequences, and rates difficulty." },
              { phase: "EVALUATE", desc: "AGENT_03 synthesizes findings into a final artifact with severity, risk score, and remediation." },
              { phase: "STORE", desc: "Artifact stored on Walrus decentralized storage. Audit record committed to Sui blockchain." },
              { phase: "FIX", desc: "Optional auto-patch generates secure code with proper assertions and capability checks." },
            ].map((step, i) => (
              <div key={step.phase} className="docs-pipeline-step">
                <div className="docs-pipeline-num">{String(i + 1).padStart(2, "0")}</div>
                <h4>{step.phase}</h4>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="docs-card">
            <h3>Pipeline Configuration</h3>
            <div className="docs-code-block">
              <pre>{`// Timeout configuration
LLM_TIMEOUT_MS = 50_000        // Per-node LLM call timeout
PIPELINE_TIMEOUT_MS = 170_000  // Overall pipeline timeout
MAX_DURATION_MS = 180_000      // API route max duration
WALRUS_TIMEOUT_MS = 8_000      // Non-blocking Walrus fetch`}</pre>
            </div>
          </div>
        </section>

        {/* ─── API Reference ─── */}
        <section id="api" className="docs-section">
          <h2 className="docs-section-title">API Reference</h2>

          <div className="docs-card">
            <h3>POST /api/audit</h3>
            <p>Submit a smart contract for autonomous security audit.</p>
            <div className="docs-code-block">
              <pre>{`// Request
{
  "code": "module vault::pool { ... }",
  "contractName": "VAULT_OVERFLOW"
}

// Response
{
  "success": true,
  "artifact": {
    "contractName": "VAULT_OVERFLOW",
    "vulnerabilities": [
      {
        "type": "Arithmetic Overflow",
        "severity": "Critical",
        "description": "...",
        "cwe": "CWE-190",
        "riskScore": 9.5,
        "affectedLines": [15, 22]
      }
    ],
    "agent_consensus": "...",
    "status": "completed",
    "txHash": "0x...",
    "walrusBlobId": "..."
  }
}`}</pre>
            </div>
          </div>

          <div className="docs-card">
            <h3>POST /api/walrus</h3>
            <p>Store audit artifact on Walrus decentralized storage.</p>
            <div className="docs-code-block">
              <pre>{`// Request
{
  "artifact": { ... },
  "contractName": "VAULT_OVERFLOW"
}

// Response
{
  "success": true,
  "blobId": "walrus_blob_id...",
  "epoch": 428
}`}</pre>
            </div>
          </div>

          <div className="docs-card">
            <h3>Terminal Commands</h3>
            <p>Available commands in the Terminal page (<code>/config</code>):</p>
            <div className="docs-table-wrapper">
              <table className="docs-table">
                <thead>
                  <tr>
                    <th>Command</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td><code>help</code></td><td>Show all available commands</td></tr>
                  <tr><td><code>clear</code></td><td>Clear terminal output</td></tr>
                  <tr><td><code>status</code></td><td>Show system and swarm status</td></tr>
                  <tr><td><code>history</code></td><td>Show audit history from on-chain records</td></tr>
                  <tr><td><code>agents</code></td><td>List active AI agents and their status</td></tr>
                  <tr><td><code>threats</code></td><td>Show detected threat statistics</td></tr>
                  <tr><td><code>network</code></td><td>Display network and node information</td></tr>
                  <tr><td><code>scan &lt;addr&gt;</code></td><td>Simulate vulnerability scan on address</td></tr>
                  <tr><td><code>ping</code></td><td>Check network latency to nodes</td></tr>
                  <tr><td><code>hash &lt;text&gt;</code></td><td>Generate deterministic hash of text</td></tr>
                  <tr><td><code>export</code></td><td>Download terminal logs as .txt file</td></tr>
                  <tr><td><code>uptime</code></td><td>Show system uptime statistics</td></tr>
                  <tr><td><code>version</code></td><td>Show WALSEC version info</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ─── On-Chain Integration ─── */}
        <section id="on-chain" className="docs-section">
          <h2 className="docs-section-title">On-Chain Integration</h2>

          <div className="docs-card">
            <h3>Move Contract: walsec_registry</h3>
            <p>
              WALSEC uses a Sui Move smart contract to store audit records on-chain.
              Each audit creates an immutable record tied to the operator&apos;s wallet.
            </p>
            <div className="docs-code-block">
              <pre>{`// Event emitted on each audit
public struct AuditRecorded has copy, drop {
    operator: address,
    contract_name: String,
    severity: String,
    risk_score: u8,
    num_vulnerabilities: u64,
    timestamp_ms: u64,
    walrus_blob_id: String,
}`}</pre>
            </div>
          </div>

          <div className="docs-card">
            <h3>How It Works</h3>
            <ol className="docs-list">
              <li>User connects their Sui wallet to the application</li>
              <li>Audit pipeline completes and generates the artifact</li>
              <li>Artifact is stored on Walrus decentralized storage</li>
              <li>A transaction is sent to the walsec_registry contract</li>
              <li>The <code>AuditRecorded</code> event is emitted on-chain</li>
              <li>History is loaded from on-chain events via <code>sui_queryEvents</code></li>
            </ol>
          </div>

          <div className="docs-card">
            <h3>Contract Addresses</h3>
            <div className="docs-code-block">
              <pre>{`Package ID: 0x2d3f7e...  (testnet)
Module:     walsec_registry
Network:    Sui Testnet`}</pre>
            </div>
          </div>
        </section>

        {/* ─── Contract Samples ─── */}
        <section id="samples" className="docs-section">
          <h2 className="docs-section-title">Contract Samples</h2>
          <p className="docs-lead">
            WALSEC includes pre-loaded vulnerable demo contracts for testing.
          </p>

          <div className="docs-card">
            <h3>VAULT_OVERFLOW</h3>
            <p>
              A liquidity pool contract with an arithmetic overflow vulnerability in
              the deposit function. The share calculation can overflow when large
              amounts are deposited, allowing an attacker to mint excessive shares.
            </p>
            <div className="docs-vuln-list">
              <span className="docs-tag tag-critical">Arithmetic Overflow</span>
              <span className="docs-tag tag-critical">Integer Underflow</span>
              <span className="docs-tag tag-medium">Zero-Amount Bypass</span>
            </div>
          </div>

          <div className="docs-card">
            <h3>ACCESS_CONTROL_BYPASS</h3>
            <p>
              An admin-controlled contract missing proper capability verification.
              The withdraw function lacks AdminCap checks, allowing any user to
              drain the contract&apos;s funds.
            </p>
            <div className="docs-vuln-list">
              <span className="docs-tag tag-critical">Access Control Bypass</span>
              <span className="docs-tag tag-critical">Unauthorized Withdrawal</span>
              <span className="docs-tag tag-high">Missing Capability Check</span>
            </div>
          </div>

          <div className="docs-card">
            <h3>Auto-Fix Output</h3>
            <p>
              When a fix is applied, WALSEC generates complete, production-ready code
              with:
            </p>
            <ul className="docs-list">
              <li>Error code constants (<code>EOverflow</code>, <code>EUnderflow</code>, <code>EInvalidAdminCap</code>)</li>
              <li>Assertion guards (<code>assert!(amount &gt; 0, EZeroAmount)</code>)</li>
              <li>Capability verification (<code>assert!(_cap.id == pool.admin_cap_id, EInvalidAdminCap)</code>)</li>
              <li>Safe arithmetic with overflow checks</li>
              <li>Proper resource handling and transfer semantics</li>
            </ul>
          </div>
        </section>

        {/* ─── Tech Stack ── */}
        <section id="tech-stack" className="docs-section">
          <h2 className="docs-section-title">Tech Stack</h2>

          <div className="docs-grid-2">
            <div className="docs-card">
              <h3>Frontend</h3>
              <ul className="docs-list">
                <li><strong>Next.js 16</strong> — React framework with App Router</li>
                <li><strong>TypeScript</strong> — Type-safe development</li>
                <li><strong>CSS Custom Properties</strong> — Vigilant Void design system</li>
              </ul>
            </div>
            <div className="docs-card">
              <h3>Blockchain</h3>
              <ul className="docs-list">
                <li><strong>Sui</strong> — Layer 1 blockchain with Move language</li>
                <li><strong>@mysten/dapp-kit</strong> — Wallet connection & tx handling</li>
                <li><strong>Sui Move</strong> — Smart contract language</li>
              </ul>
            </div>
            <div className="docs-card">
              <h3>AI Pipeline</h3>
              <ul className="docs-list">
                <li><strong>LangGraph</strong> — Multi-agent orchestration</li>
                <li><strong>Gemini 2.5 Flash</strong> — LLM for analysis & generation</li>
                <li><strong>@langchain/google-genai</strong> — LangChain adapter</li>
              </ul>
            </div>
            <div className="docs-card">
              <h3>Storage</h3>
              <ul className="docs-list">
                <li><strong>Walrus</strong> — Decentralized blob storage</li>
                <li><strong>Sui Events</strong> — On-chain audit record persistence</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ── FAQ ─── */}
        <section id="faq" className="docs-section">
          <h2 className="docs-section-title">FAQ</h2>

          {[
            {
              q: "How long does an audit take?",
              a: "The full three-agent pipeline typically completes in 30-90 seconds depending on contract complexity and LLM response times. Each agent has a 50-second individual timeout."
            },
            {
              q: "Is my contract code sent to a third party?",
              a: "Contract code is processed by Gemini AI (Google) for vulnerability analysis. Results are stored on Walrus decentralized storage and recorded on Sui blockchain."
            },
            {
              q: "Can I audit any Sui Move contract?",
              a: "Yes. Paste any Sui Move module code into the editor. The system also includes pre-loaded vulnerable demo samples for testing."
            },
            {
              q: "What happens after I click Apply Fix?",
              a: "The system replaces your contract code with a secure, production-ready version that includes proper assertions, capability checks, error codes, and safe arithmetic patterns. The change is animated with a typing effect."
            },
            {
              q: "Do I need a wallet to use WALSEC?",
              a: "Yes. A Sui wallet connection is required to initialize the swarm and persist audit records on-chain. The wallet gate ensures all audits are tied to a verifiable identity."
            },
            {
              q: "How are audit results stored?",
              a: "Results are stored in two places: (1) Walrus decentralized storage for the full artifact JSON, and (2) Sui blockchain as an on-chain event for immutable proof."
            },
            {
              q: "What vulnerability types are detected?",
              a: "WALSEC detects 15+ categories including arithmetic overflow, access control bypass, reentrancy, unauthorized withdrawal, missing capability checks, and more. See the Vulnerability Types section for the full list."
            },
          ].map((item) => (
            <div key={item.q} className="docs-faq-item">
              <h4>{item.q}</h4>
              <p>{item.a}</p>
            </div>
          ))}
        </section>

        {/* Footer */}
        <footer className="docs-footer">
          <div className="docs-footer-content">
            <div>
              <span className="docs-footer-logo">{"\u25C6"} WALSEC</span>
              <p>Autonomous Smart Contract Security Auditing on Sui</p>
            </div>
            <div className="docs-footer-links">
              <Link href="/landing">Home</Link>
              <Link href="/">Launch App</Link>
              <Link href="/config">Terminal</Link>
              <a href="https://walrus.site" target="_blank" rel="noopener">Walrus</a>
              <a href="https://sui.io" target="_blank" rel="noopener">Sui</a>
            </div>
          </div>
          <p className="docs-footer-copy">
            Built for Sui Hackathon 2026. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
