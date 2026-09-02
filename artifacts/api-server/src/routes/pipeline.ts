import { Router, type IRouter } from "express";
import { z } from "zod";
import { pipelineOrchestrator } from "../pipeline/orchestrator";

const router: IRouter = Router();

const GeneratePipelineSchema = z.object({
  request: z.string().min(1),
});

// GET /pipeline/health
router.get("/pipeline/health", (req, res) => {
  res.json({
    healthy: true,
    engine: "curiosphere-unified-pipeline-v1",
    totalSteps: 10,
    supportedSteps: [
      "[1/10] Topic selected",
      "[2/10] Research complete",
      "[3/10] Script complete",
      "[4/10] Voice complete",
      "[5/10] Visuals complete",
      "[6/10] Subtitles complete",
      "[7/10] Rendering",
      "[8/10] Thumbnail complete",
      "[9/10] QA passed",
      "[10/10] YouTube upload complete",
    ],
  });
});

// POST /pipeline/generate
router.post("/pipeline/generate", async (req, res) => {
  try {
    const parsed = GeneratePipelineSchema.parse(req.body);
    const result = await pipelineOrchestrator.execute(parsed.request);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to execute pipeline" });
  }
});

export default router;
