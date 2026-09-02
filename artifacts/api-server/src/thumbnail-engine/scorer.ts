import type { ThumbnailVariant, ThumbnailStyleConfig } from "./types";

export class ThumbnailScorer {
  /**
   * Scores word count conciseness (ideal YouTube thumbnail is 2-4 words)
   */
  static scoreWordCount(headline: string): number {
    const wordCount = headline.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount >= 2 && wordCount <= 3) return 100;
    if (wordCount === 4) return 92;
    if (wordCount === 1) return 85;
    if (wordCount === 5) return 70;
    return 50; // Overly verbose text
  }

  /**
   * Evaluates contrast and readability rating based on style profile
   */
  static scoreContrast(style: ThumbnailStyleConfig): number {
    if (style.name === "CYBER_GLOW") return 96.5;
    if (style.name === "WARNING_ACCENT") return 94.0;
    if (style.name === "STAT_FOCUS") return 91.0;
    return 88.0;
  }

  /**
   * Computes overall score and selects the preferred variant
   */
  static rankAndSelectPreferred(variants: ThumbnailVariant[]): ThumbnailVariant[] {
    if (variants.length === 0) return [];

    // Calculate overall score
    const scored = variants.map((v) => {
      const overall = Number(((v.contrastScore * 0.55) + (v.wordCountScore * 0.45)).toFixed(1));
      return {
        ...v,
        overallScore: overall,
        isPreferred: false,
      };
    });

    // Sort descending by overall score
    scored.sort((a, b) => b.overallScore - a.overallScore);

    // Flag the highest scoring variant as preferred
    scored[0].isPreferred = true;

    return scored;
  }
}
