import type { SubtitleSegment } from "./types";

export class TimestampValidator {
  /**
   * Format seconds to SRT timestamp: HH:MM:SS,mmm
   * Example: 75.25 -> "00:01:15,250"
   */
  static formatSRTTime(seconds: number): string {
    const totalMs = Math.max(0, Math.round(seconds * 1000));
    const hrs = Math.floor(totalMs / 3600000);
    const mins = Math.floor((totalMs % 3600000) / 60000);
    const secs = Math.floor((totalMs % 60000) / 1000);
    const ms = totalMs % 1000;

    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
  }

  /**
   * Format seconds to WebVTT timestamp: HH:MM:SS.mmm
   * Example: 75.25 -> "00:01:15.250"
   */
  static formatVTTTime(seconds: number): string {
    const totalMs = Math.max(0, Math.round(seconds * 1000));
    const hrs = Math.floor(totalMs / 3600000);
    const mins = Math.floor((totalMs % 3600000) / 60000);
    const secs = Math.floor((totalMs % 60000) / 1000);
    const ms = totalMs % 1000;

    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
  }

  /**
   * Format seconds to ASS (Advanced SubStation Alpha) timestamp: H:MM:SS.cc
   * Example: 75.25 -> "0:01:15.25"
   */
  static formatASSTime(seconds: number): string {
    const totalMs = Math.max(0, Math.round(seconds * 1000));
    const hrs = Math.floor(totalMs / 3600000);
    const mins = Math.floor((totalMs % 3600000) / 60000);
    const secs = Math.floor((totalMs % 60000) / 1000);
    const cs = Math.floor((totalMs % 1000) / 10); // centiseconds (2 digits)

    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
  }

  /**
   * Enforces timestamp integrity:
   * 1. startSec < endSec (minimum duration 0.3s)
   * 2. No overlapping cues (enforces minGap between consecutive segments)
   * 3. Monotonic ordering
   * 4. Clamping to total audio duration
   */
  static validateAndFixTimestamps(
    rawSegments: SubtitleSegment[],
    totalDurationSec?: number,
    minGapSec = 0.04
  ): SubtitleSegment[] {
    if (!rawSegments || rawSegments.length === 0) {
      return [];
    }

    // Sort by start time first
    const sorted = [...rawSegments].sort((a, b) => a.startSec - b.startSec);
    const fixed: SubtitleSegment[] = [];

    let lastEndSec = 0;

    for (let i = 0; i < sorted.length; i++) {
      const seg = sorted[i];
      let start = Math.max(0, seg.startSec);
      let end = seg.endSec;

      // Ensure start doesn't overlap with preceding segment
      if (i > 0 && start < lastEndSec + minGapSec) {
        start = lastEndSec + minGapSec;
      }

      // Ensure positive duration (minimum 0.3s)
      if (end <= start) {
        end = start + 0.3;
      }

      // Check against next segment to prevent overlap
      if (i < sorted.length - 1) {
        const nextStart = sorted[i + 1].startSec;
        if (end > nextStart - minGapSec) {
          end = Math.max(start + 0.2, nextStart - minGapSec);
        }
      }

      // Clamp to total duration if provided
      if (totalDurationSec && end > totalDurationSec) {
        end = totalDurationSec;
        if (start >= end) {
          start = Math.max(0, end - 0.5);
        }
      }

      const cleanText = seg.text.trim();
      if (cleanText.length > 0) {
        fixed.push({
          id: fixed.length + 1,
          startSec: Number(start.toFixed(3)),
          endSec: Number(end.toFixed(3)),
          text: cleanText,
          confidenceScore: seg.confidenceScore ?? 1.0,
        });

        lastEndSec = end;
      }
    }

    return fixed;
  }

  /**
   * Generates standard SubRip (.srt) subtitle string
   */
  static generateSRT(segments: SubtitleSegment[]): string {
    return segments
      .map((seg, idx) => {
        const start = this.formatSRTTime(seg.startSec);
        const end = this.formatSRTTime(seg.endSec);
        return `${idx + 1}\n${start} --> ${end}\n${seg.text}\n`;
      })
      .join("\n");
  }

  /**
   * Generates standard WebVTT (.vtt) subtitle string
   */
  static generateWebVTT(segments: SubtitleSegment[]): string {
    const lines = ["WEBVTT", ""];
    for (const seg of segments) {
      const start = this.formatVTTTime(seg.startSec);
      const end = this.formatVTTTime(seg.endSec);
      lines.push(`${start} --> ${end}`);
      lines.push(seg.text);
      lines.push("");
    }
    return lines.join("\n");
  }

  /**
   * Generates styled Advanced SubStation Alpha (.ass) for burning into video
   * Styled with CurioSphere's signature bold yellow/white glow typography
   */
  static generateASS(segments: SubtitleSegment[], title = "CurioSphere Video"): string {
    const header = `[Script Info]
Title: ${title}
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: CurioSphereMain,Montserrat,58,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,3.5,2.0,2,40,40,90,1
Style: CurioSphereAccent,Montserrat,58,&H0000FFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,4.0,2.5,2,40,40,90,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`;

    const events = segments.map((seg) => {
      const start = this.formatASSTime(seg.startSec);
      const end = this.formatASSTime(seg.endSec);
      // Clean ASS special chars
      const text = seg.text.replace(/\\/g, "").replace(/\n/g, " ");
      return `Dialogue: 0,${start},${end},CurioSphereMain,,0,0,0,,${text}`;
    });

    return `${header}\n${events.join("\n")}\n`;
  }
}
