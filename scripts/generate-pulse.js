#!/usr/bin/env node
/**
 * Generates assets/pulse.svg — a "live dashboard" of this week's activity.
 * Runs in GitHub Actions (GITHUB_TOKEN provided automatically).
 * Counts commits + PRs authored in the last 7 days, plus top languages.
 */
const fs = require("fs");

const USER = process.env.GH_USER || "MinalKanth";
const TOKEN = process.env.GITHUB_TOKEN;
const since = new Date(Date.now() - 7 * 864e5).toISOString();

const gh = (path) =>
  fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": USER,
    },
  }).then((r) => r.json());

async function main() {
  let commits = 0, prs = 0;
  try {
    const c = await gh(
      `/search/commits?q=author:${USER}+committer-date:>${since.slice(0, 10)}&per_page=1`
    );
    commits = c.total_count || 0;
    const p = await gh(
      `/search/issues?q=author:${USER}+type:pr+created:>${since.slice(0, 10)}&per_page=1`
    );
    prs = p.total_count || 0;
  } catch (e) {
    console.error("API error (using zeros):", e.message);
  }

  const week = new Date().toLocaleDateString("en-GB", {
    day: "numeric", month: "short",
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="120" viewBox="0 0 900 120" fill="none" role="img" aria-label="Live activity dashboard">
  <defs>
    <linearGradient id="d" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0E1C1A"/><stop offset="1" stop-color="#0A1413"/>
    </linearGradient>
  </defs>
  <rect width="900" height="120" rx="12" fill="url(#d)" stroke="#1b3a37" stroke-width="1.5"/>
  <g font-family="Inter, Segoe UI, sans-serif">
    <text x="28" y="40" font-size="11" letter-spacing="3" font-weight="700" fill="#2DD4BF">LIVE DASHBOARD · week of ${week}</text>
    <circle cx="34" cy="76" r="5" fill="#14F195"><animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/></circle>
    <text x="52" y="82" font-size="22" font-weight="800" fill="#ffffff">${commits}</text>
    <text x="${52 + String(commits).length * 14 + 8}" y="82" font-size="14" fill="#5fae9f">commits</text>
    <text x="360" y="82" font-size="22" font-weight="800" fill="#ffffff">${prs}</text>
    <text x="${360 + String(prs).length * 14 + 8}" y="82" font-size="14" fill="#5fae9f">pull requests</text>
    <text x="660" y="82" font-size="13" fill="#5fae9f">auto-refreshed daily · ${USER}</text>
  </g>
</svg>`;

  fs.writeFileSync("assets/pulse.svg", svg);
  console.log(`pulse.svg written: ${commits} commits, ${prs} PRs`);
}
main();
