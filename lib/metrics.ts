import type { GitHubEvent, GitHubRepo, GitHubUser, LanguageBytes, RawDeveloperData } from "./github";
import { languageColor } from "./languages";

export interface RadarScores {
  velocity: number;
  versatility: number;
  impact: number;
  originality: number;
  seniority: number;
}

export interface LanguageShare {
  name: string;
  bytes: number;
  percentage: number;
  color: string;
}

export interface PeakWindow {
  startHour: number;
  endHour: number;
}

export interface Persona {
  title: string;
  description: string;
  tagline: string;
}

export interface DnaProfile {
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  htmlUrl: string;
  followers: number;
  publicRepos: number;
  totalStars: number;
  totalForks: number;
  originalRepos: number;
  forkedRepos: number;
  eventsAnalyzed: number;
  accountAgeYears: number;
  languages: LanguageShare[];
  distinctLanguages: number;
  hourHistogram: number[];
  peakWindow: PeakWindow | null;
  radar: RadarScores;
  persona: Persona;
  analyzedAt: string;
}

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const SYSTEMS_LANGS = new Set(["C", "C++", "Rust", "Assembly", "Zig", "Cuda", "Nim"]);
const FRONTEND_LANGS = new Set(["TypeScript", "JavaScript", "Vue", "Svelte", "HTML", "CSS", "SCSS", "Astro"]);
const BACKEND_LANGS = new Set(["Python", "Java", "Ruby", "PHP", "Go", "C#", "Scala", "Elixir", "Erlang", "Haskell", "Perl", "Clojure"]);
const DATA_LANGS = new Set(["Jupyter Notebook", "R", "MATLAB", "Julia"]);
const MOBILE_LANGS = new Set(["Swift", "Kotlin", "Dart", "Objective-C"]);

function computeLanguageShares(languageBytes: LanguageBytes): LanguageShare[] {
  const entries = Object.entries(languageBytes).filter(([, bytes]) => bytes > 0);
  const total = entries.reduce((sum, [, bytes]) => sum + bytes, 0);
  if (total === 0) return [];

  const shares = entries
    .map(([name, bytes]) => ({
      name,
      bytes,
      percentage: (bytes / total) * 100,
      color: languageColor(name),
    }))
    .sort((a, b) => b.bytes - a.bytes);

  const top = shares.slice(0, 6);
  const rest = shares.slice(6);
  if (rest.length > 0) {
    top.push({
      name: "Other",
      bytes: rest.reduce((sum, s) => sum + s.bytes, 0),
      percentage: rest.reduce((sum, s) => sum + s.percentage, 0),
      color: "#475569",
    });
  }
  return top;
}

function computeVelocity(events: GitHubEvent[]): number {
  const pushes = events.filter((event) => event.type === "PushEvent");
  const commitCount = pushes.reduce((sum, event) => sum + (event.payload?.size ?? 1), 0);
  const frequencyScore = clamp((commitCount / 80) * 100);

  const lastPushTime = pushes
    .map((event) => (event.created_at ? Date.parse(event.created_at) : 0))
    .reduce((max, time) => Math.max(max, time), 0);
  const daysSincePush = lastPushTime > 0 ? (Date.now() - lastPushTime) / 86_400_000 : Number.POSITIVE_INFINITY;
  const recencyScore = Number.isFinite(daysSincePush) ? clamp(100 - daysSincePush * 8) : 0;

  return Math.round(0.6 * frequencyScore + 0.4 * recencyScore);
}

function computeVersatility(languageBytes: LanguageBytes): number {
  const entries = Object.entries(languageBytes).filter(([, bytes]) => bytes > 0);
  const count = entries.length;
  if (count === 0) return 0;

  const countScore = clamp((count / 12) * 100);
  const total = entries.reduce((sum, [, bytes]) => sum + bytes, 0);
  const entropy = entries.reduce((sum, [, bytes]) => {
    const p = bytes / total;
    return sum - p * Math.log(p);
  }, 0);
  const diversity = count > 1 ? entropy / Math.log(count) : 0;

  return Math.round(0.55 * countScore + 0.45 * diversity * 100);
}

function computeImpact(totalStars: number, totalForks: number): number {
  const total = totalStars + totalForks;
  if (total <= 0) return 0;
  return Math.round(clamp((Math.log10(1 + total) / Math.log10(1 + 200_000)) * 100));
}

function computeOriginality(repos: GitHubRepo[]): { score: number; original: number; forked: number } {
  const original = repos.filter((repo) => !repo.fork).length;
  const forked = repos.length - original;
  const score = repos.length > 0 ? Math.round((original / repos.length) * 100) : 0;
  return { score, original, forked };
}

function computeSeniority(user: GitHubUser): { score: number; years: number } {
  const created = Date.parse(user.created_at);
  const years = Number.isFinite(created) ? (Date.now() - created) / (365.25 * 86_400_000) : 0;
  const ageScore = clamp((years / 10) * 100);
  const depthScore = clamp((user.public_repos / 60) * 100);
  return { score: Math.round(0.7 * ageScore + 0.3 * depthScore), years };
}

function buildHourHistogram(events: GitHubEvent[]): number[] {
  const histogram = new Array<number>(24).fill(0);
  for (const event of events) {
    if (!event.created_at) continue;
    const time = Date.parse(event.created_at);
    if (!Number.isFinite(time)) continue;
    histogram[new Date(time).getUTCHours()] += 1;
  }
  return histogram;
}

function findPeakWindow(histogram: number[], spanHours = 4): PeakWindow | null {
  const total = histogram.reduce((sum, count) => sum + count, 0);
  if (total === 0) return null;

  let bestStart = 0;
  let bestSum = -1;
  for (let start = 0; start < 24; start += 1) {
    let windowSum = 0;
    for (let offset = 0; offset < spanHours; offset += 1) {
      windowSum += histogram[(start + offset) % 24];
    }
    if (windowSum > bestSum) {
      bestSum = windowSum;
      bestStart = start;
    }
  }
  return { startHour: bestStart, endHour: (bestStart + spanHours) % 24 };
}

function shareOf(languages: LanguageShare[], set: Set<string>): number {
  return languages
    .filter((language) => set.has(language.name))
    .reduce((sum, language) => sum + language.percentage, 0);
}

function classifyPersona(
  radar: RadarScores,
  languages: LanguageShare[],
  peakWindow: PeakWindow | null,
  totalStars: number,
  username: string,
): Persona {
  const systems = shareOf(languages, SYSTEMS_LANGS);
  const frontend = shareOf(languages, FRONTEND_LANGS);
  const backend = shareOf(languages, BACKEND_LANGS);
  const data = shareOf(languages, DATA_LANGS);
  const mobile = shareOf(languages, MOBILE_LANGS);

  let domain = "Software";
  const domainShares: Array<[string, number]> = [
    ["Systems", systems],
    ["Frontend", frontend],
    ["Backend", backend],
    ["Data", data],
    ["Mobile", mobile],
  ];
  if (frontend >= 15 && backend >= 15) {
    domain = "Full-Stack";
  } else {
    const [bestDomain, bestShare] = domainShares.reduce((best, current) =>
      current[1] > best[1] ? current : best,
    );
    if (bestShare >= 35) domain = bestDomain;
    else if (radar.versatility >= 65) domain = "Polyglot";
  }

  let noun = "Engineer";
  if (radar.impact >= 65) noun = "Architect";
  else if (radar.velocity >= 75) noun = "Hacker";
  else if (radar.versatility >= 75 && domain !== "Polyglot") noun = "Polyglot";
  else if (radar.originality >= 85) noun = "Specialist";

  let prefix = "";
  const peakHour = peakWindow?.startHour ?? null;
  const isNightOwl = peakHour !== null && (peakHour >= 20 || peakHour <= 3);
  const isEarlyBird = peakHour !== null && peakHour >= 4 && peakHour <= 9;
  if (isNightOwl) prefix = "Night Owl";
  else if (isEarlyBird) prefix = "Early Bird";
  else if (radar.originality >= 85 && radar.versatility <= 45) prefix = "Hyper-Focused";
  else if (radar.impact >= 60) prefix = "Open-Source";
  else if (radar.velocity >= 75) prefix = "Relentless";

  const title = [prefix, domain, noun].filter(Boolean).join(" ");

  const prefixDescriptions: Record<string, string> = {
    "Night Owl": "Most active late at night",
    "Early Bird": "Most active in the early morning",
    "Hyper-Focused": "Stays tightly scoped on original work in a few languages",
    "Open-Source": "Maintains open source the community relies on",
    Relentless: "Ships relentlessly",
  };
  const domainDescriptions: Record<string, string> = {
    "Full-Stack": "spans frontend and backend code",
    Systems: "works close to the metal",
    Frontend: "focuses on interfaces and web UI",
    Backend: "builds server-side systems",
    Data: "works in data and analysis",
    Mobile: "builds mobile applications",
    Polyglot: "moves fluidly across many languages",
    Software: "builds as a generalist across the stack",
  };
  const nounDescriptions: Record<string, string> = {
    Architect: "with major community impact",
    Hacker: "shipping at high velocity",
    Polyglot: "fluent across many languages",
    Specialist: "with deep, concentrated focus",
    Engineer: "with a balanced, well-rounded profile",
  };
  const descriptionParts = [
    prefixDescriptions[prefix] ?? "Keeps a steady shipping rhythm",
    domainDescriptions[domain],
    nounDescriptions[noun],
  ];
  const description = `${descriptionParts.join(", ")}.`;

  const topLanguage = languages[0]?.name ?? "code";
  const peakText = peakWindow
    ? ` at ${String(peakWindow.startHour).padStart(2, "0")}:00 UTC`
    : "";
  const starText =
    totalStars >= 1000
      ? `${(totalStars / 1000).toFixed(1)}k stars earned`
      : totalStars > 0
        ? `${totalStars} stars earned`
        : "stars incoming";
  const tagline = `Ships ${topLanguage}${peakText}, with ${starText}. @${username}`;

  return { title, description, tagline };
}

export function buildDnaProfile(raw: RawDeveloperData): DnaProfile {
  const { user, repos, events, languageBytes } = raw;

  const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
  const languages = computeLanguageShares(languageBytes);
  const hourHistogram = buildHourHistogram(events);
  const peakWindow = findPeakWindow(hourHistogram);
  const originality = computeOriginality(repos);
  const seniority = computeSeniority(user);

  const radar: RadarScores = {
    velocity: computeVelocity(events),
    versatility: computeVersatility(languageBytes),
    impact: computeImpact(totalStars, totalForks),
    originality: originality.score,
    seniority: seniority.score,
  };

  const persona = classifyPersona(radar, languages, peakWindow, totalStars, user.login);

  return {
    username: user.login,
    displayName: user.name ?? user.login,
    avatarUrl: user.avatar_url,
    bio: user.bio ?? "",
    htmlUrl: user.html_url,
    followers: user.followers,
    publicRepos: user.public_repos,
    totalStars,
    totalForks,
    originalRepos: originality.original,
    forkedRepos: originality.forked,
    eventsAnalyzed: events.length,
    accountAgeYears: Math.round(seniority.years * 10) / 10,
    languages,
    distinctLanguages: Object.keys(languageBytes).filter((name) => (languageBytes[name] ?? 0) > 0).length,
    hourHistogram,
    peakWindow,
    radar,
    persona,
    analyzedAt: new Date().toISOString(),
  };
}
