"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export interface AuditArtifact {
  vulnerability_type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  timestamp: string;
  target_function?: string;
  walrus_object_id: string;
  namespace?: string;
  risk_score?: number;
  remediation?: string;
  cve_analogue?: string;
  agent_consensus?: string;
  status?: string;
}

export interface HistoryRow extends AuditArtifact {
  walrus_object_id: string;
}

export type AgentStage = "idle" | "analyzer" | "executor" | "evaluator" | "storing" | "complete" | "error";

interface SwarmContextType {
  code: string;
  setCode: React.Dispatch<React.SetStateAction<string>>;
  logs: string[];
  setLogs: React.Dispatch<React.SetStateAction<string[]>>;
  artifact: AuditArtifact | null;
  setArtifact: React.Dispatch<React.SetStateAction<AuditArtifact | null>>;
  history: HistoryRow[];
  setHistory: React.Dispatch<React.SetStateAction<HistoryRow[]>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  isPending: boolean;
  setIsPending: React.Dispatch<React.SetStateAction<boolean>>;
  agentStage: AgentStage;
  setAgentStage: React.Dispatch<React.SetStateAction<AgentStage>>;
}

const SwarmContext = createContext<SwarmContextType | undefined>(undefined);

export function SwarmProvider({ children }: { children: ReactNode }) {
  const [code, setCode] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [artifact, setArtifact] = useState<AuditArtifact | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [agentStage, setAgentStage] = useState<AgentStage>("idle");

  return (
    <SwarmContext.Provider
      value={{
        code,
        setCode,
        logs,
        setLogs,
        artifact,
        setArtifact,
        history,
        setHistory,
        error,
        setError,
        isPending,
        setIsPending,
        agentStage,
        setAgentStage,
      }}
    >
      {children}
    </SwarmContext.Provider>
  );
}

export function useSwarm() {
  const ctx = useContext(SwarmContext);
  if (!ctx) throw new Error("useSwarm must be used within SwarmProvider");
  return ctx;
}
