"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  AnalysisRecord,
  AnalysisResult,
  DispatchStatus,
} from "@/types/api";
import { apiFireAndForget } from "@/services/apiClient";

const STORAGE_KEY = "zephyr.records.v1";

function loadLocal(): AnalysisRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AnalysisRecord[]) : [];
  } catch {
    return [];
  }
}

function saveLocal(records: AnalysisRecord[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    /* storage full / unavailable — ignore */
  }
}

/**
 * Data-accumulation store for analyses.
 * Persists to localStorage and best-effort syncs to the masterfabric-go
 * backend (with JWT) when NEXT_PUBLIC_BACKEND_URL is configured.
 */
export function useRecords() {
  const [records, setRecords] = useState<AnalysisRecord[]>([]);

  useEffect(() => {
    setRecords(loadLocal());
  }, []);

  const addRecord = useCallback((result: AnalysisResult): AnalysisRecord => {
    const record: AnalysisRecord = {
      ...result,
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setRecords((prev) => {
      const next = [record, ...prev].slice(0, 100);
      saveLocal(next);
      return next;
    });

    apiFireAndForget("/api/v1/cleanliness/records", {
      method: "POST",
      body: record,
    });

    return record;
  }, []);

  const removeRecord = useCallback((id: string) => {
    setRecords((prev) => {
      const next = prev.filter((r) => r.id !== id);
      saveLocal(next);
      return next;
    });
    apiFireAndForget(`/api/v1/cleanliness/records/${id}`, { method: "DELETE" });
  }, []);

  const assignTeam = useCallback((id: string, team: string) => {
    setRecords((prev) => {
      const next = prev.map((r) =>
        r.id === id
          ? { ...r, assignedTeam: team, status: "assigned" as DispatchStatus }
          : r,
      );
      saveLocal(next);
      return next;
    });
    apiFireAndForget(`/api/v1/cleanliness/records/${id}/assign`, {
      method: "POST",
      body: { team },
    });
  }, []);

  const setStatus = useCallback((id: string, status: DispatchStatus) => {
    setRecords((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, status } : r));
      saveLocal(next);
      return next;
    });
    apiFireAndForget(`/api/v1/cleanliness/records/${id}/status`, {
      method: "POST",
      body: { status },
    });
  }, []);

  const clear = useCallback(() => {
    setRecords([]);
    saveLocal([]);
    apiFireAndForget("/api/v1/cleanliness/records", { method: "DELETE" });
  }, []);

  return { records, addRecord, removeRecord, assignTeam, setStatus, clear };
}
