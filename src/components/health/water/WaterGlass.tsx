"use client";

import { useState } from "react";

interface Ripple {
  id: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  delay: number;
}

interface WaterGlassProps {
  percent: number; // 0-100+
  pulseKey: number; // bump this to trigger a pour/ripple
  size?: number;
}

/** A premium animated "glass" of water: layered SVG wave fill with continuous
 * idle motion, a pour ripple on log, and a soft glow at 100%. */
export function WaterGlass({ percent, pulseKey, size = 220 }: WaterGlassProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const complete = percent >= 100;
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [syncedPulseKey, setSyncedPulseKey] = useState(pulseKey);
  const [wasComplete, setWasComplete] = useState(complete);

  // Both blocks below are "derive state from a prop change" cases, not
  // synchronization with an external system — handled during render (React's
  // sanctioned "adjusting state" pattern). The CSS animations end in their
  // own invisible final state (`forwards` fill), so no cleanup timer is
  // needed to remove ripples/particles afterward; each list is simply
  // capped so it can't grow unbounded across a long session.
  if (pulseKey !== syncedPulseKey) {
    setSyncedPulseKey(pulseKey);
    if (pulseKey !== 0) {
      setRipples((r) => [...r.slice(-2), { id: pulseKey }]);
    }
  }

  if (complete !== wasComplete) {
    setWasComplete(complete);
    if (complete) {
      // Deterministic (not Math.random) spread — keeps the component pure
      // during render while still reading as a natural, restrained shimmer
      // rather than a confetti burst.
      setParticles(
        Array.from({ length: 8 }, (_, i) => {
          const radius = 34 + ((i * 9) % 22);
          return {
            id: i,
            x: Math.round(Math.cos((i / 8) * Math.PI * 2) * radius),
            y: Math.round(Math.sin((i / 8) * Math.PI * 2) * radius - 16),
            delay: (i * 60) % 140,
          };
        })
      );
    }
  }

  const waveY = 100 - clamped;
  // Single source of truth for the glass outline — reused for the fill, the
  // clip path, and the re-stroked rim, so all three can never drift out of
  // sync with each other.
  const glassPath = "M 22 8 L 78 8 L 72 92 Q 50 98 28 92 Z";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {complete && (
        <div
          className="absolute inset-[-8%] rounded-full bg-info/20 blur-2xl animate-glow-pulse"
          aria-hidden
        />
      )}

      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="relative drop-shadow-[0_8px_20px_rgba(59,130,246,0.18)]"
      >
        <defs>
          <clipPath id="glass-clip">
            <path d={glassPath} />
          </clipPath>
          <linearGradient id="water-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient id="glass-sheen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
            <stop offset="35%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        {/* Glass body: soft sheen fill for a "glass material" feel */}
        <path d={glassPath} fill="url(#glass-sheen)" />

        <g clipPath="url(#glass-clip)" className="animate-water-bob" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
          <rect
            x="0"
            y={waveY}
            width="100"
            height="100"
            fill="url(#water-fill)"
            style={{ transition: "y 800ms cubic-bezier(0.34,1.2,0.64,1)" }}
          />
          {/* two overlapping wave crests at different speeds/opacities for depth */}
          <path
            d={`M 0 ${waveY} Q 12.5 ${waveY - 3.5} 25 ${waveY} T 50 ${waveY} T 75 ${waveY} T 100 ${waveY} V ${waveY + 6} H 0 Z`}
            fill="rgba(255,255,255,0.28)"
            className="animate-water-wave"
            style={{ transition: "d 800ms cubic-bezier(0.34,1.2,0.64,1)" }}
          />
          <path
            d={`M 0 ${waveY} Q 16.7 ${waveY + 2.5} 33.3 ${waveY} T 66.7 ${waveY} T 100 ${waveY} V ${waveY + 6} H 0 Z`}
            fill="rgba(255,255,255,0.16)"
            className="animate-water-wave-reverse"
            style={{ transition: "d 800ms cubic-bezier(0.34,1.2,0.64,1)" }}
          />
        </g>

        {/* Rim re-stroked on top so the water fill never visually spills over the border */}
        <path d={glassPath} fill="none" stroke="var(--border)" strokeWidth="1.5" strokeLinejoin="round" />

        {/* Soft reflection highlight — a filled, rounded sliver safely inside the
            rim (not a stray stroked line touching the edge). */}
        <rect
          x="26.5"
          y="12"
          width="2.6"
          height="66"
          rx="1.3"
          fill="rgba(255,255,255,0.4)"
          transform="rotate(-2 27.8 45)"
          pointerEvents="none"
        />

        {ripples.map((r) => (
          <circle
            key={r.id}
            cx="50"
            cy={waveY}
            r="6"
            fill="none"
            stroke="rgba(255,255,255,0.75)"
            strokeWidth="1"
            className="animate-ripple"
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />
        ))}
      </svg>

      <span className="absolute text-display" style={{ fontSize: size * 0.13 }}>
        {Math.round(clamped)}%
      </span>

      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute w-1 h-1 rounded-full bg-info animate-particle"
          style={
            {
              "--particle-x": `${p.x}px`,
              "--particle-y": `${p.y}px`,
              animationDelay: `${p.delay}ms`,
            } as React.CSSProperties
          }
          aria-hidden
        />
      ))}
    </div>
  );
}
