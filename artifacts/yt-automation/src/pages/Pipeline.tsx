import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, Button, Badge, Modal, Input, Label } from "@/components/ui-elements";
import { useListVideos, useUpdateVideo, useCreateVideo, getListVideosQueryKey, useListChannels } from "@workspace/api-client-react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import {
  Bot,
  Youtube,
  Plus,
  ArrowRight,
  Sparkles,
  Play,
  RotateCw,
  CheckCircle,
  AlertTriangle,
  FileText,
  Mic,
  Film,
  Image as ImageIcon,
  ShieldCheck,
  Clock,
  Terminal,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STAGES = [
  { id: 'idea', label: 'Idea Gen', icon: Sparkles },
  { id: 'scripting', label: 'Scripting', icon: Bot },
  { id: 'voiceover', label: 'Voiceover', icon: Bot },
  { id: 'editing', label: 'Video Edit', icon: Bot },
  { id: 'scheduled', label: 'Scheduled', icon: Youtube },
  { id: 'published', label: 'Live', icon: Youtube }
];

interface ProductionJob {
  id: number;
  idempotencyKey: string;
  channelId: number;
  title: string;
  topic: string;
  targetDurationSeconds: number;
  status: string;
  currentStage: string;
  progressPercent: number;
  retryCount: number;
  maxRetries: number;
  stageTimestamps: Record<string, string>;
  researchData?: { overview?: string; facts?: string[]; coreHook?: string };
  scriptData?: { hook?: string; intro?: string; scenes?: any[]; outro?: string; wordCount?: number };
  voiceData?: { voiceName?: string; durationSec?: number; audioUrl?: string };
  visualAssets?: { bRollClips?: any[]; aiImages?: any[] };
  renderData?: { outputUrl?: string; resolution?: string; fps?: number; durationSec?: number };
  thumbnailData?: { thumbnailUrl?: string; headline?: string; contrastScore?: number };
  metadata?: { youtubeTitle?: string; description?: string; tags?: string[]; hashtags?: string[] };
  qaResults?: { passed: boolean; checks?: Array<{ name: string; status: string; details?: string }> };
  errorDetails?: { stage?: string; message?: string };
  createdAt: string;
  updatedAt: string;
}

interface JobLog {
  id: number;
  jobId: number;
  level: string;
  stage: string;
  message: string;
  createdAt: string;
}

export default function Pipeline() {
  const { data: videos, isLoading: isVideosLoading } = useListVideos();
  const { data: channels } = useListChannels();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<"jobs" | "board">("jobs");
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ProductionJob | null>(null);
  const [jobLogs, setJobLogs] = useState<JobLog[]>([]);
  const [quickPrompt, setQuickPrompt] = useState("");

  const [jobFormData, setJobFormData] = useState({
    channelId: "",
    topic: "",
    title: "",
    targetDurationSeconds: 180,
    autoRun: true,
  });

  // Fetch Jobs
  const { data: jobs, isLoading: isJobsLoading, refetch: refetchJobs } = useQuery<ProductionJob[]>({
    queryKey: ["/api/jobs"],
    queryFn: async () => {
      const res = await fetch("/api/jobs");
      if (!res.ok) throw new Error("Failed to fetch jobs");
      return res.json();
    },
    refetchInterval: 3000,
  });

  // Fetch Logs when a job is inspected
  const fetchLogs = async (jobId: number) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/logs`);
      if (res.ok) {
        const data = await res.json();
        setJobLogs(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!selectedJob) {
      return;
    }
    fetchLogs(selectedJob.id);
    const interval = setInterval(() => {
      fetchLogs(selectedJob.id);
      fetch(`/api/jobs/${selectedJob.id}`)
        .then((r) => r.json())
        .then((data) => setSelectedJob(data))
        .catch(() => {});
    }, 2500);
    return () => clearInterval(interval);
  }, [selectedJob?.id]);

  // Job Actions
  const createJobMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create job");
      }
      return res.json();
    },
    onSuccess: (newJob) => {
      refetchJobs();
      queryClient.invalidateQueries({ queryKey: getListVideosQueryKey() });
      setIsCreateJobOpen(false);
      setJobFormData({ channelId: "", topic: "", title: "", targetDurationSeconds: 180, autoRun: true });
      setSelectedJob(newJob);
      toast({ title: "Pipeline Activated!", description: `Job for "${newJob.topic}" created.` });
    },
    onError: (err: any) => {
      toast({ title: "Job Creation Failed", description: err.message, variant: "destructive" });
    }
  });

  const advanceJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const res = await fetch(`/api/jobs/${jobId}/advance`, { method: "POST" });
      if (!res.ok) throw new Error("Advance failed");
      return res.json();
    },
    onSuccess: (updated) => {
      refetchJobs();
      setSelectedJob(updated);
      toast({ title: `Stage Advanced: ${updated.status}` });
    }
  });

  const runJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const res = await fetch(`/api/jobs/${jobId}/run`, { method: "POST" });
      if (!res.ok) throw new Error("Run failed");
      return res.json();
    },
    onSuccess: (updated) => {
      refetchJobs();
      setSelectedJob(updated);
      toast({ title: `Pipeline Completed: ${updated.status}` });
    }
  });

  const retryJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const res = await fetch(`/api/jobs/${jobId}/retry`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Retry failed");
      }
      return res.json();
    },
    onSuccess: (updated) => {
      refetchJobs();
      setSelectedJob(updated);
      toast({ title: `Job Resumed!`, description: `Now at ${updated.status}` });
    },
    onError: (err: any) => {
      toast({ title: "Retry Failed", description: err.message, variant: "destructive" });
    }
  });

  const handleQuickCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPrompt.trim()) return;

    // Parse "Make today's CurioSphere video about [topic]" or any topic phrase
    let topic = quickPrompt.trim();
    const prefixMatch = topic.match(/make(?: today'?s)? (?:curiosphere )?video about (.+)/i);
    if (prefixMatch && prefixMatch[1]) {
      topic = prefixMatch[1].trim();
    }

    const defaultChannelId = channels?.[0]?.id || 1;
    const title = topic.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

    createJobMutation.mutate({
      channelId: defaultChannelId,
      topic,
      title: `${title} | CurioSphere Explains`,
      targetDurationSeconds: 180,
      autoRun: true,
    });
    setQuickPrompt("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "READY_TO_UPLOAD":
      case "PUBLISHED":
      case "UPLOADED":
        return <Badge variant="success">{status}</Badge>;
      case "FAILED":
      case "QA_FAILED":
        return <Badge variant="destructive">{status}</Badge>;
      case "IDEA":
      case "RESEARCHED":
      case "SCRIPT_READY":
      case "VOICE_READY":
      case "ASSETS_READY":
      case "RENDERED":
      case "THUMBNAIL_READY":
        return <Badge variant="info">{status}</Badge>;
      default:
        return <Badge variant="warning">{status}</Badge>;
    }
  };

  const getChannelName = (id: number) => channels?.find(c => c.id === id)?.name || "CurioSphere Channel";

  return (
    <Layout>
      {/* Header & Quick Command Bar */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
              <Sparkles className="w-7 h-7 text-primary" /> CurioSphere Video Factory
            </h1>
            <p className="text-muted-foreground mt-1">
              End-to-end autonomous video production engine with stateful lifecycle orchestration.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setActiveTab("jobs")}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "jobs" ? "bg-primary text-black shadow-md" : "text-muted-foreground hover:text-white"
                }`}
              >
                Production Engine ({jobs?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("board")}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "board" ? "bg-primary text-black shadow-md" : "text-muted-foreground hover:text-white"
                }`}
              >
                Kanban Matrix ({videos?.length || 0})
              </button>
            </div>
            <Button onClick={() => setIsCreateJobOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> New Job
            </Button>
          </div>
        </div>

        {/* Natural Language Trigger Bar */}
        <Card className="p-4 bg-linear-to-r from-primary/10 via-background to-accent/10 border-primary/30">
          <form onSubmit={handleQuickCommand} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Terminal className="w-5 h-5 text-primary absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Command: 'Make today\'s CurioSphere video about Why Time Moves Faster As You Age'..."
                value={quickPrompt}
                onChange={(e) => setQuickPrompt(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono"
              />
            </div>
            <Button type="submit" isLoading={createJobMutation.isPending} className="w-full sm:w-auto">
              <Sparkles className="w-4 h-4 mr-2" /> Auto-Produce Video
            </Button>
          </form>
        </Card>
      </div>

      {activeTab === "jobs" ? (
        /* Jobs List & Live Progress Table */
        <div className="space-y-4">
          {isJobsLoading ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-2xl bg-white/5 animate-pulse" />)}
            </div>
          ) : !jobs || jobs.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-white/10">
              <Bot className="w-12 h-12 text-primary mx-auto mb-3 opacity-60" />
              <h3 className="text-xl font-bold text-white mb-1">No Active Production Jobs</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
                Enter a topic command above to initiate an automated 20-stage production lifecycle.
              </p>
              <Button onClick={() => setIsCreateJobOpen(true)}>Launch First Job</Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {jobs.map((job) => (
                <Card
                  key={job.id}
                  className="p-5 hover:border-primary/40 transition-all cursor-pointer bg-card/90"
                  onClick={() => setSelectedJob(job)}
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-primary font-bold">JOB #{job.id}</span>
                        {getStatusBadge(job.status)}
                        <span className="text-xs text-muted-foreground">
                          {getChannelName(job.channelId)} • {job.targetDurationSeconds}s Target
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white truncate">{job.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">Topic: {job.topic}</p>
                    </div>

                    {/* Progress Bar & Stage Indicator */}
                    <div className="w-full lg:w-72 space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-primary font-mono">{job.currentStage}</span>
                        <span className="text-white">{job.progressPercent}%</span>
                      </div>
                      <div className="h-2.5 bg-background rounded-full overflow-hidden border border-white/10">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            job.status === "FAILED" || job.status === "QA_FAILED"
                              ? "bg-destructive"
                              : "bg-linear-to-r from-emerald-500 to-primary"
                          }`}
                          style={{ width: `${job.progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end lg:self-center" onClick={(e) => e.stopPropagation()}>
                      {job.status === "FAILED" || job.status === "QA_FAILED" ? (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => retryJobMutation.mutate(job.id)}
                          isLoading={retryJobMutation.isPending && retryJobMutation.variables === job.id}
                        >
                          <RotateCw className="w-3.5 h-3.5 mr-1.5" /> Retry ({job.retryCount}/{job.maxRetries})
                        </Button>
                      ) : job.status !== "READY_TO_UPLOAD" && job.status !== "PUBLISHED" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => advanceJobMutation.mutate(job.id)}
                          isLoading={advanceJobMutation.isPending && advanceJobMutation.variables === job.id}
                        >
                          <Play className="w-3.5 h-3.5 mr-1.5" /> Next Stage
                        </Button>
                      ) : (
                        <Badge variant="success" className="px-3 py-1 text-xs">
                          <CheckCircle className="w-3.5 h-3.5 mr-1 inline" /> Ready
                        </Badge>
                      )}

                      <Button variant="ghost" size="sm" onClick={() => setSelectedJob(job)}>
                        Inspect <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Legacy Kanban Board */
        <div className="flex gap-6 overflow-x-auto pb-8 snap-x">
          {STAGES.map((stage) => {
            const stageVideos = videos?.filter(v => v.status === stage.id) || [];
            return (
              <div key={stage.id} className="min-w-[320px] w-[320px] snap-start flex flex-col h-[calc(100vh-280px)]">
                <div className="flex items-center gap-2 mb-4 px-2">
                  <stage.icon className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-white uppercase tracking-wider text-sm">{stage.label}</h3>
                  <Badge variant="default" className="ml-auto">{stageVideos.length}</Badge>
                </div>
                <div className="flex-1 bg-white/2 border border-white/5 rounded-2xl p-3 overflow-y-auto space-y-3">
                  {stageVideos.map(video => (
                    <Card key={video.id} className="p-4 hover:border-primary/30 group bg-card/80">
                      <div className="text-xs text-primary font-medium mb-1 truncate">{getChannelName(video.channelId)}</div>
                      <h4 className="font-semibold text-white text-sm leading-snug mb-3 line-clamp-2">{video.title}</h4>
                      {video.revenue && (
                        <div className="text-sm text-emerald-400 font-bold bg-emerald-400/10 px-2 py-1 rounded-md mb-2">
                          Earned: {formatCurrency(video.revenue)}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Job Details & Inspection Modal */}
      {selectedJob && (
        <Modal
          isOpen={Boolean(selectedJob)}
          onClose={() => setSelectedJob(null)}
          title={`Job #${selectedJob.id}: ${selectedJob.title}`}
        >
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
            {/* Stage Progress Banner */}
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {getStatusBadge(selectedJob.status)}
                  <span className="text-xs font-mono text-muted-foreground">Key: {selectedJob.idempotencyKey.slice(0, 20)}...</span>
                </div>
                <p className="text-sm font-medium text-white">Target Duration: {selectedJob.targetDurationSeconds}s</p>
              </div>
              <div className="flex gap-2">
                {selectedJob.status === "FAILED" ? (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => retryJobMutation.mutate(selectedJob.id)}
                    isLoading={retryJobMutation.isPending}
                  >
                    <RotateCw className="w-3.5 h-3.5 mr-1" /> Retry Checkpoint
                  </Button>
                ) : selectedJob.status !== "READY_TO_UPLOAD" ? (
                  <Button
                    size="sm"
                    onClick={() => runJobMutation.mutate(selectedJob.id)}
                    isLoading={runJobMutation.isPending}
                  >
                    <Play className="w-3.5 h-3.5 mr-1" /> Run Full Pipeline
                  </Button>
                ) : null}
              </div>
            </div>

            {/* Stage Tabs / Payloads */}
            <div className="space-y-4 text-sm">
              {/* Research */}
              {selectedJob.researchData && (
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
                  <h4 className="font-bold flex items-center gap-2 text-xs uppercase tracking-wider text-primary">
                    <FileText className="w-4 h-4" /> Synthesized Research
                  </h4>
                  <p className="text-xs text-muted-foreground">{selectedJob.researchData.overview}</p>
                  <ul className="list-disc list-inside space-y-1 text-xs text-white/90">
                    {selectedJob.researchData.facts?.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
              )}

              {/* Script Scenes */}
              {selectedJob.scriptData && (
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                  <h4 className="font-bold flex items-center gap-2 text-xs uppercase tracking-wider text-accent">
                    <Bot className="w-4 h-4" /> Scene-by-Scene Script ({selectedJob.scriptData.wordCount} words)
                  </h4>
                  <p className="text-xs italic text-emerald-400">Hook: "{selectedJob.scriptData.hook}"</p>
                  <div className="space-y-2">
                    {selectedJob.scriptData.scenes?.map((scene: any) => (
                      <div key={scene.sceneNumber} className="p-2.5 rounded-lg bg-white/5 text-xs space-y-1">
                        <div className="font-semibold text-white">Scene {scene.sceneNumber}: {scene.heading} ({scene.estimatedDurationSec}s)</div>
                        <p className="text-muted-foreground">{scene.narration}</p>
                        <p className="text-[11px] text-accent">Visual: {scene.visualDescription}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Voice & Audio */}
              {selectedJob.voiceData && (
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-1">
                  <h4 className="font-bold flex items-center gap-2 text-xs uppercase tracking-wider text-blue-400">
                    <Mic className="w-4 h-4" /> Voiceover Track
                  </h4>
                  <p className="text-xs text-muted-foreground">Voice: {selectedJob.voiceData.voiceName} • {selectedJob.voiceData.durationSec}s audio duration</p>
                </div>
              )}

              {/* QA Checks */}
              {selectedJob.qaResults && (
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
                  <h4 className="font-bold flex items-center gap-2 text-xs uppercase tracking-wider text-emerald-400">
                    <ShieldCheck className="w-4 h-4" /> Broadcast QA Verification ({selectedJob.qaResults.passed ? "PASSED" : "FAILED"})
                  </h4>
                  <div className="grid grid-cols-1 gap-1.5">
                    {selectedJob.qaResults.checks?.map((c, i) => (
                      <div key={i} className="flex items-center justify-between text-xs p-2 rounded bg-white/5">
                        <span className="text-white">{c.name}</span>
                        <span className="text-emerald-400 font-mono text-[11px]">{c.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* YouTube Metadata */}
              {selectedJob.metadata && (
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
                  <h4 className="font-bold flex items-center gap-2 text-xs uppercase tracking-wider text-pink-400">
                    <Youtube className="w-4 h-4" /> YouTube Publishing Package
                  </h4>
                  <p className="text-xs font-semibold text-white">{selectedJob.metadata.youtubeTitle}</p>
                  <p className="text-xs text-muted-foreground whitespace-pre-line">{selectedJob.metadata.description}</p>
                </div>
              )}

              {/* Execution Audit Logs */}
              <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-2">
                <h4 className="font-bold flex items-center gap-2 text-xs uppercase tracking-wider text-amber-400">
                  <Terminal className="w-4 h-4" /> Real-time Audit Logs
                </h4>
                <div className="h-40 overflow-y-auto space-y-1.5 font-mono text-xs pr-1">
                  {jobLogs.length === 0 ? (
                    <p className="text-muted-foreground text-xs">No logs recorded yet.</p>
                  ) : (
                    jobLogs.map((log) => (
                      <div key={log.id} className="text-[11px] leading-relaxed">
                        <span className="text-muted-foreground">[{new Date(log.createdAt).toLocaleTimeString()}]</span>{" "}
                        <span className={`font-semibold ${log.level === 'error' ? 'text-destructive' : log.level === 'warn' ? 'text-yellow-400' : 'text-primary'}`}>
                          [{log.stage}]
                        </span>{" "}
                        <span className="text-white/80">{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Job Modal */}
      <Modal isOpen={isCreateJobOpen} onClose={() => setIsCreateJobOpen(false)} title="Configure Production Job">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createJobMutation.mutate({
              ...jobFormData,
              channelId: parseInt(jobFormData.channelId),
            });
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="channelSelect">Target Channel</Label>
            <select
              id="channelSelect"
              className="flex h-11 w-full rounded-xl border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              value={jobFormData.channelId}
              onChange={(e) => setJobFormData({ ...jobFormData, channelId: e.target.value })}
              required
            >
              <option value="">Select Target Channel</option>
              {channels?.map(c => <option key={c.id} value={c.id}>{c.name} ({c.niche})</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topicInput">Topic / Subject</Label>
            <Input
              id="topicInput"
              placeholder="e.g., The Physics of Black Hole Information Paradox"
              value={jobFormData.topic}
              onChange={(e) => setJobFormData({ ...jobFormData, topic: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="titleInput">Working Title</Label>
            <Input
              id="titleInput"
              placeholder="e.g., What Happens When Information Enters a Black Hole?"
              value={jobFormData.title}
              onChange={(e) => setJobFormData({ ...jobFormData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="durationInput">Target Duration (Seconds)</Label>
            <Input
              id="durationInput"
              type="number"
              value={jobFormData.targetDurationSeconds}
              onChange={(e) => setJobFormData({ ...jobFormData, targetDurationSeconds: parseInt(e.target.value) || 180 })}
              required
            />
          </div>

          <div className="pt-4 flex gap-3 justify-end">
            <Button type="button" variant="ghost" onClick={() => setIsCreateJobOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={createJobMutation.isPending}>
              <Sparkles className="w-4 h-4 mr-2" /> Initialize Pipeline
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
