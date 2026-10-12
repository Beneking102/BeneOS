"use strict";
/* Zusätzliche Apps (Security Lab, Zertifikate). Wird VOR os.js geladen und dort in APPS gemerged.
   Helfer wie $, el, esc, store, settings, PROFILE kommen aus os.js und werden erst beim Rendern benutzt. */
window.EXTRA_APPS = window.EXTRA_APPS || {};
const rnd = n => Math.floor(Math.random() * n);
const pick1 = a => a[rnd(a.length)];

/* ---------- Zertifikate ---------- */
window.EXTRA_APPS.certs = {
  title: "Zertifikate", icon: "🏅", group: "System", w: 580, h: 540,
  render(body) {
    const rows = (PROFILE.certs || []).map(c => {
      const meta = [["Aussteller", c.issuer], ["Ausgestellt", c.date], ["Credential-ID", c.id]].filter(m => m[1]);
      return `<article class="cert"><div class="seal">${esc(c.short)}</div>
        <div class="cert-main"><h2 style="margin:0">${esc(c.short)}</h2><div class="cert-full">${esc(c.name)}</div>
        <div class="cert-meta">${meta.map(([k, v]) => `<div><span class="dim">${k}</span> ${esc(v)}</div>`).join("")}</div>
        <p class="dim">${esc(c.note || "")}</p>
        <div>${(c.topics || []).map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div>
        ${safeUrl(c.verify) ? `<div class="links" style="margin-top:10px"><a href="${esc(safeUrl(c.verify))}" target="_blank" rel="noopener">✔ Zertifikat verifizieren</a></div>` : ""}</div></article>`;
    }).join("");
    body.innerHTML = `<div class="pad"><h1>Zertifikate</h1><div class="dim">Nachweise, die ich mir erarbeitet habe.</div><div style="margin-top:12px">${rows}</div>
      <h2>Wo ich das anwende</h2>
      <div class="links"><button class="linkbtn" data-open="projects">📁 Repo Explorer – meine Security-Tools</button>
      <button class="linkbtn" data-open="ctf">🚩 Mini CTF – selber hacken</button>
      <button class="linkbtn" data-open="loghunter">🕵 Log Hunter – Angreifer finden</button></div></div>`;
  },
};

/* ---------- Hash Breaker ---------- */
window.EXTRA_APPS.hashbreak = {
  title: "Hash Breaker", icon: "🔓", group: "Security Lab", w: 560, h: 540,
  render(body) {
    const WORDS = ["password", "123456", "qwerty", "letmein", "dragon", "monkey", "sunshine", "princess", "football", "welcome", "admin", "login", "master", "hello", "summer", "sommer", "winter", "passwort", "hallo", "iloveyou", "shadow", "superman", "batman", "trustno1", "freedom", "whatever", "starwars", "cheese", "computer", "internet"];
    const LEET = { a: "@", e: "3", i: "1", o: "0", s: "$" };
    const cap = w => w[0].toUpperCase() + w.slice(1);
    const gens = {
      wordlist: function* () { yield* WORDS; },
      mutate: function* () {
        for (const w of WORDS) for (const base of [w, cap(w)]) {
          const pos = [...base].map((c, i) => (LEET[c.toLowerCase()] ? i : -1)).filter(i => i >= 0).slice(0, 8);
          for (let m = 0; m < 1 << pos.length; m++) {
            const chars = [...base]; pos.forEach((p, k) => { if (m >> k & 1) chars[p] = LEET[chars[p].toLowerCase()]; });
            yield chars.join("");
          }
        }
      },
      append: function* () {
        const sfx = ["1", "12", "123", "1234", "!", "007", ...Array.from({ length: 46 }, (_, i) => String(1990 + i))];
        for (const w of WORDS) for (const base of [w, cap(w)]) for (const s of sfx) yield base + s;
      },
      brute: function* () { for (let n = 0; n < 100000; n++) yield String(n); },
    };
    const ATK = [["wordlist", "Wortliste"], ["mutate", "Wortliste + Mutationen (Leetspeak, Großschreibung)"], ["append", "Wortliste + Anhang (Jahre/Zahlen)"], ["brute", "Brute-Force (Ziffern, bis 5 Stellen)"]];
    const LV = [
      { name: "Level 1 · Der faule Admin", hint: "Er nimmt, was alle nehmen.", pw: "letmein" },
      { name: "Level 2 · Der „clevere“ Admin", hint: "Ein Großbuchstabe und ein paar Zeichen ausgetauscht – das war's.", pw: "P@ssw0rd" },
      { name: "Level 3 · Das Saison-Passwort", hint: "Jahreszeit plus Jahreszahl. Jeder dritte Nutzer macht das.", pw: "sommer2024" },
      { name: "Level 4 · Die PIN", hint: "Nur Ziffern, höchstens fünf Stück.", pw: "73519" },
    ];
    const sha = async s => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))), b => b.toString(16).padStart(2, "0")).join("");
    let lv = 0, busy = false, alive = true;
    const hashes = [];
    const draw = async (msg = "", ok) => {
      if (lv >= LV.length) {
        body.innerHTML = `<div class="pad"><h1>Alle Hashes geknackt 🔓</h1><p>Genau deshalb: <b>lange, zufällige Passwörter</b> und serverseitig <b>bcrypt/scrypt/Argon2 mit Salt</b>. Ungesalzene SHA-256-Hashes fallen in Sekunden.</p><button class="btn" id="again">Nochmal</button></div>`;
        $("#again", body).onclick = () => { lv = 0; draw(); }; return;
      }
      hashes[lv] ||= await sha(LV[lv].pw);
      if (!alive) return;
      body.innerHTML = `<div class="pad"><h1>Hash Breaker</h1><div class="dim">Du hast einen geleakten SHA-256-Hash. Wähle den passenden Angriff.</div>
        <h2>${LV[lv].name}</h2><code class="blk">${hashes[lv]}</code><p class="dim">💡 ${LV[lv].hint}</p>
        <div class="links">${ATK.map(([k, t]) => `<button class="linkbtn" data-atk="${k}">⚔ ${t}</button>`).join("")}</div>
        <div class="bar" style="height:12px;margin-top:14px"><div id="prog" style="width:0"></div></div>
        <div id="res" style="min-height:60px">${msg}</div></div>`;
      body.querySelectorAll("[data-atk]").forEach(b => b.onclick = () => run(b.dataset.atk));
      if (ok) { const n = el("button", "btn", "Nächstes Level ▶"); n.onclick = () => { lv++; draw(); }; $("#res", body).append(el("br"), n); }
    };
    const run = async kind => {
      if (busy) return; busy = true;
      body.querySelectorAll("[data-atk]").forEach(b => { b.disabled = true; });
      const target = hashes[lv], it = gens[kind](); let tried = 0, found = null;
      const t0 = performance.now();
      for (;;) {
        const batch = []; for (let k = 0; k < 500; k++) { const n = it.next(); if (n.done) break; batch.push(n.value); }
        if (!batch.length || !alive) break;
        const hs = await Promise.all(batch.map(sha)); tried += batch.length;
        const idx = hs.indexOf(target); if (idx >= 0) { found = batch[idx]; break; }
        const p = $("#prog", body); if (p) p.style.width = Math.min(100, tried / (kind === "brute" ? 111110 : 4000) * 100) + "%";
      }
      busy = false; if (!alive) return;
      const secs = ((performance.now() - t0) / 1000).toFixed(1);
      sfx(found != null ? "success" : "error"); if (found != null) achieve("crack");
      if (found != null) draw(`<b style="color:#39ff88">Geknackt!</b> Passwort: <code>${esc(found)}</code> nach ${tried.toLocaleString("de-DE")} Versuchen (${secs}s).`, true);
      else draw(`<b style="color:#ff5470">Nicht gefunden</b> nach ${tried.toLocaleString("de-DE")} Versuchen. Falscher Angriffstyp?`);
    };
    draw();
    return () => { alive = false; };
  },
};

/* ---------- Log Hunter ---------- */
window.EXTRA_APPS.loghunter = {
  title: "Log Hunter", icon: "🕵", group: "Security Lab", w: 640, h: 560,
  render(body) {
    const ip = () => pick1(["203.0.113", "198.51.100", "192.0.2"]) + "." + (1 + rnd(253));
    const uniqueIps = n => { const s = new Set(); while (s.size < n) s.add(ip()); return [...s]; };
    const round = () => {
      const [att, scan, ...legit] = uniqueIps(6);
      const users = ["anna", "tom", "max", "lisa", "dev"];
      const victim = pick1(["admin", "deploy", "backup"]);
      const ev = []; let t = 3 * 3600 + rnd(3600), pid = 1000 + rnd(500);
      const add = (time, msg) => ev.push([time, msg]);
      const port = () => 30000 + rnd(30000);
      legit.forEach(l => { for (let k = 0; k < 4 + rnd(4); k++) { const u = pick1(users), tm = rnd(7200) + t - 1800; add(tm, `Accepted publickey for ${u} from ${l} port ${port()} ssh2`); if (Math.random() < .35) add(tm - 20, `Failed password for ${u} from ${l} port ${port()} ssh2`); } });
      for (let k = 0; k < 14; k++) add(t + k * 7, `Invalid user ${pick1(["test", "oracle", "ubuntu", "git", "postgres"])} from ${scan} port ${port()}`);
      const n = 22 + rnd(12);
      for (let k = 0; k < n; k++) add(t + 400 + k * 3, `Failed password for ${pick1(["root", "admin", "deploy", "backup"])} from ${att} port ${port()} ssh2`);
      const tw = t + 400 + n * 3 + 2;
      add(tw, `Accepted password for ${victim} from ${att} port ${port()} ssh2`);
      add(tw + 1, `pam_unix(sshd:session): session opened for user ${victim}`);
      add(tw + 30, `sudo: ${victim} : TTY=pts/0 ; COMMAND=/bin/bash`);
      ev.sort((a, b) => a[0] - b[0]);
      const fmt = s => [Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60].map(x => String(x).padStart(2, "0")).join(":");
      return { att, victim, lines: ev.map(([tm, m]) => `Oct 12 ${fmt(tm)} srv sshd[${pid + (tm % 97)}]: ${m}`) };
    };
    let R = round();
    body.innerHTML = `<div class="pad"><h1>Log Hunter</h1><div class="dim">Der SSH-Server wurde kompromittiert. Finde die IP des Angreifers, der per Brute-Force reingekommen ist, und den übernommenen Account.</div>
      <input class="field" id="flt" placeholder='Filter (wie grep) – z. B. "Accepted" oder "Failed"' spellcheck="false" style="margin-bottom:6px">
      <div class="dim" id="cnt"></div><pre class="readme" id="log" style="max-height:230px;font-size:11px"></pre>
      <form id="ans" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"><input class="field" id="aip" placeholder="IP des Angreifers" style="flex:1;margin:0;min-width:140px"><input class="field" id="aus" placeholder="gehackter User" style="flex:1;margin:0;min-width:120px"><button class="btn">Prüfen</button></form>
      <div id="msg" style="margin-top:8px;min-height:40px"></div></div>`;
    const log = $("#log", body), flt = $("#flt", body), cnt = $("#cnt", body), msg = $("#msg", body);
    const show = () => {
      const q = flt.value.toLowerCase(), l = R.lines.filter(x => x.toLowerCase().includes(q));
      log.innerHTML = l.map(x => `<span class="${/Failed|Invalid/.test(x) ? "ll-bad" : /Accepted/.test(x) ? "ll-ok" : /sudo|session opened/.test(x) ? "ll-warn" : ""}">${esc(x)}</span>`).join("\n"); cnt.textContent = `${l.length} von ${R.lines.length} Zeilen`;
    };
    flt.oninput = show; show();
    $("#ans", body).onsubmit = e => {
      e.preventDefault();
      const ipv = $("#aip", body).value.trim(), us = $("#aus", body).value.trim().toLowerCase();
      if (ipv === R.att && us === R.victim) {
        sfx("success"); achieve("hunter");
        msg.innerHTML = `<b style="color:#39ff88">Case closed!</b> ${R.att} hat erst viele Passwörter geraten (Brute-Force), dann ging <code>${R.victim}</code> auf. Danach <code>sudo</code> → Privilege Escalation. Gegenmittel: Key-Auth, Fail2ban, 2FA.`;
        const n = el("button", "btn", "Neuer Fall ▶"); n.style.marginLeft = "8px";
        n.onclick = () => { R = round(); flt.value = ""; show(); msg.textContent = ""; e.target.reset(); };
        msg.append(n);
      } else sfx("error"), msg.innerHTML = `<b style="color:#ff5470">Nicht ganz.</b> <span class="dim">Tipp: Suche nach „Accepted password“ und schau, welche IP davor ständig „Failed“ hatte. Die Scanner-IP ohne Erfolg und Nutzer mit Tippfehlern sind Ablenkung.</span>`;
    };
  },
};
