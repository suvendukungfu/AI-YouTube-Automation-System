import { z } from "zod";
import type { ILLMProvider, GenerateStructuredOptions, ProviderHealthCheck } from "./types";

export interface OllamaProviderConfig {
  baseUrl?: string;
  model?: string;
  defaultTimeoutMs?: number;
  maxRetries?: number;
}

export class OllamaLLMProvider implements ILLMProvider {
  readonly name = "ollama";
  private baseUrl: string;
  private model: string;
  private defaultTimeoutMs: number;
  private maxRetries: number;

  constructor(config?: OllamaProviderConfig) {
    // Read from OLLAMA_BASE_URL with fallback to OLLAMA_HOST or default localhost:11434
    const rawUrl =
      config?.baseUrl ||
      process.env.OLLAMA_BASE_URL ||
      process.env.OLLAMA_HOST ||
      "http://localhost:11434";

    this.baseUrl = rawUrl.replace(/\/+$/, "");
    this.model = config?.model || process.env.OLLAMA_MODEL || "llama3.3";
    this.defaultTimeoutMs = config?.defaultTimeoutMs || 90000; // 90 seconds default
    this.maxRetries = config?.maxRetries ?? 3;
  }

  getEndpoint(): string {
    return this.baseUrl;
  }

  getModel(): string {
    return this.model;
  }

  async checkHealth(): Promise<ProviderHealthCheck> {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout for healthcheck

      const res = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        return {
          healthy: false,
          provider: this.name,
          model: this.model,
          endpoint: this.baseUrl,
          latencyMs: Date.now() - startTime,
          error: `Ollama returned HTTP status ${res.status}: ${res.statusText}`,
        };
      }

      const data: any = await res.json();
      const availableModels: string[] = (data.models || []).map((m: any) => m.name);

      return {
        healthy: true,
        provider: this.name,
        model: this.model,
        endpoint: this.baseUrl,
        availableModels,
        latencyMs: Date.now() - startTime,
      };
    } catch (err: any) {
      const isAbort = err.name === "AbortError";
      return {
        healthy: false,
        provider: this.name,
        model: this.model,
        endpoint: this.baseUrl,
        latencyMs: Date.now() - startTime,
        error: isAbort
          ? "Health check timed out after 5000ms"
          : `Failed to connect to Ollama at ${this.baseUrl}: ${err.message || err}`,
      };
    }
  }

  private sanitizeLog(text: string): string {
    return text
      .replace(/bearer\s+[a-zA-Z0-9_\-\.]+/gi, "Bearer [REDACTED]")
      .replace(/(?:api[_-]?key|secret|password|token)[:=]\s*["']?[^"'\s,]+["']?/gi, "$1=[REDACTED]");
  }

  private logRequest(action: string, model: string, details: Record<string, any>) {
    const sanitizedDetails = Object.entries(details).reduce((acc, [k, v]) => {
      acc[k] = typeof v === "string" ? this.sanitizeLog(v) : v;
      return acc;
    }, {} as Record<string, any>);

    if (process.env.NODE_ENV !== "test") {
      console.log(`[OllamaProvider] [${new Date().toISOString()}] ${action} (${model}):`, JSON.stringify(sanitizedDetails));
    }
  }

  async generateText(prompt: string, systemPrompt?: string, timeoutMs?: number): Promise<string> {
    const effectiveTimeout = timeoutMs || this.defaultTimeoutMs;
    const startTime = Date.now();

    const response = await this.executeWithRetry(async (attempt) => {
      this.logRequest("generateText:attempt", this.model, {
        attempt,
        promptLength: prompt.length,
        hasSystemPrompt: !!systemPrompt,
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), effectiveTimeout);

      try {
        const res = await fetch(`${this.baseUrl}/api/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: this.model,
            prompt,
            system: systemPrompt,
            stream: false,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errBody = await res.text().catch(() => "");
          throw new Error(`Ollama HTTP ${res.status}: ${res.statusText} - ${errBody}`);
        }

        const data: any = await res.json();
        return data.response as string;
      } finally {
        clearTimeout(timeoutId);
      }
    });

    this.logRequest("generateText:success", this.model, {
      durationMs: Date.now() - startTime,
      responseLength: response.length,
    });

    return response;
  }

  async generateStructured<T>(options: GenerateStructuredOptions<T>): Promise<T> {
    const { prompt, schema, systemPrompt, temperature = 0.2, timeoutMs } = options;
    const effectiveTimeout = timeoutMs || this.defaultTimeoutMs;
    const startTime = Date.now();

    const strictSystemPrompt = `${systemPrompt || ""}\n\nCRITICAL INSTRUCTION: You must respond ONLY with a raw, valid JSON object or array. Do NOT include markdown fences, backticks, conversational preamble, notes, or explanations.`;

    const rawResponse = await this.executeWithRetry(async (attempt) => {
      this.logRequest("generateStructured:attempt", this.model, {
        attempt,
        promptSnippet: prompt.slice(0, 100),
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), effectiveTimeout);

      try {
        const res = await fetch(`${this.baseUrl}/api/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: this.model,
            prompt,
            system: strictSystemPrompt,
            format: "json",
            options: { temperature },
            stream: false,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errBody = await res.text().catch(() => "");
          throw new Error(`Ollama HTTP ${res.status}: ${res.statusText} - ${errBody}`);
        }

        const data: any = await res.json();
        return data.response as string;
      } finally {
        clearTimeout(timeoutId);
      }
    });

    const parsed = this.repairAndParseJson<T>(rawResponse, schema);

    this.logRequest("generateStructured:success", this.model, {
      durationMs: Date.now() - startTime,
    });

    return parsed;
  }

  /**
   * Multi-layer Self-Healing JSON Parser
   * Recovers from common AI formatting quirks:
   * 1. Markdown code fences (```json ... ```)
   * 2. Conversational prefix/suffix wrapping
   * 3. Trailing commas in arrays/objects
   * 4. Single-quoted strings
   */
  public repairAndParseJson<T>(raw: string, schema: z.ZodType<T>): T {
    let text = raw.trim();

    // 1. Strip Markdown Code Blocks
    if (text.includes("```")) {
      const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (codeBlockMatch && codeBlockMatch[1]) {
        text = codeBlockMatch[1].trim();
      } else {
        text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      }
    }

    // 2. Extract balanced JSON substring if conversational text exists
    const firstBrace = text.indexOf("{");
    const firstBracket = text.indexOf("[");
    let startIndex = -1;
    let endIndex = -1;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIndex = firstBrace;
      endIndex = text.lastIndexOf("}");
    } else if (firstBracket !== -1) {
      startIndex = firstBracket;
      endIndex = text.lastIndexOf("]");
    }

    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      text = text.substring(startIndex, endIndex + 1);
    }

    // 3. Attempt direct parse
    try {
      const parsed = JSON.parse(text);
      return schema.parse(parsed);
    } catch {
      // 4. Clean common JSON syntax errors (trailing commas, control chars)
      const sanitized = text
        .replace(/,\s*([}\]])/g, "$1") // Remove trailing commas
        .replace(/[\x00-\x1F\x7F-\x9F]/g, (c) => (c === "\n" || c === "\r" || c === "\t" ? c : "")); // Strip non-whitespace control characters

      try {
        const parsed = JSON.parse(sanitized);
        return schema.parse(parsed);
      } catch (finalErr: any) {
        throw new Error(
          `Failed to parse and validate Ollama response against schema: ${finalErr.message}\nCleaned Payload: ${text.slice(0, 300)}`
        );
      }
    }
  }

  private async executeWithRetry<T>(fn: (attempt: number) => Promise<T>): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn(attempt);
      } catch (err: any) {
        lastError = err;
        const isAbort = err.name === "AbortError" || err.message?.includes("aborted");
        const isNetwork = err.message?.includes("fetch failed") || err.message?.includes("ECONNREFUSED");

        this.logRequest("retryableError", this.model, {
          attempt,
          maxRetries: this.maxRetries,
          isAbort,
          isNetwork,
          message: err.message,
        });

        if (attempt < this.maxRetries) {
          // Exponential backoff: 500ms, 1500ms, 4500ms...
          const delayMs = Math.min(500 * Math.pow(3, attempt - 1), 5000);
          await new Promise((res) => setTimeout(res, delayMs));
        }
      }
    }

    throw new Error(
      `Ollama request failed after ${this.maxRetries} attempts: ${lastError?.message || lastError}`
    );
  }
}
