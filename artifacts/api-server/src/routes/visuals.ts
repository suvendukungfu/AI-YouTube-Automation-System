import fs from "node:fs";
import path from "node:path";
import { Router, type IRouter } from "express";
import { z } from "zod";
import { getVisualProvider } from "../visual-engine/providers";

const router: IRouter = Router();

const SearchQuery = z.object({
  query: z.string().min(1),
  type: z.enum(["video", "image"]).default("video"),
});

// GET /visuals/health
router.get("/visuals/health", async (req, res) => {
  try {
    const providerName = (req.query.provider as string) || process.env.VISUAL_PROVIDER || "free-stock";
    const provider = getVisualProvider(providerName);
    const health = await provider.checkHealth();
    res.json(health);
  } catch (err: any) {
    res.status(500).json({ healthy: false, error: err.message || "Visual health check failed" });
  }
});

// GET /visuals/search
router.get("/visuals/search", async (req, res) => {
  try {
    const { query, type } = SearchQuery.parse(req.query);
    const provider = getVisualProvider();
    const results = await provider.searchAssets(query, type);
    res.json(results);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to search visual assets" });
  }
});

// GET /visuals/manifest/:jobId
router.get("/visuals/manifest/:jobId", (req, res) => {
  try {
    const jobId = parseInt(req.params.jobId, 10);
    if (isNaN(jobId)) {
      res.status(400).json({ error: "Invalid Job ID" });
      return;
    }

    const manifestPath = path.resolve(process.cwd(), `artifacts/media/jobs/${jobId}/visual_manifest.json`);
    if (!fs.existsSync(manifestPath)) {
      res.status(404).json({ error: `No visual manifest found for Job #${jobId}` });
      return;
    }

    const content = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    res.json(content);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to read manifest" });
  }
});

export default router;
