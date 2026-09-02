import test from "node:test";
import assert from "node:assert/strict";
import { DailySchedulerService } from "../service";

test("DailySchedulerService - default configuration enforces private upload and active state", () => {
  const scheduler = new DailySchedulerService();
  const status = scheduler.getStatus();

  assert.equal(status.config.channelName, "CurioSphere");
  assert.equal(status.config.defaultPublishMode, "PRIVATE", "Must default to private upload");
  assert.equal(status.isPaused, false);
  assert.ok(status.todayDateKey.startsWith("curiosphere-daily-"));
});

test("DailySchedulerService - pause and resume toggles pause state correctly", async () => {
  const scheduler = new DailySchedulerService();
  scheduler.pause();
  assert.equal(scheduler.getStatus().isPaused, true);

  const result = await scheduler.triggerDailyRun();
  assert.equal(result.status, "PAUSED");

  scheduler.resume();
  assert.equal(scheduler.getStatus().isPaused, false);
});

test("DailySchedulerService - dry-run mode simulates production run safely", async () => {
  const scheduler = new DailySchedulerService();
  const result = await scheduler.triggerDailyRun({
    dryRun: true,
    customTopic: "The Antikythera Mechanism",
  });

  assert.equal(result.status, "COMPLETED");
  assert.equal(result.isDryRun, true);
  assert.equal(result.topic, "The Antikythera Mechanism");
  assert.ok(result.videoUrl);
});

test("DailySchedulerService - executes daily run and protects against duplicate runs via date-keyed idempotency", async () => {
  const scheduler = new DailySchedulerService();

  // 1. First Daily Run
  const result1 = await scheduler.triggerDailyRun({
    customTopic: "The Voynich Manuscript",
  });

  assert.equal(result1.status, "COMPLETED");
  assert.equal(result1.isDuplicateSkipped, false);
  assert.ok(result1.videoUrl);

  // 2. Second Daily Run Attempt on Same Day
  const result2 = await scheduler.triggerDailyRun();

  assert.equal(result2.status, "COMPLETED");
  assert.equal(result2.isDuplicateSkipped, true, "Must intercept duplicate run for the same calendar date");
  assert.equal(result2.jobId, result1.jobId);

  // 3. Force override
  const result3 = await scheduler.triggerDailyRun({
    force: true,
    customTopic: "The Wow! Signal",
  });

  assert.equal(result3.status, "COMPLETED");
  assert.equal(result3.isDuplicateSkipped, false);
});
