import type { DetectionPoint } from "@/types/api";

/**
 * Mock detection data used until the Go backend (masterfabric-go) is wired up.
 * Coordinates are around Başakşehir / İstanbul as a demo region.
 */
export const mockDetections: DetectionPoint[] = [
  {
    id: "d-001",
    location: "Başakşehir, Onurkent Caddesi",
    lat: 41.0935,
    lng: 28.802,
    litterCount: 42,
    densityScore: 91,
    priority: "critical",
    imageRef: "sv-001",
    capturedAt: "2026-06-06T08:10:00Z",
  },
  {
    id: "d-002",
    location: "Kayaşehir, 5. Bölge Parkı",
    lat: 41.114,
    lng: 28.766,
    litterCount: 27,
    densityScore: 68,
    priority: "high",
    imageRef: "sv-002",
    capturedAt: "2026-06-06T08:15:00Z",
  },
  {
    id: "d-003",
    location: "Güvercintepe, İstasyon Sokak",
    lat: 41.075,
    lng: 28.815,
    litterCount: 14,
    densityScore: 44,
    priority: "medium",
    imageRef: "sv-003",
    capturedAt: "2026-06-06T08:20:00Z",
  },
  {
    id: "d-004",
    location: "Şahintepe, Sahil Yolu",
    lat: 41.06,
    lng: 28.79,
    litterCount: 3,
    densityScore: 12,
    priority: "low",
    imageRef: "sv-004",
    capturedAt: "2026-06-06T08:25:00Z",
  },
];
