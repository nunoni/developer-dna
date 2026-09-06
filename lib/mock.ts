import type { DnaProfile } from "./metrics";

export const MOCK_DNA: DnaProfile = {
  username: "octocat",
  displayName: "Mona Octocat",
  avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
  bio: "Full-stack tinkerer. Shipping pixels by day, systems by night.",
  htmlUrl: "https://github.com/octocat",
  followers: 9420,
  publicRepos: 64,
  totalStars: 12480,
  totalForks: 1730,
  originalRepos: 58,
  forkedRepos: 6,
  eventsAnalyzed: 87,
  accountAgeYears: 8.4,
  languages: [
    { name: "TypeScript", bytes: 2_480_000, percentage: 46.2, color: "#3178c6" },
    { name: "Rust", bytes: 1_450_000, percentage: 27.0, color: "#dea584" },
    { name: "Python", bytes: 806_000, percentage: 15.0, color: "#3572a5" },
    { name: "CSS", bytes: 376_000, percentage: 7.0, color: "#663399" },
    { name: "Shell", bytes: 256_000, percentage: 4.8, color: "#89e051" },
  ],
  distinctLanguages: 9,
  hourHistogram: [
    6, 9, 12, 10, 5, 2, 0, 0, 1, 2, 3, 5, 6, 5, 4, 4, 5, 6, 7, 9, 11, 12, 10, 8,
  ],
  peakWindow: { startHour: 22, endHour: 2 },
  radar: { velocity: 88, versatility: 76, impact: 64, originality: 92, seniority: 71 },
  persona: {
    title: "Night Owl Full-Stack Architect",
    description: "Most active late at night, spans frontend and backend code, with major community impact.",
    tagline: "Ships TypeScript at 22:00 UTC, with 12.5k stars earned. @octocat",
  },
  analyzedAt: new Date().toISOString(),
};
