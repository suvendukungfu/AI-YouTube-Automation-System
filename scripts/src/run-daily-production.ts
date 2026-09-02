import fs from "node:fs";
import path from "node:path";

function loadWorkspaceEnv() {
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../.env"),
    path.resolve(process.cwd(), "../../.env"),
  ];
  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      try {
        process.loadEnvFile?.(envPath);
        return;
      } catch {}
    }
  }
}
loadWorkspaceEnv();

import { dailyScheduler } from "../../artifacts/api-server/src/scheduler/service";

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");
  const isForce = args.includes("--force");
  const isPause = args.includes("--pause");
  const isResume = args.includes("--resume");
  const isStatus = args.includes("--status");

  let customTopic: string | undefined;
  const topicIdx = args.indexOf("--topic");
  if (topicIdx !== -1 && args[topicIdx + 1]) {
    customTopic = args.slice(topicIdx + 1).join(" ");
  }

  console.log("================================================================================");
  console.log(" ⏰ CURIOSPHERE DAILY AUTOMATED PRODUCTION ENGINE (PHASE 11)");
  console.log("================================================================================\n");

  if (isPause) {
    dailyScheduler.pause();
    console.log("⏸️ Daily production automation has been paused.");
    return;
  }

  if (isResume) {
    dailyScheduler.resume();
    console.log("▶️ Daily production automation has been resumed.");
    return;
  }

  if (isStatus) {
    const status = dailyScheduler.getStatus();
    console.log(`📋 SCHEDULER STATUS:`);
    console.log(`   Channel: ${status.config.channelName}`);
    console.log(`   Date Key: ${status.todayDateKey}`);
    console.log(`   Automation Status: ${status.isPaused ? "PAUSED ⏸️" : "ACTIVE ▶️"}`);
    console.log(`   Publish Mode: ${status.config.defaultPublishMode}`);
    console.log(`   Daily Publish Time: ${status.config.publishTimeOfDay} UTC`);
    return;
  }

  console.log(`📅 Daily Date Key: "${dailyScheduler.getStatus().todayDateKey}"`);
  console.log(`⚙️ Mode: ${isDryRun ? "🧪 DRY-RUN (Simulation)" : "🚀 LIVE PRODUCTION"}`);
  console.log(`🛡️ Idempotency: ${isForce ? "OVERRIDDEN (--force)" : "ENABLED (Duplicate Guard Active)"}`);
  if (customTopic) {
    console.log(`📌 Topic Override: "${customTopic}"`);
  }
  console.log("--------------------------------------------------------------------------------\n");

  const startTime = Date.now();
  const result = await dailyScheduler.triggerDailyRun({
    dryRun: isDryRun,
    force: isForce,
    customTopic,
  });

  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("\n================================================================================");
  if (result.status === "COMPLETED") {
    if (result.isDuplicateSkipped) {
      console.log(`🛡️ DAILY PRODUCTION SKIPPED: Today's video was already completed (${result.dateKey}).`);
    } else {
      console.log(`✨ DAILY PRODUCTION COMPLETED in ${elapsedSec}s`);
    }
    console.log("================================================================================\n");

    console.log(`📋 DAILY RUN SUMMARY:`);
    console.log(`   Date Key: ${result.dateKey}`);
    console.log(`   Job ID: #${result.jobId}`);
    console.log(`   Topic: "${result.topic}"`);
    console.log(`   Status: [${result.status}]`);
    if (result.videoUrl) {
      console.log(`   YouTube URL: ${result.videoUrl}`);
    }
    if (result.publishAt) {
      console.log(`   Scheduled Publish At: ${result.publishAt}`);
    }
    console.log(`   Dry Run: ${result.isDryRun ? "YES" : "NO"}`);
    console.log(`   Duplicate Skipped: ${result.isDuplicateSkipped ? "YES" : "NO"}`);
  } else if (result.status === "PAUSED") {
    console.log(`⏸️ DAILY PRODUCTION SKIPPED: Automation is currently PAUSED.`);
  } else {
    console.error(`❌ DAILY PRODUCTION FAILED: ${result.error}`);
  }
  console.log("================================================================================\n");
}

main().catch((err) => {
  console.error("❌ Fatal scheduler error:", err.message || err);
  process.exit(1);
});
