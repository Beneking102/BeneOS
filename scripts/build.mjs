// Build: kopiert die Site nach dist/ und hängt an jede JS/CSS-Datei in index.html einen Content-Hash (?v=…).
// Warum? Proxys/CDNs (z. B. Cloudflare) cachen CSS/JS oft Stunden lang und ignorieren Cache-Header.
// Mit Hash in der URL kann nach einem Deploy nie neues HTML mit altem CSS/JS gemischt werden.
import { cpSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const dist = join(root, "dist");
const SKIP = new Set([".git", ".github", ".netlify", "node_modules", "scripts", "dist", "README.md", ".gitignore", "netlify.toml", "netlify", "package.json", "package-lock.json"]);

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
for (const name of readdirSync(root)) if (!SKIP.has(name)) cpSync(join(root, name), join(dist, name), { recursive: true });

const hash = f => createHash("sha1").update(readFileSync(join(dist, f))).digest("hex").slice(0, 10);
const idx = join(dist, "index.html");
let n = 0;
const html = readFileSync(idx, "utf8").replace(/(<(?:script[^>]*?\ssrc|link[^>]*?\shref)=")([^"?#:]+\.(?:js|css))(?:\?v=[0-9a-f]+)?(")/g,
  (m, a, f, c) => (existsSync(join(dist, f)) ? (n++, `${a}${f}?v=${hash(f)}${c}`) : m));
writeFileSync(idx, html);
console.log(`dist/ erzeugt, ${n} Dateien mit Content-Hash versehen`);
