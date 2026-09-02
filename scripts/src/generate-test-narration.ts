import fs from "node:fs";
import { ttsSynthesizer } from "../../artifacts/api-server/src/tts-engine/synthesizer";
import { getTTSProvider } from "../../artifacts/api-server/src/tts-engine/providers";

async function main() {
  const customText = process.argv.slice(2).join(" ").trim();
  const sampleScript = {
    hook: "If you placed Mount Everest at the bottom of The Mariana Trench, its snowy peak would still be submerged under two kilometers of pitch-black water.",
    intro: "Welcome to CurioSphere. Today, we descend into the hadal zone—a realm of crushing pressure and mysteries science is only beginning to decipher.",
    scenes: [
      {
        heading: "The Descent into Midnight",
        narration: "As you leave the sunlit surface, light disappears entirely within two hundred meters. Below that lies a world so hostile that walking on the surface of the Moon is physically easier than visiting its floor.",
      },
      {
        heading: "Crushing Pressure & Alien Biology",
        narration: "At eleven thousand meters down, the water pressure reaches over one thousand times atmospheric pressure. Ghostly snailfish glide effortlessly using unique piezolytes to survive.",
      },
    ],
    outro: "The depths of our planet still harbor ancient secrets waiting in the dark.",
    callToAction: "What do you think is waiting to be discovered in the deep ocean? Share your theory below and subscribe to CurioSphere.",
  };

  const textToSynthesize = customText || ttsSynthesizer.compileScriptNarration(sampleScript);

  console.log("================================================================================");
  console.log(" 🎙️ CURIOSPHERE LOCAL NARRATION SYNTHESIZER (PHASE 4)");
  console.log("================================================================================");

  const provider = getTTSProvider();
  const health = await provider.checkHealth();

  console.log(`🌐 Active TTS Provider: [${provider.name}] (${health.engine})`);
  console.log(`📡 Health Status: ${health.healthy ? "ONLINE" : "OFFLINE"}`);

  const voices = await provider.listVoices();
  console.log(`📦 Available Voices (${voices.length}): ${voices.map((v) => v.id).join(", ")}`);

  console.log("\n📝 Narration Text Preview:");
  console.log(`"${textToSynthesize.slice(0, 180)}..."`);
  console.log(`   (Total words: ${textToSynthesize.split(/\s+/).length} words)\n`);

  console.log("⏳ Synthesizing master WAV audio artifact...");
  const startTime = Date.now();

  const result = await ttsSynthesizer.synthesizeText(textToSynthesize, {
    voice: process.env.TTS_VOICE || "en-US-ChristopherNeural",
    speakingRate: 1.0,
    format: "wav",
    overwrite: true,
  });

  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
  const stats = fs.statSync(result.audioFilePath);

  console.log("================================================================================");
  console.log(`✨ SYNTHESIS COMPLETED in ${elapsedSec}s`);
  console.log("================================================================================\n");

  console.log("🎧 AUDIO ARTIFACT DETAILS:");
  console.log(`   📁 File Path: ${result.audioFilePath}`);
  console.log(`   🔗 Web URL: ${result.audioUrl}`);
  console.log(`   🗣️  Voice Used: ${result.voiceUsed}`);
  console.log(`   ⏱️  Duration: ${result.durationSec} seconds`);
  console.log(`   📊 Sample Rate: ${result.sampleRate} Hz`);
  console.log(`   💾 File Size: ${(stats.size / 1024).toFixed(2)} KB (${stats.size} bytes)`);
  console.log(`   🛡️  Format: ${result.format}`);
  console.log(`   ⚡ Cached / Reused: ${result.isCached ? "YES" : "NO"}\n`);

  console.log("================================================================================");
  console.log("🎉 Local CurioSphere test narration generation successful!");
  console.log("================================================================================");
}

main().catch((err) => {
  console.error("❌ Narration synthesis failed:", err.message || err);
  process.exit(1);
});
