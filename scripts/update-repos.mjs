// Holt die öffentlichen Repos des Users und schreibt repos-fallback.js (Offline-Snapshot).
// Nutzung: node scripts/update-repos.mjs   (Node 18+; optional GITHUB_TOKEN gegen API-Limits)
import { readFileSync, writeFileSync } from "node:fs";

const src = readFileSync(new URL("../os.js", import.meta.url), "utf8");
const user = (src.match(/user:\s*"([^"]+)"/) || [])[1];
if (!user) { console.warn("PROFILE.user nicht gefunden – überspringe."); process.exit(0); }

try {
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "beneos-build" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com/users/${user}/repos?per_page=100&sort=pushed`, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const list = (await res.json())
    .filter(r => !r.fork && !r.archived && r.name !== user)
    .map(r => ({ name: r.name, description: r.description, language: r.language, topics: r.topics || [], stargazers_count: r.stargazers_count, pushed_at: r.pushed_at, homepage: r.homepage, html_url: r.html_url }));
  writeFileSync(new URL("../repos-fallback.js", import.meta.url),
    `/* Offline-Snapshot der öffentlichen Repos (automatisch erzeugt von scripts/update-repos.mjs) */\nwindow.REPO_FALLBACK = ${JSON.stringify(list)};\n`);
  console.log(`repos-fallback.js aktualisiert: ${list.length} Repos von ${user}`);
} catch (e) {
  console.warn("Snapshot nicht aktualisiert, behalte alten Stand:", e.message);
}
