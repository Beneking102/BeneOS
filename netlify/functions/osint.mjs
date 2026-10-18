// Liefert grobe Herkunft des Besuchers (Stadt, Region, Provider) für den "Wir sehen dich"-Grusel.
// Quelle ist allein die IP, die jeder Webserver ohnehin sieht. Es wird NICHTS gespeichert.
const HEADERS = { "content-type": "application/json", "cache-control": "no-store" };
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: HEADERS });

export default async (req, context) => {
  const geo = { city: "", region: "", country: "", org: "", tz: "" };
  // Hinter Cloudflare steht die echte Besucher-IP im Header cf-connecting-ip,
  // sonst im ersten Eintrag von x-forwarded-for; context.ip wäre nur die Cloudflare-IP.
  const h = req.headers;
  const xff = (h.get("x-forwarded-for") || "").split(",")[0].trim();
  const ip = h.get("cf-connecting-ip") || xff || context.ip || "";
  // Provider/ISP kommt von einem IP-Dienst (serverseitig, die IP verlässt den Server nicht Richtung Browser)
  try {
    if (ip) {
      const r = await fetch(`https://ipapi.co/${ip}/json/`, { headers: { "user-agent": "beneos" }, signal: AbortSignal.timeout(2500) });
      if (r.ok) {
        const j = await r.json();
        geo.org = (j.org || "").replace(/^AS\d+\s*/, "");
        if (!geo.city) geo.city = j.city || "";
        if (!geo.region) geo.region = j.region || "";
        if (!geo.country) geo.country = j.country_name || "";
        if (!geo.tz) geo.tz = j.timezone || "";
      }
    }
  } catch { /* egal */ }
  return json({ geo });
};

export const config = { path: "/api/osint" };
