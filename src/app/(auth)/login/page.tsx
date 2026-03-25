"use client";

import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
  return (
    <GlassCard className="p-8 w-full relative group/card">
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-1000" />
      
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Welcome Back</h1>
        <p className="text-muted-foreground">Sign in to your UNIFIED AI command center.</p>
      </div>

      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80">Email address</label>
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              type="email" 
              placeholder="you@example.com" 
              className="pl-10 bg-black/50 border-input focus-visible:ring-ring focus-visible:border-ring h-12 text-white placeholder:text-muted-foreground/50 transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-white/80">Password</label>
            <Link href="#" className="text-xs text-primary hover:text-primary/80 transition-colors">Forgot password?</Link>
          </div>
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              type="password" 
              placeholder="••••••••" 
              className="pl-10 bg-black/50 border-input focus-visible:ring-ring focus-visible:border-ring h-12 text-white placeholder:text-muted-foreground/50 transition-all"
            />
          </div>
        </div>

        <Button 
          onClick={() => window.location.href = "http://127.0.0.1:8000/auth"}
          className="w-full h-12 bg-white hover:bg-[#E5E5E5] text-black font-semibold text-lg transition-all duration-300 group"
        >
          Sign In
          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-primary hover:text-primary/80 font-medium transition-colors hover:underline underline-offset-4">
          Create account
        </Link>
      </div>
    </GlassCard>
  );
}
