import fs from "node:fs";
import path from "node:path";
import { Router, type IRouter } from "express";
import { z } from "zod";
import { thumbnailEngine } from "../thumbnail-engine/engine";
import { THUMBNAIL_STYLES } from "../thumbnail-engine/composer";

const router: IRouter = Router();

const GenerateThumbnailSchema = z.object({
  jobId: z.number(),
  topic: z.string().min(1),
  concepts: z.array(z.string()).optional(),
});

// GET /thumbnails/health
router.get("/thumbnails/health", (req, res) => {
  res.json({
    healthy: true,
    engine: "vector-svg-thumbnail-composer-v1",
    availableStyles: Object.keys(THUMBNAIL_STYLES),
    resolution: "1280x720",
    maxFileSizeBytes: 2 * 1024 * 1024,
  });
});

// GET /thumbnails/manifest/:jobId
router.get("/thumbnails/manifest/:jobId", (req, res) => {
  try {
    const jobId = parseInt(req.params.jobId, 10);
    if (isNaN(jobId)) {
      res.status(400).json({ error: "Invalid Job ID" });
      return;
    }

    const manifestPath = path.resolve(process.cwd(), `artifacts/media/jobs/${jobId}/thumbnails/thumbnail_manifest.json`);
    if (!fs.existsSync(manifestPath)) {
      res.status(404).json({ error: `No thumbnail manifest found for Job #${jobId}` });
      return;
    }

    const content = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    res.json(content);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to read thumbnail manifest" });
  }
});

// POST /thumbnails/generate
router.post("/thumbnails/generate", async (req, res) => {
  try {
    const parsed = GenerateThumbnailSchema.parse(req.body);
    const manifest = await thumbnailEngine.generateThumbnails(parsed);
    res.json(manifest);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to generate thumbnails" });
  }
});

export default router;
