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

/** A premium animated "glass" of water: SVG wave fill, pour ripple on log, glow + particle burst at 100%. */
export function WaterGlass({ percent, pulseKey, size = 220 }: WaterGlassProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const complete = percent >= 100;
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [syncedPulseKey, setSyncedPulseKey] = useState(pulseKey);
  const [wasComplete, setWasComplete] = useState(complete);

  // Both effects below are "derive state from a prop change" cases, not
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
      // during render while still reading as a natural particle burst.
      setParticles(
        Array.from({ length: 14 }, (_, i) => {
          const radius = 40 + ((i * 7) % 30);
          return {
            id: i,
            x: Math.round(Math.cos((i / 14) * Math.PI * 2) * radius),
            y: Math.round(Math.sin((i / 14) * Math.PI * 2) * radius - 20),
            delay: (i * 47) % 150,
          };
        })
      );
    }
  }

  const waveY = 100 - clamped;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {complete && (
        <div
          className="absolute inset-[-10%] rounded-full bg-info/30 blur-2xl animate-glow-pulse"
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
            <path d="M 22 8 L 78 8 L 72 92 Q 50 98 28 92 Z" />
          </clipPath>
          <linearGradient id="water-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>

        {/* Glass outline: refraction-style double stroke for a "glass material" feel */}
        <path
          d="M 22 8 L 78 8 L 72 92 Q 50 98 28 92 Z"
          fill="rgba(255,255,255,0.04)"
          stroke="var(--border)"
          strokeWidth="1.5"
        />
        <path d="M 26 10 L 30 10 L 25 88" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />

        <g clipPath="url(#glass-clip)">
          <rect
            x="0"
            y={waveY}
            width="100"
            height="100"
            fill="url(#water-fill)"
            style={{ transition: "y 700ms cubic-bezier(0.2,0,0,1)" }}
          />
          {/* animated wave crest */}
          <path
            d={`M 0 ${waveY} Q 12.5 ${waveY - 2.5} 25 ${waveY} T 50 ${waveY} T 75 ${waveY} T 100 ${waveY} V ${waveY + 5} H 0 Z`}
            fill="rgba(255,255,255,0.25)"
            className="animate-water-wave"
            style={{ transition: "d 700ms cubic-bezier(0.2,0,0,1)" }}
          />
        </g>

        <path
          d="M 22 8 L 78 8 L 72 92 Q 50 98 28 92 Z"
          fill="none"
          stroke="var(--border)"
          strokeWidth="1.5"
        />

        {ripples.map((r) => (
          <circle
            key={r.id}
            cx="50"
            cy={waveY}
            r="6"
            fill="none"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="1"
            className="animate-ripple"
            style={{ transformOrigin: `50px ${waveY}px` }}
          />
        ))}
      </svg>

      <span className="absolute text-display" style={{ fontSize: size * 0.13 }}>
        {Math.round(clamped)}%
      </span>

      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute w-1.5 h-1.5 rounded-full bg-info animate-particle"
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
