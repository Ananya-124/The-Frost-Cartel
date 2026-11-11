import React, { useEffect, useRef } from 'react';

interface ConfettiCannonCanvasProps {
  trigger?: boolean;
  reducedMotion?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  type: 'rect' | 'strip' | 'streamer' | 'spark';
  angleX: number;
  angleY: number;
  angleZ: number;
  spinX: number;
  spinY: number;
  spinZ: number;
  length: number;
  gravity: number;
  drag: number;
  opacity: number;
  decay: number;
  wobble: number;
  wobbleSpeed: number;
}

const CONFETTI_COLORS = [
  '#D4AF37', // Antique Gold
  '#FFDF73', // Bright Gold
  '#F7E7CE', // Champagne
  '#8B1538', // Royal Burgundy
  '#A01A42', // Vivid Crimson
  '#8A2BE2', // Royal Purple
  '#9B5DE5', // Radiant Violet
  '#00CED1', // Radiant Teal
  '#00F5D4', // Mint Turquoise
  '#E0E0E0', // Metallic Silver
  '#FFFFFF', // Starlight White
];

export const ConfettiCannonCanvas: React.FC<ConfettiCannonCanvasProps> = ({
  trigger = true,
  reducedMotion = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    if (!trigger || reducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Exclusion zone in the center around the winner nameplate
    const getExclusionZone = () => {
      const cx = width / 2;
      const cy = height * 0.42;
      const hw = Math.min(width * 0.38, 320);
      const hh = Math.min(height * 0.16, 90);
      return { x1: cx - hw, x2: cx + hw, y1: cy - hh, y2: cy + hh };
    };

    const particles: Particle[] = [];
    const particleCount = Math.min(Math.floor((width * height) / 4500), 220);

    // Emitters: Lower-left and Lower-right cannons
    const leftCannonX = Math.max(50, width * 0.08);
    const leftCannonY = height - Math.max(50, height * 0.1);
    const rightCannonX = width - Math.max(50, width * 0.08);
    const rightCannonY = height - Math.max(50, height * 0.1);

    for (let i = 0; i < particleCount; i++) {
      const fromLeft = i % 2 === 0;
      const originX = fromLeft ? leftCannonX : rightCannonX;
      const originY = fromLeft ? leftCannonY : rightCannonY;

      // Base launch angle: ~52° from horizontal towards center
      const baseAngle = fromLeft ? -Math.PI * 0.32 : -Math.PI * 0.68;
      const spread = (Math.random() - 0.5) * (Math.PI * 0.28);
      const angle = baseAngle + spread;

      const speed = 16 + Math.random() * 16;
      const typeRoll = Math.random();
      const type: Particle['type'] =
        typeRoll < 0.45 ? 'rect' : typeRoll < 0.75 ? 'strip' : typeRoll < 0.9 ? 'streamer' : 'spark';

      particles.push({
        x: originX + (Math.random() - 0.5) * 20,
        y: originY + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: type === 'spark' ? 3 + Math.random() * 3 : 7 + Math.random() * 6,
        length: type === 'streamer' ? 24 + Math.random() * 20 : type === 'strip' ? 18 + Math.random() * 12 : 12,
        type,
        angleX: Math.random() * Math.PI * 2,
        angleY: Math.random() * Math.PI * 2,
        angleZ: Math.random() * Math.PI * 2,
        spinX: (Math.random() - 0.5) * 0.16,
        spinY: (Math.random() - 0.5) * 0.16,
        spinZ: (Math.random() - 0.5) * 0.12,
        gravity: 0.18 + Math.random() * 0.08,
        drag: 0.982 + Math.random() * 0.01,
        opacity: 1,
        decay: 0.0012 + Math.random() * 0.001,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.05 + Math.random() * 0.05,
      });
    }

    particlesRef.current = particles;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;
      ctx.clearRect(0, 0, width, height);

      const zone = getExclusionZone();
      let aliveCount = 0;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p.opacity <= 0.01) continue;
        aliveCount++;

        // Physics update
        p.vx *= p.drag;
        p.vy = p.vy * p.drag + p.gravity;
        p.x += p.vx;
        p.y += p.vy;

        p.angleX += p.spinX;
        p.angleY += p.spinY;
        p.angleZ += p.spinZ;
        p.wobble += p.wobbleSpeed;

        // Gentle lateral deflection if particle enters central nameplate zone
        if (p.x > zone.x1 && p.x < zone.x2 && p.y > zone.y1 && p.y < zone.y2) {
          const midX = (zone.x1 + zone.x2) / 2;
          p.vx += (p.x < midX ? -0.4 : 0.4);
        }

        // Natural decay after initial blast phase
        if (p.vy > 1) {
          p.opacity -= p.decay;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angleZ);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;

        const scaleX = Math.cos(p.angleX);
        const scaleY = Math.cos(p.angleY);

        if (p.type === 'rect') {
          ctx.beginPath();
          ctx.rect((-p.size / 2) * scaleX, (-p.size / 2) * scaleY, p.size * scaleX, p.size * scaleY);
          ctx.fill();
        } else if (p.type === 'strip') {
          ctx.beginPath();
          ctx.rect((-p.size / 3) * scaleX, (-p.length / 2) * scaleY, (p.size * 0.8) * scaleX, p.length * scaleY);
          ctx.fill();
        } else if (p.type === 'streamer') {
          // Undulating curving serpentine ribbon
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          const wave = Math.sin(p.wobble) * 8;
          ctx.moveTo(-p.length / 2, 0);
          ctx.bezierCurveTo(
            -p.length / 4,
            wave * scaleY,
            p.length / 4,
            -wave * scaleY,
            p.length / 2,
            0
          );
          ctx.stroke();
        } else {
          // Twinkling spark star
          const r = p.size * 0.8;
          ctx.beginPath();
          ctx.arc(0, 0, r * Math.abs(scaleX), 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      if (aliveCount > 0) {
        animFrameRef.current = requestAnimationFrame(render);
      } else {
        isRunning = false;
      }
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [trigger, reducedMotion]);

  if (reducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-30 w-full h-full"
    />
  );
};

