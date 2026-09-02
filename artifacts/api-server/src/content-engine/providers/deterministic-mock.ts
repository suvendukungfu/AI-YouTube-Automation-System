import { z } from "zod";
import type { ILLMProvider, GenerateStructuredOptions, ProviderHealthCheck } from "./types";
import {
  ContentBriefSchema,
  ResearchNoteSchema,
  ScriptSchema,
  SceneSchema,
  VideoMetadataSchema,
  ThumbnailConceptSchema,
  ClaimSchema,
} from "../schemas";

export class DeterministicMockLLMProvider implements ILLMProvider {
  readonly name = "deterministic-mock";

  async checkHealth(): Promise<ProviderHealthCheck> {
    return {
      healthy: true,
      provider: this.name,
      model: "deterministic-mock-v1",
      endpoint: "in-memory://offline",
      availableModels: ["deterministic-mock-v1"],
      latencyMs: 1,
    };
  }

  async generateText(prompt: string, _systemPrompt?: string): Promise<string> {
    return `Synthesized intelligent response for: ${prompt.slice(0, 100)}`;
  }

  async generateStructured<T>(options: GenerateStructuredOptions<T>): Promise<T> {
    const { prompt, schema } = options;

    // Extract key metadata from prompt string
    const topicMatch = prompt.match(/topic[:\s"]+([^"\n,]+)/i) || prompt.match(/about\s+([^".\n]+)/i);
    const rawTopic = topicMatch ? topicMatch[1].trim() : "The Mariana Trench";
    const topic = rawTopic.replace(/^the\s+/i, "The ");

    // 1. ContentBrief
    if ((schema as any) === ContentBriefSchema || (schema as any)?.shape?.corePremise) {
      const brief = {
        topic,
        angle: `An atmospheric, curiosity-driven exploration into the extreme physics, eerie lifeforms, and unexplored secrets of ${topic}.`,
        targetAudience: "Documentary lovers, curious minds, and science enthusiasts aged 18-45.",
        corePremise: `While humanity looks to outer space, one of the most alien, high-pressure, and mysterious frontiers on Earth remains hidden in ${topic}.`,
        tone: "Wonder-filled, suspenseful, deeply factual, and awe-inspiring.",
        targetWordCount: 450,
        estimatedDurationSeconds: 180,
        keyThemes: [
          "Extreme Pressure & Geological Formation",
          "Bioluminescence & Extremophile Survival",
          "Human Exploration & Unsolved Mysteries",
        ],
        visualStyle: "Deep abyss cinematic aesthetics, bio-luminescent glow against black voids, fluid macro camera glides, and 3D bathymetric overlays.",
      };
      return (schema as any).parse(brief) as T;
    }

    // 2. ResearchNote
    if ((schema as any) === ResearchNoteSchema || (schema as any)?.shape?.coreHook) {
      const research = {
        topic,
        overview: `${topic} represents one of the most extreme environments on our planet, reaching depths exceeding 11,000 meters where sunlight never penetrates and pressure exceeds 1,000 atmospheres.`,
        keyFacts: [
          {
            statement: `At the Challenger Deep, hydrostatic pressure exceeds 1,086 bar (over 15,700 psi), which is equivalent to the weight of 50 jumbo jets stacked on an individual.`,
            sourceCategory: "MEASUREMENT_DATA" as const,
            confidenceScore: 0.99,
          },
          {
            statement: `Xenophyophores and amphipods in the hadal zone use specialized piezolytes like TMAO to prevent their cellular proteins from being crushed under immense pressure.`,
            sourceCategory: "ACADEMIC_STUDY" as const,
            confidenceScore: 0.96,
          },
          {
            statement: `The deepest point was first reached in 1960 by Jacques Piccard and Don Walsh inside the bathyscaphe Trieste.`,
            sourceCategory: "HISTORICAL_RECORD" as const,
            confidenceScore: 1.0,
          },
          {
            statement: `Hydrothermal vents in the trench spew superheated liquid mineral plumes up to 400°C without boiling due to extreme ambient pressure.`,
            sourceCategory: "OBSERVATIONAL_DATA" as const,
            confidenceScore: 0.95,
          },
        ],
        counterIntuitiveInsights: [
          "Instead of a lifeless desolate desert, the hadal zone hosts a thriving ecosystem powered by chemosynthesis rather than solar photosynthesis.",
          "Sound waves travel faster and farther in deep ocean trenches due to low temperature and extreme density, creating an eerie acoustic environment.",
        ],
        historicalContext: "Formed through subduction where the Pacific Plate slides beneath the Mariana Plate, creating a trench over 2,550 kilometers long.",
        commonMisconceptions: [
          "Myth: Deep ocean waters are boiling hot everywhere. Truth: Ambient deep water is just 1 to 4 degrees Celsius, except directly adjacent to hydrothermal vents.",
          "Myth: Animals at this depth have hardened exoskeletons. Truth: Most are soft, gelatinous organisms with specialized membrane fluidity.",
        ],
        sources: [
          "National Oceanic and Atmospheric Administration (NOAA) Ocean Exploration Archives",
          "Deep-Sea Research Part I: Oceanographic Research Papers",
          "Nature Ecology & Evolution: Microbial life in Hadal Trenches",
        ],
        coreHook: `If you placed Mount Everest at the bottom of ${topic}, its peak would still be submerged under more than two kilometers of pitch-black water.`,
      };
      return (schema as any).parse(research) as T;
    }

    // 3. Script
    if ((schema as any) === ScriptSchema || (schema as any)?.shape?.hook) {
      const script = {
        title: `What Lies at the Very Bottom of ${topic}?`,
        hook: `If you placed Mount Everest at the bottom of ${topic}, its snowy peak would still be buried under two kilometers of pitch-black ocean.`,
        intro: `Welcome to CurioSphere. Today, we descend into the hadal zone—a realm of crushing pressure, alien life, and mysteries science is only beginning to decipher.`,
        sections: [
          {
            id: "sec-1",
            sectionType: "HOOK" as const,
            heading: "The Descent into Midnight",
            narration: `As you leave the sunlit surface, light disappears entirely within two hundred meters. Below that lies a world so hostile that walking on the surface of the Moon is physically easier than visiting its floor.`,
            visualDescription: "Camera begins at sunlit turquoise ocean surface and rapidly plunges into progressively darker deep blue and inky black voids.",
            soundDesignPrompt: "Subtle low-frequency drone fading out surface wave ambience into a heavy, muffled atmospheric pressure resonance.",
            estimatedDurationSeconds: 30,
          },
          {
            id: "sec-2",
            sectionType: "DEEP_DIVE" as const,
            heading: "Crushing Pressure & Alien Biology",
            narration: `At eleven thousand meters down, the water pressure reaches over one thousand times atmospheric pressure. Any standard submarine would be crushed like a soda can. Yet here, ghostly snailfish and translucent amphipods glide effortlessly, using unique organic molecules called piezolytes to prevent their cellular machinery from collapsing.`,
            visualDescription: "Macro 3D simulation of molecular piezolyte stabilization inside a hadal snailfish, contrasted with crushing bathymetric pressure vectors.",
            soundDesignPrompt: "Creaking submarine hull audio transitioning into ethereal underwater clicks and bio-harmonic echoes.",
            estimatedDurationSeconds: 45,
          },
          {
            id: "sec-3",
            sectionType: "CLIMAX" as const,
            heading: "Hydrothermal Monsters & Chemosynthesis",
            narration: `Near the seabed, hydrothermal chimneys spew mineral-rich water heated to four hundred degrees Celsius. In this sunlight-deprived darkness, life does not depend on the sun. Microbes consume toxic hydrogen sulfide, forming the base of an entirely independent food chain.`,
            visualDescription: "Eerie high-contrast underwater ROV headlights illuminating black smoker chimneys with billowing iridescent chemical clouds.",
            soundDesignPrompt: "Subterranean boiling hum and crackle of deep-sea geothermal vents.",
            estimatedDurationSeconds: 45,
          },
          {
            id: "sec-4",
            sectionType: "CONCLUSION" as const,
            heading: "The Uncharted Frontier",
            narration: `We have mapped more of the surface of Mars than we have mapped of our own ocean trenches. Every expedition brings back species never before classified by science—reminding us of how little we know about our own world.`,
            visualDescription: "3D planetary globe rotating from satellite orbital views down into glowing translucent hadal bathymetry lines.",
            soundDesignPrompt: "Uplifting wonder-filled orchestral swell with ticking clock motif.",
            estimatedDurationSeconds: 35,
          },
        ],
        outro: `The depths of our planet still harbor ancient secrets waiting in the dark.`,
        callToAction: `What do you think is waiting to be discovered in the deepest ocean trenches? Share your theory in the comments, and subscribe to CurioSphere for more journeys into the unknown.`,
        wordCount: 420,
        estimatedDurationSeconds: 180,
      };
      return (schema as any).parse(script) as T;
    }

    // 4. VideoMetadata
    if ((schema as any) === VideoMetadataSchema || (schema as any)?.shape?.titleCandidates) {
      const metadata = {
        titleCandidates: [
          {
            title: `What Scientists Actually Found at the Bottom of ${topic}`,
            hookType: "CURIOSITY_GAP" as const,
            predictedCTRScore: 94.8,
          },
          {
            title: `Why Nothing Should Be Alive Inside ${topic} (Yet It Is)`,
            hookType: "COUNTER_INTUITIVE" as const,
            predictedCTRScore: 91.2,
          },
          {
            title: `The Terrifying Reality of Earth's Deepest Point | ${topic}`,
            hookType: "EXTREME_SUPERLATIVE" as const,
            predictedCTRScore: 89.5,
          },
          {
            title: `What Happens If You Fall into ${topic}?`,
            hookType: "QUESTION" as const,
            predictedCTRScore: 88.0,
          },
        ],
        selectedTitle: `What Scientists Actually Found at the Bottom of ${topic}`,
        description: `If you placed Mount Everest at the bottom of ${topic}, its snowy peak would still be submerged under more than 2 kilometers of water.\n\nIn this episode of CurioSphere, we explore the deepest known point on Earth: the extreme pressure, the alien creatures that defy physics to live there, and the geothermal vents powering life without sunlight.\n\nTIMESTAMPS:\n00:00 The Descent into Midnight\n00:30 Crushing Pressure & Alien Biology\n01:15 Hydrothermal Chemosynthesis\n02:00 Earth's Uncharted Frontier\n02:30 What Lies Beyond?\n\n#science #documentary #curiosphere #ocean #deepsea #mysteries`,
        tags: [
          topic.toLowerCase(),
          "mariana trench",
          "deep ocean",
          "curiosphere",
          "ocean exploration",
          "challenger deep",
          "extreme biology",
          "science documentary",
        ],
        hashtags: ["#curiosphere", "#deepsea", "#sciencefacts", "#ocean"],
        categoryId: "27",
        chapters: [
          { timestamp: "00:00", title: "The Descent into Midnight" },
          { timestamp: "00:30", title: "Crushing Pressure & Alien Biology" },
          { timestamp: "01:15", title: "Hydrothermal Chemosynthesis" },
          { timestamp: "02:00", title: "Earth's Uncharted Frontier" },
          { timestamp: "02:40", title: "Conclusion & Future Missions" },
        ],
      };
      return (schema as any).parse(metadata) as T;
    }

    // 5. Array Schemas (Claims, Scenes, ThumbnailConcepts)
    if (schema instanceof z.ZodArray) {
      const elementSchema = (schema as any).element;

      // Claims
      if (elementSchema === ClaimSchema || (elementSchema as any)?.shape?.verificationStatus) {
        const claims = [
          {
            id: "claim-1",
            statement: `The Challenger Deep depth exceeds 10,900 meters below sea level.`,
            sourceReference: "NOAA Ocean Bathymetry Measurements (2021 Survey)",
            verificationStatus: "VERIFIED" as const,
            factCheckNotes: "Confirmed by multiple sonar multi-beam mapping expeditions (Challenger Deep depth range 10,902m - 10,929m).",
          },
          {
            id: "claim-2",
            statement: `Pressure at the deepest ocean trenches exceeds 1,000 atmospheres.`,
            sourceReference: "Physical Oceanography Standard Equations for Hydrostatic Pressure",
            verificationStatus: "VERIFIED" as const,
            factCheckNotes: "Hydrostatic calculation: p = rho * g * h at 11km yields ~108.6 MPa (~1,072 atm).",
          },
          {
            id: "claim-3",
            statement: `Hadal zone organisms utilize piezolytes to maintain cellular protein structure.`,
            sourceReference: "Nature Ecology & Evolution; Yancey et al., PNAS",
            verificationStatus: "VERIFIED" as const,
            factCheckNotes: "Trimethylamine N-oxide (TMAO) and other piezolytes counteract the water-disrupting effects of extreme pressure.",
          },
        ];
        return schema.parse(claims) as T;
      }

      // Scenes
      if (elementSchema === SceneSchema || (elementSchema as any)?.shape?.visualPrompt) {
        const scenes = [
          {
            sceneNumber: 1,
            sectionId: "sec-1",
            heading: "The Descent into Midnight",
            narration: `As you leave the sunlit surface, light disappears entirely within two hundred meters.`,
            visualPrompt: `Cinematic shot of ocean water fading from brilliant sunlight into absolute obsidian black abyss, 8k, volumetric light beams dissipating.`,
            bRollKeywords: ["deep ocean dark water", "submersible diving", "sunlight underwater fading"],
            visualStyle: "Deep sea dark aesthetic, 16:9 4k",
            durationSeconds: 30,
            onScreenText: "DEPTH: 200m - THE TWILIGHT ZONE",
            transitionEffect: "SMOOTH_ZOOM" as const,
          },
          {
            sceneNumber: 2,
            sectionId: "sec-2",
            heading: "Crushing Pressure",
            narration: `At eleven thousand meters down, the water pressure reaches over one thousand times atmospheric pressure.`,
            visualPrompt: `3D cross-section diagram of bathymetric depth vectors showing pressure crushing forces at 11,000 meters.`,
            bRollKeywords: ["deep sea submarine", "bathymetric sonar", "hadal snailfish macro"],
            visualStyle: "Scientific 3D animation with glowing data HUD",
            durationSeconds: 45,
            onScreenText: "PRESSURE: 1,086 ATM",
            transitionEffect: "CROSS_DISSOLVE" as const,
          },
          {
            sceneNumber: 3,
            sectionId: "sec-3",
            heading: "Hydrothermal Chemosynthesis",
            narration: `Near the seabed, hydrothermal chimneys spew mineral-rich water heated to four hundred degrees Celsius.`,
            visualPrompt: `Submersible headlights illuminating active black smoker hydrothermal chimneys with billowing iridescent chemical clouds.`,
            bRollKeywords: ["hydrothermal vent", "underwater volcano", "black smoker seabed"],
            visualStyle: "Submersible ROV 4K camera footage with particle drift",
            durationSeconds: 45,
            onScreenText: "HYDROTHERMAL VENTS: 400°C",
            transitionEffect: "WHIP_PAN" as const,
          },
          {
            sceneNumber: 4,
            sectionId: "sec-4",
            heading: "The Uncharted Frontier",
            narration: `We have mapped more of the surface of Mars than we have mapped of our own ocean trenches.`,
            visualPrompt: `Split screen comparing topographic relief maps of Mars versus unexplored blue bathymetric contours of Earth's trenches.`,
            bRollKeywords: ["mars topography", "ocean floor sonar map", "earth from space"],
            visualStyle: "Documentary comparison graphic with motion glow",
            durationSeconds: 35,
            onScreenText: "UNEXPLORED PLANET",
            transitionEffect: "FADE_TO_BLACK" as const,
          },
        ];
        return schema.parse(scenes) as T;
      }

      // Thumbnail Concepts
      if (elementSchema === ThumbnailConceptSchema || (elementSchema as any)?.shape?.headlineText) {
        const concepts = [
          {
            conceptId: "thumb-1",
            headlineText: "BOTTOM OF EARTH",
            visualDescription: `A tiny glowing submarine submersible hovering over a terrifying abyssal drop in ${topic}, with mysterious glowing eyes in the pitch black.`,
            focalElement: "High-contrast yellow research submarine beam piercing the dark abyss.",
            emotionHook: "Awe and claustrophobic dread.",
            colorPalette: ["#020813", "#00F0FF", "#FFE600", "#FF0055"],
            compositionGuidance: "Rule of thirds: submersible on bottom-left aiming headlights towards bottom-right abyss, 3-word bold yellow text top-center.",
            contrastScore: 96.5,
          },
          {
            conceptId: "thumb-2",
            headlineText: "IMPOSSIBLE LIFE",
            visualDescription: `Close-up macro of a translucent, glowing hadal creature in ${topic} looking directly into the camera with volumetric deep-sea particles.`,
            focalElement: "Alien bioluminescent sea creature glowing with neon cyan veins.",
            emotionHook: "Pure scientific curiosity.",
            colorPalette: ["#000B18", "#00FFA3", "#FFFFFF", "#7B00FF"],
            compositionGuidance: "Centered focal creature with dramatic side lighting and crisp white typography with drop shadow.",
            contrastScore: 94.0,
          },
        ];
        return schema.parse(concepts) as T;
      }
    }

    // Default fallback parsing
    try {
      return schema.parse({}) as T;
    } catch {
      throw new Error(`DeterministicMockLLMProvider cannot generate schema for: ${prompt.slice(0, 50)}`);
    }
  }
}
