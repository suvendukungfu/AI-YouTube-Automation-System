import { z } from "zod";
import type { ILLMProvider } from "./providers/types";
import { getLLMProvider } from "./providers";
import { CommandParser, type ParsedCommand } from "./command-parser";
import { TopicSelector } from "./topic-selector";
import {
  ChannelProfileSchema,
  type ChannelProfile,
  ContentBriefSchema,
  type ContentBrief,
  ResearchNoteSchema,
  type ResearchNote,
  ClaimSchema,
  type Claim,
  ScriptSchema,
  type Script,
  SceneSchema,
  type Scene,
  VideoMetadataSchema,
  type VideoMetadata,
  ThumbnailConceptSchema,
  type ThumbnailConcept,
  StructuredContentPackageSchema,
  type StructuredContentPackage,
} from "./schemas";

export interface GenerateContentPackageOptions {
  command: string;
  channelProfile?: Partial<ChannelProfile>;
  provider?: ILLMProvider;
}

export class ContentEngineGenerator {
  private provider: ILLMProvider;

  constructor(provider?: ILLMProvider) {
    this.provider = provider || getLLMProvider();
  }

  async generatePackage(options: GenerateContentPackageOptions): Promise<StructuredContentPackage> {
    const { command, channelProfile: profileOverrides, provider } = options;
    const activeProvider = provider || this.provider;

    // 1. Parse Command
    const parsedCommand: ParsedCommand = CommandParser.parse(command);

    // 2. Resolve Channel Profile
    const profile: ChannelProfile = ChannelProfileSchema.parse({
      channelName: parsedCommand.channelName || "CurioSphere",
      targetDurationSeconds: parsedCommand.targetDurationSeconds || 180,
      ...profileOverrides,
    });

    // 3. Resolve Topic (Auto-select if omitted)
    let topic = parsedCommand.topic;
    if (!topic || parsedCommand.isAutoTopic) {
      topic = await TopicSelector.selectTopic(profile, activeProvider);
    }

    // 4. Generate Content Brief
    const brief = await this.generateBrief(topic, profile, activeProvider);

    // 5. Generate Research Notes
    const research = await this.generateResearch(brief, profile, activeProvider);

    // 6. Generate Script
    const script = await this.generateScript(brief, research, profile, activeProvider);

    // 7. Extract & Fact-Check Claims
    const claims = await this.extractAndVerifyClaims(script, research, activeProvider);

    // 8. Generate Scene-by-Scene Production Plan
    const productionPlan = await this.generateProductionPlan(script, brief, activeProvider);

    // 9. Generate YouTube Metadata & Chapters
    const metadata = await this.generateMetadata(brief, script, research, activeProvider);

    // 10. Generate Thumbnail Concepts
    const thumbnailConcepts = await this.generateThumbnailConcepts(brief, script, metadata, activeProvider);

    // 11. Assemble and Validate Complete Package
    const fullPackage: StructuredContentPackage = {
      command,
      channelProfile: profile,
      brief,
      research,
      claims,
      script,
      productionPlan,
      metadata,
      thumbnailConcepts,
      generatedAt: new Date().toISOString(),
    };

    return StructuredContentPackageSchema.parse(fullPackage);
  }

  private async generateBrief(
    topic: string,
    profile: ChannelProfile,
    provider: ILLMProvider
  ): Promise<ContentBrief> {
    const targetWords = Math.round((profile.targetDurationSeconds / 60) * 140); // 140 words/min pacing
    const prompt = `Create a structured ContentBrief for a video on the topic: "${topic}".
Channel: ${profile.channelName} (${profile.niche})
Tone: ${profile.tone}
Audience: ${profile.audience}
Target Duration: ${profile.targetDurationSeconds} seconds (~${targetWords} words)`;

    return await provider.generateStructured({
      prompt,
      schema: ContentBriefSchema,
      systemPrompt: "You are an elite documentary strategist. Create a rigorous, curiosity-driven ContentBrief with zero filler.",
    });
  }

  private async generateResearch(
    brief: ContentBrief,
    profile: ChannelProfile,
    provider: ILLMProvider
  ): Promise<ResearchNote> {
    const prompt = `Conduct deep research and extract verified factual notes for: "${brief.topic}".
Angle: ${brief.angle}
Premise: ${brief.corePremise}
Language: ${profile.language}
Requirements:
1. Include verified facts with source categories.
2. Include counter-intuitive insights that overturn common misconceptions.
3. Provide historical context and reputable source references.
4. Strictly avoid fake citations, unverified claims, or generic fluff.`;

    return await provider.generateStructured({
      prompt,
      schema: ResearchNoteSchema,
      systemPrompt: "You are a master investigative science researcher. Extract precise facts, figures, and verified sources.",
    });
  }

  private async generateScript(
    brief: ContentBrief,
    research: ResearchNote,
    profile: ChannelProfile,
    provider: ILLMProvider
  ): Promise<Script> {
    const prompt = `Write a cinematic, structured documentary script for: "${brief.topic}".
Core Hook: "${research.coreHook}"
Premise: "${brief.corePremise}"
Tone: ${profile.tone}
Narration Style: ${profile.narrationStyle}
Target Word Count: ${brief.targetWordCount} words
Audience: ${profile.audience}
CTA Style: ${profile.ctaStyle}

Facts to incorporate:
${research.keyFacts.map((f, i) => `${i + 1}. ${f.statement}`).join("\n")}

Structure requirements:
- High-curiosity opening hook (no generic "Have you ever wondered...")
- Narrative transitions between deep-dive sections
- Conclusion reflecting on deeper meaning
- Optional engagement CTA aligned with channel style`;

    return await provider.generateStructured({
      prompt,
      schema: ScriptSchema,
      systemPrompt: "You are a world-class documentary scriptwriter. Write immersive, authoritative, scene-segmented narration.",
    });
  }

  private async extractAndVerifyClaims(
    script: Script,
    research: ResearchNote,
    provider: ILLMProvider
  ): Promise<Claim[]> {
    const prompt = `Extract all empirical factual claims from the following script and verify them against known science and the research notes:
Script Title: "${script.title}"
Hook: "${script.hook}"
Narrations:
${script.sections.map((s) => `[${s.heading}]: ${s.narration}`).join("\n\n")}

Research Reference:
${research.keyFacts.map((f) => f.statement).join("\n")}`;

    return await provider.generateStructured({
      prompt,
      schema: z.array(ClaimSchema),
      systemPrompt: "You are a rigorous scientific fact-checker. Extract and categorize claims with verification status and notes.",
    });
  }

  private async generateProductionPlan(
    script: Script,
    brief: ContentBrief,
    provider: ILLMProvider
  ): Promise<Scene[]> {
    const prompt = `Create a scene-by-scene production storyboard for video: "${script.title}".
Visual Style: ${brief.visualStyle}
Sections:
${script.sections.map((s, idx) => `Scene ${idx + 1} (${s.sectionType}): ${s.heading} -> Narration: "${s.narration}"`).join("\n")}`;

    return await provider.generateStructured({
      prompt,
      schema: z.array(SceneSchema),
      systemPrompt: "You are a cinematic director. Generate detailed visual prompts, B-roll search queries, and camera transition directives.",
    });
  }

  private async generateMetadata(
    brief: ContentBrief,
    script: Script,
    research: ResearchNote,
    provider: ILLMProvider
  ): Promise<VideoMetadata> {
    const prompt = `Generate YouTube SEO metadata for video: "${script.title}".
Topic: ${brief.topic}
Hook: ${script.hook}
Key Themes: ${brief.keyThemes.join(", ")}
Sections for Chapters:
${script.sections.map((s) => s.heading).join(", ")}`;

    return await provider.generateStructured({
      prompt,
      schema: VideoMetadataSchema,
      systemPrompt: "You are a top YouTube growth strategist. Produce high-CTR titles, engaging chapters, and searchable SEO descriptions.",
    });
  }

  private async generateThumbnailConcepts(
    brief: ContentBrief,
    script: Script,
    metadata: VideoMetadata,
    provider: ILLMProvider
  ): Promise<ThumbnailConcept[]> {
    const prompt = `Generate high-CTR thumbnail concepts for: "${metadata.selectedTitle}".
Topic: ${brief.topic}
Hook: ${script.hook}
Requirements:
1. Max 3-4 impactful headline words.
2. High-contrast visual compositions with clear focal elements and emotional pull.`;

    return await provider.generateStructured({
      prompt,
      schema: z.array(ThumbnailConceptSchema),
      systemPrompt: "You are a master thumbnail designer for top educational/documentary YouTube channels.",
    });
  }
}

export const contentEngineGenerator = new ContentEngineGenerator();
