export type VisualType = "B_ROLL_VIDEO" | "AI_GENERATED_IMAGE" | "INFOGRAPHIC_OVERLAY" | "MOTION_GRAPHIC";
export type TransitionType = "CROSS_DISSOLVE" | "WHIP_PAN" | "FADE_TO_BLACK" | "SMOOTH_ZOOM" | "CUT";
export type MotionEffect = "SLOW_ZOOM_IN" | "SLOW_PAN_RIGHT" | "DYNAMIC_TILT" | "PARALLAX_FLOAT" | "STATIC";
export type AssetSource = "PEXELS" | "PIXABAY" | "WIKIMEDIA_COMMONS" | "NASA_OPEN_MEDIA" | "LOCAL_SYNTHESIS";

export interface AssetLicense {
  name: string;
  url: string;
  isCommercialPermitted: boolean;
  attributionRequired: boolean;
  author?: string;
  sourceUrl?: string;
}

export interface AssetDimensions {
  width: number;
  height: number;
  aspectRatio: string; // e.g. "16:9"
}

export interface SceneVisualPlan {
  sceneId: string;
  sceneNumber: number;
  startSec: number;
  endSec: number;
  durationSec: number;
  narrationReference: string;
  visualDescription: string;
  searchQueries: string[];
  visualType: VisualType;
  transition: TransitionType;
  motionEffect: MotionEffect;
  onScreenText?: string;
}

export interface VisualAsset {
  assetId: string;
  localFilePath: string;
  fileUrl: string;
  source: AssetSource;
  license: AssetLicense;
  durationSec: number;
  dimensions: AssetDimensions;
  checksum: string; // SHA-256
  fileSizeBytes: number;
  visualType: VisualType;
  isDeduplicated?: boolean;
}

export interface ManifestSceneEntry {
  sceneId: string;
  sceneNumber: number;
  timing: {
    startSec: number;
    endSec: number;
    durationSec: number;
  };
  narrationExcerpt: string;
  visualDirective: {
    description: string;
    type: VisualType;
    transition: TransitionType;
    motionEffect: MotionEffect;
    onScreenText?: string;
  };
  asset: VisualAsset;
  status: "DOWNLOADED" | "CACHED" | "VERIFIED" | "FALLBACK";
}

export interface VisualManifest {
  jobId: number;
  topic: string;
  totalScenes: number;
  totalDurationSec: number;
  uniqueAssetsCount: number;
  deduplicatedCount: number;
  scenes: ManifestSceneEntry[];
  generatedAt: string;
}

export interface VisualFetchRequest {
  jobId: number;
  scenePlan: SceneVisualPlan;
  targetDir: string;
  retryAttempt?: number;
}

export interface VisualCandidate {
  id: string;
  previewUrl: string;
  downloadUrl: string;
  source: AssetSource;
  license: AssetLicense;
  dimensions: AssetDimensions;
  durationSec?: number;
  tags: string[];
}

export interface VisualProviderHealthCheck {
  healthy: boolean;
  provider: string;
  engine: string;
  availableCatalogs: string[];
  latencyMs?: number;
  error?: string;
}

export interface IVisualProvider {
  readonly name: string;
  fetchVisualForScene(request: VisualFetchRequest): Promise<VisualAsset>;
  searchAssets(query: string, type: "video" | "image"): Promise<VisualCandidate[]>;
  checkHealth(): Promise<VisualProviderHealthCheck>;
}
