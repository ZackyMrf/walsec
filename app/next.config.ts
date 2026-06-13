import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep LangGraph, LangChain and Walrus SDK as server-only bundles.
  // They use native ESM and node-specific APIs that break on the client.
  serverExternalPackages: [
    "@langchain/langgraph",
    "@langchain/core",
    "@langchain/google-genai",
    "@mysten-incubation/memwal",
    "@mysten/sui",
    "@mysten/walrus",
  ],

  // Allow outbound fetch calls to Walrus public endpoints
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
    ];
  },
};

export default nextConfig;
