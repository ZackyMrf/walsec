"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  {
    href: "/landing",
    label: "HOME",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/",
    label: "SHIELD",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    href: "/swarm",
    label: "CPU",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" />
        <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
        <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
        <line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" />
        <line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" />
      </svg>
    ),
  },
  {
    href: "/explorer",
    label: "DATABASE",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
  },
  {
    href: "/config",
    label: "ASK WALSEC",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
      </svg>
    ),
  },
];

// Keyboard shortcuts reference
const SHORTCUTS = [
  { keys: ["Ctrl", "K"], desc: "Quick audit (from dashboard)" },
  { keys: ["Ctrl", "/"], desc: "Toggle help panel" },
  { keys: ["Esc"], desc: "Close modals / cancel" },
  { keys: ["Ctrl", "S"], desc: "Save configuration" },
  { keys: ["↑", "↓"], desc: "Terminal history" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [showHelp, setShowHelp] = useState(false);

  return (
    <aside className="sidebar">
      {/* Help Modal */}
      {showHelp && (
        <div className="help-overlay" onClick={() => setShowHelp(false)}>
          <div className="help-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span className="label-caps" style={{ color: "var(--secondary)", fontSize: 12 }}>WALSEC HELP CENTER</span>
              <button className="btn btn-secondary" style={{ padding: "2px 8px", fontSize: 10 }} onClick={() => setShowHelp(false)}>✕</button>
            </div>

            <div className="help-section">
              <div className="help-section-title">🛡 WHAT IS WALSEC?</div>
              <p className="help-text">
                WALSEC is an autonomous smart contract security auditing system built on Sui blockchain.
                It uses a 3-agent AI swarm (Analyzer → Executor → Evaluator) to find vulnerabilities in Sui Move contracts,
                stores results on Walrus decentralized storage, and commits audit proof on-chain.
              </p>
            </div>

            <div className="help-section">
              <div className="help-section-title"> QUICK START</div>
              <ol className="help-list">
                <li>Connect your Sui wallet (top-right)</li>
                <li>Go to <strong>SHIELD</strong> (dashboard)</li>
                <li>Paste a Sui Move contract or click a demo sample</li>
                <li>Click <strong>INITIALIZE SWARM</strong></li>
                <li>Review findings → See vulnerability details → Apply fix</li>
              </ol>
            </div>

            <div className="help-section">
              <div className="help-section-title">⌨ KEYBOARD SHORTCUTS</div>
              <div className="help-shortcuts">
                {SHORTCUTS.map((s, i) => (
                  <div key={i} className="help-shortcut-row">
                    <div className="help-keys">
                      {s.keys.map((k, j) => (
                        <kbd key={j} className="help-kbd">{k}</kbd>
                      ))}
                    </div>
                    <span className="help-shortcut-desc">{s.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="help-section">
              <div className="help-section-title">📖 PAGES</div>
              <div className="help-pages-grid">
                <Link href="/landing" className="help-page-link" onClick={() => setShowHelp(false)}>
                  <span>🏠</span> Landing — Overview & features
                </Link>
                <Link href="/" className="help-page-link" onClick={() => setShowHelp(false)}>
                  <span>🛡</span> Shield — Audit dashboard
                </Link>
                <Link href="/swarm" className="help-page-link" onClick={() => setShowHelp(false)}>
                  <span>⚡</span> CPU — Swarm intelligence hub
                </Link>
                <Link href="/explorer" className="help-page-link" onClick={() => setShowHelp(false)}>
                  <span>🗄</span> Database — Walrus artifact explorer
                </Link>
                <Link href="/config" className="help-page-link" onClick={() => setShowHelp(false)}>
                  <span>⌨</span> Ask Walsec — AI Chat Assistant
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User badge */}
      <div className="sidebar-user">
        <div
          style={{
            width: 32,
            height: 32,
            background: "var(--surface-high)",
            border: "1px solid var(--border-default)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 8,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--secondary)" strokeWidth="1.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div className="sidebar-user-handle">OPERATOR_01</div>
        <div className="sidebar-user-level">LEVEL_4_AUTH</div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1 }}>
        <ul className="sidebar-nav">
          {navItems.map(({ href, icon, label }) => {
            const isActive = pathname === href;
            return (
              <li key={href} style={{ listStyle: "none" }}>
                <Link
                  href={href}
                  style={{ textDecoration: "none", display: "block" }}
                >
                  <div
                    className={`sidebar-nav-item${isActive ? " active" : ""}`}
                    style={{
                      color: isActive ? "var(--primary)" : undefined,
                    }}
                  >
                    <span
                      style={{
                        color: isActive ? "var(--secondary)" : "var(--text-muted)",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {icon}
                    </span>
                    {label}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom actions */}
      <div className="sidebar-bottom">
        <button
          className="sidebar-nav-item"
          style={{ background: "transparent", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}
          onClick={() => setShowHelp(true)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          HELP
        </button>
        <Link href="/config" className="sidebar-nav-item" style={{ textDecoration: "none" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          SETTINGS
        </Link>
      </div>
    </aside>
  );
}
