// Besucherzähler für die NFC-Karte (/tap). Speichert nur eine Zahl – keine IPs, keine Profile.
import { getStore } from "@netlify/blobs";

const JSON_HEADERS = { "content-type": "application/json", "cache-control": "no-store" };

export default async (req) => {
  const store = getStore("visits");
  let count = Number(await store.get("count")) || 0;
  if (req.method === "POST") {
    count += 1;
    await store.set("count", String(count));
  } else if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }
  return new Response(JSON.stringify({ count }), { headers: JSON_HEADERS });
};

export const config = { path: "/api/visit" };
