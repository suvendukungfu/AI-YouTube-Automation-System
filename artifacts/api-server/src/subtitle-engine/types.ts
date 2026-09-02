export interface SubtitleSegment {
  id: number;
  startSec: number;
  endSec: number;
  text: string;
  confidenceScore?: number;
}

export interface SubtitleGenerationOptions {
  jobId?: number;
  audioFilePath?: string;
  audioDurationSec: number;
  scriptText?: string;
  maxWordsPerCue?: number;
  maxDurationPerCueSec?: number;
  outputDir?: string;
}

export interface SubtitleResult {
  srtPath: string;
  vttPath: string;
  assPath: string;
  segments: SubtitleSegment[];
  cuesCount: number;
  totalDurationSec: number;
  assContent: string;
}

export interface SubtitleProviderHealthCheck {
  healthy: boolean;
  provider: string;
  engine: string;
  supportedFormats: string[];
  latencyMs?: number;
  error?: string;
}

export interface ISubtitleProvider {
  readonly name: string;
  generateSubtitles(options: SubtitleGenerationOptions): Promise<SubtitleSegment[]>;
  checkHealth(): Promise<SubtitleProviderHealthCheck>;
}
