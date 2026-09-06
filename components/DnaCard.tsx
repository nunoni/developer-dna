"use client";

import { forwardRef } from "react";
import { Activity, Clock3, Dna, FolderGit2, GitFork, Radar as RadarIcon, Star, Users } from "lucide-react";
import type { DnaProfile } from "@/lib/metrics";
import { RadarChart } from "./RadarChart";

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;

interface DnaCardProps {
  dna: DnaProfile;
}

function compact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(value);
}

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

function HourHistogram({ histogram, peak }: { histogram: number[]; peak: DnaProfile["peakWindow"] }) {
  const max = Math.max(1, ...histogram);
  const inPeak = (hour: number) => {
    if (!peak) return false;
    if (peak.startHour <= peak.endHour) return hour >= peak.startHour && hour < peak.endHour;
    return hour >= peak.startHour || hour < peak.endHour;
  };
  return (
    <div className="flex h-12 items-end gap-[3px]">
      {histogram.map((count, hour) => (
        <div
          key={hour}
          className="flex-1 rounded-sm"
          style={{
            height: `${Math.max(6, (count / max) * 100)}%`,
            background: inPeak(hour)
              ? "linear-gradient(180deg,#22d3ee,#8b5cf6)"
              : "rgba(148,163,184,0.25)",
          }}
        />
      ))}
    </div>
  );
}

function Counter({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="flex items-center gap-1.5 text-slate-400">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-[0.14em]">{label}</span>
      </div>
      <span className="font-mono text-2xl font-semibold text-slate-50">{value}</span>
    </div>
  );
}

export const DnaCard = forwardRef<HTMLDivElement, DnaCardProps>(function DnaCard({ dna }, ref) {
  const analyzedDate = new Date(dna.analyzedAt);
  const analyzedLabel = Number.isFinite(analyzedDate.getTime())
    ? analyzedDate.toUTCString().slice(0, 16)
    : "";

  return (
    <div
      ref={ref}
      className="relative flex flex-col overflow-hidden rounded-[32px] border border-white/10 text-slate-100"
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        background:
          "radial-gradient(1100px 520px at 12% -10%, rgba(139,92,246,0.22), transparent 60%), radial-gradient(900px 480px at 105% 115%, rgba(34,211,238,0.18), transparent 55%), linear-gradient(155deg, #0a0f1e 0%, #0b1120 45%, #070b16 100%)",
        boxShadow: "0 30px 80px -20px rgba(2,6,23,0.9), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.6) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      <div className="relative flex items-start justify-between px-10 pt-9">
        <div className="flex items-center gap-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${dna.avatarUrl}${dna.avatarUrl.includes("?") ? "&" : "?"}s=176`}
            alt={dna.username}
            crossOrigin="anonymous"
            width={88}
            height={88}
            className="h-[88px] w-[88px] rounded-2xl border border-white/15 object-cover"
            style={{ boxShadow: "0 0 0 4px rgba(139,92,246,0.18), 0 12px 30px -8px rgba(0,0,0,0.7)" }}
          />
          <div className="max-w-[430px]">
            <div className="flex items-baseline gap-3">
              <h2 className="truncate text-[28px] font-bold leading-tight tracking-tight">
                {dna.displayName}
              </h2>
              <span className="shrink-0 font-mono text-lg text-cyan-300">@{dna.username}</span>
            </div>
            <p className="mt-1 line-clamp-2 text-[15px] leading-snug text-slate-400">
              {dna.bio || "Building in public on GitHub."}
            </p>
          </div>
        </div>

        <div
          className="group/badge relative flex cursor-help items-center gap-2.5 rounded-2xl border border-violet-400/30 px-4 py-2.5"
          style={{
            background: "linear-gradient(120deg, rgba(139,92,246,0.18), rgba(34,211,238,0.14))",
            boxShadow: "0 0 24px rgba(139,92,246,0.25), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          <Dna size={20} className="text-violet-300" />
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-300/80">
              Archetype
            </div>
            <div className="text-[17px] font-bold leading-tight">{dna.persona.title}</div>
          </div>
          <div className="pointer-events-none absolute right-0 top-full z-30 mt-3 w-80 rounded-xl border border-white/10 bg-[#0b1120]/95 px-4 py-3 opacity-0 shadow-2xl backdrop-blur-md transition-opacity duration-150 group-hover/badge:opacity-100">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-300">
              {dna.persona.title}
            </div>
            <p className="text-[13px] leading-snug text-slate-300">{dna.persona.description}</p>
            <p className="mt-2 font-mono text-[11px] leading-snug text-slate-500">{dna.persona.tagline}</p>
          </div>
        </div>
      </div>

      <div className="relative mt-2 flex flex-1 items-stretch gap-6 px-10">
        <div className="flex w-[410px] items-center justify-center">
          <RadarChart scores={dna.radar} size={330} />
        </div>

        <div className="flex flex-1 flex-col justify-center gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Language Matrix
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                {dna.distinctLanguages} distinct
              </span>
            </div>
            {dna.languages.length === 0 ? (
              <p className="py-2 text-sm text-slate-500">No language data on recent repositories.</p>
            ) : (
              <>
                <div className="flex h-3.5 w-full overflow-hidden rounded-full">
                  {dna.languages.map((language) => (
                    <div
                      key={language.name}
                      style={{
                        width: `${language.percentage}%`,
                        backgroundColor: language.color,
                        minWidth: language.percentage > 0 ? 4 : 0,
                      }}
                    />
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-1.5">
                  {dna.languages.slice(0, 6).map((language) => (
                    <div key={language.name} className="flex items-center gap-2 text-[13px]">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: language.color, boxShadow: `0 0 8px ${language.color}66` }}
                      />
                      <span className="truncate text-slate-300">{language.name}</span>
                      <span className="ml-auto font-mono text-slate-500">
                        {language.percentage.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                <Clock3 size={13} className="text-cyan-300" />
                Peak Productivity
              </span>
              <span className="font-mono text-[13px] font-semibold text-cyan-300">
                {dna.peakWindow
                  ? `${formatHour(dna.peakWindow.startHour)} – ${formatHour(dna.peakWindow.endHour)} UTC`
                  : "No recent activity"}
              </span>
            </div>
            <HourHistogram histogram={dna.hourHistogram} peak={dna.peakWindow} />
            <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-600">
              <span>00</span>
              <span>06</span>
              <span>12</span>
              <span>18</span>
              <span>23</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <Counter icon={<Star size={13} className="text-slate-500" />} label="Stars" value={compact(dna.totalStars)} />
            <Counter icon={<GitFork size={13} className="text-slate-500" />} label="Forks" value={compact(dna.totalForks)} />
            <Counter icon={<FolderGit2 size={13} className="text-slate-500" />} label="Repos" value={compact(dna.publicRepos)} />
            <Counter icon={<Users size={13} className="text-slate-500" />} label="Followers" value={compact(dna.followers)} />
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-between border-t border-white/[0.07] px-10 py-4">
        <div className="flex items-center gap-2 text-slate-400">
          <RadarIcon size={15} className="text-violet-300" />
          <span className="text-[12px] font-bold uppercase tracking-[0.3em] text-slate-300">
            Developer DNA
          </span>
          <span className="font-mono text-[11px] text-slate-600">github.com/{dna.username}</span>
        </div>
        <div className="flex items-center gap-4 font-mono text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <Activity size={12} className="text-slate-500" />
            {dna.eventsAnalyzed} events analyzed
          </span>
          <span>{analyzedLabel}</span>
        </div>
      </div>
    </div>
  );
});
