import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, Button, Badge, Modal, Input, Label } from "@/components/ui-elements";
import { Plus, Users, PlaySquare, TrendingUp, ExternalLink } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { useListChannels, useCreateChannel, getListChannelsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Channels() {
  const { data: channels, isLoading } = useListChannels();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", niche: "" });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createMutation = useCreateChannel({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListChannelsQueryKey() });
        setIsModalOpen(false);
        setFormData({ name: "", niche: "" });
        toast({ title: "Channel integrated successfully!", variant: "default" });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ data: formData });
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Automated Channels</h1>
          <p className="text-muted-foreground mt-1">Manage your fleet of faceless YouTube channels.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-5 h-5 mr-2" /> Add New Channel
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {channels?.map((channel) => (
            <Card key={channel.id} className="p-6 flex flex-col group">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{channel.name}</h3>
                  <Badge variant="info">{channel.niche}</Badge>
                </div>
                <Badge variant={channel.status === 'active' ? 'success' : channel.status === 'growing' ? 'warning' : 'default'}>
                  {channel.status.toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 flex-1">
                <div className="bg-background/50 rounded-xl p-3 border border-white/5">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
                    <Users className="w-3.5 h-3.5" /> Subs
                  </div>
                  <div className="text-lg font-semibold text-white">{formatNumber(channel.subscribers)}</div>
                </div>
                <div className="bg-background/50 rounded-xl p-3 border border-white/5">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
                    <PlaySquare className="w-3.5 h-3.5" /> Views
                  </div>
                  <div className="text-lg font-semibold text-white">{formatNumber(channel.totalViews)}</div>
                </div>
                <div className="bg-background/50 rounded-xl p-3 border border-white/5 col-span-2 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" /> Monthly Revenue
                  </div>
                  <div className="text-lg font-bold text-primary">{formatCurrency(channel.monthlyRevenue)}</div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex gap-3">
                <Button variant="outline" className="flex-1">Analytics</Button>
                <Button variant="ghost" className="px-3"><ExternalLink className="w-4 h-4" /></Button>
              </div>
            </Card>
          ))}
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="rounded-2xl border-2 border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 flex flex-col items-center justify-center p-8 text-muted-foreground hover:text-primary min-h-[300px]"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold">Launch New Channel</h3>
            <p className="text-sm mt-2 text-center">Start dominating a new niche</p>
          </button>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Integrate New Channel">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Channel Name</Label>
            <Input 
              id="name" 
              placeholder="e.g., Stoic Wisdom Daily" 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="niche">Niche / Category</Label>
            <Input 
              id="niche" 
              placeholder="e.g., Philosophy, Finance, Tech" 
              value={formData.niche}
              onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
              required
            />
          </div>
          <div className="pt-4 flex gap-3 justify-end">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={createMutation.isPending}>Create Pipeline</Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
