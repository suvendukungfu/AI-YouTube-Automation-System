import fs from "node:fs";
import type { ITTSProvider, SynthesisOptions, SynthesisResult } from "./types";
import { getTTSProvider } from "./providers";
import type { ProductionJob } from "@workspace/db/schema";
import type { ScriptResult, VoiceResult } from "../pipeline/types";

export class TTSSynthesizer {
  private provider: ITTSProvider;

  constructor(provider?: ITTSProvider) {
    this.provider = provider || getTTSProvider();
  }

  /**
   * Compiles all narrative parts of a script into a cohesive narration string
   */
  public compileScriptNarration(script: {
    hook?: string;
    intro?: string;
    scenes?: Array<{ heading?: string; narration: string }>;
    sections?: Array<{ heading?: string; narration: string }>;
    outro?: string;
    callToAction?: string;
  }): string {
    const parts: string[] = [];

    if (script.hook && script.hook.trim()) {
      parts.push(script.hook.trim());
    }

    if (script.intro && script.intro.trim()) {
      parts.push(script.intro.trim());
    }

    const sceneList = script.scenes || script.sections || [];
    for (const scene of sceneList) {
      if (scene.narration && scene.narration.trim()) {
        parts.push(scene.narration.trim());
      }
    }

    if (script.outro && script.outro.trim()) {
      parts.push(script.outro.trim());
    }

    if (script.callToAction && script.callToAction.trim()) {
      parts.push(script.callToAction.trim());
    }

    return parts.join("\n\n");
  }

  /**
   * Synthesize raw narration text into a master audio file
   */
  async synthesizeText(text: string, options?: Partial<SynthesisOptions>): Promise<SynthesisResult> {
    const result = await this.provider.synthesize({
      text,
      ...options,
    });

    // Verification Guard
    if (!fs.existsSync(result.audioFilePath)) {
      throw new Error(`TTS generation failed: output file not found at ${result.audioFilePath}`);
    }

    const stats = fs.statSync(result.audioFilePath);
    if (stats.size === 0) {
      throw new Error(`TTS generation failed: audio file is empty (0 bytes)`);
    }

    if (result.durationSec <= 0) {
      throw new Error(`TTS generation failed: calculated audio duration is ${result.durationSec}s`);
    }

    return result;
  }

  /**
   * Synthesize a production job's script into a master WAV audio track
   */
  async synthesizeJobScript(
    job: ProductionJob,
    script: ScriptResult | any,
    options?: Partial<SynthesisOptions>
  ): Promise<VoiceResult> {
    const narrationText = this.compileScriptNarration(script);

    const synthesis = await this.synthesizeText(narrationText, {
      jobId: job.id,
      voice: process.env.TTS_VOICE || "en-US-ChristopherNeural",
      speakingRate: 1.0,
      format: "wav",
      ...options,
    });

    return {
      voiceName: synthesis.voiceUsed,
      durationSec: synthesis.durationSec,
      audioUrl: synthesis.audioUrl,
      format: `${synthesis.format} ${synthesis.sampleRate}Hz 16-bit`,
    };
  }
}

export const ttsSynthesizer = new TTSSynthesizer();
