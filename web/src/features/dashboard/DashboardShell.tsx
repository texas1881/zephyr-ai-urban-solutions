"use client";

import { useState } from "react";
import { mockDetections } from "@/features/detections/mockData";
import { DetectionCard } from "@/features/detections/DetectionCard";
import { SummaryBar } from "@/features/detections/SummaryBar";
import { AnalyzePanel } from "@/features/analyze/AnalyzePanel";
import { RecordsView } from "@/features/records/RecordsView";
import { useRecords } from "@/features/records/useRecords";
import { DynamicNav, type NavItem } from "@/features/navigation/DynamicNav";
import { ModuleCard } from "@/components/ModuleCard";

const NAV_ITEMS: NavItem[] = [
  { id: "analiz", label: "Analiz", icon: "⌖" },
  { id: "kayitlar", label: "Kayıtlar", icon: "▦" },
  { id: "pano", label: "Pano", icon: "≡" },
];

export function DashboardShell() {
  const [view, setView] = useState("analiz");
  const { records, addRecord, clear } = useRecords();

  const detections = [...mockDetections].sort(
    (a, b) => b.densityScore - a.densityScore,
  );

  return (
    <div className="flex flex-col gap-8">
      <DynamicNav items={NAV_ITEMS} active={view} onChange={setView} />

      <div key={view} className="animate-[fadeIn_0.25s_ease]">
        {view === "analiz" && (
          <ModuleCard
            title="Çevre Analizi"
            subtitle="Adres gir → Street View → yapay zekâ ile çöp/kirlilik tespiti"
            badge="Canlı"
          >
            <AnalyzePanel onAnalyzed={addRecord} />
          </ModuleCard>
        )}

        {view === "kayitlar" && (
          <ModuleCard
            title="Veri Birikimi"
            subtitle="Yapılan analizlerin geçmişi ve toplu istatistikleri"
            badge={`${records.length} kayıt`}
          >
            <RecordsView records={records} onClear={clear} />
          </ModuleCard>
        )}

        {view === "pano" && (
          <ModuleCard
            title="Temizlik Öncelik Panosu"
            subtitle="Çöp yoğunluğuna göre sıralı bölgeler"
            badge={`${detections.length} bölge`}
          >
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
          </ModuleCard>
        )}
      </div>
    </div>
  );
}
