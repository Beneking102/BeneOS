# BeneOS

> A cyber-themed operating system that runs entirely in your browser – the portfolio of **Benedikt Pankratz**, Junior Cybersecurity Consultant (eWPTX).

**Live:** https://beneos.netlify.app

![BeneOS desktop](og-image.png)

## Features

**Desktop & Shell**
- Window manager with drag, resize, minimize, maximize, **edge snapping**, close animations, taskbar dock and start menu with **search** (`Ctrl+K`).
- **3 virtual desktops** (`Ctrl+Alt+1/2/3`) and a **window overview** (`Ctrl+Alt+O`) to move or close windows.
- **Login & lock screen** with account tiles, animated auth sequence and failed-attempt lockout.
- **Control Center**, **notification history**, **calendar**, context menu, drag-and-drop **desktop icons** (order is saved), screensaver after 2 minutes idle.
- Live **widgets**: clock, GitHub stats from the real API, simulated threat feed. Taskbar shows network and battery status.
- **5 live wallpapers** (Matrix, Synthwave, starfield, aurora, off) and 8 color schemes.
- Retro-style **sounds** synthesized with the Web Audio API (no audio files). Installable **PWA**.

**Portfolio**
- **Every public GitHub repo is an app** – loaded live from the GitHub API, with an offline snapshot as fallback.
- Profile with tabs (profile, highlights, tech stack), certificates (eWPTX), file explorer, 36 achievements.
- **BeneBot**: rule-based assistant that answers questions about the portfolio, opens apps, changes settings and gives CTF hints (no cloud AI, runs locally).

**Security Lab**
- **Security Toolbox**: JWT decoder, hash identifier, secure password generator, IPv4 subnet calculator, Unix-time converter.
- **DNS Lab**: real DNS-over-HTTPS queries (Cloudflare) and a mail-security check (SPF, DMARC, DKIM).
- **Vault**: AES-256-GCM encrypted note (PBKDF2, 250k iterations), stored only in your browser.
- **Pentest Report Generator**: CVSS 3.1 calculator, 12 finding templates (CWE / OWASP mapped), automatic management summary, severity chart, export to Markdown, standalone HTML and PDF (print), JSON backup/import. Autosave in the browser, example report included.
- Cipher Lab, Password Lab, Hash Breaker, Log Hunter, Packet Defender, Phish or Legit?, **Cyber Globe** (simulated attack map).
- **Mini CTF** with 9 flags hidden across the OS (login screen, terminal, file system, DevTools console, a cheat code …).
- Terminal with `dig` (real DNS), `nmap` (simulated), `sha256`, `top`, `kill`, `ws`, `ping`, tab completion and more.

**Tools & Fun**
- Calculator (with programmer mode and bit toggles), PixelLab (paint), **Task Manager** with real metrics (FPS, JS heap, DOM nodes, network, battery).
- Minesweeper (3 difficulties), Tetris (hold, next queue, ghost piece), Snake (wrap mode, golden packets), Packet Defender (combos, EMP), Hacker Typing, Phish or Legit? (timed mode) – all with a shared game UI: HUD, start / pause / game-over screens, high scores and touch controls.
- **Synthwave Radio** (generative music with visualizer).
- And a few secrets to find …

**Mobile**
- Dedicated mobile mode: home screen with clock and app search, one app at a time in full screen, ⌂ button and the device back button return home, bottom-sheet start menu, touch controls for games, terminal key bar, keyboard and safe-area handling.
- Installable as an app (PWA) on phones.

**Performance**
- Background pauses when the tab is hidden, a window covers the screen, or the screensaver runs.
- Performance mode (no blur, no animations) – switched on automatically when the frame rate is low.
- No framework, no build step, no tracking, no cookies.

## Customize

- `os.js` → `PROFILE` block at the top: name, bio, skills, certificates (date / credential ID / verify link), live projects, links.
- `lab.js`, `lab2.js` → Security Lab apps,36 achievements and file explorer.
- `shell.js`, `shell2.js` → control center, widgets, screensaver, virtual desktops, overview, terminal extensions, easter eggs · `login.js` → login & lock screen.
- `apps1.js` → calculator, paint · `games.js` → mini games · `report.js` → pentest report generator · `mobile.js` → mobile mode · `tools.js` → toolbox, DNS lab, vault · `live.js` → globe, task manager, radio, BeneBot.
- `wallpaper.js` → background engine · `sounds.js` → sound effects · `sw.js` → service worker.

Run locally: open `index.html`, or `npx serve .`

## Deploy (Netlify)

`netlify.toml` configures everything: publish directory, security headers (CSP, HSTS, X-Frame-Options, …) and a build step
(`scripts/update-repos.mjs`) that refreshes the offline repo snapshot on every deploy.

**Auto-deploy via GitHub Actions** (`.github/workflows/deploy.yml`): deploys on every push to `main` and once a day.
Add two repository secrets: `NETLIFY_SITE_ID` and `NETLIFY_AUTH_TOKEN` (Netlify → User settings → Applications → Personal access tokens).
Without them the workflow skips the deploy and stays green.

## Security notes

- Strict Content-Security-Policy; external connections are limited to `api.github.com` and (DNS Lab only) `cloudflare-dns.com`.
- All GitHub data is escaped before rendering; README text is inserted as plain text.
- Everything in the Security Lab runs locally in the browser; only the DNS Lab sends the queried domain to Cloudflare. The `nmap`, `ping`, `hack` commands and the threat feed/globe are simulations – nothing is scanned.

## License

[MIT](LICENSE) © Benedikt Pankratz
