import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, Button, Badge, Modal, Input, Label } from "@/components/ui-elements";
import { useListVideos, useUpdateVideo, useCreateVideo, getListVideosQueryKey, useListChannels } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { Bot, Youtube, Plus, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STAGES = [
  { id: 'idea', label: 'Idea Gen', icon: Sparkles },
  { id: 'scripting', label: 'Scripting', icon: Bot },
  { id: 'voiceover', label: 'Voiceover', icon: Bot },
  { id: 'editing', label: 'Video Edit', icon: Bot },
  { id: 'scheduled', label: 'Scheduled', icon: Youtube },
  { id: 'published', label: 'Live', icon: Youtube }
];

export default function Pipeline() {
  const { data: videos, isLoading } = useListVideos();
  const { data: channels } = useListChannels();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", topic: "", channelId: "" });

  const updateMutation = useUpdateVideo({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListVideosQueryKey() })
    }
  });

  const createMutation = useCreateVideo({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListVideosQueryKey() });
        setIsModalOpen(false);
        setFormData({ title: "", topic: "", channelId: "" });
        toast({ title: "Video entered pipeline!" });
      }
    }
  });

  const advanceStage = (video: any) => {
    const currentIndex = STAGES.findIndex(s => s.id === video.status);
    if (currentIndex < STAGES.length - 1) {
      updateMutation.mutate({ 
        id: video.id, 
        data: { status: STAGES[currentIndex + 1].id } 
      });
    }
  };

  const getChannelName = (id: number) => channels?.find(c => c.id === id)?.name || "Unknown";

  return (
    <Layout>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">AI Content Pipeline</h1>
          <p className="text-muted-foreground mt-1">Track videos progressing through the automated factory.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-5 h-5 mr-2" /> Generate Video Idea
        </Button>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-8 snap-x">
        {STAGES.map((stage) => {
          const stageVideos = videos?.filter(v => v.status === stage.id) || [];
          
          return (
            <div key={stage.id} className="min-w-[320px] w-[320px] snap-start flex flex-col h-[calc(100vh-250px)]">
              <div className="flex items-center gap-2 mb-4 px-2">
                <stage.icon className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-white uppercase tracking-wider text-sm">{stage.label}</h3>
                <Badge variant="default" className="ml-auto">{stageVideos.length}</Badge>
              </div>
              
              <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl p-3 overflow-y-auto space-y-3">
                {isLoading ? (
                  <div className="h-24 bg-white/5 animate-pulse rounded-xl" />
                ) : stageVideos.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 border-2 border-dashed border-white/5 rounded-xl p-6 text-center">
                    <p className="text-sm font-medium">No tasks</p>
                  </div>
                ) : (
                  stageVideos.map(video => (
                    <Card key={video.id} className="p-4 cursor-pointer hover:border-primary/30 group bg-card/80">
                      <div className="text-xs text-primary font-medium mb-1 truncate">{getChannelName(video.channelId)}</div>
                      <h4 className="font-semibold text-white text-sm leading-snug mb-3 line-clamp-2">{video.title}</h4>
                      
                      {video.status === 'published' && video.revenue && (
                         <div className="mb-3 text-sm text-emerald-400 font-bold bg-emerald-400/10 inline-block px-2 py-1 rounded-md">
                           Earned: {formatCurrency(video.revenue)}
                         </div>
                      )}
                      
                      {video.status !== 'published' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-xs h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => advanceStage(video)}
                          isLoading={updateMutation.isPending && updateMutation.variables?.id === video.id}
                        >
                          Trigger Next Step <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Generate New Concept">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ data: { ...formData, channelId: parseInt(formData.channelId) } }); }} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="channelId">Target Channel</Label>
            <select 
              id="channelId"
              className="flex h-11 w-full rounded-xl border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              value={formData.channelId}
              onChange={(e) => setFormData({ ...formData, channelId: e.target.value })}
              required
            >
              <option value="">Select Channel</option>
              {channels?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="topic">Topic / Keyword</Label>
            <Input 
              id="topic" 
              placeholder="e.g., Stoicism for modern life" 
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">AI Generated Title (or write your own)</Label>
            <Input 
              id="title" 
              placeholder="e.g., 7 Stoic Habits to Build Unbreakable Discipline" 
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="pt-4 flex gap-3 justify-end">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              <Sparkles className="w-4 h-4 mr-2" /> Start Generation
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
