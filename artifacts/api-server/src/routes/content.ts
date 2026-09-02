import { Router, type IRouter } from "express";
import { z } from "zod";
import { CommandParser } from "../content-engine/command-parser";
import { contentEngineGenerator } from "../content-engine/generator";
import { ChannelProfileSchema } from "../content-engine/schemas";
import { getLLMProvider, OllamaLLMProvider } from "../content-engine/providers";

const router: IRouter = Router();

const ParseCommandBody = z.object({
  command: z.string().min(1),
});

const GenerateContentBody = z.object({
  command: z.string().min(1),
  channelProfile: ChannelProfileSchema.partial().optional(),
});

// POST /content/parse-command
router.post("/content/parse-command", (req, res) => {
  try {
    const { command } = ParseCommandBody.parse(req.body);
    const parsed = CommandParser.parse(command);
    res.json(parsed);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to parse command" });
  }
});

// POST /content/generate
router.post("/content/generate", async (req, res) => {
  try {
    const { command, channelProfile } = GenerateContentBody.parse(req.body);
    const contentPackage = await contentEngineGenerator.generatePackage({
      command,
      channelProfile,
    });
    res.json(contentPackage);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Content generation failed" });
  }
});

// GET /content/health
router.get("/content/health", async (req, res) => {
  try {
    const providerName = (req.query.provider as string) || process.env.LLM_PROVIDER || "deterministic-mock";
    const provider = getLLMProvider(providerName);
    const health = await provider.checkHealth();
    res.json(health);
  } catch (err: any) {
    res.status(500).json({ healthy: false, error: err.message || "Failed to check provider health" });
  }
});

// GET /content/ollama/health
router.get("/content/ollama/health", async (_req, res) => {
  try {
    const ollama = new OllamaLLMProvider();
    const health = await ollama.checkHealth();
    res.status(health.healthy ? 200 : 503).json(health);
  } catch (err: any) {
    res.status(503).json({ healthy: false, error: err.message || "Ollama connection failed" });
  }
});

export default router;
