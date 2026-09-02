export interface ParsedCommand {
  rawCommand: string;
  channelName: string;
  topic?: string;
  targetDurationSeconds?: number;
  isAutoTopic: boolean;
  privacyStatus?: "private" | "unlisted" | "public";
  scheduledTime?: string;
}

export class CommandParser {
  static parse(command: string): ParsedCommand {
    const raw = command.trim();
    let cleaned = raw;

    // Detect privacy status directives
    let privacyStatus: "private" | "unlisted" | "public" = "private";
    if (/\b(?:unlisted)\b/i.test(cleaned)) {
      privacyStatus = "unlisted";
    } else if (/\b(?:public|publish immediately)\b/i.test(cleaned)) {
      privacyStatus = "public";
    } else if (/\b(?:private|privately)\b/i.test(cleaned)) {
      privacyStatus = "private";
    }

    // Detect scheduled time directives (e.g., "for 7 PM", "at 19:00", "schedule for 8:30 PM")
    let scheduledTime: string | undefined;
    const scheduleMatch = cleaned.match(/(?:schedule(?:\s+it)?\s+for|at)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i);
    if (scheduleMatch) {
      scheduledTime = scheduleMatch[1].trim();
      cleaned = cleaned.replace(scheduleMatch[0], "").trim();
    }

    // Detect duration modifiers like "for 3 minutes", "for 180 seconds", "120s"
    let targetDurationSeconds: number | undefined;
    const durationMatch = cleaned.match(/(?:for\s+)?(\d+)\s*(?:minutes|minute|mins|min|seconds|second|secs|sec|s)\b/i);
    if (durationMatch) {
      const value = parseInt(durationMatch[1], 10);
      const isMinutes = /min/i.test(durationMatch[0]);
      targetDurationSeconds = isMinutes ? value * 60 : value;
      cleaned = cleaned.replace(durationMatch[0], "").trim();
    }

    // Detect channel name (e.g. "CurioSphere", "Tech Simplified", "Business Blueprint")
    let channelName = "CurioSphere";
    const channelMatch = cleaned.match(/(?:curiosphere|tech simplified|ai money mastery|business blueprint)/i);
    if (channelMatch) {
      channelName = channelMatch[0];
    }

    // Extract topic following keywords like "about", "on", "regarding", "discussing"
    let topic: string | undefined;
    const topicRegex = /(?:about|on|regarding|discussing|exploring)\s+([^.]+)/i;
    const match = cleaned.match(topicRegex);

    if (match && match[1]) {
      topic = match[1]
        .replace(/^[":\s]+|[":\s]+$/g, "")
        .replace(/\b(?:and\s+(?:make\s+it\s+)?(?:unlisted|private|public|upload\s+privately|schedule(?:\s+it)?(?:\s+for\s+.*)?))\b/gi, "")
        .replace(/\b(?:video|episode|today'?s)\b/gi, "")
        .trim();
      
      // Capitalize first letters
      topic = topic.replace(/^the\s+/i, "The ");
    }

    // Check if topic is missing or trivial
    const isAutoTopic = !topic || topic.length < 2 || /^(?:a|the|today'?s)?\s*video$/i.test(topic);

    return {
      rawCommand: command,
      channelName,
      topic: isAutoTopic ? undefined : topic,
      targetDurationSeconds: targetDurationSeconds || 180,
      isAutoTopic,
      privacyStatus,
      scheduledTime,
    };
  }
}
