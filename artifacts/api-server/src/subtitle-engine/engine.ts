import fs from "node:fs";
import path from "node:path";
import type {
  ISubtitleProvider,
  SubtitleGenerationOptions,
  SubtitleResult,
  SubtitleSegment,
} from "./types";
import { getSubtitleProvider } from "./providers";
import { TimestampValidator } from "./validator";
import type { ProductionJob } from "@workspace/db/schema";
import type { VoiceResult, SubtitlesResult } from "../pipeline/types";
import { ttsSynthesizer } from "../tts-engine/synthesizer";

export interface SubtitleEngineOptions {
  provider?: ISubtitleProvider;
  maxRetries?: number;
}

export class SubtitleEngine {
  private provider: ISubtitleProvider;

  constructor(provider?: ISubtitleProvider) {
    this.provider = provider || getSubtitleProvider();
  }

  /**
   * Generates, validates, and saves timestamped subtitles in SRT, WebVTT, and ASS formats
   */
  async generateSubtitles(
    options: SubtitleGenerationOptions,
    engineOptions?: SubtitleEngineOptions
  ): Promise<SubtitleResult> {
    const activeProvider = engineOptions?.provider || this.provider;
    const maxRetries = engineOptions?.maxRetries ?? 3;

    let segments: SubtitleSegment[] = [];
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        segments = await activeProvider.generateSubtitles(options);
        break;
      } catch (err: any) {
        lastError = err;
        console.warn(`[SubtitleEngine] Attempt ${attempt}/${maxRetries} failed: ${err.message}`);
        if (attempt < maxRetries) {
          await new Promise((res) => setTimeout(res, 200 * attempt));
        }
      }
    }

    if (segments.length === 0 && lastError) {
      throw new Error(`Subtitle generation failed after ${maxRetries} attempts: ${lastError.message}`);
    }

    // Final Timestamp & Overlap Validation Guard
    const validatedSegments = TimestampValidator.validateAndFixTimestamps(
      segments,
      options.audioDurationSec
    );

    // Generate subtitle strings
    const srtContent = TimestampValidator.generateSRT(validatedSegments);
    const vttContent = TimestampValidator.generateWebVTT(validatedSegments);
    const assContent = TimestampValidator.generateASS(
      validatedSegments,
      options.jobId ? `Job #${options.jobId} Subtitles` : "CurioSphere Video"
    );

    // Determine output directory
    const outputDir = options.outputDir
      ? path.resolve(options.outputDir)
      : options.jobId
      ? path.resolve(process.cwd(), `artifacts/media/jobs/${options.jobId}/subtitles`)
      : path.resolve(process.cwd(), "artifacts/media/subtitles");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const srtPath = path.join(outputDir, "subtitles.srt");
    const vttPath = path.join(outputDir, "subtitles.vtt");
    const assPath = path.join(outputDir, "subtitles.ass");

    // Write all formats to disk
    fs.writeFileSync(srtPath, srtContent, "utf-8");
    fs.writeFileSync(vttPath, vttContent, "utf-8");
    fs.writeFileSync(assPath, assContent, "utf-8");

    return {
      srtPath,
      vttPath,
      assPath,
      segments: validatedSegments,
      cuesCount: validatedSegments.length,
      totalDurationSec: options.audioDurationSec,
      assContent,
    };
  }

  /**
   * Generates complete subtitles for a ProductionJob
   */
  async generateJobSubtitles(
    job: ProductionJob,
    voice: VoiceResult,
    script?: any
  ): Promise<SubtitlesResult> {
    const scriptText = script
      ? ttsSynthesizer.compileScriptNarration(script)
      : (job.scriptData as any)
      ? ttsSynthesizer.compileScriptNarration(job.scriptData as any)
      : job.topic;

    const result = await this.generateSubtitles({
      jobId: job.id,
      audioDurationSec: voice.durationSec,
      scriptText,
    });

    return {
      subtitleFormat: "ass",
      cuesCount: result.cuesCount,
      content: result.assContent,
      srtUrl: `/artifacts/media/jobs/${job.id}/subtitles/subtitles.srt`,
      vttUrl: `/artifacts/media/jobs/${job.id}/subtitles/subtitles.vtt`,
      assUrl: `/artifacts/media/jobs/${job.id}/subtitles/subtitles.ass`,
    } as any;
  }
}

export const subtitleEngine = new SubtitleEngine();
