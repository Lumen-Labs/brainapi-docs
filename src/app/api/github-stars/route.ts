import { NextResponse } from "next/server";

const GITHUB_REPO = "Lumen-Labs/brainapi2";

export const revalidate = 3600;

export async function GET() {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`, {
      headers: { Accept: "application/vnd.github.v3+json" },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GitHub API error: ${res.status} ${text}`);
    }
    const data = await res.json();
    return NextResponse.json({ stars: data.stargazers_count ?? 0 });
  } catch (e) {
    return NextResponse.json({ stars: 0 });
  }
}
