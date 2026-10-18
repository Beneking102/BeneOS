"use strict";
// Chaos-Chip: Bei jedem Antippen ein anderer harmloser Streich (nie zweimal derselbe hintereinander), am Ende die Auflösung
// mit Opfer-Nummer. Alles läuft lokal; an den Server geht nur ein anonymer Zähler-Ping (/api/chaos), sonst nichts.
(() => {
  const $ = id => document.getElementById(id);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const buzz = p => { try { navigator.vibrate && navigator.vibrate(p); } catch {} };
  const store = {
    get: k => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
  };

  /* ---------- Opfer-Zähler ---------- */
  let counted = null;
  const count = fetch("/api/chaos", { method: "POST" }).then(r => r.ok ? r.json() : null).then(j => (counted = j && j.count)).catch(() => null);

  async function reveal(kind, head, text) {
    $("rkind").textContent = kind;
    $("rhead").textContent = head;
    $("rtext").textContent = text;
    await Promise.race([count, wait(1500)]);
    $("rnum").textContent = counted ? "#" + counted : "#?";
    $("reveal").classList.add("on");
    buzz([60, 40, 60]);
  }
  $("again").addEventListener("click", () => location.assign("/chaos.html"));

  const show = id => { document.querySelectorAll(".scene").forEach(s => s.classList.toggle("on", s.id === id)); };
  const fit = cv => { const r = devicePixelRatio || 1; cv.width = innerWidth * r; cv.height = innerHeight * r; const g = cv.getContext("2d"); g.setTransform(r, 0, 0, r, 0, 0); return g; };

  /* ---------- 1) Display-Bruch ---------- */
  async function crack() {
    document.title = "Seite wird geladen …";
    show("crack");
    const cv = $("crackcv"), g = fit(cv), W = innerWidth, H = innerHeight;
    await wait(1600);
    const cx = W * (0.3 + Math.random() * 0.4), cy = H * (0.35 + Math.random() * 0.3);
    buzz([30, 20, 200]);

    // Risse als zufällige Zickzack-Linien vom Einschlag aus, dazu Ringe und Splitter
    const cracks = [];
    const n = 16 + (Math.random() * 6 | 0);
    for (let i = 0; i < n; i++) {
      let a = (i / n) * Math.PI * 2 + Math.random() * 0.3, x = cx, y = cy;
      const pts = [[x, y]], len = Math.max(W, H) * (0.4 + Math.random() * 0.7);
      for (let s = 0; s < len; s += 14 + Math.random() * 26) {
        a += (Math.random() - 0.5) * 0.5;
        x += Math.cos(a) * 22; y += Math.sin(a) * 22;
        pts.push([x, y]);
        if (Math.random() < 0.08) cracks.push({ pts: [[x, y], [x + Math.cos(a + 1) * 60, y + Math.sin(a + 1) * 60]], w: 0.7 });
      }
      cracks.push({ pts, w: 1.6 });
    }
    const start = performance.now();
    const draw = t => {
      const p = Math.max(0.01, Math.min(1, (t - start) / 450));
      g.clearRect(0, 0, W, H);
      g.lineCap = "round"; g.lineJoin = "round";
      for (const c of cracks) {
        const k = Math.max(2, Math.floor(c.pts.length * p));
        for (const [col, lw] of [["rgba(0,0,0,.55)", c.w + 1.6], ["rgba(255,255,255,.95)", c.w]]) {
          g.strokeStyle = col; g.lineWidth = lw; g.beginPath();
          c.pts.slice(0, k).forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
          g.stroke();
        }
      }
      for (const r of [18, 34, 58]) {
        g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 1; g.beginPath();
        for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.35) {
          const rr = r * p * (0.85 + Math.random() * 0.3);
          a ? g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : g.moveTo(cx + rr, cy);
        }
        g.stroke();
      }
      const grd = g.createRadialGradient(cx, cy, 0, cx, cy, 70);
      grd.addColorStop(0, "rgba(255,255,255,.85)"); grd.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = grd; g.beginPath(); g.arc(cx, cy, 70 * p, 0, 7); g.fill();
      if (p < 1) requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
    document.body.animate([{ transform: "translate(0)" }, { transform: "translate(-8px,4px)" }, { transform: "translate(7px,-5px)" }, { transform: "translate(0)" }], { duration: 260 });
    await wait(4200);
    reveal("Display-Bruch", "Keine Sorge – heil!", "Das Glas ist ganz. Der Sprung war nur ein Bild. Dein Herzschlag gerade war aber echt.");
  }

  /* ---------- 2) Endlos-Update ---------- */
  async function update() {
    document.title = "Systemupdate";
    show("update");
    const pct = $("upct"), msg = $("umsg");
    const set = (v, m) => { pct.textContent = Math.round(v) + " %"; if (m) msg.innerHTML = m; };
    for (let v = 0; v <= 99; v += 1 + Math.random() * 4) { set(Math.min(v, 99)); await wait(90); }
    set(99, "Fast fertig …"); await wait(2600);
    set(99, "Wirklich fast fertig …"); await wait(2200);
    for (let v = 99; v >= 12; v -= 3) { set(v, "Moment. Was?"); await wait(35); }
    set(12, "Update wird rückgängig gemacht.<br>Grund: zu wenig Humor im Speicher."); buzz(300); await wait(2600);
    set(100, "Humor nachinstalliert ✓"); await wait(1200);
    reveal("Endlos-Update", "Kein Update!", "Dein Handy hat nichts installiert. Du hast nur 15 Sekunden auf einen Ladebalken gestarrt.");
  }

  /* ---------- 3) Schwerkraft ---------- */
  async function gravity() {
    document.title = "Neue Studie";
    show("grav");
    const art = $("gart");
    // Jedes Wort in einen eigenen Span packen
    art.querySelectorAll("h2, p").forEach(el => {
      el.innerHTML = el.textContent.split(/(\s+)/).map(w => (w.trim() ? `<span class="w">${w}</span>` : w)).join("");
    });
    await wait(5200);
    const words = [...art.querySelectorAll(".w")].map(el => {
      const r = el.getBoundingClientRect();
      return { el, y: 0, x: 0, vy: -Math.random() * 3, vx: (Math.random() - 0.5) * 3, rot: 0, vr: (Math.random() - 0.5) * 8,
               top: r.top, h: r.height, delay: Math.random() * 900 };
    });
    let tilt = 0;
    addEventListener("deviceorientation", e => { if (e.gamma != null) tilt = e.gamma / 45; });
    buzz(120);
    const t0 = performance.now();
    const step = t => {
      let moving = false;
      for (const w of words) {
        if (t - t0 < w.delay) { moving = true; continue; }
        const floor = innerHeight - w.top - w.h;
        w.vy += 0.6; w.vx += tilt * 0.4;
        w.y += w.vy; w.x += w.vx; w.rot += w.vr;
        if (w.y > floor) { w.y = floor; w.vy *= -0.35; w.vx *= 0.8; w.vr *= 0.6; }
        if (Math.abs(w.vy) > 0.4 || w.y < floor - 1) moving = true;
        w.el.style.transform = `translate(${w.x}px,${w.y}px) rotate(${w.rot}deg)`;
      }
      if (moving && t - t0 < 7000) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    await wait(5500);
    reveal("Schwerkraft", "… auflöst.", "Wie angekündigt. Du hättest das Handy festhalten sollen.");
  }

  /* ---------- 4) Hypno-Orakel ---------- */
  async function orakel() {
    document.title = "Das Orakel";
    show("orakel");
    const cv = $("hypcv"), g = fit(cv), W = innerWidth, H = innerHeight;
    let run = true;
    const spin = t => {
      const cx = W / 2, cy = H * 0.45;
      g.fillStyle = "#000"; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 26; i++) {
        g.beginPath();
        const r = (i * 22 + (t / 12) % 44);
        g.arc(cx, cy, r, 0, Math.PI * 2);
        g.strokeStyle = `hsl(${(t / 20 + i * 14) % 360} 90% 60%)`;
        g.lineWidth = 9; g.stroke();
      }
      if (run) requestAnimationFrame(spin);
    };
    requestAnimationFrame(spin);
    const sprueche = [
      "Du wirst heute noch etwas essen.", "Jemand in deiner Nähe hat gerade an Leberkäs gedacht.",
      "Dein Akku wird irgendwann leer sein.", "Du wirst diesen Chip gleich nochmal antippen.",
      "Ein Mensch namens Bene weiß jetzt, dass du neugierig bist.", "Morgen ist ein Tag nach heute.",
      "Dein WLAN-Passwort ist zu kurz. Vermutlich.", "In 3 Sekunden blinzelst du.",
    ];
    const pick = sprueche.sort(() => Math.random() - 0.5).slice(0, 3);
    const txt = $("otxt");
    const type = async s => { txt.textContent = ""; for (const c of s) { txt.textContent += c; await wait(45); } };
    await type("Schau in die Mitte …"); await wait(1800);
    await type("Du wirst jetzt … sehr … entspannt …"); await wait(1800);
    for (const s of pick) { await type(s); buzz(40); await wait(2200); }
    run = false;
    reveal("Das Orakel", "Hypnose beendet.", "Das Orakel hat gesprochen. Alle Prophezeiungen sind garantiert zu 100 % wahr.");
  }

  /* ---------- 5) Akku-Panik ---------- */
  async function akku() {
    document.title = "Akku";
    show("akku");
    const lvl = $("alvl"), num = $("anum"), t = $("at"), btn = $("abtn");
    const set = (v, m) => { num.textContent = v + " %"; lvl.style.height = Math.max(2, v) + "%"; if (m) t.textContent = m; };
    for (const v of [4, 3, 2]) { set(v, "Akku fast leer."); buzz(80); await wait(1300); }
    set(1, "Gerät schaltet sich gleich aus."); btn.hidden = false;
    const pressed = new Promise(r => btn.addEventListener("click", r, { once: true }));
    await Promise.race([pressed, wait(4000)]);
    btn.hidden = true;
    for (let v = 1; v <= 100; v += 3) { set(Math.min(v, 100), "Lade mit Lachenergie …"); lvl.style.background = v > 50 ? "#39ff7a" : "#ffc23d"; await wait(30); }
    set(100, "Voll geladen ✓"); await wait(900);
    reveal("Akku-Panik", "Akku? Alles gut.", "Die Anzeige war erfunden. Dein echter Akku hat davon nichts mitbekommen.");
  }

  /* ---------- 6) Rickroll mit Tarnung ---------- */
  async function rick() {
    document.title = "Vertrauliches Video";
    show("rick");
    const bar = $("rbar"), msg = $("rmsg");
    const steps = ["Entschlüssele Stream", "Prüfe Freigabe", "Freigabe erteilt ✓"];
    for (let v = 0; v <= 100; v += 5) { bar.style.width = v + "%"; msg.textContent = steps[Math.min(2, v / 40 | 0)]; await wait(110); }
    await count; // Opfer zählen, bevor die Seite weg ist
    location.replace("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  }

  /* ---------- 7) Hacker-Übernahme ---------- */
  async function hack() {
    document.title = "!!!";
    show("hack");
    const term = $("hterm"), sc = $("hack");
    const cv = $("hackcv"), g = fit(cv), W = innerWidth, H = innerHeight;
    // Matrix-Regen im Hintergrund, wird mit der Zeit rot
    const GLYPHS = "01アカサタナハマ#$%<>{}";
    const cols = Math.ceil(W / 14), drops = Array.from({ length: cols }, () => Math.random() * -50);
    let red = false, run = true;
    const rain = () => {
      g.fillStyle = "rgba(0,0,0,.12)"; g.fillRect(0, 0, W, H);
      g.font = "14px monospace"; g.fillStyle = red ? "rgba(255,77,109,.55)" : "rgba(57,255,122,.35)";
      drops.forEach((y, i) => { g.fillText(GLYPHS[Math.random() * GLYPHS.length | 0], i * 14, y * 14); drops[i] = y * 14 > H && Math.random() > .97 ? 0 : y + 1; });
      if (run) setTimeout(rain, 45);
    };
    rain();

    const ua = navigator.userAgent;
    const dev = (/Android [\d.]+; ([^;)]+)/.exec(ua) || [])[1]?.replace(/ Build.*/, "") || (/iPhone/.test(ua) ? "iPhone" : "Gerät");
    let bat = "";
    try { const b = await navigator.getBattery(); bat = Math.round(b.level * 100) + " %"; } catch {}
    const line = async (s, cls = "", ms = 14) => {
      const el = document.createElement("span"); if (cls) el.className = cls; term.append(el);
      for (const c of s) { el.textContent += c; if (ms) await wait(ms); }
      term.append("\n");
    };
    await line("root@bene-c2:~# ./nfc_takeover --target local", "w", 30);
    await line(`[+] Ziel verbunden: ${dev}${bat ? " · Akku " + bat : ""}`);
    await line(`[+] Bildschirm: ${screen.width}x${screen.height} · ${navigator.hardwareConcurrency || "?"} Kerne · ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
    await line("[*] Umgehe Sperrbildschirm ......... OK");
    await line("[*] Lade Payload kartoffel.bin ...... OK");
    await line("[*] Kamera wird aktiviert ........... OK");
    await line("[*] Kopiere Chatverläufe ............ 87 %");
    await line("[!] Zielperson schaut gerade aufs Display", "r");
    buzz([100, 50, 100]);
    red = true; sc.classList.add("red", "glitch");
    await wait(900);
    sc.classList.remove("glitch");
    term.textContent = "";
    const big = $("hbig");
    big.style.display = "block";
    for (const s of ["SYSTEM\nÜBERNOMMEN", "3", "2", "1"]) { big.textContent = s; buzz(70); sc.classList.add("glitch"); await wait(200); sc.classList.remove("glitch"); await wait(800); }
    run = false;
    reveal("Hacker-Angriff", "Gehackt? Nö.",
      "Nichts davon ist passiert. Die Gerätedaten oben verrät dein Browser aber wirklich jeder Website. Und du hast gerade einem unbekannten Chip vertraut. So beginnt echtes Phishing.");
  }

  /* ---------- 8) Captcha aus der Hölle ---------- */
  async function captcha() {
    document.title = "Sicherheitsprüfung";
    show("captcha");
    const grid = $("cgrid"), q = $("cq"), step = $("cstep"), err = $("cerr"), btn = $("cbtn");
    const rounds = [
      { q: "Wähle alle Bilder mit <b>Ampeln</b>", items: "🚦🚗🚦🌳🚦🏠🚦🚲🚦", err: "Bitte versuche es erneut." },
      { q: "Wähle alle Bilder mit <b>Gefühlen</b>", items: "😐😑😶🙂😐😑🫥😐😶", err: "Das war nicht emotional genug." },
      { q: "Wähle das Bild, das <b>am meisten nach Dienstag</b> aussieht", items: "🥔🥔🥔🥔🥔🥔🥔🥔🥔", err: "Falsche Kartoffel." },
      { q: "Wähle alle Bilder, auf denen <b>kein Roboter</b> zu sehen ist", items: "🤖🤖🤖🤖🤖🤖🤖🤖🤖", err: "" },
    ];
    for (let i = 0; i < rounds.length; i++) {
      const r = rounds[i];
      q.innerHTML = r.q; step.textContent = `Schritt ${i + 1} von ${rounds.length}`; err.textContent = "";
      grid.innerHTML = [...r.items].filter(c => c.trim() && c !== "️").map(c => `<div>${c}</div>`).join("");
      grid.querySelectorAll("div").forEach(d => d.addEventListener("click", () => d.classList.toggle("sel")));
      await Promise.race([new Promise(res => btn.addEventListener("click", res, { once: true })), wait(i === rounds.length - 1 ? 9000 : 15000)]);
      if (r.err) { err.textContent = r.err; buzz(150); await wait(1100); }
    }
    reveal("Captcha", "Ergebnis: Roboter.", "Laut unserer Prüfung bist du zu 97 % ein Toaster. Herzlichen Glückwunsch, Toaster.");
  }

  // Semmel-Gutschein (eigene Seite) gehört auch zur Wundertüte
  const semmel = () => count.finally(() => location.replace("/semmel.html"));

  /* ---------- Auswahl: nie zweimal derselbe hintereinander ---------- */
  const PRANKS = { crack, update, gravity, orakel, akku, semmel, rick, hack, captcha };
  const forced = new URLSearchParams(location.search).get("p");
  const keys = Object.keys(PRANKS);
  const last = store.get("chaos.last");
  const pool = keys.filter(k => k !== last);
  const pick = PRANKS[forced] ? forced : pool[Math.random() * pool.length | 0];
  if (PRANKS[forced] && $("rmore")) { $("rmore").textContent = ""; $("again").textContent = "Noch mehr Streiche"; }
  store.set("chaos.last", pick);
  PRANKS[pick]();
})();
