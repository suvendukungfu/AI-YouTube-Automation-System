import type {
  DailyScheduleConfig,
  DailyRunOptions,
  DailyRunResult,
  IDailyScheduler,
  PublishMode,
} from "./types";
import { pipelineOrchestrator } from "../pipeline/orchestrator";
import { TopicSelector } from "../content-engine/topic-selector";

export class DailySchedulerService implements IDailyScheduler {
  private config: DailyScheduleConfig;
  private history: DailyRunResult[] = [];

  constructor(initialConfig?: Partial<DailyScheduleConfig>) {
    this.config = {
      channelName: "CurioSphere",
      defaultPublishMode: "PRIVATE", // Safe private default
      publishTimeOfDay: "19:00",
      targetDurationSeconds: 180,
      isPaused: false,
      maxDailyVideos: 1,
      ...initialConfig,
    };
  }

  static getTodayDateKey(): string {
    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(now.getUTCDate()).padStart(2, "0");
    return `curiosphere-daily-${yyyy}-${mm}-${dd}`;
  }

  getStatus() {
    return {
      config: { ...this.config },
      isPaused: this.config.isPaused,
      todayDateKey: DailySchedulerService.getTodayDateKey(),
    };
  }

  pause(): void {
    this.config.isPaused = true;
    console.log("[DailyScheduler] ⏸️ Automation PAUSED.");
  }

  resume(): void {
    this.config.isPaused = false;
    console.log("[DailyScheduler] ▶️ Automation RESUMED.");
  }

  getHistory(): DailyRunResult[] {
    return [...this.history];
  }

  /**
   * Executes today's automated production run with strict idempotency
   */
  async triggerDailyRun(options?: DailyRunOptions): Promise<DailyRunResult> {
    const dateKey = DailySchedulerService.getTodayDateKey();
    const executedAt = new Date().toISOString();

    // 1. Check Pause State
    if (this.config.isPaused && !options?.force) {
      console.log(`[DailyScheduler] Automation is currently paused. Skipping run for ${dateKey}.`);
      return {
        dateKey,
        jobId: 0,
        topic: "N/A",
        status: "PAUSED",
        isDuplicateSkipped: false,
        isDryRun: !!options?.dryRun,
        executedAt,
      };
    }

    // 2. Check Idempotency (prevent duplicate video generation for same day)
    const existing = this.history.find((r) => r.dateKey === dateKey && r.status === "COMPLETED");
    if (existing && !options?.force) {
      console.log(`[DailyScheduler] 🛡️ Video for ${dateKey} has already been produced. Skipping duplicate.`);
      return {
        ...existing,
        isDuplicateSkipped: true,
      };
    }

    // 3. Dry-Run Simulation Mode
    if (options?.dryRun) {
      const topic = options.customTopic || "The Mariana Trench: Earth's Deepest Abyss (Dry-Run)";
      console.log(`[DailyScheduler] 🧪 DRY-RUN: Simulating daily production for "${topic}" (${dateKey}).`);
      return {
        dateKey,
        jobId: 999999,
        topic,
        status: "COMPLETED",
        videoUrl: "https://www.youtube.com/watch?v=mock_dryrun_vid",
        publishAt: `${dateKey}T${this.config.publishTimeOfDay}:00.000Z`,
        isDuplicateSkipped: false,
        isDryRun: true,
        executedAt,
      };
    }

    // 4. Determine Topic
    let activeTopic = options?.customTopic;
    if (!activeTopic) {
      const selected = await TopicSelector.selectDailyTopic(this.config.channelName);
      activeTopic = selected.topic;
    }

    const publishMode: PublishMode = options?.publishMode || this.config.defaultPublishMode;
    const scheduledPublishAt = `${dateKey}T${this.config.publishTimeOfDay}:00.000Z`;

    console.log(`[DailyScheduler] 🎬 Starting daily production for: "${activeTopic}" (${dateKey})`);

    // 5. Execute 10-Step Pipeline
    const pipelineResult = await pipelineOrchestrator.execute({
      topic: activeTopic,
      durationSeconds: this.config.targetDurationSeconds,
      format: "LONG_FORM",
      tone: "curious and cinematic",
      language: "en",
      publishMode,
      publishAt: scheduledPublishAt,
      channel: this.config.channelName,
      style: "cinematic documentary",
    });

    const runResult: DailyRunResult = {
      dateKey,
      jobId: pipelineResult.jobId,
      topic: activeTopic,
      status: pipelineResult.status === "COMPLETED" ? "COMPLETED" : "FAILED",
      videoUrl: pipelineResult.stageResults.youtube?.videoUrl,
      publishAt: scheduledPublishAt,
      isDuplicateSkipped: false,
      isDryRun: false,
      executedAt,
      error: pipelineResult.error,
    };

    this.history.unshift(runResult);
    return runResult;
  }
}

export const dailyScheduler = new DailySchedulerService();
