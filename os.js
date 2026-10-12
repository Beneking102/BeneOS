"use strict";

/* ====== HIER ANPASSEN ====== */
const PROFILE = {
  user: "Beneking102",                       // GitHub-User: alle öffentlichen Repos werden automatisch Apps
  name: "Benedikt Pankratz",
  tagline: "Junior Cybersecurity Consultant · Full-Stack Developer",
  location: "Bayern, Deutschland",
  bio: "Ich komme aus der Entwicklung und mache jetzt Cybersecurity: Schwachstellen finden, Supply-Chain absichern, Web-Apps auf Herz und Nieren testen. Dieses OS läuft komplett im Browser. Jede App auf dem Desktop ist eines meiner öffentlichen GitHub-Repos – automatisch live geladen.",
  skills: [                                  // Fokus-Bereiche, Prozente nach Gefühl anpassen
    ["Web-App-Pentesting", 75],
    ["Vulnerability / CVE-Analyse", 70],
    ["Supply-Chain Security", 65],
    ["Threat Modeling (STRIDE)", 55],
    ["TypeScript / Python", 75],
  ],
  // Zertifikate: leere Felder (date, id, verify) werden einfach nicht angezeigt
  certs: [
    {
      short: "eWPTX",
      name: "eLearnSecurity Web application Penetration Tester eXtreme",
      issuer: "INE Security",
      date: "",       // z. B. "Mai 2026"
      id: "",         // Credential-ID
      verify: "",     // Verifizierungs-Link (https://…)
      note: "Praxisorientierte Zertifizierung für fortgeschrittenes Penetration Testing von Webanwendungen.",
      topics: ["Advanced XSS", "SQL Injection", "XXE", "SSRF", "Deserialisierung", "WAF-/Filter-Bypass", "API-Security"],
    },
  ],
  highlights: [                              // Spotlight-Projekte (Texte aus meinem GitHub-Profil)
    { name: "bene-guard", desc: "VS-Code-Extension als Echtzeit-Security-Assistent: scannt npm-Abhängigkeiten per OSV auf CVEs, prüft Security-Header (Next.js, Vercel, Netlify, Helmet), erzeugt STRIDE-Threat-Models und bewertet Projekte von A+ bis F.", tags: ["TypeScript", "VS Code API", "OSV", "OWASP", "STRIDE"], url: "https://bene-guard-showcase.vercel.app" },
    { name: "bene-npm-scanner", desc: "NPM-Dependency-CVE-Scanner: package.json einfügen und einen vollständigen Schwachstellenbericht über OSV.dev erhalten. Kein Login, keine Speicherung, kein Tracking.", tags: ["Next.js", "TypeScript", "OSV.dev"], url: "https://bene-npm-scanner.vercel.app" },
    { name: "Benedictum", desc: "Eine lateinische Esoterik-Programmiersprache, deren Quelltext wie ein Gebet klingt. 14 Befehle, Turing-vollständig, in C99 geschrieben – mit Tape-Debugger, Tokenizer und Python-Interpreter.", tags: ["C99", "Esolang", "MIT"], url: "https://esolangs.org/wiki/Benedictum" },
    { name: "bene-ui", desc: "Security-themed React-Komponentenbibliothek für Dashboards, Scanner und Threat-Visualisierung.", tags: ["React", "UI", "npm"], url: "https://bene-ui.vercel.app" },
    { name: "bene-design-fonts", desc: "Zwei selbst gebaute Schriften: BeneHack (eckig, kondensiert, cyber) und BeneComic (verspielt). Mit Tailwind-Plugin und React-Komponente.", tags: ["fonttools", "React", "Tailwind"], url: "https://bene-design-font-preview.vercel.app" },
    { name: "ChromaForge", desc: "Design-Plattform für Farbpaletten und Themes mit Farbtheorie-Tools und Palette-Generator.", tags: ["Color Theory", "UI/UX"], url: "https://chromaforge.netlify.app" },
    { name: "DesignTool Hub", desc: "Die Anlaufstelle für den Start neuer Projekte: die besten Design-Ressourcen an einem Ort.", tags: ["Web Design", "Ressourcen"], url: "https://designtool.dev" },
    { name: "bene-anti-boredom-space", desc: "In Arbeit: drei Browser-Games im Turborepo – DRIFT (Physik-Puzzle), GHOST.SH (Terminal-Hacker-Ermittlung) und GRIDLOCK (Live-Verkehrssteuerung mit OSM).", tags: ["Turborepo", "Canvas 2D", "TypeScript"], url: "https://github.com/Beneking102/bene-anti-boredom-space" },
  ],
  stack: {
    "Frontend": ["React", "Next.js", "TypeScript", "Tailwind CSS", "Motion"],
    "Backend & API": ["Node.js", "Python", "FastAPI", "GraphQL", "Express"],
    "DevOps & Cloud": ["Docker", "GitHub Actions", "AWS", "Kubernetes", "Firebase", "Netlify", "Vercel"],
    "Security": ["OSV / CVE-Analyse", "OWASP", "STRIDE", "Web-App-Pentesting", "Supply-Chain Security"],
  },
  live: [                                    // Live-Projekte (außerhalb von GitHub-Repos)
    { name: "bene-guard", desc: "VS-Code-Extension: CVE-Scan, Header-Lint, STRIDE", url: "https://bene-guard-showcase.vercel.app" },
    { name: "ChromaForge", desc: "Farbpaletten & Themes", url: "https://chromaforge.netlify.app" },
    { name: "DesignTool Hub", desc: "Design-Ressourcen für neue Projekte", url: "https://designtool.dev" },
    { name: "bene-ui", desc: "Security-Themed React-Komponenten", url: "https://bene-ui.vercel.app" },
  ],
  links: [
    { label: "⌘ GitHub", url: "https://github.com/Beneking102" },
    { label: "in LinkedIn", url: "https://www.linkedin.com/in/benedikt-pankratz-a6694b360/" },
    { label: "🌐 Website", url: "https://benedikt-pkr.info" },
    { label: "🧩 bene-guard (Open VSX)", url: "https://open-vsx.org/extension/beneking102/bene-guard" },
    { label: "📦 npm: @bene-npm/shield-ui", url: "https://www.npmjs.com/package/@bene-npm/shield-ui" },
  ],
};
const session = { user: "guest" };
/* =========================== */

const $ = (s, r = document) => r.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem("beneos." + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("beneos." + k, JSON.stringify(v)); } catch { /* ignorieren */ } },
};

/* ---------- Einstellungen ---------- */
const THEME_NAMES = {
  cyan: ["#00f0ff", "#ff2bd6"], pink: ["#ff2bd6", "#00f0ff"], green: ["#39ff88", "#00f0ff"], orange: ["#ff9f1a", "#ff2bd6"],
  purple: ["#a66bff", "#00f0ff"], red: ["#ff3b5c", "#ffb020"], gold: ["#ffd23c", "#ff2bd6"], ice: ["#7dffcf", "#7aa2ff"],
};
const THEMES = Object.values(THEME_NAMES);
const saved = store.get("settings", {});
const settings = Object.assign({ accent: "#00f0ff", accent2: "#ff2bd6", wallpaper: "matrix", crt: false, sound: true, volume: .5, lite: false }, saved);
if (saved.matrix === false && !saved.wallpaper) settings.wallpaper = "off";
const smallScreen = matchMedia("(max-width: 760px)").matches, weak = (navigator.deviceMemory && navigator.deviceMemory <= 4) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
if (!saved.wallpaper && (smallScreen || matchMedia("(prefers-reduced-motion: reduce)").matches)) settings.wallpaper = "aurora";
if (saved.lite === undefined && smallScreen && weak) settings.lite = true;
delete settings.matrix;
// Gespeicherte Werte nie blind vertrauen
const HEX = /^#[0-9a-f]{6}$/i;
if (!HEX.test(settings.accent)) settings.accent = "#00f0ff";
if (!HEX.test(settings.accent2)) settings.accent2 = "#ff2bd6";
if (!Wallpaper.modes.includes(settings.wallpaper)) settings.wallpaper = "matrix";
settings.volume = Math.min(1, Math.max(0, Number(settings.volume) || 0));
settings.lite = !!settings.lite; settings.crt = !!settings.crt; settings.sound = settings.sound !== false;
function applySettings() {
  const r = document.documentElement.style;
  r.setProperty("--accent", settings.accent);
  r.setProperty("--accent2", settings.accent2);
  document.body.classList.toggle("crt", settings.crt);
  document.body.classList.toggle("lite", settings.lite);
  Wallpaper.set(settings.wallpaper, settings.accent, settings.accent2);
  SFX.set(settings.sound, settings.volume);
  store.set("settings", settings);
}

/* ---------- Fenster-Manager ---------- */
const winLayer = $("#windows"), tasks = $("#tasks");
const open = {};            // id -> {win, btn, cleanup}
let zTop = 10, cascade = 0, CUR_WS = 1;   // CUR_WS: aktiver virtueller Desktop

// Wenn ein maximiertes Fenster alles verdeckt, muss der Hintergrund nicht rendern
function updateOcclusion() {
  const mob = document.body.classList.contains("mobile");
  Wallpaper.pause(Object.values(open).some(e => (mob || e.win.classList.contains("max")) && !e.win.classList.contains("hidden") && !e.win.classList.contains("ws-off")));
}

function focusWin(id) {
  Object.entries(open).forEach(([k, w]) => {
    w.win.classList.toggle("active", k === id);
    w.btn.classList.toggle("active", k === id);
  });
  if (open[id]) open[id].win.style.zIndex = ++zTop;
}

function openApp(id) {
  closeStart();
  if (!APPS[id]) return;
  if (open[id]) {                      // schon offen: auf den aktuellen Desktop holen
    const e = open[id];
    e.win.dataset.ws = CUR_WS; e.btn.dataset.ws = CUR_WS; e.btn.hidden = false;
    e.win.classList.remove("hidden", "ws-off");
    focusWin(id); updateOcclusion();
    return;
  }
  const app = APPS[id];
  const win = el("section", "win");
  const w = Math.min(app.w, innerWidth - 20), h = Math.min(app.h, innerHeight - 64);
  const off = (cascade++ % 6) * 26;
  win.style.cssText = `width:${w}px;height:${h}px;left:${Math.max(0, (innerWidth - w) / 2 - 80 + off)}px;top:${Math.max(0, (innerHeight - 44 - h) / 2 - 40 + off)}px`;
  win.innerHTML = `<div class="titlebar"><span class="tb-ico">${iconHTML(id)}</span><b>${esc(app.title)}</b><button class="mn" title="Minimieren">—</button><button class="mx" title="Maximieren">▢</button><button class="x" title="Schließen">✕</button></div><div class="wbody"></div>`;
  winLayer.append(win);

  const btn = el("button", "task", `${iconHTML(id)}<span></span>`);
  $("span", btn).textContent = app.title;
  win.dataset.ws = CUR_WS; btn.dataset.ws = CUR_WS;
  tasks.append(btn);
  const entry = { win, btn, cleanup: null };
  open[id] = entry;
  sfx("open");
  if (id === "terminal") achieve("term"); else if (id === "certs") achieve("cert"); else if (id.startsWith("repo:")) achieve("repo");
  entry.cleanup = app.render($(".wbody", win), win) || null;

  const bar = $(".titlebar", win);
  const setHidden = h => { win.classList.toggle("hidden", h); if (h) btn.classList.remove("active"); updateOcclusion(); };
  $(".mn", win).onclick = () => { sfx("minimize"); setHidden(true); };
  $(".mx", win).onclick = () => {
    if (!win.classList.contains("max")) win._rect = { w: win.offsetWidth, h: win.offsetHeight };
    win.classList.toggle("max"); delete win.dataset.snap; sfx("maximize"); updateOcclusion();
  };
  $(".x", win).onclick = () => closeApp(id);
  bar.ondblclick = e => { if (e.target === bar || e.target.tagName === "B") $(".mx", win).onclick(); };
  win.addEventListener("pointerdown", () => focusWin(id));
  btn.onclick = () => {
    if (win.classList.contains("hidden")) { setHidden(false); focusWin(id); }
    else if (win.classList.contains("active")) setHidden(true);
    else focusWin(id);
  };

  // Verschieben mit Snapping: Rand links/rechts = halbe Breite, oben = maximieren
  bar.addEventListener("pointerdown", e => {
    if (e.target.closest("button") || e.button !== 0 || document.body.classList.contains("mobile")) return;
    const snapEl = $("#snap"), dock = 64;
    let dx = e.clientX - win.offsetLeft, dy = e.clientY - win.offsetTop, zone = null, started = false, raf = 0, last = e;
    try { bar.setPointerCapture(e.pointerId); } catch { /* synthetische Events */ }
    const rects = { max: [0, 0, innerWidth, innerHeight - dock], left: [0, 0, innerWidth / 2, innerHeight - dock], right: [innerWidth / 2, 0, innerWidth / 2, innerHeight - dock] };
    const zoneOf = ev => (ev.clientY <= 6 ? "max" : ev.clientX <= 6 ? "left" : ev.clientX >= innerWidth - 7 ? "right" : null);
    const showZone = () => {
      if (zone) { const [l, t, w, h] = rects[zone]; Object.assign(snapEl.style, { left: l + "px", top: t + "px", width: w + "px", height: h + "px" }); snapEl.hidden = false; }
      else snapEl.hidden = true;
    };
    const frame = () => {
      raf = 0;
      win.style.left = Math.min(Math.max(last.clientX - dx, -win.offsetWidth + 80), innerWidth - 80) + "px";
      win.style.top = Math.min(Math.max(last.clientY - dy, 0), innerHeight - 110) + "px";
    };
    const move = ev => {
      last = ev;
      if (!started) {
        if (Math.abs(ev.clientX - e.clientX) + Math.abs(ev.clientY - e.clientY) < 4) return;
        started = true;
        if (win.classList.contains("max") || win.dataset.snap) {   // aus Snap/Maximiert herausziehen
          const r = win._rect || { w: Math.min(app.w, innerWidth - 20), h: Math.min(app.h, innerHeight - 80) };
          win.classList.remove("max"); delete win.dataset.snap;
          win.style.width = r.w + "px"; win.style.height = r.h + "px";
          dx = r.w / 2; dy = 18; updateOcclusion();
        }
        win.classList.add("dragging");
      }
      zone = zoneOf(ev); showZone();
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const up = ev => {
      bar.removeEventListener("pointermove", move); bar.removeEventListener("pointerup", up); bar.removeEventListener("pointercancel", up);
      cancelAnimationFrame(raf); snapEl.hidden = true;
      if (!started) return;
      if (ev && ev.clientX !== undefined) zone = zoneOf(ev);
      win.classList.remove("dragging");
      if (zone) {
        win._rect = { w: win.offsetWidth, h: win.offsetHeight };
        if (zone === "max") win.classList.add("max");
        else { const [l, t, w, h] = rects[zone]; Object.assign(win.style, { left: l + "px", top: t + "px", width: w + "px", height: h + "px" }); win.dataset.snap = zone; }
        sfx("maximize"); updateOcclusion(); achieve("snap");
      }
    };
    bar.addEventListener("pointermove", move); bar.addEventListener("pointerup", up); bar.addEventListener("pointercancel", up);
  });
  focusWin(id);
}

function closeApp(id) {
  const e = open[id];
  if (!e) return;
  sfx("close");
  if (e.cleanup) e.cleanup();
  delete open[id];
  e.btn.remove();
  e.win.classList.add("closing");
  setTimeout(() => e.win.remove(), 140);
  const last = Object.keys(open).filter(k => open[k].win.dataset.ws == CUR_WS).pop();
  if (last) focusWin(last);
  updateOcclusion();
}

/* ---------- Repos (live von GitHub) ---------- */
let REPOS = [], repoSource = "lädt…";
const SEC_RE = /secur|cve|vuln|audit|exploit|owasp|devsecops|pentest/i;
const isSec = r => SEC_RE.test(r.name + " " + (r.topics || []).join(" "));
const safeUrl = u => (/^https?:\/\//i.test((u || "").trim()) ? u.trim() : "");
function repoIcon(r) {
  const t = (r.topics || []).join(" ") + " " + r.name;
  if (isSec(r)) return "🛡️";
  if (/blender|3d|procgen/i.test(t)) return "🧊";
  if (/esolang|language/i.test(t)) return "📜";
  if (/font|design|ui/i.test(t)) return "🎨";
  if (/portfolio|landing|website/i.test(t)) return "🌐";
  if (r.language === "Lua") return "🎮";
  if (/Kotlin|Java$/.test(r.language || "")) return "📱";
  if (r.language === "C#") return "💠";
  return "📦";
}
const cleanReadme = t => t
  .replace(/<[^>]+>/g, "").replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
  .replace(/^#+\s*/gm, "").replace(/\n{3,}/g, "\n\n").trim().slice(0, 3000);

function repoApp(r) {
  return {
    title: r.name, icon: repoIcon(r), group: isSec(r) ? "Security Repos" : "Dev Repos", sec: isSec(r), w: 580, h: 480,
    render(body) {
      const demo = safeUrl(r.homepage);
      body.innerHTML = `<div class="pad"><h1 class="h-ico">${iconByEmoji(repoIcon(r))} ${esc(r.name)}</h1>
        <div class="dim">${esc(r.language || "–")} · ★ ${r.stargazers_count} · zuletzt aktualisiert ${esc((r.pushed_at || "").slice(0, 10))}</div>
        <p>${esc(r.description || "Keine Beschreibung.")}</p>
        <div>${(r.topics || []).map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div>
        <div class="links" style="grid-auto-flow:column;margin-top:12px"><a href="${esc(safeUrl(r.html_url) || "https://github.com/" + PROFILE.user)}" target="_blank" rel="noopener noreferrer">⌘ Auf GitHub ansehen</a>${demo ? `<a href="${esc(demo)}" target="_blank" rel="noopener">▶ Live-Demo</a>` : ""}</div>
        <h2>README</h2><pre class="readme">Lade…</pre></div>`;
      const pre = $(".readme", body), key = "readme:" + r.name;
      let cached = null; try { cached = sessionStorage.getItem(key); } catch { /* egal */ }
      if (cached != null) { pre.textContent = cached; return; }
      fetch(`https://api.github.com/repos/${PROFILE.user}/${r.name}/readme`, { headers: { Accept: "application/vnd.github.raw" } })
        .then(res => { if (!res.ok) throw 0; return res.text(); })
        .then(t => { const c = cleanReadme(t) || "(README ist leer)"; pre.textContent = c; try { sessionStorage.setItem(key, c); } catch { /* egal */ } })
        .catch(() => { pre.textContent = "(Kein README gefunden oder GitHub-API-Limit erreicht – schau direkt auf GitHub.)"; });
    },
  };
}

/* ---------- Apps ---------- */
const APPS = {
  about: {
    title: "Über mich", icon: "👤", w: 600, h: 560,
    render(body) {
      const tabs = { profil: "Profil", highlights: "Highlights", stack: "Tech-Stack" };
      const views = {
        profil: () => `<div class="about"><div class="avatar">${esc(PROFILE.name[0])}</div>
          <div style="flex:1;min-width:200px"><h1>${esc(PROFILE.name)}</h1><div class="dim">${esc(PROFILE.tagline)}</div><div class="dim">📍 ${esc(PROFILE.location)}</div>
          <div style="margin-top:6px">${(PROFILE.certs || []).map(c => `<button class="tag" data-open="certs" style="cursor:pointer">🏅 ${esc(c.short)}</button>`).join("")}</div></div></div>
          <p>${esc(PROFILE.bio)}</p>
          <div class="opbar">${[["projects", "Repos"], ["certs", "Zertifikate"], ["ctf", "CTF"], ["terminal", "Terminal"], ["contact", "Kontakt"]].map(([id, t]) => `<button class="btn" data-open="${id}">${iconHTML(id)}${t}</button>`).join("")}</div>
          <h2>Skills</h2>${PROFILE.skills.map(([n, v]) => `<div>${esc(n)} <span class="dim">${v}%</span></div><div class="bar"><div style="width:${v}%"></div></div>`).join("")}`,
        highlights: () => `<div class="cards">${(PROFILE.highlights || []).map(h => `<div class="card"><h3>${esc(h.name)}</h3><p>${esc(h.desc)}</p>${h.tags.map(t => `<span class="tag">${esc(t)}</span>`).join("")}${safeUrl(h.url) ? `<div style="margin-top:8px"><a href="${esc(safeUrl(h.url))}" target="_blank" rel="noopener noreferrer">→ ansehen</a></div>` : ""}</div>`).join("")}</div>`,
        stack: () => Object.entries(PROFILE.stack || {}).map(([k, v]) => `<h2>${esc(k)}</h2><div>${v.map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div>`).join(""),
      };
      let cur = "profil";
      const draw = () => {
        body.innerHTML = `<div class="pad"><div class="tabs">${Object.entries(tabs).map(([k, t]) => `<button class="tab ${k === cur ? "on" : ""}" data-tab="${k}">${t}</button>`).join("")}</div>${views[cur]()}</div>`;
        body.querySelectorAll("[data-tab]").forEach(b => { b.onclick = () => { cur = b.dataset.tab; sfx("menu"); draw(); }; });
      };
      draw();
    },
  },
  projects: {
    title: "Repo Explorer", icon: "📁", w: 640, h: 460,
    render(body) {
      body.innerHTML = `<div class="pad"><h1>Repo Explorer</h1><div class="dim">${REPOS.length} öffentliche Repos von ${esc(PROFILE.user)} · ${repoSource}</div>
        <h2>Live-Projekte</h2><div class="cards">${(PROFILE.live || []).map(l => `<a class="card" href="${esc(safeUrl(l.url))}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit"><h3>🌐 ${esc(l.name)}</h3><p>${esc(l.desc)}</p></a>`).join("")}</div>
        <h2>GitHub-Repos</h2><div class="cards">${REPOS.map(r => `<button class="card ${isSec(r) ? "sec" : ""}" data-repo="${esc(r.name)}" style="text-align:left"><h3 class="h-ico">${iconByEmoji(repoIcon(r))} ${esc(r.name)}</h3>
        <p>${esc(r.description || "Keine Beschreibung")}</p>${r.language ? `<span class="tag">${esc(r.language)}</span>` : ""}${isSec(r) ? `<span class="tag">security</span>` : ""}</button>`).join("") || "<p class='dim'>Lade Repos…</p>"}</div></div>`;
      body.onclick = e => { const c = e.target.closest("[data-repo]"); if (c) openApp("repo:" + c.dataset.repo); };
    },
  },
  terminal: {
    title: "Terminal", icon: "⌨", w: 600, h: 400,
    render(body) {
      const term = el("div", "term");
      body.append(term);
      const out = line => { const d = el("div", "out", line); term.insertBefore(d, row); term.scrollTop = term.scrollHeight; };
      const row = el("div", "row", `<span class="ps">${session.user}@beneos:~$</span><input spellcheck="false" autocomplete="off" aria-label="Befehl">`);
      term.append(row);
      const input = $("input", row);
      const hist = []; let hi = 0;
      const cmds = {
        help: () => "Befehle: <span class='hi'>help about certs repos skills links neofetch nmap &lt;host&gt; ls cat open &lt;app|repo&gt; theme &lt;farbe&gt; wallpaper &lt;name&gt; lock clear</span>",
        about: () => esc(PROFILE.bio),
        whoami: () => session.user === "guest" ? "guest (du bist hier nur zu Besuch 👀)" : session.user,
        repos: () => REPOS.map(r => `<span class="hi">${esc(r.name).padEnd(26)}</span>${esc(r.language || "-").padEnd(12)}${esc((r.description || "").slice(0, 60))}`).join("\n") || "Repos laden noch…",
        projects: () => cmds.repos(),
        certs: () => (PROFILE.certs || []).map(c => `<span class="hi">${esc(c.short)}</span> – ${esc(c.name)} (${esc(c.issuer)})`).join("\n"),
        links: () => cmds.contact(),
        nc: () => "<span class='ok'>Verbunden mit localhost:1337 …</span>\nBENE{1337_p0rt_0p3n}  ← Flag für die CTF-App",
        ls: () => "flag.txt  notes.md  <span class='hi'>repos/</span>",
        cat: a => a === "flag.txt" ? "<span class='ok'>BENE{cat_fl4g_txt}</span>  ← trag das in der CTF-App ein" : a === "notes.md" ? "TODO: mehr Bugs finden, weniger Kaffee trinken." : `<span class="err">cat: ${esc(a || "")}: Datei nicht gefunden</span>`,
        nmap: a => {
          const host = esc(a || "beneos.local");
          const lines = [`Starting Nmap 7.9X ( simuliert ) – Ziel: ${host}`, "Host is up (0.00042s latency).", "PORT      STATE   SERVICE", "22/tcp    closed  ssh", "80/tcp    <span class='ok'>open</span>    http", "443/tcp   <span class='ok'>open</span>    https   ← dieses Portfolio", "1337/tcp  <span class='ok'>open</span>    elite   ← neugierig, hm?", "<span class='dim'>Alles nur Show: es wird nichts gescannt.</span>"];
          lines.forEach((l, n) => setTimeout(() => out(l), 350 * (n + 1)));
          return null;
        },
        skills: () => PROFILE.skills.map(([n, v]) => `${esc(n).padEnd(18)} ${"█".repeat(v / 5)}${"░".repeat(20 - v / 5)} ${v}%`).join("\n"),
        contact: () => PROFILE.links.map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join("\n"),
        date: () => new Date().toLocaleString("de-DE"),
        neofetch: () => `<span class="hi">    ____  ______  ______
   / __ )/ ____/ / ____/   ${session.user}@beneos
  / __  / __/   / /        ---------------
 / /_/ / /___  / /___      OS: BeneOS 2.0 (Browser)
/_____/_____/  \\____/      Focus: Cybersecurity
                           Shell: beneosh
                           Apps: ${Object.keys(APPS).length} (${REPOS.length} Repos)
                           Browser: ${esc(navigator.userAgent.split(" ").pop())}</span>`,
        clear: () => { [...term.querySelectorAll(".out")].forEach(n => n.remove()); return null; },
        wallpaper: a => {
          if (!Wallpaper.modes.includes(a)) return `<span class="err">Hintergründe: ${Wallpaper.modes.join(", ")}</span>`;
          settings.wallpaper = a; applySettings(); achieve("wallpaper");
          return `<span class="ok">Hintergrund: ${Wallpaper.labels[a]}</span>`;
        },
        matrix: () => cmds.wallpaper(settings.wallpaper === "matrix" ? "off" : "matrix"),
        lock: () => { lockScreen(); return null; },
        open: a => {
          const id = Object.keys(APPS).find(k => k.toLowerCase() === a || k.toLowerCase() === "repo:" + a);
          if (id) { openApp(id); return `<span class="ok">öffne ${esc(id.replace("repo:", ""))}…</span>`; }
          return `<span class="err">Unbekannte App. Verfügbar: ${Object.keys(APPS).map(k => k.replace("repo:", "")).join(", ")}</span>`;
        },
        theme: a => {
          const map = THEME_NAMES;
          if (!map[a]) return `<span class="err">Farben: ${Object.keys(map).join(", ")}</span>`;
          [settings.accent, settings.accent2] = map[a]; applySettings(); achieve("theme"); return `<span class="ok">Theme: ${a}</span>`;
        },
        sudo: () => "<span class='err'>Netter Versuch. 😉</span>",
        exit: () => { closeApp("terminal"); return null; },
      };
      Object.assign(cmds, window.TERM_CMDS || {});
      out(`<span class="hi">BeneOS Terminal</span> – tippe <span class="hi">help</span> für alle Befehle (Tab vervollständigt).\n`);
      const complete = () => {
        const parts = input.value.split(/\s+/), v = parts[0].toLowerCase();
        if (parts.length === 1) {
          const m = Object.keys(cmds).filter(k => k.startsWith(v));
          if (m.length === 1) input.value = m[0] + " "; else if (m.length > 1) out(`<span class="dim">${m.join("  ")}</span>`);
        } else if (v === "open" || v === "kill") {
          const p = parts[1].toLowerCase(), m = Object.keys(APPS).map(k => k.replace("repo:", "")).filter(k => k.toLowerCase().startsWith(p));
          if (m.length === 1) input.value = parts[0] + " " + m[0].toLowerCase(); else if (m.length > 1) out(`<span class="dim">${m.map(esc).join("  ")}</span>`);
        }
      };
      input.addEventListener("keydown", e => {
        if (e.key === "Tab") { e.preventDefault(); complete(); }
        else if (e.key === "ArrowUp") { hi = Math.max(0, hi - 1); input.value = hist[hi] || ""; e.preventDefault(); }
        else if (e.key === "ArrowDown") { hi = Math.min(hist.length, hi + 1); input.value = hist[hi] || ""; e.preventDefault(); }
        else if (e.key === "Enter") {
          const raw = input.value.trim(); input.value = "";
          if (!raw) return;
          hist.push(raw); hi = hist.length;
          out(`<span class="ps">${session.user}@beneos:~$</span> ${esc(raw)}`);
          const [c, ...args] = raw.split(/\s+/);
          const fn = Object.hasOwn(cmds, c.toLowerCase()) ? cmds[c.toLowerCase()] : null;
          const res = fn ? fn(args[0]?.toLowerCase(), args, { out, hist, term, raw }) : `<span class="err">${esc(c)}: Befehl nicht gefunden</span>`;
          if (res && typeof res.then === "function") res.then(r => { if (r != null) out(r); }).catch(err => out(`<span class="err">Fehler: ${esc(err.message || "Netzwerk")}</span>`));
          else if (res != null) out(res);
        }
      });
      input.addEventListener("input", () => sfx("type"));
      const tk = el("div", "tkeys", `<button data-k="tab">Tab</button><button data-k="up">↑</button><button data-k="down">↓</button><button data-k="help">help</button><button data-k="clear">clear</button>`);
      row.after(tk);
      tk.onclick = e => {
        const k = e.target.closest("[data-k]")?.dataset.k; if (!k) return;
        if (k === "tab") complete();
        else if (k === "up" || k === "down") { hi = k === "up" ? Math.max(0, hi - 1) : Math.min(hist.length, hi + 1); input.value = hist[hi] || ""; }
        else { input.value = k; input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" })); }
        input.focus();
      };
      term.addEventListener("click", () => { if (!getSelection().toString()) input.focus(); });
      setTimeout(() => input.focus(), 0);
    },
  },
  notes: {
    title: "Notizen", icon: "📝", w: 420, h: 340,
    render(body) {
      const ta = el("textarea", "notes");
      ta.placeholder = "Schreib was... (wird im Browser gespeichert)";
      ta.value = store.get("notes", "");
      ta.oninput = () => store.set("notes", ta.value);
      body.append(ta);
    },
  },
  contact: {
    title: "Kontakt", icon: "✉", w: 380, h: 320,
    render(body) {
      body.innerHTML = `<div class="pad"><h1>Kontakt</h1><p class="dim">Lass uns connecten:</p><div class="links">${PROFILE.links.map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join("")}</div></div>`;
    },
  },
  cipher: {
    title: "Cipher Lab", icon: "🔐", w: 560, h: 480,
    render(body) {
      body.innerHTML = `<div class="pad"><h1>Cipher Lab</h1><div class="dim">Encoder, Decoder, Hashes – alles lokal in deinem Browser.</div>
        <textarea class="field" id="ci" rows="5" placeholder="Eingabe…" spellcheck="false"></textarea>
        <div class="opbar"></div>
        <textarea class="field" id="co" rows="5" placeholder="Ausgabe" readonly></textarea></div>`;
      const bytes = s => new TextEncoder().encode(s);
      const hex = u8 => Array.from(u8, b => b.toString(16).padStart(2, "0")).join("");
      const hash = algo => async s => hex(new Uint8Array(await crypto.subtle.digest(algo, bytes(s))));
      const ops = {
        "Base64 ▶": s => btoa(Array.from(bytes(s), b => String.fromCharCode(b)).join("")),
        "◀ Base64": s => new TextDecoder().decode(Uint8Array.from(atob(s.trim()), c => c.charCodeAt(0))),
        "Hex ▶": s => hex(bytes(s)),
        "◀ Hex": s => new TextDecoder().decode(Uint8Array.from(s.replace(/\s/g, "").match(/../g) || [], h => parseInt(h, 16))),
        "ROT13": s => s.replace(/[a-z]/gi, c => String.fromCharCode((c <= "Z" ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26)),
        "URL ▶": s => encodeURIComponent(s),
        "◀ URL": s => decodeURIComponent(s),
        "Reverse": s => Array.from(s).reverse().join(""),
        "SHA-1": hash("SHA-1"),
        "SHA-256": hash("SHA-256"),
        "SHA-512": hash("SHA-512"),
      };
      const inp = $("#ci", body), outp = $("#co", body), bar = $(".opbar", body);
      Object.entries(ops).forEach(([name, fn]) => {
        const b = el("button", "btn", name);
        b.onclick = async () => {
          try { outp.value = await fn(inp.value); outp.style.color = ""; }
          catch { outp.value = "Fehler: Eingabe passt nicht zu dieser Operation."; outp.style.color = "#ff5470"; }
        };
        bar.append(b);
      });
    },
  },
  passlab: {
    title: "Password Lab", icon: "🔑", w: 460, h: 460,
    render(body) {
      body.innerHTML = `<div class="pad"><h1>Password Lab</h1><div class="dim">Wie schnell wäre dein Passwort offline geknackt? Die Eingabe verlässt diesen Tab nie.</div>
        <input class="field" id="pw" type="password" placeholder="Passwort testen…" autocomplete="off" spellcheck="false" style="margin-top:12px">
        <label class="chk"><input type="checkbox" id="show"> anzeigen</label>
        <div class="bar" style="height:12px"><div id="meter" style="width:0"></div></div>
        <div id="verdict" style="font-size:18px;font-weight:700"></div><div id="detail" class="dim"></div><ul id="tips"></ul></div>`;
      const COMMON = ["password", "passwort", "123456", "qwerty", "qwertz", "letmein", "admin", "welcome", "iloveyou", "dragon", "monkey", "hallo", "abc123", "football", "master", "login"];
      const human = s => {
        if (s < 1) return "sofort";
        const u = [[60, "Sekunden"], [60, "Minuten"], [24, "Stunden"], [365, "Tage"], [100, "Jahre"], [10, "Jahrhunderte"], [Infinity, "Jahrtausende"]];
        let v = s, i = 0;
        for (; i < u.length - 1 && v >= u[i][0]; i++) v /= u[i][0];
        return v > 1e6 ? "länger als das Universum alt ist" : `${v < 10 ? v.toFixed(1) : Math.round(v).toLocaleString("de-DE")} ${u[i][1]}`;
      };
      const pw = $("#pw", body);
      $("#show", body).onchange = e => { pw.type = e.target.checked ? "text" : "password"; };
      pw.oninput = () => {
        const p = pw.value;
        const meter = $("#meter", body), verdict = $("#verdict", body), detail = $("#detail", body), tips = $("#tips", body);
        if (!p) { meter.style.width = 0; verdict.textContent = detail.textContent = tips.innerHTML = ""; return; }
        let pool = 0;
        if (/[a-z]/.test(p)) pool += 26;
        if (/[A-Z]/.test(p)) pool += 26;
        if (/\d/.test(p)) pool += 10;
        if (/[^\w]/.test(p)) pool += 33;
        if (/[^\x00-\x7f]/.test(p)) pool += 100;
        let bits = p.length * Math.log2(pool || 1);
        const base = p.toLowerCase().replace(/[^a-z]/g, "");
        const common = COMMON.some(c => p.toLowerCase().includes(c) || (base.length > 3 && c === base));
        if (common) bits = Math.min(bits, 20);
        if (/(.)\1{2,}/.test(p)) bits *= .8;
        if (/(0123|1234|2345|3456|abcd|qwer)/i.test(p)) bits *= .8;
        const secs = Math.pow(2, bits) / 2 / 1e10;   // 10 Mrd. Versuche/s (schneller Hash, GPU-Rig)
        const lvl = bits < 40 ? 0 : bits < 60 ? 1 : bits < 80 ? 2 : 3;
        const col = ["#ff5470", "#ff9f1a", "#e8e23c", "#39ff88"][lvl];
        meter.style.width = Math.min(100, bits / 90 * 100) + "%"; meter.style.background = col;
        verdict.style.color = col; verdict.textContent = ["Schwach", "Mittel", "Gut", "Stark"][lvl];
        detail.textContent = `~${Math.round(bits)} Bit Entropie · Offline-Crack bei 10 Mrd. Versuchen/s: ${human(secs)}${common ? " · enthält ein Standard-Passwort!" : ""}`;
        const t = [];
        if (p.length < 14) t.push("Mindestens 14 Zeichen nutzen.");
        if (pool < 62) t.push("Groß-/Kleinschreibung, Zahlen und Sonderzeichen mischen.");
        if (common) t.push("Wörterbuch-Begriffe sind das Erste, was Angreifer probieren.");
        t.push("Am besten: Passwort-Manager + lange Passphrase + 2FA.");
        tips.innerHTML = t.map(x => `<li>${x}</li>`).join("");
      };
    },
  },
  ctf: {
    title: "Mini CTF", icon: "🚩", w: 520, h: 480,
    render(body) {
      const C = [
        ["Warm-up", "Base64 ist keine Verschlüsselung.", () => btoa("BENE{b4se64_is_n0t_encrypti0n}"), "BENE{b4se64_is_n0t_encrypti0n}"],
        ["Cäsars Gruß", "Verschiebe jeden Buchstaben um 13.", () => "ORAR{e0g13_nyy_gu3_jnl}", "BENE{r0t13_all_th3_way}"],
        ["Hex Dump", "Jedes Byte als Hex. Der Cipher Lab hilft dir.", () => Array.from(new TextEncoder().encode("BENE{h3x_m4rks_the_sp0t}"), b => b.toString(16).padStart(2, "0")).join(" "), "BENE{h3x_m4rks_the_sp0t}"],
        ["Konsole", "Öffne die DevTools (F12). Beim Öffnen dieses Fensters passiert etwas.", () => "???", "BENE{c0ns0le_l0g_l34k}"],
        ["Das Terminal weiß mehr", "Schau dich im Terminal um: ls, cat …", () => "???", "BENE{cat_fl4g_txt}"],
        ["Default Credentials", "Am Login-Screen zählen die Klassiker. Melde dich ab (Startmenü → Herunterfahren) und probiere admin / ?", () => "???", "BENE{d3f4ult_cr3ds_f41l}"],
        ["Versteckte Dateien", "Im Datei-Explorer gibt es Dinge, die man erst sieht, wenn man danach fragt.", () => "???", "BENE{h1dd3n_f1l3s_r34l}"],
        ["Cheat-Code", "Manche Cheats sind älter als das Web. Probier sie auf dem Desktop (nicht im Textfeld).", () => "???", "BENE{k0n4m1_c0d3_unl0ck3d}"],
        ["Port 1337", "nmap im Terminal hat etwas verraten. Wie sprichst du mit einem offenen Port? (Tipp: nc)", () => "???", "BENE{1337_p0rt_0p3n}"],
      ];
      console.log("%c[BeneOS CTF] Gut gemacht, du schaust in die Konsole. Flag: BENE{c0ns0le_l0g_l34k}", "color:#00f0ff;font-weight:bold");
      const solved = new Set(store.get("ctf", []));
      const draw = () => {
        body.innerHTML = `<div class="pad"><h1>Mini CTF</h1><div class="dim">Finde die Flags im Format <code>BENE{...}</code> · Gelöst: <b>${solved.size}/${C.length}</b></div>
          ${C.map(([t, h, d], k) => `<div class="card" style="margin-top:10px;${solved.has(k) ? "border-color:#39ff88" : ""}"><h3>${solved.has(k) ? "✅" : "🚩"} ${k + 1}. ${esc(t)}</h3><p class="dim">${esc(h)}</p>
          <code class="blk">${esc(d())}</code><form data-k="${k}" style="display:flex;gap:6px;margin-top:8px"><input class="field" placeholder="BENE{...}" style="margin:0" ${solved.has(k) ? "disabled" : ""}><button class="btn" ${solved.has(k) ? "disabled" : ""}>Check</button></form></div>`).join("")}
          ${solved.size === C.length ? `<h2>🏆 Alle Flags gefunden – du bist ready für den Job.</h2>` : ""}</div>`;
        body.querySelectorAll("form").forEach(f => f.onsubmit = e => {
          e.preventDefault();
          const k = +f.dataset.k, v = $("input", f).value.trim();
          if (v === C[k][3]) { solved.add(k); achieve("flag1"); if (solved.size === C.length) achieve("allflags"); sfx("success"); store.set("ctf", [...solved]); draw(); }
          else { sfx("error"); $("input", f).style.borderColor = "#ff5470"; }
        });
      };
      draw();
    },
  },
  settings: {
    title: "Einstellungen", icon: "⚙", w: 460, h: 600,
    render(body) {
      const draw = () => {
        body.innerHTML = `<div class="pad"><h2 style="margin-top:0">Farbschema</h2><div class="swatches">${THEMES.map(([a, b]) => `<button class="sw ${a === settings.accent ? "on" : ""}" data-a="${a}" data-b="${b}" style="background:linear-gradient(135deg,${a} 50%,${b} 50%)" aria-label="Farbschema ${a}"></button>`).join("")}</div>
          <h2>Hintergrund</h2><div class="wps">${Wallpaper.modes.map(m => `<button class="wp ${m === settings.wallpaper ? "on" : ""}" data-wp="${m}"><i class="wp-${m}"></i>${Wallpaper.labels[m]}</button>`).join("")}</div>
          <h2>Effekte & Leistung</h2>
          <label class="chk"><input type="checkbox" id="s-crt"> CRT-Scanlines</label>
          <label class="chk"><input type="checkbox" id="s-lite"> Performance-Modus <span class="dim">(kein Blur, keine Animationen)</span></label>
          <h2>Sound</h2>
          <label class="chk"><input type="checkbox" id="s-snd"> Sounds aktiv</label>
          <label class="chk">Lautstärke <input type="range" id="s-vol" min="0" max="100" style="flex:1"><button class="btn" id="s-test">Test</button></label>
          <h2>System</h2><div class="opbar"><button class="btn" data-open="sysinfo">ℹ Über BeneOS</button><button class="btn" id="s-reset">Daten zurücksetzen</button></div></div>`;
        $("#s-crt", body).checked = settings.crt; $("#s-lite", body).checked = settings.lite;
        $("#s-snd", body).checked = settings.sound; $("#s-vol", body).value = Math.round(settings.volume * 100);
        $("#s-crt", body).onchange = e => { settings.crt = e.target.checked; applySettings(); };
        $("#s-lite", body).onchange = e => { settings.lite = e.target.checked; applySettings(); };
        $("#s-snd", body).onchange = e => { settings.sound = e.target.checked; applySettings(); sfx("notify"); };
        $("#s-vol", body).oninput = e => { settings.volume = e.target.value / 100; applySettings(); };
        $("#s-vol", body).onchange = () => sfx("notify");
        $("#s-test", body).onclick = () => sfx("startup");
        body.querySelectorAll(".sw").forEach(b => { b.onclick = () => { settings.accent = b.dataset.a; settings.accent2 = b.dataset.b; applySettings(); achieve("theme"); draw(); }; });
        body.querySelectorAll(".wp").forEach(b => { b.onclick = () => { settings.wallpaper = b.dataset.wp; applySettings(); achieve("wallpaper"); draw(); }; });
        $("#s-reset", body).onclick = () => { try { Object.keys(localStorage).filter(k => k.startsWith("beneos.")).forEach(k => localStorage.removeItem(k)); } catch { /* egal */ } location.reload(); };
      };
      draw();
    },
  },
};

Object.assign(APPS, window.EXTRA_APPS || {});
Object.entries({
  about: "System", projects: "System", terminal: "System", notes: "System", contact: "System", settings: "System",
  cipher: "Security Lab", passlab: "Security Lab", phish: "Security Lab", ctf: "Security Lab", snake: "Fun",
}).forEach(([k, g]) => { APPS[k].group = g; });
Object.values(APPS).forEach(a => { a.group ||= "System"; });

/* ---------- Desktop, Startmenü, Uhr ---------- */
const iconBox = $("#icons");
function addIcon(id) {
  const a = APPS[id];
  const b = el("button", "icon" + (a.sec ? " sec" : ""), `<i>${iconHTML(id)}</i><span></span>`);
  b.dataset.id = id; b.draggable = true;
  $("span", b).textContent = a.title;
  b.title = a.title;
  b.ondblclick = () => openApp(id);
  b.onkeydown = e => { if (e.key === "Enter") openApp(id); };
  b.onclick = e => { if (e.detail === 0 || matchMedia("(pointer:coarse)").matches || document.body.classList.contains("mobile")) openApp(id); };
  iconBox.append(b);
}
Object.keys(APPS).forEach(addIcon);

const start = $("#startmenu");
function buildStart() {
  const groups = {};
  Object.entries(APPS).forEach(([id, a]) => { (groups[a.group || "System"] ||= []).push(id); });
  const order = ["System", "Security Lab", "Tools", "Security Repos", "Dev Repos", "Fun"];
  start.innerHTML = `<header><div class="who"><span class="avatar sm">${esc(PROFILE.name[0])}</span><div><b>${esc(PROFILE.name)}</b><div class="dim">${esc(session.user)}@beneos</div></div></div>
    <input id="ssearch" class="field" placeholder="Apps &amp; Repos suchen …" autocomplete="off" spellcheck="false" aria-label="Suchen"></header>
    <div class="slist">` +
    order.filter(g => groups[g]).map(g => `<div class="grp">${g}</div>` + groups[g].map(id => `<button data-app="${esc(id)}"><span>${iconHTML(id)}</span><b></b></button>`).join("")).join("") +
    `<div class="dim" id="snone" hidden style="padding:12px 16px">Nichts gefunden.</div></div>
    <div class="sfoot"><button data-act="lock"><span>🔒</span>Sperren</button><button data-act="off"><span>⏻</span>Herunterfahren</button></div>`;
  start.querySelectorAll("[data-app]").forEach(b => { $("b", b).textContent = APPS[b.dataset.app].title; });
  const q = $("#ssearch", start);
  q.oninput = () => {
    const v = q.value.trim().toLowerCase(); let any = false;
    start.querySelectorAll("[data-app]").forEach(b => { const show = !v || b.textContent.toLowerCase().includes(v) || b.dataset.app.toLowerCase().includes(v); b.hidden = !show; any ||= show; });
    start.querySelectorAll(".grp").forEach(g => { let n = g.nextElementSibling, has = false; while (n && !n.classList.contains("grp")) { if (n.dataset.app && !n.hidden) has = true; n = n.nextElementSibling; } g.hidden = !has; });
    $("#snone", start).hidden = any;
  };
  q.onkeydown = e => { if (e.key === "Enter") { const b = start.querySelector("[data-app]:not([hidden])"); if (b) { openApp(b.dataset.app); achieve("search"); } } };
}
buildStart();
const closeStart = () => { start.hidden = true; };
function toggleStart(show) {
  start.hidden = show === undefined ? !start.hidden : !show;
  if (!start.hidden) { const q = $("#ssearch", start); q.value = ""; q.dispatchEvent(new Event("input")); q.focus(); }
}
$("#start-btn").onclick = e => { e.stopPropagation(); toggleStart(); sfx("menu"); };
start.onclick = e => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.app) openApp(b.dataset.app);
  else if (b.dataset.act === "lock") lockScreen();
  else if (b.dataset.act === "off") shutdown();
};
document.addEventListener("pointerdown", e => { if (!e.target.closest?.("#startmenu, #start-btn")) closeStart(); });

/* Repos laden: GitHub-API (1h Cache) -> alter Cache -> eingebetteter Snapshot */
async function loadRepos() {
  const pick = r => ({ name: r.name, description: r.description, language: r.language, topics: r.topics || [], stargazers_count: r.stargazers_count, pushed_at: r.pushed_at, homepage: r.homepage, html_url: r.html_url });
  const cached = store.get("repos", null);
  let list;
  if (cached && Date.now() - cached.t < 3600e3) { list = cached.list; repoSource = "Cache"; }
  else {
    try {
      const res = await fetch(`https://api.github.com/users/${PROFILE.user}/repos?per_page=100&sort=pushed`);
      if (!res.ok) throw new Error(res.status);
      list = (await res.json()).filter(r => !r.fork && !r.archived && r.name !== PROFILE.user).map(pick);
      store.set("repos", { t: Date.now(), list });
      repoSource = "live von GitHub";
    } catch {
      list = (cached && cached.list) || window.REPO_FALLBACK || [];
      repoSource = "Offline-Snapshot";
    }
  }
  REPOS = list.slice().sort((a, b) => isSec(b) - isSec(a) || (b.pushed_at || "").localeCompare(a.pushed_at || ""));
  REPOS.forEach(r => { APPS["repo:" + r.name] = repoApp(r); addIcon("repo:" + r.name); });
  buildStart();
  bootLog(`Synchronisiere github.com/${PROFILE.user} ... ${REPOS.length} Repos (${repoSource})`);
  const tn = $("#tray-net"); if (tn) tn.textContent = `◉ ${REPOS.length} REPOS`;
  document.dispatchEvent(new Event("repos"));
}

const clock = $("#clock"), lclock = $("#lclock");
const tickClock = () => {
  const d = new Date(), time = d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  clock.textContent = time + "\n" + d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  $("b", lclock).textContent = time;
  $("span", lclock).textContent = d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
};
tickClock(); setInterval(tickClock, 10000);

/* ---------- Verknüpfungen & Toasts ---------- */
document.addEventListener("click", e => { const o = e.target.closest?.("[data-open]"); if (o) openApp(o.dataset.open); });
document.addEventListener("pointerdown", e => { if (e.target.closest?.("button, a, .icon")) sfx("click"); }, true);
const notifications = [];
function toast(html) {
  sfx("notify");
  notifications.unshift({ html, t: Date.now() });
  if (notifications.length > 30) notifications.pop();
  document.dispatchEvent(new Event("notif"));
  let box = $("#toasts");
  if (!box) { box = el("div"); box.id = "toasts"; document.body.append(box); }
  const t = el("div", "toast", html);
  box.append(t);
  setTimeout(() => t.classList.add("out"), 4200);
  setTimeout(() => t.remove(), 4800);
}

/* ---------- Boot & Login ---------- */
const BOOT = [
  "BeneOS BIOS v3.0  (c) " + new Date().getFullYear(),
  "Prüfe Speicher ............ 640K OK  (ok, 64GB)",
  "Lade Kernel ............... OK",
  "Initialisiere Neon-Treiber  OK",
  "Härte Sandbox (CSP) ....... OK",
  "Starte Fenstermanager ..... OK",
  "Starte Security-Lab ....... OK",
  "",
];
let booted = false;
function finishBoot() {
  if (booted) return;
  booted = true;
  applySettings();
  $("#boot").classList.add("out");
  setTimeout(() => $("#boot").remove(), 700);
  showLogin();
}
function enterDesktop(user) {
  sfx("startup");
  setTimeout(() => { achieve("boot"); if (user === "admin") achieve("admin"); }, 1500);
  session.user = user;
  $("#login").hidden = true;
  ["desktop", "taskbar"].forEach(id => { $("#" + id).hidden = false; });
  document.body.classList.add("entered");
  buildStart();
  const c = (PROFILE.certs || [])[0];
  if (c) { const w = $("#badge"); w.hidden = false; w.innerHTML = `<span>🏅</span><b>${esc(c.short)}</b><small>certified</small>`; w.onclick = () => openApp("certs"); }
  openApp("about");
  if (user === "admin") toast("🚩 Willkommen, <b>admin</b>! Flag: <code>BENE{d3f4ult_cr3ds_f41l}</code><br><small>Default-Credentials sind ein Klassiker – trag die Flag im Mini CTF ein.</small>");
  else toast(`Willkommen, <b>${esc(user)}</b>. Drück <code>Strg+K</code> für die Suche oder tippe <code>help</code> im Terminal 👾`);
}
function shutdown() {
  sfx("shutdown");
  document.body.classList.add("off");
  setTimeout(() => location.reload(), 1500);
}
applySettings();
const log = $("#boot-log");
function bootLog(line) { if (!booted) log.textContent += line + "\n"; }
BOOT.forEach((line, i) => setTimeout(() => bootLog(line), i * 280));
loadRepos();
setTimeout(() => { const b = $("#bootbar"); if (b) b.classList.add("go"); }, BOOT.length * 280);
setTimeout(finishBoot, BOOT.length * 280 + 1500);
$("#boot").onclick = finishBoot;

// Service Worker: schnelleres Nachladen + Offline-Fähigkeit (nur über HTTPS)
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
