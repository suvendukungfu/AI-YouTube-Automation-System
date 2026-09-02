import type { ProductionJob } from "@workspace/db/schema";

export interface ResearchResult {
  overview: string;
  facts: string[];
  sources: string[];
  coreHook: string;
}

export interface ScriptScene {
  sceneNumber: number;
  heading: string;
  narration: string;
  visualDescription: string;
  estimatedDurationSec: number;
}

export interface ScriptResult {
  hook: string;
  intro: string;
  scenes: ScriptScene[];
  outro: string;
  callToAction: string;
  wordCount: number;
  thumbnailConcepts?: any[];
}

export interface VoiceResult {
  voiceName: string;
  durationSec: number;
  audioUrl: string;
  format: string;
}

export interface BRollClip {
  sceneNumber: number;
  query: string;
  url: string;
  provider: string;
}

export interface AIImagePrompt {
  sceneNumber: number;
  prompt: string;
  url: string;
}

export interface VisualAssetsResult {
  bRollClips: BRollClip[];
  aiImages: AIImagePrompt[];
}

export interface SubtitlesResult {
  subtitleFormat: "vtt" | "srt" | "ass";
  cuesCount: number;
  content: string;
  srtUrl?: string;
  vttUrl?: string;
  assUrl?: string;
}

export interface RenderResult {
  outputUrl: string;
  resolution: string;
  fps: number;
  sizeBytes: number;
  durationSec: number;
}

export interface ThumbnailResult {
  thumbnailUrl: string;
  headline: string;
  contrastScore: number;
}

export interface QACheck {
  name: string;
  status: "PASSED" | "FAILED" | "WARNING";
  details?: string;
}

export interface QAResult {
  passed: boolean;
  checks: QACheck[];
}

export interface IProductionService {
  research(job: ProductionJob): Promise<ResearchResult>;
  generateScript(job: ProductionJob, research: ResearchResult): Promise<ScriptResult>;
  generateVoice(job: ProductionJob, script: ScriptResult): Promise<VoiceResult>;
  collectVisuals(job: ProductionJob, script: ScriptResult): Promise<VisualAssetsResult>;
  generateSubtitles(job: ProductionJob, voice: VoiceResult): Promise<SubtitlesResult>;
  renderVideo(
    job: ProductionJob,
    script: ScriptResult,
    voice: VoiceResult,
    visuals: VisualAssetsResult,
    subtitles: SubtitlesResult
  ): Promise<RenderResult>;
  generateThumbnail(job: ProductionJob, script: ScriptResult): Promise<ThumbnailResult>;
  runQualityChecks(job: ProductionJob, render: RenderResult): Promise<QAResult>;
}
