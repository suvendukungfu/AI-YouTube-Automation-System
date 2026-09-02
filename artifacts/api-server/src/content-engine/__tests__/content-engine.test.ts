import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { CommandParser } from "../command-parser";
import { TopicSelector } from "../topic-selector";
import {
  ChannelProfileSchema,
  ContentBriefSchema,
  ResearchNoteSchema,
  ClaimSchema,
  ScriptSchema,
  SceneSchema,
  VideoMetadataSchema,
  ThumbnailConceptSchema,
  StructuredContentPackageSchema,
} from "../schemas";
import { DeterministicMockLLMProvider } from "../providers/deterministic-mock";
import { OllamaLLMProvider } from "../providers/ollama";
import { ContentEngineGenerator } from "../generator";

test("CommandParser - extracts topic, channel and duration accurately", () => {
  const result1 = CommandParser.parse("Create today's CurioSphere video about the Mariana Trench.");
  assert.equal(result1.channelName.toLowerCase(), "curiosphere");
  assert.equal(result1.topic, "The Mariana Trench");
  assert.equal(result1.targetDurationSeconds, 180);
  assert.equal(result1.isAutoTopic, false);

  const result2 = CommandParser.parse("Make a video on Quantum Entanglement for 3 minutes");
  assert.equal(result2.topic, "Quantum Entanglement");
  assert.equal(result2.targetDurationSeconds, 180);
  assert.equal(result2.isAutoTopic, false);

  const result3 = CommandParser.parse("Create today's CurioSphere video");
  assert.equal(result3.isAutoTopic, true);
  assert.equal(result3.topic, undefined);
});

test("TopicSelector - returns high-performing topic when omitted", async () => {
  const profile = ChannelProfileSchema.parse({
    channelName: "CurioSphere",
    niche: "Deep Science & Mysteries",
  });

  const topic = await TopicSelector.selectTopic(profile);
  assert.ok(topic && topic.length > 5);
  assert.match(topic, /The|Why|What|How/);
});

test("Schema Validation - accepts valid structured objects", () => {
  const validBrief = {
    topic: "The Mariana Trench",
    angle: "Extreme pressure and alien extremophile lifeforms.",
    targetAudience: "Curious science and nature enthusiasts.",
    corePremise: "The deepest ocean trench is more alien than outer space.",
    tone: "Wonder-filled and authoritative.",
    targetWordCount: 420,
    estimatedDurationSeconds: 180,
    keyThemes: ["Ocean Depth", "Biology", "Geology"],
    visualStyle: "Deep abyss cinematic dark aesthetic.",
  };
  assert.doesNotThrow(() => ContentBriefSchema.parse(validBrief));

  const validClaim = {
    id: "claim-1",
    statement: "Challenger Deep depth exceeds 10,900 meters.",
    sourceReference: "NOAA Ocean Bathymetry Survey (2021)",
    verificationStatus: "VERIFIED" as const,
    factCheckNotes: "Confirmed via multiple multibeam sonar expeditions.",
  };
  assert.doesNotThrow(() => ClaimSchema.parse(validClaim));
});

test("Schema Validation - rejects malformed AI output", () => {
  const malformedBrief = {
    topic: "", // too short
    angle: "Too", // too short (<5)
    // missing targetAudience, corePremise, etc.
  };

  assert.throws(
    () => ContentBriefSchema.parse(malformedBrief),
    (err: any) => err instanceof z.ZodError
  );

  const invalidClaim = {
    id: "claim-bad",
    statement: "Short",
    verificationStatus: "INVALID_STATUS", // invalid enum
  };

  assert.throws(
    () => ClaimSchema.parse(invalidClaim),
    (err: any) => err instanceof z.ZodError
  );
});

test("DeterministicMockLLMProvider - returns valid structured instances for all schemas", async () => {
  const provider = new DeterministicMockLLMProvider();

  const brief = await provider.generateStructured({
    prompt: "Create ContentBrief for topic: The Mariana Trench",
    schema: ContentBriefSchema,
  });
  assert.equal(brief.topic, "The Mariana Trench");
  assert.ok(brief.keyThemes.length >= 1);

  const research = await provider.generateStructured({
    prompt: "Research topic: The Mariana Trench",
    schema: ResearchNoteSchema,
  });
  assert.ok(research.keyFacts.length >= 2);
  assert.ok(research.sources.length >= 1);

  const script = await provider.generateStructured({
    prompt: "Script for: The Mariana Trench",
    schema: ScriptSchema,
  });
  assert.ok(script.hook.length >= 10);
  assert.ok(script.sections.length >= 2);
  assert.ok(script.wordCount > 100);

  const metadata = await provider.generateStructured({
    prompt: "Metadata for: The Mariana Trench",
    schema: VideoMetadataSchema,
  });
  assert.ok(metadata.titleCandidates.length >= 3);
  assert.ok(metadata.chapters.length >= 2);
});

test("ContentEngineGenerator - full end-to-end CurioSphere video package generation", async () => {
  const generator = new ContentEngineGenerator(new DeterministicMockLLMProvider());

  const pkg = await generator.generatePackage({
    command: "Create today's CurioSphere video about the Mariana Trench.",
  });

  // Verify full package integrity
  assert.doesNotThrow(() => StructuredContentPackageSchema.parse(pkg));
  assert.equal(pkg.channelProfile.channelName, "CurioSphere");
  assert.equal(pkg.brief.topic, "The Mariana Trench");
  assert.ok(pkg.research.keyFacts.length >= 3);
  assert.ok(pkg.claims.length >= 2);
  assert.ok(pkg.script.sections.length >= 3);
  assert.ok(pkg.productionPlan.length >= 3);
  assert.ok(pkg.metadata.titleCandidates.length >= 3);
  assert.ok(pkg.thumbnailConcepts.length >= 2);

  // Validate script narrative elements
  assert.ok(pkg.script.hook.length > 20);
  assert.ok(pkg.script.intro.length > 20);
  assert.ok(pkg.script.outro.length > 10);
  assert.ok(pkg.script.callToAction.length > 10);

  // Validate scene storyboard
  const scene1 = pkg.productionPlan[0];
  assert.equal(scene1.sceneNumber, 1);
  assert.ok(scene1.bRollKeywords.length >= 1);
  assert.ok(scene1.visualPrompt.length > 20);

  // Validate thumbnail concepts
  const thumb1 = pkg.thumbnailConcepts[0];
  assert.ok(thumb1.headlineText.split(" ").length <= 5, "Headline should be concise and punchy");
  assert.ok(thumb1.contrastScore > 80);
});

test("OllamaLLMProvider - configuration and environment variable loading", () => {
  process.env.OLLAMA_BASE_URL = "http://127.0.0.1:11434/";
  process.env.OLLAMA_MODEL = "llama3.2";

  const provider = new OllamaLLMProvider();

  assert.equal(provider.getEndpoint(), "http://127.0.0.1:11434");
  assert.equal(provider.getModel(), "llama3.2");
});

test("OllamaLLMProvider - repairAndParseJson successfully recovers from malformed markdown and conversational JSON", () => {
  const provider = new OllamaLLMProvider();

  // 1. Markdown codeblock wrapped JSON
  const markdownWrapped = "```json\n" + JSON.stringify({
    topic: "The Mariana Trench",
    angle: "Deep exploration of hadal mysteries.",
    targetAudience: "Curious adults and students.",
    corePremise: "One of the most hostile zones on Earth.",
    tone: "Wonder-filled and suspenseful.",
    targetWordCount: 400,
    estimatedDurationSeconds: 180,
    keyThemes: ["Extreme Pressure", "Bioluminescence"],
    visualStyle: "Deep abyss dark 4k",
  }) + "\n```";

  const parsed1 = provider.repairAndParseJson(markdownWrapped, ContentBriefSchema);
  assert.equal(parsed1.topic, "The Mariana Trench");
  assert.equal(parsed1.keyThemes.length, 2);

  // 2. Conversational prefix and suffix text
  const conversationalWrapped = `Here is the structured brief for your YouTube documentary:\n\n${JSON.stringify({
    topic: "Quantum Superposition",
    angle: "A mind-bending journey into particle states.",
    targetAudience: "Science enthusiasts.",
    corePremise: "Matter behaves like waves until observed.",
    tone: "Deeply philosophical and factual.",
    targetWordCount: 450,
    estimatedDurationSeconds: 180,
    keyThemes: ["Quantum Physics", "Schrodinger"],
    visualStyle: "Glowing subatomic particle waveforms",
  })}\n\nI hope this brief aligns with your production standards!`;

  const parsed2 = provider.repairAndParseJson(conversationalWrapped, ContentBriefSchema);
  assert.equal(parsed2.topic, "Quantum Superposition");

  // 3. Trailing commas in JSON arrays/objects
  const trailingCommas = `{
    "topic": "The Voynich Manuscript",
    "angle": "Uncipherable cryptographic history.",
    "targetAudience": "History buffs.",
    "corePremise": "A 600-year-old book that defies translation.",
    "tone": "Mysterious and intriguing.",
    "targetWordCount": 350,
    "estimatedDurationSeconds": 180,
    "keyThemes": [
      "Cryptanalysis",
      "Medieval History",
    ],
    "visualStyle": "Old parchment textures and glowing ink",
  }`;

  const parsed3 = provider.repairAndParseJson(trailingCommas, ContentBriefSchema);
  assert.equal(parsed3.topic, "The Voynich Manuscript");
});

test("OllamaLLMProvider - checkHealth returns structured health report", async () => {
  const provider = new OllamaLLMProvider();

  const health = await provider.checkHealth();
  assert.equal(typeof health.healthy, "boolean");
  assert.equal(health.provider, "ollama");
  assert.ok(health.endpoint);
  assert.ok(typeof health.latencyMs === "number");
});

