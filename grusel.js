"use strict";
// Grusel-Chip: drei Schreck-Szenen (Wir sehen dich / Hinter dir / Glitch), jede mit harmloser Auflösung.
// Alles läuft lokal im Browser. Einzige Server-Abfrage: grobe Stadt + Provider aus der IP (/api/osint), nichts wird gespeichert.
(() => {
  const $ = id => document.getElementById(id);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const buzz = p => { try { navigator.vibrate && navigator.vibrate(p); } catch {} };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const show = id => document.querySelectorAll(".scene").forEach(s => s.classList.toggle("on", s.id === id));
  const fit = cv => { const r = devicePixelRatio || 1; cv.width = innerWidth * r; cv.height = innerHeight * r; const g = cv.getContext("2d"); g.setTransform(r, 0, 0, r, 0, 0); return g; };

  function reveal(head, text, tech) {
    $("rhead").textContent = head;
    $("rtext").textContent = text;
    $("rtech").textContent = tech || "";
    $("reveal").classList.add("on");
    buzz([40, 30, 40]);
  }
  $("again").addEventListener("click", () => location.assign("/grusel.html"));

  function say(text, opts = {}) {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "de-DE"; u.rate = opts.rate ?? 0.85; u.pitch = opts.pitch ?? 0.4; u.volume = 1;
      speechSynthesis.speak(u);
      return new Promise(r => { u.onend = r; setTimeout(r, 9000); });
    } catch { return wait(1500); }
  }

  const ua = navigator.userAgent;
  const device = (/Android [\d.]+; ([^;)]+)/.exec(ua) || [])[1]?.replace(/ Build.*/, "")
    || (/iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : "dein Gerät");

  /* ---------- 1) Wir sehen dich ---------- */
  async function sehen() {
    document.title = "…";
    show("sehen");
    const term = $("sterm");
    const cur = document.createElement("span"); cur.className = "cur"; term.append(cur);
    const line = async (text, cls = "", ms = 26) => {
      const el = document.createElement("span"); if (cls) el.className = cls; term.insertBefore(el, cur);
      for (const ch of text) { el.textContent += ch; if (!reduced) await wait(ms); }
      term.insertBefore(document.createTextNode("\n"), cur);
    };

    const geo = await Promise.race([
      fetch("/api/osint").then(r => r.ok ? r.json() : null).then(j => j && j.geo).catch(() => null),
      wait(3000).then(() => null),
    ]);
    let battery = "";
    try { const b = await navigator.getBattery(); battery = Math.round(b.level * 100) + " %" + (b.charging ? ", lädt" : ""); } catch {}
    const now = new Date();
    const uhr = now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

    await wait(500); buzz(40);
    await line("> eingehende Verbindung …", "", 30);
    await wait(500);
    await line("");
    await line(`Hallo, ${device}.`, "w", 45);
    await wait(700);
    if (battery) { await line(`Dein Akku: ${battery}.`, "w"); await wait(500); }
    await line(`Bei dir ist es ${uhr} Uhr.`, "w"); await wait(500);
    if (geo && geo.city) { await line(`Du bist gerade in ${geo.city}${geo.region ? " (" + geo.region + ")" : ""}.`, "w"); await wait(500); }
    if (geo && geo.org) { await line(`Dein Internetanbieter: ${geo.org}.`, "w"); await wait(600); }
    await line("");
    await line("Ich sehe dich.", "r", 70); buzz([0, 200, 80, 200]);
    await wait(1700);
    reveal("Nur geguckt.",
      "Nichts davon ist ein Hack. Uhrzeit und Akku verrät dein Browser jeder Seite, Stadt und Anbieter stecken in deiner IP-Adresse. Gespeichert wurde nichts.",
      "Lektion: Metadaten allein reichen für erstaunlich viel. Das ist OSINT.");
  }

  /* ---------- 2) Hinter dir ---------- */
  async function hinter() {
    document.title = "Gesichtserkennung";
    show("hinter");
    const vid = $("hvid"), lbl = $("hlbl"), fig = $("hfig"), scan = $("hscan");
    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      vid.srcObject = stream; await vid.play();
    } catch {
      show("sehen"); // ohne Kamera auf die harmlose Variante ausweichen
      return sehen();
    }
    // Scanlinie läuft rauf und runter
    let sy = 0, sd = 1;
    const scanLoop = setInterval(() => { sy += sd * 3; if (sy > innerHeight || sy < 0) sd *= -1; scan.style.top = sy + "px"; }, 16);

    const steps = ["Gesicht erkannt.", "Analysiere Umgebung …", "Prüfe Hintergrund …", "Zähle Personen im Bild …"];
    for (const s of steps) { lbl.textContent = s; await wait(1400); }

    // Gestalt blitzt kurz hinter der Person auf
    const flash = async () => {
      fig.style.transition = "opacity .12s"; fig.style.opacity = "0.9"; buzz(40);
      await wait(140); fig.style.opacity = "0"; await wait(60);
    };
    lbl.textContent = "Moment …";
    await wait(600); await flash(); await wait(900); await flash(); await flash();
    lbl.innerHTML = '<span style="color:#ff2d3f">2 Personen erkannt.</span> Du bist allein, oder?';
    buzz([0, 120, 60, 120]);
    await wait(1600);
    $("hbtn").hidden = false;
    lbl.textContent = "Tippe, um die zweite Person zu identifizieren.";

    await new Promise(r => $("hbtn").addEventListener("click", r, { once: true }));
    clearInterval(scanLoop); scan.style.display = "none"; $("hbtn").hidden = true; fig.style.display = "none";
    lbl.textContent = "";
    // Flüstern + kurzer Jump-Scare
    say("Dreh dich nicht um.", { rate: 0.8, pitch: 0.3 });
    await wait(1200);
    const face = $("hface");
    $("hwarn").classList.add("on");
    face.style.transition = "opacity .05s"; face.style.opacity = "1";
    buzz([0, 500]);
    try { const o = new (window.AudioContext || window.webkitAudioContext)(); const osc = o.createOscillator(), gn = o.createGain();
      osc.type = "sawtooth"; osc.frequency.value = 90; gn.gain.value = 0.25; osc.connect(gn); gn.connect(o.destination); osc.start();
      gn.gain.exponentialRampToValueAtTime(0.001, o.currentTime + 1.1); osc.stop(o.currentTime + 1.1); } catch {}
    await wait(1400);
    if (stream) stream.getTracks().forEach(t => t.stop());
    reveal("Du bist allein.",
      "Keine zweite Person, kein Gesicht, nichts aufgenommen. Das Kamerabild lief nur live in deinem Browser und ist jetzt weg.",
      "Aber: Du hast einem unbekannten Chip die Kamera erlaubt. Genau das sollte man sich zweimal überlegen.");
  }

  /* ---------- 3) Glitch ---------- */
  async function glitch() {
    document.title = "Verbindung";
    show("glitch");
    const cv = $("gcv"), g = fit(cv), W = innerWidth, H = innerHeight, txt = $("gtxt");
    const GLY = "01アカサタナハマ#$%<>{}/\\|";
    const cols = Math.ceil(W / 14), drops = Array.from({ length: cols }, () => Math.random() * -40);
    let run = true, red = false;
    const rain = () => {
      g.fillStyle = "rgba(0,0,0,.14)"; g.fillRect(0, 0, W, H);
      g.font = "14px monospace"; g.fillStyle = red ? "rgba(255,45,63,.6)" : "rgba(57,255,122,.5)";
      drops.forEach((y, i) => { g.fillText(GLY[Math.random() * GLY.length | 0], i * 14, y * 14); drops[i] = y * 14 > H && Math.random() > .975 ? 0 : y + 1; });
      if (run) requestAnimationFrame(rain);
    };
    rain();
    const set = (big, small) => { txt.innerHTML = big + (small ? `<small>${small}</small>` : ""); };

    await wait(900);
    set("VERBINDUNG ERKANNT", `Unbekanntes Gerät · ${device}`); buzz(60);
    await wait(1800);
    set("ZUGRIFF WIRD AUFGEBAUT", "Bitte Gerät nicht bewegen");
    document.body.classList.add("gl"); buzz([0, 80, 40, 80, 40, 200]);
    await wait(1400); red = true;
    set("███ ÜBERNAHME ███", "signal verloren…");
    await wait(1100);
    document.body.classList.remove("gl");
    // kurzer Blackout
    txt.innerHTML = ""; g.fillStyle = "#000"; g.fillRect(0, 0, W, H); run = false;
    buzz(300);
    await wait(1200);
    reveal("War nur Show.",
      "Niemand hat dein Gerät übernommen. Das war ein bisschen Matrix-Regen und Geflacker in deinem Browser – mehr nicht.",
      "Echte Angriffe sehen übrigens völlig unspektakulär aus. Genau das macht sie gefährlich.");
  }

  const SCARES = { sehen, hinter, glitch };
  const forced = new URLSearchParams(location.search).get("p");
  const keys = Object.keys(SCARES);
  (SCARES[forced] || SCARES[keys[Math.random() * keys.length | 0]])();
})();
