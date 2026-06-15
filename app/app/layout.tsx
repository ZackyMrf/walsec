import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { SwarmProvider } from "@/context/SwarmContext";
import { AppProviders } from "@/components/AppProviders";
import { Shell } from "@/components/Shell";

export const metadata: Metadata = {
  title: "WALSEC — Autonomous Smart Contract Audit System",
  description:
    "Multi-agent AI smart contract security auditing on Sui, powered by LangGraph and Walrus decentralized storage.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AppProviders>
          <SwarmProvider>
            <Shell>{children}</Shell>
          </SwarmProvider>
        </AppProviders>
      </body>
    </html>
  );
}
