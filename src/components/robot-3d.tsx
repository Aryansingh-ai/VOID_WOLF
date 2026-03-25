"use client";

import dynamic from "next/dynamic";

const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[400px] space-y-4">
      <div className="w-10 h-10 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
      <p className="text-[#A78BFA] text-sm font-medium animate-pulse">Initializing 3D Asset...</p>
    </div>
  ),
});

export default function Robot3D({ scene }: { scene: string }) {
  const onLoad = (splineApp: any) => {
    // Aggressive attempt to hide any generic background geometry embedded in the remote scene
    const targetNames = [
      'Background', 'BG', 'Floor', 'Plane', 'Plane 1', 'Plane 2', 'Grid', 
      'Purple', 'Rectangle', 'Ground', 'Base Plane', 'Base', 'Platform', 'Cube 2'
    ];
    
    targetNames.forEach((name) => {
      const obj = splineApp.findObjectByName(name);
      if (obj) {
        obj.visible = false;
      }
    });
  };

  return (
    <div className="w-full h-full min-h-[400px] flex items-center justify-center relative spline-wrapper">
      <Spline scene={scene} onLoad={onLoad} />
    </div>
  );
}
