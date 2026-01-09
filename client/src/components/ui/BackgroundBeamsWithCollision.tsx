"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export function BackgroundBeamsWithCollision({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let animationFrameId: number;

    const DPR = window.devicePixelRatio || 1;

    function resize() {
      canvas.width = window.innerWidth * DPR;
      canvas.height = window.innerHeight * DPR;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    resize();
    window.addEventListener("resize", resize);

    const beams = Array.from({ length: 20 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      radius: 80 + Math.random() * 120,
    }));

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < beams.length; i++) {
        const b = beams[i];
        b.x += b.vx;
        b.y += b.vy;

        if (b.x < 0 || b.x > window.innerWidth) b.vx *= -1;
        if (b.y < 0 || b.y > window.innerHeight) b.vy *= -1;

        for (let j = i + 1; j < beams.length; j++) {
          const b2 = beams[j];
          const dx = b.x - b2.x;
          const dy = b.y - b2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 200) {
            ctx.beginPath();
            ctx.strokeStyle = "rgba(168, 85, 247, 0.12)";
            ctx.lineWidth = 1;
            ctx.moveTo(b.x, b.y);
            ctx.lineTo(b2.x, b2.y);
            ctx.stroke();
          }
        }

        const gradient = ctx.createRadialGradient(
          b.x,
          b.y,
          0,
          b.x,
          b.y,
          b.radius
        );

        gradient.addColorStop(0, "rgba(168, 85, 247, 0.15)");
        gradient.addColorStop(1, "rgba(168, 85, 247, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      className={cn(
        "relative overflow-hidden w-full h-full bg-background",
        className
      )}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0"
        aria-hidden
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}
