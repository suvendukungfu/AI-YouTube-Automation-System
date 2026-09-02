import { pipelineOrchestrator } from "../../artifacts/api-server/src/pipeline/orchestrator";
import { ProductionRequestParser } from "../../artifacts/api-server/src/pipeline/request-parser";

async function main() {
  const args = process.argv.slice(2);
  let requestString = "Make today's video.";

  // Check if --request flag was provided
  const requestFlagIdx = args.indexOf("--request");
  if (requestFlagIdx !== -1 && args[requestFlagIdx + 1]) {
    requestString = args.slice(requestFlagIdx + 1).join(" ");
  } else if (args.length > 0) {
    requestString = args.join(" ");
  }

  console.log("================================================================================");
  console.log(" 🎬 CURIOSPHERE UNIFIED VIDEO PRODUCTION PIPELINE (PHASE 10)");
  console.log("================================================================================");
  console.log(`💬 Input Command: "${requestString}"\n`);

  const parsed = ProductionRequestParser.parse(requestString);
  console.log(`📋 RESOLVED PRODUCTION SPECIFICATIONS:`);
  console.log(`   Channel: ${parsed.channel}`);
  console.log(`   Topic: ${parsed.topic || "[AUTONOMOUS SELECTION]"}`);
  console.log(`   Format: ${parsed.format}`);
  console.log(`   Target Duration: ${parsed.durationSeconds}s (${(parsed.durationSeconds / 60).toFixed(1)} mins)`);
  console.log(`   Tone & Style: ${parsed.tone} | ${parsed.style}`);
  console.log(`   Publish Mode: ${parsed.publishMode}`);
  if (parsed.publishAt) {
    console.log(`   Scheduled Publish At: ${parsed.publishAt}`);
  }
  console.log("--------------------------------------------------------------------------------\n");

  console.log("🚀 EXECUTING 10-STEP PIPELINE:\n");
  const startTime = Date.now();

  const result = await pipelineOrchestrator.execute(parsed, (step, total, msg) => {
    console.log(`   [${step}/${total}] ${msg}`);
  });

  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("\n================================================================================");
  if (result.status === "COMPLETED") {
    console.log(`✨ PRODUCTION PIPELINE COMPLETED SUCCESSFULLY in ${elapsedSec}s`);
    console.log("================================================================================\n");

    console.log(`📦 FINAL CURIOSPHERE VIDEO PACKAGE (Job #${result.jobId}):`);
    console.log(`   📌 Topic: "${result.topic}"`);
    console.log(`   🎙️ Audio Duration: ${result.stageResults.voice?.durationSec}s`);
    console.log(`   🎨 Visual Scenes: ${result.stageResults.visuals?.bRollClips?.length} CC0 assets collected`);
    console.log(`   📝 Subtitles: ${result.stageResults.subtitles?.cuesCount} segments (SRT, WebVTT, ASS)`);
    console.log(`   🎥 Rendered Video: ${result.stageResults.render?.outputUrl} (${result.stageResults.render?.resolution} @ ${result.stageResults.render?.fps}fps)`);
    console.log(`   🖼️ Preferred Thumbnail: ${result.stageResults.thumbnail?.thumbnailUrl} (Contrast Score: ${result.stageResults.thumbnail?.contrastScore})`);
    console.log(`   🛡️ Broadcast QA: ${result.stageResults.qa?.passed ? "PASSED (100%)" : "FAILED"}`);

    if (result.stageResults.youtube) {
      console.log(`   🌐 YouTube Status:`);
      console.log(`      Video ID: ${result.stageResults.youtube.videoId}`);
      console.log(`      Watch URL: ${result.stageResults.youtube.videoUrl}`);
      console.log(`      Privacy: ${result.stageResults.youtube.privacyStatus.toUpperCase()}`);
      if (result.stageResults.youtube.publishAt) {
        console.log(`      Scheduled At: ${result.stageResults.youtube.publishAt}`);
      }
    }
  } else {
    console.error(`❌ PRODUCTION PIPELINE FAILED: ${result.error}`);
  }
  console.log("\n================================================================================");
}

main().catch((err) => {
  console.error("❌ Fatal production error:", err.message || err);
  process.exit(1);
});
