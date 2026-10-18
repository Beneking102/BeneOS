// Opfer-Zähler für den Chaos-Chip (/chaos.html). Gespeichert wird nur eine Zahl.
// Zum Begrenzen (max. 20 Zählungen pro Netz und Tag) wird die IP mit einem täglich neuen Zufalls-Salt gehasht;
// beim Tageswechsel werden alte Salts und Hashes gelöscht.
import { getStore } from "@netlify/blobs";

const MAX_PER_DAY = 20;
const HEADERS = { "content-type": "application/json", "cache-control": "no-store" };
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: HEADERS });

async function sha(s) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Buffer.from(buf).toString("hex").slice(0, 32);
}

async function dailySalt(store, day) {
  const existing = await store.get(`salt/${day}`);
  if (existing) return existing;
  const salt = crypto.randomUUID();
  await store.set(`salt/${day}`, salt);
  for (const prefix of ["salt/", "seen/"]) {
    const { blobs } = await store.list({ prefix });
    await Promise.all(blobs.filter(b => !b.key.startsWith(`${prefix}${day}`)).map(b => store.delete(b.key)));
  }
  return salt;
}

export default async (req, context) => {
  const store = getStore({ name: "chaos", consistency: "strong" });
  const count = Number(await store.get("count")) || 0;
  if (req.method === "GET") return json({ count });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const day = new Date().toISOString().slice(0, 10);
  const key = `seen/${day}/${await sha((context.ip || "unknown") + (await dailySalt(store, day)))}`;
  const n = Number(await store.get(key)) || 0;
  if (n >= MAX_PER_DAY) return json({ count }); // zählt nicht mehr, verrät aber die aktuelle Zahl
  await store.set(key, String(n + 1));
  await store.set("count", String(count + 1));
  return json({ count: count + 1 });
};

export const config = { path: "/api/chaos" };
