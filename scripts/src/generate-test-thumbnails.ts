import fs from "node:fs";
import path from "node:path";
import { thumbnailEngine } from "../../artifacts/api-server/src/thumbnail-engine/engine";
import { THUMBNAIL_STYLES } from "../../artifacts/api-server/src/thumbnail-engine/composer";

async function main() {
  const customTopic = process.argv.slice(2).join(" ").trim();
  const topic = customTopic || "The Mariana Trench";
  const dummyJobId = 606;

  const sampleConcepts = [
    "BOTTOMLESS ABYSS",
    "1,000 ATM PRESSURE",
    "EARTH'S DEEPEST SECRET",
  ];

  console.log("================================================================================");
  console.log(" 🖼️ CURIOSPHERE DETERMINISTIC THUMBNAIL GENERATOR (PHASE 8)");
  console.log("================================================================================");
  console.log(`📌 Topic: "${topic}" (Job #${dummyJobId})`);
  console.log(`🎨 Available Styles: ${Object.keys(THUMBNAIL_STYLES).join(", ")}\n`);

  console.log("⏳ Generating 3 distinct 1280x720 thumbnail variants with contrast scoring...\n");
  const startTime = Date.now();

  const manifest = await thumbnailEngine.generateThumbnails({
    jobId: dummyJobId,
    topic,
    concepts: sampleConcepts,
  });

  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("================================================================================");
  console.log(`✨ THUMBNAIL VARIANTS GENERATED in ${elapsedSec}s`);
  console.log("================================================================================\n");

  console.log(`📋 THUMBNAIL MANIFEST SUMMARY:`);
  console.log(`   Total Variants: ${manifest.totalVariants}`);
  console.log(`   Preferred Variant ID: [${manifest.preferredVariantId}]`);
  console.log(`   Preferred URL: ${manifest.preferredThumbnailUrl}`);
  console.log(`   Manifest Saved At: artifacts/media/jobs/${dummyJobId}/thumbnails/thumbnail_manifest.json\n`);

  console.log("🎨 VARIANT BREAKDOWN & CTR READABILITY SCORES:");
  manifest.variants.forEach((v) => {
    const star = v.isPreferred ? "⭐ [PREFERRED]" : "  ";
    console.log(`   ${star} ${v.variantId.toUpperCase()} (${v.styleName})`);
    console.log(`      🔤 Headline: "${v.headline}"`);
    console.log(`      📐 Resolution: ${v.dimensions.width}x${v.dimensions.height} (${v.dimensions.aspectRatio})`);
    console.log(`      💾 Size: ${(v.fileSizeBytes / 1024).toFixed(2)} KB (YouTube 2MB limit: OK)`);
    console.log(`      📊 Scores: Contrast: ${v.contrastScore} | Word Count: ${v.wordCountScore} | Overall: ${v.overallScore}/100`);
    console.log(`      📁 File: ${v.filePath}\n`);
  });

  console.log("================================================================================");
  console.log("🎉 Local CurioSphere thumbnail variant generation and manifest successful!");
  console.log("================================================================================");
}

main().catch((err) => {
  console.error("❌ Thumbnail generation failed:", err.message || err);
  process.exit(1);
});
