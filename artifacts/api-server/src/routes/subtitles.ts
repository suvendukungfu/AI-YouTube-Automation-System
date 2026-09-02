import fs from "node:fs";
import path from "node:path";
import { Router, type IRouter } from "express";
import { z } from "zod";
import { getSubtitleProvider } from "../subtitle-engine/providers";
import { subtitleEngine } from "../subtitle-engine/engine";

const router: IRouter = Router();

const GenerateSubtitlesSchema = z.object({
  jobId: z.number().optional(),
  scriptText: z.string().min(1),
  audioDurationSec: z.number().positive(),
  maxWordsPerCue: z.number().optional(),
});

// GET /subtitles/health
router.get("/subtitles/health", async (req, res) => {
  try {
    const providerName = (req.query.provider as string) || process.env.SUBTITLE_PROVIDER || "whisper-local";
    const provider = getSubtitleProvider(providerName);
    const health = await provider.checkHealth();
    res.json(health);
  } catch (err: any) {
    res.status(500).json({ healthy: false, error: err.message || "Subtitle health check failed" });
  }
});

// POST /subtitles/generate
router.post("/subtitles/generate", async (req, res) => {
  try {
    const parsed = GenerateSubtitlesSchema.parse(req.body);
    const result = await subtitleEngine.generateSubtitles(parsed);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to generate subtitles" });
  }
});

// GET /subtitles/job/:jobId
router.get("/subtitles/job/:jobId", (req, res) => {
  try {
    const jobId = parseInt(req.params.jobId, 10);
    if (isNaN(jobId)) {
      res.status(400).json({ error: "Invalid Job ID" });
      return;
    }

    const subtitlesDir = path.resolve(process.cwd(), `artifacts/media/jobs/${jobId}/subtitles`);
    const srtPath = path.join(subtitlesDir, "subtitles.srt");
    const vttPath = path.join(subtitlesDir, "subtitles.vtt");
    const assPath = path.join(subtitlesDir, "subtitles.ass");

    if (!fs.existsSync(srtPath)) {
      res.status(404).json({ error: `No subtitles found for Job #${jobId}` });
      return;
    }

    const srtContent = fs.readFileSync(srtPath, "utf-8");
    const vttContent = fs.existsSync(vttPath) ? fs.readFileSync(vttPath, "utf-8") : null;
    const assContent = fs.existsSync(assPath) ? fs.readFileSync(assPath, "utf-8") : null;

    res.json({
      jobId,
      srtUrl: `/artifacts/media/jobs/${jobId}/subtitles/subtitles.srt`,
      vttUrl: `/artifacts/media/jobs/${jobId}/subtitles/subtitles.vtt`,
      assUrl: `/artifacts/media/jobs/${jobId}/subtitles/subtitles.ass`,
      srtContent,
      vttContent,
      assContent,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to read job subtitles" });
  }
});

export default router;
