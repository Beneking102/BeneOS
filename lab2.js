"use strict";
/* Erfolge + Datei-Explorer. Wird nach lab.js und vor os.js geladen. */
window.EXTRA_APPS = window.EXTRA_APPS || {};

/* ---------- Erfolge ---------- */
const ACH = {
  boot: ["🔌", "Willkommen im System", "In BeneOS eingeloggt"],
  admin: ["🕶", "Default Creds", "Als admin eingeloggt"],
  term: ["⌨", "Shell Access", "Das Terminal geöffnet"],
  cert: ["🏅", "Certified", "Das eWPTX-Zertifikat angesehen"],
  repo: ["📦", "Source Diver", "Ein Repo geöffnet"],
  theme: ["🎨", "Stilbewusst", "Das Farbschema geändert"],
  flag1: ["🚩", "First Blood", "Die erste CTF-Flag gefunden"],
  allflags: ["🏴", "Flag Hunter", "Alle CTF-Flags gefunden"],
  crack: ["🔓", "Cracker", "Einen Hash geknackt"],
  hunter: ["🕵", "Incident Responder", "Einen Angreifer in den Logs gefunden"],
  defender: ["🧱", "Firewall Hero", "30 Punkte im Packet Defender"],
  snake: ["🐍", "Schlangenbeschwörer", "10 Punkte bei Snake"],
  phish: ["🎣", "Phishing-Radar", "10/10 im Phishing-Quiz"],
  secret: ["🗝", "Digital-Archäologe", "Eine versteckte Datei gefunden"],
  snap: ["🪟", "Fensterakrobat", "Ein Fenster an den Rand gesnappt"],
  wallpaper: ["🖼", "Raumgestalter", "Den Hintergrund gewechselt"],
  ctx: ["🖱", "Rechtsklick-Profi", "Das Desktop-Kontextmenü geöffnet"],
  search: ["🔎", "Schnellstarter", "Eine App über die Suche gestartet"],
  paint: ["🎨", "Pixel-Künstler", "Ein Bild in PixelLab gespeichert"],
  mines: ["💣", "Minenräumer", "Minesweeper gewonnen"],
  tetris: ["🧱", "Blockbuster", "500 Punkte in Tetris"],
  typist: ["⌨", "Schnelle Finger", "30 WPM bei mindestens 90 % Genauigkeit"],
  vault: ["🔐", "Tresorknacker (Besitzer)", "Einen verschlüsselten Tresor angelegt"],
  dns: ["🌐", "DNS-Detektiv", "Eine echte DNS-Abfrage durchgeführt"],
  dig: ["📡", "Dig Deeper", "dig im Terminal benutzt"],
  jwt: ["🪙", "Token-Leser", "Ein JWT dekodiert"],
  passgen: ["🎲", "Zufallsgenerator", "Ein Passwort generiert und kopiert"],
  radio: ["📻", "Auf Sendung", "Das Synthwave-Radio eingeschaltet"],
  globe: ["🌍", "Weltbeobachter", "Den Cyber Globe geöffnet"],
  bot: ["🤖", "Gesprächig", "Mit BeneBot gesprochen"],
  ws: ["🗂", "Multitasker", "Den virtuellen Desktop gewechselt"],
  overview: ["▦", "Überblick", "Die Fenster-Übersicht geöffnet"],
  icons: ["🧩", "Ordnungsliebe", "Desktop-Icons umsortiert"],
  konami: ["🕹", "Old School", "Den Konami-Code eingegeben"],
  panic: ["💥", "Kernel Panic", "rm -rf / ausprobiert (simuliert)"],
  report: ["📝", "Berichtsprofi", "Einen Pentest-Bericht exportiert"],
  nfc: ["📶", "Physical Access", "Benes NFC-Karte angetippt"],
};
window.achieve = id => {
  if (!ACH[id]) return;
  const done = store.get("ach", []);
  if (done.includes(id)) return;
  store.set("ach", [...done, id]);
  toast(`🏆 Erfolg freigeschaltet: <b>${esc(ACH[id][1])}</b><br><small>${esc(ACH[id][2])}</small>`);
  setTimeout(() => sfx("success"), 250);
  const l = document.querySelector(".ach-list"); if (l) l.dispatchEvent(new Event("refresh"));
};
// Erfolge, die außerhalb von BeneOS verdient wurden (z. B. per NFC auf tap.html), beim Start nachholen
setTimeout(() => {
  const pending = store.get("pending-ach", []);
  if (!pending.length) return;
  store.set("pending-ach", []);
  pending.forEach(id => achieve(id));
}, 3000);
window.EXTRA_APPS.achievements = {
  title: "Erfolge", icon: "🏆", group: "System", w: 460, h: 520,
  render(body) {
    body.innerHTML = `<div class="pad"><h1>Erfolge</h1><div class="dim" id="ach-n"></div><div class="bar" style="height:10px;margin-top:8px"><div id="ach-bar"></div></div><div class="ach-list"></div></div>`;
    const list = $(".ach-list", body);
    const draw = () => {
      const done = store.get("ach", []), total = Object.keys(ACH).length;
      $("#ach-n", body).textContent = `${done.length} / ${total} freigeschaltet`;
      $("#ach-bar", body).style.width = done.length / total * 100 + "%";
      list.innerHTML = Object.entries(ACH).map(([k, [ic, t, d]]) => `<div class="ach ${done.includes(k) ? "on" : ""}"><span>${done.includes(k) ? ic : "🔒"}</span><div><b>${esc(done.includes(k) ? t : "???")}</b><div class="dim">${esc(d)}</div></div></div>`).join("");
    };
    list.addEventListener("refresh", draw); draw();
  },
};

/* ---------- Datei-Explorer ---------- */
window.EXTRA_APPS.files = {
  title: "Dateien", icon: "🗂", group: "System", w: 600, h: 480,
  render(body) {
    const app = id => ({ t: "app", app: id });
    const txt = text => ({ t: "text", text });
    const T = {
      "readme.txt": txt(`Willkommen in ${PROFILE.name}s Dateisystem.\n\n/repos   – alle öffentlichen GitHub-Repos (live geladen)\n/tools   – die Security-Lab-Programme\n/certs   – Zertifikate\n\nTipp: Nicht alles ist auf den ersten Blick sichtbar. 😉`),
      "passwords.txt": txt("hunter2\n\n(Ernsthaft: Passwörter gehören in einen Passwort-Manager, nicht in eine Textdatei.)"),
      certs: { t: "dir", c: Object.fromEntries((PROFILE.certs || []).map(c => [c.short + ".cert", app("certs")])) },
      repos: { t: "dir", c: Object.fromEntries(REPOS.map(r => [r.name, app("repo:" + r.name)])) },
      tools: { t: "dir", c: { "cipher.exe": app("cipher"), "passlab.exe": app("passlab"), "hashbreak.exe": app("hashbreak"), "loghunter.exe": app("loghunter"), "defender.exe": app("defender"), "ctf.exe": app("ctf") } },
      ".secret": { t: "dir", hidden: true, c: { "flag.txt": txt("BENE{h1dd3n_f1l3s_r34l}\n\nGut gesucht! Trag die Flag im Mini CTF ein."), "todo.md": txt("- Pentest-Report fertig schreiben\n- Mehr Kaffee\n- Eine Zero-Day finden (träumen darf man)") } },
    };
    let path = [], showHidden = false, sel = null;
    const cur = () => path.reduce((n, p) => n[p].c, T);
    const draw = () => {
      const dir = cur();
      const ents = Object.entries(dir).filter(([k, v]) => showHidden || !(v.hidden || k.startsWith(".")));
      ents.sort(([a, x], [b, y]) => (y.t === "dir") - (x.t === "dir") || a.localeCompare(b));
      body.innerHTML = `<div class="pad" style="padding-bottom:6px"><div class="opbar"><button class="btn" id="up" ${path.length ? "" : "disabled"}>↑ Hoch</button>
        <code class="blk" style="flex:1;padding:4px 8px">~/${esc(path.join("/"))}</code><label class="chk" style="margin:0"><input type="checkbox" id="hid" ${showHidden ? "checked" : ""}> Versteckte Dateien</label></div>
        <div class="files">${ents.map(([k, v]) => `<button class="file" data-k="${esc(k)}"><span>${v.t === "dir" ? "📁" : v.t === "app" ? "⚙" : "📄"}</span>${esc(k)}</button>`).join("") || "<span class='dim'>(leer)</span>"}</div>
        ${sel ? `<h2>${esc(sel[0])}</h2><pre class="readme"></pre>` : ""}</div>`;
      if (sel) $(".readme", body).textContent = sel[1];
      $("#up", body).onclick = () => { path.pop(); sel = null; draw(); };
      $("#hid", body).onchange = e => { showHidden = e.target.checked; draw(); };
      body.querySelectorAll(".file").forEach(b => b.onclick = () => {
        const k = b.dataset.k, v = dir[k];
        if (v.t === "dir") { path.push(k); sel = null; if (v.hidden) achieve("secret"); draw(); }
        else if (v.t === "app") openApp(v.app);
        else { sel = [k, v.text]; if (path[0] === ".secret") achieve("secret"); draw(); }
      });
    };
    draw();
  },
};
