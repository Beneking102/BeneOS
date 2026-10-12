"use strict";
/* Mobile-Modus (Handy / schmale Fenster): Home-Screen mit Uhr und Suche, Apps im Vollbild (immer nur eine sichtbar),
   Zurück-Taste des Geräts minimiert die aktive App, Tastatur-Erkennung, Installations-Hinweis. Läuft nach shell2.js. */
(() => {
  const body = document.body;
  const mq = matchMedia("(max-width: 760px), (max-height: 520px) and (pointer: coarse)");
  let maxH = innerHeight, depth = 0;

  const apply = () => { body.classList.toggle("mobile", mq.matches); window.MOBILE = mq.matches; if (window.updateOcclusion) updateOcclusion(); };
  mq.addEventListener("change", apply); apply();
  addEventListener("resize", () => { maxH = Math.max(maxH, innerHeight); body.classList.toggle("kb", mq.matches && innerHeight < maxH * .75); });

  /* ---------- Home-Header: Uhr, Suche, Schnellzugriffe ---------- */
  const home = el("div"); home.id = "mhome";
  home.innerHTML = `<div class="mh-time"><b></b><span></span></div>
    <input class="field" id="msearch" placeholder="Apps &amp; Repos suchen …" autocomplete="off" spellcheck="false" aria-label="Apps suchen">
    <div class="mh-chips">${[["about", "Über mich"], ["bot", "BeneBot"], ["terminal", "Terminal"], ["ctf", "CTF"], ["report", "Report"]].map(([id, t]) => `<button class="chip" data-open="${id}">${iconHTML(id)}${t}</button>`).join("")}</div>`;
  $("#desktop").insertBefore(home, $("#icons"));
  const tick = () => {
    const d = new Date();
    $(".mh-time b", home).textContent = d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    $(".mh-time span", home).textContent = d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
  };
  tick(); setInterval(tick, 15000);

  const search = $("#msearch", home);
  const filter = () => {
    const v = search.value.trim().toLowerCase();
    document.querySelectorAll("#icons .icon").forEach(b => { b.hidden = !!v && !(b.title || "").toLowerCase().includes(v) && !(b.dataset.id || "").toLowerCase().includes(v); });
  };
  search.oninput = filter;
  search.onkeydown = e => { if (e.key === "Enter") { const b = document.querySelector("#icons .icon:not([hidden])"); if (b) { openApp(b.dataset.id); search.value = ""; filter(); search.blur(); } } };

  /* ---------- Zurück-Taste: aktive App minimieren (zurück zum Home-Screen) ---------- */
  const _open = window.openApp;
  window.openApp = id => {
    _open(id);
    if (window.MOBILE && open[id] && !open[id].win.classList.contains("hidden")) { try { history.pushState({ beneos: 1 }, ""); depth++; } catch { /* egal */ } }
  };
  addEventListener("popstate", () => {
    if (!window.MOBILE) return;
    if (depth > 0) depth--;
    const a = Object.values(open).find(w => w.win.classList.contains("active") && !w.win.classList.contains("hidden"));
    if (a) $(".mn", a.win).click();
  });

  /* ---------- Installation als App ---------- */
  addEventListener("beforeinstallprompt", e => { e.preventDefault(); window.__installEvt = e; });
  window.installPWA = async () => { const e = window.__installEvt; if (!e) return; e.prompt(); try { await e.userChoice; } catch { /* egal */ } window.__installEvt = null; };

  /* ---------- Einmaliger Tipp ---------- */
  document.addEventListener("repos", () => {
    if (!window.MOBILE || store.get("m-tip", false)) return;
    store.set("m-tip", true);
    setTimeout(() => toast("📱 <b>Mobile-Ansicht</b><br><small>⌂ oben links = Startseite · ▦ = Apps wechseln · als App installieren: Browser-Menü → „Zum Startbildschirm“</small>"), 4000);
  }, { once: true });
})();
