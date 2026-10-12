# BeneOS

> A cyber-themed operating system that runs entirely in your browser – the portfolio of **Benedikt Pankratz**, Junior Cybersecurity Consultant (eWPTX).

**Live:** https://beneos.netlify.app

![BeneOS desktop](og-image.png)

## Features

**Desktop & Shell**
- Window manager with drag, resize, minimize, maximize, **edge snapping** (left / right / top), close animations, taskbar dock and start menu with **search** (`Ctrl+K`).
- **Login & lock screen** with account tiles, animated auth sequence, failed-attempt lockout and a big clock.
- **Control Center** (quick settings, volume, wallpapers, color schemes), **notification history**, **calendar**, context menu, desktop **widgets** (clock, live GitHub stats), screensaver after 2 minutes idle.
- **5 live wallpapers**: Matrix, Synthwave grid, starfield, aurora, off – each with its own frame-rate cap and resolution.
- Retro-style **sounds**, fully synthesized with the Web Audio API (no audio files).
- Installable **PWA** with offline fallback.

**Portfolio**
- **Every public GitHub repo is an app** – loaded live from the GitHub API, with an offline snapshot as fallback. Security repos are highlighted.
- Profile with tabs (profile, highlights, tech stack), certificates (eWPTX), file explorer, achievements.

**Security Lab**
- Cipher Lab (encode / decode / hash), Password Lab (entropy & crack-time estimate), Hash Breaker (wordlist, mutation and brute-force attacks), Log Hunter (find the attacker in SSH logs), Packet Defender (arcade firewall), Phish or Legit? (quiz).
- **Mini CTF** with 8 flags hidden across the OS (login screen, terminal, file system, DevTools console, …).
- Terminal with `nmap` (simulated), `ls`, `cat`, `repos`, `theme`, `wallpaper`, `lock`.

**Performance**
- Background pauses when the tab is hidden, a window covers the screen, or the screensaver runs.
- Performance mode (no blur, no animations) – switched on automatically when the frame rate is low.
- No framework, no build step, no tracking, no cookies.

## Customize

- `os.js` → `PROFILE` block at the top: name, bio, skills, certificates (date / credential ID / verify link), live projects, links.
- `lab.js`, `lab2.js` → Security Lab apps, achievements and file explorer.
- `shell.js` → control center, widgets, screensaver, shortcuts · `login.js` → login & lock screen.
- `wallpaper.js` → background engine · `sounds.js` → sound effects · `sw.js` → service worker.

Run locally: open `index.html`, or `npx serve .`

## Deploy (Netlify)

`netlify.toml` configures everything: publish directory, security headers (CSP, HSTS, X-Frame-Options, …) and a build step
(`scripts/update-repos.mjs`) that refreshes the offline repo snapshot on every deploy.

**Auto-deploy via GitHub Actions** (`.github/workflows/deploy.yml`): deploys on every push to `main` and once a day.
Add two repository secrets: `NETLIFY_SITE_ID` and `NETLIFY_AUTH_TOKEN` (Netlify → User settings → Applications → Personal access tokens).
Without them the workflow skips the deploy and stays green.

## Security notes

- Strict Content-Security-Policy; the only external connection is `api.github.com`.
- All GitHub data is escaped before rendering; README text is inserted as plain text.
- Everything in the Security Lab runs locally in the browser. Nothing is sent anywhere, and the `nmap` command is a simulation.

## License

[MIT](LICENSE) © Benedikt Pankratz
