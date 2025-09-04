"use client";

import React from "react";

type RubiksCubeProps = {
  className?: string;
  size?: number; // px
};

// Minimal 2D Rubik's cube SVG reminiscent of Resend's cube motif
export default function RubiksCube({ className, size = 160 }: RubiksCubeProps) {
  const s = size;
  const gap = 4;
  const cells = 3;
  const cell = (s - gap * (cells - 1)) / cells;

  const colors = [
    "#ff3b30", // red
    "#ffcc00", // yellow
    "#34c759", // green
    "#0a84ff", // blue
    "#ff9f0a", // orange
    "#ffffff", // white
  ];

  let colorIndex = 0;

  return (
    <svg
      className={className}
      viewBox={`0 0 ${s} ${s}`}
      width={s}
      height={s}
      role="img"
      aria-label="Rubik's cube"
    >
      <defs>
        <filter id="cube-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="rgba(0,0,0,0.4)" />
        </filter>
      </defs>
      <g filter="url(#cube-shadow)">
        {/* Border */}
        <rect x={0} y={0} width={s} height={s} rx={14} ry={14} fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.18)" />
        {/* Cells */}
        {Array.from({ length: cells }).map((_, row) =>
          Array.from({ length: cells }).map((__, col) => {
            const x = col * (cell + gap);
            const y = row * (cell + gap);
            const fill = colors[(colorIndex++ % colors.length)] as string;
            return (
              <rect
                key={`c-${row}-${col}`}
                x={x}
                y={y}
                width={cell}
                height={cell}
                rx={6}
                ry={6}
                fill={fill}
                stroke="rgba(0,0,0,0.25)"
                strokeWidth={1}
              />
            );
          })
        )}
      </g>
    </svg>
  );
}


