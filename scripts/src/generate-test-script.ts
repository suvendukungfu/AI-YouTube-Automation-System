import { OllamaLLMProvider } from "../../artifacts/api-server/src/content-engine/providers/ollama";
import { DeterministicMockLLMProvider } from "../../artifacts/api-server/src/content-engine/providers/deterministic-mock";
import { ContentEngineGenerator } from "../../artifacts/api-server/src/content-engine/generator";
import type { ILLMProvider } from "../../artifacts/api-server/src/content-engine/providers/types";

async function main() {
  const customTopic = process.argv.slice(2).join(" ").trim();
  const topic = customTopic || "The Mariana Trench";
  const command = `Create today's CurioSphere video about ${topic}.`;

  console.log("================================================================================");
  console.log(" 🎬 CURIOSPHERE LOCAL SCRIPT GENERATOR (PHASE 3)");
  console.log("================================================================================");
  console.log(`📌 Command: "${command}"`);
  console.log(`🌐 Checking Ollama Local AI Provider...`);

  const ollama = new OllamaLLMProvider();
  const health = await ollama.checkHealth();

  let activeProvider: ILLMProvider;

  if (health.healthy) {
    console.log(`✅ Ollama is ONLINE at ${health.endpoint} (${health.latencyMs}ms)`);
    console.log(`🤖 Selected Model: ${health.model}`);
    if (health.availableModels && health.availableModels.length > 0) {
      console.log(`📦 Installed Models on Machine: ${health.availableModels.join(", ")}`);
    }
    activeProvider = ollama;
  } else {
    console.log(`⚠️  Ollama is OFFLINE or unreachable (${health.error || "Connection refused"})`);
    console.log(`🔄 Using high-fidelity Deterministic Engine for offline script generation...`);
    activeProvider = new DeterministicMockLLMProvider();
  }

  console.log("\n⏳ Generating complete CurioSphere structured content package...\n");

  const generator = new ContentEngineGenerator(activeProvider);
  const startTime = Date.now();

  try {
    const pkg = await generator.generatePackage({
      command,
      channelProfile: {
        channelName: "CurioSphere",
        tone: "Wonder-filled, suspenseful, deeply factual, and awe-inspiring",
        targetDurationSeconds: 180,
      },
    });

    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log("================================================================================");
    console.log(`✨ GENERATION SUCCESSFUL in ${elapsedSec}s using [${activeProvider.name}]`);
    console.log("================================================================================\n");

    console.log("📺 YOUTUBE METADATA & TITLES:");
    console.log(`   🎯 Selected Title: "${pkg.metadata.selectedTitle}"`);
    console.log("   💡 Title Candidates:");
    pkg.metadata.titleCandidates.forEach((tc, idx) => {
      console.log(`      ${idx + 1}. [${tc.hookType}] "${tc.title}" (Predicted CTR: ${tc.predictedCTRScore}%)`);
    });
    console.log(`   🏷️  Tags: ${pkg.metadata.tags.join(", ")}`);
    console.log(`   #️⃣  Hashtags: ${pkg.metadata.hashtags.join(" ")}\n`);

    console.log("📝 CONTENT BRIEF & ANGLE:");
    console.log(`   Angle: ${pkg.brief.angle}`);
    console.log(`   Core Premise: ${pkg.brief.corePremise}`);
    console.log(`   Visual Style: ${pkg.brief.visualStyle}\n`);

    console.log("🔍 FACT-CHECKED CLAIMS MATRIX:");
    pkg.claims.forEach((claim, idx) => {
      console.log(`   [${claim.verificationStatus}] Claim ${idx + 1}: ${claim.statement}`);
      console.log(`      Ref: ${claim.sourceReference}`);
      console.log(`      Notes: ${claim.factCheckNotes}`);
    });
    console.log("");

    console.log("🎙️ SCRIPT & HOOK:");
    console.log(`   🪝 Opening Hook: "${pkg.script.hook}"`);
    console.log(`   📖 Intro: "${pkg.script.intro}"\n`);

    console.log("🎬 SCENE-BY-SCENE PRODUCTION STORYBOARD:");
    pkg.productionPlan.forEach((scene) => {
      console.log(`   ┌── Scene ${scene.sceneNumber} [${scene.transitionEffect}] (${scene.durationSeconds}s) - "${scene.heading}"`);
      console.log(`   │   🗣️ Narration: "${scene.narration}"`);
      console.log(`   │   🎨 Visual Prompt: ${scene.visualPrompt}`);
      if (scene.onScreenText) {
        console.log(`   │   🔤 Text Overlay: [${scene.onScreenText}]`);
      }
      console.log(`   │   🎞️ B-Roll Keywords: ${scene.bRollKeywords.join(", ")}`);
      console.log(`   └──\n`);
    });

    console.log("🏁 CONCLUSION & CTA:");
    console.log(`   Outro: "${pkg.script.outro}"`);
    console.log(`   Call-to-Action: "${pkg.script.callToAction}"`);
    console.log(`   Total Word Count: ${pkg.script.wordCount} words (~${pkg.script.estimatedDurationSeconds}s runtime)\n`);

    console.log("🖼️ THUMBNAIL CONCEPTS:");
    pkg.thumbnailConcepts.forEach((thumb, idx) => {
      console.log(`   Concept ${idx + 1} (${thumb.conceptId}): [Headline: "${thumb.headlineText}"]`);
      console.log(`      Visual: ${thumb.visualDescription}`);
      console.log(`      Focal Element: ${thumb.focalElement}`);
      console.log(`      Colors: ${thumb.colorPalette.join(", ")} | Contrast Score: ${thumb.contrastScore}/100\n`);
    });

    console.log("================================================================================");
    console.log("🎉 Local CurioSphere test script generation complete!");
    console.log("================================================================================");
  } catch (err: any) {
    console.error("❌ Content generation failed:", err.message || err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
