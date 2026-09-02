import crypto from "node:crypto";
import fs from "node:fs";
import type {
  IYouTubeUploader,
  YouTubeUploadRequest,
  YouTubeUploadResult,
  YouTubeHealthCheck,
  OAuthTokens,
} from "../types";

export class DeterministicMockYouTubeUploader implements IYouTubeUploader {
  readonly name = "deterministic-mock";

  async checkHealth(): Promise<YouTubeHealthCheck> {
    return {
      healthy: true,
      provider: this.name,
      authenticated: true,
      channelId: "UC_CurioSphere_MockChannel",
      channelTitle: "CurioSphere (Official)",
      quotaEstimatedAvailable: true,
    };
  }

  getAuthUrl(): string {
    return "https://accounts.google.com/o/oauth2/v2/auth?client_id=mock-client-id&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fyoutube%2Fcallback&response_type=code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fyoutube.upload&access_type=offline";
  }

  async exchangeAuthCode(_code: string): Promise<OAuthTokens> {
    return {
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
      expiresAt: Date.now() + 3600 * 1000,
    };
  }

  async uploadThumbnail(_videoId: string, thumbnailPath: string): Promise<boolean> {
    if (!fs.existsSync(thumbnailPath)) {
      throw new Error(`Thumbnail upload failed: file missing at "${thumbnailPath}"`);
    }
    return true;
  }

  async uploadVideo(request: YouTubeUploadRequest): Promise<YouTubeUploadResult> {
    const {
      jobId,
      videoFilePath,
      thumbnailFilePath,
      title,
      privacyStatus = "private",
      publishAt,
    } = request;

    if (!fs.existsSync(videoFilePath)) {
      throw new Error(`YouTube Upload Error: Video file missing at "${videoFilePath}"`);
    }

    // Generate deterministic 11-char YouTube-style video ID from job ID & title
    const hash = crypto.createHash("sha256").update(`job-${jobId}-${title}`).digest("base64url");
    const videoId = `cs_${hash.slice(0, 9)}`;

    let thumbnailUploaded = false;
    if (thumbnailFilePath && fs.existsSync(thumbnailFilePath)) {
      thumbnailUploaded = await this.uploadThumbnail(videoId, thumbnailFilePath);
    }

    return {
      videoId,
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      title,
      privacyStatus,
      publishAt,
      thumbnailUploaded,
      uploadedAt: new Date().toISOString(),
      isDuplicateSkipped: false,
    };
  }
}
