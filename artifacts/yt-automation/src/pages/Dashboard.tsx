import React from "react";
import { Layout } from "@/components/Layout";
import { Card, Badge, Button } from "@/components/ui-elements";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { ArrowUpRight, TrendingUp, Users, PlaySquare, Target, Zap } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart } from 'recharts';
import { useGetEarnings, useGetDailyEarnings } from "@workspace/api-client-react";

export default function Dashboard() {
  const { data: earnings, isLoading: isLoadingEarnings } = useGetEarnings();
  const { data: dailyData, isLoading: isLoadingDaily } = useGetDailyEarnings();

  if (isLoadingEarnings || isLoadingDaily) {
    return (
      <Layout>
        <div className="flex h-64 items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const e = earnings || {
    todayEarnings: 12450,
    monthlyEarnings: 345000,
    totalEarnings: 1250000,
    targetDaily: 50000,
    progressPercent: 24.9,
    totalSubscribers: 145000,
    totalViews: 4500000,
    activeChannels: 3
  };

  const chartData = dailyData || Array.from({ length: 30 }).map((_, i) => ({
    date: `Day ${i+1}`,
    amount: Math.floor(Math.random() * 20000) + 5000,
    views: Math.floor(Math.random() * 100000),
  }));

  return (
    <Layout>
      {/* Background decoration */}
      <img 
        src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
        alt="Hero Background" 
        className="absolute inset-0 w-full h-[500px] object-cover opacity-30 pointer-events-none -z-10 mix-blend-screen mask-image-linear-gradient"
        style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)' }}
      />

      <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
          ₹50,000/Day <span className="text-gradient-primary">Automation Engine</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Your AI pipeline is actively generating content. You are currently earning <strong className="text-white">{formatCurrency(e.todayEarnings)}</strong> today.
        </p>
      </div>

      {/* Target Progress */}
      <Card className="mb-8 p-8 border-primary/20 bg-primary/5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-semibold text-white">Daily Target Progress</h3>
            </div>
            <p className="text-muted-foreground">Automated revenue goal: {formatCurrency(e.targetDaily)} / day</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-display font-bold text-primary shadow-primary/20 drop-shadow-lg">
              {formatCurrency(e.todayEarnings)}
            </div>
            <p className="text-sm font-medium text-emerald-400/80 mt-1 flex items-center justify-end gap-1">
              <ArrowUpRight className="w-4 h-4" /> {e.progressPercent.toFixed(1)}% of target
            </p>
          </div>
        </div>
        
        <div className="relative h-4 bg-background/50 rounded-full overflow-hidden border border-white/5">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-primary rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(16,185,129,0.5)]"
            style={{ width: `${Math.min(e.progressPercent, 100)}%` }}
          />
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Monthly Revenue", value: formatCurrency(e.monthlyEarnings), icon: TrendingUp, color: "text-blue-400" },
          { label: "Total Views", value: formatNumber(e.totalViews), icon: PlaySquare, color: "text-purple-400" },
          { label: "Total Subscribers", value: formatNumber(e.totalSubscribers), icon: Users, color: "text-pink-400" },
          { label: "Active Channels", value: e.activeChannels, icon: Zap, color: "text-amber-400" },
        ].map((stat, i) => (
          <Card key={i} className="p-6 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-medium text-muted-foreground">{stat.label}</h4>
            </div>
            <p className="text-2xl font-display font-bold text-white">{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-semibold text-white mb-1">Revenue Trend (30 Days)</h3>
            <p className="text-sm text-muted-foreground">Automated passive income over time</p>
          </div>
          <Button variant="outline" size="sm">Download Report</Button>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(150 100% 40%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(150 100% 40%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 10% 15%)" vertical={false} />
              <XAxis dataKey="date" stroke="hsl(240 5% 60%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(240 5% 60%)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(240 10% 8%)', border: '1px solid hsl(240 10% 15%)', borderRadius: '8px' }}
                itemStyle={{ color: 'hsl(0 0% 98%)' }}
                formatter={(value: number) => [formatCurrency(value), 'Revenue']}
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="hsl(150 100% 40%)" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorAmount)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </Layout>
  );
}
