import type { ChannelProfile } from "./schemas";
import type { ILLMProvider } from "./providers/types";

const CURATED_CURIOSPHERE_TOPICS = [
  "The Mariana Trench: What Lies in Earth's Deepest Abyss",
  "Why Time Moves Faster As You Age: The Neuroscience of Subjective Time",
  "The Voynich Manuscript: The 600-Year-Old Book Nobody Can Read",
  "The Antikythera Mechanism: The 2,000-Year-Old Greek Computer",
  "The Wow! Signal: The 72-Second Alien Radio Mystery",
  "The Fermi Paradox: If Aliens Exist, Where Are They?",
  "What Happens Beyond the Event Horizon of a Black Hole",
  "The Immortal Jellyfish: How Turritopsis dohrnii Reverses Aging",
];

export class TopicSelector {
  static async selectTopic(
    channelProfile: ChannelProfile,
    provider?: ILLMProvider
  ): Promise<string> {
    if (provider && provider.name !== "deterministic-mock") {
      try {
        const prompt = `Suggest a single, highly engaging, viral documentary video topic for a channel named "${channelProfile.channelName}".
Niche: ${channelProfile.niche}
Target Audience: ${channelProfile.audience}
Tone: ${channelProfile.tone}
Return ONLY the topic title in plain text without quotes or explanation.`;

        const topic = await provider.generateText(prompt);
        if (topic && topic.trim().length > 5) {
          return topic.trim().replace(/^["']|["']$/g, "");
        }
      } catch (e) {
        console.warn("LLM Topic selection failed, falling back to curated matrix:", e);
      }
    }

    // Curated catalog selection based on date or pseudo-random rotation
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const index = dayOfYear % CURATED_CURIOSPHERE_TOPICS.length;
    return CURATED_CURIOSPHERE_TOPICS[index];
  }

  static async selectDailyTopic(channelName = "CurioSphere"): Promise<{ topic: string }> {
    const topic = await this.selectTopic({
      channelName,
      niche: "Science & Curiosity",
      targetDurationSeconds: 180,
      defaultTone: "curious and cinematic",
      language: "en",
    } as any);

    return { topic };
  }
}
