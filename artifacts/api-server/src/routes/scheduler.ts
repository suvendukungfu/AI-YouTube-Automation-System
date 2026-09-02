import { Router, type IRouter } from "express";
import { z } from "zod";
import { dailyScheduler } from "../scheduler/service";

const router: IRouter = Router();

const TriggerDailySchema = z.object({
  force: z.boolean().optional().default(false),
  dryRun: z.boolean().optional().default(false),
  customTopic: z.string().optional(),
  publishMode: z.enum(["PRIVATE", "UNLISTED", "PUBLIC", "NONE"]).optional(),
});

// GET /scheduler/status
router.get("/scheduler/status", (req, res) => {
  res.json(dailyScheduler.getStatus());
});

// POST /scheduler/trigger
router.post("/scheduler/trigger", async (req, res) => {
  try {
    const options = TriggerDailySchema.parse(req.body || {});
    const result = await dailyScheduler.triggerDailyRun(options);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to trigger daily run" });
  }
});

// POST /scheduler/pause
router.post("/scheduler/pause", (req, res) => {
  dailyScheduler.pause();
  res.json({ message: "Daily automation paused", ...dailyScheduler.getStatus() });
});

// POST /scheduler/resume
router.post("/scheduler/resume", (req, res) => {
  dailyScheduler.resume();
  res.json({ message: "Daily automation resumed", ...dailyScheduler.getStatus() });
});

// GET /scheduler/history
router.get("/scheduler/history", (req, res) => {
  res.json(dailyScheduler.getHistory());
});

export default router;
