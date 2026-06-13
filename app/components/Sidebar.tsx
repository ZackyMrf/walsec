"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/",
    label: "SHIELD",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  {
    href: "/swarm",
    label: "CPU",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/>
        <line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/>
        <line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>
        <line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/>
        <line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>
      </svg>
    ),
  },
  {
    href: "/explorer",
    label: "DATABASE",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3"/>
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
      </svg>
    ),
  },
  {
    href: "/config",
    label: "TERMINAL",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
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
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
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
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          HELP
        </button>
        <button
          className="sidebar-nav-item"
          style={{ background: "transparent", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          LOGOUT
        </button>
      </div>
    </aside>
  );
}
