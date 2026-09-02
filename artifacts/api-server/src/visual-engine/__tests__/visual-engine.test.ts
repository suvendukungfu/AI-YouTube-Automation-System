import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DeterministicMockVisualProvider } from "../providers/deterministic-mock";
import { FreeStockVisualProvider } from "../providers/free-stock";
import { VisualAssetEngine } from "../engine";

test("VisualAssetEngine - normalizeScenePlan creates continuous proportional timeline", () => {
  const engine = new VisualAssetEngine();
  const sampleScript = {
    scenes: [
      { sceneNumber: 1, heading: "Intro", narration: "Welcome.", estimatedDurationSec: 30 },
      { sceneNumber: 2, heading: "Middle", narration: "The discovery.", estimatedDurationSec: 60 },
      { sceneNumber: 3, heading: "Conclusion", narration: "Final thoughts.", estimatedDurationSec: 30 },
    ],
  };

  const plans = engine.normalizeScenePlan(sampleScript, undefined, 120);

  assert.equal(plans.length, 3);
  assert.equal(plans[0].startSec, 0);
  assert.equal(plans[0].endSec, 30);
  assert.equal(plans[1].startSec, 30);
  assert.equal(plans[1].endSec, 90);
  assert.equal(plans[2].startSec, 90);
  assert.equal(plans[2].endSec, 120);
  assert.equal(plans[plans.length - 1].endSec, 120);
});

test("DeterministicMockVisualProvider - checkHealth returns permissible catalogs", async () => {
  const provider = new DeterministicMockVisualProvider();
  const health = await provider.checkHealth();

  assert.equal(health.healthy, true);
  assert.ok(health.availableCatalogs.length >= 2);
  assert.ok(health.availableCatalogs.some((c) => c.includes("Public Domain") || c.includes("CC0")));
});

test("DeterministicMockVisualProvider - generates 1080p asset with valid SHA-256 and CC0 license", async () => {
  const provider = new DeterministicMockVisualProvider();
  const testDir = path.resolve(process.cwd(), "artifacts/media/test-visuals");

  const asset = await provider.fetchVisualForScene({
    jobId: 777,
    scenePlan: {
      sceneId: "scene-1",
      sceneNumber: 1,
      startSec: 0,
      endSec: 30,
      durationSec: 30,
      narrationReference: "Descent into abyss.",
      visualDescription: "Deep ocean trench bioluminescent creatures",
      searchQueries: ["mariana trench", "deep sea"],
      visualType: "AI_GENERATED_IMAGE",
      transition: "SMOOTH_ZOOM",
      motionEffect: "SLOW_ZOOM_IN",
    },
    targetDir: testDir,
  });

  assert.ok(fs.existsSync(asset.localFilePath));
  assert.equal(asset.dimensions.width, 1920);
  assert.equal(asset.dimensions.height, 1080);
  assert.equal(asset.dimensions.aspectRatio, "16:9");
  assert.equal(asset.license.isCommercialPermitted, true);
  assert.ok(asset.checksum.length === 64, "Checksum should be valid 64-char SHA-256 hex");
  assert.ok(asset.fileSizeBytes > 0);
});

test("VisualAssetEngine - collectJobVisuals writes manifest with deduplication and verifies integrity", async () => {
  const engine = new VisualAssetEngine(new DeterministicMockVisualProvider());
  const testJob: any = {
    id: 888,
    topic: "The Mariana Trench",
    targetDurationSeconds: 60,
  };

  const scenePlans = [
    {
      sceneId: "scene-1",
      sceneNumber: 1,
      startSec: 0,
      endSec: 30,
      durationSec: 30,
      narrationReference: "Light disappears at 200m.",
      visualDescription: "Deep ocean water fading to dark abyss",
      searchQueries: ["dark ocean"],
      visualType: "B_ROLL_VIDEO" as const,
      transition: "SMOOTH_ZOOM" as const,
      motionEffect: "SLOW_ZOOM_IN" as const,
    },
    {
      sceneId: "scene-2",
      sceneNumber: 2,
      startSec: 30,
      endSec: 60,
      durationSec: 30,
      narrationReference: "Repeated visual test.",
      visualDescription: "Deep ocean water fading to dark abyss", // Identical description to test deduplication!
      searchQueries: ["dark ocean"],
      visualType: "B_ROLL_VIDEO" as const,
      transition: "FADE_TO_BLACK" as const,
      motionEffect: "SLOW_PAN_RIGHT" as const,
    },
  ];

  const { manifest, visualAssetsResult } = await engine.collectJobVisuals(testJob, scenePlans);

  assert.equal(manifest.totalScenes, 2);
  assert.equal(manifest.deduplicatedCount, 1, "Second identical asset should be detected as duplicate");
  assert.equal(manifest.uniqueAssetsCount, 1);
  assert.ok(visualAssetsResult.bRollClips.length >= 1);

  // Validate manifest JSON file was written
  const manifestPath = path.resolve(process.cwd(), `artifacts/media/jobs/${testJob.id}/visual_manifest.json`);
  assert.ok(fs.existsSync(manifestPath));

  // Validate integrity
  const validation = engine.validateManifest(manifest);
  assert.equal(validation.valid, true);
  assert.equal(validation.verifiedCount, 2);
});

test("VisualAssetEngine - validateManifest rejects missing or corrupted assets", () => {
  const engine = new VisualAssetEngine();
  const corruptManifest: any = {
    jobId: 999,
    scenes: [
      {
        sceneId: "scene-fake",
        asset: {
          localFilePath: "/path/to/nonexistent/asset.png",
          checksum: "0000000000000000000000000000000000000000000000000000000000000000",
        },
      },
    ],
  };

  assert.throws(
    () => engine.validateManifest(corruptManifest),
    { message: /asset file missing/ }
  );
});
