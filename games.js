"use strict";
/* Minispiele mit gemeinsamem Game-UI: HUD, Start-/Pause-/Game-Over-Screens, Highscores, Touch-Steuerung.
   Snake · Tetris · Minesweeper · Packet Defender · Hacker Typing · Phish or Legit?
   Wird vor os.js geladen und überschreibt dort ältere Versionen. */
window.EXTRA_APPS = window.EXTRA_APPS || {};
(() => {
  const A = window.EXTRA_APPS;
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      r = Math.min(typeof r === "number" ? r : 0, w / 2, h / 2);
      this.moveTo(x + r, y); this.arcTo(x + w, y, x + w, y + h, r); this.arcTo(x + w, y + h, x, y + h, r); this.arcTo(x, y + h, x, y, r); this.arcTo(x, y, x + w, y, r); this.closePath();
    };
  }
  const rnd = n => Math.floor(Math.random() * n);
  const pick = a => a[rnd(a.length)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const isActive = win => win.classList.contains("active") && !win.classList.contains("hidden");
  const best = { get: k => store.get("hs-" + k, 0), set: (k, v, lower) => { const o = store.get("hs-" + k, 0); const isNew = !o || (lower ? v < o : v > o); if (isNew) store.set("hs-" + k, v); return isNew; } };

  /* ---------- Gemeinsames Game-UI ---------- */
  function gameUI(body, o = {}) {
    body.innerHTML = `<div class="gm"><div class="gm-hud">${(o.hud || []).map(([k, l]) => `<div class="pill" data-k="${k}"><small>${esc(l)}</small><b>–</b></div>`).join("")}</div>
      <div class="gm-stage"><div class="gm-in"></div><div class="gm-ov" hidden></div></div><div class="gm-ctl"></div><div class="gm-foot">${esc(o.hint || "")}</div></div>`;
    const root = body.firstElementChild, ov = $(".gm-ov", root), ctl = $(".gm-ctl", root), hud = $(".gm-hud", root);
    return {
      root, stage: $(".gm-in", root), hudEl: hud,
      hud(k, v) { const b = $(`.pill[data-k="${k}"] b`, root); if (!b) return; const t = String(v); if (b.textContent !== t) { b.textContent = t; b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump"); } },
      overlay({ title, sub = "", badge = "", list = null, buttons = [] }) {
        ov.hidden = false; ov.innerHTML = "";
        const c = el("div", "gm-card"); if (badge) { const b = el("div", "gm-badge"); b.textContent = badge; c.append(b); }
        const h = el("h2"); h.textContent = title; c.append(h);
        if (sub) { const p = el("p"); p.textContent = sub; c.append(p); }
        if (list) { const ul = el("ul", "gm-list"); list.forEach(t => { const li = el("li"); li.textContent = t; ul.append(li); }); c.append(ul); }
        const bt = el("div", "gm-btns");
        buttons.forEach(b => { const x = el("button", "btn" + (b.primary ? " gm-primary" : "")); x.textContent = b.label; x.onclick = () => { sfx("click"); b.fn(); }; bt.append(x); });
        c.append(bt); ov.append(c);
        const first = $(".gm-primary", ov) || $("button", ov); if (first) setTimeout(() => first.focus({ preventScroll: true }), 30);
      },
      hide() { ov.hidden = true; ov.innerHTML = ""; },
      controls(rows) {
        ctl.innerHTML = "";
        rows.forEach(r => {
          const row = el("div", "gm-row");
          r.forEach(b => {
            const x = el("button", "gm-key"); x.textContent = b.l; x.setAttribute("aria-label", b.a || b.l); if (b.wide) x.style.flex = b.wide;
            let iv = 0; const stop = () => { clearInterval(iv); iv = 0; };
            x.addEventListener("pointerdown", e => { e.preventDefault(); b.fn(); if (b.hold) { stop(); iv = setInterval(b.fn, b.hold === true ? 110 : b.hold); } });
            ["pointerup", "pointerleave", "pointercancel"].forEach(ev => x.addEventListener(ev, stop));
            row.append(x);
          });
          ctl.append(row);
        });
      },
    };
  }
  window.GameUI = gameUI;

  /* ---------- SNAKE ---------- */
  A.snake = {
    title: "Snake", icon: "🐍", group: "Fun", w: 540, h: 760,
    render(body, win) {
      const N = 20, S = 24, SZ = N * S;
      const ui = gameUI(body, { hud: [["score", "Score"], ["len", "Länge"], ["best", "Best"]], hint: "Pfeile / WASD · Leertaste = Pause · Touch: wischen oder Steuerkreuz" });
      const cv = el("canvas", "game gm-canvas"); cv.width = cv.height = SZ; ui.stage.append(cv);
      const g = cv.getContext("2d");
      let wrap = store.get("snake-wrap", false), snake, prev, dir, queue, food, gold, score, acc, ms, state = "idle", parts = [], shake = 0, raf = 0, last = 0, t0 = 0;
      const bestKey = () => "snake-" + (wrap ? "wrap" : "wall");
      const reset = () => {
        snake = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }]; prev = snake.map(s => ({ ...s })); dir = { x: 1, y: 0 }; queue = []; score = 0; acc = 0; ms = 135; gold = null; parts = []; shake = 0;
        placeFood(); hudAll();
      };
      const hudAll = () => { ui.hud("score", score); ui.hud("len", snake.length); ui.hud("best", best.get(bestKey())); };
      const free = (x, y) => !snake.some(s => s.x === x && s.y === y) && !(food && food.x === x && food.y === y) && !(gold && gold.x === x && gold.y === y);
      const spot = () => { let x, y; do { x = rnd(N); y = rnd(N); } while (!free(x, y)); return { x, y }; };
      const placeFood = () => { food = null; food = spot(); if (!gold && Math.random() < .14 && score > 2) gold = { ...spot(), ttl: 6 }; };
      const burst = (x, y, col, n = 14) => { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = 40 + Math.random() * 110; parts.push({ x: (x + .5) * S, y: (y + .5) * S, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 1, col }); } };
      const step = () => {
        if (queue.length) dir = queue.shift();
        const old = snake.map(s => ({ ...s }));
        let h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
        if (wrap) { h.x = (h.x + N) % N; h.y = (h.y + N) % N; } else if (h.x < 0 || h.y < 0 || h.x >= N || h.y >= N) return die();
        const eatF = h.x === food.x && h.y === food.y, eatG = gold && h.x === gold.x && h.y === gold.y;
        if (snake.slice(0, eatF || eatG ? snake.length : -1).some(s => s.x === h.x && s.y === h.y)) return die();
        snake.unshift(h);
        if (eatF || eatG) {
          const pts = eatG ? 5 : 1; score += pts; sfx("eat"); burst(h.x, h.y, eatG ? "#ffd23c" : "#ff2bd6", eatG ? 26 : 14);
          if (eatG) { gold = null; } else placeFood();
          ms = Math.max(52, 135 - Math.floor(score / 4) * 7);
          if (score >= 10) achieve("snake");
        } else snake.pop();
        prev = snake.map((_, i) => old[Math.max(0, i - 1)] || old[0]);
        if (gold && (gold.ttl -= ms / 1000) <= 0) gold = null;
        hudAll();
      };
      const die = () => {
        state = "over"; sfx("gameover"); shake = .4; burst(snake[0].x, snake[0].y, "#ff3b5c", 40);
        const isNew = best.set(bestKey(), score); hudAll();
        setTimeout(() => ui.overlay({ badge: isNew && score ? "🏆 NEUER REKORD" : "GAME OVER", title: `${score} Punkte`, sub: `Länge ${snake.length} · Modus: ${wrap ? "Wrap" : "Klassisch"}`, buttons: [{ label: "↻ Nochmal", primary: true, fn: start }, { label: "Modus wechseln", fn: menu }] }), 650);
      };
      const menu = () => {
        state = "idle"; reset();
        ui.overlay({ badge: "SNAKE", title: "Sammle Daten-Pakete", sub: `Goldene Pakete geben 5 Punkte, verschwinden aber schnell.\nBest: Klassisch ${best.get("snake-wall")} · Wrap ${best.get("snake-wrap")}`.replace("\n", " · "),
          buttons: [{ label: "▶ Klassisch (Wände)", primary: true, fn: () => { wrap = false; store.set("snake-wrap", false); start(); } }, { label: "∞ Wrap (durch Ränder)", fn: () => { wrap = true; store.set("snake-wrap", true); start(); } }] });
      };
      const start = () => { reset(); ui.hide(); state = "run"; };
      const pause = () => { if (state === "run") { state = "pause"; ui.overlay({ title: "Pause", sub: "Leertaste zum Fortsetzen", buttons: [{ label: "▶ Weiter", primary: true, fn: () => { ui.hide(); state = "run"; } }, { label: "Neustart", fn: start }] }); } else if (state === "pause") { ui.hide(); state = "run"; } };
      const turn = d => { if (state !== "run") return; const ref = queue.length ? queue[queue.length - 1] : dir; if (d.x === -ref.x && d.y === -ref.y || (d.x === ref.x && d.y === ref.y)) return; if (queue.length < 2) queue.push(d); };
      const D = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
      const KEYS = { ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down", ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right" };
      const onKey = e => {
        if (!isActive(win)) return;
        if (KEYS[e.key]) { e.preventDefault(); if (state === "idle") return; turn(D[KEYS[e.key]]); }
        else if (e.key === " " || e.key === "p" || e.key === "P") { e.preventDefault(); if (state === "idle" || state === "over") return; pause(); }
      };
      document.addEventListener("keydown", onKey);
      let sx = 0, sy = 0;
      cv.addEventListener("pointerdown", e => { sx = e.clientX; sy = e.clientY; });
      cv.addEventListener("pointerup", e => { const dx = e.clientX - sx, dy = e.clientY - sy; if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return; turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? D.right : D.left) : (dy > 0 ? D.down : D.up)); });
      ui.controls([[{ l: "▲", a: "Hoch", fn: () => turn(D.up) }], [{ l: "◀", a: "Links", fn: () => turn(D.left) }, { l: "▼", a: "Runter", fn: () => turn(D.down) }, { l: "▶", a: "Rechts", fn: () => turn(D.right) }]]);

      const draw = () => {
        g.save();
        if (shake > 0) g.translate((Math.random() - .5) * 8 * shake, (Math.random() - .5) * 8 * shake);
        g.fillStyle = "#04060e"; g.fillRect(-10, -10, SZ + 20, SZ + 20);
        g.strokeStyle = "rgba(255,255,255,.04)"; g.lineWidth = 1;
        for (let i = 1; i < N; i++) { g.beginPath(); g.moveTo(i * S, 0); g.lineTo(i * S, SZ); g.moveTo(0, i * S); g.lineTo(SZ, i * S); g.stroke(); }
        if (!wrap) { g.strokeStyle = settings.accent; g.globalAlpha = .55; g.lineWidth = 3; g.strokeRect(1.5, 1.5, SZ - 3, SZ - 3); g.globalAlpha = 1; }
        const tt = (performance.now() - t0) / 1000;
        if (food) { const r = S * (.28 + .05 * Math.sin(tt * 6)); g.fillStyle = settings.accent2; g.shadowColor = settings.accent2; g.shadowBlur = 16; g.beginPath(); g.arc((food.x + .5) * S, (food.y + .5) * S, r + 3, 0, 7); g.fill(); g.shadowBlur = 0; }
        if (gold) { const r = S * (.34 + .06 * Math.sin(tt * 10)); g.fillStyle = "#ffd23c"; g.shadowColor = "#ffd23c"; g.shadowBlur = 22; g.beginPath(); g.arc((gold.x + .5) * S, (gold.y + .5) * S, r + 3, 0, 7); g.fill(); g.shadowBlur = 0; g.strokeStyle = "rgba(255,210,60,.7)"; g.lineWidth = 2; g.beginPath(); g.arc((gold.x + .5) * S, (gold.y + .5) * S, S * .62, -1.57, -1.57 + 6.28 * clamp(gold.ttl / 6, 0, 1)); g.stroke(); }
        const al = state === "run" ? clamp(acc / ms, 0, 1) : 1;
        const pos = snake.map((s, i) => { const p = prev[i] || s; if (Math.abs(p.x - s.x) > 1.5 || Math.abs(p.y - s.y) > 1.5) return [s.x, s.y]; return [p.x + (s.x - p.x) * al, p.y + (s.y - p.y) * al]; });
        for (let i = pos.length - 1; i >= 0; i--) {
          const [x, y] = pos[i], k = 1 - i / (pos.length + 4), pad = i === 0 ? 1 : 2 + (1 - k) * 3;
          g.fillStyle = i === 0 ? "#fff" : settings.accent; g.globalAlpha = i === 0 ? 1 : .45 + .55 * k; g.shadowColor = settings.accent; g.shadowBlur = i === 0 ? 18 : 8;
          g.beginPath(); g.roundRect(x * S + pad, y * S + pad, S - pad * 2, S - pad * 2, 7); g.fill();
        }
        g.globalAlpha = 1; g.shadowBlur = 0;
        const [hx, hy] = pos[0]; g.fillStyle = "#04060e";
        [[.3, .32], [.7, .32]].forEach(([ex, ey]) => { const ox = dir.x * 3, oy = dir.y * 3; g.beginPath(); g.arc(hx * S + ex * S + ox * .5, hy * S + ey * S + oy * .5 + (dir.y > 0 ? 6 : 0), 2.4, 0, 7); g.fill(); });
        parts.forEach(p => { g.globalAlpha = clamp(p.l, 0, 1); g.fillStyle = p.col; g.fillRect(p.x - 2, p.y - 2, 4, 4); }); g.globalAlpha = 1;
        g.restore();
      };
      const loop = t => {
        raf = requestAnimationFrame(loop);
        const dt = Math.min(.05, (t - (last || t)) / 1000); last = t;
        if (win.classList.contains("hidden") || document.hidden) return;
        if (state === "run") { acc += dt * 1000; let n = 0; while (acc >= ms && state === "run" && n++ < 4) { acc -= ms; step(); } }
        parts = parts.filter(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .96; p.vy *= .96; return (p.l -= dt * 1.6) > 0; });
        shake = Math.max(0, shake - dt);
        draw();
      };
      t0 = performance.now(); reset(); menu(); raf = requestAnimationFrame(loop);
      return () => { cancelAnimationFrame(raf); document.removeEventListener("keydown", onKey); };
    },
  };

  /* ---------- TETRIS ---------- */
  A.tetris = {
    title: "Tetris", icon: "🧱", group: "Fun", w: 600, h: 820,
    render(body, win) {
      const COLS = 10, ROWS = 20, C = 28, BX = 120, W = 520, H = ROWS * C;
      const SH = { I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], O: [[1, 1], [1, 1]], T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]], S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]], Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]], J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]], L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]] };
      const COL = { I: "#00f0ff", O: "#ffd23c", T: "#a66bff", S: "#39ff88", Z: "#ff3b5c", J: "#7aa2ff", L: "#ff9f1a" };
      const ui = gameUI(body, { hud: [["score", "Score"], ["lines", "Linien"], ["level", "Level"], ["best", "Best"]], hint: "← → bewegen · ↑/X drehen · Z gegen Uhrzeiger · ↓ schneller · Leertaste Drop · C/Shift Hold · P Pause" });
      const cv = el("canvas", "game gm-canvas"); cv.width = W; cv.height = H; ui.stage.append(cv); const g = cv.getContext("2d");
      let board, cur, queue, hold, canHold, score, lines, level, state = "idle", acc, lockT, resets, clear, raf = 0, last = 0;
      const rot = (m, ccw) => (ccw ? m[0].map((_, i) => m.map(r => r[r.length - 1 - i])) : m[0].map((_, i) => m.map(r => r[i]).reverse()));
      const refill = () => { while (queue.length < 5) queue.push(...Object.keys(SH).sort(() => Math.random() - .5)); };
      const hit = (m, x, y) => m.some((r, j) => r.some((v, i) => v && (x + i < 0 || x + i >= COLS || y + j >= ROWS || (y + j >= 0 && board[y + j][x + i]))));
      const mkPiece = k => ({ k, m: SH[k].map(r => r.slice()), x: ((COLS - SH[k][0].length) / 2) | 0, y: k === "I" ? -1 : 0 });
      const spawn = k => {
        refill(); cur = mkPiece(k || queue.shift()); lockT = 0; resets = 0; canHold = true;
        if (hit(cur.m, cur.x, cur.y)) over();
      };
      const hudAll = () => { ui.hud("score", score); ui.hud("lines", lines); ui.hud("level", level); ui.hud("best", best.get("tetris")); };
      const reset = () => { board = Array.from({ length: ROWS }, () => Array(COLS).fill(0)); queue = []; hold = null; score = lines = 0; level = 1; acc = 0; clear = null; refill(); spawn(); hudAll(); };
      const menu = () => { state = "idle"; reset(); ui.overlay({ badge: "TETRIS", title: "Stapeln. Räumen. Wiederholen.", list: ["← → bewegen, ↑ drehen, ↓ schneller", "Leertaste = Hard Drop, C = Hold", "Touch: Tasten unter dem Spielfeld"], buttons: [{ label: "▶ Spielen", primary: true, fn: start }] }); };
      const start = () => { reset(); ui.hide(); state = "run"; };
      const over = () => {
        state = "over"; sfx("gameover"); const isNew = best.set("tetris", score); hudAll();
        ui.overlay({ badge: isNew && score ? "🏆 NEUER REKORD" : "GAME OVER", title: `${score} Punkte`, sub: `${lines} Linien · Level ${level}`, buttons: [{ label: "↻ Nochmal", primary: true, fn: start }] });
      };
      const pause = () => { if (state === "run") { state = "pause"; ui.overlay({ title: "Pause", sub: "P zum Fortsetzen", buttons: [{ label: "▶ Weiter", primary: true, fn: () => { ui.hide(); state = "run"; } }, { label: "Neustart", fn: start }] }); } else if (state === "pause") { ui.hide(); state = "run"; } };
      const grounded = () => hit(cur.m, cur.x, cur.y + 1);
      const touchLock = () => { if (grounded() && resets < 8) { lockT = 0; resets++; } };
      const move = dx => { if (state !== "run" || clear) return; if (!hit(cur.m, cur.x + dx, cur.y)) { cur.x += dx; touchLock(); } };
      const turn = ccw => { if (state !== "run" || clear) return; const m = rot(cur.m, ccw); for (const k of [0, -1, 1, -2, 2]) { if (!hit(m, cur.x + k, cur.y)) { cur.m = m; cur.x += k; touchLock(); sfx("click"); return; } else if (!hit(m, cur.x + k, cur.y - 1)) { cur.m = m; cur.x += k; cur.y -= 1; touchLock(); sfx("click"); return; } } };
      const soft = () => { if (state !== "run" || clear) return; if (!grounded()) { cur.y++; score += 1; ui.hud("score", score); } };
      const hard = () => { if (state !== "run" || clear) return; let n = 0; while (!grounded()) { cur.y++; n++; } score += n * 2; sfx("drop"); lock(); };
      const doHold = () => { if (state !== "run" || clear || !canHold) return; const k = cur.k; if (hold) { const h = hold; hold = k; spawn(h); canHold = false; } else { hold = k; spawn(); canHold = false; } sfx("pop"); };
      const lock = () => {
        cur.m.forEach((r, j) => r.forEach((v, i) => { if (v && cur.y + j >= 0) board[cur.y + j][cur.x + i] = COL[cur.k]; }));
        const rows = []; board.forEach((r, y) => { if (r.every(Boolean)) rows.push(y); });
        if (rows.length) { clear = { rows, t: 0 }; sfx("line"); } else { sfx("drop"); hudAll(); spawn(); }
      };
      const finishClear = () => {
        const n = clear.rows.length; clear.rows.forEach(y => { board.splice(y, 1); board.unshift(Array(COLS).fill(0)); });
        score += [0, 100, 300, 500, 800][n] * level; lines += n; level = 1 + ((lines / 10) | 0); if (score >= 500) achieve("tetris");
        clear = null; hudAll(); spawn();
      };
      const KEYS = { ArrowLeft: () => move(-1), ArrowRight: () => move(1), ArrowDown: soft, ArrowUp: () => turn(false), x: () => turn(false), X: () => turn(false), z: () => turn(true), Z: () => turn(true), " ": hard, c: doHold, C: doHold, Shift: doHold };
      const onKey = e => {
        if (!isActive(win)) return;
        if (e.key === "p" || e.key === "P" || e.key === "Escape") { if (state === "run" || state === "pause") { e.preventDefault(); pause(); } return; }
        if (state === "over" || state === "idle") { if (e.key === "Enter") start(); return; }
        const f = KEYS[e.key]; if (f) { e.preventDefault(); f(); }
      };
      document.addEventListener("keydown", onKey);
      ui.controls([[{ l: "⟲", a: "Gegen Uhrzeiger", fn: () => turn(true) }, { l: "⟳", a: "Drehen", fn: () => turn(false) }, { l: "HOLD", a: "Halten", fn: doHold }, { l: "⤓", a: "Drop", fn: hard }],
        [{ l: "◀", a: "Links", fn: () => move(-1), hold: 130 }, { l: "▼", a: "Runter", fn: soft, hold: 70 }, { l: "▶", a: "Rechts", fn: () => move(1), hold: 130 }]]);

      const block = (x, y, col, s = C, a = 1) => { g.globalAlpha = a; g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 8; g.beginPath(); g.roundRect(x + 1.5, y + 1.5, s - 3, s - 3, 5); g.fill(); g.shadowBlur = 0; g.fillStyle = "rgba(255,255,255,.22)"; g.fillRect(x + 4, y + 4, s - 8, 3); g.globalAlpha = 1; };
      const mini = (k, bx, by, size = 18) => { if (!k) return; const m = SH[k], w = m[0].length * size, h = m.length * size; m.forEach((r, j) => r.forEach((v, i) => { if (v) block(bx + (96 - w) / 2 + i * size, by + (66 - h) / 2 + j * size, COL[k], size); })); };
      const draw = () => {
        g.fillStyle = "#04060e"; g.fillRect(0, 0, W, H);
        g.fillStyle = "rgba(255,255,255,.035)"; g.fillRect(BX, 0, COLS * C, H);
        g.strokeStyle = "rgba(255,255,255,.05)"; for (let x = 1; x < COLS; x++) { g.beginPath(); g.moveTo(BX + x * C, 0); g.lineTo(BX + x * C, H); g.stroke(); }
        g.strokeStyle = settings.accent; g.globalAlpha = .6; g.lineWidth = 2; g.strokeRect(BX - 1, 0, COLS * C + 2, H); g.globalAlpha = 1;
        board.forEach((r, y) => r.forEach((c, x) => { if (c) block(BX + x * C, y * C, c); }));
        if (clear) clear.rows.forEach(y => { g.fillStyle = `rgba(255,255,255,${.85 - clear.t * 4})`; g.fillRect(BX, y * C, COLS * C, C); });
        if (cur && state !== "idle" && state !== "over" && !clear) {
          let gy = cur.y; while (!hit(cur.m, cur.x, gy + 1)) gy++;
          cur.m.forEach((r, j) => r.forEach((v, i) => { if (v) { g.strokeStyle = COL[cur.k]; g.globalAlpha = .35; g.lineWidth = 2; g.strokeRect(BX + (cur.x + i) * C + 3, (gy + j) * C + 3, C - 6, C - 6); g.globalAlpha = 1; } }));
          cur.m.forEach((r, j) => r.forEach((v, i) => { if (v && cur.y + j >= 0) block(BX + (cur.x + i) * C, (cur.y + j) * C, COL[cur.k]); }));
        }
        g.fillStyle = "#8aa0b8"; g.font = "bold 12px monospace"; g.textAlign = "center";
        g.fillText("HOLD", 60, 22); g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 1; g.strokeRect(12, 30, 96, 72); mini(hold, 12, 33, 18);
        g.fillText("NEXT", 460, 22); queue.slice(0, 4).forEach((k, i) => { g.strokeRect(412, 30 + i * 80, 96, 72); mini(k, 412, 33 + i * 80, i ? 16 : 18); });
        if (!canHold && hold) { g.fillStyle = "rgba(4,6,14,.55)"; g.fillRect(12, 30, 96, 72); }
      };
      const loop = t => {
        raf = requestAnimationFrame(loop);
        const dt = Math.min(100, t - (last || t)); last = t;
        if (win.classList.contains("hidden") || document.hidden) return;
        if (state === "run") {
          if (clear) { clear.t += dt / 1000; if (clear.t > .22) finishClear(); }
          else {
            const ms = Math.max(60, 700 * Math.pow(.85, level - 1));
            if (grounded()) { lockT += dt; if (lockT > 380) { lock(); lockT = 0; } } else { lockT = 0; acc += dt; while (acc > ms && !grounded()) { acc -= ms; cur.y++; } }
          }
        }
        draw();
      };
      reset(); menu(); raf = requestAnimationFrame(loop);
      return () => { cancelAnimationFrame(raf); document.removeEventListener("keydown", onKey); };
    },
  };

  /* ---------- MINESWEEPER ---------- */
  const LEVELS = { easy: { n: "Leicht", r: 9, c: 9, m: 10 }, mid: { n: "Mittel", r: 12, c: 12, m: 24 }, hard: { n: "Schwer", r: 16, c: 16, m: 40 } };
  A.mines = {
    title: "Minesweeper", icon: "💣", group: "Fun", w: 600, h: 780,
    render(body) {
      const ui = gameUI(body, { hud: [["mines", "Minen"], ["time", "Zeit"], ["best", "Best"]], hint: "Klick: aufdecken · Rechtsklick / langes Drücken: Flagge · Klick auf Zahl: Nachbarn aufdecken" });
      const bar = el("div", "gm-bar"); bar.innerHTML = `<button class="btn" id="mface">🙂 Neu</button><button class="btn" id="mflag">🚩 Flaggen-Modus: aus</button><button class="btn" id="mmenu">☰ Stufe</button>`; ui.root.insertBefore(bar, ui.root.querySelector(".gm-stage"));
      const grid = el("div", "msgrid"); ui.stage.append(grid);
      let L = LEVELS[store.get("mines-level", "easy")] || LEVELS.easy, key = "easy", R, C, M, cells, first, over, flags, secs, timer = 0, flagMode = false;
      const nb = i => { const r = (i / C) | 0, c = i % C, o = []; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { if (!dr && !dc) continue; const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < R && cc >= 0 && cc < C) o.push(rr * C + cc); } return o; };
      const bestT = () => best.get("mines-" + key);
      const reset = () => {
        clearInterval(timer); timer = 0; R = L.r; C = L.c; M = L.m; secs = 0; first = true; over = false; flags = 0;
        cells = Array.from({ length: R * C }, () => ({ mine: false, open: false, flag: false, n: 0 }));
        grid.style.setProperty("--cols", C); grid.style.gridTemplateColumns = `repeat(${C}, 1fr)`;
        grid.innerHTML = cells.map((_, i) => `<button class="cell" data-i="${i}" aria-label="Feld"></button>`).join("");
        $("#mface", ui.root).textContent = "🙂 Neu"; hudAll(); render();
      };
      const hudAll = () => { ui.hud("mines", M - flags); ui.hud("time", secs); ui.hud("best", bestT() ? bestT() + "s" : "–"); };
      const place = safe => { const ban = new Set([safe, ...nb(safe)]); let n = 0; while (n < M) { const i = rnd(R * C); if (!cells[i].mine && !ban.has(i)) { cells[i].mine = true; n++; } } cells.forEach((c, i) => { c.n = nb(i).filter(j => cells[j].mine).length; }); };
      const render = () => {
        const b = grid.children;
        cells.forEach((c, i) => { const x = b[i]; x.className = "cell" + (c.open ? " open" : "") + (c.open && c.mine ? " mine" : "") + (c.flag ? " flag" : ""); x.dataset.n = c.open && !c.mine && c.n ? c.n : ""; x.textContent = c.open ? (c.mine ? "💥" : c.n || "") : c.flag ? "🚩" : ""; });
        ui.hud("mines", M - flags);
      };
      const finish = won => {
        over = true; clearInterval(timer); cells.forEach(c => { if (c.mine) c.open = true; }); render();
        $("#mface", ui.root).textContent = won ? "😎 Neu" : "😵 Neu";
        if (won) { sfx("win"); achieve("mines"); const isNew = best.set("mines-" + key, secs, true); hudAll(); setTimeout(() => ui.overlay({ badge: isNew ? "🏆 NEUE BESTZEIT" : "GEWONNEN", title: `${secs} Sekunden`, sub: `Stufe ${L.n}`, buttons: [{ label: "↻ Nochmal", primary: true, fn: () => { ui.hide(); reset(); } }, { label: "☰ Stufe", fn: menu }] }), 500); }
        else { sfx("boom"); setTimeout(() => ui.overlay({ badge: "BOOM", title: "Mine getroffen", sub: `${cells.filter(c => c.open && !c.mine).length} Felder geschafft`, buttons: [{ label: "↻ Nochmal", primary: true, fn: () => { ui.hide(); reset(); } }, { label: "☰ Stufe", fn: menu }] }), 700); }
      };
      const reveal = i => {
        const st = [i];
        while (st.length) { const j = st.pop(), c = cells[j]; if (c.open || c.flag) continue; c.open = true; if (c.mine) { finish(false); return; } if (c.n === 0) st.push(...nb(j)); }
        if (cells.filter(c => c.open).length === R * C - M) finish(true);
      };
      const act = (i, flag) => {
        if (over) return; const c = cells[i];
        if (flag) { if (c.open) return; c.flag = !c.flag; flags += c.flag ? 1 : -1; sfx("flag"); render(); return; }
        if (c.open) { if (c.n && nb(i).filter(j => cells[j].flag).length === c.n) { nb(i).forEach(j => { if (!over && !cells[j].open && !cells[j].flag) reveal(j); }); if (!over) render(); } return; }
        if (c.flag) return;
        if (first) { first = false; place(i); timer = setInterval(() => { secs++; ui.hud("time", secs); }, 1000); }
        sfx("pop"); reveal(i); if (!over) render();
      };
      let lp = 0, longFired = false;
      grid.addEventListener("pointerdown", e => { const b = e.target.closest(".cell"); if (!b || e.button === 2) return; longFired = false; clearTimeout(lp); lp = setTimeout(() => { longFired = true; act(+b.dataset.i, true); navigator.vibrate?.(30); }, 420); });
      ["pointerup", "pointerleave", "pointercancel"].forEach(ev => grid.addEventListener(ev, () => clearTimeout(lp)));
      grid.addEventListener("click", e => { const b = e.target.closest(".cell"); if (!b) return; if (longFired) { longFired = false; return; } act(+b.dataset.i, flagMode); });
      grid.addEventListener("contextmenu", e => { const b = e.target.closest(".cell"); if (b) { e.preventDefault(); act(+b.dataset.i, true); } });
      $("#mface", ui.root).onclick = () => { ui.hide(); reset(); };
      $("#mflag", ui.root).onclick = e => { flagMode = !flagMode; e.target.textContent = "🚩 Flaggen-Modus: " + (flagMode ? "an" : "aus"); e.target.classList.toggle("on", flagMode); };
      const menu = () => { clearInterval(timer); ui.overlay({ badge: "MINESWEEPER", title: "Stufe wählen", sub: "Die erste Aufdeckung ist immer sicher.", buttons: Object.entries(LEVELS).map(([k, v], i) => ({ label: `${v.n} · ${v.c}×${v.r} · ${v.m} Minen${best.get("mines-" + k) ? " · 🏆 " + best.get("mines-" + k) + "s" : ""}`, primary: i === 0, fn: () => { key = k; L = v; store.set("mines-level", k); ui.hide(); reset(); } })) }); };
      key = store.get("mines-level", "easy"); L = LEVELS[key] || LEVELS.easy; reset(); menu();
      return () => clearInterval(timer);
    },
  };

  /* ---------- PACKET DEFENDER ---------- */
  A.defender = {
    title: "Packet Defender", icon: "🧱", group: "Security Lab", w: 640, h: 700,
    render(body, win) {
      const W = 600, H = 380, LANES = 6, LH = (H - 20) / LANES, PW = 92, PH = 34;
      const ui = gameUI(body, { hud: [["score", "Score"], ["combo", "Combo"], ["hp", "Integrität"], ["best", "Best"]], hint: "Klicke / tippe bösartige Pakete weg · legitimen Traffic durchlassen · Leertaste = EMP (ab Combo 8)" });
      const cv = el("canvas", "game gm-canvas"); cv.width = W; cv.height = H; ui.stage.append(cv); const g = cv.getContext("2d");
      const GOOD = ["HTTP", "DNS", "TLS", "SSH", "NTP", "ICMP", "SMTP"], BAD = ["SQLi", "XSS", "RCE", "DDoS", "BRUTE", "XXE", "SSRF", "MALWARE"];
      let P, parts, pops, hp, score, combo, maxCombo, t, spawn, state = "idle", flash = 0, shake = 0, emp = 0, raf = 0, last = 0;
      const hudAll = () => { ui.hud("score", score); ui.hud("combo", "×" + Math.min(5, 1 + Math.floor(combo / 4))); ui.hud("hp", hp + "%"); ui.hud("best", best.get("defender")); };
      const reset = () => { P = []; parts = []; pops = []; hp = 100; score = 0; combo = 0; maxCombo = 0; t = 0; spawn = .4; flash = shake = emp = 0; hudAll(); };
      const menu = () => { state = "idle"; reset(); ui.overlay({ badge: "PACKET DEFENDER", title: "Verteidige den Core", list: ["Bösartige Pakete (pink) anklicken → blocken", "Legitime Pakete (cyan) durchlassen", "Combos erhöhen den Multiplikator – ab Combo 8 gibt es einen EMP"], buttons: [{ label: "▶ Start", primary: true, fn: start }] }); };
      const start = () => { reset(); ui.hide(); state = "run"; };
      const over = () => { state = "over"; sfx("gameover"); const isNew = best.set("defender", score); if (score >= 150) achieve("defender"); hudAll(); ui.overlay({ badge: isNew && score ? "🏆 NEUER REKORD" : "BREACHED", title: `${score} Punkte`, sub: `Längste Combo: ${maxCombo}`, buttons: [{ label: "↻ Nochmal", primary: true, fn: start }] }); };
      const burst = (x, y, col, n = 16) => { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = 60 + Math.random() * 160; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 1, col }); } };
      const mult = () => Math.min(5, 1 + Math.floor(combo / 4));
      const block = p => { const pts = 10 * mult(); score += pts; combo++; maxCombo = Math.max(maxCombo, combo); burst(p.x + PW / 2, p.y + PH / 2, "#ff2bd6"); pops.push({ x: p.x + PW / 2, y: p.y, txt: "+" + pts, l: 1 }); sfx("block"); };
      const useEmp = () => { if (state !== "run" || combo < 8 || emp > 0) return; emp = .5; combo = Math.max(0, combo - 8); P.filter(p => p.bad).forEach(p => { block(p); }); P = P.filter(p => !p.bad); sfx("success"); hudAll(); };
      const press = e => {
        if (state !== "run") return;
        const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height, pad = r.width < 420 ? 14 : 6;
        for (let i = P.length - 1; i >= 0; i--) {
          const p = P[i];
          if (x >= p.x - pad && x <= p.x + PW + pad && y >= p.y - pad && y <= p.y + PH + pad) {
            P.splice(i, 1);
            if (p.bad) block(p); else { hp -= 8; combo = 0; flash = .3; shake = .25; burst(p.x + PW / 2, p.y + PH / 2, "#00f0ff", 8); pops.push({ x: p.x + PW / 2, y: p.y, txt: "Falsch!", l: 1, bad: true }); sfx("hit"); }
            hudAll(); if (hp <= 0) { hp = 0; hudAll(); over(); }
            return;
          }
        }
      };
      cv.addEventListener("pointerdown", press);
      const onKey = e => { if (isActive(win) && e.key === " " && state === "run") { e.preventDefault(); useEmp(); } };
      document.addEventListener("keydown", onKey);
      ui.controls([[{ l: "⚡ EMP (Combo 8)", a: "EMP", fn: useEmp }]]);
      const draw = () => {
        g.save(); if (shake > 0) g.translate((Math.random() - .5) * 10 * shake, (Math.random() - .5) * 10 * shake);
        g.fillStyle = flash > 0 ? `rgb(${30 + flash * 120},8,18)` : "#04060e"; g.fillRect(-10, -10, W + 20, H + 20);
        for (let i = 0; i < LANES; i++) { g.fillStyle = i % 2 ? "rgba(255,255,255,.018)" : "rgba(255,255,255,.04)"; g.fillRect(0, 10 + i * LH, W, LH); }
        const coreCol = hp > 60 ? "#39ff88" : hp > 30 ? "#ffb020" : "#ff3b5c";
        g.fillStyle = coreCol; g.shadowColor = coreCol; g.shadowBlur = 18; g.fillRect(W - 14, 0, 14, H); g.shadowBlur = 0;
        g.fillStyle = "rgba(255,255,255,.25)"; g.font = "bold 11px monospace"; g.textAlign = "center"; g.save(); g.translate(W - 22, H / 2); g.rotate(-Math.PI / 2); g.fillText("CORE", 0, 0); g.restore();
        if (emp > 0) { g.fillStyle = `rgba(0,240,255,${emp * .5})`; g.fillRect(0, 0, W, H); }
        P.forEach(p => {
          const c = p.bad ? "#ff2bd6" : "#00f0ff", jx = p.bad ? (Math.random() - .5) * 2 : 0;
          g.fillStyle = "rgba(6,10,22,.92)"; g.strokeStyle = c; g.shadowColor = c; g.shadowBlur = 12; g.lineWidth = 2;
          g.beginPath(); g.roundRect(p.x + jx, p.y, PW, PH, 9); g.fill(); g.stroke(); g.shadowBlur = 0;
          g.fillStyle = c; g.strokeStyle = c; g.lineWidth = 2; g.beginPath(); const cy = p.y + PH / 2;
          if (p.bad) { g.moveTo(p.x + 11 + jx, cy + 5); g.lineTo(p.x + 17 + jx, cy - 6); g.lineTo(p.x + 23 + jx, cy + 5); g.closePath(); } else { g.moveTo(p.x + 11 + jx, cy); g.lineTo(p.x + 15 + jx, cy + 4); g.lineTo(p.x + 23 + jx, cy - 5); }
          g.stroke(); g.font = "bold 13px monospace"; g.textAlign = "left"; g.textBaseline = "middle"; g.fillText(p.label, p.x + 30 + jx, cy + 1);
        });
        parts.forEach(p => { g.globalAlpha = clamp(p.l, 0, 1); g.fillStyle = p.col; g.fillRect(p.x - 2, p.y - 2, 4, 4); }); g.globalAlpha = 1;
        pops.forEach(p => { g.globalAlpha = clamp(p.l, 0, 1); g.fillStyle = p.bad ? "#ff5470" : "#39ff88"; g.font = "bold 15px monospace"; g.textAlign = "center"; g.fillText(p.txt, p.x, p.y - (1 - p.l) * 26); }); g.globalAlpha = 1;
        if (state === "run" && combo >= 8 && emp <= 0) { g.fillStyle = "#00f0ff"; g.font = "bold 13px monospace"; g.textAlign = "left"; g.fillText("EMP bereit – Leertaste / Taste", 12, H - 12); }
        g.restore();
      };
      const loop = ts => {
        raf = requestAnimationFrame(loop);
        const dt = Math.min(.05, (ts - (last || ts)) / 1000); last = ts;
        if (win.classList.contains("hidden") || document.hidden) return;
        flash = Math.max(0, flash - dt); shake = Math.max(0, shake - dt); emp = Math.max(0, emp - dt);
        parts = parts.filter(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .95; p.vy *= .95; return (p.l -= dt * 1.7) > 0; });
        pops = pops.filter(p => (p.l -= dt * 1.4) > 0);
        if (state === "run") {
          t += dt; spawn -= dt;
          const speed = 60 + Math.min(110, t * 1.8);
          if (spawn <= 0) { spawn = Math.max(.34, 1 - t * .011); const bad = Math.random() < .5, lane = rnd(LANES); P.push({ x: -PW, y: 10 + lane * LH + (LH - PH) / 2, v: speed * (.85 + Math.random() * .4), bad, label: pick(bad ? BAD : GOOD) }); }
          P.forEach(p => { p.x += p.v * dt; });
          P = P.filter(p => { if (p.x + PW < W - 14) return true; if (p.bad) { hp -= 10; combo = 0; flash = .3; shake = .3; sfx("hit"); hudAll(); if (hp <= 0 && state === "run") { hp = 0; hudAll(); over(); } } else { score += 1; hudAll(); } return false; });
        }
        draw();
      };
      reset(); menu(); raf = requestAnimationFrame(loop);
      return () => { cancelAnimationFrame(raf); document.removeEventListener("keydown", onKey); };
    },
  };

  /* ---------- HACKER TYPING ---------- */
  const TEXTS = {
    cmd: ["sudo apt update && sudo apt upgrade -y", "nmap -sV -p- --open 10.0.0.5", "ssh-keygen -t ed25519 -C \"bene@beneos\"", "curl -sI https://example.com | grep -i content-security-policy", "git commit -m \"fix: sanitize redirect parameter\" && git push", "openssl s_client -connect example.com:443 -tls1_3", "find / -perm -4000 -type f 2>/dev/null", "tcpdump -i eth0 -nn port 53 -c 20"],
    sec: ["Never trust user input. Validate on the server and escape on output.", "A strong password is long, random and unique for every account.", "Parameterized queries stop SQL injection before it starts.", "Defense in depth means no single control is your only line of defense.", "Patch early, patch often: most breaches use known vulnerabilities.", "The principle of least privilege limits the damage of every compromise."],
    code: ["const safe = DOMPurify.sanitize(userInput, { USE_PROFILES: { html: true } });", "SELECT id, name FROM users WHERE email = ? AND active = 1;", "if (!timingSafeEqual(Buffer.from(a), Buffer.from(b))) throw new Error('denied');", "res.setHeader('Content-Security-Policy', \"default-src 'self'\");"],
  };
  A.typing = {
    title: "Hacker Typing", icon: "⌨", group: "Fun", w: 640, h: 600,
    render(body, win) {
      const ui = gameUI(body, { hud: [["wpm", "WPM"], ["acc", "Genauigkeit"], ["time", "Zeit"], ["best", "Best WPM"]], hint: "Tippe den Text ab. Rückschritt mit ⌫ erlaubt · Esc = neuer Text" });
      const wrap = el("div", "ty-wrap");
      wrap.innerHTML = `<div class="ty-modes">${[["cmd", "Befehle"], ["sec", "Sätze"], ["code", "Code"]].map(([k, l]) => `<button class="chip" data-mode="${k}">${l}</button>`).join("")}</div>
        <div class="ty-target" id="tt"><div class="ty-text"></div><input class="ty-in" aria-label="Eingabe" autocomplete="off" autocapitalize="off" spellcheck="false"></div><div class="ty-prog"><i></i></div>`;
      ui.stage.append(wrap);
      const tt = $(".ty-text", wrap), inp = $(".ty-in", wrap), prog = $(".ty-prog i", wrap);
      let mode = store.get("ty-mode", "cmd"), text = "", startT = 0, done = false;
      const stats = () => {
        const v = inp.value; let ok = 0; for (let i = 0; i < v.length; i++) if (v[i] === text[i]) ok++;
        const t = startT ? (performance.now() - startT) / 1000 : 0;
        ui.hud("wpm", t > .8 ? Math.round(ok / 5 / (t / 60)) : 0); ui.hud("acc", v.length ? Math.round(ok / v.length * 100) + "%" : "100%"); ui.hud("time", t.toFixed(1) + "s"); ui.hud("best", best.get("typing") || "–");
        return { ok, t, v };
      };
      const paint = () => {
        const v = inp.value, sp = tt.children;
        for (let i = 0; i < sp.length; i++) { const c = v[i]; sp[i].className = c == null ? (i === v.length ? "cur" : "") : c === text[i] ? "good" : "bad"; }
        prog.style.width = clamp(v.length / text.length * 100, 0, 100) + "%";
      };
      const load = () => {
        const pool = TEXTS[mode]; let n; do { n = pick(pool); } while (n === text && pool.length > 1); text = n; startT = 0; done = false; inp.value = ""; inp.disabled = false;
        tt.innerHTML = [...text].map(c => `<span>${c === " " ? "&nbsp;" : esc(c)}</span>`).join(""); wrap.querySelectorAll("[data-mode]").forEach(b => b.classList.toggle("on", b.dataset.mode === mode));
        ui.hide(); paint(); stats(); inp.focus({ preventScroll: true });
      };
      const finish = () => {
        done = true; inp.disabled = true; const { ok, t } = stats(), wpm = Math.round(ok / 5 / (t / 60)), acc = Math.round(ok / text.length * 100);
        const isNew = acc >= 90 && best.set("typing", wpm); ui.hud("best", best.get("typing") || "–");
        const rate = wpm >= 80 ? "Script-Kiddie? Eher Elite-Hacker ⚡" : wpm >= 55 ? "Sehr schnell 🔥" : wpm >= 35 ? "Solide 👍" : "Weiter üben ⌨";
        sfx(acc >= 90 ? "success" : "error"); if (wpm >= 30 && acc >= 90) achieve("typist");
        ui.overlay({ badge: isNew ? "🏆 NEUER REKORD" : "GESCHAFFT", title: `${wpm} WPM · ${acc}%`, sub: rate, buttons: [{ label: "↻ Nächster Text", primary: true, fn: load }] });
      };
      inp.addEventListener("input", () => { if (done) return; if (!startT && inp.value) startT = performance.now(); sfx("type"); paint(); stats(); if (inp.value.length >= text.length) finish(); });
      inp.addEventListener("keydown", e => { if (e.key === "Escape") { e.preventDefault(); load(); } });
      $(".ty-target", wrap).addEventListener("pointerdown", () => setTimeout(() => inp.focus(), 0));
      wrap.querySelector(".ty-modes").onclick = e => { const b = e.target.closest("[data-mode]"); if (b) { mode = b.dataset.mode; store.set("ty-mode", mode); sfx("menu"); load(); } };
      const iv = setInterval(() => { if (startT && !done && !win.classList.contains("hidden")) stats(); }, 200);
      load();
      return () => clearInterval(iv);
    },
  };

  /* ---------- PHISH OR LEGIT ---------- */
  const QS = [
    { t: "url", v: "https://paypal.com.secure-login.xyz/verify", p: true, why: "Die echte Domain steht direkt vor dem ersten „/“: secure-login.xyz. „paypal.com“ ist nur eine Subdomain davor.", tells: ["Domain am Ende lesen", "Unbekannte TLD .xyz", "„verify“-Pfad als Köder"] },
    { t: "url", v: "https://accounts.google.com/signin", p: false, why: "Echte Google-Subdomain, HTTPS und passender Pfad.", tells: ["Domain endet auf google.com", "HTTPS"] },
    { t: "url", v: "https://arnazon-support.com/refund", p: true, why: "Typosquatting: „arnazon“ statt „amazon“ – r + n sieht aus wie m.", tells: ["Buchstaben-Trick rn → m", "„support“ in einer fremden Domain"] },
    { t: "url", v: "https://github.com/login", p: false, why: "Echte Domain github.com mit typischem Login-Pfad.", tells: ["Domain exakt github.com"] },
    { t: "mail", from: "support@micros0ft-security.com", subj: "Dein Konto wird in 24 Stunden gesperrt!", body: "Wir haben ungewöhnliche Aktivitäten festgestellt. Bestätige sofort dein Passwort, sonst verlierst du den Zugriff.", p: true, why: "Eine Null statt „o“ in der Absenderdomain, dazu Zeitdruck und Drohung – klassisches Phishing.", tells: ["micr0soft mit Null", "Zeitdruck + Drohung", "Aufforderung, Passwort zu bestätigen"] },
    { t: "url", v: "https://login.microsoftonline.com", p: false, why: "Das ist der echte Microsoft-Login-Host.", tells: ["Domain microsoftonline.com gehört Microsoft"] },
    { t: "url", v: "http://192.168.0.5/bank/login.php?redirect=paypal", p: true, why: "Kein HTTPS, nackte IP statt Domain und ein verdächtiger Redirect-Parameter.", tells: ["http statt https", "IP-Adresse statt Domain", "redirect-Parameter"] },
    { t: "mail", from: "noreply@github.com", subj: "Neuer Login von unbekanntem Gerät", body: "Wir haben eine Anmeldung von einem neuen Gerät bemerkt. Du musst nichts anklicken – prüfe in deinen Kontoeinstellungen unter „Sicherheit“.", p: false, why: "Absender passt, keine Panik-Mache, keine Link-Aufforderung. Trotzdem nie über Mail-Links einloggen.", tells: ["Kein Link, kein Zeitdruck", "Verweis auf Einstellungen statt Button"] },
    { t: "url", v: "https://xn--pypal-4ve.com/login", p: true, why: "„xn--“ ist Punycode: ein Homograph-Angriff mit Sonderzeichen, die wie „paypal“ aussehen.", tells: ["xn-- am Anfang", "Domain sieht fast echt aus"] },
    { t: "url", v: "https://www.sparkasse.de/privatkunden.html", p: false, why: "Offizielle Domain der Sparkasse.", tells: ["Domain sparkasse.de", "HTTPS"] },
    { t: "mail", from: "Paket-Service <info@dhl-zustellung.top>", subj: "Zustellung fehlgeschlagen – 1,99 € Gebühr", body: "Dein Paket konnte nicht zugestellt werden. Begleiche die Gebühr von 1,99 € über den Link, um eine Rücksendung zu verhindern.", p: true, why: "Kleine Gebühr als Köder, fremde Domain (.top), Zeitdruck. Echte Zusteller verlangen keine Zahlung per Mail-Link.", tells: ["Domain dhl-zustellung.top", "Kleine Gebühr", "Link zur Zahlung"] },
    { t: "url", v: "https://www.bsi.bund.de/DE/Themen/Verbraucherinnen-und-Verbraucher/verbraucherinnen-und-verbraucher_node.html", p: false, why: "Offizielle Domain des BSI (bund.de), HTTPS und plausibler Pfad.", tells: ["Domain endet auf bund.de"] },
  ];
  A.phish = {
    title: "Phish or Legit?", icon: "🎣", group: "Security Lab", w: 600, h: 720,
    render(body, win) {
      const ui = gameUI(body, { hud: [["q", "Frage"], ["streak", "Streak"], ["score", "Score"], ["best", "Best"]], hint: "← Phishing · → Legit (oder Buttons) · Weiter mit Enter" });
      const card = el("div", "ph-card"); ui.stage.append(card);
      const bar = el("div", "ph-timer"); bar.innerHTML = "<i></i>"; ui.stage.append(bar);
      let Q, i, score, streak, maxStreak, wrongs, timed, tLeft, tIv = 0, answered, state = "idle";
      const hudAll = () => { ui.hud("q", `${Math.min(i + 1, Q.length)}/${Q.length}`); ui.hud("streak", streak); ui.hud("score", score); ui.hud("best", best.get("phish")); };
      const menu = () => { state = "idle"; clearInterval(tIv); card.innerHTML = ""; bar.hidden = true; ui.overlay({ badge: "PHISH OR LEGIT?", title: "Erkennst du den Betrug?", sub: "12 echte Muster aus URLs und Mails. Jede Antwort wird erklärt.", buttons: [{ label: "▶ Entspannt", primary: true, fn: () => start(false) }, { label: "⏱ Mit Zeitdruck (15 s)", fn: () => start(true) }] }); };
      const start = t => { Q = QS.slice().sort(() => Math.random() - .5); i = 0; score = 0; streak = 0; maxStreak = 0; wrongs = []; timed = t; state = "run"; ui.hide(); show(); };
      const show = () => {
        const q = Q[i]; answered = false; hudAll(); bar.hidden = !timed; clearInterval(tIv);
        card.innerHTML = `<div class="ph-tag">${q.t === "mail" ? "✉ E-MAIL" : "🔗 LINK"}</div>` + (q.t === "url"
          ? `<div class="ph-bar"><span class="ph-lock">🔒</span><span class="ph-url"></span></div>`
          : `<div class="ph-mail"><div><small>Von</small><b class="ph-from"></b></div><div><small>Betreff</small><b class="ph-subj"></b></div><p class="ph-body"></p></div>`) +
          `<div class="ph-btns"><button class="btn ph-bad" data-a="1">🎣 Phishing <small>←</small></button><button class="btn ph-good" data-a="0">✅ Legit <small>→</small></button></div><div class="ph-fb" id="phfb"></div>`;
        if (q.t === "url") $(".ph-url", card).textContent = q.v; else { $(".ph-from", card).textContent = q.from; $(".ph-subj", card).textContent = q.subj; $(".ph-body", card).textContent = q.body; }
        card.querySelectorAll("[data-a]").forEach(b => { b.onclick = () => answer(b.dataset.a === "1"); });
        if (timed) { tLeft = 15; $("i", bar).style.width = "100%"; tIv = setInterval(() => { tLeft -= .1; $("i", bar).style.width = clamp(tLeft / 15 * 100, 0, 100) + "%"; if (tLeft <= 0) { clearInterval(tIv); answer(null); } }, 100); }
      };
      const answer = guess => {
        if (answered || state !== "run") return; answered = true; clearInterval(tIv);
        const q = Q[i], ok = guess === q.p; let pts = 0;
        if (ok) { streak++; maxStreak = Math.max(maxStreak, streak); pts = 100 + Math.min(streak - 1, 5) * 20 + (timed ? Math.round(tLeft * 4) : 0); score += pts; sfx("success"); } else { streak = 0; wrongs.push(q); sfx("error"); }
        card.querySelectorAll("[data-a]").forEach(b => { b.disabled = true; b.classList.toggle("ph-pick", guess !== null && (b.dataset.a === "1") === guess); });
        const fb = $("#phfb", card); fb.className = "ph-fb " + (ok ? "ok" : "bad");
        const h = el("b"); h.textContent = guess === null ? "⏱ Zeit abgelaufen!" : ok ? `✔ Richtig! +${pts}` : "✖ Leider falsch"; const verdict = el("div", "ph-verdict"); verdict.textContent = q.p ? "Das war Phishing." : "Das war legitim."; const p = el("p"); p.textContent = q.why;
        const ul = el("ul", "gm-list"); q.tells.forEach(t => { const li = el("li"); li.textContent = t; ul.append(li); });
        const n = el("button", "btn gm-primary"); n.textContent = i + 1 >= Q.length ? "Ergebnis ▶" : "Weiter ▶"; n.onclick = next;
        fb.append(h, verdict, p, ul, n); n.focus({ preventScroll: true }); hudAll();
      };
      const next = () => { if (!answered) return; i++; if (i >= Q.length) return end(); show(); };
      const end = () => {
        state = "over"; const ok = Q.length - wrongs.length, isNew = best.set("phish", score); if (ok === Q.length) achieve("phish"); hudAll();
        const grade = ok === Q.length ? "Security-Profi 🛡" : ok >= 9 ? "Sehr aufmerksam 👀" : ok >= 6 ? "Solide – bleib wachsam" : "Mehr üben!";
        ui.overlay({ badge: isNew && score ? "🏆 NEUER REKORD" : "ERGEBNIS", title: `${ok}/${Q.length} richtig · ${score} Punkte`, sub: `${grade} · Längster Streak: ${maxStreak}`, list: wrongs.length ? ["Zum Nachlesen: " + wrongs.slice(0, 3).map(w => w.why.split(".")[0]).join(" · ")] : null, buttons: [{ label: "↻ Nochmal", primary: true, fn: menu }] });
      };
      const onKey = e => {
        if (!isActive(win) || state !== "run") return;
        if (!answered) { if (e.key === "ArrowLeft" || e.key === "a") answer(true); else if (e.key === "ArrowRight" || e.key === "d") answer(false); } else if (e.key === "Enter") { e.preventDefault(); next(); }
      };
      document.addEventListener("keydown", onKey);
      Q = QS; i = 0; score = 0; streak = 0; hudAll(); menu();
      return () => { clearInterval(tIv); document.removeEventListener("keydown", onKey); };
    },
  };
})();
