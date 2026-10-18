"use strict";
// Grusel-Chip: drei Schreck-Szenen (Wir sehen dich / Hinter dir / Besessen), jede mit harmloser Auflösung.
// Alles läuft lokal im Browser. Einzige Server-Abfrage: grobe Stadt + Provider aus der IP (/api/osint), nichts wird gespeichert.
(() => {
  const $ = id => document.getElementById(id);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const buzz = p => { try { navigator.vibrate && navigator.vibrate(p); } catch {} };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const show = id => document.querySelectorAll(".scene").forEach(s => s.classList.toggle("on", s.id === id));
  const fit = cv => { const r = devicePixelRatio || 1; cv.width = innerWidth * r; cv.height = innerHeight * r; const g = cv.getContext("2d"); g.setTransform(r, 0, 0, r, 0, 0); return g; };

  function reveal(head, text, tech) {
    $("rhead").textContent = head; $("rtext").textContent = text; $("rtech").textContent = tech || "";
    $("reveal").classList.add("on"); buzz([40, 30, 40]);
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

  // --- WebAudio-Töne (brauchen eine Nutzergeste; in "besessen"/"hinter" nach Tap vorhanden) ---
  let AC = null;
  const audio = () => (AC = AC || new (window.AudioContext || window.webkitAudioContext)());
  function tone({ type = "sine", from = 440, to = from, dur = 0.5, gain = 0.2, delay = 0 }) {
    try {
      const o = audio(), osc = o.createOscillator(), g = o.createGain();
      const t0 = o.currentTime + delay;
      osc.type = type; osc.frequency.setValueAtTime(from, t0);
      if (to !== from) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + dur);
      g.gain.setValueAtTime(gain, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.connect(g); g.connect(o.destination); osc.start(t0); osc.stop(t0 + dur);
    } catch {}
  }
  const screech = () => { tone({ type: "sawtooth", from: 120, to: 1400, dur: 0.5, gain: 0.3 }); tone({ type: "square", from: 1500, to: 200, dur: 0.6, gain: 0.25, delay: 0.05 }); };

  // --- Gerätename: echtes Modell per userAgentData, sonst Fallback ---
  let DEVICE = "dein Gerät";
  async function detectDevice() {
    const ua = navigator.userAgent;
    try {
      if (navigator.userAgentData) {
        const h = await navigator.userAgentData.getHighEntropyValues(["model"]);
        if (h.model) { DEVICE = h.model; return; }
      }
    } catch {}
    const m = ua.match(/Android [\d.]+; ([^;)]+)/);
    DEVICE = m && m[1] !== "K" ? m[1].replace(/ Build.*/, "")
      : /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : "dein Gerät";
  }
  // Provider auf das Wesentliche kürzen (Rechtsform/Zusätze weg)
  const shortOrg = s => (s || "").replace(/,.*$/, "").replace(/\b(Gesellschaft|mit|für|fuer|beschränkter|beschraenkter|Haftung|GmbH|AG|SE|Inc\.?|LLC|Ltd\.?|Co\.?|KG|mbH|Deutschland|Telekommunikation).*$/i, "").trim() || s;

  /* ---------- 1) Wir sehen dich ---------- */
  async function sehen() {
    document.title = "…"; show("sehen");
    await detectDevice();
    const term = $("sterm");
    const cur = document.createElement("span"); cur.className = "cur"; term.append(cur);
    const line = async (text, cls = "", ms = 26) => {
      const el = document.createElement("span"); if (cls) el.className = cls; term.insertBefore(el, cur);
      for (const ch of text) { el.textContent += ch; if (!reduced) await wait(ms); }
      term.insertBefore(document.createTextNode("\n"), cur);
    };
    const geo = await Promise.race([
      fetch("/api/osint").then(r => r.ok ? r.json() : null).then(j => j && j.geo).catch(() => null),
      wait(3500).then(() => null),
    ]);
    let battery = "";
    try { const b = await navigator.getBattery(); battery = Math.round(b.level * 100) + " %" + (b.charging ? ", lädt" : ""); } catch {}
    const uhr = new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

    await wait(400); buzz(40);
    await line("> eingehende Verbindung …", "", 30); await wait(500); await line("");
    await line(`Hallo, ${DEVICE}.`, "w", 45); await wait(700);
    if (battery) { await line(`Dein Akku: ${battery}.`, "w"); await wait(450); }
    await line(`Bei dir ist es ${uhr} Uhr.`, "w"); await wait(450);
    if (geo && geo.city) { await line(`Du bist gerade in ${geo.city}${geo.region ? " (" + geo.region + ")" : ""}.`, "w"); await wait(450); }
    if (geo && geo.org) { await line(`Netz: ${shortOrg(geo.org)}.`, "w"); await wait(550); }
    await line("");
    await line("Ich sehe dich.", "r", 70); buzz([0, 200, 80, 200]);
    await wait(1700);
    reveal("Nur geguckt.",
      "Nichts davon ist ein Hack. Uhrzeit und Akku verrät dein Browser jeder Seite, Stadt und Anbieter stecken in deiner IP-Adresse. Gespeichert wurde nichts.",
      "Lektion: Metadaten allein reichen für erstaunlich viel. Das ist OSINT.");
  }

  /* ---------- 2) Hinter dir ---------- */
  async function hinter() {
    document.title = "Gesichtserkennung"; show("hinter");
    await detectDevice();
    const vid = $("hvid"), lbl = $("hlbl"), fig = $("hfig"), scan = $("hscan"), box = $("hbox"), vig = $("hvig");
    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      vid.srcObject = stream; await vid.play();
    } catch { show("sehen"); return sehen(); }

    // Scanlinie
    let sy = 0, sd = 1;
    const scanLoop = setInterval(() => { sy += sd * 3; if (sy > innerHeight || sy < 0) sd *= -1; scan.style.top = sy + "px"; }, 16);
    // Gesichts-Box in der Mitte, die leicht "atmet"
    const W = innerWidth, H = innerHeight;
    const bw = Math.min(W * 0.52, 230), bh = bw * 1.25;
    box.style.width = bw + "px"; box.style.height = bh + "px";
    box.style.left = (W - bw) / 2 + "px"; box.style.top = (H - bh) / 2 - H * 0.04 + "px";
    box.style.display = "block";

    const steps = [
      ["Gesicht erkannt.", 1300], ["Analysiere Mimik …", 1300], ["Prüfe Umgebung …", 1400],
      ["Zähle Personen im Bild …", 1600],
    ];
    for (const [s, d] of steps) { lbl.textContent = s; await wait(d); }

    // Stimmung kippt: Bild wird dunkler, Vignette enger
    vid.style.filter = "brightness(.45) contrast(1.15) saturate(.6)";
    vig.style.boxShadow = "inset 0 0 220px 110px rgba(0,0,0,.97)";
    box.style.borderColor = "#ff2d3f"; box.style.boxShadow = "0 0 18px rgba(255,45,63,.6)"; box.dataset.t = "SUBJEKT 01";

    // Gestalt steigt langsam aus dem Dunkel auf, blitzt zwischendurch
    lbl.innerHTML = "Moment …";
    fig.style.transition = "opacity 1.6s"; fig.style.opacity = "0.5"; buzz(50);
    await wait(1400);
    for (let i = 0; i < 2; i++) { fig.style.transition = "opacity .1s"; fig.style.opacity = "0.95"; buzz(40); await wait(120); fig.style.opacity = "0.5"; await wait(500); }
    lbl.innerHTML = '<b>2 Personen erkannt.</b> Du bist doch allein, oder?';
    buzz([0, 120, 60, 120]); await wait(1600);
    $("hbtn").hidden = false;
    lbl.textContent = "Tippe, um die zweite Person zu identifizieren.";

    // Tap = Nutzergeste (schaltet Audio frei)
    await new Promise(r => $("hbtn").addEventListener("click", r, { once: true }));
    audio();
    clearInterval(scanLoop); scan.style.display = "none"; $("hbtn").hidden = true; box.style.display = "none";
    fig.style.transition = "opacity .1s"; fig.style.opacity = "0";
    lbl.textContent = "";
    say("Dreh dich nicht um.", { rate: 0.78, pitch: 0.25 });
    await wait(1700);

    // Harter Jump-Scare: Vollbild-Fratze + Schrei + Dauervibration + Zoom
    const face = $("hface");
    $("hwarn").classList.add("on");
    requestAnimationFrame(() => { face.style.transition = "opacity .04s, transform 1.2s ease-out"; face.style.opacity = "1"; face.style.transform = "scale(1)"; });
    screech(); buzz([0, 600, 60, 200, 60, 200]);
    await wait(1600);
    if (stream) stream.getTracks().forEach(t => t.stop());
    reveal("Du bist allein.",
      "Keine zweite Person, kein Gesicht, nichts aufgenommen. Das Kamerabild lief nur live in deinem Browser und ist jetzt weg.",
      "Aber: Du hast einem unbekannten Chip die Kamera erlaubt. Genau das sollte man sich zweimal überlegen.");
  }

  /* ---------- 3) Besessen (Maximal-Chaos) ---------- */
  async function besessen() {
    document.title = "Geräte-Kopplung"; show("besessen");
    await detectDevice();
    // Startknopf liefert die Geste für Vollbild, Audio, Vibration und Wake-Lock
    await new Promise(r => $("bbtn").addEventListener("click", r, { once: true }));
    audio();
    $("bstart").style.display = "none";
    try { await document.documentElement.requestFullscreen({ navigationUI: "hide" }); } catch {}
    let lock = null; try { lock = await navigator.wakeLock.request("screen"); } catch {}

    // Matrix-Regen, der immer schneller und röter wird
    const cv = $("bcv"), g = fit(cv), W = innerWidth, H = innerHeight;
    cv.style.display = "block";
    const GLY = "01アカサタナハマ#$%&<>{}/\\|日月火水";
    const cols = Math.ceil(W / 13), drops = Array.from({ length: cols }, () => Math.random() * -40);
    let red = 0, speed = 1, run = true;
    const rain = () => {
      g.fillStyle = "rgba(0,0,0,.1)"; g.fillRect(0, 0, W, H);
      g.font = "14px monospace";
      drops.forEach((y, i) => {
        g.fillStyle = Math.random() < red ? `rgba(255,45,63,.85)` : `rgba(57,255,122,.6)`;
        g.fillText(GLY[Math.random() * GLY.length | 0], i * 13, y * 13);
        drops[i] = y * 13 > H && Math.random() > .97 ? 0 : y + speed;
      });
      if (run) requestAnimationFrame(rain);
    };
    rain();

    // Dauervibration + aufsteigende Sirene
    const vibLoop = setInterval(() => buzz(200), 230);
    let f = 300;
    const sirene = setInterval(() => { tone({ type: "sawtooth", from: f, to: f * 1.5, dur: 0.22, gain: 0.18 }); f = Math.min(1600, f + 60); }, 220);

    // Strobe
    const strobe = $("bstrobe");
    const strobeLoop = setInterval(() => {
      strobe.style.background = Math.random() < .5 ? "#ff2d3f" : "#fff";
      strobe.style.opacity = strobe.style.opacity === "0.5" ? "0" : "0.5";
    }, 90);
    document.body.classList.add("shake");

    // Fake-System-Popups stapeln sich
    const pops = [
      ["Kamera", "Zugriff aktiviert", "● REC"],
      ["Mikrofon", "nimmt jetzt auf", "● LIVE"],
      ["Kontakte", "werden kopiert …", "412 / 412"],
      ["Galerie", "wird hochgeladen …", "87 Fotos"],
      ["Standort", "wird geteilt", "live"],
      ["Bildschirm", "wird gespiegelt", "→ unbekannt"],
      ["Zwischenablage", "ausgelesen", "✓"],
      ["Benachrichtigungen", "werden gelesen", "✓"],
    ];
    const bpop = $("bpop");
    for (let i = 0; i < pops.length; i++) {
      const [a, b, c] = pops[i];
      const el = document.createElement("div");
      el.className = "pop";
      el.style.top = (8 + i * 10.5) + "%";
      el.innerHTML = `<b>${a}</b>${b}<div class="ok">${c}</div>`;
      el.style.opacity = "0"; el.style.transition = "opacity .2s, transform .2s"; el.style.transform = "translateX(-50%) scale(.85)";
      bpop.append(el);
      requestAnimationFrame(() => { el.style.opacity = "1"; el.style.transform = "translateX(-50%) scale(1)"; });
      buzz(120);
      await wait(620);
    }

    await wait(700);
    // Finale: alles weg, großer roter Text, Countdown
    run = false; clearInterval(strobeLoop); strobe.style.opacity = "0"; bpop.innerHTML = "";
    g.fillStyle = "#000"; g.fillRect(0, 0, W, H);
    const big = $("bbig"); big.style.display = "block";
    for (const t of ["DEIN GERÄT", "GEHÖRT", "JETZT MIR"]) { big.textContent = t; screech(); await wait(650); }
    for (const t of ["3", "2", "1"]) { big.textContent = t; tone({ type: "square", from: 900, to: 200, dur: 0.2, gain: 0.25 }); await wait(650); }

    // Aufräumen
    clearInterval(vibLoop); clearInterval(sirene); buzz(0); document.body.classList.remove("shake");
    big.style.display = "none"; cv.style.display = "none";
    try { if (lock) lock.release(); } catch {}
    try { if (document.fullscreenElement) await document.exitFullscreen(); } catch {}
    reveal("War alles Fake.",
      "Deine Kamera, deine Kontakte, deine Fotos – nichts davon wurde angefasst, nichts hochgeladen, nichts gespeichert. Es waren nur bunte Kästchen, Krach und Gerüttel in deinem Browser.",
      "Echte Schadsoftware macht genau keinen Lärm. Wenn dein Handy so eine Show abzieht, ist es harmlos. Gefährlich ist das, was du nicht merkst.");
  }

  const SCARES = { sehen, hinter, besessen };
  const forced = new URLSearchParams(location.search).get("p");
  const keys = Object.keys(SCARES);
  (SCARES[forced] || SCARES[keys[Math.random() * keys.length | 0]])();
})();
