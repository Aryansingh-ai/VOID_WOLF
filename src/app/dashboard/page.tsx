import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Mail, FileText, Brain, ArrowRight, Play, Activity, Clock } from "lucide-react";
import AnoAI from "@/components/ui/animated-shader-background";

export default function OverviewPage() {
  return (
    <div className="relative min-h-[calc(100vh-6rem)] w-full overflow-hidden rounded-2xl animate-in fade-in zoom-in duration-500">
      <AnoAI />
      
      <div className="relative z-10 p-4 md:p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Good morning, Admin</h1>
          <p className="text-muted-foreground">Run your AI operations from one command center.</p>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickActions.map((mod, i) => (
          <GlassCard key={i} className="p-6 flex flex-col group relative overflow-hidden text-left shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            <div className={`absolute inset-0 bg-gradient-to-br ${mod.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 border border-white/10 group-hover:scale-110 transition-transform">
              <mod.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{mod.title}</h3>
            <p className="text-sm text-muted-foreground flex-1 mb-6">{mod.desc}</p>
            <Link href={mod.href}>
              <Button className="w-full bg-white hover:bg-[#E5E5E5] text-black font-semibold shadow-none transition-all">
                Open Module
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </GlassCard>
        ))}
      </div>

      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-white" />
          Recent Work
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recentWork.map((work, i) => (
            <GlassCard key={i} className="p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium px-2 py-1 rounded bg-[#6B7280]/10 text-[#A1A1AA]">
                  {work.type}
                </span>
                <span className="text-xs text-[#A1A1AA] flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {work.time}
                </span>
              </div>
              <p className="text-sm font-medium text-white line-clamp-2">{work.title}</p>
              <Button variant="ghost" className="w-fit p-0 h-auto text-[#3B82F6] hover:text-[#3B82F6]/80 hover:bg-transparent text-sm">
                View Result <Play className="w-3 h-3 ml-1 fill-current" />
              </Button>
            </GlassCard>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}

const quickActions = [
  { title: "Email Intelligence", desc: "Process and summarize your flooded inbox.", icon: Mail, href: "/dashboard/email", color: "from-white/10 to-transparent" },
  { title: "Documents", desc: "Extract insights from PDFs and Word docs.", icon: FileText, href: "/dashboard/documents", color: "from-white/10 to-transparent" },
  { title: "Summarization Studio", desc: "Custom AI tasks and text processing.", icon: Brain, href: "/dashboard/tasks", color: "from-white/10 to-transparent" },
];

const recentWork = [
  { type: "Document Summary", title: "Q3 Financial Report Analysis", time: "10 mins ago" },
  { type: "Email Priority", title: "Extracted 3 High Priority emails from 'Investors'", time: "1 hour ago" },
  { type: "Workflow", title: "Daily Sync Meeting Notes Extracted", time: "3 hours ago" },
];
