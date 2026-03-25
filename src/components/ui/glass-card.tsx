import * as React from "react"
import { cn } from "@/lib/utils"

export function GlassCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#1F1F22] bg-[#0F0F10] bg-gradient-to-b from-white/[0.02] to-transparent hover:-translate-y-[2px] transition-all duration-300 overflow-hidden hover:border-[#3A3A3F]",
        className
      )}
      {...props}
    />
  )
}
