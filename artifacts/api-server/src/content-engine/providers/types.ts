import { z } from "zod";

export interface GenerateStructuredOptions<T> {
  prompt: string;
  schema: z.ZodType<T>;
  systemPrompt?: string;
  temperature?: number;
  timeoutMs?: number;
}

export interface ProviderHealthCheck {
  healthy: boolean;
  provider: string;
  model: string;
  endpoint: string;
  availableModels?: string[];
  latencyMs?: number;
  error?: string;
}

export interface ILLMProvider {
  readonly name: string;
  generateStructured<T>(options: GenerateStructuredOptions<T>): Promise<T>;
  generateText(prompt: string, systemPrompt?: string, timeoutMs?: number): Promise<string>;
  checkHealth(): Promise<ProviderHealthCheck>;
}
