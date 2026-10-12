"use strict";
/* Shell-Erweiterungen: Desktop-Kontextmenü, Control Center (Schnelleinstellungen + Benachrichtigungen),
   Kalender, Desktop-Widgets, Screensaver, Tastenkürzel, Performance-Wächter und die App „Über BeneOS“.
   Läuft nach os.js und nutzt dessen Globals (openApp, settings, APPS, REPOS, …). */
(() => {
  const VERSION = "3.0";
  const layer = (id, cls) => { const e = el("div", cls); e.id = id; e.hidden = true; document.body.append(e); return e; };
  const ctx = layer("ctx", "menu"), cc = layer("cc", "panel"), cal = layer("cal", "panel"), saver = layer("saver");
  const hideAll = () => { ctx.hidden = cc.hidden = cal.hidden = true; };

  /* ---------- Kontextmenü ---------- */
  const cycleWallpaper = () => {
    const m = Wallpaper.modes;
    settings.wallpaper = m[(m.indexOf(settings.wallpaper) + 1) % m.length];
    applySettings(); achieve("wallpaper"); sfx("menu");
  };
  const ctxItems = [
    ["⌨", "Terminal öffnen", () => openApp("terminal")],
    ["📁", "Repo Explorer", () => openApp("projects")],
    ["🗂", "Dateien", () => openApp("files")],
    ["🖼", "Hintergrund wechseln", cycleWallpaper],
    ["⚙", "Einstellungen", () => openApp("settings")],
    ["🔒", "Sperren", () => lockScreen()],
    ["ℹ", "Über BeneOS", () => openApp("sysinfo")],
  ];
  $("#desktop").addEventListener("contextmenu", e => {
    if (e.target.closest(".win")) return;
    e.preventDefault(); hideAll(); closeStart();
    ctx.innerHTML = ctxItems.map(([i, t], k) => `<button data-k="${k}"><span>${i}</span>${t}</button>`).join("");
    ctx.hidden = false;
    ctx.style.left = Math.max(4, Math.min(e.clientX, innerWidth - ctx.offsetWidth - 8)) + "px";
    ctx.style.top = Math.max(4, Math.min(e.clientY, innerHeight - ctx.offsetHeight - 70)) + "px";
    sfx("menu"); achieve("ctx");
  });
  ctx.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; ctx.hidden = true; ctxItems[b.dataset.k][2](); });

  /* ---------- Tray: Benachrichtigungen + Schnelleinstellungen + Kalender ---------- */
  const tray = $("#tray");
  const bell = el("button", "tbtn", "🔔<i hidden></i>"); bell.title = "Benachrichtigungen"; bell.setAttribute("aria-label", "Benachrichtigungen");
  const cbtn = el("button", "tbtn", "🎛"); cbtn.title = "Schnelleinstellungen"; cbtn.setAttribute("aria-label", "Schnelleinstellungen");
  tray.prepend(bell, cbtn);
  let unread = 0;
  const updateBell = () => { const i = $("i", bell); i.textContent = unread > 9 ? "9+" : String(unread || ""); i.hidden = !unread; };
  const ago = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? "gerade eben" : `vor ${m} Min.`; };

  const renderCC = () => {
    cc.innerHTML = `<div class="tiles">
        <button class="tile ${settings.sound ? "on" : ""}" data-t="sound"><span>${settings.sound ? "🔊" : "🔇"}</span>Sound</button>
        <button class="tile ${settings.lite ? "on" : ""}" data-t="lite"><span>⚡</span>Performance</button>
        <button class="tile ${settings.crt ? "on" : ""}" data-t="crt"><span>📺</span>CRT</button>
        <button class="tile" data-t="lock"><span>🔒</span>Sperren</button>${window.__installEvt ? `<button class="tile" data-t="install"><span>📲</span>Installieren</button>` : ""}</div>
      <label class="chk">🔈 <input type="range" id="cc-vol" min="0" max="100" value="${Math.round(settings.volume * 100)}" style="flex:1" aria-label="Lautstärke"></label>
      <div class="dim cc-h">Hintergrund</div>
      <div class="chips">${Wallpaper.modes.map(m => `<button class="chip ${m === settings.wallpaper ? "on" : ""}" data-wp="${m}">${Wallpaper.labels[m]}</button>`).join("")}</div>
      <div class="dim cc-h">Farbschema</div>
      <div class="swatches">${THEMES.map(([a, b]) => `<button class="sw ${a === settings.accent ? "on" : ""}" data-a="${a}" data-b="${b}" style="background:linear-gradient(135deg,${a} 50%,${b} 50%)" aria-label="Farbschema ${a}"></button>`).join("")}</div>
      <div class="cc-h" style="display:flex;justify-content:space-between;align-items:center"><span class="dim">Benachrichtigungen</span><button class="chip" data-t="clear">Leeren</button></div>
      <div class="nlist">${notifications.slice(0, 8).map(n => `<div class="note">${n.html}<small class="dim">${ago(n.t)}</small></div>`).join("") || `<div class="dim" style="padding:6px 2px">Keine Benachrichtigungen</div>`}</div>`;
  };
  cc.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    const d = b.dataset;
    if (d.t === "sound") settings.sound = !settings.sound;
    else if (d.t === "lite") settings.lite = !settings.lite;
    else if (d.t === "crt") settings.crt = !settings.crt;
    else if (d.t === "lock") { hideAll(); lockScreen(); return; }
    else if (d.t === "install") { hideAll(); window.installPWA(); return; }
    else if (d.t === "clear") { notifications.length = 0; unread = 0; updateBell(); }
    else if (d.wp) { settings.wallpaper = d.wp; achieve("wallpaper"); }
    else if (d.a) { settings.accent = d.a; settings.accent2 = d.b; achieve("theme"); }
    else return;
    applySettings(); renderCC();
  });
  cc.addEventListener("input", e => { if (e.target.id === "cc-vol") { settings.volume = e.target.value / 100; applySettings(); } });
  cc.addEventListener("change", e => { if (e.target.id === "cc-vol") sfx("notify"); });
  document.addEventListener("notif", () => { if (cc.hidden) unread++; updateBell(); if (!cc.hidden) renderCC(); });

  let cy, cm;
  const renderCal = () => {
    const now = new Date();
    if (cy === undefined) { cy = now.getFullYear(); cm = now.getMonth(); }
    const first = new Date(cy, cm, 1), lead = (first.getDay() + 6) % 7, days = new Date(cy, cm + 1, 0).getDate();
    const cells = [...Array(lead).fill(""), ...Array.from({ length: days }, (_, i) => i + 1)];
    const isNow = c => c && cy === now.getFullYear() && cm === now.getMonth() && c === now.getDate();
    cal.innerHTML = `<div class="cal-h"><button class="chip" data-m="-1" aria-label="Voriger Monat">‹</button><b>${first.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}</b><button class="chip" data-m="1" aria-label="Nächster Monat">›</button></div>
      <div class="cal-g">${["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map(d => `<i class="dim">${d}</i>`).join("")}${cells.map(c => `<span class="${isNow(c) ? "today" : ""}">${c}</span>`).join("")}</div>`;
  };
  cal.addEventListener("click", e => {
    const b = e.target.closest("[data-m]"); if (!b) return;
    cm += +b.dataset.m;
    if (cm < 0) { cm = 11; cy--; } else if (cm > 11) { cm = 0; cy++; }
    renderCal(); sfx("menu");
  });

  const togglePanel = (panel, render) => {
    const was = !panel.hidden;
    hideAll(); closeStart();
    if (!was) { render(); panel.hidden = false; sfx("menu"); }
  };
  cbtn.onclick = e => { e.stopPropagation(); togglePanel(cc, renderCC); };
  bell.onclick = e => { e.stopPropagation(); unread = 0; updateBell(); togglePanel(cc, renderCC); };
  $("#clock").onclick = e => { e.stopPropagation(); cy = undefined; togglePanel(cal, renderCal); };
  document.addEventListener("pointerdown", e => { if (!e.target.closest("#ctx, #cc, #cal, #tray")) hideAll(); });

  /* ---------- Desktop-Widgets ---------- */
  const wid = el("div"); wid.id = "widgets";
  $("#desktop").insertBefore(wid, $("#windows"));
  wid.append($("#badge"));
  const wc = el("div", "widget wclock"), wg = el("button", "widget wgh"); wg.hidden = true;
  wid.append(wc, wg);
  const tickW = () => {
    const d = new Date();
    wc.innerHTML = `<b>${d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}</b><span>${d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}</span>`;
  };
  tickW(); setInterval(tickW, 15000);
  const renderGh = () => {
    if (!REPOS.length) { wg.hidden = true; return; }
    wg.hidden = false;
    const stars = REPOS.reduce((s, r) => s + (r.stargazers_count || 0), 0), sec = REPOS.filter(isSec).length;
    const langs = {}; REPOS.forEach(r => { if (r.language) langs[r.language] = (langs[r.language] || 0) + 1; });
    const top = Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 5), tot = top.reduce((s, [, n]) => s + n, 0) || 1;
    const cols = ["var(--accent)", "var(--accent2)", "#39ff88", "#ffb020", "#7aa2ff"];
    const latest = REPOS.slice().sort((a, b) => (b.pushed_at || "").localeCompare(a.pushed_at || ""))[0];
    wg.innerHTML = `<div class="wgh-h">⌘ GitHub · ${esc(PROFILE.user)}</div>
      <div class="wgh-s"><div><b>${REPOS.length}</b><span>Repos</span></div><div><b>${sec}</b><span>Security</span></div><div><b>${stars}</b><span>★ Stars</span></div></div>
      <div class="lbar">${top.map(([, n], i) => `<i style="flex:${n};background:${cols[i]}"></i>`).join("")}</div>
      <div class="lleg">${top.map(([l, n], i) => `<span><i style="background:${cols[i]}"></i>${esc(l)} ${Math.round(n / tot * 100)}%</span>`).join("")}</div>
      <div class="dim wgh-f">Zuletzt aktiv: <b>${esc(latest.name)}</b></div>`;
  };
  wg.onclick = () => openApp("projects");
  document.addEventListener("repos", renderGh);
  if (REPOS.length) renderGh();

  /* ---------- Screensaver (nach 2 Min. Inaktivität) ---------- */
  saver.innerHTML = `<div id="saver-logo">BENE<span>OS</span><small></small></div>`;
  const logo = $("#saver-logo", saver);
  let lastInput = Date.now(), savering = false, raf = 0, px = 80, py = 80, vx = 1.6, vy = 1.2, ci = 0;
  const bounce = () => {
    raf = requestAnimationFrame(bounce);
    const w = logo.offsetWidth, h = logo.offsetHeight;
    px += vx; py += vy;
    let hit = false;
    if (px <= 0 || px + w >= innerWidth) { vx = -vx; px = Math.max(0, Math.min(px, innerWidth - w)); hit = true; }
    if (py <= 0 || py + h >= innerHeight) { vy = -vy; py = Math.max(0, Math.min(py, innerHeight - h)); hit = true; }
    if (hit) { const c = THEMES[++ci % THEMES.length]; logo.style.setProperty("--a", c[0]); logo.style.setProperty("--b", c[1]); }
    logo.style.transform = `translate(${px}px,${py}px)`;
  };
  const startSaver = () => {
    savering = true; saver.hidden = false; hideAll(); closeStart();
    $("small", logo).textContent = new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    Wallpaper.pause(true); bounce();
  };
  const stopSaver = () => { savering = false; saver.hidden = true; cancelAnimationFrame(raf); updateOcclusion(); };
  const bump = () => { lastInput = Date.now(); if (savering) stopSaver(); };
  ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"].forEach(ev => addEventListener(ev, bump, { passive: true }));
  setInterval(() => {
    if (!savering && !document.hidden && !$("#desktop").hidden && $("#login").hidden && Date.now() - lastInput > 120000) startSaver();
  }, 5000);

  /* ---------- Tastenkürzel ---------- */
  addEventListener("keydown", e => {
    if ($("#desktop").hidden || !$("#login").hidden) return;
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === "k") { e.preventDefault(); hideAll(); toggleStart(true); return; }
    if (k === "escape") { hideAll(); closeStart(); return; }
    if (e.altKey && (k === "w" || k === "m")) {
      const a = Object.entries(open).find(([, w]) => w.win.classList.contains("active"));
      if (!a) return;
      e.preventDefault();
      if (k === "w") closeApp(a[0]); else $(".mn", a[1].win).click();
    }
  });

  /* ---------- Performance-Wächter: schaltet bei <28 FPS einmalig den Performance-Modus ein ---------- */
  const watch = () => {
    if (store.get("perf-checked", false) || settings.lite) return;
    let frames = 0, t0 = 0;
    const f = t => {
      if (document.hidden) return;                       // Tab im Hintergrund: Messung verwerfen, nächstes Mal neu
      if (!t0) t0 = t;
      frames++;
      if (t - t0 < 4000) { requestAnimationFrame(f); return; }
      const fps = frames / ((t - t0) / 1000);
      store.set("perf-checked", true);
      if (fps < 28) { settings.lite = true; applySettings(); toast(`⚡ Performance-Modus aktiviert (${Math.round(fps)} FPS erkannt). Zurückschalten: Einstellungen.`); }
    };
    setTimeout(() => requestAnimationFrame(f), 6000);
  };
  const iv = setInterval(() => { if (!$("#desktop").hidden) { clearInterval(iv); watch(); } }, 1000);

  /* ---------- App: Über BeneOS ---------- */
  APPS.sysinfo = {
    title: "Über BeneOS", icon: "💽", group: "System", w: 560, h: 580,
    render(body) {
      const t0 = performance.now();
      body.innerHTML = `<div class="pad"><div class="about"><div class="avatar" style="font-size:28px">OS</div>
        <div><h1>BeneOS ${VERSION}</h1><div class="dim">Ein Browser-Betriebssystem im Cyber-Look</div><div class="dim">MIT-Lizenz · © ${new Date().getFullYear()} ${esc(PROFILE.name)}</div></div></div>
        <h2>System</h2><div class="kv" id="si"></div>
        <h2>Tastenkürzel &amp; Gesten</h2>
        <div class="kv"><span>Strg + K</span><b>Suche öffnen</b><span>Alt + W / Alt + M</span><b>Fenster schließen / minimieren</b><span>Esc</span><b>Menüs schließen</b>
        <span>Fenster an Rand ziehen</span><b>Snap (links, rechts, oben = maximieren)</b><span>Doppelklick Titelleiste</span><b>Maximieren</b><span>Rechtsklick Desktop</span><b>Kontextmenü</b><span>Klick auf Uhr</span><b>Kalender</b></div>
        <h2>Technik</h2><p>Reines HTML, CSS und JavaScript – ohne Framework und ohne Build-Schritt. Canvas-Hintergründe, Web-Audio-Synthese, Service Worker, strikte Content-Security-Policy. Alles läuft lokal im Browser, es gibt kein Tracking.</p>
        <div class="links" style="grid-auto-flow:column"><a href="https://github.com/${esc(PROFILE.user)}/BeneOS" target="_blank" rel="noopener noreferrer">⌘ Quellcode</a><a href="https://github.com/${esc(PROFILE.user)}/BeneOS/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">📄 Lizenz</a></div></div>`;
      const si = $("#si", body);
      const draw = () => {
        const up = Math.floor((performance.now() - t0) / 1000);
        const rows = [
          ["Version", VERSION], ["Angemeldet als", session.user], ["Apps", Object.keys(APPS).length], ["Repos", `${REPOS.length} (${repoSource})`],
          ["Offene Fenster", Object.keys(open).length], ["Erfolge", `${store.get("ach", []).length} / ${Object.keys(ACH).length}`],
          ["Hintergrund", Wallpaper.labels[settings.wallpaper]], ["Modus", settings.lite ? "Performance" : "Standard"],
          ["Fenster-Uptime", `${Math.floor(up / 60)}:${String(up % 60).padStart(2, "0")}`],
          ["Offline-Cache", navigator.serviceWorker && navigator.serviceWorker.controller ? "aktiv" : "inaktiv"],
        ];
        si.innerHTML = rows.map(([k, v]) => `<span>${k}</span><b>${esc(String(v))}</b>`).join("");
      };
      draw();
      const t = setInterval(draw, 1000);
      return () => clearInterval(t);
    },
  };
  addIcon("sysinfo");
  buildStart();
})();
