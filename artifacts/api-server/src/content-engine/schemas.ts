import { z } from "zod";

// 1. Channel Configuration Profile
export const ChannelProfileSchema = z.object({
  channelName: z.string().default("CurioSphere"),
  language: z.string().default("English (US)"),
  targetDurationSeconds: z.number().int().min(30).max(1800).default(180),
  tone: z.string().default("Wonder-filled, authoritative, curiosity-driven"),
  narrationStyle: z.string().default("Immersive documentarian, cinematic pacing"),
  niche: z.string().default("Deep Science, History Mysteries & Nature Wonders"),
  audience: z.string().default("Curious learners, science & documentary fans aged 18-45"),
  ctaStyle: z.string().default("Thought-provoking question asking for viewer theories + subscribe"),
});

export type ChannelProfile = z.infer<typeof ChannelProfileSchema>;

// 2. Content Brief
export const ContentBriefSchema = z.object({
  topic: z.string().min(1),
  angle: z.string().min(5),
  targetAudience: z.string().min(5),
  corePremise: z.string().min(10),
  tone: z.string(),
  targetWordCount: z.number().int().min(50).max(5000),
  estimatedDurationSeconds: z.number().int().min(30).max(1800),
  keyThemes: z.array(z.string()).min(1),
  visualStyle: z.string().min(5),
});

export type ContentBrief = z.infer<typeof ContentBriefSchema>;

// 3. Research Notes
export const FactItemSchema = z.object({
  statement: z.string().min(5),
  sourceCategory: z.enum(["ACADEMIC_STUDY", "HISTORICAL_RECORD", "MEASUREMENT_DATA", "EXPERT_CONSENSUS", "OBSERVATIONAL_DATA"]),
  confidenceScore: z.number().min(0).max(1),
});

export const ResearchNoteSchema = z.object({
  topic: z.string(),
  overview: z.string().min(20),
  keyFacts: z.array(FactItemSchema).min(2),
  counterIntuitiveInsights: z.array(z.string()).min(1),
  historicalContext: z.string().min(10),
  commonMisconceptions: z.array(z.string()).min(1),
  sources: z.array(z.string()).min(1),
  coreHook: z.string().min(10),
});

export type FactItem = z.infer<typeof FactItemSchema>;
export type ResearchNote = z.infer<typeof ResearchNoteSchema>;

// 4. Claims & Fact-Check Verification
export const ClaimSchema = z.object({
  id: z.string(),
  statement: z.string().min(5),
  sourceReference: z.string(),
  verificationStatus: z.enum(["VERIFIED", "NEEDS_CONTEXT", "UNVERIFIED"]),
  factCheckNotes: z.string(),
});

export type Claim = z.infer<typeof ClaimSchema>;

// 5. Script & Sections
export const ScriptSectionTypeSchema = z.enum([
  "HOOK",
  "INTRO",
  "DEEP_DIVE",
  "CLIMAX",
  "CONCLUSION",
  "CTA"
]);

export const ScriptSectionSchema = z.object({
  id: z.string(),
  sectionType: ScriptSectionTypeSchema,
  heading: z.string().min(2),
  narration: z.string().min(10),
  visualDescription: z.string().min(5),
  soundDesignPrompt: z.string().optional(),
  estimatedDurationSeconds: z.number().int().min(3),
});

export const ScriptSchema = z.object({
  title: z.string().min(3),
  hook: z.string().min(10),
  intro: z.string().min(15),
  sections: z.array(ScriptSectionSchema).min(2),
  outro: z.string().min(10),
  callToAction: z.string().min(5),
  wordCount: z.number().int().min(50),
  estimatedDurationSeconds: z.number().int().min(30),
});

export type ScriptSection = z.infer<typeof ScriptSectionSchema>;
export type Script = z.infer<typeof ScriptSchema>;

// 6. Scene-by-Scene Production Plan
export const SceneSchema = z.object({
  sceneNumber: z.number().int().positive(),
  sectionId: z.string(),
  heading: z.string(),
  narration: z.string(),
  visualPrompt: z.string().min(10),
  bRollKeywords: z.array(z.string()).min(1),
  visualStyle: z.string(),
  durationSeconds: z.number().int().positive(),
  onScreenText: z.string().optional(),
  transitionEffect: z.enum(["CROSS_DISSOLVE", "WHIP_PAN", "FADE_TO_BLACK", "SMOOTH_ZOOM", "CUT"]),
});

export type Scene = z.infer<typeof SceneSchema>;

// 7. Video Metadata & SEO
export const ChapterSchema = z.object({
  timestamp: z.string().regex(/^\d{2}:\d{2}$/, "Format must be MM:SS"),
  title: z.string().min(1),
});

export const VideoMetadataSchema = z.object({
  titleCandidates: z.array(
    z.object({
      title: z.string().min(5).max(100),
      hookType: z.enum(["CURIOSITY_GAP", "COUNTER_INTUITIVE", "QUESTION", "EXTREME_SUPERLATIVE", "STORY_HOOK"]),
      predictedCTRScore: z.number().min(0).max(100),
    })
  ).min(3),
  selectedTitle: z.string().min(5).max(100),
  description: z.string().min(50),
  tags: z.array(z.string()).min(5),
  hashtags: z.array(z.string()).min(3),
  categoryId: z.string(),
  chapters: z.array(ChapterSchema).min(2),
});

export type Chapter = z.infer<typeof ChapterSchema>;
export type VideoMetadata = z.infer<typeof VideoMetadataSchema>;

// 8. Thumbnail Concept
export const ThumbnailConceptSchema = z.object({
  conceptId: z.string(),
  headlineText: z.string().max(30), // Max 3-4 impactful words
  visualDescription: z.string().min(10),
  focalElement: z.string().min(3),
  emotionHook: z.string().min(3),
  colorPalette: z.array(z.string()).min(2),
  compositionGuidance: z.string().min(5),
  contrastScore: z.number().min(0).max(100),
});

export type ThumbnailConcept = z.infer<typeof ThumbnailConceptSchema>;

// 9. Aggregated Structured Content Package
export const StructuredContentPackageSchema = z.object({
  command: z.string(),
  channelProfile: ChannelProfileSchema,
  brief: ContentBriefSchema,
  research: ResearchNoteSchema,
  claims: z.array(ClaimSchema).min(1),
  script: ScriptSchema,
  productionPlan: z.array(SceneSchema).min(2),
  metadata: VideoMetadataSchema,
  thumbnailConcepts: z.array(ThumbnailConceptSchema).min(2),
  generatedAt: z.string(),
});

export type StructuredContentPackage = z.infer<typeof StructuredContentPackageSchema>;
