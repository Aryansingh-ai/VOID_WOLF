"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud, FileText, CheckCircle2, Loader2, X } from "lucide-react";
import { Boxes } from "@/components/ui/background-boxes";
import { api } from "@/lib/api";

export default function DocumentsPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  }

  const handleProcess = async () => {
    if (!file) return;
    setIsProcessing(true);
    setResult(null);
    try {
      const data = await api.uploadDocument(file);
      setResult(data);
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-6rem)] w-full overflow-hidden flex flex-col items-center justify-start p-6 md:p-8">
      <div className="absolute inset-0 w-full h-full bg-[#0A0A0A] z-0 pointer-events-none [mask-image:radial-gradient(transparent,white)]" />
      <Boxes className="opacity-70" />
      
      <div className="relative z-10 w-full max-w-[1100px] mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* HERO SECTION */}
        <div className="relative w-full text-center mb-10 mt-4 px-4 py-8 overflow-hidden bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.08),transparent_60%)]">
          <h1 className="text-[2.5rem] font-bold text-[#EAEAEA] mb-3 tracking-tight">
            Document Understanding
          </h1>
          <p className="text-[#A1A1AA] text-lg leading-relaxed max-w-2xl mx-auto">
            Upload documents to extract intelligence instantly.
          </p>
        </div>

        {/* DRAG & DROP AREA */}
        <div 
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => !file && fileInputRef.current?.click()}
          className="w-full bg-transparent backdrop-blur-[2px] border border-dashed border-[#2A2A2E] rounded-2xl flex flex-col items-center justify-center text-center group hover:border-[#3A3A3F] hover:bg-white/[0.02] transition-all duration-200 ease-in-out px-6 py-16 cursor-pointer"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".txt,.pdf,.docx" 
          />
          
          <div className="w-16 h-16 flex items-center justify-center mb-6">
            <UploadCloud className="w-10 h-10 text-[#A1A1AA] group-hover:text-white transition-colors duration-200" />
          </div>

          {file ? (
            <div className="flex flex-col items-center mb-8">
               <div className="flex items-center gap-2 mb-2">
                 <FileText className="w-5 h-5 text-[#3B82F6]" />
                 <span className="text-[#EAEAEA] font-medium">{file.name}</span>
                 <button onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }} className="text-[#A1A1AA] hover:text-white ml-2">
                   <X className="w-4 h-4" />
                 </button>
               </div>
               <p className="text-xs text-[#6B7280]">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          ) : (
            <>
              <h3 className="text-[1.15rem] font-medium text-[#E5E5E5] mb-2">Drag & drop your document here</h3>
              <p className="text-sm text-[#6B7280] mb-8">Click to browse. Supports PDF, DOCX, TXT up to 50MB</p>
            </>
          )}
          
          <Button 
            onClick={(e) => { e.stopPropagation(); handleProcess(); }} 
            disabled={isProcessing || !file} 
            className="bg-[#F5F5F5] hover:bg-[#E5E5E5] text-[#000] border-none rounded-xl h-12 px-6 shadow-[0_2px_8px_rgba(0,0,0,0.3)] min-w-[200px] transition-all duration-200 active:scale-95 hover:scale-[1.02] disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <FileText className="w-5 h-5 mr-2" />}
            {isProcessing ? "Processing..." : "Process Document"}
          </Button>
        </div>

        {/* TWO-COLUMN SECTION (RESULTS) */}
        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-8 duration-500 w-full">
            
            {/* AI SUMMARY CARD */}
            <div className="p-6 flex flex-col min-h-[500px] rounded-2xl border border-[#1F1F22] bg-[#0F0F10] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]">
              {/* CARD HEADER */}
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-5 h-5 text-[#A1A1AA]" />
                <h3 className="text-lg font-semibold text-[#E5E5E5]">
                  AI Summary
                </h3>
              </div>
              
              <div className="flex-1 pr-2 space-y-5">
                <div className="p-4 rounded-xl border border-[#2A2A2E] bg-[#111111] whitespace-pre-wrap text-sm text-[#A1A1AA] leading-relaxed">
                  {result.summary}
                </div>
              </div>
            </div>

            {/* EXTRACTED TEXT PREVIEW CARD */}
            <div className="p-6 flex flex-col min-h-[500px] rounded-2xl border border-[#1F1F22] bg-[#0F0F10] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]">
              {/* CARD HEADER */}
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-5 h-5 text-[#A1A1AA]" />
                <h3 className="text-lg font-semibold text-[#E5E5E5]">
                  Extracted Text Preview
                </h3>
              </div>
              
              <div className="flex-1 bg-[#0A0A0A] rounded-xl p-4 border border-[#1F1F22] font-mono text-xs text-[#D4D4D8] leading-[1.8] overflow-y-auto max-h-[500px] custom-scrollbar whitespace-pre-wrap">
                {result.extracted_text}
              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}
