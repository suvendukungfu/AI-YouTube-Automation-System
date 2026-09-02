import fs from "node:fs";
import path from "node:path";
import type {
  IVideoRenderEngine,
  RenderJobInputs,
  RenderOptions,
  RenderManifest,
  RenderHealthCheck,
} from "./types";
import { getRenderTemplate, RENDER_TEMPLATES } from "./templates";
import { FFmpegFilterGraphBuilder } from "./filter-graph";
import { FFmpegRunner } from "./runner";
import { RenderOutputValidator } from "./validator";
import type { VisualManifest } from "../visual-engine/types";
import type { ProductionJob } from "@workspace/db/schema";
import type {
  ScriptResult,
  VoiceResult,
  VisualAssetsResult,
  SubtitlesResult,
  RenderResult,
} from "../pipeline/types";

export class VideoRenderEngine implements IVideoRenderEngine {
  /**
   * Checks FFmpeg health and available templates
   */
  async checkHealth(): Promise<RenderHealthCheck> {
    const ffmpeg = await FFmpegRunner.isFFmpegAvailable();
    return {
      healthy: true,
      ffmpegAvailable: ffmpeg.available,
      ffmpegVersion: ffmpeg.version,
      hardwareAccelerationAvailable: process.platform === "darwin" || process.platform === "linux",
      availableTemplates: Object.keys(RENDER_TEMPLATES),
    };
  }

  /**
   * Orchestrates complete rendering workflow for a job
   */
  async renderVideo(inputs: RenderJobInputs, options?: RenderOptions): Promise<RenderManifest> {
    const template = getRenderTemplate(options?.templateName);
    const targetFps = options?.fps || template.fps;
    const targetResolution = options?.resolution || template.resolution;

    // Resolve output path: artifacts/media/jobs/{jobId}/rendered/job-{jobId}-1080p.mp4
    const baseJobDir = path.resolve(process.cwd(), `artifacts/media/jobs/${inputs.jobId}`);
    const renderDir = path.join(baseJobDir, "rendered");
    if (!fs.existsSync(renderDir)) {
      fs.mkdirSync(renderDir, { recursive: true });
    }

    const outputFilePath =
      inputs.outputFilePath || path.join(renderDir, `job-${inputs.jobId}-1080p.mp4`);

    // 1. Resumable Rendering Check: reuse valid existing render if overwrite is false
    if (!options?.overwrite && fs.existsSync(outputFilePath) && fs.statSync(outputFilePath).size > 0) {
      console.log(`[VideoRenderEngine] Found existing render artifact for Job #${inputs.jobId}. Reusing.`);
      try {
        const validation = RenderOutputValidator.validate(
          outputFilePath,
          inputs.audioDurationSec,
          targetResolution
        );

        const manifest: RenderManifest = {
          jobId: inputs.jobId,
          topic: inputs.topic,
          outputFilePath,
          fileSizeBytes: validation.fileSizeBytes,
          durationSec: inputs.audioDurationSec,
          resolution: targetResolution,
          fps: targetFps,
          videoCodec: "H.264 (libx264)",
          audioCodec: "AAC (192kbps 48kHz stereo)",
          subtitlesBurned: template.burnSubtitles,
          bgmDuckingApplied: template.duckBgm,
          checksum: validation.checksum,
          templateUsed: template.name,
          renderedAt: new Date().toISOString(),
          validation,
        };

        const manifestPath = path.join(baseJobDir, "render_manifest.json");
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
        return manifest;
      } catch (err) {
        console.warn(`[VideoRenderEngine] Existing artifact was invalid, proceeding with new render:`, err);
      }
    }

    // 2. Load Visual Manifest
    const manifestPath = path.resolve(inputs.visualManifestPath);
    if (!fs.existsSync(manifestPath)) {
      throw new Error(`Render Error: Visual manifest not found at "${manifestPath}"`);
    }
    const visualManifest: VisualManifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

    // 3. Build Safe Filter Graph Arguments Array
    const { args } = FFmpegFilterGraphBuilder.buildArguments(
      inputs,
      visualManifest,
      template,
      options,
      outputFilePath
    );

    // 4. Execute FFmpeg with Progress Reporting
    const result = await FFmpegRunner.runFFmpeg(
      args,
      inputs.audioDurationSec,
      inputs.jobId,
      options?.onProgress,
      outputFilePath
    );

    if (!result.success) {
      throw new Error(`Video rendering execution failed: ${result.stderr || "Unknown FFmpeg error"}`);
    }

    // 5. Validate Rendered Output
    const validation = RenderOutputValidator.validate(
      outputFilePath,
      inputs.audioDurationSec,
      targetResolution
    );

    // 6. Write Render Manifest
    const renderManifest: RenderManifest = {
      jobId: inputs.jobId,
      topic: inputs.topic,
      outputFilePath,
      fileSizeBytes: validation.fileSizeBytes,
      durationSec: inputs.audioDurationSec,
      resolution: targetResolution,
      fps: targetFps,
      videoCodec: "H.264 (libx264)",
      audioCodec: "AAC (192kbps 48kHz stereo)",
      subtitlesBurned: template.burnSubtitles,
      bgmDuckingApplied: template.duckBgm,
      checksum: validation.checksum,
      templateUsed: template.name,
      renderedAt: new Date().toISOString(),
      validation,
    };

    const renderManifestPath = path.join(baseJobDir, "render_manifest.json");
    fs.writeFileSync(renderManifestPath, JSON.stringify(renderManifest, null, 2), "utf-8");

    return renderManifest;
  }

  /**
   * Pipeline helper to render video for a ProductionJob
   */
  async renderJobVideo(
    job: ProductionJob,
    _script: ScriptResult,
    voice: VoiceResult,
    _visuals: VisualAssetsResult,
    subtitles?: SubtitlesResult,
    options?: RenderOptions
  ): Promise<RenderResult> {
    const baseJobDir = path.resolve(process.cwd(), `artifacts/media/jobs/${job.id}`);
    const visualManifestPath = path.join(baseJobDir, "visual_manifest.json");
    const subtitlesPath = subtitles?.assUrl
      ? path.resolve(process.cwd(), subtitles.assUrl.replace(/^\//, ""))
      : path.join(baseJobDir, "subtitles/subtitles.ass");

    const audioPath = voice.audioUrl
      ? path.resolve(process.cwd(), voice.audioUrl.replace(/^\//, ""))
      : path.resolve(process.cwd(), `artifacts/media/audio/job-${job.id}-master.wav`);

    const manifest = await this.renderVideo(
      {
        jobId: job.id,
        topic: job.topic,
        audioFilePath: audioPath,
        audioDurationSec: voice.durationSec,
        visualManifestPath,
        subtitlesPath: fs.existsSync(subtitlesPath) ? subtitlesPath : undefined,
      },
      options
    );

    return {
      outputUrl: `/artifacts/media/jobs/${job.id}/rendered/job-${job.id}-1080p.mp4`,
      resolution: `${manifest.resolution} (16:9 Full HD)`,
      fps: manifest.fps,
      sizeBytes: manifest.fileSizeBytes,
      durationSec: manifest.durationSec,
    };
  }
}

export const videoRenderEngine = new VideoRenderEngine();
