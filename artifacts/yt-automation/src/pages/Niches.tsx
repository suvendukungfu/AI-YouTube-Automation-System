import React from "react";
import { Layout } from "@/components/Layout";
import { Card, Badge, Button } from "@/components/ui-elements";
import { useListNiches } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";
import { Filter, Zap, DollarSign, Activity } from "lucide-react";

export default function Niches() {
  const { data: niches, isLoading } = useListNiches();

  return (
    <Layout>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Profitable Niches Matrix</h1>
          <p className="text-muted-foreground mt-1">Data-backed niches optimized for high CPM and AI automation.</p>
        </div>
        <Button variant="outline"><Filter className="w-4 h-4 mr-2" /> Filter Database</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          [1,2,3,4].map(i => <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse" />)
        ) : (
          niches?.map((niche) => (
            <Card key={niche.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">{niche.name}</h3>
                  <div className="flex gap-2">
                    <Badge variant="info">{niche.category}</Badge>
                    <Badge variant={niche.competition === 'low' ? 'success' : niche.competition === 'medium' ? 'warning' : 'destructive'}>
                      {niche.competition.toUpperCase()} COMPETITION
                    </Badge>
                  </div>
                </div>
                <div className="text-right bg-primary/10 border border-primary/20 rounded-xl p-3">
                  <div className="text-xs text-primary font-bold uppercase tracking-wide mb-1">Avg CPM</div>
                  <div className="text-xl font-display font-bold text-white">{formatCurrency(niche.cpm)}</div>
                </div>
              </div>

              <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                {niche.description}
              </p>

              <div className="grid grid-cols-2 gap-6 mb-6 pt-6 border-t border-white/5">
                <div>
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Zap className="w-3 h-3 text-accent" /> Recommended AI Stack
                  </h4>
                  <ul className="space-y-2">
                    {niche.aiTools.map((tool, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent/50" /> {tool}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Activity className="w-3 h-3 text-emerald-400" /> Benchmark Channels
                  </h4>
                  <ul className="space-y-2">
                    {niche.exampleChannels.map((ch, i) => (
                      <li key={i} className="text-sm text-emerald-400/80 hover:text-emerald-400 cursor-pointer flex items-center gap-2 transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/50" /> {ch}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Button className="w-full">Initialize Pipeline in this Niche</Button>
            </Card>
          ))
        )}
      </div>
    </Layout>
  );
}
