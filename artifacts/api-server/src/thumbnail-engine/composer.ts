import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { ThumbnailStyleConfig } from "./types";

export const THUMBNAIL_STYLES: Record<string, ThumbnailStyleConfig> = {
  CYBER_GLOW: {
    name: "CYBER_GLOW",
    badgeText: "CURIOSPHERE EXCLUSIVE",
    badgeBgColor: "#00F0FF",
    textColor: "#FFFFFF",
    accentColor: "#FFD700",
    gradientOverlay: "rgba(5, 10, 25, 0.75)",
    glowEffect: true,
  },
  WARNING_ACCENT: {
    name: "WARNING_ACCENT",
    badgeText: "TRUE DISCOVERY",
    badgeBgColor: "#FF2A2A",
    textColor: "#FFFFFF",
    accentColor: "#FF3366",
    gradientOverlay: "rgba(20, 5, 10, 0.80)",
    glowEffect: true,
  },
  STAT_FOCUS: {
    name: "STAT_FOCUS",
    badgeText: "SCIENTIFIC RECORD",
    badgeBgColor: "#10B981",
    textColor: "#FFFFFF",
    accentColor: "#34D399",
    gradientOverlay: "rgba(5, 20, 15, 0.75)",
    glowEffect: false,
  },
};

export class ThumbnailComposer {
  /**
   * Sanitizes and extracts a short 2-4 word high-CTR headline from a concept or topic
   */
  static extractShortHeadline(text: string, fallback = "THE DEEP TRUTH"): string {
    if (!text || text.trim().length === 0) return fallback;

    // Remove punctuation
    const clean = text.replace(/[^\w\s]/g, "").trim();
    const words = clean.split(/\s+/).filter(Boolean);

    if (words.length <= 4) {
      return words.join(" ").toUpperCase();
    }

    // Pick most impactful words
    return words.slice(0, 4).join(" ").toUpperCase();
  }

  /**
   * Generates a valid 1280x720 SVG/PNG graphic buffer with bold typography and CurioSphere branding
   */
  static composeThumbnailBuffer(
    headline: string,
    style: ThumbnailStyleConfig,
    topic: string
  ): Buffer {
    const words = headline.split(" ");
    const line1 = words.slice(0, Math.ceil(words.length / 2)).join(" ");
    const line2 = words.slice(Math.ceil(words.length / 2)).join(" ");

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <!-- Background Gradient -->
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="70%" fx="60%" fy="30%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="60%" stop-color="#090d16" />
      <stop offset="100%" stop-color="#020408" />
    </radialGradient>

    <!-- Overlay Vignette -->
    <linearGradient id="vignette" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(0,0,0,0.85)" />
      <stop offset="40%" stop-color="rgba(0,0,0,0.4)" />
      <stop offset="100%" stop-color="rgba(0,0,0,0.9)" />
    </linearGradient>

    <!-- Text Glow / Drop Shadow Filter -->
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="4" dy="6" stdDeviation="6" flood-color="#000000" flood-opacity="0.95" />
      <feDropShadow dx="-2" dy="-2" stdDeviation="4" flood-color="#000000" flood-opacity="0.8" />
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="1280" height="720" fill="url(#bgGrad)" />

  <!-- Thematic Atmospheric Graphic Elements -->
  <circle cx="1050" cy="360" r="320" fill="${style.accentColor}" opacity="0.15" filter="blur(60px)" />
  <circle cx="200" cy="550" r="260" fill="${style.badgeBgColor}" opacity="0.12" filter="blur(50px)" />

  <!-- Contrast Vignette Overlay -->
  <rect width="1280" height="720" fill="url(#vignette)" />

  <!-- Top Left Channel Badge -->
  <g transform="translate(60, 60)">
    <rect width="260" height="42" rx="8" fill="${style.badgeBgColor}" />
    <text x="130" y="27" fill="#000000" font-family="Montserrat, Arial, sans-serif" font-size="14" font-weight="900" text-anchor="middle" letter-spacing="2">
      ${style.badgeText}
    </text>
  </g>

  <!-- Main Ultra-Bold Headline -->
  <g transform="translate(60, 360)" filter="url(#shadow)">
    <text x="0" y="0" fill="${style.textColor}" font-family="Montserrat, Impact, Arial, sans-serif" font-size="96" font-weight="900" letter-spacing="-1">
      ${line1}
    </text>
    ${
      line2
        ? `<text x="0" y="105" fill="${style.accentColor}" font-family="Montserrat, Impact, Arial, sans-serif" font-size="96" font-weight="900" letter-spacing="-1">
      ${line2}
    </text>`
        : ""
    }
  </g>

  <!-- Bottom Topic Identifier -->
  <g transform="translate(60, 640)">
    <text x="0" y="0" fill="rgba(255,255,255,0.7)" font-family="Montserrat, Arial, sans-serif" font-size="20" font-weight="700" letter-spacing="1">
      CURIOSPHERE • ${topic.toUpperCase()}
    </text>
  </g>
</svg>`;

    return Buffer.from(svg, "utf-8");
  }
}
