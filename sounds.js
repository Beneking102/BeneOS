"use strict";
/* BeneOS Sounds – komplett synthetisiert (Web Audio), keine Audiodateien.
   Klingt nach Retro-Desktop-OS der 90er/2000er, ist aber eigenes Material. */
(() => {
  let ctx = null, master = null, enabled = true, volume = .5;
  const ensure = () => {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor();
      master = ctx.createGain(); master.gain.value = volume;
      master.connect(comp); comp.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return true;
  };

  // Ein Ton: Frequenz (optional Gleiten), Start-Offset, Dauer, Wellenform, Lautstärke
  const tone = (f, at, dur, type = "sine", vol = .25, to = null) => {
    const t0 = ctx.currentTime + at;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + .008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + .05);
  };
  const noise = (at, dur, vol = .2, freq = 1200) => {
    const n = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = buf; f.type = "bandpass"; f.frequency.value = freq; g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(master); s.start(ctx.currentTime + at);
  };
  const chord = (fs, at, dur, vol = .1, type = "sine") => fs.forEach(f => tone(f, at, dur, type, vol));

  const S = {
    startup() { // aufsteigendes Arpeggio mit weichem Akkord-Pad
      [392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * .16, .9, "triangle", .2));
      chord([261.63, 329.63, 392, 523.25], .6, 2.2, .07);
      chord([523.25, 659.25, 783.99, 1046.5], .85, 2.0, .05);
    },
    login() { tone(660, 0, .12, "triangle", .22); tone(880, .1, .12, "triangle", .22); tone(1318.5, .2, .3, "triangle", .22); },
    shutdown() { [784, 659.25, 523.25, 392].forEach((f, i) => tone(f, i * .2, .7, "triangle", .2)); chord([196, 261.63, 329.63], .5, 1.6, .06); },
    click() { tone(1900, 0, .02, "square", .06); },
    menu() { tone(1300, 0, .015, "square", .04); },
    open() { tone(520, 0, .06, "square", .07, 780); tone(780, .06, .08, "square", .06, 1040); },
    close() { tone(900, 0, .07, "square", .06, 560); },
    minimize() { tone(700, 0, .12, "triangle", .1, 300); },
    maximize() { tone(300, 0, .12, "triangle", .1, 700); },
    error() { tone(220, 0, .16, "square", .13); tone(185, .16, .26, "square", .13); noise(0, .05, .05, 800); },
    notify() { tone(880, 0, .35, "sine", .2); tone(1174.7, .12, .5, "sine", .18); },
    success() { [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, i * .09, .35, "triangle", .2)); },
    type() { tone(700 + Math.random() * 300, 0, .012, "square", .025); },
    eat() { tone(900, 0, .06, "square", .08, 1500); },
    hit() { tone(140, 0, .12, "square", .12, 70); noise(0, .1, .12, 600); },
    block() { tone(1200, 0, .05, "square", .08, 1800); },
    pop() { tone(500, 0, .05, "square", .07, 900); },
    drop() { tone(220, 0, .06, "square", .08, 120); },
    line() { [660, 880, 1100].forEach((f, i) => tone(f, i * .05, .12, "square", .07)); },
    boom() { noise(0, .35, .25, 300); tone(90, 0, .3, "sawtooth", .15, 40); },
    win() { [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, i * .1, .3, "triangle", .2)); },
    flag() { tone(1500, 0, .04, "square", .06); tone(1000, .04, .05, "square", .06); },
    gameover() { [392, 330, 262, 196].forEach((f, i) => tone(f, i * .18, .35, "sawtooth", .12)); },
  };

  window.SFX = {
    play(name) {
      if (!enabled || !S[name] || !ensure()) return;
      try { S[name](); } catch { /* Audio darf nie das OS crashen */ }
    },
    set(on, vol) {
      enabled = !!on;
      if (typeof vol === "number") { volume = Math.min(1, Math.max(0, vol)); if (master) master.gain.value = volume; }
    },
    unlock() { ensure(); },
    // Zugriff auf den Audio-Graph (für Radio & Visualizer)
    node() { return ensure() ? { ctx, out: master } : null; },
  };
  window.sfx = n => window.SFX.play(n);
})();
