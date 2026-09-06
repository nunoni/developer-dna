"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, Dna, FlaskConical, KeyRound, Link2, RotateCcw } from "lucide-react";
import type { DnaProfile } from "@/lib/metrics";
import { MOCK_DNA } from "@/lib/mock";
import { CARD_HEIGHT, CARD_WIDTH, DnaCard } from "./DnaCard";
import { CardSkeleton } from "./CardSkeleton";
import { ExportControls } from "./ExportControls";
import { HeroInput } from "./HeroInput";

const TOKEN_KEY = "devdna:github-token";

type FetchError =
  | { kind: "not_found"; message: string }
  | { kind: "rate_limited"; message: string; resetAt: number | null }
  | { kind: "bad_token"; message: string }
  | { kind: "unknown"; message: string };

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; dna: DnaProfile }
  | { status: "error"; error: FetchError };

function loadToken(): string {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

function saveToken(token: string) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // session storage unavailable, token simply won't persist
  }
}

async function parseDnaResponse(res: Response): Promise<State> {
  const body = await res.json().catch(() => ({}));
  if (res.ok) {
    return { status: "success", dna: body as DnaProfile };
  }
  if (res.status === 404) {
    return { status: "error", error: { kind: "not_found", message: body.message ?? "User not found." } };
  }
  if (res.status === 429) {
    return {
      status: "error",
      error: { kind: "rate_limited", message: body.message ?? "Rate limited.", resetAt: body.resetAt ?? null },
    };
  }
  if (res.status === 401) {
    return { status: "error", error: { kind: "bad_token", message: body.message ?? "Token rejected by GitHub." } };
  }
  return { status: "error", error: { kind: "unknown", message: body.message ?? "Something went wrong." } };
}

function ScaledCard({ children }: { children: React.ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const observer = new ResizeObserver(() => {
      setScale(Math.min(1, wrapper.clientWidth / CARD_WIDTH));
    });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} className="w-full" style={{ height: CARD_HEIGHT * scale }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>{children}</div>
    </div>
  );
}

const secondaryButtonClass =
  "flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white";

export default function DnaExperience() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const user = (searchParams.get("user") ?? "").trim();
  const isMock = searchParams.get("mock") === "1";

  const [state, setState] = useState<State>({ status: "idle" });
  const [retryNonce, setRetryNonce] = useState(0);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [tokenDraft, setTokenDraft] = useState("");

  useEffect(() => {
    if (!user) {
      setState({ status: "idle" });
      return;
    }
    if (isMock) {
      setState({ status: "success", dna: { ...MOCK_DNA, username: user } });
      return;
    }

    const controller = new AbortController();
    setState({ status: "loading" });

    const headers: Record<string, string> = {};
    const token = loadToken();
    if (token) headers["x-github-token"] = token;

    fetch(`/api/dna/${encodeURIComponent(user)}`, { headers, signal: controller.signal })
      .then(parseDnaResponse)
      .then((next) => setState(next))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({
          status: "error",
          error: { kind: "unknown", message: "Network error. Check your connection." },
        });
      });

    return () => controller.abort();
  }, [user, isMock, retryNonce]);

  const copyShareLink = useCallback(() => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      })
      .catch(() => undefined);
  }, []);

  const saveTokenAndRetry = () => {
    saveToken(tokenDraft.trim());
    setTokenDraft("");
    setRetryNonce((nonce) => nonce + 1);
  };

  const clearTokenAndRetry = () => {
    saveToken("");
    setRetryNonce((nonce) => nonce + 1);
  };

  const useMockData = () => {
    router.replace(`/?user=${encodeURIComponent(user || "octocat")}&mock=1`, { scroll: false });
  };

  const analyze = (username: string) => {
    router.replace(`/?user=${encodeURIComponent(username)}`, { scroll: false });
  };

  const resetTimeLabel =
    state.status === "error" && state.error.kind === "rate_limited" && state.error.resetAt
      ? new Date(state.error.resetAt).toLocaleTimeString()
      : null;

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-x-hidden px-4 pb-20 pt-8 sm:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 bg-grid" />
        <div className="absolute inset-0 bg-[radial-gradient(820px_420px_at_50%_-10%,rgba(56,189,248,0.08),transparent_70%)]" />
      </div>

      <header className="mb-10 flex w-full max-w-6xl items-center justify-between gap-4">
        <button
          onClick={() => router.replace("/", { scroll: false })}
          className="flex shrink-0 items-center gap-2.5 text-left"
          aria-label="Developer DNA, start over"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
            <Dna size={15} className="text-cyan-300" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-slate-100">
            Developer DNA
          </span>
        </button>
        {state.status !== "idle" && <HeroInput initialValue={user} />}
      </header>

      <AnimatePresence mode="wait">
        {state.status === "idle" && (
          <motion.section
            key="hero"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex w-full max-w-2xl flex-col items-center pt-14 text-center sm:pt-24"
          >
            <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.22em] text-slate-500">
              GitHub profile in, archetype card out
            </p>
            <h1 className="text-balance text-5xl font-bold leading-[1.05] tracking-tight text-slate-50 sm:text-6xl">
              Decode your developer genome
            </h1>
            <p className="mt-5 max-w-lg text-pretty text-base leading-relaxed text-slate-400 sm:text-lg">
              Turn any public GitHub profile into a shareable card: language matrix,
              activity rhythm, and a five-axis radar of how they build.
            </p>
            <div className="mt-10 flex w-full justify-center">
              <HeroInput initialValue="" large />
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-slate-600">Try</span>
              {["torvalds", "octocat", "sindresorhus"].map((username) => (
                <button
                  key={username}
                  onClick={() => analyze(username)}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-xs text-slate-400 transition hover:border-cyan-400/40 hover:text-cyan-200"
                >
                  {username}
                </button>
              ))}
            </div>
          </motion.section>
        )}

        {state.status === "loading" && (
          <motion.section
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-[1240px]"
          >
            <ScaledCard>
              <CardSkeleton />
            </ScaledCard>
            <p className="mt-6 text-center font-mono text-sm text-slate-500">
              Sequencing @{user}&rsquo;s genome across the GitHub API...
            </p>
          </motion.section>
        )}

        {state.status === "success" && (
          <motion.section
            key="card"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 70, damping: 16 }}
            className="w-full max-w-[1240px]"
          >
            <ScaledCard>
              <DnaCard ref={cardRef} dna={state.dna} />
            </ScaledCard>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              <ExportControls targetRef={cardRef} username={state.dna.username} />
              <button onClick={copyShareLink} className={secondaryButtonClass}>
                {copiedLink ? (
                  <Check size={16} className="text-emerald-400" />
                ) : (
                  <Link2 size={16} className="text-slate-400" />
                )}
                {copiedLink ? "Link copied" : "Copy share link"}
              </button>
            </div>
          </motion.section>
        )}

        {state.status === "error" && (
          <motion.section
            key="error"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-xl pt-10"
          >
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-400/25 bg-rose-500/10">
                  <AlertTriangle size={18} className="text-rose-400" />
                </span>
                <h2 className="text-xl font-semibold text-slate-100">
                  {state.error.kind === "not_found" && "User not found"}
                  {state.error.kind === "rate_limited" && "GitHub rate limit hit"}
                  {state.error.kind === "bad_token" && "Token rejected"}
                  {state.error.kind === "unknown" && "Something went wrong"}
                </h2>
              </div>
              <p className="text-sm leading-relaxed text-slate-400">
                {state.error.message}
                {resetTimeLabel && <> The limit resets around {resetTimeLabel}.</>}
              </p>

              {state.error.kind === "rate_limited" && (
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                      <KeyRound size={12} />
                      Personal access token (optional, stored in this tab only)
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={tokenDraft}
                        onChange={(event) => setTokenDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && tokenDraft.trim()) saveTokenAndRetry();
                        }}
                        placeholder="ghp_... or github_pat_..."
                        type="password"
                        autoComplete="off"
                        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 font-mono text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-400/50"
                      />
                      <button
                        onClick={saveTokenAndRetry}
                        disabled={!tokenDraft.trim()}
                        className="flex shrink-0 items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <RotateCcw size={14} />
                        Retry
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-xs text-slate-600">or</span>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>
                  <button
                    onClick={useMockData}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                  >
                    <FlaskConical size={15} />
                    Preview with sample data
                  </button>
                </div>
              )}

              {state.error.kind === "bad_token" && (
                <div className="mt-6 space-y-3">
                  <p className="text-xs leading-relaxed text-slate-500">
                    The token saved in this tab was rejected by GitHub. Clear it to continue
                    with unauthenticated requests, or paste a fresh one on the next attempt.
                  </p>
                  <button
                    onClick={clearTokenAndRetry}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/20"
                  >
                    <RotateCcw size={14} />
                    Clear token and retry
                  </button>
                </div>
              )}

              {state.error.kind === "not_found" && (
                <div className="mt-6">
                  <HeroInput initialValue={user} />
                </div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}
