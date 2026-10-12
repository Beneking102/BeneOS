"use strict";
/* Tools & Spiele: Rechner (mit Programmierer-Modus), PixelLab, Minesweeper, Tetris, Typing-Test.
   Wird vor os.js geladen; Helfer ($, el, esc, store, settings, sfx, achieve) werden erst beim Rendern benutzt. */
window.EXTRA_APPS = window.EXTRA_APPS || {};
(() => {
  const A = window.EXTRA_APPS;
  const isActive = win => win.classList.contains("active") && !win.classList.contains("hidden");

  /* ---------- Rechner ---------- */
  function evalExpr(src) {
    const t = src.replace(/\s+/g, "").replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/,/g, ".");
    let i = 0;
    const num = () => {
      const m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(t.slice(i));
      if (!m) throw new Error("Zahl erwartet");
      i += m[0].length; return parseFloat(m[0]);
    };
    const prim = () => {
      if (t[i] === "(") { i++; const v = expr(); if (t[i++] !== ")") throw new Error("Klammer fehlt"); return v; }
      return num();
    };
    const unary = () => { if (t[i] === "-") { i++; return -unary(); } if (t[i] === "+") { i++; return unary(); } return prim(); };
    const pow = () => { const b = unary(); if (t[i] === "^") { i++; return Math.pow(b, pow()); } return b; };
    const term = () => {
      let v = pow();
      while (t[i] === "*" || t[i] === "/" || t[i] === "%") { const o = t[i++], r = pow(); v = o === "*" ? v * r : o === "/" ? v / r : v % r; }
      return v;
    };
    const expr = () => {
      let v = term();
      while (t[i] === "+" || t[i] === "-") { const o = t[i++], r = term(); v = o === "+" ? v + r : v - r; }
      return v;
    };
    const v = expr();
    if (i !== t.length) throw new Error("Unerwartetes Zeichen");
    if (!Number.isFinite(v)) throw new Error("Nicht definiert");
    return v;
  }
  A.calc = {
    title: "Rechner", icon: "🧮", group: "Tools", w: 340, h: 610,
    render(body, win) {
      let mode = "std", expr = "", hist = "", fresh = false;
      let pa = 0n, pb = 0n, pres = null;
      const fmt = n => String(+n.toPrecision(12));
      const press = k => {
        sfx("click");
        if (k === "C") { expr = ""; hist = ""; fresh = false; }
        else if (k === "⌫") expr = expr.slice(0, -1);
        else if (k === "=") {
          if (!expr) return;
          try { const r = fmt(evalExpr(expr)); hist = expr + " ="; expr = r; fresh = true; }
          catch (e) { hist = e.message; expr = ""; fresh = false; }
        } else {
          if (fresh && /[\d.(]/.test(k)) expr = "";
          fresh = false;
          expr += k;
        }
        drawStd();
      };
      const drawStd = () => {
        $(".cdisp b", body).textContent = expr || "0";
        $(".cdisp small", body).textContent = hist;
      };
      const BITS = 32;
      const asU = v => BigInt.asUintN(64, v);
      const parse = s => { s = s.trim().toLowerCase().replace(/_/g, ""); if (!s) return 0n; if (!/^(0x[0-9a-f]+|0b[01]+|0o[0-7]+|\d+)$/.test(s)) throw new Error("Ungültige Zahl"); return BigInt(s); };
      const drawProg = () => {
        const bits = Array.from({ length: BITS }, (_, i) => BITS - 1 - i);
        const res = pres === null ? pa : pres;
        body.innerHTML = `<div class="pad"><div class="tabs"><button class="tab" data-m="std">Standard</button><button class="tab on" data-m="prog">Programmierer</button></div>
          <label class="dim">A</label><input class="field" id="pa" value="${pa}" spellcheck="false" style="margin:4px 0">
          <label class="dim">B</label><input class="field" id="pb" value="${pb}" spellcheck="false" style="margin:4px 0">
          <div class="opbar" id="pops">${["AND", "OR", "XOR", "NOT A", "A << B", "A >> B", "A + B", "A − B"].map(o => `<button class="btn" data-o="${o}">${o}</button>`).join("")}</div>
          <h2>Ergebnis (64 Bit)</h2><div class="kv" id="pres"></div>
          <h2>Bits von A (klicken zum Umschalten)</h2><div class="bits">${bits.map(b => `<button class="bit ${(asU(pa) >> BigInt(b)) & 1n ? "on" : ""}" data-b="${b}" title="Bit ${b}">${(asU(pa) >> BigInt(b)) & 1n ? 1 : 0}</button>`).join("")}</div>
          <div id="perr" style="color:#ff5470;min-height:20px"></div></div>`;
        const r = asU(res);
        $("#pres", body).innerHTML = `<span>DEC</span><b>${BigInt.asIntN(64, r)}</b><span>HEX</span><b>0x${r.toString(16).toUpperCase()}</b><span>BIN</span><b style="word-break:break-all;font-family:var(--mono);font-size:11.5px">${r.toString(2)}</b><span>OCT</span><b>0o${r.toString(8)}</b>`;
        const read = () => { try { pa = parse($("#pa", body).value); pb = parse($("#pb", body).value); $("#perr", body).textContent = ""; return true; } catch (e) { $("#perr", body).textContent = e.message; return false; } };
        $("#pops", body).onclick = e => {
          const o = e.target.closest("[data-o]")?.dataset.o; if (!o || !read()) return;
          const n = Number(pb % 64n);
          pres = ({ AND: pa & pb, OR: pa | pb, XOR: pa ^ pb, "NOT A": ~pa, "A << B": pa << BigInt(n), "A >> B": pa >> BigInt(n), "A + B": pa + pb, "A − B": pa - pb })[o];
          sfx("click"); drawProg();
        };
        body.querySelector(".bits").onclick = e => { const b = e.target.closest("[data-b]"); if (!b || !read()) return; pa = asU(pa) ^ (1n << BigInt(b.dataset.b)); pres = null; sfx("pop"); drawProg(); };
        body.querySelectorAll("[data-m]").forEach(b => { b.onclick = () => { mode = b.dataset.m; draw(); }; });
      };
      const draw = () => {
        if (mode === "prog") { drawProg(); return; }
        const keys = ["C", "(", ")", "÷", "7", "8", "9", "×", "4", "5", "6", "−", "1", "2", "3", "+", "0", ".", "^", "="];
        body.innerHTML = `<div class="pad"><div class="tabs"><button class="tab on" data-m="std">Standard</button><button class="tab" data-m="prog">Programmierer</button></div>
          <div class="cdisp"><small></small><b></b></div>
          <div class="ckeys">${keys.map(k => `<button class="ck ${/[÷×−+^]/.test(k) ? "op" : k === "=" ? "eq" : k === "C" ? "cl" : ""}" data-k="${k}">${k}</button>`).join("")}<button class="ck" data-k="⌫" style="grid-column: span 2">⌫</button><button class="ck" data-k="%">mod</button><button class="ck" data-k="," >,</button></div></div>`;
        body.querySelectorAll("[data-k]").forEach(b => { b.onclick = () => press(b.dataset.k === "," ? "." : b.dataset.k); });
        body.querySelectorAll("[data-m]").forEach(b => { b.onclick = () => { mode = b.dataset.m; draw(); }; });
        drawStd();
      };
      const onKey = e => {
        if (!isActive(win) || mode !== "std" || e.target.closest?.("input, textarea")) return;
        const m = { "*": "×", "/": "÷", "-": "−" };
        if (/^[0-9.+^()%]$/.test(e.key)) press(e.key);
        else if (m[e.key]) press(m[e.key]);
        else if (e.key === "Enter" || e.key === "=") { e.preventDefault(); press("="); }
        else if (e.key === "Backspace") press("⌫");
        else if (e.key === "Escape") press("C");
      };
      document.addEventListener("keydown", onKey);
      draw();
      return () => document.removeEventListener("keydown", onKey);
    },
  };

  /* ---------- PixelLab ---------- */
  A.paint = {
    title: "PixelLab", icon: "🎨", group: "Tools", w: 560, h: 560,
    render(body) {
      const W = 480, H = 320, BG = "#0b1020";
      const COLORS = ["#ffffff", "#00f0ff", "#ff2bd6", "#39ff88", "#ffb020", "#a66bff", "#ff3b5c", "#7aa2ff", "#000000"];
      body.innerHTML = `<div class="pad paint"><div class="opbar" id="tools">
          ${[["pen", "✏ Stift"], ["eraser", "⌫ Radierer"], ["fill", "🪣 Füllen"], ["line", "／ Linie"], ["rect", "▭ Rechteck"]].map(([k, t]) => `<button class="btn ${k === "pen" ? "on" : ""}" data-t="${k}">${t}</button>`).join("")}</div>
        <div class="opbar" style="margin:8px 0;align-items:center"><span id="pal" class="swatches" style="margin:0"></span><input type="color" id="pcol" value="#00f0ff" aria-label="Farbe wählen">
          <select class="field" id="psz" style="width:auto;margin:0" aria-label="Pinselgröße">${[1, 2, 4, 8, 16].map(s => `<option value="${s}" ${s === 4 ? "selected" : ""}>${s}px</option>`).join("")}</select>
          <button class="btn" id="pundo">↶ Zurück</button><button class="btn" id="pclr">Leeren</button><button class="btn" id="psave">💾 PNG</button></div>
        <canvas class="game" id="pc" width="${W}" height="${H}" style="cursor:crosshair;max-width:100%;background:${BG}"></canvas></div>`;
      const cv = $("#pc", body), g = cv.getContext("2d", { willReadFrequently: true });
      g.fillStyle = BG; g.fillRect(0, 0, W, H); g.lineCap = "round"; g.lineJoin = "round";
      let tool = "pen", color = "#00f0ff", size = 4, undo = [], drawing = false, start = null, snap = null, lastP = null;
      const pal = $("#pal", body);
      pal.innerHTML = COLORS.map(c => `<button class="sw ${c === color ? "on" : ""}" data-c="${c}" style="background:${c};width:24px;height:24px" aria-label="Farbe ${c}"></button>`).join("");
      const setColor = c => { color = c; $("#pcol", body).value = c; pal.querySelectorAll(".sw").forEach(x => x.classList.toggle("on", x.dataset.c === c)); };
      pal.onclick = e => { const b = e.target.closest("[data-c]"); if (b) setColor(b.dataset.c); };
      $("#pcol", body).oninput = e => setColor(e.target.value);
      $("#psz", body).onchange = e => { size = +e.target.value; };
      $("#tools", body).onclick = e => { const b = e.target.closest("[data-t]"); if (!b) return; tool = b.dataset.t; body.querySelectorAll("#tools .btn").forEach(x => x.classList.toggle("on", x === b)); };
      const push = () => { undo.push(g.getImageData(0, 0, W, H)); if (undo.length > 25) undo.shift(); };
      const pos = e => { const r = cv.getBoundingClientRect(); return [Math.floor((e.clientX - r.left) * W / r.width), Math.floor((e.clientY - r.top) * H / r.height)]; };
      const flood = (sx, sy) => {
        const img = g.getImageData(0, 0, W, H), d = new Uint32Array(img.data.buffer);
        const n = parseInt(color.slice(1), 16), col = (255 << 24) | ((n & 255) << 16) | ((n >> 8 & 255) << 8) | (n >> 16 & 255);
        const target = d[sy * W + sx]; if (target === col) return;
        const st = [sx, sy];
        while (st.length) {
          const y = st.pop(), x = st.pop();
          if (x < 0 || y < 0 || x >= W || y >= H || d[y * W + x] !== target) continue;
          d[y * W + x] = col;
          st.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
        }
        g.putImageData(img, 0, 0);
      };
      const shape = (a, b) => {
        g.strokeStyle = color; g.lineWidth = size;
        g.beginPath();
        if (tool === "line") { g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); }
        else g.rect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
        g.stroke();
      };
      cv.addEventListener("pointerdown", e => {
        const p = pos(e);
        if (tool === "fill") { push(); flood(...p); sfx("pop"); return; }
        push(); drawing = true; start = p; lastP = p; cv.setPointerCapture(e.pointerId);
        if (tool === "line" || tool === "rect") snap = g.getImageData(0, 0, W, H);
        else { g.strokeStyle = tool === "eraser" ? BG : color; g.lineWidth = tool === "eraser" ? size * 3 : size; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0] + .01, p[1]); g.stroke(); }
      });
      cv.addEventListener("pointermove", e => {
        if (!drawing) return;
        const p = pos(e);
        if (snap) { g.putImageData(snap, 0, 0); shape(start, p); }
        else { g.beginPath(); g.moveTo(lastP[0], lastP[1]); g.lineTo(p[0], p[1]); g.stroke(); lastP = p; }
      });
      const end = () => { drawing = false; snap = null; };
      cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
      $("#pundo", body).onclick = () => { const s = undo.pop(); if (s) { g.putImageData(s, 0, 0); sfx("click"); } };
      $("#pclr", body).onclick = () => { push(); g.fillStyle = BG; g.fillRect(0, 0, W, H); sfx("close"); };
      $("#psave", body).onclick = () => {
        cv.toBlob(b => { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "pixellab.png"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); achieve("paint"); sfx("success"); });
      };
    },
  };

  /* ---------- Minesweeper ---------- */
  A.mines = {
    title: "Minesweeper", icon: "💣", group: "Fun", w: 360, h: 560,
    render(body) {
      const R = 9, C = 9, M = 10;
      let cells, first, over, flags, secs, timer, flagMode = false;
      body.innerHTML = `<div class="center"><div class="msbar"><span>💣 <b id="mf">0</b></span><button class="btn" id="mface" aria-label="Neustart">🙂</button><span>⏱ <b id="mt">0</b></span></div>
        <div class="mgrid" style="grid-template-columns:repeat(${C},34px)"></div>
        <label class="chk"><input type="checkbox" id="mflag"> Flaggen-Modus (für Touch)</label><div class="dim" style="font-size:12px;text-align:center">Linksklick: aufdecken · Rechtsklick: Flagge · Doppelklick auf Zahl: Nachbarn</div></div>`;
      const grid = $(".mgrid", body);
      const nb = i => { const r = (i / C) | 0, c = i % C, o = []; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { if (!dr && !dc) continue; const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < R && cc >= 0 && cc < C) o.push(rr * C + cc); } return o; };
      const reset = () => {
        clearInterval(timer); timer = 0; secs = 0; first = true; over = false; flags = 0;
        cells = Array.from({ length: R * C }, () => ({ mine: false, open: false, flag: false, n: 0 }));
        grid.innerHTML = cells.map((_, i) => `<button class="cell" data-i="${i}" aria-label="Feld"></button>`).join("");
        $("#mface", body).textContent = "🙂"; render();
      };
      const place = safe => {
        const ban = new Set([safe, ...nb(safe)]);
        let n = 0; while (n < M) { const i = (Math.random() * R * C) | 0; if (!cells[i].mine && !ban.has(i)) { cells[i].mine = true; n++; } }
        cells.forEach((c, i) => { c.n = nb(i).filter(j => cells[j].mine).length; });
      };
      const render = () => {
        const btns = grid.children;
        cells.forEach((c, i) => {
          const b = btns[i];
          b.className = "cell" + (c.open ? " open" : "") + (c.open && c.mine ? " mine" : "");
          b.dataset.n = c.open && !c.mine ? c.n : "";
          b.textContent = c.open ? (c.mine ? "💥" : c.n || "") : c.flag ? "🚩" : "";
        });
        $("#mf", body).textContent = M - flags; $("#mt", body).textContent = secs;
      };
      const finish = won => {
        over = true; clearInterval(timer);
        cells.forEach(c => { if (c.mine) c.open = true; });
        $("#mface", body).textContent = won ? "😎" : "😵";
        if (won) { sfx("win"); achieve("mines"); } else sfx("boom");
        render();
      };
      const reveal = i => {
        const st = [i];
        while (st.length) {
          const j = st.pop(), c = cells[j];
          if (c.open || c.flag) continue;
          c.open = true;
          if (c.mine) { finish(false); return; }
          if (c.n === 0) st.push(...nb(j));
        }
        if (cells.filter(c => c.open).length === R * C - M) finish(true);
      };
      const act = (i, flag) => {
        if (over) return;
        const c = cells[i];
        if (flag) { if (c.open) return; c.flag = !c.flag; flags += c.flag ? 1 : -1; sfx("flag"); render(); return; }
        if (c.flag || c.open) return;
        if (first) { first = false; place(i); timer = setInterval(() => { secs++; $("#mt", body).textContent = secs; }, 1000); }
        sfx("pop"); reveal(i); if (!over) render();
      };
      grid.addEventListener("click", e => { const b = e.target.closest(".cell"); if (b) act(+b.dataset.i, flagMode); });
      grid.addEventListener("contextmenu", e => { const b = e.target.closest(".cell"); if (b) { e.preventDefault(); act(+b.dataset.i, true); } });
      grid.addEventListener("dblclick", e => {
        const b = e.target.closest(".cell"); if (!b || over) return;
        const i = +b.dataset.i, c = cells[i];
        if (c.open && c.n && nb(i).filter(j => cells[j].flag).length === c.n) { nb(i).forEach(j => { if (!cells[j].open && !cells[j].flag && !over) reveal(j); }); if (!over) render(); }
      });
      $("#mface", body).onclick = reset;
      $("#mflag", body).onchange = e => { flagMode = e.target.checked; };
      reset();
      return () => clearInterval(timer);
    },
  };

  /* ---------- Tetris ---------- */
  A.tetris = {
    title: "Tetris", icon: "🧱", group: "Fun", w: 420, h: 590,
    render(body, win) {
      const COLS = 10, ROWS = 20, S = 26;
      const SH = {
        I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], O: [[1, 1], [1, 1]], T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
        S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]], Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]], J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]], L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
      };
      const COL = { I: "#00f0ff", O: "#ffd23c", T: "#a66bff", S: "#39ff88", Z: "#ff3b5c", J: "#7aa2ff", L: "#ff9f1a" };
      const wrap = el("div", "center", `<div class="tstats">Score <b id="ts">0</b> · Linien <b id="tl">0</b> · Level <b id="tv">1</b> · Best <b id="tb">${store.get("tetris-best", 0)}</b></div>
        <div style="display:flex;gap:12px;align-items:flex-start"><canvas class="game" id="tc" width="${COLS * S}" height="${ROWS * S}"></canvas>
        <div><div class="dim" style="font-size:12px">Nächster</div><canvas class="game" id="tn" width="104" height="104"></canvas>
        <div class="dim" style="font-size:12px;margin-top:10px;line-height:1.6">← → bewegen<br>↑ drehen<br>↓ schneller<br>Leertaste: Drop<br>P: Pause</div><button class="btn" id="tr" style="margin-top:10px">Neustart</button></div></div>`);
      body.append(wrap);
      const cv = $("#tc", wrap), g = cv.getContext("2d"), nv = $("#tn", wrap), ng = nv.getContext("2d");
      let board, cur, nxt, score, lines, level, over, paused, acc, last, raf, bag = [];
      const rot = m => m[0].map((_, i) => m.map(r => r[i]).reverse());
      const next = () => { if (!bag.length) bag = Object.keys(SH).sort(() => Math.random() - .5); const k = bag.pop(); return { k, m: SH[k].map(r => r.slice()), x: 0, y: 0 }; };
      const hit = (m, x, y) => m.some((r, j) => r.some((v, i) => v && (x + i < 0 || x + i >= COLS || y + j >= ROWS || (y + j >= 0 && board[y + j][x + i]))));
      const spawn = () => {
        cur = nxt || next(); nxt = next();
        cur.x = ((COLS - cur.m[0].length) / 2) | 0; cur.y = cur.k === "I" ? -1 : 0;
        if (hit(cur.m, cur.x, cur.y)) { over = true; sfx("gameover"); if (score > store.get("tetris-best", 0)) { store.set("tetris-best", score); $("#tb", wrap).textContent = score; } }
      };
      const reset = () => { board = Array.from({ length: ROWS }, () => Array(COLS).fill(0)); score = lines = 0; level = 1; over = false; paused = false; acc = 0; nxt = null; spawn(); stats(); };
      const stats = () => { $("#ts", wrap).textContent = score; $("#tl", wrap).textContent = lines; $("#tv", wrap).textContent = level; };
      const lock = () => {
        cur.m.forEach((r, j) => r.forEach((v, i) => { if (v && cur.y + j >= 0) board[cur.y + j][cur.x + i] = COL[cur.k]; }));
        let n = 0;
        for (let y = ROWS - 1; y >= 0; y--) if (board[y].every(Boolean)) { board.splice(y, 1); board.unshift(Array(COLS).fill(0)); n++; y++; }
        if (n) { score += [0, 100, 300, 500, 800][n] * level; lines += n; level = 1 + ((lines / 10) | 0); sfx("line"); if (score >= 500) achieve("tetris"); } else sfx("drop");
        stats(); spawn();
      };
      const move = dx => { if (!hit(cur.m, cur.x + dx, cur.y)) cur.x += dx; };
      const turn = () => { const m = rot(cur.m); for (const k of [0, -1, 1, -2, 2]) if (!hit(m, cur.x + k, cur.y)) { cur.m = m; cur.x += k; sfx("click"); return; } };
      const step = () => { if (!hit(cur.m, cur.x, cur.y + 1)) cur.y++; else lock(); };
      const drop = () => { while (!hit(cur.m, cur.x, cur.y + 1)) { cur.y++; score += 2; } lock(); };
      const cell = (ctx, x, y, c, s) => { ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 8; ctx.fillRect(x * s + 1, y * s + 1, s - 2, s - 2); ctx.shadowBlur = 0; };
      const draw = () => {
        g.fillStyle = "#000"; g.fillRect(0, 0, cv.width, cv.height);
        g.strokeStyle = "rgba(255,255,255,.05)";
        for (let x = 1; x < COLS; x++) { g.beginPath(); g.moveTo(x * S, 0); g.lineTo(x * S, ROWS * S); g.stroke(); }
        board.forEach((r, y) => r.forEach((c, x) => { if (c) cell(g, x, y, c, S); }));
        if (!over) {
          let gy = cur.y; while (!hit(cur.m, cur.x, gy + 1)) gy++;
          cur.m.forEach((r, j) => r.forEach((v, i) => { if (v) { g.strokeStyle = COL[cur.k]; g.globalAlpha = .3; g.strokeRect((cur.x + i) * S + 2, (gy + j) * S + 2, S - 4, S - 4); g.globalAlpha = 1; } }));
          cur.m.forEach((r, j) => r.forEach((v, i) => { if (v && cur.y + j >= 0) cell(g, cur.x + i, cur.y + j, COL[cur.k], S); }));
        }
        ng.fillStyle = "#000"; ng.fillRect(0, 0, 104, 104);
        const m = nxt.m, off = (104 - m.length * 22) / 2;
        m.forEach((r, j) => r.forEach((v, i) => { if (v) { ng.fillStyle = COL[nxt.k]; ng.fillRect(off + i * 22 + 1, off + j * 22 + 1, 20, 20); } }));
        if (over || paused) {
          g.fillStyle = "rgba(0,0,0,.7)"; g.fillRect(0, 0, cv.width, cv.height);
          g.fillStyle = over ? "#ff5470" : "#cfeaff"; g.font = "bold 24px monospace"; g.textAlign = "center";
          g.fillText(over ? "GAME OVER" : "PAUSE", cv.width / 2, cv.height / 2);
        }
      };
      const loop = t => {
        raf = requestAnimationFrame(loop);
        const dt = Math.min(100, t - (last || t)); last = t;
        if (win.classList.contains("hidden") || over || paused) { draw(); return; }
        acc += dt;
        const ms = Math.max(90, 800 - (level - 1) * 70);
        while (acc > ms) { acc -= ms; step(); if (over) break; }
        draw();
      };
      const onKey = e => {
        if (!isActive(win)) return;
        const k = e.key;
        if (k === "p" || k === "P") { paused = !paused; return; }
        if (over) { if (k === "Enter") reset(); return; }
        if (paused) return;
        if (k === "ArrowLeft") move(-1); else if (k === "ArrowRight") move(1); else if (k === "ArrowUp") turn();
        else if (k === "ArrowDown") { step(); score += 1; stats(); } else if (k === " ") drop(); else return;
        e.preventDefault();
      };
      document.addEventListener("keydown", onKey);
      $("#tr", wrap).onclick = reset;
      reset(); raf = requestAnimationFrame(loop);
      return () => { cancelAnimationFrame(raf); document.removeEventListener("keydown", onKey); };
    },
  };

  /* ---------- Typing-Test ---------- */
  A.typing = {
    title: "Hacker Typing", icon: "⌨", group: "Fun", w: 560, h: 420,
    render(body) {
      const TEXTS = [
        "sudo apt update && sudo apt upgrade -y",
        "nmap -sV -p- --open 10.0.0.5",
        "Never trust user input. Validate on the server and escape on output.",
        "ssh-keygen -t ed25519 -C \"bene@beneos\"",
        "A strong password is long, random and unique for every account.",
        "curl -sI https://example.com | grep -i content-security-policy",
        "Parameterized queries stop SQL injection before it starts.",
        "git commit -m \"fix: sanitize redirect parameter\" && git push",
      ];
      let text, startT, done;
      body.innerHTML = `<div class="pad"><h1>Hacker Typing</h1><div class="dim">Tippe den Text ab – je schneller und genauer, desto besser. Best: <b id="wb">${store.get("wpm-best", 0)}</b> WPM</div>
        <div class="target" id="tg"></div><input class="field" id="ti" autocomplete="off" spellcheck="false" placeholder="Hier tippen …">
        <div class="kv" id="tstat"><span>WPM</span><b id="w1">0</b><span>Genauigkeit</span><b id="w2">100%</b><span>Zeit</span><b id="w3">0.0s</b></div>
        <div class="opbar" style="margin-top:10px"><button class="btn" id="tnew">Neuer Text</button></div><div id="tres" style="margin-top:10px;min-height:22px"></div></div>`;
      const tg = $("#tg", body), ti = $("#ti", body);
      const load = () => {
        text = TEXTS[(Math.random() * TEXTS.length) | 0]; startT = 0; done = false; ti.value = ""; ti.disabled = false; $("#tres", body).textContent = "";
        tg.innerHTML = [...text].map(c => `<span>${esc(c)}</span>`).join(""); upd(); ti.focus();
      };
      const upd = () => {
        const v = ti.value, sp = tg.children; let ok = 0;
        for (let i = 0; i < sp.length; i++) {
          const c = v[i];
          sp[i].className = c == null ? (i === v.length ? "cur" : "") : c === text[i] ? "good" : "bad";
          if (c === text[i]) ok++;
        }
        const t = startT ? (performance.now() - startT) / 1000 : 0;
        $("#w1", body).textContent = t > .5 ? Math.round(ok / 5 / (t / 60)) : 0;
        $("#w2", body).textContent = v.length ? Math.round(ok / v.length * 100) + "%" : "100%";
        $("#w3", body).textContent = t.toFixed(1) + "s";
        if (!done && v.length >= text.length) {
          done = true; ti.disabled = true;
          const wpm = Math.round(ok / 5 / (t / 60)), acc = Math.round(ok / text.length * 100);
          $("#tres", body).innerHTML = `<b style="color:#39ff88">Fertig!</b> ${wpm} WPM bei ${acc}% Genauigkeit.`;
          if (wpm > store.get("wpm-best", 0)) { store.set("wpm-best", wpm); $("#wb", body).textContent = wpm; }
          sfx(acc >= 90 ? "success" : "error"); if (wpm >= 30 && acc >= 90) achieve("typist");
        }
      };
      ti.addEventListener("input", () => { if (!startT && ti.value) startT = performance.now(); sfx("type"); upd(); });
      $("#tnew", body).onclick = load;
      const tick = setInterval(() => { if (startT && !done) upd(); }, 200);
      load();
      return () => clearInterval(tick);
    },
  };
})();
