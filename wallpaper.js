"use strict";
/* Hintergrund-Engine: Matrix, Synthwave-Grid, Sternenflug, Aurora.
   Ein Canvas, ein rAF-Loop. Jeder Modus hat ein eigenes FPS-Limit und eine eigene Auflösung
   (weiche Verläufe brauchen keine volle Auflösung) – das spart massiv GPU/CPU. */
const Wallpaper = (() => {
  const cv = document.getElementById("matrix"), g = cv.getContext("2d");
  const BG = "#05060d", GLYPHS = "アイウエオカキクケコサシスセソ0123456789ABCDEF<>/{}$#";
  const CFG = {
    matrix: { gap: 55, scale: 1, label: "Matrix" },
    grid: { gap: 33, scale: .75, label: "Synthwave" },
    stars: { gap: 33, scale: .75, label: "Sternenflug" },
    aurora: { gap: 50, scale: .3, label: "Aurora" },
    off: { gap: 1e9, scale: .1, label: "Aus" },
  };
  let mode = "matrix", A = "#00f0ff", B = "#ff2bd6", paused = false, last = 0, W = 2, H = 2, S = {};

  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };
  const star = z => ({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: z ?? Math.random() * .9 + .1 });

  function init() {
    const sc = CFG[mode].scale;
    W = cv.width = Math.max(2, Math.round(innerWidth * sc));
    H = cv.height = Math.max(2, Math.round(innerHeight * sc));
    S = {};
    if (mode === "matrix") S.drops = Array.from({ length: Math.ceil(W / 16) }, () => Math.random() * -50);
    if (mode === "stars") S.stars = Array.from({ length: 200 }, () => star());
    if (mode === "off") g.clearRect(0, 0, W, H);
    else { g.fillStyle = BG; g.fillRect(0, 0, W, H); }
  }

  const draw = {
    matrix() {
      g.fillStyle = "rgba(5,6,13,.16)"; g.fillRect(0, 0, W, H);
      g.fillStyle = A; g.globalAlpha = .55; g.font = "16px monospace";
      S.drops.forEach((y, i) => {
        g.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], i * 16, y * 16);
        S.drops[i] = y * 16 > H && Math.random() > .975 ? 0 : y + 1;
      });
      g.globalAlpha = 1;
    },
    grid(t) {
      const hz = H * .55;
      g.fillStyle = BG; g.fillRect(0, 0, W, H);
      const sky = g.createLinearGradient(0, 0, 0, hz);
      sky.addColorStop(0, BG); sky.addColorStop(1, rgba(B, .22));
      g.fillStyle = sky; g.fillRect(0, 0, W, hz);
      const sun = g.createRadialGradient(W / 2, hz, 0, W / 2, hz, H * .3);
      sun.addColorStop(0, rgba(B, .85)); sun.addColorStop(.5, rgba(B, .25)); sun.addColorStop(1, rgba(B, 0));
      g.fillStyle = sun; g.fillRect(0, 0, W, hz);
      g.strokeStyle = rgba(A, .45); g.lineWidth = 1; g.beginPath();
      const off = (t / 2200) % 1;
      for (let i = 0; i < 16; i++) { const k = (i + off) / 16, y = hz + (H - hz) * k * k; g.moveTo(0, y); g.lineTo(W, y); }
      for (let i = -16; i <= 16; i++) { g.moveTo(W / 2 + i * 6, hz); g.lineTo(W / 2 + i * W * .12, H); }
      g.stroke();
      g.fillStyle = rgba(A, .5); g.fillRect(0, hz - 1, W, 2);
    },
    stars() {
      g.fillStyle = "rgba(5,6,13,.35)"; g.fillRect(0, 0, W, H);
      g.fillStyle = A;
      for (const s of S.stars) {
        s.z -= .006;
        const k = 1 / Math.max(s.z, .001), x = W / 2 + s.x * k * W * .12, y = H / 2 + s.y * k * H * .12;
        if (s.z <= .02 || x < 0 || x > W || y < 0 || y > H) { Object.assign(s, star(1)); continue; }
        g.globalAlpha = Math.min(1, (1 - s.z) * 1.3);
        const r = Math.min(2.4, .5 + (1 - s.z) * 2);
        g.fillRect(x, y, r, r);
      }
      g.globalAlpha = 1;
    },
    aurora(t) {
      g.globalCompositeOperation = "source-over"; g.clearRect(0, 0, W, H);
      g.fillStyle = BG; g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = "lighter";
      [[A, 0, .34], [B, 2.1, .3], [A, 4.2, .24]].forEach(([c, ph, al]) => {
        const x = W * (.5 + .38 * Math.sin(t / 9000 + ph)), y = H * (.45 + .3 * Math.cos(t / 11000 + ph * 1.3)), r = Math.max(W, H) * .55;
        const gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, rgba(c, al)); gr.addColorStop(1, rgba(c, 0));
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
      });
      g.globalCompositeOperation = "source-over";
    },
    off() {},
  };

  function loop(t) {
    requestAnimationFrame(loop);
    if (paused || document.hidden || mode === "off" || t - last < CFG[mode].gap) return;
    last = t;
    draw[mode](t);
  }

  let rt = 0;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(init, 150); });
  init();
  requestAnimationFrame(loop);

  return {
    modes: Object.keys(CFG),
    labels: Object.fromEntries(Object.entries(CFG).map(([k, v]) => [k, v.label])),
    get mode() { return mode; },
    set(m, a, b) {
      const next = CFG[m] ? m : "matrix", changed = next !== mode;
      mode = next; A = a || A; B = b || B;
      if (changed) init();
    },
    pause(p) { paused = !!p; },
  };
})();
