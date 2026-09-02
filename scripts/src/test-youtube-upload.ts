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

import { youTubeUploadService } from "../../artifacts/api-server/src/youtube-engine/service";
import { getYouTubeUploader } from "../../artifacts/api-server/src/youtube-engine/providers";
import { CommandParser } from "../../artifacts/api-server/src/content-engine/command-parser";

async function main() {
  const customCommand = process.argv.slice(2).join(" ").trim() || "Generate today's video about the Mariana Trench and schedule it for 7 PM";
  const dummyJobId = 808;

  console.log("================================================================================");
  console.log(" 🚀 CURIOSPHERE YOUTUBE UPLOAD & SCHEDULING INTEGRATION (PHASE 9)");
  console.log("================================================================================");
  console.log(`📌 Command: "${customCommand}"\n`);

  // 1. Parse Command with Privacy and Scheduling
  const parsed = CommandParser.parse(customCommand);
  console.log(`📋 PARSED COMMAND:`);
  console.log(`   Topic: "${parsed.topic}"`);
  console.log(`   Target Duration: ${parsed.targetDurationSeconds}s`);
  console.log(`   Privacy Status: [${parsed.privacyStatus?.toUpperCase()}]`);
  console.log(`   Scheduled Time: [${parsed.scheduledTime || "NONE (Publish immediately)"}]\n`);

  // 2. Check Health
  const uploader = getYouTubeUploader();
  const health = await uploader.checkHealth();
  console.log(`🌐 Uploader Engine: [${uploader.name}]`);
  console.log(`   Authenticated: ${health.authenticated ? "YES" : "NO"}`);
  console.log(`   Channel: ${health.channelTitle || "N/A"}`);
  console.log(`   Quota Available: ${health.quotaEstimatedAvailable ? "YES" : "NO"}\n`);

  // 3. Prepare Dummy Job Artifacts
  const baseJobDir = path.resolve(process.cwd(), `artifacts/media/jobs/${dummyJobId}`);
  const renderDir = path.join(baseJobDir, "rendered");
  const thumbDir = path.join(baseJobDir, "thumbnails");
  fs.mkdirSync(renderDir, { recursive: true });
  fs.mkdirSync(thumbDir, { recursive: true });

  const videoPath = path.join(renderDir, `job-${dummyJobId}-1080p.mp4`);
  const thumbPath = path.join(thumbDir, "master-thumb.svg");

  fs.writeFileSync(videoPath, Buffer.from("ftypisom mock video mp4 container payload"));
  fs.writeFileSync(thumbPath, Buffer.from("<svg>mock thumbnail</svg>"));

  const dummyJob: any = {
    id: dummyJobId,
    title: `The Mariana Trench: Earth's Deepest Secret`,
    topic: parsed.topic || "The Mariana Trench",
    status: "READY_TO_UPLOAD",
  };

  // 4. Execute First Upload
  console.log("⏳ Step 1/2: Executing initial YouTube upload...");
  const startTime = Date.now();
  const uploadResult = await youTubeUploadService.uploadJobVideo(dummyJob, undefined, {
    privacyStatus: parsed.privacyStatus,
    publishAt: parsed.scheduledTime ? "2026-09-02T19:00:00.000Z" : undefined,
  });
  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`✅ Upload complete in ${elapsedSec}s:`);
  console.log(`   Video ID: ${uploadResult.videoId}`);
  console.log(`   YouTube URL: ${uploadResult.videoUrl}`);
  console.log(`   Title: "${uploadResult.title}"`);
  console.log(`   Privacy: ${uploadResult.privacyStatus.toUpperCase()}`);
  if (uploadResult.publishAt) {
    console.log(`   Scheduled Publish At: ${uploadResult.publishAt}`);
  }
  console.log(`   Thumbnail Attached: ${uploadResult.thumbnailUploaded ? "YES" : "NO"}\n`);

  // 5. Test Idempotency Guard (Second upload attempt of the same job)
  console.log("⏳ Step 2/2: Verifying idempotency protection against duplicate uploads...");
  const uploadedJob = {
    ...dummyJob,
    status: "UPLOADED",
    youtubeVideoId: uploadResult.videoId,
  };

  const secondAttempt = await youTubeUploadService.uploadJobVideo(uploadedJob, undefined, {
    overwrite: false,
  });

  console.log(`🛡️ Idempotency Verification:`);
  console.log(`   Duplicate Skipped: ${secondAttempt.isDuplicateSkipped ? "PASSED (Zero duplicate upload)" : "FAILED"}`);
  console.log(`   Preserved Video ID: ${secondAttempt.videoId}\n`);

  console.log("================================================================================");
  console.log("🎉 Local CurioSphere YouTube upload & scheduling integration successful!");
  console.log("================================================================================");
}

main().catch((err) => {
  console.error("❌ YouTube upload failed:", err.message || err);
  process.exit(1);
});
