export interface ThumbnailDimensions {
  width: number;
  height: number;
  aspectRatio: string; // "16:9"
}

export interface ThumbnailStyleConfig {
  name: string;
  badgeText: string;
  badgeBgColor: string;
  textColor: string;
  accentColor: string;
  gradientOverlay: string;
  glowEffect: boolean;
}

export interface ThumbnailVariant {
  variantId: string;
  headline: string;
  styleName: string;
  filePath: string;
  fileUrl: string;
  dimensions: ThumbnailDimensions;
  fileSizeBytes: number;
  contrastScore: number;
  wordCountScore: number;
  overallScore: number;
  isPreferred: boolean;
  checksum: string;
}

export interface ThumbnailManifest {
  jobId: number;
  topic: string;
  totalVariants: number;
  preferredVariantId: string;
  preferredThumbnailUrl: string;
  variants: ThumbnailVariant[];
  generatedAt: string;
}

export interface ThumbnailGenerationOptions {
  jobId: number;
  topic: string;
  concepts?: string[];
  backgroundAssetPath?: string;
  outputDir?: string;
}

export interface IThumbnailEngine {
  generateThumbnails(options: ThumbnailGenerationOptions): Promise<ThumbnailManifest>;
}
