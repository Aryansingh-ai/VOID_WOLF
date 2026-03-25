"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

export default function TasksPage() {
  const [text, setText] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSummarize = async () => {
    if (!text) return;
    setIsSummarizing(true);
    setResult(null);
    try {
      const data = await api.summarizeText(text);
      setResult(data);
    } catch (err) {
      console.error("Summarization failed", err);
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">Summarization Studio</h1>
        <p className="text-muted-foreground">Paste any text block to generate structured task intelligence.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassCard className="p-6 flex flex-col min-h-[500px]">
          <h2 className="text-lg font-bold text-white mb-4">Input Data</h2>
          <textarea 
            className="flex-1 w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/50 transition-all custom-scrollbar"
            placeholder="Paste raw text, transcript, or long email thread here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Button 
            onClick={handleSummarize} 
            disabled={isSummarizing || !text} 
            className="mt-4 w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-[0_0_15px_rgba(0,255,255,0.4)] disabled:opacity-50"
          >
            {isSummarizing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
            {isSummarizing ? "Processing intelligence..." : "Summarize"}
          </Button>
        </GlassCard>

        {result ? (
          <GlassCard className="p-6 min-h-[500px] flex flex-col animate-in slide-in-from-right-8 duration-500 border-border">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
              Structured Output
            </h2>
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
              <section>
                <div className="text-sm text-white/90 bg-white/5 p-4 rounded-xl border border-white/10 font-medium whitespace-pre-wrap leading-relaxed">
                  {result.summary || JSON.stringify(result, null, 2)}
                </div>
              </section>
            </div>
            <Button variant="outline" className="mt-6 w-full border-white/20 hover:bg-white/10 text-white">
              Export Output <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </GlassCard>
        ) : (
          <GlassCard className="p-6 flex flex-col items-center justify-center text-center border-dashed border-2 border-white/10 opacity-50 min-h-[500px]">
             <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
             <p className="text-lg font-medium text-white mb-1">Awaiting Input</p>
             <p className="text-sm text-muted-foreground max-w-[250px]">Paste your text and click summarize to generate intelligence.</p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
