"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  AnalysisRecord,
  AnalysisResult,
  DispatchStatus,
} from "@/types/api";
import {
  apiFireAndForget,
  apiRequest,
  getToken,
  hasBackend,
} from "@/services/apiClient";

const STORAGE_KEY = "zephyr.records.v1";

/** Backend kaydı — eksik alanlar UI'da varsayılanla doldurulur */
type BackendRecord = Partial<AnalysisRecord> & {
  id: string;
  address: string;
  createdAt?: string;
};

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
    /* storage full / unavailable */
  }
}

function mapBackendRecord(r: BackendRecord): AnalysisRecord {
  const createdAt =
    typeof r.createdAt === "string"
      ? r.createdAt
      : new Date().toISOString();

  return {
    address: r.address,
    lat: r.lat ?? 0,
    lng: r.lng ?? 0,
    litterCount: r.litterCount ?? 0,
    densityScore: r.densityScore ?? 0,
    priority: r.priority ?? "low",
    streetViewUrl: r.streetViewUrl ?? "",
    directionImages: r.directionImages ?? [],
    litterItems: r.litterItems ?? [],
    contextItems: r.contextItems ?? [],
    objects: r.objects ?? [],
    directionsScanned: r.directionsScanned ?? 4,
    panoramaFrames: r.panoramaFrames,
    cleanliness: r.cleanliness ?? "Temiz",
    assessment: r.assessment ?? r.address,
    aiReport: r.aiReport ?? "",
    reportEngine: r.reportEngine ?? "local",
    cityOrder: r.cityOrder ?? "",
    aiAssessment: r.aiAssessment ?? true,
    analysisModel: r.analysisModel ?? "hf-multi-agent",
    situations: r.situations ?? [],
    safetyRisk: r.safetyRisk ?? "dusuk",
    recommendedTeam: r.recommendedTeam ?? "—",
    recommendedTeams: r.recommendedTeams,
    imageSize: r.imageSize,
    detectionOverlays: r.detectionOverlays,
    status: (r.status as DispatchStatus) ?? "pending",
    assignedTeam: r.assignedTeam ?? "",
    id: r.id,
    createdAt,
  };
}

function mergeRecords(
  local: AnalysisRecord[],
  remote: AnalysisRecord[],
): AnalysisRecord[] {
  const byId = new Map<string, AnalysisRecord>();
  for (const r of remote) byId.set(r.id, r);
  for (const r of local) {
    if (!byId.has(r.id)) byId.set(r.id, r);
  }
  return [...byId.values()].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/**
 * Data-accumulation store for analyses.
 * Persists to localStorage and syncs with masterfabric-go backend when configured.
 */
export function useRecords() {
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    const local = loadLocal();
    setRecords(local);

    if (!hasBackend() || !getToken()) return;

    apiRequest<BackendRecord[]>("/api/v1/cleanliness/records")
      .then((remote) => {
        const mapped = remote.map(mapBackendRecord);
        const merged = mergeRecords(local, mapped).slice(0, 100);
        setRecords(merged);
        saveLocal(merged);
        setSyncError(null);
      })
      .catch((err) => {
        if (process.env.NODE_ENV === "development") {
          console.warn("[zephyr] records load failed:", err);
        }
      });
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

    apiFireAndForget(
      "/api/v1/cleanliness/records",
      { method: "POST", body: record },
      () => setSyncError("Kayıt sunucuya yazılamadı — yalnızca yerel saklandı."),
    );

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

  return {
    records,
    syncError,
    addRecord,
    removeRecord,
    assignTeam,
    setStatus,
    clear,
  };
}
