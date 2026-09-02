import { Router, type IRouter } from "express";
import { z } from "zod";
import { getYouTubeUploader } from "../youtube-engine/providers";
import { youTubeUploadService } from "../youtube-engine/service";

const router: IRouter = Router();

const ScheduleRequestSchema = z.object({
  privacyStatus: z.enum(["private", "unlisted", "public"]).default("private"),
  publishAt: z.string().optional(),
});

// GET /youtube/health
router.get("/youtube/health", async (req, res) => {
  try {
    const uploader = getYouTubeUploader();
    const health = await uploader.checkHealth();
    res.json(health);
  } catch (err: any) {
    res.status(500).json({ healthy: false, error: err.message || "YouTube health check failed" });
  }
});

// GET /youtube/auth-url
router.get("/youtube/auth-url", (req, res) => {
  const uploader = getYouTubeUploader();
  const url = uploader.getAuthUrl();
  res.json({ authUrl: url });
});

// POST /youtube/upload/:jobId
router.post("/youtube/upload/:jobId", async (req, res) => {
  try {
    const jobId = parseInt(req.params.jobId, 10);
    if (isNaN(jobId)) {
      res.status(400).json({ error: "Invalid Job ID" });
      return;
    }

    const { privacyStatus, publishAt } = ScheduleRequestSchema.parse(req.body || {});

    // Create a minimal job structure or fetch from DB in production
    const dummyJob: any = {
      id: jobId,
      title: `CurioSphere Episode #${jobId}`,
      topic: "The Mariana Trench",
      status: "READY_TO_UPLOAD",
    };

    const result = await youTubeUploadService.uploadJobVideo(dummyJob, undefined, {
      privacyStatus,
      publishAt,
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to upload to YouTube" });
  }
});

export default router;
