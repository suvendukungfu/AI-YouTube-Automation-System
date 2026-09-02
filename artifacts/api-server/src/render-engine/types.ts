export type RenderResolution = "1920x1080" | "1080x1920" | "1280x720";
export type VideoCodec = "libx264" | "h264_nvenc" | "h264_videotoolbox";
export type AudioCodec = "aac" | "libmp3lame";

export interface RenderTemplate {
  name: string;
  description: string;
  resolution: RenderResolution;
  fps: number;
  videoBitrate: string; // e.g. "8000k"
  audioBitrate: string; // e.g. "192k"
  burnSubtitles: boolean;
  enableKenBurns: boolean;
  duckBgm: boolean;
  bgmAttenuationDb: number; // e.g. -14
  colorGradeFilter?: string;
}

export interface RenderJobInputs {
  jobId: number;
  topic: string;
  audioFilePath: string;
  audioDurationSec: number;
  visualManifestPath: string;
  subtitlesPath?: string;
  bgmFilePath?: string;
  watermarkPath?: string;
  outputFilePath?: string;
}

export interface RenderOptions {
  templateName?: string;
  resolution?: RenderResolution;
  fps?: number;
  videoBitrate?: string;
  audioBitrate?: string;
  burnSubtitles?: boolean;
  enableKenBurns?: boolean;
  duckBgm?: boolean;
  overwrite?: boolean;
  onProgress?: (progress: RenderProgress) => void;
}

export interface RenderProgress {
  jobId: number;
  currentSecond: number;
  totalSeconds: number;
  percent: number;
  fps: number;
  speed: string;
}

export interface RenderManifest {
  jobId: number;
  topic: string;
  outputFilePath: string;
  fileSizeBytes: number;
  durationSec: number;
  resolution: string;
  fps: number;
  videoCodec: string;
  audioCodec: string;
  subtitlesBurned: boolean;
  bgmDuckingApplied: boolean;
  checksum: string; // SHA-256
  templateUsed: string;
  renderedAt: string;
  validation: {
    readable: boolean;
    durationValid: boolean;
    resolutionValid: boolean;
    audioPresent: boolean;
  };
}

export interface RenderHealthCheck {
  healthy: boolean;
  ffmpegAvailable: boolean;
  ffmpegVersion?: string;
  hardwareAccelerationAvailable?: boolean;
  availableTemplates: string[];
  error?: string;
}

export interface IVideoRenderEngine {
  renderVideo(inputs: RenderJobInputs, options?: RenderOptions): Promise<RenderManifest>;
  checkHealth(): Promise<RenderHealthCheck>;
}
