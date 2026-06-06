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

export type DetectedObject = {
  label: string;
  score: number;
};

/** Result returned by GET /api/analyze for a single location/address. */
export type AnalysisResult = {
  address: string;
  lat: number;
  lng: number;
  litterCount: number;
  densityScore: number;
  priority: PriorityLevel;
  /** Local proxy path for the Street View image of this location. */
  streetViewUrl: string;
  objects: DetectedObject[];
};

/** A persisted analysis (data accumulation). */
export type AnalysisRecord = AnalysisResult & {
  id: string;
  createdAt: string;
};
