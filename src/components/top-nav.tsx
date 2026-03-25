"use client";

import { Search, Bell } from "lucide-react";

export function TopNav() {
  return (
    <header className="h-20 border-b border-white/5 bg-black/20 backdrop-blur-xl flex items-center justify-between px-8 z-20 sticky top-0">
      <div className="flex flex-1">
        <div className="flex items-center gap-3 text-muted-foreground w-full max-w-xl bg-black/40 border border-white/10 rounded-2xl px-5 py-3 focus-within:border-primary/50 focus-within:text-white transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] group">
          <Search className="w-5 h-5 transition-colors group-focus-within:text-primary group-focus-within:drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
          <input 
            type="text" 
            placeholder="Search documents, emails, tasks..." 
            className="bg-transparent border-none outline-none text-white w-full placeholder:text-muted-foreground/60 text-sm font-medium tracking-wide"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative w-11 h-11 rounded-full flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/10 transition-all duration-300 border border-transparent hover:border-white/10">
          <Bell className="w-5 h-5" />
          <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(0,255,255,1)] animate-pulse"></span>
        </button>
      </div>
    </header>
  );
}
