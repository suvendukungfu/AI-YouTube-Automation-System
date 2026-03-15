import { pgTable, serial, real, integer, text, timestamp } from "drizzle-orm/pg-core";

export const dailyEarningsTable = pgTable("daily_earnings", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  amount: real("amount").notNull().default(0),
  views: integer("views").notNull().default(0),
  videos: integer("videos").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
