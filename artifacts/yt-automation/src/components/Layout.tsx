import React from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Tv, ListVideo, Lightbulb, GraduationCap, CalendarDays, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/channels", label: "Channels", icon: Tv },
  { href: "/pipeline", label: "Video Pipeline", icon: ListVideo },
  { href: "/niches", label: "Niche Research", icon: Lightbulb },
  { href: "/guide", label: "AI Setup Guide", icon: GraduationCap },
  { href: "/schedule", label: "Schedule", icon: CalendarDays },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-72 glass-panel border-r border-white/5 flex flex-col z-40 hidden md:flex">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Tv className="w-5 h-5 text-background" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl tracking-tight text-white leading-none">AutoTube</h1>
            <p className="text-[10px] uppercase tracking-widest text-primary font-bold mt-1">AI System</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 mt-4 px-4">Menu</div>
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_10px_rgba(16,185,129,1)]" />
                )}
                <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-white")} />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto">
          <div className="rounded-xl bg-white/5 p-4 border border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                ME
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">Creator Mode</p>
                <p className="text-xs text-muted-foreground">Pro Plan</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:pl-72 flex flex-col min-h-screen relative">
        <header className="h-20 glass-panel border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-30">
          <h2 className="text-xl font-display font-semibold text-white">
            {NAV_ITEMS.find(i => i.href === location)?.label || "Overview"}
          </h2>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">System Active</span>
            </div>
          </div>
        </header>
        
        <div className="p-8 flex-1 relative">
           {children}
        </div>
      </main>
    </div>
  );
}
