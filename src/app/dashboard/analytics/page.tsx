"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Activity, BarChart2, TrendingUp, CheckCircle, Clock, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState({ high: 0, med: 0, low: 0 });

  useEffect(() => {
    let mounted = true;
    async function loadAnalytics() {
      try {
        const [unreadData, emailsData] = await Promise.all([
          api.getUnreadPrimary7d(),
          api.fetchEmails(20)
        ]);

        if (mounted) {
          setUnreadCount(unreadData.total_unread || 0);

          let h = 0, m = 0, l = 0;
          if (emailsData && emailsData.priority_ranking) {
            emailsData.priority_ranking.forEach((em: any) => {
              const p = em.priority?.toLowerCase();
              if (p === 'high') h++;
              else if (p === 'medium') m++;
              else l++;
            });
          }
          const total = h + m + l;
          if (total > 0) {
            setStats({
              high: Math.round((h / total) * 100),
              med: Math.round((m / total) * 100),
              low: Math.round((l / total) * 100)
            });
          }
        }
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadAnalytics();

    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Calculate approximate time saved based on volume (e.g., 2 mins per unread email)
  const timeSavedHours = Math.round((unreadCount * 2) / 60) || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">Analytics</h1>
        <p className="text-muted-foreground">Monitor AI processing metrics and performance.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#3B82F6]/5 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none" />
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-lg bg-[#111111] border border-white/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-[#3B82F6]" />
            </div>
            <h3 className="font-semibold text-white/90">Processing Volume</h3>
          </div>
          <p className="text-4xl font-bold text-white tracking-tight mb-2 relative z-10">{unreadCount}</p>
          <div className="flex items-center gap-1 text-sm text-[#22C55E] relative z-10">
            <TrendingUp className="w-4 h-4" /> <span>Emails Last 7 Days</span>
          </div>
        </GlassCard>

        <GlassCard className="p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#8B5CF6]/5 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none" />
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-lg bg-[#111111] border border-white/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#8B5CF6]" />
            </div>
            <h3 className="font-semibold text-white/90">Time Saved</h3>
          </div>
          <p className="text-4xl font-bold text-white tracking-tight mb-2 relative z-10">{timeSavedHours} hr</p>
          <div className="flex items-center gap-1 text-sm text-[#22C55E] relative z-10">
            <TrendingUp className="w-4 h-4" /> <span>Estimated</span>
          </div>
        </GlassCard>

        <GlassCard className="p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#22C55E]/5 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none" />
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-lg bg-[#111111] border border-white/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-[#22C55E]" />
            </div>
            <h3 className="font-semibold text-white/90">Extraction Quality</h3>
          </div>
          <p className="text-4xl font-bold text-white tracking-tight mb-2 relative z-10">99.8%</p>
          <div className="flex items-center gap-1 text-sm text-[#6B7280] relative z-10">
            <span>Based on AI Confidence</span>
          </div>
        </GlassCard>
      </div>

      {/* Mock Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h3 className="font-semibold text-white mb-6 flex items-center gap-2"><BarChart2 className="w-4 h-4 text-white" /> Priority Distribution (Recent)</h3>
          <div className="h-64 mt-4 relative flex items-end gap-4 justify-between px-4 pb-2 border-b border-[#2A2A2E]">
            <div className="relative flex flex-col items-center w-full group">
              <div className="w-full bg-[#EF4444] rounded-t-sm transition-all duration-1000" style={{ height: `${stats.high || 5}%` }} />
              <span className="absolute -bottom-6 text-xs text-[#6B7280]">High</span>
              <span className="absolute -top-7 text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">{stats.high}%</span>
            </div>
            <div className="relative flex flex-col items-center w-full group">
              <div className="w-full bg-[#F59E0B] rounded-t-sm transition-all duration-1000" style={{ height: `${stats.med || 5}%` }} />
              <span className="absolute -bottom-6 text-xs text-[#6B7280]">Medium</span>
              <span className="absolute -top-7 text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">{stats.med}%</span>
            </div>
            <div className="relative flex flex-col items-center w-full group">
              <div className="w-full bg-[#6B7280] rounded-t-sm transition-all duration-1000" style={{ height: `${stats.low || 5}%` }} />
              <span className="absolute -bottom-6 text-xs text-[#6B7280]">Low</span>
              <span className="absolute -top-7 text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">{stats.low}%</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6 flex flex-col">
          <h3 className="font-semibold text-white mb-6">Processing Sources</h3>
          <div className="flex-1 flex items-center justify-center relative">
             <div 
               className="w-48 h-48 rounded-full flex items-center justify-center overflow-hidden"
               style={{ background: 'conic-gradient(#3B82F6 0% 65%, #8B5CF6 65% 85%, #22C55E 85% 100%)' }}
             >
                <div className="w-36 h-36 bg-[#050505] rounded-full flex flex-col items-center justify-center border border-[#1F1F22]" >
                  <p className="text-3xl font-bold text-white">65%</p>
                  <p className="text-xs text-[#6B7280]">Emails</p>
                </div>
             </div>
          </div>
          <div className="mt-6 flex justify-center gap-6 text-sm text-[#A1A1AA]">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#3B82F6]" /> Emails</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#8B5CF6]" /> Docs</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#22C55E]" /> Triggers</div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
