import fs from "node:fs";
import path from "node:path";
import { videoRenderEngine } from "../../artifacts/api-server/src/render-engine/engine";
import { visualAssetEngine } from "../../artifacts/api-server/src/visual-engine/engine";
import { subtitleEngine } from "../../artifacts/api-server/src/subtitle-engine/engine";
import { DeterministicMockTTSProvider } from "../../artifacts/api-server/src/tts-engine/providers/deterministic-mock";

async function main() {
  const customTopic = process.argv.slice(2).join(" ").trim();
  const topic = customTopic || "The Mariana Trench";
  const dummyJobId = 505;

  console.log("================================================================================");
  console.log(" 🎥 CURIOSPHERE PRODUCTION VIDEO RENDER ENGINE (PHASE 7)");
  console.log("================================================================================");
  console.log(`📌 Topic: "${topic}" (Job #${dummyJobId})`);

  const health = await videoRenderEngine.checkHealth();
  console.log(`🌐 FFmpeg Status: ${health.ffmpegAvailable ? `Available (${health.ffmpegVersion})` : "Synthetic Pipeline Container"}`);
  console.log(`🎨 Available Templates: ${health.availableTemplates.join(", ")}\n`);

  const baseJobDir = path.resolve(process.cwd(), `artifacts/media/jobs/${dummyJobId}`);
  fs.mkdirSync(baseJobDir, { recursive: true });

  // 1. Synthesize Narration Audio
  console.log("⏳ Step 1/4: Synthesizing master narration audio...");
  const ttsProvider = new DeterministicMockTTSProvider();
  const scriptText = "If you placed Mount Everest at the bottom of the Mariana Trench, its highest peak would still be submerged under more than two kilometers of water. Welcome to CurioSphere.";
  const audioResult = await ttsProvider.synthesize({
    text: scriptText,
    jobId: dummyJobId,
    voice: "en-US-ChristopherNeural",
  });
  console.log(`✅ Audio ready (${audioResult.durationSec}s): ${audioResult.audioFilePath}`);

  // 2. Collect Visual Assets Manifest
  console.log("\n⏳ Step 2/4: Collecting visual assets & manifest...");
  const sampleScript = {
    scenes: [
      {
        sceneNumber: 1,
        heading: "The Ocean Abyss",
        visualPrompt: "Dark ocean water abyss",
        estimatedDurationSec: audioResult.durationSec / 2,
        bRollKeywords: ["deep ocean"],
      },
      {
        sceneNumber: 2,
        heading: "Extreme Pressure",
        visualPrompt: "Submarine in Mariana Trench",
        estimatedDurationSec: audioResult.durationSec / 2,
        bRollKeywords: ["submarine deep sea"],
      },
    ],
  };
  const scenePlans = visualAssetEngine.normalizeScenePlan(sampleScript, sampleScript.scenes, audioResult.durationSec);
  const { manifest: visualManifest } = await visualAssetEngine.collectJobVisuals(
    { id: dummyJobId, topic, targetDurationSeconds: audioResult.durationSec } as any,
    scenePlans
  );
  const visualManifestPath = path.join(baseJobDir, "visual_manifest.json");
  console.log(`✅ Visual Manifest ready (${visualManifest.totalScenes} scenes): ${visualManifestPath}`);

  // 3. Generate Subtitles
  console.log("\n⏳ Step 3/4: Generating timestamped ASS subtitles...");
  const subtitleResult = await subtitleEngine.generateSubtitles({
    jobId: dummyJobId,
    audioDurationSec: audioResult.durationSec,
    scriptText,
  });
  console.log(`✅ Subtitles ready (${subtitleResult.cuesCount} cues): ${subtitleResult.assPath}`);

  // 4. Render Video via FFmpeg Pipeline
  console.log("\n⏳ Step 4/4: Executing 1080p60 FFmpeg video composite...");
  const startTime = Date.now();

  const renderManifest = await videoRenderEngine.renderVideo(
    {
      jobId: dummyJobId,
      topic,
      audioFilePath: audioResult.audioFilePath,
      audioDurationSec: audioResult.durationSec,
      visualManifestPath,
      subtitlesPath: subtitleResult.assPath,
    },
    {
      templateName: "CURIOSPHERE_CINEMATIC",
      overwrite: true,
      onProgress: (p) => {
        process.stdout.write(`\r   Rendering: ${p.percent}% [${p.currentSecond}s / ${p.totalSeconds}s] (${p.fps} fps)`);
      },
    }
  );

  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("\n\n================================================================================");
  console.log(`✨ VIDEO RENDER COMPLETED in ${elapsedSec}s`);
  console.log("================================================================================\n");

  console.log("📋 RENDER MANIFEST SUMMARY:");
  console.log(`   Job ID: #${renderManifest.jobId}`);
  console.log(`   Template: ${renderManifest.templateUsed}`);
  console.log(`   Output File: ${renderManifest.outputFilePath}`);
  console.log(`   Resolution: ${renderManifest.resolution}`);
  console.log(`   Framerate: ${renderManifest.fps} fps`);
  console.log(`   Duration: ${renderManifest.durationSec}s`);
  console.log(`   Video Codec: ${renderManifest.videoCodec}`);
  console.log(`   Audio Codec: ${renderManifest.audioCodec}`);
  console.log(`   Subtitles Burned: ${renderManifest.subtitlesBurned ? "YES" : "NO"}`);
  console.log(`   BGM Ducking Applied: ${renderManifest.bgmDuckingApplied ? "YES" : "NO"}`);
  console.log(`   File Size: ${(renderManifest.fileSizeBytes / 1024).toFixed(2)} KB`);
  console.log(`   SHA-256 Checksum: ${renderManifest.checksum.slice(0, 16)}...`);
  console.log(`   Validation: [Readable: ${renderManifest.validation.readable ? "PASSED" : "FAILED"}] [Duration: ${renderManifest.validation.durationValid ? "PASSED" : "FAILED"}]\n`);

  console.log("================================================================================");
  console.log("🎉 Local CurioSphere video rendering and manifest generation successful!");
  console.log("================================================================================");
}

main().catch((err) => {
  console.error("❌ Video rendering failed:", err.message || err);
  process.exit(1);
});
