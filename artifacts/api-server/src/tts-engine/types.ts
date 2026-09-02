export interface TTSVoice {
  id: string;
  name: string;
  locale: string;
  gender: "Male" | "Female" | "Neutral";
  description?: string;
  isLocal: boolean;
}

export interface SynthesisOptions {
  jobId?: number;
  text: string;
  outputPath?: string;
  voice?: string;
  speakingRate?: number | string; // e.g. 1.0 or "+5%" or "-10%"
  pitch?: string; // e.g. "+0Hz" or "+2st"
  format?: "wav" | "mp3";
  overwrite?: boolean;
}

export interface SynthesisResult {
  audioFilePath: string;
  audioUrl: string;
  durationSec: number;
  format: string;
  sampleRate: number;
  sizeBytes: number;
  voiceUsed: string;
  isCached: boolean;
}

export interface TTSHealthCheck {
  healthy: boolean;
  provider: string;
  engine: string;
  availableVoicesCount: number;
  latencyMs?: number;
  error?: string;
}

export interface ITTSProvider {
  readonly name: string;
  synthesize(options: SynthesisOptions): Promise<SynthesisResult>;
  listVoices(): Promise<TTSVoice[]>;
  checkHealth(): Promise<TTSHealthCheck>;
}
