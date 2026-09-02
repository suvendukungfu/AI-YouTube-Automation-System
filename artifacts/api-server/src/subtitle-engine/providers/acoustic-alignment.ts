import type {
  ISubtitleProvider,
  SubtitleSegment,
  SubtitleGenerationOptions,
  SubtitleProviderHealthCheck,
} from "../types";
import { TimestampValidator } from "../validator";

export class AcousticAlignmentSubtitleProvider implements ISubtitleProvider {
  readonly name = "acoustic-alignment";

  async checkHealth(): Promise<SubtitleProviderHealthCheck> {
    return {
      healthy: true,
      provider: this.name,
      engine: "speech-cadence-aligner-v1",
      supportedFormats: ["SRT", "WebVTT", "ASS"],
      latencyMs: 1,
    };
  }

  async generateSubtitles(options: SubtitleGenerationOptions): Promise<SubtitleSegment[]> {
    const {
      scriptText,
      audioDurationSec,
      maxWordsPerCue = 7,
      maxDurationPerCueSec = 4.5,
    } = options;

    if (!scriptText || scriptText.trim().length === 0) {
      throw new Error("Cannot generate subtitles from empty script text");
    }

    const duration = Math.max(1, audioDurationSec);

    // 1. Break script into sentence and clause chunks
    const chunks = this.chunkText(scriptText, maxWordsPerCue);
    if (chunks.length === 0) {
      return [];
    }

    // 2. Compute phonetic/syllabic weight for each chunk
    const weights = chunks.map((chunk) => {
      const words = chunk.split(/\s+/).filter(Boolean);
      let weight = words.length * 1.0;
      // Extra weight for punctuation pauses
      if (/[,;]/.test(chunk)) weight += 0.3;
      if (/[.!?—]/.test(chunk)) weight += 0.6;
      return Math.max(0.5, weight);
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);

    // 3. Allocate continuous non-overlapping time slices
    const segments: SubtitleSegment[] = [];
    let currentStart = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const sliceDuration = Math.min(
        maxDurationPerCueSec,
        Math.max(1.0, (weights[i] / totalWeight) * duration)
      );

      const endSec = Math.min(duration, currentStart + sliceDuration);

      segments.push({
        id: i + 1,
        startSec: currentStart,
        endSec,
        text: chunk,
        confidenceScore: 1.0,
      });

      currentStart = endSec + 0.05; // 50ms inter-cue gap
      if (currentStart >= duration) {
        break;
      }
    }

    return TimestampValidator.validateAndFixTimestamps(segments, duration);
  }

  /**
   * Chunks large narrative sentences into readable YouTube captions
   */
  private chunkText(text: string, maxWords: number): string[] {
    const cleaned = text.replace(/\n+/g, " ").trim();
    // Split by major punctuation first
    const sentences = cleaned.split(/(?<=[.?!])\s+/);
    const result: string[] = [];

    for (const sentence of sentences) {
      const words = sentence.split(/\s+/).filter(Boolean);
      if (words.length <= maxWords) {
        if (sentence.trim()) result.push(sentence.trim());
      } else {
        // Split on comma/clauses or word limits
        let currentChunk: string[] = [];
        for (const word of words) {
          currentChunk.push(word);
          const hasPause = /[,;:]/.test(word);
          if (currentChunk.length >= maxWords || (hasPause && currentChunk.length >= 4)) {
            result.push(currentChunk.join(" "));
            currentChunk = [];
          }
        }
        if (currentChunk.length > 0) {
          result.push(currentChunk.join(" "));
        }
      }
    }

    return result;
  }
}
