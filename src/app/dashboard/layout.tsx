import { Sidebar } from "@/components/sidebar";
import { TopNav } from "@/components/top-nav";
import { AuthProvider } from "@/components/auth-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="flex h-screen w-full overflow-hidden bg-transparent">
        <Sidebar />
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Subtle Purple Ambient Atmosphere */}
        <div className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.08),transparent_60%)] pointer-events-none z-0" />
        <div className="absolute bottom-0 left-0 w-[50vw] h-[50vh] bg-[radial-gradient(ellipse_at_bottom_left,rgba(109,40,217,0.05),transparent_60%)] pointer-events-none z-0" />
        
        <div className="relative z-10">
          <TopNav />
        </div>
        <main className="flex-1 overflow-y-auto p-8 scroll-smooth z-10 relative">
          <div className="max-w-7xl mx-auto w-full h-full">
            {children}
          </div>
        </main>
      </div>
      </div>
    </AuthProvider>
  );
}
