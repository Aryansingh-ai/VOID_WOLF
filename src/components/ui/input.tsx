import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border border-[#1F1F22] bg-[#0A0A0A] px-3 py-1 text-base text-[#E5E5E5] transition-colors outline-none placeholder:text-[#6B7280] focus-visible:border-[#3A3A3F] focus-visible:ring-1 focus-visible:ring-[#3A3A3F]/50 disabled:pointer-events-none disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
