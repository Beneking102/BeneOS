"use strict";
/* Lebendige Apps: Cyber Globe (simulierte Angriffe), Task-Manager (echte Messwerte), Synthwave-Radio
   (generative Musik per Web Audio + Visualizer), BeneBot (regelbasierter Assistent). */
window.EXTRA_APPS = window.EXTRA_APPS || {};
(() => {
  const A = window.EXTRA_APPS;
  const rnd = n => Math.floor(Math.random() * n);
  const pick = a => a[rnd(a.length)];

  /* ---------- Cyber Globe ---------- */
  const POLYS = [
    [[-168, 66], [-140, 70], [-95, 72], [-80, 63], [-62, 60], [-55, 50], [-67, 44], [-76, 35], [-81, 25], [-97, 26], [-105, 22], [-117, 32], [-124, 40], [-124, 49], [-135, 58], [-150, 60]],
    [[-80, 10], [-60, 11], [-50, 0], [-35, -7], [-40, -22], [-58, -38], [-68, -54], [-74, -45], [-72, -20], [-81, -5]],
    [[-10, 36], [-9, 44], [-2, 48], [5, 52], [10, 56], [22, 60], [30, 70], [40, 68], [40, 55], [30, 45], [26, 40], [20, 40], [12, 38], [5, 43]],
    [[-17, 21], [-6, 36], [10, 37], [32, 31], [43, 12], [51, 11], [40, -5], [35, -25], [20, -35], [12, -17], [9, 4], [-8, 5], [-17, 14]],
    [[40, 55], [60, 72], [100, 77], [140, 72], [170, 66], [160, 55], [142, 46], [122, 30], [110, 20], [104, 8], [98, 16], [80, 10], [72, 22], [56, 25], [45, 12], [35, 31], [26, 40]],
    [[114, -22], [130, -12], [142, -11], [153, -27], [146, -39], [130, -32], [114, -34]],
  ];
  const inPoly = (x, y, p) => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, yi] = p[i], [xj, yj] = p[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  let LAND = null;
  const landDots = () => {
    if (LAND) return LAND;
    LAND = [];
    for (let la = -80; la <= 80; la += 3) for (let lo = -180; lo < 180; lo += 3) if (POLYS.some(p => inPoly(lo, la, p))) LAND.push([la, lo]);
    return LAND;
  };
  const CITIES = [["San Francisco", 37.8, -122.4], ["New York", 40.7, -74], ["Toronto", 43.7, -79.4], ["Mexico-Stadt", 19.4, -99.1], ["São Paulo", -23.5, -46.6], ["London", 51.5, -.1],
    ["Frankfurt", 50.1, 8.7], ["München", 48.1, 11.6], ["Moskau", 55.7, 37.6], ["Lagos", 6.5, 3.4], ["Kairo", 30, 31], ["Johannesburg", -26.2, 28], ["Dubai", 25.2, 55.3],
    ["Mumbai", 19, 72.9], ["Singapur", 1.35, 103.8], ["Jakarta", -6.2, 106.8], ["Peking", 39.9, 116.4], ["Seoul", 37.6, 127], ["Tokio", 35.7, 139.7], ["Sydney", -33.9, 151.2]];
  const ATTACKS = [["DDoS", "#ff3b5c"], ["Brute-Force", "#ffb020"], ["SQL-Injection", "#ff2bd6"], ["Phishing", "#a66bff"], ["Ransomware", "#ff3b5c"], ["XSS", "#39ff88"], ["Port-Scan", "#7aa2ff"]];
  const vec = (la, lo) => { const p = la * Math.PI / 180, l = lo * Math.PI / 180; return [Math.cos(p) * Math.sin(l), Math.sin(p), Math.cos(p) * Math.cos(l)]; };

  A.globe = {
    title: "Cyber Globe", icon: "🌍", group: "Security Lab", w: 660, h: 640,
    render(body, win) {
      const W = 620, H = 420, R = 170;
      body.innerHTML = `<div class="pad" style="padding-bottom:8px"><div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:6px"><h1 style="margin:0">Cyber Globe</h1><span class="tag">SIMULATION – keine echten Angriffe</span></div>
        <canvas class="game" id="gc" width="${W}" height="${H}" style="width:100%;cursor:grab;margin-top:8px"></canvas>
        <div class="kv" style="margin:8px 0"><span>Events</span><b id="gn">0</b><span>Ziel „Home“ (München)</span><b id="gh">0</b></div>
        <div class="gfeed" id="gf"></div></div>`;
      const cv = $("#gc", body), g = cv.getContext("2d"), feed = $("#gf", body);
      const dots = landDots(), tilt = .35;
      let yaw = 0, drag = null, arcs = [], pulses = [], spawn = 0, total = 0, home = 0, last = 0, raf = 0;
      const rot = (v, y) => { const c = Math.cos(y), s = Math.sin(y); let [x, yy, z] = [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c]; const ct = Math.cos(tilt), st = Math.sin(tilt); return [x, yy * ct - z * st, yy * st + z * ct]; };
      const proj = v => [W / 2 + v[0] * R, H / 2 - v[1] * R];
      const slerp = (a, b, t) => { const d = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])), om = Math.acos(d), so = Math.sin(om) || 1; const k1 = Math.sin((1 - t) * om) / so, k2 = Math.sin(t * om) / so; return [0, 1, 2].map(i => a[i] * k1 + b[i] * k2); };
      const cityV = CITIES.map(c => vec(c[1], c[2]));
      const event = () => {
        let a = rnd(CITIES.length), b = rnd(CITIES.length); if (a === b) b = (b + 1) % CITIES.length;
        if (Math.random() < .12) b = 7;               // gelegentlich Ziel "Home"
        const at = pick(ATTACKS);
        arcs.push({ a: cityV[a], b: cityV[b], t: 0, c: at[1], dst: b });
        total++; if (b === 7) home++;
        const d = document.createElement("div"); d.className = "gline";
        d.textContent = `${new Date().toLocaleTimeString("de-DE")}  ${at[0].padEnd(13)} ${CITIES[a][0]} → ${CITIES[b][0]}`;
        d.style.setProperty("--c", at[1]);
        feed.prepend(d); while (feed.children.length > 6) feed.lastChild.remove();
        $("#gn", body).textContent = total; $("#gh", body).textContent = home;
      };
      const frame = t => {
        raf = requestAnimationFrame(frame);
        const dt = Math.min(.05, (t - (last || t)) / 1000); last = t;
        if (win.classList.contains("hidden") || document.hidden) return;
        if (!drag) yaw += dt * .25;
        spawn -= dt; if (spawn <= 0) { event(); spawn = .7 + Math.random() * 1.1; }
        g.clearRect(0, 0, W, H);
        const grad = g.createRadialGradient(W / 2 - 40, H / 2 - 50, 10, W / 2, H / 2, R);
        grad.addColorStop(0, "rgba(20,40,80,.9)"); grad.addColorStop(1, "rgba(4,8,20,.95)");
        g.fillStyle = grad; g.beginPath(); g.arc(W / 2, H / 2, R, 0, 7); g.fill();
        g.strokeStyle = settings.accent; g.globalAlpha = .5; g.lineWidth = 1.5; g.shadowColor = settings.accent; g.shadowBlur = 18; g.stroke(); g.shadowBlur = 0; g.globalAlpha = 1;
        // Gitternetz
        g.strokeStyle = "rgba(255,255,255,.06)"; g.lineWidth = 1;
        for (let la = -60; la <= 60; la += 30) { g.beginPath(); let on = false; for (let lo = -180; lo <= 180; lo += 10) { const v = rot(vec(la, lo), yaw); if (v[2] > 0) { const [x, y] = proj(v); on ? g.lineTo(x, y) : g.moveTo(x, y); on = true; } else on = false; } g.stroke(); }
        // Land
        g.fillStyle = settings.accent;
        for (const [la, lo] of dots) { const v = rot(vec(la, lo), yaw); if (v[2] > .02) { g.globalAlpha = .25 + v[2] * .55; const [x, y] = proj(v); g.fillRect(x - .8, y - .8, 1.8, 1.8); } }
        g.globalAlpha = 1;
        // Städte
        cityV.forEach((cv_, i) => { const v = rot(cv_, yaw); if (v[2] > 0) { const [x, y] = proj(v); g.fillStyle = i === 7 ? settings.accent2 : "#fff"; g.beginPath(); g.arc(x, y, i === 7 ? 3.5 : 2, 0, 7); g.fill(); } });
        // Angriffe
        arcs = arcs.filter(a => { a.t += dt / 2.2; if (a.t >= 1) { pulses.push({ v: a.b, c: a.c, t: 0 }); sfx("block"); return false; } return true; });
        arcs.forEach(a => {
          g.strokeStyle = a.c; g.lineWidth = 1.6; g.shadowColor = a.c; g.shadowBlur = 8; g.beginPath(); let on = false;
          for (let i = 0; i <= 36; i++) { const u = i / 36; if (u > a.t) break; const s = slerp(a.a, a.b, u), k = 1 + .28 * Math.sin(Math.PI * u), v = rot(s.map(x => x * k), yaw); if (v[2] > -.05) { const [x, y] = proj(v); on ? g.lineTo(x, y) : g.moveTo(x, y); on = true; } else on = false; }
          g.stroke(); g.shadowBlur = 0;
        });
        pulses = pulses.filter(p => (p.t += dt) < 1);
        pulses.forEach(p => { const v = rot(p.v, yaw); if (v[2] > 0) { const [x, y] = proj(v); g.strokeStyle = p.c; g.globalAlpha = 1 - p.t; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 3 + p.t * 22, 0, 7); g.stroke(); g.globalAlpha = 1; } });
      };
      cv.addEventListener("pointerdown", e => { drag = { x: e.clientX, y: yaw }; cv.setPointerCapture(e.pointerId); cv.style.cursor = "grabbing"; });
      cv.addEventListener("pointermove", e => { if (drag) yaw = drag.y + (e.clientX - drag.x) / 120; });
      const up = () => { drag = null; cv.style.cursor = "grab"; };
      cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
      achieve("globe"); event(); raf = requestAnimationFrame(frame);
      return () => cancelAnimationFrame(raf);
    },
  };

  /* ---------- Task-Manager (echte Messwerte) ---------- */
  A.sysmon = {
    title: "Task-Manager", icon: "📊", group: "System", w: 640, h: 560,
    render(body, win) {
      body.innerHTML = `<div class="pad"><div class="statrow" id="ss"></div>
        <canvas class="game" id="sg" width="600" height="110" style="width:100%;margin:10px 0 4px"></canvas><div class="dim" style="font-size:11px;display:flex;justify-content:space-between"><span><i class="dotc" style="background:var(--accent)"></i> FPS</span><span><i class="dotc" style="background:var(--accent2)"></i> JS-Heap</span></div>
        <h2>Prozesse (offene Fenster)</h2><table class="tbl" id="st"></table></div>`;
      const g = $("#sg", body).getContext("2d"), fpsH = Array(60).fill(0), heapH = Array(60).fill(0);
      let frames = 0, fps = 0, bat = null, alive = true, raf = 0;
      const count = t => { raf = requestAnimationFrame(count); frames++; };
      raf = requestAnimationFrame(count);
      if (navigator.getBattery) navigator.getBattery().then(b => { bat = b; }).catch(() => {});
      const mb = n => (n / 1048576).toFixed(1) + " MB";
      const tick = () => {
        if (!alive) return;
        fps = frames; frames = 0;
        const mem = performance.memory ? performance.memory.usedJSHeapSize : null, c = navigator.connection;
        fpsH.push(fps); fpsH.shift(); heapH.push(mem || 0); heapH.shift();
        const cards = [["FPS", fps], ["JS-Heap", mem ? mb(mem) : "n/a"], ["DOM-Knoten", document.getElementsByTagName("*").length], ["Fenster", Object.keys(open).length],
          ["Netzwerk", navigator.onLine ? (c ? `${c.effectiveType} · ${c.downlink} Mbit/s` : "online") : "offline"], ["Akku", bat ? `${Math.round(bat.level * 100)}%${bat.charging ? " ⚡" : ""}` : "–"],
          ["CPU-Kerne", navigator.hardwareConcurrency || "–"], ["Modus", settings.lite ? "Performance" : "Standard"]];
        $("#ss", body).innerHTML = cards.map(([k, v]) => `<div class="stat"><span>${k}</span><b>${esc(String(v))}</b></div>`).join("");
        g.clearRect(0, 0, 600, 110);
        g.strokeStyle = "rgba(255,255,255,.07)"; for (let y = 0; y <= 110; y += 22) { g.beginPath(); g.moveTo(0, y); g.lineTo(600, y); g.stroke(); }
        const line = (arr, max, col, fill) => { g.beginPath(); arr.forEach((v, i) => { const x = i * 600 / 59, y = 108 - Math.min(1, v / max) * 104; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.strokeStyle = col; g.lineWidth = 2; g.stroke(); if (fill) { g.lineTo(600, 110); g.lineTo(0, 110); g.fillStyle = fill; g.fill(); } };
        line(fpsH, 70, settings.accent, "rgba(0,240,255,.08)");
        if (mem) line(heapH, Math.max(...heapH) * 1.2 || 1, settings.accent2);
        const rows = Object.entries(open).map(([id, e]) => {
          const hidden = e.win.classList.contains("hidden"), nodes = e.win.getElementsByTagName("*").length;
          return `<tr><td>${iconHTML(id)} ${esc(APPS[id].title)}</td><td>${hidden ? "minimiert" : e.win.classList.contains("active") ? "aktiv" : "läuft"}</td><td>${e.win.dataset.ws ? "Desktop " + e.win.dataset.ws : "–"}</td><td>${nodes}</td><td><button class="btn" data-kill="${esc(id)}">Beenden</button></td></tr>`;
        });
        $("#st", body).innerHTML = `<tr><th>Name</th><th>Status</th><th>Desktop</th><th>DOM-Knoten</th><th></th></tr>${rows.join("")}`;
      };
      $("#st", body).onclick = e => { const k = e.target.closest("[data-kill]"); if (k) { if (k.dataset.kill === "sysmon") { closeApp("sysmon"); return; } closeApp(k.dataset.kill); tick(); } };
      tick();
      const iv = setInterval(() => { if (!win.classList.contains("hidden") && !document.hidden) tick(); }, 1000);
      return () => { alive = false; clearInterval(iv); cancelAnimationFrame(raf); };
    },
  };

  /* ---------- Synthwave-Radio ---------- */
  const STATIONS = [
    { name: "Neon Drive", bpm: 104, wave: "sawtooth", kind: "drive", chords: [[0, [0, 3, 7]], [-4, [0, 4, 7]], [3, [0, 4, 7]], [-2, [0, 4, 7]]], desc: "Synthwave · 104 BPM · Am – F – C – G" },
    { name: "Dark Net", bpm: 86, wave: "square", kind: "dark", chords: [[0, [0, 3, 7]], [0, [0, 3, 7]], [-4, [0, 4, 7]], [-5, [0, 4, 7]]], desc: "Dark Techno · 86 BPM · Am – Am – F – E" },
    { name: "Lo-Fi Terminal", bpm: 72, wave: "triangle", kind: "lofi", chords: [[0, [0, 3, 7, 10]], [5, [0, 3, 7, 10]], [-2, [0, 4, 7, 10]], [3, [0, 4, 7, 11]]], desc: "Lo-Fi · 72 BPM · Am7 – Dm7 – G7 – Cmaj7" },
  ];
  A.radio = {
    title: "Synthwave Radio", icon: "📻", group: "Fun", w: 560, h: 470,
    render(body, win) {
      let st = store.get("radio-st", 0), playing = false, bus = null, an = null, ctx = null, timer = 0, nextT = 0, step = 0, raf = 0, vis = null;
      const hz = n => 110 * Math.pow(2, n / 12);
      body.innerHTML = `<div class="pad"><h1>Synthwave Radio</h1><div class="dim">Generative Musik – live in deinem Browser synthetisiert, keine Audiodateien.</div>
        <div class="stations" id="rs">${STATIONS.map((s, i) => `<button class="station ${i === st ? "on" : ""}" data-s="${i}"><b>${s.name}</b><small>${s.desc}</small></button>`).join("")}</div>
        <canvas class="game" id="rv" width="520" height="140" style="width:100%;margin-top:10px"></canvas>
        <div class="opbar" style="justify-content:center;margin-top:12px"><button class="btn" id="rp" style="font-size:18px;padding:6px 26px">▶ Abspielen</button></div>
        <div class="dim" id="rn" style="text-align:center;margin-top:8px;min-height:20px"></div><div class="dim" style="text-align:center;font-size:11.5px">Lautstärke: Einstellungen oder Control Center 🎛</div></div>`;
      const cv = $("#rv", body), g = cv.getContext("2d");

      const tone = (f, t, dur, type, vol, lp) => {
        const o = ctx.createOscillator(), gn = ctx.createGain(); o.type = type; o.frequency.value = f;
        gn.gain.setValueAtTime(.0001, t); gn.gain.exponentialRampToValueAtTime(vol, t + .01); gn.gain.exponentialRampToValueAtTime(.0001, t + dur);
        let out = gn; if (lp) { const fl = ctx.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.value = lp; gn.connect(fl); out = fl; }
        o.connect(gn); out.connect(bus); o.start(t); o.stop(t + dur + .05);
      };
      const noise = (t, dur, vol, f, type = "highpass") => {
        const n = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
        const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), gn = ctx.createGain(); s.buffer = buf; fl.type = type; fl.frequency.value = f; gn.gain.value = vol;
        s.connect(fl); fl.connect(gn); gn.connect(bus); s.start(t);
      };
      const kick = (t, v = .9) => { const o = ctx.createOscillator(), gn = ctx.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + .14); gn.gain.setValueAtTime(v, t); gn.gain.exponentialRampToValueAtTime(.001, t + .28); o.connect(gn); gn.connect(bus); o.start(t); o.stop(t + .3); };
      const pad = (t, dur, notes, wave, vol) => notes.forEach(n => [-6, 6].forEach(dt => {
        const o = ctx.createOscillator(), gn = ctx.createGain(), fl = ctx.createBiquadFilter(); o.type = wave; o.frequency.value = hz(n + 12); o.detune.value = dt;
        fl.type = "lowpass"; fl.frequency.value = 900; gn.gain.setValueAtTime(.0001, t); gn.gain.linearRampToValueAtTime(vol, t + dur * .35); gn.gain.linearRampToValueAtTime(.0001, t + dur);
        o.connect(fl); fl.connect(gn); gn.connect(bus); o.start(t); o.stop(t + dur + .1);
      }));

      const schedule = (s, i, t) => {
        const bar = ((i / 16) | 0) % s.chords.length, k = i % 16, [root, iv] = s.chords[bar], sd = 60 / s.bpm / 4, barDur = sd * 16;
        if (k === 0) pad(t, barDur * 1.05, iv.map(x => root + x), s.kind === "lofi" ? "triangle" : "sawtooth", s.kind === "dark" ? .05 : .035);
        if (s.kind === "drive") {
          if (k % 4 === 0) kick(t);
          if (k === 4 || k === 12) noise(t, .12, .35, 1800, "bandpass");
          if (k % 2 === 1) noise(t, .04, .12, 7000);
          tone(hz(root - 12), t, sd * 1.8, "sawtooth", .22, 500);
          if (k % 2 === 0 || k % 4 === 3) tone(hz(root + iv[(k >> 1) % iv.length] + 12), t, sd * .9, "square", .07, 2600);
        } else if (s.kind === "dark") {
          if (k === 0 || k === 6 || k === 10) kick(t, 1);
          if (k % 2 === 0) noise(t, .03, .08, 8000);
          if (k === 12) noise(t, .16, .3, 1200, "bandpass");
          if (k === 0 || k === 8) tone(hz(root - 24), t, sd * 7, "sine", .4);
          if (k % 4 === 2) tone(hz(root + iv[(k >> 2) % iv.length] + 24), t, sd * 2, "triangle", .06, 3000);
        } else {
          if (k === 0 || k === 10) kick(t, .6);
          if (k === 4 || k === 12) noise(t, .1, .22, 1500, "bandpass");
          if (k % 4 === 2) noise(t, .03, .07, 6500);
          if (k % 8 === 0) iv.forEach((x, j) => tone(hz(root + x + 12), t + j * .03, sd * 6, "sine", .06, 1800));
          if (k === 6 || k === 14) tone(hz(root + iv[(k >> 3) % iv.length] + 24), t, sd * 2, "triangle", .08, 2200);
          if (Math.random() < .25) noise(t + Math.random() * sd, .008, .12, 4000);
        }
      };
      const pump = () => {
        const s = STATIONS[st], sd = 60 / s.bpm / 4;
        while (nextT < ctx.currentTime + .15) { schedule(s, step, nextT); nextT += sd * (s.kind === "lofi" && step % 2 ? 1.12 : s.kind === "lofi" ? .88 : 1); step++; }
      };
      const info = () => { $("#rn", body).textContent = playing ? `♪ Läuft: ${STATIONS[st].name}` : ""; };
      const start = () => {
        const n = SFX.node(); if (!n) { $("#rn", body).textContent = "Audio wird von diesem Browser nicht unterstützt."; return; }
        ctx = n.ctx; bus = ctx.createGain(); bus.gain.value = .9; an = ctx.createAnalyser(); an.fftSize = 128; an.smoothingTimeConstant = .8;
        bus.connect(n.out); bus.connect(an);
        vis = new Uint8Array(an.frequencyBinCount); nextT = ctx.currentTime + .1; step = 0; playing = true;
        timer = setInterval(pump, 25); $("#rp", body).textContent = "■ Stopp"; info(); achieve("radio");
      };
      const stop = () => {
        playing = false; clearInterval(timer);
        if (bus) { const b = bus; try { b.gain.setTargetAtTime(0, ctx.currentTime, .08); } catch { /* egal */ } setTimeout(() => { try { b.disconnect(); } catch { /* egal */ } }, 600); }
        bus = null; $("#rp", body).textContent = "▶ Abspielen"; info();
      };
      const draw = () => {
        raf = requestAnimationFrame(draw);
        if (win.classList.contains("hidden") || document.hidden) return;
        g.clearRect(0, 0, 520, 140);
        const N = 40, bw = 520 / N;
        if (playing && an) an.getByteFrequencyData(vis);
        const grad = g.createLinearGradient(0, 140, 0, 0); grad.addColorStop(0, settings.accent); grad.addColorStop(1, settings.accent2);
        g.fillStyle = grad;
        for (let i = 0; i < N; i++) { const v = playing && an ? vis[Math.floor(i * 1.1) + 1] / 255 : .03 + .02 * Math.sin(performance.now() / 600 + i); const h = Math.max(3, v * 130); g.fillRect(i * bw + 2, 140 - h, bw - 4, h); }
      };
      $("#rp", body).onclick = () => (playing ? stop() : start());
      $("#rs", body).onclick = e => {
        const b = e.target.closest("[data-s]"); if (!b) return;
        st = +b.dataset.s; store.set("radio-st", st); body.querySelectorAll(".station").forEach(x => x.classList.toggle("on", x === b));
        step = 0; if (playing) nextT = ctx.currentTime + .1; info(); sfx("menu");
      };
      raf = requestAnimationFrame(draw);
      return () => { cancelAnimationFrame(raf); if (playing) stop(); };
    },
  };

  /* ---------- BeneBot ---------- */
  const norm = s => s.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9äöü\s.\-+]/g, " ").replace(/\s+/g, " ").trim();
  const HINTS = [
    "Base64 ist keine Verschlüsselung – die erste CTF-Aufgabe lässt sich mit dem Cipher Lab lösen.",
    "Das Cipher Lab kann Base64, Hex und ROT13. Das sind drei Aufgaben auf einmal.",
    "Manche Flags verstecken sich in der Browser-Konsole (F12), sobald du das CTF-Fenster öffnest.",
    "Das Terminal kann mehr, als es zeigt: probier ls, cat und – nach einem nmap-Scan – nc.",
    "Am Login-Screen zählen die Klassiker: unter „Anderer“ probiert man gern admin mit dem naheliegendsten Passwort.",
    "Im Datei-Explorer gibt es versteckte Dateien – die Checkbox oben rechts verrät sie.",
    "Manche Cheats sind älter als das Web: ↑ ↑ ↓ ↓ ← → ← → B A.",
    "Das Terminal reagiert auf gefährliche Befehle … aber nur zum Spaß. Und den Schreibtisch kann man jederzeit neu starten.",
  ];
  const JOKES = ["Warum nehmen Hacker immer Münzen mit? Weil sie Cookies klauen wollen… und Kleingeld ist auch gut. 🍪", "Es gibt 10 Arten von Menschen: Die, die Binärcode verstehen, und die anderen.", "SQL-Abfrage geht in eine Bar, geht zu zwei Tischen und fragt: „Darf ich mich JOINen?“", "Mein Passwort ist „falsch“ – damit sagt mir der Browser immer: „Dein Passwort ist falsch.“", "Ein Pentester ist jemand, der das Schloss öffnet – mit Erlaubnis. 🔓"];
  const TIPS = [
    "Strg+K öffnet die Suche – damit startest du jede App in Sekunden.",
    "Zieh ein Fenster an den linken, rechten oder oberen Rand: es rastet ein (Snap).",
    "Rechtsklick auf den Desktop öffnet das Schnellmenü.",
    "Mit Strg+Alt+1/2/3 wechselst du zwischen virtuellen Desktops.",
    "Das Control Center 🎛 (unten rechts) schaltet Hintergründe, Farben und Sound um.",
    "Im Terminal: dig benedikt-pkr.info fragt echtes DNS ab.",
    "Das Radio 📻 spielt generative Synthwave – komplett live synthetisiert.",
    "Der Tresor 🔐 verschlüsselt Notizen mit AES-256 – lokal in deinem Browser.",
    "Du kannst Desktop-Icons per Drag & Drop umsortieren.",
  ];
  window.BENEBOT_TIPS = TIPS;
  const COLORS = { cyan: "cyan", pink: "pink", gruen: "green", green: "green", orange: "orange", lila: "purple", purple: "purple", rot: "red", red: "red", gold: "gold", gelb: "gold", eis: "ice", ice: "ice" };
  const WALLS = { matrix: "matrix", synthwave: "grid", grid: "grid", sterne: "stars", stars: "stars", sternenflug: "stars", aurora: "aurora", aus: "off", off: "off" };

  function findApp(q) {
    q = norm(q).replace(/^(das|die|den|der|mal|bitte|app|programm|fenster)\s+/g, "").replace(/\s+(bitte|mal|auf|an)$/g, "").trim();
    if (!q) return null;
    const entries = Object.entries(APPS);
    return (entries.find(([id, a]) => norm(a.title) === q || id.toLowerCase() === q || id.toLowerCase() === "repo:" + q)
      || entries.find(([id, a]) => norm(a.title).includes(q) || id.toLowerCase().includes(q)) || [])[0] || null;
  }
  const btn = (id, label) => `<button class="chip" data-open="${esc(id)}">${esc(label)}</button>`;

  function answer(raw) {
    const t = norm(raw), words = new Set(t.split(" "));
    // Lange Begriffe (>= 5 Zeichen) oder solche mit Leerzeichen: Teilstring. Kurze Begriffe: ganzes Wort (verhindert "ton" in "python").
    const has = (...w) => w.some(x => (x.length >= 5 || x.includes(" ") ? t.includes(x) : words.has(x)));
    let m;
    // Aktionen
    if ((m = t.match(/^(oeffne|starte|zeige|open|start|launch)\s+(.+)/))) {
      const id = findApp(m[2]);
      if (id) { openApp(id); return `Klar, ich öffne <b>${esc(APPS[id].title)}</b>. ${APPS[id].icon}`; }
      if (!/^zeig/.test(m[1])) return `Eine App namens „${esc(m[2])}“ kenne ich nicht. Probier z. B. ${btn("terminal", "Terminal")} ${btn("ctf", "Mini CTF")} ${btn("projects", "Repo Explorer")}`;
    }
    if (has("hintergrund", "wallpaper") && (m = Object.keys(WALLS).find(k => t.split(" ").includes(k)))) { settings.wallpaper = WALLS[m]; applySettings(); achieve("wallpaper"); return `Hintergrund gewechselt: <b>${Wallpaper.labels[WALLS[m]]}</b> 🖼`; }
    if (has("theme", "farbe", "farbschema", "color") && (m = Object.keys(COLORS).find(k => t.split(" ").includes(k)))) { [settings.accent, settings.accent2] = THEME_NAMES[COLORS[m]]; applySettings(); achieve("theme"); return `Farbschema <b>${esc(COLORS[m])}</b> ist aktiv. 🎨`; }
    if (has("sound", "sounds", "ton", "audio")) { if (has("aus", "stumm", "off", "leise")) { settings.sound = false; applySettings(); return "Sounds sind jetzt aus. 🔇"; } if (has("an", "ein", "on")) { settings.sound = true; applySettings(); sfx("notify"); return "Sounds sind an. 🔊"; } }
    if (has("performance", "lite", "ruckelt", "langsam")) { settings.lite = !has("aus", "off", "normal"); applySettings(); return settings.lite ? "⚡ Performance-Modus an: kein Blur, keine Animationen." : "Performance-Modus aus – volle Optik." ; }
    if (has("sperr", "lock")) { setTimeout(lockScreen, 500); return "Ich sperre den Bildschirm … 🔒"; }
    if (has("uhr", "uhrzeit", "wie spaet")) return `Es ist <b>${new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}</b> Uhr.`;
    if (has("witz", "joke", "lustig")) return esc(pick(JOKES));
    if (has("tipp", "tip", "trick")) return "💡 " + esc(pick(TIPS));
    if (has("flag", "flags", "hinweis", "hint", "ctf", "haenge fest")) { const n = store.get("hint-n", 0); store.set("hint-n", n + 1); return `🚩 Hinweis ${n % HINTS.length + 1}/${HINTS.length}: ${esc(HINTS[n % HINTS.length])} <br>${btn("ctf", "Mini CTF öffnen")}`; }
    // Wissen
    if (has("ewptx", "zertifi", "cert", "certified")) { const c = (PROFILE.certs || [])[0]; return `🏅 <b>${esc(c.short)}</b> – ${esc(c.name)} (${esc(c.issuer)}). ${esc(c.note || "")} <br>${btn("certs", "Zertifikate ansehen")}`; }
    if (has("bene guard", "bene-guard", "vs code", "vscode", "extension")) { const h = PROFILE.highlights.find(x => x.name === "bene-guard"); return `🛡 <b>bene-guard</b>: ${esc(h.desc)} <br><a href="${esc(h.url)}" target="_blank" rel="noopener noreferrer">→ ansehen</a>`; }
    if (has("npm scanner", "npm-scanner", "scanner", "cve")) { const h = PROFILE.highlights.find(x => x.name === "bene-npm-scanner"); return `🔎 <b>bene-npm-scanner</b>: ${esc(h.desc)} <br><a href="${esc(h.url)}" target="_blank" rel="noopener noreferrer">→ ausprobieren</a>`; }
    if (has("benedictum", "esolang", "programmiersprache")) { const h = PROFILE.highlights.find(x => x.name === "Benedictum"); return `📜 <b>Benedictum</b>: ${esc(h.desc)}`; }
    if (has("projekt", "projekte", "repo", "repos", "github", "portfolio")) {
      const sec = REPOS.filter(isSec).slice(0, 4).map(r => btn("repo:" + r.name, r.name)).join(" ");
      return `Ich zeige dir Benes Arbeit: ${REPOS.length || "viele"} öffentliche Repos, jedes ist eine App auf dem Desktop. Security-Highlights: ${sec || "(lädt noch)"}<br>${btn("projects", "Repo Explorer")} ${btn("about", "Highlights")}`;
    }
    if (has("skill", "kann er", "faehig", "kenntnis", "stack", "technolog")) return `Bene kommt aus der Entwicklung (${esc((PROFILE.stack["Frontend"] || []).slice(0, 3).join(", "))}, Python …) und arbeitet heute als <b>Junior Cybersecurity Consultant</b>: Web-App-Pentesting, CVE-Analyse, Supply-Chain-Security, Threat Modeling. ${btn("about", "Profil & Tech-Stack")}`;
    if (has("kontakt", "erreich", "mail", "linkedin", "melden", "schreib", "anfrage", "hire", "einstell", "job", "zusammenarbeit")) return `Am besten erreichst du Bene über <a href="${esc(PROFILE.links[1].url)}" target="_blank" rel="noopener noreferrer">LinkedIn</a> oder seine <a href="${esc(PROFILE.links[2].url)}" target="_blank" rel="noopener noreferrer">Website</a>. ${btn("contact", "Alle Links")}`;
    if (has("wo wohn", "standort", "bayern", "wo bist", "ort ")) return `📍 ${esc(PROFILE.location)}.`;
    if (has("wer ist bene", "ueber bene", "ueber ihn", "wer bist du", "wer ist das", "vorstell", "about")) return `Das ist das Portfolio von <b>${esc(PROFILE.name)}</b> – ${esc(PROFILE.tagline)}. Ich bin BeneBot, ein kleiner Assistent ohne Cloud-KI: alles regelbasiert und lokal. ${btn("about", "Über mich")}`;
    if (has("datenschutz", "tracking", "cookie", "sicher", "daten ")) return "🔒 BeneOS hat kein Tracking, keine Cookies und keinen Server-Code. Notizen/Einstellungen liegen nur in deinem Browser. Das DNS Lab sendet Domainnamen an Cloudflare (das steht dort dabei), sonst verlässt nichts den Tab. Der Tresor verschlüsselt lokal mit AES-256-GCM.";
    if (has("technik", "gebaut", "framework", "wie funktioniert", "programmiert", "open source", "quellcode")) return `BeneOS ist reines HTML/CSS/JavaScript – kein Framework, kein Build. Canvas-Hintergründe, Web-Audio-Synthese, Service Worker. Quellcode: <a href="https://github.com/${esc(PROFILE.user)}/BeneOS" target="_blank" rel="noopener noreferrer">GitHub</a> (MIT).`;
    if (has("shortcut", "tastenkuerzel", "kuerzel", "tastatur")) return "⌨ <b>Strg+K</b> Suche · <b>Alt+W</b> Fenster schließen · <b>Alt+M</b> minimieren · <b>Strg+Alt+1/2/3</b> Desktops · <b>Strg+Alt+O</b> Übersicht · <b>Esc</b> Menüs schließen · Fenster an den Rand ziehen = Snap.";
    if (has("spiel", "spiele", "game", "games", "langweilig", "zocken")) return `Spielen? ${btn("tetris", "Tetris")} ${btn("mines", "Minesweeper")} ${btn("snake", "Snake")} ${btn("defender", "Packet Defender")} ${btn("typing", "Hacker Typing")}`;
    if (has("tools", "toolbox", "werkzeug", "security lab", "security-tools")) return `Das Security Lab: ${btn("toolbox", "Toolbox")} ${btn("dnslab", "DNS Lab")} ${btn("vault", "Tresor")} ${btn("cipher", "Cipher Lab")} ${btn("passlab", "Password Lab")} ${btn("hashbreak", "Hash Breaker")} ${btn("loghunter", "Log Hunter")} ${btn("globe", "Cyber Globe")}`;
    if (has("musik", "radio", "song")) return `Musik gibt's im ${btn("radio", "Synthwave Radio")} – live synthetisiert. 🎧`;
    if (has("danke", "thx", "thanks", "super", "cool", "geil")) return "Gern geschehen! 😎";
    if (has("hallo", "hi", "hey", "moin", "servus", "guten")) return "Hallo! 👋 Ich bin BeneBot. Frag mich nach Bene, seinen Projekten, dem eWPTX – oder sag mir, was ich öffnen oder umstellen soll.";
    if (has("hilfe", "help", "was kannst", "befehle", "funktion")) return `Ich kann: <br>• <b>Fragen beantworten</b> (Bene, Skills, eWPTX, Projekte, Kontakt)<br>• <b>Apps öffnen</b> („öffne Tetris“)<br>• <b>Einstellungen ändern</b> („Hintergrund aurora“, „Theme pink“, „Sound aus“)<br>• <b>CTF-Hinweise</b> geben, Witze erzählen, Tipps geben, den Bildschirm sperren.`;
    return `Hm, da bin ich überfragt. 🤔 Versuch es mit „Wer ist Bene?“, „Zeig mir die Security-Tools“ oder „Öffne das Terminal“.`;
  }

  A.bot = {
    title: "BeneBot", icon: "🤖", group: "System", w: 440, h: 560,
    render(body) {
      body.innerHTML = `<div class="chat"><div class="msgs" id="cm"></div>
        <div class="chips" id="cs" style="padding:6px 10px">${["Wer ist Bene?", "eWPTX?", "Zeig mir die Security-Tools", "Öffne das Terminal", "Gib mir einen Hinweis", "Erzähl einen Witz"].map(x => `<button class="chip">${x}</button>`).join("")}</div>
        <form id="cf" class="cform"><input class="field" id="ci" autocomplete="off" placeholder="Frag mich etwas …" aria-label="Nachricht" style="margin:0"><button class="btn">Senden</button></form></div>`;
      const msgs = $("#cm", body), input = $("#ci", body);
      const add = (who, html, isText) => { const d = el("div", "msg " + who); if (isText) d.textContent = html; else d.innerHTML = html; msgs.append(d); msgs.scrollTop = msgs.scrollHeight; return d; };
      const reply = text => {
        const d = add("bot", `<span class="typing"><i></i><i></i><i></i></span>`);
        setTimeout(() => { d.innerHTML = answer(text); msgs.scrollTop = msgs.scrollHeight; sfx("pop"); achieve("bot"); }, 350 + Math.min(700, text.length * 14));
      };
      const send = text => { text = text.trim().slice(0, 300); if (!text) return; add("me", text, true); sfx("click"); reply(text); };
      $("#cf", body).onsubmit = e => { e.preventDefault(); send(input.value); input.value = ""; };
      $("#cs", body).onclick = e => { const c = e.target.closest(".chip"); if (c) send(c.textContent); };
      add("bot", `Hi, ich bin <b>BeneBot</b> 🤖 – dein Guide durch BeneOS. Frag mich nach Bene, seinen Projekten oder dem eWPTX, oder sag mir, was ich öffnen soll.`);
      setTimeout(() => input.focus(), 50);
    },
  };
})();
