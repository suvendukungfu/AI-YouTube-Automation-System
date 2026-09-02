import fs from "node:fs";
import path from "node:path";
import { Router, type IRouter } from "express";
import { z } from "zod";
import { videoRenderEngine } from "../render-engine/engine";
import { RENDER_TEMPLATES } from "../render-engine/templates";

const router: IRouter = Router();

const RenderRequestSchema = z.object({
  jobId: z.number(),
  topic: z.string().min(1),
  audioFilePath: z.string().min(1),
  audioDurationSec: z.number().positive(),
  visualManifestPath: z.string().min(1),
  subtitlesPath: z.string().optional(),
  templateName: z.string().optional(),
  overwrite: z.boolean().optional(),
});

// GET /render/health
router.get("/render/health", async (req, res) => {
  try {
    const health = await videoRenderEngine.checkHealth();
    res.json(health);
  } catch (err: any) {
    res.status(500).json({ healthy: false, error: err.message || "Render health check failed" });
  }
});

// GET /render/templates
router.get("/render/templates", (req, res) => {
  res.json(RENDER_TEMPLATES);
});

// GET /render/manifest/:jobId
router.get("/render/manifest/:jobId", (req, res) => {
  try {
    const jobId = parseInt(req.params.jobId, 10);
    if (isNaN(jobId)) {
      res.status(400).json({ error: "Invalid Job ID" });
      return;
    }

    const manifestPath = path.resolve(process.cwd(), `artifacts/media/jobs/${jobId}/render_manifest.json`);
    if (!fs.existsSync(manifestPath)) {
      res.status(404).json({ error: `No render manifest found for Job #${jobId}` });
      return;
    }

    const content = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    res.json(content);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to read render manifest" });
  }
});

// POST /render/trigger
router.post("/render/trigger", async (req, res) => {
  try {
    const parsed = RenderRequestSchema.parse(req.body);
    const manifest = await videoRenderEngine.renderVideo(
      {
        jobId: parsed.jobId,
        topic: parsed.topic,
        audioFilePath: parsed.audioFilePath,
        audioDurationSec: parsed.audioDurationSec,
        visualManifestPath: parsed.visualManifestPath,
        subtitlesPath: parsed.subtitlesPath,
      },
      {
        templateName: parsed.templateName,
        overwrite: parsed.overwrite,
      }
    );
    res.json(manifest);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to render video" });
  }
});

export default router;
