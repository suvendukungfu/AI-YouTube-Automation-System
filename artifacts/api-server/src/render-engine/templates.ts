import type { RenderTemplate } from "./types";

export const RENDER_TEMPLATES: Record<string, RenderTemplate> = {
  CURIOSPHERE_CINEMATIC: {
    name: "CURIOSPHERE_CINEMATIC",
    description: "Flagship 1080p 60fps cinematic documentary render with Ken Burns motion, styled ASS subtitles, and dynamic audio ducking",
    resolution: "1920x1080",
    fps: 60,
    videoBitrate: "8500k",
    audioBitrate: "192k",
    burnSubtitles: true,
    enableKenBurns: true,
    duckBgm: true,
    bgmAttenuationDb: -14,
    colorGradeFilter: "eq=contrast=1.05:brightness=0.01:saturation=1.12",
  },
  CURIOSPHERE_FAST_PACED: {
    name: "CURIOSPHERE_FAST_PACED",
    description: "High-energy 1080p 30fps format with quick transitions and vibrant saturation",
    resolution: "1920x1080",
    fps: 30,
    videoBitrate: "6000k",
    audioBitrate: "192k",
    burnSubtitles: true,
    enableKenBurns: false,
    duckBgm: true,
    bgmAttenuationDb: -12,
    colorGradeFilter: "eq=contrast=1.08:saturation=1.20",
  },
  CURIOSPHERE_DOCUMENTARY: {
    name: "CURIOSPHERE_DOCUMENTARY",
    description: "Smooth 1080p 30fps documentary format with gentle crossfades and subtle audio leveling",
    resolution: "1920x1080",
    fps: 30,
    videoBitrate: "6500k",
    audioBitrate: "192k",
    burnSubtitles: true,
    enableKenBurns: true,
    duckBgm: true,
    bgmAttenuationDb: -16,
    colorGradeFilter: "eq=contrast=1.02:saturation=1.05",
  },
};

export function getRenderTemplate(name?: string): RenderTemplate {
  if (name && RENDER_TEMPLATES[name]) {
    return RENDER_TEMPLATES[name];
  }
  return RENDER_TEMPLATES.CURIOSPHERE_CINEMATIC;
}
