"use strict";
/* Security-Tools: Toolbox (JWT, Hash-ID, Passwort-Generator, Subnetz, Zeit), DNS-Lab (DNS-over-HTTPS),
   Tresor (AES-GCM-verschlüsselte Notiz). Alles läuft lokal im Browser – nur das DNS-Lab fragt Cloudflare DoH. */
window.EXTRA_APPS = window.EXTRA_APPS || {};
(() => {
  const A = window.EXTRA_APPS;
  const enc = new TextEncoder(), dec = new TextDecoder();
  const b64 = u8 => { let s = ""; for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode(...u8.subarray(i, i + 8192)); return btoa(s); };
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const b64u = s => { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; return dec.decode(unb64(s)); };
  const b64uEnc = s => b64(enc.encode(s)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  /* ---------- Security Toolbox ---------- */
  const randInt = n => { const a = new Uint32Array(1), lim = Math.floor(2 ** 32 / n) * n; let x; do { crypto.getRandomValues(a); x = a[0]; } while (x >= lim); return x % n; };
  const ago = s => { const a = Math.abs(s); const u = [[60, "Sekunden"], [60, "Minuten"], [24, "Stunden"], [365, "Tage"], [Infinity, "Jahre"]]; let v = a, i = 0; for (; i < u.length - 1 && v >= u[i][0]; i++) v /= u[i][0]; return `${Math.round(v)} ${u[i][1]}`; };
  const ip2int = s => { const p = s.split("."); if (p.length !== 4 || p.some(x => !/^\d{1,3}$/.test(x) || +x > 255)) throw new Error("Ungültige IPv4-Adresse"); return ((+p[0] << 24) | (+p[1] << 16) | (+p[2] << 8) | +p[3]) >>> 0; };
  const int2ip = n => [n >>> 24, (n >> 16) & 255, (n >> 8) & 255, n & 255].join(".");

  const HASHES = [
    [/^\$2[abxy]?\$\d{2}\$[./A-Za-z0-9]{53}$/, "bcrypt – gut für Passwörter (langsam, gesalzen)"],
    [/^\$argon2(id|i|d)\$/, "Argon2 – aktueller Standard für Passwort-Hashing"],
    [/^\$6\$/, "SHA-512 crypt (Linux /etc/shadow)"], [/^\$5\$/, "SHA-256 crypt (Linux /etc/shadow)"], [/^\$1\$/, "MD5 crypt (veraltet!)"],
    [/^\$apr1\$/, "Apache MD5 (apr1)"], [/^\$(P|H)\$/, "phpass (WordPress/phpBB)"], [/^\{SSHA\}/, "Salted SHA-1 (LDAP)"],
    [/^[a-f0-9]{32}$/i, "MD5 · NTLM · MD4 – schnell zu knacken, nie für Passwörter nutzen"], [/^[a-f0-9]{40}$/i, "SHA-1 (gebrochen für Signaturen) · MySQL5"],
    [/^[a-f0-9]{56}$/i, "SHA-224 · SHA3-224"], [/^[a-f0-9]{64}$/i, "SHA-256 · SHA3-256 · Keccak-256"], [/^[a-f0-9]{96}$/i, "SHA-384 · SHA3-384"],
    [/^[a-f0-9]{128}$/i, "SHA-512 · SHA3-512 · Whirlpool"], [/^[a-f0-9]{16}$/i, "MySQL323 · Half MD5"],
  ];

  A.toolbox = {
    title: "Security Toolbox", icon: "🧰", group: "Security Lab", w: 620, h: 600,
    render(body) {
      const tabs = { jwt: "JWT", hash: "Hash-ID", pass: "Passwort", net: "Subnetz", time: "Zeit" };
      let cur = "jwt", timer = 0;
      const views = {
        jwt: `<div class="dim">JWT einfügen – wird nur lokal dekodiert. Die Signatur wird <b>nicht</b> geprüft.</div>
          <textarea class="field" id="jt" rows="4" spellcheck="false" placeholder="eyJhbGciOi…"></textarea>
          <div class="opbar"><button class="btn" id="jsample">Beispiel-Token</button></div><div id="jout"></div>`,
        hash: `<div class="dim">Hash einfügen – die Erkennung basiert auf Länge und Format (Hinweis, kein Beweis).</div>
          <input class="field" id="hi" spellcheck="false" placeholder="5f4dcc3b5aa765d61d8327deb882cf99"><div id="hout"></div>`,
        pass: `<div class="dim">Zufällige Passwörter mit <code>crypto.getRandomValues</code> – nichts verlässt deinen Browser.</div>
          <label class="chk">Länge <input type="range" id="pl" min="8" max="64" value="20" style="flex:1"><b id="plv">20</b></label>
          <div class="opbar"><label class="chk"><input type="checkbox" id="pu" checked> A–Z</label><label class="chk"><input type="checkbox" id="pw" checked> a–z</label>
          <label class="chk"><input type="checkbox" id="pd" checked> 0–9</label><label class="chk"><input type="checkbox" id="ps" checked> !@#…</label><label class="chk"><input type="checkbox" id="pa"> ohne l/1/I/O/0</label></div>
          <code class="blk" id="pout" style="font-size:16px;margin:10px 0;user-select:all"></code><div class="dim" id="pent"></div>
          <div class="opbar" style="margin-top:8px"><button class="btn" id="pnew">🔄 Neu</button><button class="btn" id="pcopy">📋 Kopieren</button></div>`,
        net: `<div class="dim">IPv4-Subnetzrechner, z. B. <code>192.168.1.37/24</code> oder <code>10.0.0.5 255.255.252.0</code></div>
          <input class="field" id="ni" value="192.168.1.37/24" spellcheck="false"><div id="nout"></div>`,
        time: `<div class="dim">Unix-Zeit ⇄ Datum. Jetzt: <b id="tnow"></b></div>
          <input class="field" id="ti" placeholder="1700000000 (Sekunden) oder 1700000000000 (ms) oder 2026-10-12T21:00:00Z" spellcheck="false"><div id="tout"></div>`,
      };
      const kv = rows => `<div class="kv" style="margin-top:10px">${rows.map(([k, v]) => `<span>${esc(k)}</span><b>${esc(String(v))}</b>`).join("")}</div>`;

      const wire = {
        jwt() {
          const out = $("#jout", body), ta = $("#jt", body);
          const run = () => {
            const v = ta.value.trim(); if (!v) { out.innerHTML = ""; return; }
            try {
              const p = v.split(".");
              if (p.length < 2) throw new Error("Ein JWT besteht aus mindestens 2 Teilen, getrennt durch Punkte");
              const h = JSON.parse(b64u(p[0])), pl = JSON.parse(b64u(p[1])), warns = [], rows = [];
              if (String(h.alg).toLowerCase() === "none") warns.push("alg=none: Token ohne Signatur – darf nie akzeptiert werden!");
              if (/^HS/i.test(h.alg)) warns.push("HMAC-Algorithmus: Secret muss lang und zufällig sein, sonst per Wörterbuch knackbar.");
              if (!p[2]) warns.push("Keine Signatur vorhanden.");
              const now = Date.now() / 1000;
              [["iat", "Ausgestellt"], ["nbf", "Gültig ab"], ["exp", "Läuft ab"]].forEach(([k, l]) => { if (typeof pl[k] === "number") rows.push([l, `${new Date(pl[k] * 1000).toLocaleString("de-DE")} (${pl[k] < now ? "vor " : "in "}${ago(pl[k] - now)})`]); });
              if (typeof pl.exp === "number") warns.push(pl.exp < now ? "Token ist ABGELAUFEN." : "Token ist noch gültig.");
              out.innerHTML = `<h2>Header</h2><pre class="readme" id="jh"></pre><h2>Payload</h2><pre class="readme" id="jp"></pre>${rows.length ? kv(rows) : ""}<ul>${warns.map(w => `<li>${esc(w)}</li>`).join("")}</ul>`;
              $("#jh", out).textContent = JSON.stringify(h, null, 2); $("#jp", out).textContent = JSON.stringify(pl, null, 2);
              achieve("jwt");
            } catch (e) { out.innerHTML = `<div style="color:#ff5470;margin-top:8px">Kein gültiges JWT: ${esc(e.message)}</div>`; }
          };
          ta.oninput = run;
          $("#jsample", body).onclick = () => {
            const n = Math.floor(Date.now() / 1000);
            ta.value = [b64uEnc(JSON.stringify({ alg: "HS256", typ: "JWT" })), b64uEnc(JSON.stringify({ sub: "1234567890", name: "Bene", admin: false, iat: n, exp: n + 3600 })), "c2lnbmF0dXJlLW5pY2h0LWVjaHQ"].join(".");
            run();
          };
        },
        hash() {
          const i = $("#hi", body), out = $("#hout", body);
          i.oninput = () => {
            const v = i.value.trim(); if (!v) { out.innerHTML = ""; return; }
            const m = HASHES.filter(([re]) => re.test(v)).map(x => x[1]);
            out.innerHTML = `<div class="kv" style="margin-top:10px"><span>Länge</span><b>${v.length} Zeichen</b></div>` + (m.length ? `<ul>${m.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : `<div class="dim" style="margin-top:8px">Kein bekanntes Format erkannt.</div>`);
          };
        },
        pass() {
          const $$ = id => $(id, body);
          const gen = () => {
            const len = +$$("#pl").value; $$("#plv").textContent = len;
            const amb = $$("#pa").checked, strip = s => (amb ? s.replace(/[lI1O0|]/g, "") : s);
            const sets = [];
            if ($$("#pu").checked) sets.push(strip("ABCDEFGHIJKLMNOPQRSTUVWXYZ"));
            if ($$("#pw").checked) sets.push(strip("abcdefghijklmnopqrstuvwxyz"));
            if ($$("#pd").checked) sets.push(strip("0123456789"));
            if ($$("#ps").checked) sets.push("!@#$%^&*()-_=+[]{};:,.?/");
            if (!sets.length) { $$("#pout").textContent = "–"; $$("#pent").textContent = "Wähle mindestens eine Zeichengruppe."; return; }
            const all = sets.join("");
            const chars = sets.map(s => s[randInt(s.length)]);
            while (chars.length < len) chars.push(all[randInt(all.length)]);
            for (let i = chars.length - 1; i > 0; i--) { const j = randInt(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; }
            $$("#pout").textContent = chars.join("");
            $$("#pent").textContent = `≈ ${Math.round(len * Math.log2(all.length))} Bit Entropie · ${len} Zeichen aus ${all.length} möglichen`;
          };
          body.querySelectorAll("#pl,#pu,#pw,#pd,#ps,#pa").forEach(x => { x.oninput = gen; });
          $$("#pnew").onclick = () => { gen(); sfx("click"); };
          $$("#pcopy").onclick = () => { navigator.clipboard?.writeText($$("#pout").textContent).then(() => { sfx("success"); toast("📋 Passwort kopiert (nur im Zwischenspeicher)."); achieve("passgen"); }).catch(() => toast("Kopieren wurde vom Browser blockiert.")); };
          gen();
        },
        net() {
          const i = $("#ni", body), out = $("#nout", body);
          const calc = () => {
            try {
              const v = i.value.trim().replace(/\s+/g, " ");
              let ip, bits;
              if (v.includes("/")) { const [a, n] = v.split("/"); ip = ip2int(a); bits = +n; if (!/^\d+$/.test(n) || bits < 0 || bits > 32) throw new Error("Präfix muss 0–32 sein"); }
              else if (v.includes(" ")) { const [a, m] = v.split(" "); ip = ip2int(a); const mm = ip2int(m), inv = (~mm) >>> 0; if ((inv & (inv + 1)) !== 0 && inv !== 0) throw new Error("Ungültige Subnetzmaske"); bits = 32 - Math.round(Math.log2(inv + 1)); }
              else throw new Error("Format: a.b.c.d/n");
              const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0, net = (ip & mask) >>> 0, bc = (net | ~mask) >>> 0;
              const first = bits >= 31 ? net : net + 1, last = bits >= 31 ? bc : bc - 1;
              const hosts = bits === 32 ? 1 : bits === 31 ? 2 : 2 ** (32 - bits) - 2;
              const priv = [["10.0.0.0", 8, "privat (RFC 1918)"], ["172.16.0.0", 12, "privat (RFC 1918)"], ["192.168.0.0", 16, "privat (RFC 1918)"], ["127.0.0.0", 8, "Loopback"], ["169.254.0.0", 16, "Link-Local (APIPA)"], ["100.64.0.0", 10, "CGNAT"]]
                .find(([a, n]) => ((ip & (~0 << (32 - n))) >>> 0) === ip2int(a));
              out.innerHTML = kv([["Netzadresse", int2ip(net)], ["Broadcast", int2ip(bc)], ["Subnetzmaske", int2ip(mask)], ["Wildcard", int2ip((~mask) >>> 0)], ["Erster Host", int2ip(first)], ["Letzter Host", int2ip(last)], ["Nutzbare Hosts", hosts.toLocaleString("de-DE")], ["Typ", priv ? priv[2] : "öffentlich"], ["Maske (binär)", mask.toString(2).padStart(32, "0").replace(/(.{8})(?=.)/g, "$1.")]]);
            } catch (e) { out.innerHTML = `<div style="color:#ff5470;margin-top:8px">${esc(e.message)}</div>`; }
          };
          i.oninput = calc; calc();
        },
        time() {
          const i = $("#ti", body), out = $("#tout", body), now = $("#tnow", body);
          const tick = () => { now.textContent = `${Math.floor(Date.now() / 1000)} (${new Date().toISOString()})`; };
          tick(); timer = setInterval(tick, 1000);
          i.oninput = () => {
            const v = i.value.trim(); if (!v) { out.innerHTML = ""; return; }
            let d;
            if (/^-?\d+(\.\d+)?$/.test(v)) { const n = +v; d = new Date(Math.abs(n) > 1e11 ? n : n * 1000); } else d = new Date(v);
            if (isNaN(d)) { out.innerHTML = `<div style="color:#ff5470;margin-top:8px">Unbekanntes Format</div>`; return; }
            out.innerHTML = kv([["Unix (s)", Math.floor(d / 1000)], ["Unix (ms)", +d], ["UTC (ISO)", d.toISOString()], ["Lokal", d.toLocaleString("de-DE")], ["Relativ", `${d < Date.now() ? "vor " : "in "}${ago((d - Date.now()) / 1000)}`]]);
          };
        },
      };
      const draw = () => {
        clearInterval(timer);
        body.innerHTML = `<div class="pad"><div class="tabs">${Object.entries(tabs).map(([k, t]) => `<button class="tab ${k === cur ? "on" : ""}" data-tab="${k}">${t}</button>`).join("")}</div>${views[cur]}</div>`;
        body.querySelectorAll("[data-tab]").forEach(b => { b.onclick = () => { cur = b.dataset.tab; sfx("menu"); draw(); }; });
        wire[cur]();
      };
      draw();
      return () => clearInterval(timer);
    },
  };

  /* ---------- DNS Lab ---------- */
  const TYPES = { A: 1, AAAA: 28, MX: 15, TXT: 16, NS: 2, CNAME: 5, SOA: 6, CAA: 257 };
  const NAMES = Object.fromEntries(Object.entries(TYPES).map(([k, v]) => [v, k]));
  const HOST_RE = /^(?=.{1,253}$)([a-z0-9_]([a-z0-9_-]{0,61}[a-z0-9_])?\.)+[a-z]{2,63}$/i;
  const cleanHost = s => { s = s.trim(); try { if (/^[a-z]+:\/\//i.test(s)) s = new URL(s).hostname; } catch { /* egal */ } return s.replace(/\.$/, "").toLowerCase(); };
  async function doh(name, type) {
    const r = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`, { headers: { accept: "application/dns-json" } });
    if (!r.ok) throw new Error("DNS-Dienst nicht erreichbar (HTTP " + r.status + ")");
    return r.json();
  }
  const txt = a => a.data.replace(/^"|"$/g, "").replace(/" "/g, "");
  window.DNSLIB = { doh, HOST_RE, cleanHost, TYPES, NAMES };

  A.dnslab = {
    title: "DNS Lab", icon: "🌐", group: "Security Lab", w: 620, h: 600,
    render(body) {
      body.innerHTML = `<div class="pad"><h1>DNS Lab</h1><div class="dim">Echte DNS-Abfragen über <b>Cloudflare DNS-over-HTTPS</b> – dabei geht der Domainname an Cloudflare (<a href="https://developers.cloudflare.com/1.1.1.1/privacy/public-dns-resolver/" target="_blank" rel="noopener noreferrer">Datenschutz</a>).</div>
        <form id="df" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px"><input class="field" id="dd" value="benedikt-pkr.info" spellcheck="false" style="flex:1;min-width:180px;margin:0" aria-label="Domain">
        <select class="field" id="dt" style="width:auto;margin:0" aria-label="Record-Typ">${Object.keys(TYPES).map(t => `<option>${t}</option>`).join("")}</select>
        <button class="btn" type="submit">Abfragen</button><button class="btn" type="button" id="dmail">✉ Mail-Security-Check</button></form>
        <div id="dout" style="margin-top:12px"></div></div>`;
      const out = $("#dout", body); let busy = false;
      const getHost = () => { const h = cleanHost($("#dd", body).value); if (!HOST_RE.test(h)) { out.innerHTML = `<div style="color:#ff5470">Bitte einen gültigen Domainnamen eingeben (z. B. example.com).</div>`; return null; } return h; };
      const guard = async fn => { if (busy) return; busy = true; out.innerHTML = `<div class="dim">Frage Cloudflare …</div>`; try { await fn(); } catch (e) { out.innerHTML = `<div style="color:#ff5470">Fehler: ${esc(e.message || "Netzwerk")}</div>`; } busy = false; };
      $("#df", body).onsubmit = e => {
        e.preventDefault(); const h = getHost(); if (!h) return;
        const t = $("#dt", body).value;
        guard(async () => {
          const j = await doh(h, t); achieve("dns");
          const ans = j.Answer || [];
          out.innerHTML = `<div class="dim">Status: <b>${["OK", "Formatfehler", "Serverfehler", "NXDOMAIN (existiert nicht)", "Nicht implementiert", "Abgelehnt"][j.Status] ?? j.Status}</b>${j.AD ? " · DNSSEC validiert ✔" : ""} · ${ans.length} Antwort(en)</div>` +
            (ans.length ? `<table class="tbl"><tr><th>Typ</th><th>TTL</th><th>Daten</th></tr>${ans.map(a => `<tr><td>${esc(NAMES[a.type] || String(a.type))}</td><td>${a.TTL}s</td><td></td></tr>`).join("")}</table>` : "");
          [...out.querySelectorAll("tr")].slice(1).forEach((tr, i) => { tr.children[2].textContent = ans[i].data; });
        });
      };
      $("#dmail", body).onclick = () => {
        const h = getHost(); if (!h) return;
        guard(async () => {
          const sel = ["default", "google", "selector1", "selector2", "k1", "s1"];
          const [mx, root, dm, ...dk] = await Promise.all([doh(h, "MX"), doh(h, "TXT"), doh("_dmarc." + h, "TXT"), ...sel.map(s => doh(`${s}._domainkey.${h}`, "TXT"))]);
          const spf = (root.Answer || []).filter(a => a.type === 16 && /^v=spf1/i.test(txt(a)));
          const dmarc = (dm.Answer || []).filter(a => a.type === 16 && /^v=DMARC1/i.test(txt(a)));
          const keys = sel.filter((s, i) => (dk[i].Answer || []).length);
          const items = []; let score = 0;
          const hasMx = (mx.Answer || []).some(a => a.type === 15);
          items.push([hasMx ? "ok" : "warn", "MX-Records", hasMx ? "Mailserver vorhanden." : "Keine MX-Records – die Domain empfängt keine Mails (ok, wenn gewollt)."]); if (hasMx) score += 10;
          if (!spf.length) items.push(["bad", "SPF", "Kein SPF-Record: Jeder kann Mails in deinem Namen absenden."]);
          else if (spf.length > 1) items.push(["bad", "SPF", "Mehrere SPF-Records – das ist ungültig (PermError)."]);
          else { const s = txt(spf[0]); const q = (s.match(/([~?+-])all\s*$/) || [])[1];
            if (q === "-") { items.push(["ok", "SPF", "Strikt (-all): nicht gelistete Server werden abgelehnt."]); score += 30; }
            else if (q === "~") { items.push(["warn", "SPF", "Softfail (~all): besser -all verwenden."]); score += 18; }
            else items.push(["bad", "SPF", "Zu offen (?all / +all / fehlt) – schützt kaum."]); }
          if (!dmarc.length) items.push(["bad", "DMARC", "Kein DMARC-Record unter _dmarc. – Spoofing wird nicht gemeldet oder blockiert."]);
          else { const p = (txt(dmarc[0]).match(/\bp=(\w+)/i) || [])[1]?.toLowerCase();
            if (p === "reject") { items.push(["ok", "DMARC", "Policy reject – gefälschte Mails werden abgewiesen."]); score += 40; }
            else if (p === "quarantine") { items.push(["ok", "DMARC", "Policy quarantine – verdächtige Mails landen im Spam."]); score += 30; }
            else { items.push(["warn", "DMARC", "Policy none – nur Monitoring, kein Schutz."]); score += 10; } }
          if (keys.length) { items.push(["ok", "DKIM", `Selector gefunden: ${keys.join(", ")}`]); score += 20; }
          else items.push(["warn", "DKIM", "Keiner der üblichen Selektoren gefunden (kann trotzdem mit eigenem Selector konfiguriert sein)."]);
          const grade = score >= 90 ? "A" : score >= 70 ? "B" : score >= 50 ? "C" : score >= 30 ? "D" : "F";
          out.innerHTML = `<h2>Mail-Security: ${esc(h)}</h2><div style="display:flex;align-items:center;gap:14px"><div class="grade">${grade}</div><div style="flex:1"><div class="bar" style="height:10px"><div style="width:${score}%"></div></div><div class="dim">${score}/100 Punkte (vereinfachte Bewertung)</div></div></div>
            <div class="checks">${items.map(([k, t, d]) => `<div class="chk-${k}"><b>${k === "ok" ? "✔" : k === "warn" ? "⚠" : "✖"} ${t}</b><span></span></div>`).join("")}</div>`;
          out.querySelectorAll(".checks > div").forEach((d, i) => { $("span", d).textContent = items[i][2]; });
          achieve("dns");
        });
      };
    },
  };

  /* ---------- Tresor (AES-GCM) ---------- */
  const VKEY = "beneos.vault";
  async function deriveKey(pass, salt) {
    const km = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 250000, hash: "SHA-256" }, km, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  }
  const vload = () => { try { return JSON.parse(localStorage.getItem(VKEY)); } catch { return null; } };
  const vsave = v => { try { localStorage.setItem(VKEY, JSON.stringify(v)); return true; } catch { return false; } };

  A.vault = {
    title: "Tresor", icon: "🔐", group: "Security Lab", w: 500, h: 480,
    render(body) {
      let key = null, salt = null, timer = 0, alive = true, curText = null;
      const lockedUI = (msg = "") => {
        const exists = !!vload();
        body.innerHTML = `<div class="pad"><h1>Tresor</h1><div class="dim">Eine Notiz, verschlüsselt mit <b>AES-256-GCM</b>. Der Schlüssel wird per PBKDF2 (250 000 Runden) aus deinem Passwort abgeleitet. Alles bleibt in diesem Browser – ohne Passwort gibt es keine Wiederherstellung.</div>
          <form id="vf" style="margin-top:14px"><input class="field" id="v1" type="password" placeholder="${exists ? "Passwort" : "Neues Passwort (mind. 10 Zeichen)"}" autocomplete="off">
          ${exists ? "" : `<input class="field" id="v2" type="password" placeholder="Passwort wiederholen" autocomplete="off">`}
          <button class="btn">${exists ? "🔓 Entsperren" : "🔐 Tresor anlegen"}</button></form><div id="vmsg" style="margin-top:10px;color:#ff5470;min-height:22px">${esc(msg)}</div>
          ${exists ? `<div class="opbar"><button class="btn" id="vdel">Tresor löschen</button></div>` : ""}</div>`;
        $("#vf", body).onsubmit = async e => {
          e.preventDefault();
          const p = $("#v1", body).value, m = $("#vmsg", body);
          try {
            if (!exists) {
              if (p.length < 10) { m.textContent = "Mindestens 10 Zeichen."; return; }
              if (p !== $("#v2", body).value) { m.textContent = "Passwörter stimmen nicht überein."; return; }
              m.style.color = "#cfeaff"; m.textContent = "Schlüssel wird abgeleitet …";
              salt = crypto.getRandomValues(new Uint8Array(16)); key = await deriveKey(p, salt);
              await save("");
              achieve("vault"); sfx("success"); open_("");
            } else {
              m.style.color = "#cfeaff"; m.textContent = "Entschlüssele …";
              const v = vload(); salt = unb64(v.salt); const k = await deriveKey(p, salt);
              const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(v.iv) }, k, unb64(v.ct));
              key = k; sfx("login"); open_(dec.decode(pt));
            }
          } catch { await new Promise(r => setTimeout(r, 700)); if (alive) { sfx("error"); lockedUI("Falsches Passwort oder beschädigte Daten."); } }
        };
        const del = $("#vdel", body);
        if (del) del.onclick = () => { if (del.dataset.sure) { try { localStorage.removeItem(VKEY); } catch { /* egal */ } sfx("close"); lockedUI("Tresor gelöscht."); } else { del.dataset.sure = "1"; del.textContent = "Wirklich löschen? (nochmal klicken)"; } };
      };
      const save = async text => {
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(text)));
        return vsave({ v: 1, salt: b64(salt), iv: b64(iv), ct: b64(ct) });
      };
      const open_ = text => {
        body.innerHTML = `<div class="pad" style="display:flex;flex-direction:column;height:100%"><div class="opbar" style="justify-content:space-between;align-items:center"><b>🔓 Tresor entsperrt</b><span><span class="dim" id="vst">gespeichert</span> <button class="btn" id="vlock">🔒 Sperren</button></span></div>
          <textarea class="notes field" id="vt" style="flex:1;min-height:240px;margin-top:10px" placeholder="Geheime Notizen …" spellcheck="false"></textarea></div>`;
        const ta = $("#vt", body); ta.value = text; ta.focus(); curText = text;
        const lock = async () => { clearTimeout(timer); if (key) await save(ta.value); key = null; curText = null; sfx("menu"); lockedUI(); };
        ta.oninput = () => { curText = ta.value; $("#vst", body).textContent = "…"; clearTimeout(timer); timer = setTimeout(async () => { if (!key) return; const ok = await save(ta.value); $("#vst", body).textContent = ok ? "verschlüsselt gespeichert" : "Speichern fehlgeschlagen"; }, 700); };
        $("#vlock", body).onclick = lock;
      };
      lockedUI();
      return () => { alive = false; clearTimeout(timer); if (key && curText !== null) save(curText); key = null; };
    },
  };
})();
