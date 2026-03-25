"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import Robot3D from "@/components/robot-3d";
import { Mail, FileText, Video, Sparkles, Brain, ArrowRight, Globe, MessageCircle, Share2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar Minimal */}
      <header className="h-20 border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50 px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#111111] border border-white/10 flex items-center justify-center">
            <span className="text-white font-bold text-lg">U</span>
          </div>
          <span className="font-bold text-lg tracking-widest text-white">UNIFIED</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">Sign In</Link>
          <Link href="/signup">
            <Button className="bg-white hover:bg-[#E5E5E5] text-black">Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center w-full relative z-10 px-4">
        {/* HERO SECTION */}
        <section className="w-full max-w-7xl mx-auto py-24 lg:py-32 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.8 }}
            className="flex flex-col gap-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 w-fit text-white text-sm font-medium">
              <Sparkles className="w-4 h-4 text-white" />
              <span>The future of AI OS is here</span>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.25),transparent_60%)] blur-2xl pointer-events-none" />
              <h1 className="relative text-5xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
                Turn scattered communications into <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#A78BFA]">structured intelligence</span>
              </h1>
            </div>
            
            <p className="text-xl text-muted-foreground max-w-lg">
              UNIFIED AI is the ultimate command center to ingest, analyze, and act upon your emails, documents, and meetings automatically.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <Link href="/signup">
                <Button className="w-full sm:w-auto h-14 px-8 bg-gradient-to-br from-[#6D28D9] to-[#8B5CF6] hover:brightness-110 text-white font-semibold text-lg transition-all duration-300 group shadow-none border-none">
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 text-white transition-transform" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" className="w-full sm:w-auto h-14 px-8 border-white/20 hover:bg-white/5 text-white bg-transparent backdrop-blur-sm">
                  Explore Features
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* 3D Robot */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 1, delay: 0.2 }}
            className="relative h-[500px] lg:h-[700px] w-full flex items-center justify-center"
          >
            {/* Soft purple backdrop instead of generic white glow */}
            <div className="absolute inset-0 bg-[#8B5CF6]/20 blur-[120px] rounded-full pointer-events-none" />
            <Robot3D scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode" />
          </motion.div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="w-full max-w-7xl mx-auto py-24 border-t border-white/5">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">Core Intelligence Modules</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to automate your daily workflows, built directly into one command center.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -10 }}
              >
                <GlassCard className="p-6 h-full flex flex-col group/feature relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover/feature:opacity-100 transition-opacity duration-500 rounded-2xl md:rounded-[inherit]" />
                  
                  <div className={"w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-none " + feature.color}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm flex-1">{feature.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section className="w-full max-w-7xl mx-auto py-24 mb-24 border-t border-white/5">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A seamless continuous pipeline that turns chaos into order.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-[40px] left-[10%] right-[10%] h-0.5 bg-white/10" />

            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="relative flex flex-col items-center text-center z-10"
              >
                <div className="w-20 h-20 rounded-full bg-black/60 border border-[#1F1F22] backdrop-blur-md flex items-center justify-center mb-6 relative group overflow-hidden">
                  <div className="absolute inset-0 bg-white/5 scale-0 group-hover:scale-100 transition-transform duration-300 rounded-full" />
                  <span className="text-3xl font-bold text-white z-10">{idx + 1}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm max-w-[200px]">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-black/40 xl:bg-black/60 py-12 px-8 z-10 relative mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
             <div className="w-6 h-6 rounded bg-[#111111] border border-white/10 flex items-center justify-center">
              <span className="text-white font-bold text-xs">U</span>
            </div>
            <span className="font-bold tracking-widest text-white text-sm">UNIFIED AI</span>
          </div>
          <div className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Unified AI Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <Link href="#" className="hover:text-primary transition-colors"><MessageCircle className="w-5 h-5" /></Link>
            <Link href="#" className="hover:text-primary transition-colors"><Globe className="w-5 h-5" /></Link>
            <Link href="#" className="hover:text-primary transition-colors"><Share2 className="w-5 h-5" /></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    title: "Email Intelligence",
    desc: "Automatically summarize, categorize, and extract action items from your flooded inbox.",
    icon: Mail,
    color: "bg-[#1A1A1D] border border-[#2A2A2E]"
  },
  {
    title: "Document Understanding",
    desc: "Ingest any PDF/DOCX and instantly retrieve key data points without skimming pages.",
    icon: FileText,
    color: "bg-[#1A1A1D] border border-[#2A2A2E]"
  },
  {
    title: "Meeting Extraction",
    desc: "Turn transcripts into concise bullet points, task assignments, and calendar events.",
    icon: Video,
    color: "bg-[#1A1A1D] border border-[#2A2A2E]"
  },
  {
    title: "AI Summarization",
    desc: "Feed custom text and receive instant, structured responses tailored to your prompt.",
    icon: Brain,
    color: "bg-[#1A1A1D] border border-[#2A2A2E]"
  }
];

const steps = [
  { title: "Ingest", desc: "Connect your sources or drag and drop data directly." },
  { title: "Analyze", desc: "Our models process context and relationships instantly." },
  { title: "Summarize", desc: "Complex information is boiled down to core insights." },
  { title: "Act", desc: "Sync tasks and start workflows without leaving the app." }
];
