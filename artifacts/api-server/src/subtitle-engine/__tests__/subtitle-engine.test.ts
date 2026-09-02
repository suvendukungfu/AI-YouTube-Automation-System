import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { TimestampValidator } from "../validator";
import { AcousticAlignmentSubtitleProvider } from "../providers/acoustic-alignment";
import { SubtitleEngine } from "../engine";

test("TimestampValidator - formatSRTTime formats milliseconds with comma", () => {
  assert.equal(TimestampValidator.formatSRTTime(0), "00:00:00,000");
  assert.equal(TimestampValidator.formatSRTTime(1.5), "00:00:01,500");
  assert.equal(TimestampValidator.formatSRTTime(75.25), "00:01:15,250");
  assert.equal(TimestampValidator.formatSRTTime(3665.123), "01:01:05,123");
});

test("TimestampValidator - formatVTTTime formats milliseconds with dot", () => {
  assert.equal(TimestampValidator.formatVTTTime(0), "00:00:00.000");
  assert.equal(TimestampValidator.formatVTTTime(1.5), "00:00:01.500");
  assert.equal(TimestampValidator.formatVTTTime(75.25), "00:01:15.250");
});

test("TimestampValidator - formatASSTime formats centiseconds with dot", () => {
  assert.equal(TimestampValidator.formatASSTime(0), "0:00:00.00");
  assert.equal(TimestampValidator.formatASSTime(1.5), "0:00:01.50");
  assert.equal(TimestampValidator.formatASSTime(75.25), "0:01:15.25");
});

test("TimestampValidator - repairs malformed inverted and negative timestamps", () => {
  const malformed = [
    { id: 1, startSec: -5, endSec: 3, text: "Negative start" },
    { id: 2, startSec: 10, endSec: 4, text: "Inverted start/end" }, // end < start
  ];

  const fixed = TimestampValidator.validateAndFixTimestamps(malformed, 20);

  assert.equal(fixed.length, 2);
  assert.ok(fixed[0].startSec >= 0, "Start timestamp must not be negative");
  assert.ok(fixed[0].endSec > fixed[0].startSec, "End must be strictly greater than start");
  assert.ok(fixed[1].endSec > fixed[1].startSec, "Inverted timestamp must be corrected");
});

test("TimestampValidator - repairs overlapping timestamps with minimum gap", () => {
  const overlapping = [
    { id: 1, startSec: 0, endSec: 5.0, text: "First cue" },
    { id: 2, startSec: 3.0, endSec: 8.0, text: "Overlapping second cue" }, // Starts at 3s before 5s
    { id: 3, startSec: 7.5, endSec: 12.0, text: "Overlapping third cue" }, // Starts at 7.5s before 8s
  ];

  const fixed = TimestampValidator.validateAndFixTimestamps(overlapping, 30);

  assert.equal(fixed.length, 3);
  // Cue 2 start must be pushed after Cue 1 end
  assert.ok(fixed[1].startSec >= fixed[0].endSec, "Cue 2 must start at or after Cue 1 ends");
  assert.ok(fixed[2].startSec >= fixed[1].endSec, "Cue 3 must start at or after Cue 2 ends");
});

test("TimestampValidator - sorts and corrects out-of-order timestamps", () => {
  const unordered = [
    { id: 2, startSec: 15.0, endSec: 20.0, text: "Later cue placed first" },
    { id: 1, startSec: 2.0, endSec: 6.0, text: "Earlier cue placed second" },
  ];

  const fixed = TimestampValidator.validateAndFixTimestamps(unordered, 30);

  assert.equal(fixed.length, 2);
  assert.equal(fixed[0].text, "Earlier cue placed second");
  assert.equal(fixed[1].text, "Later cue placed first");
  assert.ok(fixed[0].startSec < fixed[1].startSec);
});

test("TimestampValidator - clamps timestamps exceeding total audio duration", () => {
  const oversized = [
    { id: 1, startSec: 20.0, endSec: 55.0, text: "Oversized cue beyond track limit" },
  ];

  const fixed = TimestampValidator.validateAndFixTimestamps(oversized, 30.0);

  assert.equal(fixed.length, 1);
  assert.equal(fixed[0].endSec, 30.0);
  assert.ok(fixed[0].startSec < fixed[0].endSec);
});

test("AcousticAlignmentSubtitleProvider - creates timed segments with cadence pauses", async () => {
  const provider = new AcousticAlignmentSubtitleProvider();
  const scriptText = "Welcome to CurioSphere. Deep underwater, light disappears completely. What mysteries lie in the dark?";
  const duration = 15.0;

  const segments = await provider.generateSubtitles({
    scriptText,
    audioDurationSec: duration,
    maxWordsPerCue: 5,
  });

  assert.ok(segments.length >= 3);
  assert.equal(segments[0].startSec, 0);
  assert.ok(segments[segments.length - 1].endSec <= duration);

  for (let i = 0; i < segments.length - 1; i++) {
    assert.ok(
      segments[i + 1].startSec >= segments[i].endSec,
      `Segment ${i + 1} must not overlap with segment ${i}`
    );
  }
});

test("SubtitleEngine - generateSubtitles writes valid SRT, WebVTT, and ASS files on disk", async () => {
  const engine = new SubtitleEngine();
  const testDir = path.resolve(process.cwd(), "artifacts/media/test-subtitles");

  const result = await engine.generateSubtitles({
    jobId: 303,
    scriptText: "The Mariana Trench is the deepest place on Earth. Pressure exceeds one thousand atmospheres.",
    audioDurationSec: 10.0,
    outputDir: testDir,
  });

  assert.ok(fs.existsSync(result.srtPath));
  assert.ok(fs.existsSync(result.vttPath));
  assert.ok(fs.existsSync(result.assPath));

  const srtContent = fs.readFileSync(result.srtPath, "utf-8");
  assert.ok(srtContent.includes("1\n"));
  assert.ok(srtContent.includes("-->"));
  assert.ok(srtContent.includes("Mariana Trench"));

  const vttContent = fs.readFileSync(result.vttPath, "utf-8");
  assert.ok(vttContent.startsWith("WEBVTT"));

  const assContent = fs.readFileSync(result.assPath, "utf-8");
  assert.ok(assContent.includes("[Script Info]"));
  assert.ok(assContent.includes("Dialogue:"));
});
