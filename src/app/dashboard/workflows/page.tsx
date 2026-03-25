"use client";

import { useState } from "react";
import { Workflow, Plus, Play, MoreVertical, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import NeuralBackground from "@/components/ui/flow-field-background";
import { api } from "@/lib/api";

export default function WorkflowsPage() {
  const [isRunning, setIsRunning] = useState<number | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const startWorkflow = async (id: number) => {
    setIsRunning(id);
    setToast(null);
    try {
      // Simulate workflow running by triggering fetch-mails
      await api.fetchEmails(5);
      setToast({ message: "Workflow executed successfully!", type: "success" });
    } catch (error) {
      console.error("Workflow failed", error);
      setToast({ message: "Failed to execute workflow.", type: "error" });
    } finally {
      setIsRunning(null);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const workflows = [
    { id: 1, title: "Daily Briefing Sync", desc: "Triggered every morning at 8:00 AM. Summarizes emails." },
    { id: 2, title: "Invoice Processor", desc: "Extracts data from attached PDFs and updates accounting." },
    { id: 3, title: "Meeting Follow-ups", desc: "Finds calendar events and auto-drafts summary emails." }
  ];

  return (
    <div className="relative min-h-[calc(100vh-6rem)] w-full overflow-hidden rounded-2xl bg-[#050505]">
      {/* Toast Notification */}
      {toast && (
        <div className={`absolute top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg border shadow-lg animate-in fade-in slide-in-from-top-4 duration-300 ${toast.type === 'success' ? 'bg-[#22C55E]/10 border-[#22C55E]/20 text-[#22C55E]' : 'bg-[#EF4444]/10 border-[#EF4444]/20 text-[#EF4444]'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* BACKGROUND */}
      <div className="absolute inset-0 w-full h-full z-0 opacity-25 pointer-events-auto">
        <NeuralBackground color="#06b6d4" trailOpacity={0.12} speed={0.6} />
      </div>

      <div className="relative z-10 w-full max-w-[1100px] mx-auto p-6 md:p-8 space-y-0 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mt-2">
          <div className="text-left w-full max-w-lg">
            <h1 className="text-[2.5rem] font-bold text-[#EAEAEA] tracking-tight">
              Workflows
            </h1>
            <p className="text-[#A1A1AA] text-lg leading-relaxed mt-2">
              Automate tasks and integrate multiple AI capabilities.
            </p>
          </div>
          <Button className="bg-[#F5F5F5] hover:bg-[#E5E5E5] text-[#000] w-full sm:w-auto shadow-none border-none rounded-xl px-5 h-12 font-medium transition-all duration-200 active:scale-95 mt-1">
            <Plus className="w-5 h-5 mr-2 stroke-[2.5px]" />
            Create Workflow
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-10">
          {workflows.map((item) => (
            <div 
              key={item.id} 
              className="p-[24px] relative group border border-[#1F1F22] rounded-2xl bg-[#0F0F10] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent)] transition-all duration-200 ease-in-out hover:-translate-y-1 hover:border-[#2A2A2E] shadow-none flex flex-col text-left h-[260px]"
            >
              <div className="flex justify-between items-start mb-1">
                <div className="p-2 rounded-[10px] bg-[#1A1A1D] flex items-center justify-center">
                  <Workflow className="w-5 h-5 text-[#A1A1AA]" />
                </div>
                <button className="text-[#A1A1AA] opacity-60 hover:opacity-100 transition-opacity -mr-1 p-1 focus:outline-none">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 mt-3">
                <h3 className="text-base font-semibold text-[#E5E5E5] leading-snug">{item.title}</h3>
                <p className="text-[13px] text-[#A1A1AA] mt-1.5 leading-[1.5]">
                  {item.desc}
                </p>
              </div>

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#1F1F22]">
                <div className="flex items-center gap-1.5 bg-[#22C55E]/10 text-[#22C55E] px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" /> 
                  Active
                </div>
                
                <button 
                  onClick={() => startWorkflow(item.id)}
                  disabled={isRunning !== null}
                  className="flex items-center justify-center bg-transparent border border-[#2A2A2E] text-[#D1D5DB] hover:bg-[#111111] hover:border-[#3A3A3F] hover:text-[#FFFFFF] rounded-lg px-3 py-1.5 h-auto text-xs transition-colors focus:outline-none group/btn disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRunning === item.id ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin text-[#D1D5DB]" /> : <Play className="w-3 h-3 mr-1.5 fill-current" />}
                  {isRunning === item.id ? "Running..." : "Run Now"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
