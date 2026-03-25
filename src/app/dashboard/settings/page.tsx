"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings2, Key, Database, Shield, Zap } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">Settings</h1>
        <p className="text-muted-foreground">Configure your UNIFIED AI environment.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Sidebar Nav (mock) */}
        <div className="flex flex-col gap-2">
          <Button variant="ghost" className="justify-start bg-white/10 text-white shadow-sm"><Settings2 className="w-4 h-4 mr-2" /> General</Button>
          <Button variant="ghost" className="justify-start text-muted-foreground hover:text-white hover:bg-white/5"><Key className="w-4 h-4 mr-2" /> API Keys</Button>
          <Button variant="ghost" className="justify-start text-muted-foreground hover:text-white hover:bg-white/5"><Database className="w-4 h-4 mr-2" /> Models</Button>
          <Button variant="ghost" className="justify-start text-muted-foreground hover:text-white hover:bg-white/5"><Shield className="w-4 h-4 mr-2" /> Security</Button>
        </div>

        {/* Content */}
        <div className="md:col-span-3 space-y-6">
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-1">API Base Configuration</h2>
            <p className="text-sm text-muted-foreground mb-6">Change the endpoint from where your AI functions trigger.</p>
            
            <div className="space-y-4">
               <div>
                 <label className="text-sm font-medium text-white/90 mb-2 block">Base URL</label>
                 <Input defaultValue="https://api.unified-ai.dev/v1" className="bg-black/50 border-white/10 focus-visible:ring-primary text-white font-mono" />
               </div>
               <div>
                 <label className="text-sm font-medium text-white/90 mb-2 block">Environment</label>
                 <select className="flex h-10 w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary">
                    <option>Production (Stable)</option>
                    <option>Staging</option>
                    <option>Development</option>
                 </select>
               </div>
               <Button className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_10px_rgba(0,255,255,0.4)] transition-all">Save Configuration</Button>
            </div>
          </GlassCard>

          <GlassCard className="p-6 border-t-4 border-t-primary/50">
            <h2 className="text-lg font-bold text-white mb-1">Model Engine</h2>
            <p className="text-sm text-muted-foreground mb-6">Select the primary model powering your intelligence extraction.</p>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/50 ring-1 ring-primary/20 cursor-pointer shadow-[inset_0_0_15px_rgba(0,255,255,0.05)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-black/50 border border-primary/30 flex items-center justify-center shadow-[0_0_10px_rgba(0,255,255,0.2)]">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Unified Turbo <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-primary text-primary-foreground uppercase font-bold">Default</span></h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Fastest model, optimized for daily ops.</p>
                  </div>
                </div>
                <div className="w-5 h-5 rounded-full border-4 border-primary bg-black shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
              </label>

              <label className="flex items-center justify-between p-4 rounded-lg bg-black/40 border border-white/10 hover:border-white/30 cursor-pointer transition-colors opacity-70">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-black/50 border border-white/10 flex items-center justify-center">
                    <Database className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Unified Opus</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Heavy reasoning for complex documents.</p>
                  </div>
                </div>
                <div className="w-5 h-5 rounded-full border-2 border-white/20" />
              </label>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-4">Features Toggle</h2>
            
            <div className="space-y-4">
               <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                 <div>
                   <h4 className="text-sm font-medium text-white mb-1">Auto-Reply Drafts</h4>
                   <p className="text-xs text-muted-foreground">AI pre-drafts replies to high priority emails.</p>
                 </div>
                 <div className="w-11 h-6 rounded-full bg-primary relative cursor-pointer shadow-[0_0_10px_rgba(0,255,255,0.4)]">
                    <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 right-0.5 shadow-sm" />
                 </div>
               </div>
               <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                 <div>
                   <h4 className="text-sm font-medium text-white mb-1">Meeting Recording Sync</h4>
                   <p className="text-xs text-muted-foreground">Automatically download cloud meeting MP4s.</p>
                 </div>
                 <div className="w-11 h-6 rounded-full bg-white/20 relative cursor-pointer border border-white/10">
                    <div className="w-5 h-5 rounded-full bg-white/50 absolute top-[1px] left-0.5 shadow-sm" />
                 </div>
               </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
