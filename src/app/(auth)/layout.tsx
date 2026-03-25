import Robot3D from "@/components/robot-3d";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left side: Form */}
        <div className="w-full max-w-md mx-auto z-10">
          {children}
        </div>
        
        {/* Right side: 3D Robot */}
        <div className="hidden lg:block w-full h-[600px] z-10 relative">
          <div className="absolute inset-0 bg-[#8B5CF6]/10 blur-[100px] rounded-full pointer-events-none" />
          <Robot3D scene="https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode" />
        </div>
      </div>
    </div>
  );
}
