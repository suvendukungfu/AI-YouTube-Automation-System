import { z } from "zod";

export const ProductionRequestSchema = z.object({
  topic: z.string().optional(),
  durationSeconds: z.number().int().min(30).max(3600).default(180),
  format: z.enum(["LONG_FORM", "SHORT"]).default("LONG_FORM"),
  tone: z.string().default("curious and cinematic"),
  language: z.string().default("en"),
  publishMode: z.enum(["PRIVATE", "UNLISTED", "PUBLIC", "NONE"]).default("PRIVATE"),
  publishAt: z.string().optional(),
  channel: z.string().default("CurioSphere"),
  style: z.string().default("cinematic documentary"),
  instructions: z.string().optional(),
});

export type ProductionRequest = z.infer<typeof ProductionRequestSchema>;

export class ProductionRequestParser {
  /**
   * Parses arbitrary natural language production requests into strongly typed ProductionRequest
   */
  static parse(input: string): ProductionRequest {
    const raw = input.trim();
    let cleaned = raw;

    // 1. Detect Channel Name
    let channel = "CurioSphere";
    const channelMatch = cleaned.match(/(?:curiosphere|tech simplified|ai money mastery|business blueprint)/i);
    if (channelMatch) {
      channel = channelMatch[0];
    }

    // 2. Detect Target Duration (e.g., "8-minute", "for 5 mins", "120 seconds", "3 min")
    let durationSeconds = 180;
    const durationMatch = cleaned.match(/(?:(\d+)\s*[- ]?(?:minute|minutes|mins|min|second|seconds|secs|sec|s))\b/i);
    if (durationMatch) {
      const val = parseInt(durationMatch[1], 10);
      const isMins = /min/i.test(durationMatch[0]);
      durationSeconds = isMins ? val * 60 : val;
      cleaned = cleaned.replace(durationMatch[0], "").trim();
    }

    // 3. Detect Format (Short vs Long-form)
    let format: "LONG_FORM" | "SHORT" = "LONG_FORM";
    if (/\b(?:shorts?|vertical|tiktok|reels?)\b/i.test(cleaned) || durationSeconds <= 60) {
      format = "SHORT";
    }

    // 4. Detect Tone & Style
    let tone = "curious and cinematic";
    let style = "cinematic documentary";

    if (/\b(?:mysterious|eerie|spooky|intriguing)\b/i.test(cleaned)) {
      tone = "mysterious and suspenseful";
    } else if (/\b(?:fast[- ]paced|high[- ]energy|punchy)\b/i.test(cleaned)) {
      tone = "fast-paced and energetic";
    } else if (/\b(?:dramatic|cinematic)\b/i.test(cleaned)) {
      tone = "epic and dramatic";
    }

    if (/\b(?:documentary|investigative|explorative)\b/i.test(cleaned)) {
      style = "investigative documentary";
    } else if (/\b(?:storytelling|narrative)\b/i.test(cleaned)) {
      style = "narrative storytelling";
    }

    // 5. Detect Publish Mode & Scheduled Publish Time
    let publishMode: "PRIVATE" | "UNLISTED" | "PUBLIC" | "NONE" = "PRIVATE";
    if (/\b(?:unlisted)\b/i.test(cleaned)) {
      publishMode = "UNLISTED";
    } else if (/\b(?:public|publish immediately)\b/i.test(cleaned)) {
      publishMode = "PUBLIC";
    } else if (/\b(?:do not upload|local only|no upload)\b/i.test(cleaned)) {
      publishMode = "NONE";
    }

    let publishAt: string | undefined;
    const scheduleMatch = cleaned.match(/(?:schedule(?:\s+it)?\s+for|at)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i);
    if (scheduleMatch) {
      publishAt = scheduleMatch[1].trim();
      cleaned = cleaned.replace(scheduleMatch[0], "").trim();
    }

    // 6. Extract Topic (after keywords like "about", "on", "regarding", "discussing")
    let topic: string | undefined;
    const topicRegex = /(?:about|on|regarding|discussing|exploring)\s+([^.]+)/i;
    const topicMatch = cleaned.match(topicRegex);

    if (topicMatch && topicMatch[1]) {
      topic = topicMatch[1]
        .replace(/^[":\s]+|[":\s]+$/g, "")
        .replace(/\b(?:in\s+(?:a\s+)?[a-zA-Z\s]+style|and\s+(?:upload\s+(?:it\s+)?privately|schedule\s+(?:it\s+)?.*|make\s+(?:it\s+)?.*))\b/gi, "")
        .replace(/\b(?:video|episode|today'?s)\b/gi, "")
        .replace(/\s+and\s*$/i, "")
        .trim();

      topic = topic.replace(/^the\s+/i, "The ");
    }

    // Clean trivial topics
    if (topic && (/^(?:a|the|today'?s)?\s*video$/i.test(topic) || topic.length < 2)) {
      topic = undefined;
    }

    return {
      topic,
      durationSeconds,
      format,
      tone,
      language: "en",
      publishMode,
      publishAt,
      channel,
      style,
      instructions: raw,
    };
  }
}
