"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Mail,
  FileText,
  Video,
  CheckSquare,
  Workflow,
  BarChart2,
  CreditCard,
  Settings,
} from "lucide-react";

const navItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Email Intelligence", href: "/dashboard/email", icon: Mail },
  { name: "Documents", href: "/dashboard/documents", icon: FileText },
  { name: "Meetings", href: "/dashboard/meetings", icon: Video },
  { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
  { name: "Workflows", href: "/dashboard/workflows", icon: Workflow },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart2 },
  { name: "Pricing", href: "/dashboard/pricing", icon: CreditCard },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="w-64 border-r border-white/10 bg-black/40 backdrop-blur-xl flex flex-col h-full z-20">
      <div className="h-20 flex items-center px-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            <span className="text-white font-bold text-lg">U</span>
          </div>
          <span className="font-bold text-lg tracking-widest text-white">UNIFIED</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-6 custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative",
                isActive
                  ? "bg-transparent text-white border-l-2 border-[#E9D5FF] hover:bg-[#0D0D0D]"
                  : "bg-transparent text-[#A1A1AA] hover:bg-[#0D0D0D] hover:text-white border-l-2 border-transparent"
              )}
            >
              {/* The left indicator is now handled by border-l-2 border-[#E9D5FF] on the Link itself */}
              <item.icon className={cn("w-5 h-5 transition-all duration-300", isActive ? "text-white" : "text-[#A1A1AA] group-hover:scale-110")} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 hover:bg-[#0D0D0D] transition-colors cursor-pointer">
          {user?.picture ? (
            <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border border-white/10" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#111111] border border-white/10 flex items-center justify-center">
              <span className="text-white text-xs font-bold">{user?.name?.charAt(0) || "A"}</span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white line-clamp-1">{user?.name || "Admin"}</span>
            <span className="text-xs text-primary line-clamp-1">{user?.email || "Pro Plan"}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
