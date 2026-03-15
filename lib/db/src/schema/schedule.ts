import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const scheduleTable = pgTable("schedule", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").notNull(),
  channelId: integer("channel_id").notNull(),
  videoTitle: text("video_title").notNull(),
  channelName: text("channel_name").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  status: text("status").notNull().default("pending"),
});
