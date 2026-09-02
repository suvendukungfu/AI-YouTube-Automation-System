import fs from "node:fs";
import path from "node:path";
import { visualAssetEngine } from "../../artifacts/api-server/src/visual-engine/engine";
import { getVisualProvider } from "../../artifacts/api-server/src/visual-engine/providers";

async function main() {
  const customTopic = process.argv.slice(2).join(" ").trim();
  const topic = customTopic || "The Mariana Trench";
  const dummyJobId = 101;

  const sampleScript = {
    hook: `If you placed Mount Everest at the bottom of ${topic}, its peak would still be submerged.`,
    intro: `Welcome to CurioSphere. Today, we descend into the hadal zone.`,
    scenes: [
      {
        sceneNumber: 1,
        heading: "The Descent into Midnight",
        narration: "As you leave the sunlit surface, light disappears entirely within two hundred meters.",
        visualPrompt: "Cinematic shot of ocean water fading from brilliant sunlight into absolute obsidian black abyss, 8k, volumetric light beams dissipating.",
        bRollKeywords: ["deep ocean dark water", "submersible diving", "sunlight underwater fading"],
        visualType: "B_ROLL_VIDEO" as const,
        transitionEffect: "SMOOTH_ZOOM" as const,
        motionEffect: "SLOW_ZOOM_IN" as const,
        durationSeconds: 30,
        onScreenText: "DEPTH: 200m - THE TWILIGHT ZONE",
      },
      {
        sceneNumber: 2,
        heading: "Crushing Pressure & Alien Biology",
        narration: "At eleven thousand meters down, the water pressure reaches over one thousand times atmospheric pressure.",
        visualPrompt: "3D cross-section diagram of bathymetric depth vectors showing pressure crushing forces at 11,000 meters.",
        bRollKeywords: ["deep sea submarine", "bathymetric sonar", "hadal snailfish macro"],
        visualType: "AI_GENERATED_IMAGE" as const,
        transitionEffect: "CROSS_DISSOLVE" as const,
        motionEffect: "SLOW_PAN_RIGHT" as const,
        durationSeconds: 45,
        onScreenText: "PRESSURE: 1,086 ATM",
      },
      {
        sceneNumber: 3,
        heading: "Hydrothermal Monsters & Chemosynthesis",
        narration: "Near the seabed, hydrothermal chimneys spew mineral-rich water heated to four hundred degrees Celsius.",
        visualPrompt: "Submersible headlights illuminating active black smoker hydrothermal chimneys with billowing iridescent chemical clouds.",
        bRollKeywords: ["hydrothermal vent", "underwater volcano", "black smoker seabed"],
        visualType: "B_ROLL_VIDEO" as const,
        transitionEffect: "WHIP_PAN" as const,
        motionEffect: "DYNAMIC_TILT" as const,
        durationSeconds: 45,
        onScreenText: "HYDROTHERMAL VENTS: 400°C",
      },
      {
        sceneNumber: 4,
        heading: "The Uncharted Frontier",
        narration: "We have mapped more of the surface of Mars than we have mapped of our own ocean trenches.",
        visualPrompt: "Split screen comparing topographic relief maps of Mars versus unexplored blue bathymetric contours of Earth's trenches.",
        bRollKeywords: ["mars topography", "ocean floor sonar map", "earth from space"],
        visualType: "AI_GENERATED_IMAGE" as const,
        transitionEffect: "FADE_TO_BLACK" as const,
        motionEffect: "PARALLAX_FLOAT" as const,
        durationSeconds: 35,
        onScreenText: "UNEXPLORED PLANET",
      },
    ],
  };

  console.log("================================================================================");
  console.log(" 🎬 CURIOSPHERE VISUAL ASSET ENGINE (PHASE 5)");
  console.log("================================================================================");
  console.log(`📌 Topic: "${topic}" (Job #${dummyJobId})`);

  const provider = getVisualProvider();
  const health = await provider.checkHealth();
  console.log(`🌐 Active Visual Provider: [${provider.name}]`);
  console.log(`📦 Available Catalogs: ${health.availableCatalogs.join(", ")}`);

  console.log("\n⏳ Normalizing scene timeline and proportional durations...");
  const scenePlans = visualAssetEngine.normalizeScenePlan(sampleScript, sampleScript.scenes, 180);

  console.log(`✅ Normalized ${scenePlans.length} scenes over 180s timeline.`);

  console.log("\n⏳ Fetching, hashing, deduplicating, and compiling asset manifest...\n");
  const startTime = Date.now();

  const dummyJob: any = {
    id: dummyJobId,
    topic,
    targetDurationSeconds: 180,
  };

  const { manifest } = await visualAssetEngine.collectJobVisuals(dummyJob, scenePlans);
  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("================================================================================");
  console.log(`✨ ASSET COLLECTION COMPLETED in ${elapsedSec}s`);
  console.log("================================================================================\n");

  console.log(`📋 MANIFEST SUMMARY:`);
  console.log(`   Total Scenes: ${manifest.totalScenes}`);
  console.log(`   Total Duration: ${manifest.totalDurationSec}s`);
  console.log(`   Unique Media Files: ${manifest.uniqueAssetsCount}`);
  console.log(`   Deduplicated Assets: ${manifest.deduplicatedCount}`);
  console.log(`   Manifest Saved At: artifacts/media/jobs/${dummyJobId}/visual_manifest.json\n`);

  console.log("🖼️ SCENE ASSET BREAKDOWN & LICENSING:");
  manifest.scenes.forEach((entry) => {
    console.log(`   ┌── Scene ${entry.sceneNumber} (${entry.timing.startSec}s - ${entry.timing.endSec}s) [${entry.visualDirective.transition} | ${entry.visualDirective.motionEffect}]`);
    console.log(`   │   🎨 Directive: ${entry.visualDirective.description.slice(0, 75)}...`);
    if (entry.visualDirective.onScreenText) {
      console.log(`   │   🔤 Overlay: [${entry.visualDirective.onScreenText}]`);
    }
    console.log(`   │   📁 File: ${entry.asset.localFilePath}`);
    console.log(`   │   📐 Dimensions: ${entry.asset.dimensions.width}x${entry.asset.dimensions.height} (${entry.asset.dimensions.aspectRatio})`);
    console.log(`   │   💾 Size: ${(entry.asset.fileSizeBytes / 1024).toFixed(2)} KB`);
    console.log(`   │   🔒 SHA-256: ${entry.asset.checksum.slice(0, 16)}...`);
    console.log(`   │   📜 Source & License: ${entry.asset.source} - ${entry.asset.license.name} (Commercial: ${entry.asset.license.isCommercialPermitted ? 'YES' : 'NO'})`);
    console.log(`   └──\n`);
  });

  console.log("================================================================================");
  console.log("🎉 Local CurioSphere visual asset collection and manifest generation successful!");
  console.log("================================================================================");
}

main().catch((err) => {
  console.error("❌ Visual collection failed:", err.message || err);
  process.exit(1);
});
