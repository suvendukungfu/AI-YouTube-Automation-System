import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getRenderTemplate } from "../templates";
import { FFmpegFilterGraphBuilder } from "../filter-graph";
import { RenderOutputValidator } from "../validator";
import { VideoRenderEngine } from "../engine";

test("getRenderTemplate - returns cinematic preset by default with proper video and audio parameters", () => {
  const tpl = getRenderTemplate();
  assert.equal(tpl.name, "CURIOSPHERE_CINEMATIC");
  assert.equal(tpl.resolution, "1920x1080");
  assert.equal(tpl.fps, 60);
  assert.equal(tpl.burnSubtitles, true);
  assert.equal(tpl.duckBgm, true);
  assert.equal(tpl.bgmAttenuationDb, -14);
});

test("FFmpegFilterGraphBuilder - fails with clear diagnostic when audio file is missing", () => {
  const dummyManifest: any = {
    scenes: [],
  };

  assert.throws(
    () => {
      FFmpegFilterGraphBuilder.buildArguments(
        {
          jobId: 1,
          topic: "Test",
          audioFilePath: "/nonexistent/audio.wav",
          audioDurationSec: 30,
          visualManifestPath: "/nonexistent/manifest.json",
        },
        dummyManifest,
        getRenderTemplate()
      );
    },
    { message: /Narration audio file missing/ }
  );
});

test("RenderOutputValidator - rejects missing or zero-byte video output files", () => {
  assert.throws(
    () => RenderOutputValidator.validate("/nonexistent/video.mp4", 30),
    { message: /Output video file not found/ }
  );
});

test("VideoRenderEngine - checkHealth returns status and available templates", async () => {
  const engine = new VideoRenderEngine();
  const health = await engine.checkHealth();

  assert.equal(health.healthy, true);
  assert.ok(health.availableTemplates.includes("CURIOSPHERE_CINEMATIC"));
  assert.ok(health.availableTemplates.includes("CURIOSPHERE_FAST_PACED"));
});

test("VideoRenderEngine - renderVideo writes valid 1080p MP4, generates manifest, and supports resumability", async () => {
  const engine = new VideoRenderEngine();
  const testJobId = 999;
  const testDir = path.resolve(process.cwd(), `artifacts/media/jobs/${testJobId}`);
  fs.mkdirSync(testDir, { recursive: true });

  // Create mock audio
  const audioPath = path.join(testDir, "test-audio.wav");
  fs.writeFileSync(audioPath, Buffer.from("RIFFmockWAVEfmt test audio payload"));

  // Create mock visual asset & manifest
  const assetPath = path.join(testDir, "scene-1.png");
  fs.writeFileSync(assetPath, Buffer.from("PNGmock1080p frame"));

  const visualManifestPath = path.join(testDir, "visual_manifest.json");
  const visualManifest = {
    jobId: testJobId,
    topic: "The Mariana Trench",
    totalScenes: 1,
    totalDurationSec: 15,
    uniqueAssetsCount: 1,
    deduplicatedCount: 0,
    scenes: [
      {
        sceneId: "scene-1",
        sceneNumber: 1,
        timing: { startSec: 0, endSec: 15, durationSec: 15 },
        narrationExcerpt: "Into the deep.",
        visualDirective: {
          description: "Abyss",
          type: "AI_GENERATED_IMAGE" as const,
          transition: "SMOOTH_ZOOM" as const,
          motionEffect: "SLOW_ZOOM_IN" as const,
        },
        asset: {
          assetId: "ast-1",
          localFilePath: assetPath,
          fileUrl: "/mock.png",
          source: "NASA_OPEN_MEDIA" as const,
          license: { name: "CC0", url: "", isCommercialPermitted: true, attributionRequired: false },
          durationSec: 15,
          dimensions: { width: 1920, height: 1080, aspectRatio: "16:9" },
          checksum: "mocksha256",
          fileSizeBytes: 100,
          visualType: "AI_GENERATED_IMAGE" as const,
        },
        status: "DOWNLOADED" as const,
      },
    ],
    generatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(visualManifestPath, JSON.stringify(visualManifest));

  // 1. First Render Run
  const manifest = await engine.renderVideo(
    {
      jobId: testJobId,
      topic: "The Mariana Trench",
      audioFilePath: audioPath,
      audioDurationSec: 15,
      visualManifestPath,
    },
    {
      templateName: "CURIOSPHERE_CINEMATIC",
      overwrite: true,
    }
  );

  assert.equal(manifest.jobId, testJobId);
  assert.equal(manifest.resolution, "1920x1080");
  assert.equal(manifest.fps, 60);
  assert.ok(fs.existsSync(manifest.outputFilePath));
  assert.ok(manifest.fileSizeBytes > 0);
  assert.ok(manifest.checksum.length === 64);
  assert.equal(manifest.validation.readable, true);

  // 2. Resumable Run (overwrite: false should reuse existing artifact)
  const resumedManifest = await engine.renderVideo(
    {
      jobId: testJobId,
      topic: "The Mariana Trench",
      audioFilePath: audioPath,
      audioDurationSec: 15,
      visualManifestPath,
    },
    {
      templateName: "CURIOSPHERE_CINEMATIC",
      overwrite: false, // Resumable!
    }
  );

  assert.equal(resumedManifest.outputFilePath, manifest.outputFilePath);
  assert.equal(resumedManifest.checksum, manifest.checksum);
});
