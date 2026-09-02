import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { productionJobsTable, jobLogsTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { jobOrchestrator } from "../pipeline/orchestrator";

const router: IRouter = Router();

const CreateJobRequest = z.object({
  channelId: z.number().int().positive(),
  title: z.string().min(1),
  topic: z.string().min(1),
  targetDurationSeconds: z.number().int().positive().optional().default(180),
  idempotencyKey: z.string().optional(),
  autoRun: z.boolean().optional().default(false),
});

const ListJobsQuery = z.object({
  channelId: z.coerce.number().optional(),
  status: z.string().optional(),
});

function formatJob(job: typeof productionJobsTable.$inferSelect) {
  return {
    ...job,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}

// POST /jobs - Create new job (with idempotency support)
router.post("/jobs", async (req, res) => {
  try {
    const body = CreateJobRequest.parse(req.body);
    let job = await jobOrchestrator.createJob({
      channelId: body.channelId,
      title: body.title,
      topic: body.topic,
      targetDurationSeconds: body.targetDurationSeconds,
      idempotencyKey: body.idempotencyKey,
    });

    if (body.autoRun) {
      job = await jobOrchestrator.runFullPipeline(job.id);
    }

    res.status(201).json(formatJob(job));
  } catch (err: any) {
    res.status(400).json({ error: err?.message || "Failed to create job" });
  }
});

// GET /jobs - List jobs
router.get("/jobs", async (req, res) => {
  try {
    const query = ListJobsQuery.parse(req.query);
    const conditions = [];

    if (query.channelId) {
      conditions.push(eq(productionJobsTable.channelId, query.channelId));
    }
    if (query.status) {
      conditions.push(eq(productionJobsTable.status, query.status));
    }

    const jobs = conditions.length
      ? await db
          .select()
          .from(productionJobsTable)
          .where(and(...conditions))
          .orderBy(desc(productionJobsTable.createdAt))
      : await db
          .select()
          .from(productionJobsTable)
          .orderBy(desc(productionJobsTable.createdAt));

    res.json(jobs.map(formatJob));
  } catch (err: any) {
    res.status(400).json({ error: err?.message || "Failed to list jobs" });
  }
});

// GET /jobs/:id - Get job by ID
router.get("/jobs/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [job] = await db
    .select()
    .from(productionJobsTable)
    .where(eq(productionJobsTable.id, id));

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  res.json(formatJob(job));
});

// GET /jobs/:id/logs - Get job audit logs
router.get("/jobs/:id/logs", async (req, res) => {
  const id = parseInt(req.params.id);
  const logs = await db
    .select()
    .from(jobLogsTable)
    .where(eq(jobLogsTable.jobId, id))
    .orderBy(jobLogsTable.createdAt);

  res.json(
    logs.map((l) => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
    }))
  );
});

// POST /jobs/:id/advance - Advance to next single stage
router.post("/jobs/:id/advance", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await jobOrchestrator.advanceJob(id);
    res.json(formatJob(updated));
  } catch (err: any) {
    res.status(400).json({ error: err?.message || "Failed to advance job" });
  }
});

// POST /jobs/:id/run - Run full pipeline to completion
router.post("/jobs/:id/run", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await jobOrchestrator.runFullPipeline(id);
    res.json(formatJob(updated));
  } catch (err: any) {
    res.status(400).json({ error: err?.message || "Failed to execute pipeline" });
  }
});

// POST /jobs/:id/retry - Retry failed job
router.post("/jobs/:id/retry", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const retried = await jobOrchestrator.retryJob(id);
    res.json(formatJob(retried));
  } catch (err: any) {
    res.status(400).json({ error: err?.message || "Failed to retry job" });
  }
});

// POST /jobs/:id/cancel - Cancel active job
router.post("/jobs/:id/cancel", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const cancelled = await jobOrchestrator.cancelJob(id);
    res.json(formatJob(cancelled));
  } catch (err: any) {
    res.status(400).json({ error: err?.message || "Failed to cancel job" });
  }
});

export default router;
