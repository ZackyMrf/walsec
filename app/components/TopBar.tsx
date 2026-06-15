"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ConnectButton } from '@mysten/dapp-kit';

export function TopBar() {
  const [block, setBlock] = useState(482193);
  const [mounted, setMounted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setBlock((b) => b + Math.floor(Math.random() * 3 + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setShowSettings(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Keyboard shortcut: Ctrl+/ for help
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === "/") {
        e.preventDefault();
        window.location.href = "/config";
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <header className="topbar">
      {/* Left: Brand */}
      <Link href="/landing" className="topbar-brand">
        WALSEC
      </Link>

      {/* Center: Node status */}
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <div className="topbar-node-status">
          <span className="status-dot" />
          <span>NODE_01:</span>
          <span className="status-text">ONLINE</span>
        </div>
        <div className="topbar-block" suppressHydrationWarning>
          LATEST_BLOCK: {mounted ? block.toLocaleString("en-US") : "482,193"}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="topbar-actions">
        <div id="wallet-connect-wrapper">
          <ConnectButton />
        </div>

        {/* Notifications */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button
            className="topbar-icon-btn"
            title="Notifications"
            onClick={() => { setShowNotif(!showNotif); setShowSettings(false); }}
          >
            🔔
          </button>
          {showNotif && (
            <div className="dropdown-panel">
              <div className="dropdown-header">NOTIFICATIONS</div>
              <div className="dropdown-item">
                <span style={{ color: "var(--semantic-safe)" }}>✓</span>
                <div>
                  <div className="dropdown-item-title">System Online</div>
                  <div className="dropdown-item-sub">All modules nominal. Epoch 428 active.</div>
                </div>
              </div>
              <div className="dropdown-item">
                <span style={{ color: "var(--secondary)" }}></span>
                <div>
                  <div className="dropdown-item-title">Swarm Ready</div>
                  <div className="dropdown-item-sub">3 agents initialized. Awaiting contract input.</div>
                </div>
              </div>
              <div className="dropdown-item">
                <span style={{ color: "var(--semantic-warning)" }}></span>
                <div>
                  <div className="dropdown-item-title">Tip: Use Demo Samples</div>
                  <div className="dropdown-item-sub">Click VAULT_OVERFLOW or ACCESS_CONTROL for quick demo.</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <div ref={settingsRef} style={{ position: "relative" }}>
          <button
            className="topbar-icon-btn"
            title="Settings"
            onClick={() => { setShowSettings(!showSettings); setShowNotif(false); }}
          >
            ⚙
          </button>
          {showSettings && (
            <div className="dropdown-panel">
              <div className="dropdown-header">SETTINGS</div>
              <Link href="/config" className="dropdown-item-link" onClick={() => setShowSettings(false)}>
                <span>⌨</span> Terminal / Config
              </Link>
              <Link href="/explorer" className="dropdown-item-link" onClick={() => setShowSettings(false)}>
                <span>🗄</span> Artifact Explorer
              </Link>
              <Link href="/swarm" className="dropdown-item-link" onClick={() => setShowSettings(false)}>
                <span>⚡</span> Swarm Hub
              </Link>
              <div className="dropdown-divider" />
              <a href="https://walruscan.com" target="_blank" rel="noopener" className="dropdown-item-link">
                <span></span> Walruscan Explorer ↗
              </a>
              <a href="https://sui.io" target="_blank" rel="noopener" className="dropdown-item-link">
                <span>⛓</span> Sui Network ↗
              </a>
              <div className="dropdown-divider" />
              <div className="dropdown-item" style={{ cursor: "default" }}>
                <span style={{ color: "var(--text-muted)" }}>ℹ</span>
                <div>
                  <div className="dropdown-item-title">WALSEC v2.1.0-beta</div>
                  <div className="dropdown-item-sub">Built for Sui Hackathon 2026</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="topbar-operator-badge">OP</div>
      </div>
    </header>
  );
}
