import { Router, type IRouter } from "express";
import { z } from "zod";
import { getTTSProvider } from "../tts-engine/providers";
import { ttsSynthesizer } from "../tts-engine/synthesizer";

const router: IRouter = Router();

const SynthesizeBody = z.object({
  text: z.string().min(1),
  voice: z.string().optional(),
  speakingRate: z.union([z.number(), z.string()]).optional(),
  jobId: z.number().int().optional(),
  overwrite: z.boolean().optional(),
});

// GET /tts/voices
router.get("/tts/voices", async (req, res) => {
  try {
    const providerName = (req.query.provider as string) || process.env.TTS_PROVIDER || "edge-tts";
    const provider = getTTSProvider(providerName);
    const voices = await provider.listVoices();
    res.json(voices);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to list voices" });
  }
});

// GET /tts/health
router.get("/tts/health", async (req, res) => {
  try {
    const providerName = (req.query.provider as string) || process.env.TTS_PROVIDER || "edge-tts";
    const provider = getTTSProvider(providerName);
    const health = await provider.checkHealth();
    res.json(health);
  } catch (err: any) {
    res.status(500).json({ healthy: false, error: err.message || "Failed to check TTS health" });
  }
});

// POST /tts/synthesize
router.post("/tts/synthesize", async (req, res) => {
  try {
    const input = SynthesizeBody.parse(req.body);
    const result = await ttsSynthesizer.synthesizeText(input.text, {
      voice: input.voice,
      speakingRate: input.speakingRate,
      jobId: input.jobId,
      overwrite: input.overwrite,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Voice synthesis failed" });
  }
});

export default router;
