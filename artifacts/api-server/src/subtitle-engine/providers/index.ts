import type { ISubtitleProvider } from "../types";
import { AcousticAlignmentSubtitleProvider } from "./acoustic-alignment";
import { WhisperLocalSubtitleProvider } from "./whisper-local";

export * from "./acoustic-alignment";
export * from "./whisper-local";

export function getSubtitleProvider(preferredProvider?: string): ISubtitleProvider {
  const providerType = preferredProvider || process.env.SUBTITLE_PROVIDER || "whisper-local";

  switch (providerType.toLowerCase()) {
    case "acoustic":
    case "alignment":
      return new AcousticAlignmentSubtitleProvider();
    case "whisper":
    case "whisper-local":
    default:
      return new WhisperLocalSubtitleProvider();
  }
}
