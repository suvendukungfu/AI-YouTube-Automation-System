import type { ILLMProvider } from "./types";
import { DeterministicMockLLMProvider } from "./deterministic-mock";
import { OllamaLLMProvider } from "./ollama";
import { GeminiLLMProvider } from "./gemini";

export * from "./types";
export * from "./deterministic-mock";
export * from "./ollama";
export * from "./gemini";

export function getLLMProvider(preferredProvider?: string): ILLMProvider {
  const providerType = preferredProvider || process.env.LLM_PROVIDER || "deterministic-mock";

  switch (providerType.toLowerCase()) {
    case "ollama":
      return new OllamaLLMProvider();
    case "gemini":
      return new GeminiLLMProvider();
    case "deterministic-mock":
    case "mock":
    default:
      return new DeterministicMockLLMProvider();
  }
}
