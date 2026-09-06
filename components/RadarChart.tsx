"use client";

import { motion } from "framer-motion";
import { useId, useState } from "react";
import type { RadarScores } from "@/lib/metrics";

const AXES: Array<{ key: keyof RadarScores; label: string; description: string }> = [
  {
    key: "velocity",
    label: "Velocity",
    description: "How often and how recently they ship. Blends push frequency over the last 90 days with time since the latest push.",
  },
  {
    key: "versatility",
    label: "Versatility",
    description: "Breadth and evenness of programming languages across recent repositories. More distinct, evenly used languages score higher.",
  },
  {
    key: "impact",
    label: "Impact",
    description: "Total stars and forks earned across owned repositories, on a logarithmic scale.",
  },
  {
    key: "originality",
    label: "Originality",
    description: "Share of original repositories versus forks. High originality means most of their repos are their own creations.",
  },
  {
    key: "seniority",
    label: "Seniority",
    description: "Account age blended with repository depth. Long-standing accounts with a substantial body of work score highest.",
  },
];

const RING_LEVELS = [0.25, 0.5, 0.75, 1];

interface RadarChartProps {
  scores: RadarScores;
  size?: number;
}

export function RadarChart({ scores, size = 380 }: RadarChartProps) {
  const gradientId = useId();
  const glowId = useId();
  const [hoveredAxis, setHoveredAxis] = useState<number | null>(null);

  const center = size / 2;
  const radius = size * 0.31;
  const angleFor = (index: number) => -Math.PI / 2 + (index * 2 * Math.PI) / AXES.length;

  const pointAt = (index: number, fraction: number): [number, number] => {
    const angle = angleFor(index);
    return [center + radius * fraction * Math.cos(angle), center + radius * fraction * Math.sin(angle)];
  };

  const polygonPoints = (fractions: number[]) =>
    fractions.map((fraction, index) => pointAt(index, fraction).join(",")).join(" ");

  const safeScores = AXES.map((axis) => {
    const raw = Number(scores?.[axis.key]);
    return Number.isFinite(raw) ? Math.min(100, Math.max(0, raw)) : 0;
  });
  const valueFractions = safeScores.map((score) => Math.max(0.06, score / 100));

  const labelAnchor = (index: number): "start" | "middle" | "end" => {
    const cos = Math.cos(angleFor(index));
    if (Math.abs(cos) < 0.35) return "middle";
    return cos > 0 ? "start" : "end";
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Developer DNA radar chart"
        className="overflow-visible"
      >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.3" />
        </linearGradient>
        <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {RING_LEVELS.map((level) => (
        <polygon
          key={level}
          points={polygonPoints(AXES.map(() => level))}
          fill="none"
          stroke="rgba(148, 163, 184, 0.18)"
          strokeWidth={1}
        />
      ))}

      {AXES.map((axis, index) => {
        const [x, y] = pointAt(index, 1);
        return (
          <line
            key={axis.key}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="rgba(148, 163, 184, 0.16)"
            strokeWidth={1}
          />
        );
      })}

      <motion.g
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 90, damping: 16, delay: 0.15 }}
        style={{ transformOrigin: `${center}px ${center}px` }}
      >
        <polygon points={polygonPoints(valueFractions)} fill={`url(#${gradientId})`} filter={`url(#${glowId})`} />
        <polygon
          points={polygonPoints(valueFractions)}
          fill="none"
          stroke="#22d3ee"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {AXES.map((axis, index) => {
          const [x, y] = pointAt(index, valueFractions[index]);
          return (
            <g key={axis.key}>
              <circle cx={x} cy={y} r={5.5} fill="#0b1120" stroke="#22d3ee" strokeWidth={2} />
              <circle cx={x} cy={y} r={2} fill="#e2e8f0" />
            </g>
          );
        })}
      </motion.g>

      {AXES.map((axis, index) => {
        const [x, y] = pointAt(index, 1.24);
        const anchor = labelAnchor(index);
        const value = safeScores[index];
        const isHovered = hoveredAxis === index;
        return (
          <g
            key={axis.key}
            onMouseEnter={() => setHoveredAxis(index)}
            onMouseLeave={() => setHoveredAxis(null)}
            style={{ cursor: "help" }}
          >
            <text
              x={x}
              y={y - 4}
              textAnchor={anchor}
              className={isHovered ? "fill-cyan-200" : "fill-slate-300"}
              fontSize={13}
              fontWeight={600}
              letterSpacing="0.08em"
              style={{ textTransform: "uppercase", textDecoration: isHovered ? "underline dotted" : "none" }}
            >
              {axis.label}
            </text>
            <text
              x={x}
              y={y + 14}
              textAnchor={anchor}
              className="fill-cyan-300"
              fontSize={14}
              fontWeight={700}
              fontFamily="inherit"
            >
              {value}
            </text>
          </g>
        );
      })}

      <circle cx={center} cy={center} r={3} fill="rgba(148, 163, 184, 0.5)" />
      </svg>

      {hoveredAxis !== null && (
        <div
          className="pointer-events-none absolute z-20 w-56 rounded-xl border border-white/10 px-3.5 py-2.5 shadow-2xl"
          style={{
            left: pointAt(hoveredAxis, 1.24)[0],
            top: pointAt(hoveredAxis, 1.24)[1] - 22,
            transform: "translate(-50%, -100%)",
            background: "rgba(11, 17, 32, 0.96)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-300">
            {AXES[hoveredAxis].label}
          </div>
          <p className="text-[12px] leading-snug text-slate-300">{AXES[hoveredAxis].description}</p>
        </div>
      )}
    </div>
  );
}
