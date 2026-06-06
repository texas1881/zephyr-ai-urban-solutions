"use client";

import { useState } from "react";
import type { DetectionPoint } from "@/types/api";
import { DetectionCard } from "@/features/detections/DetectionCard";
import { SummaryBar } from "@/features/detections/SummaryBar";
import { AnalyzePanel } from "@/features/analyze/AnalyzePanel";
import { RecordsView } from "@/features/records/RecordsView";
import { useRecords } from "@/features/records/useRecords";
import { DynamicNav, type NavItem } from "@/features/navigation/DynamicNav";
import { ModuleCard } from "@/components/ModuleCard";
import { useAuth } from "@/features/auth/AuthProvider";
import { LoginView } from "@/features/auth/LoginView";

const NAV_ITEMS: NavItem[] = [
  { id: "analiz", label: "Analiz", icon: "⌖" },
  { id: "kayitlar", label: "Kayıtlar", icon: "▦" },
  { id: "pano", label: "Pano", icon: "≡" },
];

export function DashboardShell() {
  const [view, setView] = useState("analiz");
  const { records, addRecord, removeRecord, assignTeam, setStatus, clear } =
    useRecords();
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
      {backendEnabled && user && (
        <div className="mb-4 flex items-center justify-end gap-3 text-xs text-muted">
          <span>
            {user.first_name} {user.last_name}
          </span>
          <button
            onClick={logout}
            className="rounded-lg border border-line px-3 py-1 transition hover:border-danger/50 hover:text-danger"
          >
            Çıkış
          </button>
        </div>
      )}

      <DynamicNav items={NAV_ITEMS} active={view} onChange={setView} />

      <div key={view} className="animate-[fadeIn_0.25s_ease]">
        {view === "analiz" && (
          <ModuleCard
            title="Çevre Analizi"
            subtitle="Adres gir → Street View → yapay zekâ ile çöp/kirlilik tespiti"
            badge="Canlı"
          >
            <AnalyzePanel onAnalyzed={addRecord} onDispatch={assignTeam} />
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
                <span className="text-2xl">🗺️</span>
                <p className="text-sm font-medium text-foreground">
                  Henüz analiz yok
                </p>
                <p className="max-w-sm text-xs text-muted">
                  Analiz sekmesinden bir adres tarayın; sonuçlar burada kirlilik
                  önceliğine göre otomatik sıralanır.
                </p>
                <button
                  onClick={() => setView("analiz")}
                  className="mt-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-primary-soft"
                >
                  Analize başla
                </button>
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
      </div>
    </>
  );
}
