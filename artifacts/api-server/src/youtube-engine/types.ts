export type PrivacyStatus = "private" | "unlisted" | "public";

export interface YouTubeUploadRequest {
  jobId: number;
  videoFilePath: string;
  thumbnailFilePath?: string;
  title: string;
  description: string;
  tags?: string[];
  categoryId?: string; // default "28" (Science & Technology)
  privacyStatus?: PrivacyStatus;
  publishAt?: string; // ISO 8601 string for scheduled publish
  madeForKids?: boolean;
}

export interface YouTubeUploadResult {
  videoId: string;
  videoUrl: string;
  title: string;
  privacyStatus: PrivacyStatus;
  publishAt?: string;
  thumbnailUploaded: boolean;
  uploadedAt: string;
  isDuplicateSkipped?: boolean;
}

export interface YouTubeHealthCheck {
  healthy: boolean;
  provider: string;
  authenticated: boolean;
  channelId?: string;
  channelTitle?: string;
  quotaEstimatedAvailable: boolean;
  error?: string;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

export interface IYouTubeUploader {
  readonly name: string;
  uploadVideo(request: YouTubeUploadRequest): Promise<YouTubeUploadResult>;
  uploadThumbnail(videoId: string, thumbnailPath: string): Promise<boolean>;
  checkHealth(): Promise<YouTubeHealthCheck>;
  getAuthUrl(): string;
  exchangeAuthCode(code: string): Promise<OAuthTokens>;
}
