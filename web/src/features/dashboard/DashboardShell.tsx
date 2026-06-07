"use client";

import { useCallback, useRef, useState } from "react";
import { ViewPanel } from "@/components/layout/ViewPanel";
import { ModuleCard, type ModuleBadgeState } from "@/components/ModuleCard";
import { SpringPress } from "@/components/motion/SpringPress";
import { LiveToast, type ToastState } from "@/components/ui/LiveToast";
import { LogOut, MapPinned } from "lucide-react";
import type { DetectionPoint } from "@/types/api";
import { DetectionCard } from "@/features/detections/DetectionCard";
import { SummaryBar } from "@/features/detections/SummaryBar";
import { AnalyzePanel } from "@/features/analyze/AnalyzePanel";
import { RecordsView } from "@/features/records/RecordsView";
import { useRecords } from "@/features/records/useRecords";
import type { AnalysisUiState } from "@/features/analyze/AnalyzePanel";
import { useAuth } from "@/features/auth/AuthProvider";
import { LoginView } from "@/features/auth/LoginView";
import type { NavSignal } from "./HomeShell";

type RecordsStore = ReturnType<typeof useRecords>;

type Props = {
  view: string;
  tabDirection?: number;
  onViewChange: (id: string) => void;
  onNavSignal?: (signal: NavSignal) => void;
  recordsStore: RecordsStore;
};

export function DashboardShell({
  view,
  tabDirection = 1,
  onViewChange,
  onNavSignal,
  recordsStore,
}: Props) {
  const [analyzeBadge, setAnalyzeBadge] = useState<ModuleBadgeState>("live");
  const [toast, setToast] = useState<ToastState>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAnalyzeUi = useCallback((state: AnalysisUiState) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setAnalyzeBadge(state);

    if (state === "loading") {
      setToast({ kind: "loading", message: "Analiz sürüyor…" });
      return;
    }

    if (state === "success") {
      setToast({ kind: "success", message: "Başarılı — analiz tamamlandı" });
      toastTimer.current = setTimeout(() => {
        setToast(null);
        setAnalyzeBadge("live");
      }, 3000);
      return;
    }

    setToast(null);
  }, []);

  const { records, addRecord, removeRecord, assignTeam, setStatus, clear } =
    recordsStore;
  const { user, loading, backendEnabled, logout } = useAuth();

  // Priority board is driven by the REAL accumulated analysis records
  // (most polluted first), not static demo data.
  const detections: DetectionPoint[] = records
    .map((r) => ({
      id: r.id,
      location: r.address,
      lat: r.lat,
      lng: r.lng,
      litterCount: r.litterCount,
      densityScore: r.densityScore,
      priority: r.priority,
      imageRef: r.streetViewUrl,
      capturedAt: r.createdAt,
    }))
    .sort((a, b) => b.densityScore - a.densityScore);

  // Auth gating: only enforced when a backend URL is configured.
  if (backendEnabled) {
    if (loading) {
      return (
        <div className="py-20 text-center text-sm text-muted">
          Oturum doğrulanıyor…
        </div>
      );
    }
    if (!user) {
      return <LoginView />;
    }
  }

  return (
    <>
      <LiveToast toast={toast} />

      {backendEnabled && user && (
        <div className="mb-4 flex items-center justify-end gap-3 text-xs text-muted">
          <span>
            {user.first_name} {user.last_name}
          </span>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1 transition hover:border-danger/50 hover:text-danger"
          >
            <LogOut size={13} />
            Çıkış
          </button>
        </div>
      )}

      <ViewPanel viewKey={view} direction={tabDirection}>
          {view === "analiz" && (
            <ModuleCard
              title="Çevre Analizi"
              subtitle="Adres gir → Street View → yapay zekâ ile çöp/kirlilik tespiti"
              badgeState={analyzeBadge}
            >
              <AnalyzePanel
                onAnalyzed={addRecord}
                onDispatch={assignTeam}
                onNavSignal={onNavSignal}
                onUiState={handleAnalyzeUi}
              />
            </ModuleCard>
          )}

          {view === "kayitlar" && (
            <ModuleCard
              title="Veri Birikimi"
              subtitle="Yapılan analizlerin geçmişi ve toplu istatistikleri"
              badge={`${records.length} kayıt`}
            >
              <RecordsView
                records={records}
                onClear={clear}
                onRemove={removeRecord}
                onAssign={assignTeam}
                onResolve={(id) => setStatus(id, "resolved")}
              />
            </ModuleCard>
          )}

          {view === "pano" && (
            <ModuleCard
              title="Temizlik Öncelik Panosu"
              subtitle="Yapılan analizler, kirlilik yoğunluğuna göre sıralı"
              badge={`${detections.length} bölge`}
            >
              {detections.length === 0 ? (
                <div className="glass flex flex-col items-center gap-2 rounded-2xl px-6 py-12 text-center">
                  <MapPinned size={30} className="text-muted" strokeWidth={1.6} />
                  <p className="text-sm font-medium text-foreground">
                    Henüz analiz yok
                  </p>
                  <p className="max-w-sm text-xs text-muted">
                    Analiz sekmesinden bir adres tarayın; sonuçlar burada
                    kirlilik önceliğine göre otomatik sıralanır.
                  </p>
                  <SpringPress
                    onClick={() => onViewChange("analiz")}
                    className="btn-primary mt-2 rounded-xl px-4 py-2 text-sm"
                  >
                    Analize başla
                  </SpringPress>
                </div>
              ) : (
                <>
                  <div className="mb-5">
                    <SummaryBar detections={detections} />
                  </div>
                  <ul className="flex flex-col gap-3">
                    {detections.map((detection, index) => (
                      <DetectionCard
                        key={detection.id}
                        detection={detection}
                        rank={index + 1}
                      />
                    ))}
                  </ul>
                </>
              )}
            </ModuleCard>
          )}
      </ViewPanel>
    </>
  );
}
