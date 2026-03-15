import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { videosTable } from "@workspace/db/schema";
import {
  CreateVideoBody,
  ListVideosQueryParams,
  ListVideosResponse,
  GetVideoResponse,
  UpdateVideoBody,
  UpdateVideoResponse,
} from "@workspace/api-zod";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

function formatVideo(v: typeof videosTable.$inferSelect) {
  return {
    ...v,
    createdAt: v.createdAt.toISOString(),
    scheduledAt: v.scheduledAt?.toISOString() ?? undefined,
    publishedAt: v.publishedAt?.toISOString() ?? undefined,
    aiTool: v.aiTool ?? undefined,
    thumbnailUrl: v.thumbnailUrl ?? undefined,
    views: v.views ?? 0,
    revenue: v.revenue ?? 0,
  };
}

router.get("/videos", async (req, res) => {
  const params = ListVideosQueryParams.parse(req.query);
  const conditions = [];
  if (params.channelId) conditions.push(eq(videosTable.channelId, params.channelId));
  if (params.status) conditions.push(eq(videosTable.status, params.status));

  const videos = conditions.length
    ? await db.select().from(videosTable).where(and(...conditions)).orderBy(videosTable.createdAt)
    : await db.select().from(videosTable).orderBy(videosTable.createdAt);

  const data = ListVideosResponse.parse(videos.map(formatVideo));
  res.json(data);
});

router.post("/videos", async (req, res) => {
  const body = CreateVideoBody.parse(req.body);
  const [video] = await db.insert(videosTable).values(body).returning();
  const data = GetVideoResponse.parse(formatVideo(video));
  res.status(201).json(data);
});

router.get("/videos/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [video] = await db.select().from(videosTable).where(eq(videosTable.id, id));
  if (!video) return res.status(404).json({ error: "Not found" });
  const data = GetVideoResponse.parse(formatVideo(video));
  res.json(data);
});

router.patch("/videos/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const body = UpdateVideoBody.parse(req.body);
  const updateData: Record<string, unknown> = {};
  if (body.status !== undefined) updateData.status = body.status;
  if (body.views !== undefined) updateData.views = body.views;
  if (body.revenue !== undefined) updateData.revenue = body.revenue;
  if (body.scheduledAt !== undefined) updateData.scheduledAt = new Date(body.scheduledAt);

  const [video] = await db.update(videosTable).set(updateData).where(eq(videosTable.id, id)).returning();
  const data = UpdateVideoResponse.parse(formatVideo(video));
  res.json(data);
});

export default router;
