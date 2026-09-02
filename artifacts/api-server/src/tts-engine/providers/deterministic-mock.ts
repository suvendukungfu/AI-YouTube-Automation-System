import fs from "node:fs";
import path from "node:path";
import type { ITTSProvider, TTSVoice, SynthesisOptions, SynthesisResult, TTSHealthCheck } from "../types";

export class DeterministicMockTTSProvider implements ITTSProvider {
  readonly name = "deterministic-mock";

  async listVoices(): Promise<TTSVoice[]> {
    return [
      {
        id: "en-US-ChristopherNeural",
        name: "Christopher (Authoritative Documentary Voice)",
        locale: "en-US",
        gender: "Male",
        description: "Deep, crisp, cinematic documentarian voice for CurioSphere",
        isLocal: true,
      },
      {
        id: "en-US-GuyNeural",
        name: "Guy (Engaging Storyteller)",
        locale: "en-US",
        gender: "Male",
        description: "Energetic and curiosity-driven science narrator",
        isLocal: true,
      },
      {
        id: "en-US-JennyNeural",
        name: "Jenny (Warm & Articulate)",
        locale: "en-US",
        gender: "Female",
        description: "Clear and polished educational voice",
        isLocal: true,
      },
    ];
  }

  async checkHealth(): Promise<TTSHealthCheck> {
    return {
      healthy: true,
      provider: this.name,
      engine: "in-memory-pcm-synth-v1",
      availableVoicesCount: 3,
      latencyMs: 1,
    };
  }

  async synthesize(options: SynthesisOptions): Promise<SynthesisResult> {
    const {
      jobId,
      text,
      outputPath: customOutputPath,
      voice = "en-US-ChristopherNeural",
      speakingRate = 1.0,
      overwrite = false,
    } = options;

    if (!text || text.trim().length === 0) {
      throw new Error("Cannot synthesize empty narration text");
    }

    // Determine output file path
    const targetDir = path.resolve(process.cwd(), "artifacts/media/audio");
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const defaultFilename = jobId ? `job-${jobId}-master.wav` : `narration-${Date.now()}.wav`;
    const finalFilePath = customOutputPath ? path.resolve(customOutputPath) : path.join(targetDir, defaultFilename);

    // Overwrite Protection Guard: Check if a valid audio artifact already exists
    if (fs.existsSync(finalFilePath) && !overwrite) {
      const stats = fs.statSync(finalFilePath);
      if (stats.size > 100) {
        // Calculate duration based on WAV file size (sampleRate: 48000, 16-bit mono = 96000 bytes/sec)
        const durationSec = Math.max(1, Math.round((stats.size - 44) / 96000));
        return {
          audioFilePath: finalFilePath,
          audioUrl: `/artifacts/media/audio/${path.basename(finalFilePath)}`,
          durationSec,
          format: "audio/wav",
          sampleRate: 48000,
          sizeBytes: stats.size,
          voiceUsed: voice,
          isCached: true,
        };
      }
    }

    // Calculate natural duration: ~140 words per minute (2.33 words/sec) adjusted for speakingRate
    const wordCount = text.trim().split(/\s+/).length;
    const rateMultiplier = typeof speakingRate === "number" ? speakingRate : 1.0;
    const rawDuration = wordCount / (2.33 * rateMultiplier);
    const durationSec = Math.max(2, Math.round(rawDuration)); // Minimum 2s

    // Generate valid 48kHz 16-bit mono RIFF WAVE buffer
    const sampleRate = 48000;
    const numSamples = sampleRate * durationSec;
    const bytesPerSample = 2; // 16-bit PCM
    const dataSize = numSamples * bytesPerSample;
    const buffer = Buffer.alloc(44 + dataSize);

    // RIFF header
    buffer.write("RIFF", 0);
    buffer.writeUInt32LE(36 + dataSize, 4); // File size - 8
    buffer.write("WAVE", 8);

    // fmt subchunk
    buffer.write("fmt ", 12);
    buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
    buffer.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
    buffer.writeUInt16LE(1, 22); // NumChannels (1 = Mono)
    buffer.writeUInt32LE(sampleRate, 24); // SampleRate (48000)
    buffer.writeUInt32LE(sampleRate * bytesPerSample, 28); // ByteRate (48000 * 2)
    buffer.writeUInt16LE(bytesPerSample, 32); // BlockAlign (2)
    buffer.writeUInt16LE(16, 34); // BitsPerSample (16)

    // data subchunk
    buffer.write("data", 36);
    buffer.writeUInt32LE(dataSize, 40);

    // Fill with soft acoustic tone + gentle envelope so it's a real audible signal
    const frequency = 220; // 220 Hz low acoustic resonance
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      // Gentle fade-in and fade-out envelope
      const envelope = Math.min(1, Math.min(t * 5, (durationSec - t) * 5));
      const sampleValue = Math.floor(Math.sin(2 * Math.PI * frequency * t) * 3000 * envelope);
      buffer.writeInt16LE(sampleValue, 44 + i * 2);
    }

    // Ensure directory exists and write audio file
    fs.mkdirSync(path.dirname(finalFilePath), { recursive: true });
    fs.writeFileSync(finalFilePath, buffer);

    const stats = fs.statSync(finalFilePath);

    return {
      audioFilePath: finalFilePath,
      audioUrl: `/artifacts/media/audio/${path.basename(finalFilePath)}`,
      durationSec,
      format: "audio/wav",
      sampleRate,
      sizeBytes: stats.size,
      voiceUsed: voice,
      isCached: false,
    };
  }
}
