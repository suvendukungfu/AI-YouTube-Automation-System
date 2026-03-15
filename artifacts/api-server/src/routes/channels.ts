import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { channelsTable } from "@workspace/db/schema";
import { CreateChannelBody, ListChannelsResponse, GetChannelResponse } from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/channels", async (_req, res) => {
  const channels = await db.select().from(channelsTable).orderBy(channelsTable.createdAt);
  const data = ListChannelsResponse.parse(
    channels.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
    }))
  );
  res.json(data);
});

router.post("/channels", async (req, res) => {
  const body = CreateChannelBody.parse(req.body);
  const [channel] = await db.insert(channelsTable).values(body).returning();
  const data = GetChannelResponse.parse({ ...channel, createdAt: channel.createdAt.toISOString() });
  res.status(201).json(data);
});

router.get("/channels/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [channel] = await db.select().from(channelsTable).where(eq(channelsTable.id, id));
  if (!channel) return res.status(404).json({ error: "Not found" });
  const data = GetChannelResponse.parse({ ...channel, createdAt: channel.createdAt.toISOString() });
  res.json(data);
});

export default router;
