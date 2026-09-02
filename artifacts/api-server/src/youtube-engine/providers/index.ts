import type { IYouTubeUploader } from "../types";
import { DeterministicMockYouTubeUploader } from "./deterministic-mock";
import { LiveYouTubeUploader } from "./live-uploader";

export * from "./deterministic-mock";
export * from "./live-uploader";

export function getYouTubeUploader(preferredProvider?: string): IYouTubeUploader {
  const providerType = preferredProvider || process.env.YOUTUBE_PROVIDER || "deterministic-mock";

  switch (providerType.toLowerCase()) {
    case "live":
    case "youtube":
    case "live-youtube":
      return new LiveYouTubeUploader();
    case "mock":
    case "deterministic-mock":
    default:
      return new DeterministicMockYouTubeUploader();
  }
}
