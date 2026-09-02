import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { CommandParser } from "../../content-engine/command-parser";
import { DeterministicMockYouTubeUploader } from "../providers/deterministic-mock";
import { YouTubeUploadService } from "../service";

test("CommandParser - extracts privacy status and scheduling directives accurately", () => {
  const cmd1 = CommandParser.parse("Generate today's video about black holes and upload privately");
  assert.equal(cmd1.topic, "black holes");
  assert.equal(cmd1.privacyStatus, "private");

  const cmd2 = CommandParser.parse("Generate today's video and schedule it for 7 PM");
  assert.equal(cmd2.scheduledTime, "7 PM");
  assert.equal(cmd2.privacyStatus, "private");

  const cmd3 = CommandParser.parse("Create video on Quantum Physics and make it unlisted");
  assert.equal(cmd3.topic, "Quantum Physics");
  assert.equal(cmd3.privacyStatus, "unlisted");
});

test("DeterministicMockYouTubeUploader - returns healthy status and assigns video IDs", async () => {
  const uploader = new DeterministicMockYouTubeUploader();
  const health = await uploader.checkHealth();

  assert.equal(health.healthy, true);
  assert.equal(health.authenticated, true);
  assert.ok(health.channelTitle?.includes("CurioSphere"));

  const authUrl = uploader.getAuthUrl();
  assert.ok(authUrl.startsWith("https://accounts.google.com/o/oauth2/v2/auth"));
});

test("YouTubeUploadService - fails with clear diagnostic when MP4 video file is missing", async () => {
  const service = new YouTubeUploadService(new DeterministicMockYouTubeUploader());
  const fakeJob: any = {
    id: 999999,
    title: "Nonexistent",
    topic: "Fake",
    status: "READY_TO_UPLOAD",
  };

  await assert.rejects(
    async () => {
      await service.uploadJobVideo(fakeJob);
    },
    { message: /Rendered MP4 video file missing/ }
  );
});

test("YouTubeUploadService - uploads video and protects against duplicate uploads via idempotency guard", async () => {
  const service = new YouTubeUploadService(new DeterministicMockYouTubeUploader());
  const testJobId = 404;

  const baseJobDir = path.resolve(process.cwd(), `artifacts/media/jobs/${testJobId}`);
  const renderDir = path.join(baseJobDir, "rendered");
  const thumbDir = path.join(baseJobDir, "thumbnails");
  fs.mkdirSync(renderDir, { recursive: true });
  fs.mkdirSync(thumbDir, { recursive: true });

  const videoPath = path.join(renderDir, `job-${testJobId}-1080p.mp4`);
  const thumbPath = path.join(thumbDir, "master-thumb.svg");
  fs.writeFileSync(videoPath, Buffer.from("ftypisom mock MP4 video container"));
  fs.writeFileSync(thumbPath, Buffer.from("<svg>thumbnail</svg>"));

  const job: any = {
    id: testJobId,
    title: "The Mariana Trench: Earth's Abyss",
    topic: "The Mariana Trench",
    status: "READY_TO_UPLOAD",
  };

  // 1. First upload
  const result1 = await service.uploadJobVideo(job, undefined, {
    privacyStatus: "unlisted",
    publishAt: "2026-09-02T19:00:00.000Z",
  });

  assert.ok(result1.videoId.startsWith("cs_"));
  assert.ok(result1.videoUrl.includes(result1.videoId));
  assert.equal(result1.privacyStatus, "unlisted");
  assert.equal(result1.thumbnailUploaded, true);
  assert.equal(result1.isDuplicateSkipped, false);

  // 2. Second upload attempt with same job ID and status UPLOADED
  const uploadedJob = {
    ...job,
    status: "UPLOADED",
    youtubeVideoId: result1.videoId,
  };

  const result2 = await service.uploadJobVideo(uploadedJob, undefined, {
    overwrite: false,
  });

  assert.equal(result2.videoId, result1.videoId);
  assert.equal(result2.isDuplicateSkipped, true, "Duplicate upload must be intercepted and skipped");
});
