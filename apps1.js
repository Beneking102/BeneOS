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
})();
