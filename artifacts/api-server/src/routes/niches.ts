import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { nichesTable } from "@workspace/db/schema";
import { CreateNicheBody, ListNichesResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/niches", async (_req, res) => {
  const niches = await db.select().from(nichesTable).orderBy(nichesTable.createdAt);
  const data = ListNichesResponse.parse(
    niches.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() }))
  );
  res.json(data);
});

router.post("/niches", async (req, res) => {
  const body = CreateNicheBody.parse(req.body);
  const [niche] = await db.insert(nichesTable).values(body).returning();
  res.status(201).json({ ...niche, createdAt: niche.createdAt.toISOString() });
});

export default router;
