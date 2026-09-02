import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type {
  IVisualProvider,
  SceneVisualPlan,
  VisualManifest,
  ManifestSceneEntry,
  VisualType,
  TransitionType,
  MotionEffect,
} from "./types";
import { getVisualProvider } from "./providers";
import type { ProductionJob } from "@workspace/db/schema";
import type { ScriptResult, VisualAssetsResult } from "../pipeline/types";

export interface CollectVisualsOptions {
  provider?: IVisualProvider;
  maxRetriesPerScene?: number;
  outputDir?: string;
}

export class VisualAssetEngine {
  private provider: IVisualProvider;

  constructor(provider?: IVisualProvider) {
    this.provider = provider || getVisualProvider();
  }

  /**
   * Normalizes raw script/storyboard scenes into a continuous, time-indexed SceneVisualPlan[]
   */
  public normalizeScenePlan(
    script: ScriptResult | any,
    productionPlan?: Array<any>,
    totalVoiceDurationSec = 180
  ): SceneVisualPlan[] {
    const rawScenes: Array<any> = productionPlan && productionPlan.length > 0
      ? productionPlan
      : script.scenes || [];

    if (rawScenes.length === 0) {
      throw new Error("Cannot create SceneVisualPlan from empty scene list");
    }

    // Calculate total raw duration to scale proportionally to audio track
    const totalRawSec = rawScenes.reduce((acc, s) => acc + (s.durationSeconds || s.estimatedDurationSec || 30), 0);
    const scaleFactor = totalVoiceDurationSec / Math.max(1, totalRawSec);

    let cumulativeSec = 0;
    const plans: SceneVisualPlan[] = [];

    const defaultMotions: MotionEffect[] = ["SLOW_ZOOM_IN", "SLOW_PAN_RIGHT", "DYNAMIC_TILT", "PARALLAX_FLOAT"];

    for (let i = 0; i < rawScenes.length; i++) {
      const raw = rawScenes[i];
      const sceneNum = raw.sceneNumber || i + 1;
      const sceneId = `scene-${sceneNum}`;

      const rawDuration = raw.durationSeconds || raw.estimatedDurationSec || 30;
      const isLast = i === rawScenes.length - 1;

      const durationSec = isLast
        ? Math.max(1, Math.round(totalVoiceDurationSec - cumulativeSec))
        : Math.max(1, Math.round(rawDuration * scaleFactor));

      const startSec = Math.round(cumulativeSec);
      const endSec = startSec + durationSec;
      cumulativeSec = endSec;

      // Map transition
      let transition: TransitionType = "CROSS_DISSOLVE";
      if (raw.transitionEffect && ["CROSS_DISSOLVE", "WHIP_PAN", "FADE_TO_BLACK", "SMOOTH_ZOOM", "CUT"].includes(raw.transitionEffect)) {
        transition = raw.transitionEffect;
      } else if (i === 0) {
        transition = "SMOOTH_ZOOM";
      } else if (isLast) {
        transition = "FADE_TO_BLACK";
      }

      // Map visual type
      const visualType: VisualType = raw.visualType || (i % 2 === 0 ? "B_ROLL_VIDEO" : "AI_GENERATED_IMAGE");
      const motionEffect: MotionEffect = raw.motionEffect || defaultMotions[i % defaultMotions.length];

      // Extract search queries
      const searchQueries: string[] = raw.bRollKeywords && Array.isArray(raw.bRollKeywords) && raw.bRollKeywords.length > 0
        ? raw.bRollKeywords
        : [raw.heading || "documentary mystery", "cinematic nature"];

      plans.push({
        sceneId,
        sceneNumber: sceneNum,
        startSec,
        endSec,
        durationSec,
        narrationReference: raw.narration || "",
        visualDescription: raw.visualPrompt || raw.visualDescription || raw.heading || "Cinematic visual",
        searchQueries,
        visualType,
        transition,
        motionEffect,
        onScreenText: raw.onScreenText,
      });
    }

    return plans;
  }

  /**
   * Collects, deduplicates, and saves visual assets for all scenes in a job
   */
  async collectJobVisuals(
    job: ProductionJob,
    scenePlans: SceneVisualPlan[],
    options?: CollectVisualsOptions
  ): Promise<{ manifest: VisualManifest; visualAssetsResult: VisualAssetsResult }> {
    const activeProvider = options?.provider || this.provider;
    const maxRetries = options?.maxRetriesPerScene ?? 3;

    // Define target directories
    const baseJobDir = options?.outputDir
      ? path.resolve(options.outputDir)
      : path.resolve(process.cwd(), `artifacts/media/jobs/${job.id}`);
    const assetsDir = path.join(baseJobDir, "assets");

    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }

    const manifestEntries: ManifestSceneEntry[] = [];
    const checksumRegistry = new Map<string, string>(); // SHA-256 -> first assetId
    let deduplicatedCount = 0;

    for (const plan of scenePlans) {
      let fetchedAsset: any = null;
      let lastError: any = null;

      // Retry Loop for Scene Asset Collection
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          fetchedAsset = await activeProvider.fetchVisualForScene({
            jobId: job.id,
            scenePlan: plan,
            targetDir: assetsDir,
            retryAttempt: attempt,
          });
          break;
        } catch (err: any) {
          lastError = err;
          console.warn(`[VisualAssetEngine] Scene ${plan.sceneId} fetch attempt ${attempt}/${maxRetries} failed: ${err.message}`);
          if (attempt < maxRetries) {
            await new Promise((res) => setTimeout(res, 200 * attempt));
          }
        }
      }

      // If all retries failed, generate emergency safe fallback
      if (!fetchedAsset) {
        console.error(`[VisualAssetEngine] Scene ${plan.sceneId} failed after ${maxRetries} attempts, generating safe fallback visual.`);
        const fallbackProvider = getVisualProvider("deterministic-mock");
        fetchedAsset = await fallbackProvider.fetchVisualForScene({
          jobId: job.id,
          scenePlan: plan,
          targetDir: assetsDir,
        });
      }

      // Checksum Duplicate Detection
      if (checksumRegistry.has(fetchedAsset.checksum)) {
        fetchedAsset.isDeduplicated = true;
        deduplicatedCount++;
      } else {
        checksumRegistry.set(fetchedAsset.checksum, fetchedAsset.assetId);
        fetchedAsset.isDeduplicated = false;
      }

      manifestEntries.push({
        sceneId: plan.sceneId,
        sceneNumber: plan.sceneNumber,
        timing: {
          startSec: plan.startSec,
          endSec: plan.endSec,
          durationSec: plan.durationSec,
        },
        narrationExcerpt: plan.narrationReference.slice(0, 100),
        visualDirective: {
          description: plan.visualDescription,
          type: plan.visualType,
          transition: plan.transition,
          motionEffect: plan.motionEffect,
          onScreenText: plan.onScreenText,
        },
        asset: fetchedAsset,
        status: lastError ? "FALLBACK" : "DOWNLOADED",
      });
    }

    const totalDurationSec = scenePlans.reduce((acc, p) => acc + p.durationSec, 0);

    const manifest: VisualManifest = {
      jobId: job.id,
      topic: job.topic,
      totalScenes: scenePlans.length,
      totalDurationSec,
      uniqueAssetsCount: checksumRegistry.size,
      deduplicatedCount,
      scenes: manifestEntries,
      generatedAt: new Date().toISOString(),
    };

    // Save visual manifest JSON to disk
    const manifestPath = path.join(baseJobDir, "visual_manifest.json");
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");

    // Validate generated manifest on disk
    this.validateManifest(manifest);

    // Map to pipeline VisualAssetsResult interface
    const bRollClips = manifestEntries
      .filter((e) => e.visualDirective.type === "B_ROLL_VIDEO")
      .map((e) => ({
        sceneNumber: e.sceneNumber,
        query: e.visualDirective.description,
        url: e.asset.fileUrl,
        provider: `${e.asset.source} (${e.asset.license.name})`,
      }));

    const aiImages = manifestEntries
      .filter((e) => e.visualDirective.type !== "B_ROLL_VIDEO")
      .map((e) => ({
        sceneNumber: e.sceneNumber,
        prompt: e.visualDirective.description,
        url: e.asset.fileUrl,
      }));

    return {
      manifest,
      visualAssetsResult: {
        bRollClips,
        aiImages,
      },
    };
  }

  /**
   * Validates that all files recorded in the manifest physically exist and match checksums
   */
  public validateManifest(manifest: VisualManifest): { valid: boolean; verifiedCount: number } {
    let verifiedCount = 0;

    for (const entry of manifest.scenes) {
      const filePath = entry.asset.localFilePath;

      if (!fs.existsSync(filePath)) {
        throw new Error(`Visual Manifest Validation Error: Scene ${entry.sceneId} asset file missing at "${filePath}"`);
      }

      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        throw new Error(`Visual Manifest Validation Error: Scene ${entry.sceneId} asset file is 0 bytes`);
      }

      const fileBuffer = fs.readFileSync(filePath);
      const actualChecksum = crypto.createHash("sha256").update(fileBuffer).digest("hex");

      if (actualChecksum !== entry.asset.checksum) {
        throw new Error(
          `Visual Manifest Validation Error: Checksum mismatch for ${entry.sceneId}. Expected: ${entry.asset.checksum}, Actual: ${actualChecksum}`
        );
      }

      verifiedCount++;
    }

    return { valid: true, verifiedCount };
  }
}

export const visualAssetEngine = new VisualAssetEngine();
