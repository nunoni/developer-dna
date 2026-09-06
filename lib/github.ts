export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  followers: number;
  public_repos: number;
  created_at: string;
  html_url: string;
  company: string | null;
  location: string | null;
}

export interface GitHubRepo {
  name: string;
  fork: boolean;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  pushed_at: string | null;
  updated_at: string;
}

export interface GitHubEvent {
  type: string;
  created_at: string | null;
  payload?: { size?: number };
}

export type LanguageBytes = Record<string, number>;

export interface RawDeveloperData {
  user: GitHubUser;
  repos: GitHubRepo[];
  events: GitHubEvent[];
  languageBytes: LanguageBytes;
  languageRepoCount: number;
}

export class GitHubApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly rateLimitReset?: number,
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}

const API_BASE = "https://api.github.com";
const MAX_REPOS = 100;
const MAX_LANGUAGE_REPOS = 12;

async function ghFetch<T>(path: string, token?: string | null): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { headers, cache: "no-store" });
  } catch {
    throw new GitHubApiError("Network error while contacting the GitHub API", 0);
  }

  if (res.status === 404) {
    throw new GitHubApiError("GitHub user not found", 404);
  }
  if (res.status === 403 || res.status === 429) {
    const resetHeader = res.headers.get("x-ratelimit-reset");
    const retryAfter = Number(res.headers.get("retry-after"));
    const reset = resetHeader
      ? Number(resetHeader) * 1000
      : Number.isFinite(retryAfter) && retryAfter > 0
        ? Date.now() + retryAfter * 1000
        : undefined;
    throw new GitHubApiError("GitHub API rate limit exceeded", res.status, reset);
  }
  if (!res.ok) {
    throw new GitHubApiError(`GitHub API responded with status ${res.status}`, res.status);
  }
  return (await res.json()) as T;
}

export async function fetchDeveloperData(
  username: string,
  token?: string | null,
): Promise<RawDeveloperData> {
  const login = encodeURIComponent(username.trim());

  const user = await ghFetch<GitHubUser>(`/users/${login}`, token);

  const [repos, events] = await Promise.all([
    ghFetch<GitHubRepo[]>(
      `/users/${user.login}/repos?per_page=${MAX_REPOS}&sort=updated&type=owner`,
      token,
    ),
    ghFetch<GitHubEvent[]>(`/users/${user.login}/events/public?per_page=100`, token).catch(
      () => [] as GitHubEvent[],
    ),
  ]);

  const languageCandidates = repos
    .filter((repo) => !repo.fork)
    .sort((a, b) => {
      const aTime = a.pushed_at ? Date.parse(a.pushed_at) : 0;
      const bTime = b.pushed_at ? Date.parse(b.pushed_at) : 0;
      return bTime - aTime;
    })
    .slice(0, MAX_LANGUAGE_REPOS);

  const languageResults = await Promise.all(
    languageCandidates.map((repo) =>
      ghFetch<LanguageBytes>(`/repos/${user.login}/${encodeURIComponent(repo.name)}/languages`, token).catch(
        () => ({}) as LanguageBytes,
      ),
    ),
  );

  const languageBytes: LanguageBytes = {};
  for (const result of languageResults) {
    for (const [language, bytes] of Object.entries(result)) {
      languageBytes[language] = (languageBytes[language] ?? 0) + bytes;
    }
  }

  return { user, repos, events, languageBytes, languageRepoCount: languageCandidates.length };
}
