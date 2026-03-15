import { pgTable, serial, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const nichesTable = pgTable("niches", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  competition: text("competition").notNull(),
  earning_potential: text("earning_potential").notNull(),
  cpm: real("cpm").notNull(),
  description: text("description").notNull(),
  aiTools: text("ai_tools").array().notNull().default([]),
  exampleChannels: text("example_channels").array().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNicheSchema = createInsertSchema(nichesTable).omit({ id: true, createdAt: true });
export type InsertNiche = z.infer<typeof insertNicheSchema>;
export type Niche = typeof nichesTable.$inferSelect;
