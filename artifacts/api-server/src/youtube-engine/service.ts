import fs from "node:fs";
import path from "node:path";
import type {
  IYouTubeUploader,
  YouTubeUploadRequest,
  YouTubeUploadResult,
  PrivacyStatus,
} from "./types";
import { getYouTubeUploader } from "./providers";
import type { ProductionJob } from "@workspace/db/schema";
import type { VideoMetadata } from "../content-engine/schemas";

export interface YouTubeUploadServiceOptions {
  uploader?: IYouTubeUploader;
  privacyStatus?: PrivacyStatus;
  publishAt?: string;
  overwrite?: boolean;
}

export class YouTubeUploadService {
  private uploader: IYouTubeUploader;

  constructor(uploader?: IYouTubeUploader) {
    this.uploader = uploader || getYouTubeUploader();
  }

  /**
   * Uploads a rendered job video and preferred thumbnail with strict idempotency protection
   */
  async uploadJobVideo(
    job: ProductionJob,
    metadata?: Partial<VideoMetadata>,
    options?: YouTubeUploadServiceOptions
  ): Promise<YouTubeUploadResult> {
    const activeUploader = options?.uploader || this.uploader;

    const existingVideoId = (job.metadata as any)?.youtubeVideoId || (job as any).youtubeVideoId;

    // 1. Strict Idempotency Check: Prevent duplicate upload of the same job
    if (
      !options?.overwrite &&
      existingVideoId &&
      (job.status === "UPLOADED" || job.status === "SCHEDULED" || job.status === "PUBLISHED")
    ) {
      console.log(`[YouTubeUploadService] Job #${job.id} was already uploaded as "${existingVideoId}". Skipping duplicate upload.`);
      return {
        videoId: existingVideoId,
        videoUrl: `https://www.youtube.com/watch?v=${existingVideoId}`,
        title: job.title,
        privacyStatus: options?.privacyStatus || "private",
        publishAt: (job.metadata as any)?.scheduledFor,
        thumbnailUploaded: true,
        uploadedAt: (job.metadata as any)?.publishedAt || new Date().toISOString(),
        isDuplicateSkipped: true,
      };
    }

    // 2. Resolve Rendered MP4 Path
    const baseJobDir = path.resolve(process.cwd(), `artifacts/media/jobs/${job.id}`);
    const videoFilePath = path.join(baseJobDir, `rendered/job-${job.id}-1080p.mp4`);

    if (!fs.existsSync(videoFilePath)) {
      throw new Error(`YouTube Upload Error: Rendered MP4 video file missing at "${videoFilePath}". Render must complete first.`);
    }

    // 3. Resolve Preferred Thumbnail Path
    const thumbnailFilePath = path.join(baseJobDir, "thumbnails/master-thumb.svg");

    // 4. Map YouTube Metadata
    const jobMeta = metadata || (job.metadata as any);
    const title = jobMeta?.youtubeTitle || job.title;
    const description = jobMeta?.description || `${job.topic}\n\nProduced automatically by CurioSphere.`;
    const tags = jobMeta?.tags || [job.topic.toLowerCase(), "curiosphere", "science", "documentary"];

    const privacyStatus = options?.privacyStatus || (options?.publishAt ? "private" : "private");

    const uploadRequest: YouTubeUploadRequest = {
      jobId: job.id,
      videoFilePath,
      thumbnailFilePath: fs.existsSync(thumbnailFilePath) ? thumbnailFilePath : undefined,
      title,
      description,
      tags,
      categoryId: "28", // Science & Technology
      privacyStatus,
      publishAt: options?.publishAt,
      madeForKids: false,
    };

    console.log(`[YouTubeUploadService] Uploading video for Job #${job.id} (${title})...`);
    const result = await activeUploader.uploadVideo(uploadRequest);

    return result;
  }
}

export const youTubeUploadService = new YouTubeUploadService();
