import type { ITTSProvider } from "../types";
import { DeterministicMockTTSProvider } from "./deterministic-mock";
import { EdgeTTSProvider } from "./edge-tts";

export * from "./deterministic-mock";
export * from "./edge-tts";

export function getTTSProvider(preferredProvider?: string): ITTSProvider {
  const providerType = preferredProvider || process.env.TTS_PROVIDER || "edge-tts";

  switch (providerType.toLowerCase()) {
    case "deterministic-mock":
    case "mock":
      return new DeterministicMockTTSProvider();
    case "edge-tts":
    case "piper":
    default:
      return new EdgeTTSProvider();
  }
}
