# BeneOS

Browser-Betriebssystem im Cyber-Look: Portfolio von Benedikt Pankratz (Junior Cybersecurity Consultant, eWPTX).
Reines HTML/CSS/JS, kein Build-Schritt nötig. Alle öffentlichen GitHub-Repos werden automatisch zu Apps.

## Anpassen
- `os.js` → Block `PROFILE` ganz oben: Name, Bio, Skills, **Zertifikate** (Datum/ID/Verify-Link), Live-Projekte, Links.
- `lab.js` → Security-Lab-Apps (Hash Breaker, Log Hunter, Packet Defender, Zertifikate).

## Netlify
1. Repo auf GitHub pushen, in Netlify „Import from Git“ wählen.
2. `netlify.toml` setzt alles: Publish-Ordner `.`, Security-Header (CSP, HSTS, …) und den Build-Schritt,
   der `repos-fallback.js` frisch von GitHub holt.
3. Neue Repos erscheinen auch ohne Redeploy (Live-Abruf der GitHub-API, 1 h Cache im Browser).
   Für einen frischen Offline-Snapshot: in Netlify einen Build Hook anlegen und per Cron/GitHub Action triggern.

Lokal testen: `index.html` öffnen oder `npx serve .`
