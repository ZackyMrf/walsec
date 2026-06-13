"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ConnectButton } from '@mysten/dapp-kit';

export function TopBar() {
  const [block, setBlock] = useState(482193);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setBlock((b) => b + Math.floor(Math.random() * 3 + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="topbar">
      {/* Left: Brand */}
      <Link href="/" className="topbar-brand">
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
        <button className="topbar-icon-btn" title="Notifications">🔔</button>
        <button className="topbar-icon-btn" title="Settings">⚙</button>
        <div className="topbar-operator-badge">OP</div>
      </div>
    </header>
  );
}
