

import { motion } from "framer-motion";
import React from "react";

type GlobeProps = {
  className?: string;
  size?: number; // px
};

// Lightweight animated SVG globe that mimics a 3D feel (no extra deps)
export default function Globe({ className, size = 360 }: GlobeProps) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const r = (s / 2) * 0.92;

  // Generate latitude and longitude lines
  const latitudes = Array.from({ length: 7 }).map((_, i) => {
    const t = (i + 1) / 8; // 1..7 of 8
    const ry = r * Math.cos((Math.PI / 2) * (t - 0.5));
    return { id: `lat-${i}`, ry: Math.abs(ry) };
  });

  const longitudes = Array.from({ length: 9 }).map((_, i) => {
    const t = (i + 1) / 10; // 1..9 of 10
    const rx = r * Math.cos((Math.PI / 2) * (t - 0.5));
    return { id: `lon-${i}`, rx: Math.abs(rx) };
  });

  return (
    <div className={className} style={{ width: s, height: s }}>
      <svg
        viewBox={`0 0 ${s} ${s}`}
        width={s}
        height={s}
        aria-label="Animated globe"
        role="img"
      >
        <defs>
          <radialGradient id="g-shade" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#7fb7ff" />
            <stop offset="60%" stopColor="#2a74ff" />
            <stop offset="100%" stopColor="#0a2a66" />
          </radialGradient>
          <radialGradient id="g-glow" cx="50%" cy="50%" r="60%">
            <stop offset="70%" stopColor="rgba(80,150,255,0.25)" />
            <stop offset="100%" stopColor="rgba(80,150,255,0)" />
          </radialGradient>
          <mask id="g-mask">
            <rect width="100%" height="100%" fill="black" />
            <circle cx={cx} cy={cy} r={r} fill="white" />
          </mask>
          <filter id="soft-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="blur" />
            <feOffset dx="0" dy="8" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Soft drop shadow */}
        <ellipse
          cx={cx}
          cy={cy + r * 0.6}
          rx={r * 0.75}
          ry={r * 0.18}
          fill="rgba(0,0,0,0.35)"
          filter="url(#soft-shadow)"
        />

        {/* Sphere base */}
        <circle cx={cx} cy={cy} r={r} fill="url(#g-shade)" />

        {/* Rotating grid to imply 3D */}
        <g mask="url(#g-mask)">
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, ease: "linear", duration: 40 }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          >
            {/* Longitude lines */}
            {longitudes.map((l, idx) => (
              <ellipse
                key={l.id}
                cx={cx}
                cy={cy}
                rx={l.rx}
                ry={r}
                fill="none"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth={idx % 2 === 0 ? 0.6 : 0.4}
              />
            ))}
            {/* Latitude lines */}
            {latitudes.map((l, idx) => (
              <ellipse
                key={l.id}
                cx={cx}
                cy={cy}
                rx={r}
                ry={l.ry}
                fill="none"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth={idx % 2 === 0 ? 0.6 : 0.4}
              />
            ))}
          </motion.g>

          {/* Terminator shadow to increase depth */}
          <radialGradient id="terminator" cx="30%" cy="40%" r="60%">
            <stop offset="50%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.38)" />
          </radialGradient>
          <circle cx={cx} cy={cy} r={r} fill="url(#terminator)" />
        </g>

        {/* Outer glow */}
        <circle cx={cx} cy={cy} r={r * 1.12} fill="url(#g-glow)" />
      </svg>
    </div>
  );
}


