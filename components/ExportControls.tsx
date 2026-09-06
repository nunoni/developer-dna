"use client";

import { useState, type RefObject } from "react";
import { toPng, toSvg } from "html-to-image";
import { Check, ClipboardCopy, ImageDown, Loader2 } from "lucide-react";
import { CARD_HEIGHT, CARD_WIDTH } from "./DnaCard";

interface ExportControlsProps {
  targetRef: RefObject<HTMLDivElement | null>;
  username: string;
}

type Action = "png" | "svg" | null;

const exportOptions = {
  width: CARD_WIDTH,
  height: CARD_HEIGHT,
  pixelRatio: 2,
  cacheBust: true,
  style: { transform: "none", transformOrigin: "top left" },
} as const;

export function ExportControls({ targetRef, username }: ExportControlsProps) {
  const [busy, setBusy] = useState<Action>(null);
  const [done, setDone] = useState<Action>(null);
  const [failed, setFailed] = useState(false);

  const run = async (action: Exclude<Action, null>) => {
    const node = targetRef.current;
    if (!node || busy) return;
    setBusy(action);
    setFailed(false);
    try {
      if (action === "png") {
        const dataUrl = await toPng(node, exportOptions);
        const link = document.createElement("a");
        link.download = `developer-dna-${username}.png`;
        link.href = dataUrl;
        link.click();
      } else {
        const dataUrl = await toSvg(node, exportOptions);
        const svgMarkup = decodeURIComponent(dataUrl.slice(dataUrl.indexOf(",") + 1));
        await navigator.clipboard.writeText(svgMarkup);
      }
      setDone(action);
      setTimeout(() => setDone(null), 2200);
    } catch {
      setFailed(true);
      setTimeout(() => setFailed(false), 3000);
    } finally {
      setBusy(null);
    }
  };

  const buttonClass =
    "flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <button
        onClick={() => run("png")}
        disabled={busy !== null}
        className="flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy === "png" ? (
          <Loader2 size={16} className="animate-spin text-cyan-300" />
        ) : done === "png" ? (
          <Check size={16} className="text-emerald-400" />
        ) : (
          <ImageDown size={16} className="text-cyan-300" />
        )}
        Export PNG (2x)
      </button>
      <button onClick={() => run("svg")} disabled={busy !== null} className={buttonClass}>
        {busy === "svg" ? (
          <Loader2 size={16} className="animate-spin text-slate-300" />
        ) : done === "svg" ? (
          <Check size={16} className="text-emerald-400" />
        ) : (
          <ClipboardCopy size={16} className="text-slate-400" />
        )}
        Copy card SVG
      </button>
      {failed && <span className="text-sm text-rose-400">Export failed, please try again.</span>}
    </div>
  );
}
