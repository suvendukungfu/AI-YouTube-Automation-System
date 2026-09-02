import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DeterministicMockTTSProvider } from "../providers/deterministic-mock";
import { EdgeTTSProvider } from "../providers/edge-tts";
import { TTSSynthesizer } from "../synthesizer";

test("DeterministicMockTTSProvider - listVoices returns curated voice models", async () => {
  const provider = new DeterministicMockTTSProvider();
  const voices = await provider.listVoices();

  assert.ok(voices.length >= 3);
  const christopher = voices.find((v) => v.id === "en-US-ChristopherNeural");
  assert.ok(christopher);
  assert.equal(christopher.gender, "Male");
  assert.equal(christopher.locale, "en-US");
});

test("DeterministicMockTTSProvider - checkHealth returns healthy report", async () => {
  const provider = new DeterministicMockTTSProvider();
  const health = await provider.checkHealth();

  assert.equal(health.healthy, true);
  assert.equal(health.provider, "deterministic-mock");
  assert.ok(health.availableVoicesCount >= 3);
});

test("DeterministicMockTTSProvider - synthesizes valid 48kHz RIFF/WAVE file with headers", async () => {
  const provider = new DeterministicMockTTSProvider();
  const testOutputPath = path.resolve(process.cwd(), "artifacts/media/audio/test-unit-narration.wav");

  // Clean test artifact if existing
  if (fs.existsSync(testOutputPath)) {
    fs.unlinkSync(testOutputPath);
  }

  const result = await provider.synthesize({
    text: "Welcome to CurioSphere. Today, we descend into the Mariana Trench.",
    outputPath: testOutputPath,
    voice: "en-US-ChristopherNeural",
    speakingRate: 1.0,
    overwrite: true,
  });

  assert.equal(result.audioFilePath, testOutputPath);
  assert.ok(fs.existsSync(testOutputPath));
  assert.ok(result.sizeBytes > 44, "File should have header and PCM data");
  assert.ok(result.durationSec > 0, "Duration must be positive");
  assert.equal(result.sampleRate, 48000);
  assert.equal(result.format, "audio/wav");

  // Verify WAV magic headers in file
  const fileBuffer = fs.readFileSync(testOutputPath);
  assert.equal(fileBuffer.toString("ascii", 0, 4), "RIFF");
  assert.equal(fileBuffer.toString("ascii", 8, 12), "WAVE");
  assert.equal(fileBuffer.toString("ascii", 12, 16), "fmt ");
  assert.equal(fileBuffer.readUInt32LE(24), 48000); // 48kHz
  assert.equal(fileBuffer.readUInt16LE(34), 16); // 16-bit
});

test("DeterministicMockTTSProvider - overwrite protection reuses existing artifact", async () => {
  const provider = new DeterministicMockTTSProvider();
  const testOutputPath = path.resolve(process.cwd(), "artifacts/media/audio/test-unit-overwrite.wav");

  // Initial synthesis
  const initial = await provider.synthesize({
    text: "First pass narration audio.",
    outputPath: testOutputPath,
    overwrite: true,
  });
  assert.equal(initial.isCached, false);

  // Second pass with overwrite: false (default)
  const second = await provider.synthesize({
    text: "Second pass narration audio.",
    outputPath: testOutputPath,
    overwrite: false,
  });
  assert.equal(second.isCached, true);
  assert.equal(second.audioFilePath, testOutputPath);
});

test("DeterministicMockTTSProvider - rejects empty text with error", async () => {
  const provider = new DeterministicMockTTSProvider();
  await assert.rejects(
    async () => {
      await provider.synthesize({ text: "   " });
    },
    { message: /Cannot synthesize empty narration text/ }
  );
});

test("TTSSynthesizer - compileScriptNarration aggregates all scenes into cohesive text", () => {
  const synthesizer = new TTSSynthesizer();
  const script = {
    hook: "The deepest point on Earth.",
    intro: "Welcome to CurioSphere.",
    scenes: [
      { heading: "Scene 1", narration: "Entering the hadal zone." },
      { heading: "Scene 2", narration: "Extreme atmospheric pressure." },
    ],
    outro: "Ancient secrets remain in the dark.",
    callToAction: "Subscribe to CurioSphere.",
  };

  const compiled = synthesizer.compileScriptNarration(script);
  assert.match(compiled, /^The deepest point on Earth\./);
  assert.match(compiled, /Entering the hadal zone\./);
  assert.match(compiled, /Extreme atmospheric pressure\./);
  assert.match(compiled, /Subscribe to CurioSphere\.$/);
});

test("TTSSynthesizer - synthesizeJobScript produces valid VoiceResult with job ID naming", async () => {
  const synthesizer = new TTSSynthesizer(new DeterministicMockTTSProvider());
  const dummyJob: any = {
    id: 999,
    topic: "The Mariana Trench",
    targetDurationSeconds: 180,
  };
  const dummyScript: any = {
    hook: "If you placed Mount Everest at the bottom of the ocean...",
    intro: "Welcome to CurioSphere.",
    scenes: [
      { sceneNumber: 1, heading: "Descent", narration: "Light fades in 200 meters.", estimatedDurationSec: 30 },
      { sceneNumber: 2, heading: "Pressure", narration: "Crushing hydrostatic forces.", estimatedDurationSec: 45 },
    ],
    outro: "The mystery continues.",
    callToAction: "Leave your thoughts below.",
    wordCount: 150,
  };

  const voiceResult = await synthesizer.synthesizeJobScript(dummyJob, dummyScript, { overwrite: true });

  assert.ok(voiceResult.durationSec > 0);
  assert.ok(voiceResult.audioUrl.includes("job-999-master.wav"));
  assert.ok(voiceResult.format.includes("48000Hz"));
  assert.ok(voiceResult.voiceName);

  const expectedPath = path.resolve(process.cwd(), "artifacts/media/audio/job-999-master.wav");
  assert.ok(fs.existsSync(expectedPath));
});
