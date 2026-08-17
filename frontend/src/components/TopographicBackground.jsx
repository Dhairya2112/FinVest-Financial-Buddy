"use client";

import { useEffect, useRef } from "react";

export default function TopographicBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let time = 0;
    
    // Mouse tracking for interactive terrain deformation
    let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let targetMouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    const handleMouseMove = (e) => {
      targetMouse.x = e.clientX;
      targetMouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      targetMouse.x = -1000;
      targetMouse.y = -1000;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseout", handleMouseLeave);

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    
    window.addEventListener("resize", resize);
    resize();

    // Configuration for the concentric knot topography
    const numLines = 24; 
    const segments = 250; 
    
    // Smooth mouse state
    let smoothMouse = { x: -1000, y: -1000 };
    
    const render = () => {
      time += 0.002; // Slow, elegant movement
      
      // Interpolate mouse for silky smooth spotlight tracking
      smoothMouse.x += (targetMouse.x - smoothMouse.x) * 0.05;
      smoothMouse.y += (targetMouse.y - smoothMouse.y) * 0.05;

      const logicalWidth = window.innerWidth;
      const logicalHeight = window.innerHeight;
      
      ctx.clearRect(0, 0, logicalWidth, logicalHeight);
      
      // Pitch black background for high contrast elegance
      ctx.fillStyle = "#020202";
      ctx.fillRect(0, 0, logicalWidth, logicalHeight);
      
      const centerX = logicalWidth / 2;
      const centerY = logicalHeight / 2;
      const maxRadius = Math.max(logicalWidth, logicalHeight) * 0.9;

      // 1. Draw the uniform lines with the knot distortion
      for (let i = 0; i < numLines; i++) {
        ctx.beginPath();
        const baseRadius = maxRadius * (i / numLines);
        
        for (let j = 0; j <= segments; j++) {
          const angle = (j / segments) * Math.PI * 2;
          
          // Core organic distortion (Unscaled to preserve the central "knot" tangle)
          const distortion1 = Math.sin(angle * 3 + time + i * 0.1) * 20;
          const distortion2 = Math.cos(angle * 5 - time * 1.5) * 10;
          const distortion3 = Math.sin(angle * 2 + time * 0.5 - i * 0.2) * 25;
          
          const totalDistortion = distortion1 + distortion2 + distortion3;
          
          // Base position with distortion (The knot forms because totalDistortion > baseRadius near the center)
          let x = centerX + Math.cos(angle) * (baseRadius + totalDistortion);
          let y = centerY + Math.sin(angle) * (baseRadius + totalDistortion);
          
          // Subtle parallax drift
          const driftX = Math.sin(time * 0.5 + i * 0.1) * 20;
          const driftY = Math.cos(time * 0.5 + i * 0.1) * 20;
          x += driftX;
          y += driftY;

          if (j === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.closePath();
        
        // ELEGANT STYLING: Uniform, highly visible silver/white lines
        const depthOpacity = Math.max(0.05, 0.2 - (i / numLines) * 0.15);
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(255, 255, 255, ${depthOpacity})`;
        ctx.stroke();
      }

      // 2. Optical Hover Animation (Spotlight overlay, no physical distortion)
      if (targetMouse.x !== -1000) {
        ctx.globalCompositeOperation = "lighter";
        const gradient = ctx.createRadialGradient(
          smoothMouse.x, smoothMouse.y, 0, 
          smoothMouse.x, smoothMouse.y, 500
        );
        // Creates a soft, premium glowing aura under the cursor
        gradient.addColorStop(0, "rgba(255, 255, 255, 0.08)");
        gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.02)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, logicalWidth, logicalHeight);
        ctx.globalCompositeOperation = "source-over"; // reset
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseout", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-[-1] overflow-hidden bg-[#020202]">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
