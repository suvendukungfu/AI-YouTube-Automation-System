import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { scheduleTable } from "@workspace/db/schema";
import { GetScheduleResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/schedule", async (_req, res) => {
  const entries = await db.select().from(scheduleTable).orderBy(scheduleTable.scheduledAt);
  const data = GetScheduleResponse.parse(
    entries.map((e) => ({ ...e, scheduledAt: e.scheduledAt.toISOString() }))
  );
  res.json(data);
});

export default router;
