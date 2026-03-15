import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, Badge } from "@/components/ui-elements";
import { ChevronDown, Code, Copy, CheckCircle2, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    id: 1,
    title: "Niche Selection & Idea Gen",
    tool: "ChatGPT Plus / Claude 3",
    cost: "Free - $20/mo",
    content: "Ask the AI to generate viral topics within high CPM niches. You want evergreen content that solves problems or tells compelling stories.",
    prompt: `Act as an expert YouTube strategist. Give me 10 viral video ideas in the [Insert Niche] niche that have high search volume but low competition. Format as: Title | Target Audience | Core Hook.`
  },
  {
    id: 2,
    title: "Script Writing",
    tool: "ChatGPT Plus / Claude 3",
    cost: "Included",
    content: "The script is the most important part. It needs a strong hook in the first 5 seconds to retain viewer attention.",
    prompt: `Write a highly engaging 1500-word YouTube script for the title: "[Title]". Structure it with a 15-second hook that creates curiosity, an intro explaining the value, the main body split into 5 distinct actionable points, and a fast outro with a call to action. Use a conversational, authoritative tone.`
  },
  {
    id: 3,
    title: "AI Voiceover Generation",
    tool: "ElevenLabs",
    cost: "$5 - $22/mo",
    content: "Do not use robotic text-to-speech. Use ElevenLabs for hyper-realistic human voices. 'Adam' or 'Marcus' voices work exceptionally well for faceless channels.",
    prompt: "No prompt needed. Just paste your generated script into ElevenLabs, select an authoritative voice, and adjust stability to 45% and clarity to 75%."
  },
  {
    id: 4,
    title: "Visuals & Editing Automation",
    tool: "Pictory.ai / InVideo AI / CapCut",
    cost: "$20 - $30/mo",
    content: "Feed your script and voiceover into an AI video generator. It will automatically pull relevant stock B-roll and sync it to the audio with captions.",
    prompt: "Upload script to Pictory -> Choose 'Script to Video' -> Let AI select B-roll -> Adjust any mismatched clips manually -> Export 1080p."
  },
  {
    id: 5,
    title: "Clickable Thumbnails",
    tool: "Midjourney + Canva",
    cost: "$10/mo + Free",
    content: "Your thumbnail dictates your CTR (Click-Through Rate). It must be visually striking with minimal text (max 3 words).",
    prompt: `/imagine prompt: a cinematic close-up of an ancient stoic philosopher looking intensely at the camera, glowing neon cyan and emerald background, hyper-realistic, 8k, dramatic lighting --ar 16:9`
  },
  {
    id: 6,
    title: "SEO & Auto-Publishing",
    tool: "VidIQ / TubeBuddy",
    cost: "Free tier",
    content: "Optimize your title, description, and tags to rank in YouTube Search, allowing the video to get passive views for years.",
    prompt: `Act as an SEO expert. Write an optimized YouTube description for my video titled "[Title]". Include primary keywords naturally in the first 2 sentences. Give me 15 highly searched tags comma-separated.`
  }
];

export default function Guide() {
  const [openStep, setOpenStep] = useState<number | null>(1);
  const [copied, setCopied] = useState<number | null>(null);

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-10 text-center animate-in fade-in slide-in-from-bottom-4">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6 text-primary">
            <Rocket className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-4">The ₹50k/Day Blueprint</h1>
          <p className="text-muted-foreground text-lg">
            Follow this exact pipeline to fully automate a faceless YouTube channel. No face, no voice, no editing skills required.
          </p>
        </div>

        <div className="space-y-4">
          {STEPS.map((step) => (
            <Card key={step.id} className={cn("transition-all duration-300", openStep === step.id ? "ring-2 ring-primary/50" : "")}>
              <button 
                className="w-full flex items-center justify-between p-6 text-left"
                onClick={() => setOpenStep(openStep === step.id ? null : step.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-lg",
                    openStep === step.id ? "bg-primary text-background" : "bg-white/5 text-muted-foreground"
                  )}>
                    {step.id}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{step.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm font-medium text-accent">{step.tool}</span>
                      <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded-sm">Cost: {step.cost}</span>
                    </div>
                  </div>
                </div>
                <ChevronDown className={cn("w-6 h-6 text-muted-foreground transition-transform duration-300", openStep === step.id ? "rotate-180" : "")} />
              </button>

              {openStep === step.id && (
                <div className="px-6 pb-6 pt-2 border-t border-white/5 animate-in slide-in-from-top-2 fade-in">
                  <p className="text-foreground leading-relaxed mb-6">
                    {step.content}
                  </p>
                  
                  <div className="bg-background rounded-xl border border-white/10 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <Code className="w-4 h-4" /> Recommended Prompt
                      </div>
                      <button 
                        onClick={() => copyToClipboard(step.prompt, step.id)}
                        className="text-muted-foreground hover:text-white transition-colors"
                      >
                        {copied === step.id ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="p-4 bg-black/50">
                      <code className="text-sm text-emerald-300 font-mono leading-relaxed whitespace-pre-wrap">
                        {step.prompt}
                      </code>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
