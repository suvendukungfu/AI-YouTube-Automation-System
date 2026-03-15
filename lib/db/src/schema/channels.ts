import { pgTable, serial, text, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const channelsTable = pgTable("channels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  niche: text("niche").notNull(),
  subscribers: integer("subscribers").notNull().default(0),
  totalViews: integer("total_views").notNull().default(0),
  monthlyRevenue: real("monthly_revenue").notNull().default(0),
  videosPublished: integer("videos_published").notNull().default(0),
  status: text("status").notNull().default("growing"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertChannelSchema = createInsertSchema(channelsTable).omit({ id: true, createdAt: true });
export type InsertChannel = z.infer<typeof insertChannelSchema>;
export type Channel = typeof channelsTable.$inferSelect;
