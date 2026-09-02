import fs from "node:fs";
import path from "node:path";
import type {
  IThumbnailEngine,
  ThumbnailGenerationOptions,
  ThumbnailManifest,
  ThumbnailVariant,
} from "./types";
import { ThumbnailComposer, THUMBNAIL_STYLES } from "./composer";
import { ThumbnailScorer } from "./scorer";
import { ThumbnailValidator } from "./validator";
import type { ProductionJob } from "@workspace/db/schema";
import type { ScriptResult, ThumbnailResult } from "../pipeline/types";

export class ThumbnailEngine implements IThumbnailEngine {
  /**
   * Generates multiple styled 1280x720 thumbnail variants, scores them, and writes manifest
   */
  async generateThumbnails(options: ThumbnailGenerationOptions): Promise<ThumbnailManifest> {
    const { jobId, topic, concepts } = options;

    const baseJobDir = path.resolve(process.cwd(), `artifacts/media/jobs/${jobId}`);
    const thumbDir = options.outputDir
      ? path.resolve(options.outputDir)
      : path.join(baseJobDir, "thumbnails");

    if (!fs.existsSync(thumbDir)) {
      fs.mkdirSync(thumbDir, { recursive: true });
    }

    // Headline concepts for 3 variants
    const headlineCandidates = [
      concepts && concepts[0] ? ThumbnailComposer.extractShortHeadline(concepts[0]) : ThumbnailComposer.extractShortHeadline(topic),
      concepts && concepts[1] ? ThumbnailComposer.extractShortHeadline(concepts[1]) : "1,000 ATMOSPHERES",
      concepts && concepts[2] ? ThumbnailComposer.extractShortHeadline(concepts[2]) : "BOTTOMLESS ABYSS",
    ];

    const styles = [
      THUMBNAIL_STYLES.CYBER_GLOW,
      THUMBNAIL_STYLES.WARNING_ACCENT,
      THUMBNAIL_STYLES.STAT_FOCUS,
    ];

    const unrankedVariants: ThumbnailVariant[] = [];

    for (let i = 0; i < styles.length; i++) {
      const style = styles[i];
      const headline = headlineCandidates[i] || headlineCandidates[0];
      const variantLetter = String.fromCharCode(65 + i); // 'A', 'B', 'C'
      const variantId = `variant-${variantLetter}`;
      const filename = `${variantId}-thumb.svg`;
      const filePath = path.join(thumbDir, filename);

      // Compose graphic buffer
      const buffer = ThumbnailComposer.composeThumbnailBuffer(headline, style, topic);
      fs.writeFileSync(filePath, buffer);

      // Validate output
      const validation = ThumbnailValidator.validate(filePath);

      const contrastScore = ThumbnailScorer.scoreContrast(style);
      const wordCountScore = ThumbnailScorer.scoreWordCount(headline);

      unrankedVariants.push({
        variantId,
        headline,
        styleName: style.name,
        filePath,
        fileUrl: `/artifacts/media/jobs/${jobId}/thumbnails/${filename}`,
        dimensions: { width: 1280, height: 720, aspectRatio: "16:9" },
        fileSizeBytes: validation.sizeBytes,
        contrastScore,
        wordCountScore,
        overallScore: 0,
        isPreferred: false,
        checksum: validation.checksum,
      });
    }

    // Rank and select preferred variant
    const rankedVariants = ThumbnailScorer.rankAndSelectPreferred(unrankedVariants);
    const preferred = rankedVariants.find((v) => v.isPreferred) || rankedVariants[0];

    // Copy preferred thumbnail to master location for root access
    const masterPath = path.join(thumbDir, "master-thumb.svg");
    fs.copyFileSync(preferred.filePath, masterPath);

    // Also copy to general media thumbnails folder if exists
    const generalThumbDir = path.resolve(process.cwd(), "artifacts/media/thumbnails");
    if (!fs.existsSync(generalThumbDir)) {
      fs.mkdirSync(generalThumbDir, { recursive: true });
    }
    const legacyPath = path.join(generalThumbDir, `job-${jobId}-thumb.svg`);
    fs.copyFileSync(preferred.filePath, legacyPath);

    const manifest: ThumbnailManifest = {
      jobId,
      topic,
      totalVariants: rankedVariants.length,
      preferredVariantId: preferred.variantId,
      preferredThumbnailUrl: preferred.fileUrl,
      variants: rankedVariants,
      generatedAt: new Date().toISOString(),
    };

    // Save thumbnail manifest
    const manifestPath = path.join(thumbDir, "thumbnail_manifest.json");
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");

    return manifest;
  }

  /**
   * Pipeline helper to generate thumbnail for a ProductionJob
   */
  async generateJobThumbnails(job: ProductionJob, script?: ScriptResult): Promise<ThumbnailResult> {
    const concepts = script?.thumbnailConcepts
      ? (script.thumbnailConcepts as any[]).map((c) => c.textPrompt || c.headline || "")
      : undefined;

    const manifest = await this.generateThumbnails({
      jobId: job.id,
      topic: job.topic,
      concepts,
    });

    const preferred = manifest.variants.find((v) => v.isPreferred) || manifest.variants[0];

    return {
      thumbnailUrl: `/artifacts/media/jobs/${job.id}/thumbnails/master-thumb.svg`,
      headline: preferred.headline,
      contrastScore: preferred.overallScore,
    };
  }
}

export const thumbnailEngine = new ThumbnailEngine();
