"use strict";
/* Shell, Teil 2: virtuelle Desktops, Fenster-Übersicht, verschiebbare Icons, Terminal-Erweiterungen,
   Easter Eggs (Konami, Kernel Panic), Netz-/Akku-Anzeige, Live-Threat-Feed, Tipps. Läuft nach shell.js. */
(() => {
  const rnd = n => Math.floor(Math.random() * n);
  const pick = a => a[rnd(a.length)];
  const tray = $("#tray");
  const layer = (id, cls) => { const e = el("div", cls); e.id = id; e.hidden = true; document.body.append(e); return e; };

  /* ---------- Virtuelle Desktops ---------- */
  const WS_N = 3;
  const wsBox = el("div", "wsbox");
  wsBox.setAttribute("role", "group"); wsBox.setAttribute("aria-label", "Virtuelle Desktops");
  const renderWs = () => {
    wsBox.innerHTML = Array.from({ length: WS_N }, (_, i) => {
      const n = i + 1, cnt = Object.values(open).filter(e => e.win.dataset.ws == n).length;
      return `<button class="wsb ${n === CUR_WS ? "on" : ""} ${cnt ? "has" : ""}" data-ws="${n}" title="Desktop ${n} (Strg+Alt+${n})">${n}</button>`;
    }).join("");
  };
  function setWs(n) {
    n = ((n - 1 + WS_N) % WS_N) + 1;
    if (n === CUR_WS) return;
    CUR_WS = n;
    Object.values(open).forEach(e => { const off = e.win.dataset.ws != n; e.win.classList.toggle("ws-off", off); e.btn.hidden = off; });
    const vis = Object.keys(open).filter(k => open[k].win.dataset.ws == n && !open[k].win.classList.contains("hidden")).pop();
    if (vis) focusWin(vis);
    updateOcclusion(); renderWs(); sfx("maximize"); achieve("ws");
  }
  function moveWs(id, n) {
    const e = open[id]; if (!e) return;
    e.win.dataset.ws = n; e.btn.dataset.ws = n;
    const off = n != CUR_WS; e.win.classList.toggle("ws-off", off); e.btn.hidden = off;
    updateOcclusion(); renderWs(); sfx("pop");
  }
  wsBox.addEventListener("click", e => { const b = e.target.closest("[data-ws]"); if (b) setWs(+b.dataset.ws); });
  new MutationObserver(renderWs).observe($("#tasks"), { childList: true });
  renderWs();

  /* ---------- Fenster-Übersicht ---------- */
  const ov = layer("ov", "ovl");
  const renderOv = () => {
    ov.innerHTML = `<div class="ov-h"><b>Fenster-Übersicht</b><span class="dim">Klick = fokussieren · ✕ = schließen · Zahlen = auf Desktop verschieben · Esc = zurück</span></div><div class="ov-cols">` +
      Array.from({ length: WS_N }, (_, i) => {
        const n = i + 1, items = Object.entries(open).filter(([, e]) => e.win.dataset.ws == n);
        return `<div class="ov-col ${n === CUR_WS ? "cur" : ""}"><button class="ov-title" data-ws="${n}">Desktop ${n}${n === CUR_WS ? " · aktiv" : ""}</button>` +
          (items.map(([id, e]) => `<div class="ov-tile" data-id="${esc(id)}"><span class="ov-i">${esc(APPS[id].icon)}</span><div><b>${esc(APPS[id].title)}</b><small>${e.win.classList.contains("hidden") ? "minimiert" : e.win.classList.contains("active") ? "aktiv" : "läuft"}</small></div>
            <span class="ov-mv">${Array.from({ length: WS_N }, (_, k) => k + 1).filter(k => k !== n).map(k => `<button data-mv="${esc(id)}|${k}" title="Auf Desktop ${k}">${k}</button>`).join("")}<button data-x="${esc(id)}" title="Schließen">✕</button></span></div>`).join("") || `<div class="dim" style="padding:14px">Keine Fenster</div>`) + `</div>`;
      }).join("") + `</div>`;
  };
  const toggleOv = show => {
    const want = show === undefined ? ov.hidden : show;
    if (want) { closeStart(); renderOv(); ov.hidden = false; sfx("menu"); achieve("overview"); } else ov.hidden = true;
  };
  ov.addEventListener("click", e => {
    const t = e.target;
    const ws = t.closest("[data-ws]"); if (ws) { setWs(+ws.dataset.ws); renderOv(); return; }
    const mv = t.closest("[data-mv]"); if (mv) { const [id, n] = mv.dataset.mv.split("|"); moveWs(id, +n); renderOv(); return; }
    const x = t.closest("[data-x]"); if (x) { closeApp(x.dataset.x); renderOv(); return; }
    const tile = t.closest(".ov-tile");
    if (tile) { const id = tile.dataset.id; if (open[id]) { setWs(+open[id].win.dataset.ws); open[id].win.classList.remove("hidden"); focusWin(id); updateOcclusion(); } ov.hidden = true; return; }
    if (t === ov || t.classList.contains("ov-cols")) ov.hidden = true;
  });
  Object.assign(window, { setWs, moveWs, toggleOv });   // auch für Terminal/BeneBot nutzbar
  const ovBtn = el("button", "tbtn", "▦"); ovBtn.title = "Fenster-Übersicht (Strg+Alt+O)"; ovBtn.setAttribute("aria-label", "Fenster-Übersicht");
  ovBtn.onclick = e => { e.stopPropagation(); toggleOv(); };
  const botBtn = el("button", "tbtn", "🤖"); botBtn.title = "BeneBot"; botBtn.setAttribute("aria-label", "BeneBot öffnen");
  botBtn.onclick = e => { e.stopPropagation(); openApp("bot"); };
  tray.prepend(wsBox, botBtn, ovBtn);

  addEventListener("keydown", e => {
    if ($("#desktop").hidden || !$("#login").hidden) return;
    const k = e.key.toLowerCase();
    if (e.ctrlKey && e.altKey) {
      if (/^[1-3]$/.test(e.key)) { e.preventDefault(); setWs(+e.key); return; }
      if (k === "arrowright") { e.preventDefault(); setWs(CUR_WS + 1); return; }
      if (k === "arrowleft") { e.preventDefault(); setWs(CUR_WS - 1); return; }
      if (k === "o") { e.preventDefault(); toggleOv(); return; }
    }
    if (e.altKey && e.shiftKey && /^Digit[1-3]$/.test(e.code)) {
      const a = Object.entries(open).find(([, w]) => w.win.classList.contains("active"));
      if (a) { e.preventDefault(); moveWs(a[0], +e.code.slice(5)); }
    }
    if (k === "escape") ov.hidden = true;
  });

  /* ---------- Desktop-Icons per Drag & Drop sortieren ---------- */
  const icons = $("#icons");
  const applyOrder = () => {
    const ord = store.get("icons", []); if (!ord.length) return;
    const idx = id => { const i = ord.indexOf(id); return i < 0 ? 1e6 : i; };
    [...icons.children].sort((a, b) => idx(a.dataset.id) - idx(b.dataset.id)).forEach(k => icons.append(k));
  };
  const origAdd = window.addIcon;
  window.addIcon = id => { origAdd(id); applyOrder(); };
  icons.querySelectorAll(".icon").forEach(b => { b.draggable = true; });
  let dragEl = null;
  icons.addEventListener("dragstart", e => {
    const b = e.target.closest(".icon"); if (!b) return;
    dragEl = b; e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", b.dataset.id); } catch { /* egal */ }
    requestAnimationFrame(() => b.classList.add("dragging"));
  });
  icons.addEventListener("dragover", e => {
    if (!dragEl) return;
    e.preventDefault();
    const t = e.target.closest(".icon");
    if (!t || t === dragEl) return;
    const r = t.getBoundingClientRect();
    icons.insertBefore(dragEl, e.clientY - r.top > r.height / 2 ? t.nextSibling : t);
  });
  icons.addEventListener("drop", e => e.preventDefault());
  icons.addEventListener("dragend", () => {
    if (!dragEl) return;
    dragEl.classList.remove("dragging"); dragEl = null;
    store.set("icons", [...icons.children].map(k => k.dataset.id));
    sfx("pop"); achieve("icons");
  });
  applyOrder();

  /* ---------- Easter Eggs: Konami-Code & Kernel Panic ---------- */
  const KONAMI = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
  let kpos = 0;
  addEventListener("keydown", e => {
    if ($("#desktop").hidden || !$("#login").hidden || e.target.closest?.("input, textarea")) { kpos = 0; return; }
    kpos = e.key.toLowerCase() === KONAMI[kpos] ? kpos + 1 : (e.key.toLowerCase() === KONAMI[0] ? 1 : 0);
    if (kpos === KONAMI.length) {
      kpos = 0; sfx("win"); achieve("konami");
      document.body.classList.add("rainbow"); setTimeout(() => document.body.classList.remove("rainbow"), 7000);
      toast("🕹 <b>Cheat aktiviert!</b> Flag: <code>BENE{k0n4m1_c0d3_unl0ck3d}</code><br><small>Trag sie im Mini CTF ein.</small>");
    }
  });
  window.panic = () => {
    if ($("#panic")) return;
    const p = el("div"); p.id = "panic"; p.tabIndex = 0; document.body.append(p); p.focus();
    sfx("boom"); achieve("panic");
    const lines = ["[    0.000000] BeneOS kernel 3.0 (x86_64) starting …", "rm: removing '/home' … '/etc' … '/usr' … '/boot' …", "[    1.337000] EXT4-fs error: unable to read superblock",
      "Kernel panic - not syncing: Attempted to kill init!", "CPU: 0 PID: 1 Comm: init Not tainted 3.0-beneos #1", "---[ end Kernel panic - not syncing: Attempted to kill init! ]---", "",
      "(Alles nur ein Scherz – nichts wurde gelöscht.)", "System wird wiederhergestellt … (Esc oder Klick = sofort)"];
    let i = 0;
    const iv = setInterval(() => { if (i < lines.length) p.textContent += lines[i++] + "\n"; }, 330);
    const done = () => { clearInterval(iv); clearTimeout(to); p.remove(); toast("✔ System wiederhergestellt. Das war <code>rm -rf /</code> – zum Glück nur simuliert."); };
    const to = setTimeout(done, 7500);
    p.addEventListener("click", done); p.addEventListener("keydown", done);
  };

  /* ---------- Terminal-Erweiterungen ---------- */
  const QUOTES = ["„Security is a process, not a product.“ – Bruce Schneier", "„The only truly secure system is one that is powered off.“ – Gene Spafford", "„Amateure hacken Systeme, Profis hacken Menschen.“ – Bruce Schneier",
    "„Never trust user input.“", "„There is no cloud, it's just someone else's computer.“", "„Passwords are like underwear: change them often, don't share them.“", "„Hope is not a strategy.“"];
  const sha = async s => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))), b => b.toString(16).padStart(2, "0")).join("");
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const lib = () => window.DNSLIB;
  const ct = s => `<span class="hi">${s}</span>`;
  window.TERM_CMDS = {
    echo: (a, args) => esc(args.join(" ")),
    pwd: () => `/home/${session.user}`,
    hostname: () => "beneos",
    id: () => `uid=1000(${session.user}) gid=1000(${session.user}) groups=1000(${session.user}),27(sudo-nope)`,
    uptime: () => `up ${Math.floor(performance.now() / 60000)} min, ${Object.keys(open).length} Fenster, ${store.get("ach", []).length} Erfolge`,
    tree: () => `${ct("~")}\n├── readme.txt\n├── passwords.txt\n├── certs/\n├── repos/ (${REPOS.length} Repos)\n├── tools/\n└── .secret/  ← versteckt`,
    top: () => `${"NAME".padEnd(24)}${"STATUS".padEnd(12)}DESKTOP\n` + Object.entries(open).map(([id, e]) => `${esc(APPS[id].title).padEnd(24)}${(e.win.classList.contains("hidden") ? "minimiert" : "läuft").padEnd(12)}${e.win.dataset.ws}`).join("\n"),
    kill: a => {
      if (!a) return "<span class='err'>kill: Name fehlt (siehe top)</span>";
      const id = Object.keys(open).find(k => k.toLowerCase() === a || k.toLowerCase() === "repo:" + a || APPS[k].title.toLowerCase() === a);
      if (!id) return `<span class="err">kill: ${esc(a)}: kein solcher Prozess</span>`;
      closeApp(id); return `<span class="ok">${esc(APPS[id].title)} beendet.</span>`;
    },
    history: (a, args, c) => c.hist.map((h, i) => `${String(i + 1).padStart(4)}  ${esc(h)}`).join("\n"),
    ctf: () => { const n = store.get("ctf", []).length; return `Flags gefunden: <span class="hi">${n}</span> / 9  ·  ${n === 9 ? "<span class='ok'>Alle! 🏆</span>" : "tippe <span class='hi'>open ctf</span>"}`; },
    fortune: () => esc(pick(QUOTES)),
    cowsay: (a, args) => { const t = esc(args.join(" ") || "Muuh – patch dein System!"); const l = "─".repeat(Math.min(40, t.length + 2)); return ` ┌${l}┐\n │ ${t} │\n └${l}┘\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||`; },
    sha256: async (a, args) => (args.length ? ct(await sha(args.join(" "))) : "<span class='err'>Nutzung: sha256 &lt;text&gt;</span>"),
    b64: (a, args) => ct(btoa(String.fromCharCode(...new TextEncoder().encode(args.join(" "))))),
    unb64: (a, args) => { try { return esc(new TextDecoder().decode(Uint8Array.from(atob(args.join("")), c => c.charCodeAt(0)))); } catch { return "<span class='err'>Kein gültiges Base64</span>"; } },
    rev: (a, args) => esc([...args.join(" ")].reverse().join("")),
    ws: a => { if (!/^[1-3]$/.test(a || "")) return "Nutzung: ws 1|2|3"; setWs(+a); return `<span class="ok">Desktop ${a}</span>`; },
    overview: () => { toggleOv(true); return null; },
    radio: () => { openApp("radio"); return null; },
    play: () => { openApp("radio"); return null; },
    reboot: () => { shutdown(); return null; },
    rm: (a, args) => { if (/^-?[rf]+$/.test(args[0] || "") && args.slice(1).join(" ").replace(/\s/g, "").replace(/\*$/, "") === "/") { panic(); return null; } return "<span class='err'>rm: zu gefährlich für ein Browser-OS 😉</span>"; },
    sudo: (a, args) => { if (args[1] === "rm" && /^-?[rf]+$/.test(args[2] || "") && (args[3] || "").replace(/\*$/, "") === "/") { panic(); return null; } return "<span class='err'>Netter Versuch. 😉</span>"; },
    ping: async (a, args, c) => {
      const h = esc(args[0] || "benedikt-pkr.info");
      c.out(`PING ${h} (simuliert) 56 bytes of data.`);
      for (let i = 1; i <= 4; i++) { await wait(450); c.out(`64 bytes from ${h}: icmp_seq=${i} ttl=57 time=${(8 + Math.random() * 14).toFixed(1)} ms`); }
      return `<span class="dim">Alles simuliert – es werden keine Pakete gesendet.</span>`;
    },
    hack: async (a, args, c) => {
      const steps = ["Scanning ports 1-65535 …", "Found: 22/tcp ssh, 80/tcp http, 443/tcp https", "Fingerprinting service versions …", "Matching CVE database … (simuliert)", "Crafting payload …", "Bypassing WAF …", "Gaining shell …", "ACCESS GRANTED ▓▓▓▓▓▓▓▓▓▓ 100%"];
      for (const s of steps) { await wait(380); c.out(`<span class="ok">[+]</span> ${s}`); }
      return "<span class='dim'>… war natürlich nur Show. Echtes Pentesting geht nur mit Erlaubnis. 😉</span>";
    },
    dig: async (a, args, c) => {
      const L = lib(); if (!L) return "<span class='err'>DNS-Modul nicht geladen</span>";
      const host = L.cleanHost(args[0] || ""), type = (args[1] || "A").toUpperCase();
      if (!L.HOST_RE.test(host)) return "<span class='err'>Nutzung: dig &lt;domain&gt; [A|AAAA|MX|TXT|NS|CNAME|SOA|CAA]</span>";
      if (!L.TYPES[type]) return `<span class='err'>Unbekannter Typ. Erlaubt: ${Object.keys(L.TYPES).join(", ")}</span>`;
      c.out(`<span class="dim">; DNS-over-HTTPS via Cloudflare · ${esc(host)} ${type}</span>`);
      const j = await L.doh(host, type);
      const ans = j.Answer || [];
      achieve("dig");
      if (!ans.length) return `<span class="err">;; keine Antwort (Status ${j.Status}${j.Status === 3 ? " – NXDOMAIN" : ""})</span>`;
      return ans.map(r => `${esc(r.name)}\t${r.TTL}\tIN\t${esc(L.NAMES[r.type] || r.type)}\t${esc(r.data)}`).join("\n");
    },
  };

  /* ---------- Netz-/Akku-Anzeige in der Taskleiste ---------- */
  const net = $("#tray-net");
  const updNet = () => {
    if (!navigator.onLine) { net.textContent = "⚠ OFFLINE"; net.style.color = "#ff5470"; return; }
    net.style.color = ""; net.textContent = REPOS.length ? `◉ ${REPOS.length} REPOS` : "◉ ONLINE";
  };
  addEventListener("online", updNet); addEventListener("offline", updNet); document.addEventListener("repos", updNet);
  if (navigator.getBattery) navigator.getBattery().then(b => {
    const s = el("span"); s.id = "tray-bat"; tray.insertBefore(s, net);
    const upd = () => { s.textContent = `${b.charging ? "⚡" : "🔋"} ${Math.round(b.level * 100)}%`; s.style.color = b.level < .2 && !b.charging ? "#ff5470" : ""; };
    upd(); b.addEventListener("levelchange", upd); b.addEventListener("chargingchange", upd);
  }).catch(() => {});

  /* ---------- Live-Threat-Feed (simuliert) ---------- */
  const wid = $("#widgets");
  const wf = el("div", "widget wfeed");
  wf.innerHTML = `<div class="wgh-h">🛰 Threat Feed <span class="dim">· simuliert</span></div><div id="wfl"></div>`;
  wid.append(wf);
  const TYPES = [["SSH-Brute-Force", "#ffb020"], ["SQLi-Versuch", "#ff2bd6"], ["Port-Scan", "#7aa2ff"], ["Phishing-Link", "#a66bff"], ["XSS-Payload", "#39ff88"], ["DDoS-Burst", "#ff3b5c"], ["Credential-Stuffing", "#ffb020"], ["CVE-Exploit-Probe", "#ff3b5c"]];
  const CC = ["US", "DE", "NL", "CN", "RU", "BR", "IN", "FR", "GB", "JP", "KR", "SG", "UA", "TR", "VN"];
  const wfl = $("#wfl", wf);
  const feedTick = () => {
    if (document.hidden || $("#desktop").hidden) return;
    const [t, c] = pick(TYPES), d = document.createElement("div");
    d.className = "wfrow"; d.style.setProperty("--c", c);
    d.textContent = `${new Date().toLocaleTimeString("de-DE")} ${t}  ${pick(CC)}→${Math.random() < .25 ? "DE" : pick(CC)}`;
    wfl.prepend(d); while (wfl.children.length > 4) wfl.lastChild.remove();
  };
  for (let i = 0; i < 4; i++) feedTick();
  setInterval(feedTick, 3200);

  /* ---------- Gelegentliche Tipps ---------- */
  let tipsShown = 0;
  setTimeout(function tip() {
    const maxed = Object.values(open).some(e => e.win.classList.contains("max") && !e.win.classList.contains("hidden"));
    if (!$("#desktop").hidden && !document.hidden && !maxed && $("#saver").hidden && tipsShown < 4 && window.BENEBOT_TIPS) { tipsShown++; toast("💡 " + window.BENEBOT_TIPS[rnd(window.BENEBOT_TIPS.length)]); }
    if (tipsShown < 4) setTimeout(tip, 240000);
  }, 120000);
})();
