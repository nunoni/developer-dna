import { NextRequest, NextResponse } from "next/server";
import { fetchDeveloperData, GitHubApiError } from "@/lib/github";
import { buildDnaProfile } from "@/lib/metrics";

export const runtime = "nodejs";

const USERNAME_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;

  if (!USERNAME_PATTERN.test(username)) {
    return NextResponse.json(
      { error: "invalid_username", message: "That does not look like a valid GitHub username." },
      { status: 400 },
    );
  }

  const token = request.headers.get("x-github-token");

  try {
    const raw = await fetchDeveloperData(username, token);
    const profile = buildDnaProfile(raw);
    return NextResponse.json(profile, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof GitHubApiError) {
      if (error.status === 404) {
        return NextResponse.json(
          { error: "not_found", message: `No GitHub user named "${username}".` },
          { status: 404 },
        );
      }
      if (error.status === 403 || error.status === 429) {
        return NextResponse.json(
          {
            error: "rate_limited",
            message: "GitHub API rate limit exceeded.",
            resetAt: error.rateLimitReset ?? null,
          },
          { status: 429 },
        );
      }
      if (error.status === 401) {
        return NextResponse.json(
          {
            error: "bad_token",
            message: "GitHub rejected the provided access token.",
          },
          { status: 401 },
        );
      }
      return NextResponse.json(
        { error: "github_error", message: error.message },
        { status: error.status || 502 },
      );
    }
    return NextResponse.json(
      { error: "internal", message: "Unexpected error while building the DNA profile." },
      { status: 500 },
    );
  }
}
