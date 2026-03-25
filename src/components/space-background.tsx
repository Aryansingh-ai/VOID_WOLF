"use client";

import { useEffect, useRef } from "react";

export default function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener("resize", resize);
    resize();

    const stars = Array.from({ length: 150 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 1.5,
      speed: Math.random() * 0.2 + 0.05,
    }));

    // High brightness transient meteors (Shooting Stars)
    interface Meteor { x: number; y: number; length: number; speed: number; opacity: number; life: number; maxLife: number; }
    const meteors: Meteor[] = [];
    
    const spawnMeteor = () => {
      meteors.push({
        x: Math.random() * canvas.width,
        y: Math.random() * (canvas.height / 2),
        length: Math.random() * 80 + 40,
        speed: Math.random() * 15 + 10,
        opacity: 0,
        life: 0,
        maxLife: Math.random() * 30 + 30
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw normal faint ambient stars
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      
      stars.forEach((star) => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        
        star.y -= star.speed; 
        if (star.y < 0) {
          star.y = canvas.height;
          star.x = Math.random() * canvas.width;
        }
      });
      
      // Handle shooting stars logic randomly spawning them
      if (Math.random() < 0.02 && meteors.length < 3) {
        spawnMeteor();
      }

      // Draw extremely bright shooting stars
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        
        ctx.beginPath();
        // Super bright white core with purple trailing edge
        const gradient = ctx.createLinearGradient(m.x, m.y, m.x - m.length, m.y - m.length);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${m.opacity})`);
        gradient.addColorStop(0.5, `rgba(139, 92, 246, ${m.opacity * 0.5})`);
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - m.length, m.y - m.length);
        ctx.stroke();

        // Move meteor diagonally (down and right)
        m.x += m.speed;
        m.y += m.speed;
        m.life++;

        // Fade in and out
        if (m.life < m.maxLife / 2) m.opacity += 0.1;
        else m.opacity -= 0.1;
        
        // Capping opacity
        m.opacity = Math.max(0, Math.min(1, m.opacity));

        if (m.life > m.maxLife || m.opacity <= 0) {
          meteors.splice(i, 1);
        }
      }
      
      animationFrameId = requestAnimationFrame(draw);
    };
    
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-50 bg-gradient-to-b from-[#0A0A0A] to-[#050505]">
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full pointer-events-none opacity-60" />
    </div>
  );
}
