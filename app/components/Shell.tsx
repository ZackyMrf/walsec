"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/landing";

  if (isLanding) {
    return <main className="main-content landing-full">{children}</main>;
  }

  return (
    <div className="app-shell">
      <TopBar />
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}
