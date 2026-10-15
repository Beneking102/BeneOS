"use strict";
// "Hack me"-Intro für die NFC-Karte. Der Geräte-"Scan" läuft nur lokal im Browser und zeigt, was jede Website sieht.
// An den Server geht nur: Quelle (card/tag), bei einem BeneCard-Tap die Einmal-ID und der Gerätetyp (für die Live-Anzeige in der App).
(() => {
  const $ = s => document.querySelector(s);
  const q = new URLSearchParams(location.search);
  const via = ["card", "tag"].includes(q.get("via")) ? q.get("via") : "web";
  const id = /^[a-z0-9]{6,16}$/.test(q.get("id") || "") ? q.get("id") : null;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Matrix-Regen ---------- */
  const cv = $("#rain"), g = cv.getContext("2d");
  const glyphs = "アカサタナハマヤラワ0123456789ABCDEF<>{}#$%";
  let drops = [], fs = 15, speed = 1;
  const size = () => {
    cv.width = innerWidth; cv.height = innerHeight;
    drops = Array.from({ length: Math.ceil(innerWidth / fs) }, () => Math.random() * -40);
  };
  size(); addEventListener("resize", size);
  let last = 0;
  const rain = t => {
    if (t - last > 50 / speed) {
      last = t;
      g.fillStyle = "rgba(5,10,7,0.13)"; g.fillRect(0, 0, cv.width, cv.height);
      g.font = fs + "px monospace";
      drops.forEach((y, i) => {
        g.fillStyle = Math.random() < .04 ? "#e8fff0" : "#39ff7a";
        g.fillText(glyphs[(Math.random() * glyphs.length) | 0], i * fs, y * fs);
        drops[i] = y * fs > cv.height && Math.random() > .975 ? 0 : y + 1;
      });
    }
    requestAnimationFrame(rain);
  };
  if (!reduced) requestAnimationFrame(rain);

  /* ---------- Lokaler Geräte-Scan ---------- */
  async function probe() {
    const n = navigator, ua = n.userAgent;
    let model = "", os = "";
    try {
      if (n.userAgentData) {
        const h = await n.userAgentData.getHighEntropyValues(["model", "platformVersion"]);
        model = h.model || "";
        const major = h.platformVersion ? +h.platformVersion.split(".")[0] : 0;
        // Windows meldet Version 13+ für Windows 11 und 1–10 für Windows 10
        os = n.userAgentData.platform === "Windows" ? (major >= 13 ? "Windows 11" : "Windows 10")
          : n.userAgentData.platform + (major ? " " + major : "");
      }
    } catch (e) { /* nicht unterstützt */ }
    if (!os) os = /iPhone|iPad/.test(ua) ? "iOS " + ((ua.match(/OS (\d+)/) || [])[1] || "")
      : /Android (\d+)/.test(ua) ? "Android " + ua.match(/Android (\d+)/)[1]
      : /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "macOS" : "Linux";
    if (!model) {
      const m = ua.match(/Android [\d.]+; ([^;)]+)/);
      model = m && m[1] !== "K" ? m[1] : /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : "";
    }
    const browser = (ua.match(/(SamsungBrowser|Firefox|Edg|OPR|CriOS|Chrome|Safari)\/(\d+)/) || [, "Browser", ""]).slice(1).join(" ").replace("Edg", "Edge").replace("CriOS", "Chrome");
    let battery = "";
    try {
      if (n.getBattery) { const b = await n.getBattery(); battery = Math.round(b.level * 100) + " %" + (b.charging ? " (lädt)" : ""); }
    } catch (e) { /* nicht unterstützt */ }
    return {
      model, os: os.trim(), browser, battery,
      screen: `${screen.width}×${screen.height} @${Math.round(devicePixelRatio * 10) / 10}x`,
      cpu: n.hardwareConcurrency ? n.hardwareConcurrency + " Kerne" : "",
      ram: n.deviceMemory ? "≥" + n.deviceMemory + " GB RAM" : "",
      lang: n.language, tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      net: n.connection && n.connection.effectiveType ? n.connection.effectiveType.toUpperCase() : "",
    };
  }

  /* ---------- Terminal ---------- */
  const log = $("#log"), prog = $("#prog");
  const cursor = document.createElement("span"); cursor.className = "cursor"; cursor.textContent = " ";
  log.append(cursor);
  async function type(text, cls = "", ms = 12) {
    const line = document.createElement("span"); if (cls) line.className = cls;
    log.insertBefore(line, cursor);
    for (const ch of text) { line.textContent += ch; if (!reduced) await wait(ms); }
    log.insertBefore(document.createTextNode("\n"), cursor);
  }

  /* ---------- Server ---------- */
  const visit = probe().then(info => fetch("/api/visit", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ via, id, model: info.model || info.os }),
  }).then(r => r.json()).catch(() => null));

  const ago = t => { const s = (Date.now() - t) / 1000; return s < 60 ? "gerade eben" : s < 3600 ? `vor ${Math.round(s / 60)} Min` : s < 86400 ? `vor ${Math.round(s / 3600)} Std` : `vor ${Math.round(s / 86400)} T`; };
  const VIA = { card: "Benes Handy", tag: "NFC-Sticker", web: "Web" };

  async function finish() {
    const res = await visit;
    $("#count").textContent = res && res.count ? "#" + res.count : "#?";
    if (via === "card") $("#linked").hidden = false;
    if (id) $("#modelnote").textContent = " und deinem Gerätetyp – den holt Benes App einmal ab, danach ist er gelöscht";
    if (res && res.flag) {
      $("#flagcard").hidden = false; $("#flag").textContent = res.flag;
      try { // Erfolg wird beim nächsten BeneOS-Start freigeschaltet
        const k = "beneos.pending-ach", p = JSON.parse(localStorage.getItem(k) || "[]");
        if (!p.includes("nfc")) localStorage.setItem(k, JSON.stringify([...p, "nfc"]));
      } catch (e) { /* kein Storage */ }
    }
    try {
      const { recent = [] } = await (await fetch("/api/visit")).json();
      $("#feed").innerHTML = "";
      recent.slice(0, 5).forEach(v => {
        const li = document.createElement("li");
        li.innerHTML = `<span></span><span></span>`;
        li.children[0].textContent = `${ago(v.t)} · ${v.os}`;
        li.children[1].textContent = VIA[v.via] || "Web";
        $("#feed").append(li);
      });
    } catch (e) { /* offline */ }
  }

  $("#copy").onclick = async () => {
    try { await navigator.clipboard.writeText($("#flag").textContent); $("#copy").textContent = "✓ Kopiert"; } catch (e) { $("#copy").textContent = "Markieren"; }
  };
  $("#vcard").onclick = () => {
    const v = "BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Bene\r\nTITLE:Junior Cybersecurity Consultant\r\nURL:https://os.benedikt-pkr.info\r\nURL:https://github.com/Beneking102\r\nEND:VCARD\r\n";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([v], { type: "text/vcard" })); a.download = "Bene.vcf"; a.click();
  };

  (async () => {
    const src = via === "card" ? "BeneCard (Benes Pixel)" : via === "tag" ? "NFC-Sticker" : "Web";
    const info = await probe();
    const steps = [
      [`$ nfc-link --source "${src}"`, "hi"],
      ["> handshake ............ OK", ""],
      ["> fingerprinting ziel ...", "dim"],
      [`  gerät     : ${[info.model, info.os].filter(Boolean).join(" · ")}`, ""],
      [`  browser   : ${info.browser}`, ""],
      [`  display   : ${info.screen}`, ""],
      [`  hardware  : ${[info.cpu, info.ram].filter(Boolean).join(" · ") || "verschleiert 👏"}`, ""],
      info.battery ? [`  akku      : ${info.battery}`, ""] : null,
      [`  ort       : ${info.tz} · ${info.lang}`, ""],
      info.net ? [`  netz      : ${info.net}`, ""] : null,
      ["> umgehe sperrbildschirm ...... FAIL", "warn"],
      ["> exfiltriere selfies ......... ABGEBROCHEN", "warn"],
      ["> grund: Bene ist White Hat.", "hi"],
    ].filter(Boolean);
    for (let i = 0; i < steps.length; i++) {
      await type(steps[i][0], steps[i][1]);
      prog.style.width = Math.round(((i + 1) / steps.length) * 100) + "%";
      if (steps[i][1] === "warn") speed = 4;
      await wait(reduced ? 0 : 160);
    }
    speed = 1;
    if (!reduced) {
      document.body.classList.add("glitch");
      $("#flash").style.opacity = ".35";
      setTimeout(() => { $("#flash").style.opacity = "0"; document.body.classList.remove("glitch"); }, 550);
      await wait(450);
    }
    $("#done").style.display = "block";
    $("#done").scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    finish();
  })();
})();
