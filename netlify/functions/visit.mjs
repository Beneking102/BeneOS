// Besucherzähler + Live-Rückmeldung für die NFC-Karte (/tap.html).
// Gespeichert werden: eine Zahl, die letzten 15 Besuche (Zeit, grobes OS, Quelle) und – nur bei einem Tap
// auf BeneCard – der Gerätetyp unter einer Einmal-ID, bis die App ihn abholt. Keine IPs: Zum Begrenzen
// wird die IP mit einem täglich neuen Zufalls-Salt gehasht; alte Salts und Hashes werden gelöscht.
import { getStore } from "@netlify/blobs";

const FLAG = "BENE{phys1c4l_4cc3ss_gr4nt3d}";
const MAX_POSTS_PER_DAY = 40;
const ID_RE = /^[a-z0-9]{6,16}$/;
const HEADERS = { "content-type": "application/json", "cache-control": "no-store" };

const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: HEADERS });
const clean = (s, n) => String(s ?? "").replace(/[^\w .,\-()]/g, "").trim().slice(0, n);
const osOf = ua => /iPhone|iPad/.test(ua) ? "iPhone" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows"
  : /Mac OS/.test(ua) ? "Mac" : /Linux/.test(ua) ? "Linux" : "Gerät";

async function sha(s) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Buffer.from(buf).toString("hex").slice(0, 32);
}

// Pro Tag ein neuer Salt; beim Wechsel werden alle Daten des Vortags (Salts, Hashes, Einmal-IDs) gelöscht.
async function dailySalt(store, day) {
  const existing = await store.get(`salt/${day}`);
  if (existing) return existing;
  const salt = crypto.randomUUID();
  await store.set(`salt/${day}`, salt);
  for (const prefix of ["salt/", "seen/", "id/"]) {
    const { blobs } = await store.list({ prefix });
    await Promise.all(blobs.filter(b => !b.key.startsWith(`${prefix}${day}`) || prefix === "id/")
      .filter(b => b.key !== `salt/${day}`).map(b => store.delete(b.key)));
  }
  return salt;
}

export default async (req, context) => {
  const store = getStore({ name: "visits", consistency: "strong" });
  const count = Number(await store.get("count")) || 0;

  if (req.method === "GET") {
    const id = new URL(req.url).searchParams.get("id");
    if (id == null) return json({ count, recent: (await store.get("recent", { type: "json" })) ?? [] });
    if (!ID_RE.test(id)) return json({ error: "bad id" }, 400);
    const hit = await store.get(`id/${id}`, { type: "json" });
    if (hit) await store.delete(`id/${id}`); // Einmal abholen, dann weg
    return json({ count, hit });
  }
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  let body = {};
  try { body = await req.json(); } catch { /* leerer Body ist ok */ }

  const day = new Date().toISOString().slice(0, 10);
  const who = await sha((context.ip || "unknown") + (await dailySalt(store, day)));
  const seenKey = `seen/${day}/${who}`;
  const posts = Number(await store.get(seenKey)) || 0;
  if (posts >= MAX_POSTS_PER_DAY) return json({ error: "rate limited", count }, 429);
  await store.set(seenKey, String(posts + 1));

  const os = osOf(req.headers.get("user-agent") || "");
  const via = ["card", "tag"].includes(body.via) ? body.via : "web";
  let total = count;
  if (posts === 0) { // Pro Gerät/Netz und Tag nur einmal zählen
    total = count + 1;
    await store.set("count", String(total));
    const recent = (await store.get("recent", { type: "json" })) ?? [];
    recent.unshift({ t: Date.now(), os, via });
    await store.setJSON("recent", recent.slice(0, 15));
  }
  if (typeof body.id === "string" && ID_RE.test(body.id)) {
    await store.setJSON(`id/${body.id}`, { t: Date.now(), os, model: clean(body.model, 40) });
  }
  return json({ count: total, first: posts === 0, flag: via === "web" ? null : FLAG });
};

export const config = { path: "/api/visit" };
