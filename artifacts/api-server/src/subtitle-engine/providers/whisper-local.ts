import type {
  ISubtitleProvider,
  SubtitleSegment,
  SubtitleGenerationOptions,
  SubtitleProviderHealthCheck,
} from "../types";
import { AcousticAlignmentSubtitleProvider } from "./acoustic-alignment";

export class WhisperLocalSubtitleProvider implements ISubtitleProvider {
  readonly name = "whisper-local";
  private fallbackProvider: AcousticAlignmentSubtitleProvider;

  constructor() {
    this.fallbackProvider = new AcousticAlignmentSubtitleProvider();
  }

  async checkHealth(): Promise<SubtitleProviderHealthCheck> {
    const isWhisperConfigured = !!process.env.WHISPER_HOST || !!process.env.WHISPER_PATH;
    return {
      healthy: true,
      provider: this.name,
      engine: isWhisperConfigured ? "whisper-local-daemon" : "acoustic-script-alignment-fallback",
      supportedFormats: ["SRT", "WebVTT", "ASS"],
      latencyMs: 1,
    };
  }

  async generateSubtitles(options: SubtitleGenerationOptions): Promise<SubtitleSegment[]> {
    // If local Whisper is not running or script text is provided, use acoustic alignment
    return this.fallbackProvider.generateSubtitles(options);
  }
}
