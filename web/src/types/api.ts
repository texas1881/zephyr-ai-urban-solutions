export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  message: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type PriorityLevel = "low" | "medium" | "high" | "critical";

export type DetectionPoint = {
  id: string;
  /** Human-readable location label (neighborhood / street). */
  location: string;
  lat: number;
  lng: number;
  /** Number of litter / pollution objects detected in the image. */
  litterCount: number;
  /** Normalized garbage density score in the 0-100 range. */
  densityScore: number;
  priority: PriorityLevel;
  /** Street View image reference used for the detection. */
  imageRef: string;
  capturedAt: string;
};

import type { Severity, SituationType } from "@/features/analyze/situations";
import type { DirectionDetectionOverlay } from "@/features/detections/detectionOverlayUtils";

export type DetectedObject = {
  label: string;
  score: number;
};

/** A single detected field situation (litter, road damage, ...). */
export type DetectedSituation = {
  type: SituationType;
  severity: Severity;
  confidence: number;
  description: string;
  direction: string;
  /** Suggested concrete action for this specific finding (optional). */
  recommendedAction?: string;
  /** Where in the frame the issue appears (e.g. "kaldırım kenarı"). */
  location?: string;
};

/** Overall safety risk inferred from the detected situations. */
export type SafetyRisk = "dusuk" | "orta" | "yuksek";

/** Dispatch status of a record. */
export type DispatchStatus = "pending" | "assigned" | "resolved";

/** Authenticated user as returned by the masterfabric-go IAM. */
export type AuthUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  status: string;
  created_at: string;
};

/** Response of POST /api/v1/auth/login. */
export type LoginResponse = {
  token: string;
  user: AuthUser;
};

/** An object/category with how many times it appears (Turkish label). */
export type LabeledCount = {
  label: string;
  count: number;
};

/** One scanned Street View direction with its proxied image URL. */
export type DirectionImage = {
  /** ön | arka | sağ | sol */
  label: string;
  heading: number;
  url: string;
};

/** Result returned by GET /api/analyze for a single location/address. */
export type AnalysisResult = {
  address: string;
  lat: number;
  lng: number;
  litterCount: number;
  densityScore: number;
  priority: PriorityLevel;
  /** Local proxy path for the front Street View image of this location. */
  streetViewUrl: string;
  /** The four scanned directions (front/right/back/left) with images. */
  directionImages: DirectionImage[];
  /** Litter / waste items found (Turkish labels). */
  litterItems: LabeledCount[];
  /** Context items (people, vehicles, furniture) — NOT pollution. */
  contextItems: LabeledCount[];
  /** Flattened object list (kept for record statistics). */
  objects: DetectedObject[];
  /** Number of directions scanned (front/right/back/left). */
  directionsScanned: number;
  /** 360° panorama frames sent to AI (8×45°). */
  panoramaFrames?: number;
  /** Temiz | Orta | Kirli */
  cleanliness: string;
  /** Short natural-language assessment (one line). */
  assessment: string;
  /** Comprehensive AI commentary/report (HF → local). */
  aiReport: string;
  /** Which engine produced the comprehensive report. */
  reportEngine: "hf" | "local";
  /** Short note on urban order / tidiness (şehir düzeni). */
  cityOrder: string;
  /** True when the assessment was AI-generated. */
  aiAssessment: boolean;
  /** Which engine produced the analysis. */
  analysisModel:
    | "hf-multi-agent"
    | "hf-detection-llm"
    | "hf-vision"
    | "object-detection";
  /** Detected field situations (litter / road damage / ...). */
  situations: DetectedSituation[];
  /** Overall safety/urgency risk inferred from the situations. */
  safetyRisk: SafetyRisk;
  /** Suggested municipal team(s) — combined display string. */
  recommendedTeam: string;
  /** All required teams when multiple issue types exist. */
  recommendedTeams?: string[];
  /** Street View capture resolution used for analysis. */
  imageSize?: string;
  /** Yön bazlı OWL/DETR bounding box overlay'leri (UI çerçevesi). */
  detectionOverlays?: DirectionDetectionOverlay[];
  /** Dispatch status. */
  status: DispatchStatus;
  /** Team the record has been dispatched to (when assigned). */
  assignedTeam: string;
};

/** A persisted analysis (data accumulation). */
export type AnalysisRecord = AnalysisResult & {
  id: string;
  createdAt: string;
};
