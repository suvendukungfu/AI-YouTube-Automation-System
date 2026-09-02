export type PublishMode = "PRIVATE" | "UNLISTED" | "PUBLIC" | "NONE";

export interface DailyScheduleConfig {
  channelName: string;
  defaultPublishMode: PublishMode;
  publishTimeOfDay: string; // "19:00"
  targetDurationSeconds: number;
  isPaused: boolean;
  maxDailyVideos: number;
}

export interface DailyRunOptions {
  force?: boolean;
  dryRun?: boolean;
  customTopic?: string;
  publishMode?: PublishMode;
}

export interface DailyRunResult {
  dateKey: string;
  jobId: number;
  topic: string;
  status: "COMPLETED" | "SKIPPED" | "PAUSED" | "FAILED";
  videoUrl?: string;
  publishAt?: string;
  isDuplicateSkipped: boolean;
  isDryRun: boolean;
  executedAt: string;
  error?: string;
}

export interface IDailyScheduler {
  triggerDailyRun(options?: DailyRunOptions): Promise<DailyRunResult>;
  pause(): void;
  resume(): void;
  getStatus(): { config: DailyScheduleConfig; isPaused: boolean; todayDateKey: string };
  getHistory(): DailyRunResult[];
}
