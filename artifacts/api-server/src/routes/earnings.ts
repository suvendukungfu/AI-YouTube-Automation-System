import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { dailyEarningsTable, channelsTable } from "@workspace/db/schema";
import { GetEarningsResponse, GetDailyEarningsResponse } from "@workspace/api-zod";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/earnings", async (_req, res) => {
  const [channelStats] = await db.select({
    totalSubscribers: sql<number>`cast(sum(${channelsTable.subscribers}) as integer)`,
    totalViews: sql<number>`cast(sum(${channelsTable.totalViews}) as integer)`,
    activeChannels: sql<number>`cast(count(*) as integer)`,
    monthlyRevenue: sql<number>`cast(sum(${channelsTable.monthlyRevenue}) as double precision)`,
  }).from(channelsTable);

  const earningsRows = await db.select().from(dailyEarningsTable).orderBy(dailyEarningsTable.date);

  const totalEarnings = earningsRows.reduce((s, r) => s + (r.amount || 0), 0);
  const today = new Date().toISOString().slice(0, 10);
  const todayRow = earningsRows.find((r) => r.date === today);
  const todayEarnings = todayRow?.amount ?? 0;
  const TARGET_DAILY = 50000;
  const progressPercent = Math.min(100, (todayEarnings / TARGET_DAILY) * 100);

  const data = GetEarningsResponse.parse({
    todayEarnings,
    monthlyEarnings: channelStats?.monthlyRevenue ?? 0,
    totalEarnings,
    targetDaily: TARGET_DAILY,
    progressPercent,
    totalSubscribers: channelStats?.totalSubscribers ?? 0,
    totalViews: channelStats?.totalViews ?? 0,
    activeChannels: Number(channelStats?.activeChannels ?? 0),
  });
  res.json(data);
});

router.get("/earnings/daily", async (_req, res) => {
  const rows = await db.select().from(dailyEarningsTable).orderBy(dailyEarningsTable.date);
  const data = GetDailyEarningsResponse.parse(rows.map((r) => ({ ...r })));
  res.json(data);
});

export default router;
