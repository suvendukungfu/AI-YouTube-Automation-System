import { pgTable, serial, text, integer, timestamp, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const JOB_STATUSES = [
  "IDEA",
  "RESEARCHING",
  "RESEARCHED",
  "SCRIPTING",
  "SCRIPT_READY",
  "VOICE_GENERATING",
  "VOICE_READY",
  "ASSETS_COLLECTING",
  "ASSETS_READY",
  "RENDERING",
  "RENDERED",
  "THUMBNAIL_READY",
  "QA_PENDING",
  "QA_FAILED",
  "READY_TO_UPLOAD",
  "UPLOADING",
  "UPLOADED",
  "SCHEDULED",
  "PUBLISHED",
  "FAILED",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export const productionJobsTable = pgTable(
  "production_jobs",
  {
    id: serial("id").primaryKey(),
    idempotencyKey: text("idempotency_key").notNull(),
    channelId: integer("channel_id").notNull(),
    videoId: integer("video_id"),
    title: text("title").notNull(),
    topic: text("topic").notNull(),
    targetDurationSeconds: integer("target_duration_seconds").notNull().default(180),
    status: text("status").notNull().default("IDEA"),
    currentStage: text("current_stage").notNull().default("IDEA"),
    progressPercent: integer("progress_percent").notNull().default(0),
    errorDetails: jsonb("error_details").$type<{
      stage?: string;
      message?: string;
      stack?: string;
      timestamp?: string;
    }>(),
    retryCount: integer("retry_count").notNull().default(0),
    maxRetries: integer("max_retries").notNull().default(3),
    stageTimestamps: jsonb("stage_timestamps").$type<Record<string, string>>().notNull().default({}),
    researchData: jsonb("research_data").$type<{
      overview?: string;
      facts?: string[];
      sources?: string[];
      coreHook?: string;
    }>(),
    scriptData: jsonb("script_data").$type<{
      hook?: string;
      intro?: string;
      scenes?: Array<{
        sceneNumber: number;
        heading: string;
        narration: string;
        visualDescription: string;
        estimatedDurationSec: number;
      }>;
      outro?: string;
      callToAction?: string;
      wordCount?: number;
    }>(),
    voiceData: jsonb("voice_data").$type<{
      voiceName?: string;
      durationSec?: number;
      audioUrl?: string;
      format?: string;
    }>(),
    visualAssets: jsonb("visual_assets").$type<{
      bRollClips?: Array<{ sceneNumber: number; query: string; url: string; provider: string }>;
      aiImages?: Array<{ sceneNumber: number; prompt: string; url: string }>;
    }>(),
    renderData: jsonb("render_data").$type<{
      outputUrl?: string;
      resolution?: string;
      fps?: number;
      sizeBytes?: number;
      durationSec?: number;
    }>(),
    thumbnailData: jsonb("thumbnail_data").$type<{
      thumbnailUrl?: string;
      headline?: string;
      contrastScore?: number;
    }>(),
    metadata: jsonb("metadata").$type<{
      youtubeTitle?: string;
      description?: string;
      tags?: string[];
      hashtags?: string[];
      category?: string;
      youtubeVideoId?: string;
      youtubeUrl?: string;
      publishedAt?: string;
      scheduledFor?: string;
    }>(),
    qaResults: jsonb("qa_results").$type<{
      passed: boolean;
      checks?: Array<{ name: string; status: "PASSED" | "FAILED" | "WARNING"; details?: string }>;
    }>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("production_jobs_idempotency_idx").on(table.idempotencyKey),
  ]
);

export const jobLogsTable = pgTable("job_logs", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  level: text("level").notNull().default("info"), // "info" | "warn" | "error" | "debug"
  stage: text("stage").notNull(),
  message: text("message").notNull(),
  data: jsonb("data").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProductionJobSchema = createInsertSchema(productionJobsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJobLogSchema = createInsertSchema(jobLogsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertProductionJob = z.infer<typeof insertProductionJobSchema>;
export type ProductionJob = typeof productionJobsTable.$inferSelect;
export type InsertJobLog = z.infer<typeof insertJobLogSchema>;
export type JobLog = typeof jobLogsTable.$inferSelect;
