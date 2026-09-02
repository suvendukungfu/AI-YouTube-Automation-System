import fs from "node:fs";
import path from "node:path";
import { subtitleEngine } from "../../artifacts/api-server/src/subtitle-engine/engine";
import { getSubtitleProvider } from "../../artifacts/api-server/src/subtitle-engine/providers";
import { TimestampValidator } from "../../artifacts/api-server/src/subtitle-engine/validator";

async function main() {
  const customTopic = process.argv.slice(2).join(" ").trim();
  const topic = customTopic || "The Mariana Trench";
  const dummyJobId = 202;

  const testNarration = `If you placed Mount Everest at the bottom of the Mariana Trench, its highest peak would still be submerged under more than two kilometers of water. Welcome to CurioSphere. Today, we descend into the deepest geological fracture on Earth. As you leave the sunlit surface, light disappears entirely within two hundred meters. At eleven thousand meters down, the water pressure exceeds one thousand atmospheres. That is equivalent to having the weight of fifty jumbo jets pressing against your chest. Yet, life thrives in the abyss. Specialized organisms produce piezolytes to prevent their cellular membranes from solidifying. We have mapped more of Mars than our own ocean trenches.`;

  const audioDurationSec = 48.5;

  console.log("================================================================================");
  console.log(" 📝 CURIOSPHERE AUTOMATIC SUBTITLE ENGINE (PHASE 6)");
  console.log("================================================================================");
  console.log(`📌 Topic: "${topic}" (Job #${dummyJobId})`);
  console.log(`🎙️ Audio Duration: ${audioDurationSec}s`);
  console.log(`📜 Narration Word Count: ${testNarration.split(/\s+/).length} words\n`);

  const provider = getSubtitleProvider();
  const health = await provider.checkHealth();
  console.log(`🌐 Active Subtitle Provider: [${provider.name}] (${health.engine})`);
  console.log(`📦 Supported Formats: ${health.supportedFormats.join(", ")}`);

  console.log("\n⏳ Generating, timestamping, validating, and formatting subtitles...\n");
  const startTime = Date.now();

  const result = await subtitleEngine.generateSubtitles({
    jobId: dummyJobId,
    audioDurationSec,
    scriptText: testNarration,
    maxWordsPerCue: 7,
  });

  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("================================================================================");
  console.log(`✨ SUBTITLES GENERATED & VALIDATED in ${elapsedSec}s`);
  console.log("================================================================================\n");

  console.log(`📋 SUMMARY:`);
  console.log(`   Total Cues: ${result.cuesCount}`);
  console.log(`   Total Duration: ${result.totalDurationSec}s`);
  console.log(`   SRT File: ${result.srtPath}`);
  console.log(`   WebVTT File: ${result.vttPath}`);
  console.log(`   ASS (Styled) File: ${result.assPath}\n`);

  console.log("⏱️ TIMESTAMPED CUE BREAKDOWN:");
  result.segments.forEach((seg) => {
    const srtTime = `${TimestampValidator.formatSRTTime(seg.startSec)} --> ${TimestampValidator.formatSRTTime(seg.endSec)}`;
    const dur = (seg.endSec - seg.startSec).toFixed(2);
    console.log(`   [Cue #${String(seg.id).padStart(2, "0")}] ${srtTime} (${dur}s) | "${seg.text}"`);
  });

  console.log("\n================================================================================");
  console.log("📄 SAMPLE SRT OUTPUT:");
  console.log("--------------------------------------------------------------------------------");
  const sampleSRT = fs.readFileSync(result.srtPath, "utf-8").split("\n\n").slice(0, 3).join("\n\n");
  console.log(sampleSRT);
  console.log("================================================================================");
  console.log("🎉 Local CurioSphere automatic subtitle generation successful!");
  console.log("================================================================================");
}

main().catch((err) => {
  console.error("❌ Subtitle generation failed:", err.message || err);
  process.exit(1);
});
