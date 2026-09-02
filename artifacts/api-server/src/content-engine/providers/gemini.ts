import { z } from "zod";
import type { ILLMProvider, GenerateStructuredOptions, ProviderHealthCheck } from "./types";

export class GeminiLLMProvider implements ILLMProvider {
  readonly name = "gemini";
  private apiKey: string;
  private model: string;

  constructor(
    apiKey: string = process.env.GEMINI_API_KEY || "",
    model: string = process.env.GEMINI_MODEL || "gemini-2.5-flash"
  ) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async checkHealth(): Promise<ProviderHealthCheck> {
    if (!this.apiKey) {
      return {
        healthy: false,
        provider: this.name,
        model: this.model,
        endpoint: "https://generativelanguage.googleapis.com",
        error: "GEMINI_API_KEY is not configured.",
      };
    }
    return {
      healthy: true,
      provider: this.name,
      model: this.model,
      endpoint: "https://generativelanguage.googleapis.com",
      availableModels: [this.model],
    };
  }

  async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required for GeminiLLMProvider.");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const body: any = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    };

    if (systemPrompt) {
      body.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API call failed (${res.status}): ${errText}`);
    }

    const data: any = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  async generateStructured<T>(options: GenerateStructuredOptions<T>): Promise<T> {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required for GeminiLLMProvider.");
    }

    const { prompt, schema, systemPrompt, temperature = 0.2 } = options;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const body: any = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature,
      },
    };

    if (systemPrompt) {
      body.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API structured call failed (${res.status}): ${errText}`);
    }

    const data: any = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    try {
      const parsed = JSON.parse(rawText);
      return schema.parse(parsed);
    } catch (err: any) {
      throw new Error(`Failed to validate Gemini JSON response against schema: ${err.message}`);
    }
  }
}
