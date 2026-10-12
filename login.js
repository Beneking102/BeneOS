"use strict";
/* Anmeldung & Sperrbildschirm.
   Konten:  Gast (ohne Passwort)  ·  Benedikt (Owner, geschützt – nicht erreichbar)  ·  „Anderer Benutzer“ (admin/admin = CTF-Easter-Egg).
   Nach 3 Fehlversuchen: Sperre mit Countdown. Erfolgreiche Anmeldung läuft durch eine animierte Auth-Sequenz. */
(() => {
  const $l = s => document.querySelector(s);
  const login = $l("#login"), box = $l("#lbox"), tiles = $l("#lusers"), form = $l("#login-form"), msg = $l("#lmsg"),
    auth = $l("#lauth"), authLog = $l("#lauth-log"), authBar = $l("#lauth-bar"), hint = $l("#lhint"),
    inU = $l("#lu"), inP = $l("#lp"), avatar = $l("#lavatar"), sub = $l("#lsub");
  const owner = () => PROFILE.name.split(" ")[0];
  const L = { fails: 0, locked: false, busy: false, sel: null, until: 0, timer: 0 };

  const shake = () => { box.classList.remove("shake"); void box.offsetWidth; box.classList.add("shake"); };

  function showTiles() {
    L.sel = null; L.busy = false;
    form.hidden = true; auth.hidden = true; tiles.hidden = false;
    authLog.textContent = ""; authBar.style.width = "0";
    avatar.textContent = PROFILE.name[0];
    sub.textContent = L.locked ? `Sitzung gesperrt – ${session.user}` : "Wähle ein Konto";
    tiles.querySelectorAll(".utile").forEach(b => { b.hidden = L.locked && b.dataset.u !== "guest"; });
    if (!L.until) msg.textContent = "";
    const first = tiles.querySelector(".utile:not([hidden])"); if (first) first.focus();
  }

  function showForm(kind, fixedUser) {
    L.sel = kind;
    tiles.hidden = true; form.hidden = false;
    const name = fixedUser || (kind === "owner" ? owner().toLowerCase() : "");
    inU.value = name; inU.readOnly = !!name; inU.hidden = !!name && kind === "owner";
    inP.value = "";
    avatar.textContent = (name || "?")[0].toUpperCase();
    sub.textContent = name ? `Konto: ${name}` : "Benutzername und Passwort eingeben";
    (name ? inP : inU).focus();
  }

  function lockout(sec) {
    L.until = Date.now() + sec * 1000;
    form.querySelectorAll("input,button").forEach(x => { x.disabled = true; });
    clearInterval(L.timer);
    const tick = () => {
      const left = Math.ceil((L.until - Date.now()) / 1000);
      if (left <= 0) {
        clearInterval(L.timer); L.until = 0; L.fails = 0;
        form.querySelectorAll("input,button").forEach(x => { x.disabled = false; });
        msg.textContent = "";
        hint.textContent = "Hinweis: Manche Systeme sind ab Werk unsicher – Default-Credentials sind ein Klassiker. 😉";
        if (!form.hidden) (inU.readOnly ? inP : inU).focus();
        return;
      }
      msg.textContent = `🚨 Zu viele Fehlversuche – gesperrt für ${left}s (Vorfall protokolliert, nur Show)`;
    };
    tick(); L.timer = setInterval(tick, 250);
  }

  function fail() {
    L.fails++; sfx("error"); shake();
    inP.value = "";
    if (L.fails >= 3) { lockout(8); return; }
    msg.textContent = `Zugriff verweigert (Fehlversuch ${L.fails}/3)`;
  }

  function authenticate(user) {
    L.busy = true;
    form.hidden = true; tiles.hidden = true; auth.hidden = false; msg.textContent = "";
    sub.textContent = `Anmeldung als ${user}`;
    avatar.textContent = user[0].toUpperCase();
    const steps = ["Verbinde mit beneos-auth", `Prüfe Zugangsdaten (${user})`, "TLS 1.3 · CSP strict · HSTS aktiv", "Starte Sitzung", "Lade Profil & Apps"];
    steps.forEach((s, i) => setTimeout(() => {
      authLog.textContent += `> ${s} … OK\n`;
      authBar.style.width = (i + 1) / steps.length * 100 + "%";
      sfx("menu");
    }, 250 + i * 240));
    setTimeout(() => {
      const wasLocked = L.locked;
      L.locked = false; L.fails = 0;
      showTiles();
      if (wasLocked) { login.hidden = true; session.user = user; buildStart(); sfx("login"); }
      else enterDesktop(user);
    }, 250 + steps.length * 240 + 200);
  }

  tiles.addEventListener("click", e => {
    const b = e.target.closest(".utile"); if (!b || L.busy) return;
    const u = b.dataset.u;
    if (u === "guest") authenticate("guest");
    else showForm(u);
  });
  $l("#lback").onclick = () => { if (L.until) return; if (L.locked && session.user !== "guest") return; showTiles(); };

  form.onsubmit = e => {
    e.preventDefault();
    if (L.busy || L.until) return;
    const u = inU.value.trim().toLowerCase(), p = inP.value;
    if (!u) { fail(); return; }
    // Der Owner-Account ist absichtlich nicht erreichbar. Gast braucht kein Passwort, admin/admin ist das CTF-Easter-Egg.
    if (u === "guest" || (u === "admin" && p === "admin")) authenticate(u);
    else fail();
  };

  window.showLogin = () => { login.hidden = false; L.locked = false; showTiles(); };
  window.lockScreen = () => {
    if (L.busy || !login.hidden) return;
    closeStart(); sfx("menu");
    L.locked = true; login.hidden = false;
    if (session.user === "guest") showTiles(); else { showForm("other", session.user); $l("#lback").hidden = true; }
    hint.textContent = "";
  };
  // Zurück-Button nur im normalen Login anzeigen
  new MutationObserver(() => { if (login.hidden) $l("#lback").hidden = false; }).observe(login, { attributes: true, attributeFilter: ["hidden"] });
})();
