"use client";

import { useCallback, useEffect, useState } from "react";
import type { AnalysisRecord, AnalysisResult } from "@/types/api";

const STORAGE_KEY = "zephyr.records.v1";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

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
 * Persists to localStorage and best-effort syncs to the Go backend
 * (masterfabric-go) when NEXT_PUBLIC_BACKEND_URL is configured.
 */
export function useRecords() {
  const [records, setRecords] = useState<AnalysisRecord[]>([]);

  useEffect(() => {
    setRecords(loadLocal());
  }, []);

  const addRecord = useCallback((result: AnalysisResult) => {
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

    if (BACKEND_URL) {
      fetch(`${BACKEND_URL}/api/v1/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      }).catch(() => {
        /* backend optional — localStorage is the source of truth in demo */
      });
    }

    return record;
  }, []);

  const clear = useCallback(() => {
    setRecords([]);
    saveLocal([]);
  }, []);

  return { records, addRecord, clear };
}
