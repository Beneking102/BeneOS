"use strict";
/* Pentest-Report-Generator: CVSS-3.1-Rechner, Finding-Vorlagen (CWE/OWASP), automatische Management-Summary,
   Export als Markdown / HTML / PDF (Druckdialog) und JSON-Sicherung. Alles lokal, Autosave im Browser.
   Die Vorlagentexte sind Beispiele und müssen vor dem Kundeneinsatz fachlich geprüft werden. */
window.EXTRA_APPS = window.EXTRA_APPS || {};
(() => {
  const A = window.EXTRA_APPS;
  const KEY = "report";

  /* ---------- CVSS 3.1 ---------- */
  const W = {
    AV: { N: .85, A: .62, L: .55, P: .2 }, AC: { L: .77, H: .44 }, UI: { N: .85, R: .62 },
    C: { H: .56, L: .22, N: 0 }, I: { H: .56, L: .22, N: 0 }, A: { H: .56, L: .22, N: 0 },
  };
  const LABELS = {
    AV: ["Angriffsvektor", { N: "Netzwerk", A: "Angrenzend", L: "Lokal", P: "Physisch" }],
    AC: ["Komplexität", { L: "Niedrig", H: "Hoch" }],
    PR: ["Erforderliche Rechte", { N: "Keine", L: "Niedrig", H: "Hoch" }],
    UI: ["Nutzerinteraktion", { N: "Keine", R: "Erforderlich" }],
    S: ["Scope", { U: "Unverändert", C: "Geändert" }],
    C: ["Vertraulichkeit", { H: "Hoch", L: "Niedrig", N: "Keine" }],
    I: ["Integrität", { H: "Hoch", L: "Niedrig", N: "Keine" }],
    A: ["Verfügbarkeit", { H: "Hoch", L: "Niedrig", N: "Keine" }],
  };
  const ORDER = ["AV", "AC", "PR", "UI", "S", "C", "I", "A"];
  const SEV = {
    critical: { de: "Kritisch", col: "#b71c1c", rank: 4 }, high: { de: "Hoch", col: "#e65100", rank: 3 }, medium: { de: "Mittel", col: "#f9a825", rank: 2 },
    low: { de: "Niedrig", col: "#2e7d32", rank: 1 }, info: { de: "Informativ", col: "#1565c0", rank: 0 },
  };
  const roundup = x => { const i = Math.round(x * 100000); return i % 10000 === 0 ? i / 100000 : (Math.floor(i / 10000) + 1) / 10; };
  const sevOf = s => (s >= 9 ? "critical" : s >= 7 ? "high" : s >= 4 ? "medium" : s > 0 ? "low" : "info");
  function cvss(v) {
    const sc = v.S === "C";
    const pr = v.PR === "N" ? .85 : v.PR === "L" ? (sc ? .68 : .62) : (sc ? .5 : .27);
    const iss = 1 - (1 - W.C[v.C]) * (1 - W.I[v.I]) * (1 - W.A[v.A]);
    const imp = sc ? 7.52 * (iss - .029) - 3.25 * Math.pow(iss - .02, 15) : 6.42 * iss;
    const ex = 8.22 * W.AV[v.AV] * W.AC[v.AC] * pr * W.UI[v.UI];
    const score = imp <= 0 ? 0 : roundup(Math.min(sc ? 1.08 * (imp + ex) : imp + ex, 10));
    return { score, sev: sevOf(score), vector: "CVSS:3.1/" + ORDER.map(k => `${k}:${v[k]}`).join("/") };
  }
  function parseVec(s) {
    if (typeof s !== "string") return null;
    const p = s.trim().split("/");
    if (p[0] !== "CVSS:3.1" && p[0] !== "CVSS:3.0") return null;
    const v = {};
    for (const part of p.slice(1)) { const [k, val] = part.split(":"); if (LABELS[k] && LABELS[k][1][val] && v[k] === undefined) v[k] = val; }
    return ORDER.every(k => v[k]) ? v : null;
  }
  const V = s => parseVec("CVSS:3.1/" + s);

  /* ---------- Vorlagen ---------- */
  const TEMPLATES = [
    { name: "SQL-Injection", vec: "AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H", refs: "CWE-89 · OWASP Top 10 2021: A03 Injection · OWASP SQL Injection Prevention Cheat Sheet",
      desc: "Benutzereingaben werden ungefiltert in SQL-Abfragen übernommen. Ein Angreifer kann die Abfragelogik verändern, Daten auslesen oder manipulieren.",
      impact: "Zugriff auf Datenbankinhalte (z. B. Kundendaten, Zugangsdaten), Manipulation oder Löschung von Daten, im Extremfall Codeausführung auf dem Datenbankserver.",
      repro: "1. Den Parameter [PARAMETER] mit einem einfachen Anführungszeichen (') aufrufen.\n2. Fehlermeldung bzw. abweichendes Verhalten beobachten.\n3. Boolesche oder zeitbasierte Payloads bestätigen die Injection.",
      fix: "- Ausschließlich parametrisierte Abfragen (Prepared Statements) verwenden.\n- ORM korrekt einsetzen, keine String-Konkatenation.\n- Datenbankkonto mit minimalen Rechten betreiben.\n- Serverseitige Eingabevalidierung als Zusatzmaßnahme." },
    { name: "Reflektiertes Cross-Site-Scripting (XSS)", vec: "AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N", refs: "CWE-79 · OWASP Top 10 2021: A03 Injection · OWASP XSS Prevention Cheat Sheet",
      desc: "Eingaben aus dem Request werden ohne ausreichende Kodierung in die HTML-Antwort eingebettet. Über präparierte Links kann Skriptcode im Browser des Opfers ausgeführt werden.",
      impact: "Übernahme von Sitzungen, Ausführen von Aktionen im Namen des Opfers, Phishing innerhalb der vertrauenswürdigen Domain.",
      repro: "1. Den Parameter [PARAMETER] mit einer harmlosen Test-Payload versehen.\n2. Antwort prüfen: Die Eingabe wird unkodiert im HTML-Kontext ausgegeben.\n3. Ausführung der Payload im Browser bestätigen.",
      fix: "- Kontextabhängige Ausgabekodierung (HTML, Attribut, JavaScript, URL).\n- Content-Security-Policy ohne 'unsafe-inline' einsetzen.\n- Moderne Frameworks mit automatischem Escaping verwenden.\n- Cookies mit HttpOnly und SameSite setzen." },
    { name: "Gespeichertes Cross-Site-Scripting (Stored XSS)", vec: "AV:N/AC:L/PR:L/UI:R/S:C/C:L/I:L/A:N", refs: "CWE-79 · OWASP Top 10 2021: A03 Injection",
      desc: "Eingaben werden dauerhaft gespeichert und später ohne Kodierung an andere Nutzer ausgeliefert. Die Schadwirkung tritt ohne präparierten Link auf.",
      impact: "Wiederholte Ausführung von Angreifer-Code bei jedem Seitenaufruf, Kontoübernahme, Verbreitung als Wurm möglich.",
      repro: "1. Im Feld [FELD] eine Test-Payload speichern.\n2. Die Seite [URL] als anderer Nutzer aufrufen.\n3. Ausführung der Payload im Browser bestätigen.",
      fix: "- Ausgabekodierung beim Rendern, nicht nur Eingabefilter.\n- HTML-Sanitizing mit Allowlist, falls Rich-Text nötig ist.\n- Strikte Content-Security-Policy." },
    { name: "Unsichere direkte Objektreferenz (IDOR) / Broken Access Control", vec: "AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:L/A:N", refs: "CWE-639 · OWASP Top 10 2021: A01 Broken Access Control",
      desc: "Der Zugriff auf Objekte wird nur über eine vorhersehbare Kennung gesteuert; eine serverseitige Berechtigungsprüfung fehlt oder ist unvollständig.",
      impact: "Lesender und teilweise schreibender Zugriff auf Daten anderer Nutzer oder Mandanten.",
      repro: "1. Als Nutzer A anmelden und die Anfrage an [ENDPUNKT] mit der eigenen ID aufzeichnen.\n2. Die ID durch die eines Nutzers B ersetzen.\n3. Die Daten von Nutzer B werden zurückgegeben.",
      fix: "- Autorisierung bei jedem Zugriff serverseitig prüfen (Objekt gehört zum Nutzer/Mandanten).\n- Nicht erratbare IDs (UUID) zusätzlich nutzen, ersetzt aber keine Prüfung.\n- Zentrale Autorisierungs-Schicht und automatisierte Tests." },
    { name: "Fehlende Security-Header", vec: "AV:N/AC:H/PR:N/UI:R/S:U/C:L/I:L/A:N", refs: "CWE-693 · OWASP Top 10 2021: A05 Security Misconfiguration · OWASP Secure Headers Project",
      desc: "Die Anwendung setzt wichtige HTTP-Sicherheitsheader nicht oder unvollständig (z. B. Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options, Clickjacking-Schutz).",
      impact: "Erhöht die Angriffsfläche für XSS, Clickjacking und Downgrade-Angriffe; allein selten ausnutzbar, schwächt aber Verteidigungstiefe.",
      repro: "1. Antwortheader von [URL] abrufen (z. B. mit curl -I).\n2. Das Fehlen der Header [HEADER] feststellen.",
      fix: "- Content-Security-Policy mit restriktiven Quellen definieren.\n- Strict-Transport-Security (HSTS) mit langer Laufzeit setzen.\n- X-Content-Type-Options: nosniff, Referrer-Policy und frame-ancestors/X-Frame-Options konfigurieren." },
    { name: "Cross-Site-Request-Forgery (CSRF)", vec: "AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:H/A:N", refs: "CWE-352 · OWASP Top 10 2021: A01 Broken Access Control · OWASP CSRF Prevention Cheat Sheet",
      desc: "Zustandsändernde Anfragen sind nicht durch Anti-CSRF-Token oder vergleichbare Maßnahmen geschützt. Ein Angreifer kann angemeldete Nutzer unbemerkt Aktionen ausführen lassen.",
      impact: "Ungewollte Änderungen (z. B. Passwort, E-Mail, Überweisungen) im Namen des Opfers.",
      repro: "1. Anfrage [ENDPUNKT] aufzeichnen; kein unvorhersehbares Token vorhanden.\n2. Präparierte Seite auf fremder Domain erstellen, die die Anfrage auslöst.\n3. Aufruf als angemeldeter Nutzer führt die Aktion aus.",
      fix: "- Synchronizer-Token oder Double-Submit-Cookie einsetzen.\n- Cookies mit SameSite=Lax/Strict.\n- Sensible Aktionen zusätzlich per Re-Authentifizierung schützen." },
    { name: "Server-Side Request Forgery (SSRF)", vec: "AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:L/A:N", refs: "CWE-918 · OWASP Top 10 2021: A10 Server-Side Request Forgery",
      desc: "Die Anwendung ruft vom Nutzer kontrollierte URLs serverseitig ab, ohne Ziel und Protokoll ausreichend einzuschränken.",
      impact: "Zugriff auf interne Dienste und Metadaten-Endpunkte der Cloud-Umgebung, Auslesen von Zugangsdaten, Scan des internen Netzes.",
      repro: "1. Parameter [PARAMETER] auf eine vom Tester kontrollierte URL setzen.\n2. Eingehende Anfrage des Servers beobachten.\n3. Zugriff auf interne Adressen [ZIEL] demonstrieren.",
      fix: "- Allowlist für Zielhosts, Protokolle und Ports.\n- Auflösung und Verbindung auf private/Link-Local-Adressbereiche blockieren.\n- Cloud-Metadaten-Dienst absichern (z. B. IMDSv2) und Netzwerksegmentierung einsetzen." },
    { name: "Schwache TLS-Konfiguration", vec: "AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:L/A:N", refs: "CWE-326 · CWE-327 · OWASP Top 10 2021: A02 Cryptographic Failures",
      desc: "Der Server akzeptiert veraltete Protokollversionen oder schwache Cipher Suites ([DETAILS]).",
      impact: "Abhören oder Manipulieren von Verbindungen durch Angreifer mit Netzwerkposition wird erleichtert.",
      repro: "1. TLS-Konfiguration von [HOST] mit einem Scanner prüfen.\n2. Unterstützung von [PROTOKOLL/CIPHER] feststellen.",
      fix: "- Nur TLS 1.2 und 1.3 mit AEAD-Cipher-Suites zulassen.\n- Veraltete Protokolle (SSLv3, TLS 1.0/1.1) deaktivieren.\n- HSTS aktivieren und Zertifikatskette prüfen." },
    { name: "Standard-Zugangsdaten", vec: "AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H", refs: "CWE-1392 · OWASP Top 10 2021: A07 Identification and Authentication Failures",
      desc: "Ein System ist mit herstellerseitigen Standard-Zugangsdaten erreichbar.",
      impact: "Vollständige Übernahme des Systems oder der Administrationsoberfläche.",
      repro: "1. Administrationsoberfläche [URL] aufrufen.\n2. Anmeldung mit den dokumentierten Standard-Zugangsdaten ist erfolgreich.",
      fix: "- Standardpasswörter bei Inbetriebnahme ändern und erzwingen.\n- Administrationsoberflächen nicht aus dem Internet erreichbar machen.\n- Zugriff mit Multi-Faktor-Authentifizierung absichern." },
    { name: "Veraltete Komponente mit bekannter Schwachstelle", vec: "AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:L", refs: "CWE-1104 · OWASP Top 10 2021: A06 Vulnerable and Outdated Components",
      desc: "Die eingesetzte Komponente [KOMPONENTE] in Version [VERSION] ist veraltet und von bekannten Schwachstellen ([CVE-NUMMER]) betroffen.",
      impact: "Abhängig von der Schwachstelle: Informationsabfluss, Manipulation oder Dienstausfall.",
      repro: "1. Version über [BANNER/DATEI] identifizieren.\n2. Abgleich mit der CVE-Datenbank (z. B. OSV, NVD).",
      fix: "- Komponente auf eine gepatchte Version aktualisieren.\n- Abhängigkeiten automatisiert überwachen (SCA, Dependabot/Renovate).\n- Nicht benötigte Komponenten entfernen." },
    { name: "Informationspreisgabe", vec: "AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N", refs: "CWE-200 · OWASP Top 10 2021: A05 Security Misconfiguration",
      desc: "Die Anwendung gibt technische Details preis (z. B. Stack-Traces, Versionsbanner, Verzeichnislisting, Debug-Endpunkte).",
      impact: "Erleichtert gezielte Angriffe durch Offenlegung von Technologien, Pfaden und internen Strukturen.",
      repro: "1. [URL] mit fehlerhafter Eingabe aufrufen.\n2. Detaillierte Fehlermeldung bzw. interne Informationen in der Antwort feststellen.",
      fix: "- Generische Fehlermeldungen im Produktivbetrieb, Details nur im Log.\n- Versionsbanner und Debug-Funktionen deaktivieren.\n- Verzeichnislisting abschalten." },
    { name: "Fehlender Brute-Force-Schutz", vec: "AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N", refs: "CWE-307 · OWASP Top 10 2021: A07 Identification and Authentication Failures",
      desc: "Der Anmeldevorgang ist weder durch Rate-Limiting noch durch Kontosperrung oder CAPTCHA gegen automatisierte Angriffe geschützt.",
      impact: "Erraten schwacher Passwörter und Credential-Stuffing sind unbegrenzt möglich.",
      repro: "1. Anmeldeanfrage an [ENDPUNKT] automatisiert mit wechselnden Passwörtern senden.\n2. Es erfolgt keine Drosselung oder Sperre.",
      fix: "- Rate-Limiting pro Konto und IP, progressive Verzögerung.\n- Multi-Faktor-Authentifizierung.\n- Prüfung gegen Listen kompromittierter Passwörter und starke Passwortrichtlinie." },
  ];

  /* ---------- Dokument ---------- */
  const today = () => new Date().toISOString().slice(0, 10);
  const uid = () => "f" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const defVec = () => V("AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N");
  const blank = () => ({
    meta: { title: "Web-Applikations-Penetrationstest", client: "", tester: PROFILE.name, date: today(), period: "", version: "1.0", conf: "Vertraulich", scope: "",
      method: "Vorgehen in Anlehnung an den OWASP Web Security Testing Guide (WSTG) und die OWASP Top 10 (2021). Manuelle Tests, ergänzt durch werkzeuggestützte Analysen.", summary: "" },
    findings: [],
  });
  const s = (v, n = 20000) => (typeof v === "string" ? v.slice(0, n) : "");
  function sanitize(d) {            // JSON-Import: nur bekannte Felder, Längenlimits, gültige Vektoren
    const b = blank(), out = { meta: {}, findings: [] };
    for (const k of Object.keys(b.meta)) out.meta[k] = s(d?.meta?.[k], 8000) || (k === "conf" ? b.meta.conf : "");
    if (!out.meta.date) out.meta.date = today();
    (Array.isArray(d?.findings) ? d.findings.slice(0, 200) : []).forEach(f => {
      out.findings.push({ id: uid(), title: s(f?.title, 300) || "Unbenanntes Finding", vec: parseVec(f?.vector) || (f?.vec && ORDER.every(k => LABELS[k][1][f.vec[k]]) ? Object.fromEntries(ORDER.map(k => [k, f.vec[k]])) : defVec()),
        asset: s(f?.asset, 500), desc: s(f?.desc), impact: s(f?.impact), repro: s(f?.repro), fix: s(f?.fix), refs: s(f?.refs, 2000) });
    });
    return out;
  }
  const load = () => { const d = store.get(KEY, null); return d ? sanitize(d) : blank(); };
  const demo = () => {
    const d = blank(), t = n => TEMPLATES.find(x => x.name.startsWith(n));
    Object.assign(d.meta, { title: "Web-Applikationstest Online-Shop", client: "Muster GmbH (fiktives Beispiel)", period: "01.–05. Juni 2026", scope: "- https://shop.example.test (Webshop, Testumgebung)\n- https://api.example.test (REST-API)\nNicht im Scope: Produktivsysteme, Social Engineering, DoS-Tests.", summary: "Alle Angaben in diesem Bericht sind fiktive Beispieldaten zur Demonstration des Generators." });
    const mk = (n, over) => { const x = t(n); return { id: uid(), title: x.name, vec: V(x.vec), asset: "", desc: x.desc, impact: x.impact, repro: x.repro, fix: x.fix, refs: x.refs, ...over }; };
    d.findings.push(
      mk("SQL-Injection", { asset: "https://shop.example.test/login (Parameter: user)", repro: "1. Im Feld „user“ der Anmeldung ein einfaches Anführungszeichen (') senden.\n2. Die Anwendung antwortet mit einer SQL-Fehlermeldung.\n3. Mit ' OR '1'='1 -- wird die Anmeldung ohne gültiges Passwort umgangen." }),
      mk("Gespeichertes", { asset: "https://shop.example.test/product/42 (Bewertungsfunktion)", repro: "1. Als angemeldeter Nutzer eine Produktbewertung mit einer Test-Payload speichern.\n2. Die Produktseite als anderer Nutzer aufrufen.\n3. Die Payload wird im Browser ausgeführt." }),
      mk("Fehlende Security-Header", { asset: "https://shop.example.test", repro: "1. Antwortheader mit curl -I abrufen.\n2. Es fehlen: Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options." }),
    );
    return d;
  };

  /* ---------- Rendering (HTML / Markdown) ---------- */
  const sorted = d => d.findings.map(f => ({ f, c: cvss(f.vec) })).sort((a, b) => b.c.score - a.c.score || a.f.title.localeCompare(b.f.title));
  const counts = d => { const c = { critical: 0, high: 0, medium: 0, low: 0, info: 0 }; d.findings.forEach(f => { c[cvss(f.vec).sev]++; }); return c; };
  const overall = c => (c.critical ? "critical" : c.high ? "high" : c.medium ? "medium" : c.low ? "low" : c.info ? "info" : null);
  const autoSummary = d => {
    const c = counts(d), n = d.findings.length;
    if (!n) return "Im Rahmen des Tests wurden keine Schwachstellen dokumentiert.";
    const parts = Object.keys(SEV).filter(k => c[k]).map(k => `${c[k]} × ${SEV[k].de.toLowerCase()}`);
    return `Im Rahmen des Tests „${d.meta.title}“${d.meta.client ? " für " + d.meta.client : ""} wurden ${n} Schwachstelle${n === 1 ? "" : "n"} dokumentiert (${parts.join(", ")}). Das Gesamtrisiko wird mit „${SEV[overall(c)].de}“ bewertet. Die Bewertung erfolgt nach CVSS 3.1; Details und Maßnahmen finden sich in den einzelnen Findings.`;
  };
  const dateDe = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ""); return m ? `${m[3]}.${m[2]}.${m[1]}` : iso || ""; };
  const paras = t => {              // Text → Absätze/Listen (alles escaped)
    const lines = (t || "").split(/\r?\n/); let out = "", list = [], para = [];
    const flushP = () => { if (para.length) { out += `<p>${para.map(esc).join("<br>")}</p>`; para = []; } };
    const flushL = () => { if (list.length) { out += `<ul>${list.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`; list = []; } };
    lines.forEach(l => { if (/^\s*[-•*]\s+/.test(l)) { flushP(); list.push(l.replace(/^\s*[-•*]\s+/, "")); } else if (!l.trim()) { flushP(); flushL(); } else { flushL(); para.push(l); } });
    flushP(); flushL();
    return out || `<p class="rpt-none">–</p>`;
  };
  const chart = c => {
    const keys = Object.keys(SEV), max = Math.max(1, ...keys.map(k => c[k]));
    return `<svg class="rpt-chart" viewBox="0 0 360 ${keys.length * 26 + 6}" role="img" aria-label="Findings nach Schweregrad">${keys.map((k, i) => `<text x="0" y="${i * 26 + 17}" font-size="12" fill="#333">${esc(SEV[k].de)}</text><rect x="90" y="${i * 26 + 4}" width="${Math.max(2, c[k] / max * 220)}" height="18" rx="3" fill="${SEV[k].col}"/><text x="${96 + c[k] / max * 220}" y="${i * 26 + 17}" font-size="12" fill="#333">${c[k]}</text>`).join("")}</svg>`;
  };
  const badge = c => `<span class="rpt-sev" style="background:${SEV[c.sev].col}">${esc(SEV[c.sev].de)} · ${c.score.toFixed(1)}</span>`;
  function renderHtml(d) {
    const m = d.meta, list = sorted(d), c = counts(d), ov = overall(c);
    const metaRows = [["Kunde", m.client], ["Erstellt von", m.tester], ["Datum", dateDe(m.date)], ["Testzeitraum", m.period], ["Version", m.version]].filter(r => r[1]);
    return `<article class="rpt">
      <header class="rpt-cover"><div class="rpt-conf">${esc((m.conf || "Vertraulich").toUpperCase())}</div><h1>${esc(m.title)}</h1><div class="rpt-sub">Penetrationstest-Bericht</div>
        <table class="rpt-meta">${metaRows.map(([k, v]) => `<tr><th>${k}</th><td>${esc(v)}</td></tr>`).join("")}</table></header>
      <section><h2>1 Management Summary</h2><p>${esc(autoSummary(d))}</p>${m.summary ? paras(m.summary) : ""}
        <div class="rpt-sumrow">${chart(c)}<div class="rpt-risk">${ov ? `<div class="rpt-risk-l">Gesamtrisiko</div><div class="rpt-risk-v" style="color:${SEV[ov].col}">${esc(SEV[ov].de)}</div>` : ""}</div></div></section>
      <section><h2>2 Scope &amp; Methodik</h2><h3>Scope</h3>${paras(m.scope)}<h3>Methodik</h3>${paras(m.method)}</section>
      <section><h2>3 Übersicht der Findings</h2>${list.length ? `<table class="rpt-tbl"><tr><th>ID</th><th>Titel</th><th>Schweregrad</th><th>Betroffen</th></tr>${list.map(({ f, c: cv }, i) => `<tr><td>F-${String(i + 1).padStart(2, "0")}</td><td>${esc(f.title)}</td><td>${badge(cv)}</td><td>${esc(f.asset) || "–"}</td></tr>`).join("")}</table>` : `<p class="rpt-none">Keine Findings.</p>`}</section>
      <section><h2>4 Findings im Detail</h2>${list.map(({ f, c: cv }, i) => `<div class="rpt-f"><h3>F-${String(i + 1).padStart(2, "0")} ${esc(f.title)} ${badge(cv)}</h3>
        <div class="rpt-vec">${esc(cv.vector)}</div>${f.asset ? `<p><b>Betroffen:</b> ${esc(f.asset)}</p>` : ""}
        <h4>Beschreibung</h4>${paras(f.desc)}<h4>Auswirkung</h4>${paras(f.impact)}<h4>Nachvollziehen</h4>${paras(f.repro)}<h4>Empfehlung</h4>${paras(f.fix)}${f.refs ? `<h4>Referenzen</h4>${paras(f.refs)}` : ""}</div>`).join("") || `<p class="rpt-none">Keine Findings.</p>`}</section>
      <section><h2>5 Anhang</h2><h3>Bewertungsskala (CVSS 3.1)</h3><table class="rpt-tbl"><tr><th>Schweregrad</th><th>CVSS-Score</th></tr>
        ${[["critical", "9,0 – 10,0"], ["high", "7,0 – 8,9"], ["medium", "4,0 – 6,9"], ["low", "0,1 – 3,9"], ["info", "0,0"]].map(([k, r]) => `<tr><td><span class="rpt-sev" style="background:${SEV[k].col}">${SEV[k].de}</span></td><td>${r}</td></tr>`).join("")}</table>
        <p class="rpt-small">Hinweis: Dieser Bericht gibt den Stand zum Testzeitpunkt wieder und stellt keine Garantie für die Abwesenheit weiterer Schwachstellen dar. Die Tests erfolgten ausschließlich im vereinbarten Scope.</p></section></article>`;
  }
  const mdCell = t => String(t || "–").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
  function renderMd(d) {
    const m = d.meta, list = sorted(d), c = counts(d), ov = overall(c), L = [];
    L.push(`# ${m.title}`, "", `**${(m.conf || "Vertraulich").toUpperCase()}**`, "");
    [["Kunde", m.client], ["Erstellt von", m.tester], ["Datum", dateDe(m.date)], ["Testzeitraum", m.period], ["Version", m.version]].filter(r => r[1]).forEach(([k, v]) => L.push(`- **${k}:** ${v}`));
    L.push("", "## 1 Management Summary", "", autoSummary(d), ""); if (m.summary) L.push(m.summary, "");
    if (ov) L.push(`**Gesamtrisiko:** ${SEV[ov].de}`, "");
    L.push("| Schweregrad | Anzahl |", "|---|---|", ...Object.keys(SEV).map(k => `| ${SEV[k].de} | ${c[k]} |`), "");
    L.push("## 2 Scope & Methodik", "", "### Scope", "", m.scope || "–", "", "### Methodik", "", m.method || "–", "");
    L.push("## 3 Übersicht der Findings", "");
    if (list.length) L.push("| ID | Titel | Schweregrad | Betroffen |", "|---|---|---|---|", ...list.map(({ f, c: cv }, i) => `| F-${String(i + 1).padStart(2, "0")} | ${mdCell(f.title)} | ${SEV[cv.sev].de} (${cv.score.toFixed(1)}) | ${mdCell(f.asset)} |`)); else L.push("Keine Findings.");
    L.push("", "## 4 Findings im Detail", "");
    list.forEach(({ f, c: cv }, i) => {
      L.push(`### F-${String(i + 1).padStart(2, "0")} ${f.title}`, "", `**Schweregrad:** ${SEV[cv.sev].de} (${cv.score.toFixed(1)}) · \`${cv.vector}\``, ""); if (f.asset) L.push(`**Betroffen:** ${f.asset}`, "");
      L.push("**Beschreibung**", "", f.desc || "–", "", "**Auswirkung**", "", f.impact || "–", "", "**Nachvollziehen**", "", f.repro || "–", "", "**Empfehlung**", "", f.fix || "–", ""); if (f.refs) L.push("**Referenzen**", "", f.refs, "");
    });
    L.push("## 5 Anhang", "", "Bewertung nach CVSS 3.1: Kritisch 9,0–10,0 · Hoch 7,0–8,9 · Mittel 4,0–6,9 · Niedrig 0,1–3,9 · Informativ 0,0.", "", "*Dieser Bericht gibt den Stand zum Testzeitpunkt wieder und stellt keine Garantie für die Abwesenheit weiterer Schwachstellen dar.*", "");
    return L.join("\n");
  }

  const RPT_CSS = `.rpt{font:14px/1.6 "Segoe UI",Arial,sans-serif;color:#1b1f2a;background:#fff;padding:36px 40px;max-width:820px;margin:0 auto;text-align:left}
.rpt h1{font-size:30px;margin:6px 0;color:#0b3a5b}.rpt h2{font-size:20px;color:#0b3a5b;border-bottom:2px solid #0b3a5b;padding-bottom:4px;margin:34px 0 12px}.rpt h3{font-size:16px;margin:18px 0 6px;color:#0b3a5b}.rpt h4{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#566;margin:14px 0 4px}
.rpt p{margin:6px 0}.rpt ul{margin:6px 0 6px 22px;padding:0}.rpt-cover{border-left:6px solid #0b3a5b;padding:6px 0 6px 20px;margin-bottom:10px}.rpt-conf{font-size:12px;letter-spacing:.2em;color:#b71c1c;font-weight:700}
.rpt-sub{color:#566;margin-bottom:14px}.rpt-meta th{text-align:left;color:#566;font-weight:500;padding:2px 24px 2px 0}.rpt-tbl{width:100%;border-collapse:collapse;margin:8px 0}.rpt-tbl th,.rpt-tbl td{border:1px solid #cfd6df;padding:6px 8px;text-align:left;vertical-align:top;font-size:13px}.rpt-tbl th{background:#eef2f6}
.rpt-sev{display:inline-block;color:#fff;font-size:12px;font-weight:600;padding:1px 9px;border-radius:99px;vertical-align:middle;white-space:nowrap}.rpt-vec{font:12px Consolas,monospace;color:#566;margin:2px 0 6px}.rpt-f{margin:20px 0;padding:14px 18px;border:1px solid #cfd6df;border-radius:8px}
.rpt-sumrow{display:flex;gap:30px;align-items:center;flex-wrap:wrap;margin-top:12px}.rpt-chart{width:360px;max-width:100%}.rpt-risk-l{font-size:12px;color:#566;text-transform:uppercase;letter-spacing:.1em}.rpt-risk-v{font-size:30px;font-weight:700}.rpt-none{color:#889}.rpt-small{font-size:12px;color:#566}
@media print{.rpt{padding:0;max-width:none}.rpt-f{break-inside:avoid}.rpt h2,.rpt h3,.rpt h4{break-after:avoid}.rpt-cover{break-after:page}}`;
  const ensureCss = () => { if (!document.getElementById("rpt-css")) { const st = document.createElement("style"); st.id = "rpt-css"; st.textContent = RPT_CSS; document.head.append(st); } };
  const htmlDoc = d => `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(d.meta.title)}</title><style>body{margin:0;background:#e9edf2}${RPT_CSS}</style></head><body>${renderHtml(d)}</body></html>`;
  const download = (name, mime, text) => {
    const a = document.createElement("a"), url = URL.createObjectURL(new Blob([text], { type: mime }));
    a.href = url; a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 3000);
  };
  const slug = t => (t || "bericht").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "bericht";

  window.REPORT_LIB = { cvss, parseVec, TEMPLATES, renderMd, renderHtml, sanitize };

  /* ---------- App ---------- */
  A.report = {
    title: "Pentest Report", icon: "📝", group: "Security Lab", w: 940, h: 680,
    render(body) {
      ensureCss();
      let doc = load(), tab = "projekt", sel = null, timer = 0;
      const save = () => { clearTimeout(timer); timer = setTimeout(() => store.set(KEY, doc), 350); };
      const F = id => doc.findings.find(f => f.id === id);
      const fld = (k, label, type = "text") => `<label class="rp-l">${label}<input class="field" data-m="${k}" type="${type}" value="${esc(doc.meta[k] || "")}" spellcheck="false"></label>`;
      const area = (k, label, rows = 3) => `<label class="rp-l">${label}<textarea class="field" data-m="${k}" rows="${rows}" spellcheck="false">${esc(doc.meta[k] || "")}</textarea></label>`;

      const drawProjekt = () => {
        body.querySelector(".rp-view").innerHTML = `<div class="rp-grid">${fld("title", "Titel")}${fld("client", "Kunde")}${fld("tester", "Erstellt von")}${fld("date", "Datum", "date")}${fld("period", "Testzeitraum")}${fld("version", "Version")}
          <label class="rp-l">Vertraulichkeit<select class="field" data-m="conf">${["Vertraulich", "Streng vertraulich", "Intern", "Öffentlich"].map(o => `<option ${doc.meta.conf === o ? "selected" : ""}>${o}</option>`).join("")}</select></label></div>
          ${area("scope", "Scope (Listen mit „- “ beginnen)", 4)}${area("method", "Methodik", 3)}${area("summary", "Eigene Ergänzung zur Management Summary (optional – die Zahlen werden automatisch erzeugt)", 3)}
          <div class="opbar" style="margin-top:12px"><button class="btn" id="rdemo">🧪 Beispielbericht laden</button><button class="btn" id="rnew">🗋 Neuer Bericht</button><button class="btn" id="rjson">⬇ JSON sichern</button><button class="btn" id="rload">⬆ JSON laden</button><input type="file" id="rfile" accept="application/json,.json" hidden></div>
          <div class="dim" style="margin-top:8px;font-size:12px">Autosave im Browser. Nichts wird hochgeladen. Vorlagentexte sind Beispiele – vor der Nutzung beim Kunden fachlich prüfen.</div><div id="rmsg" style="min-height:20px;margin-top:6px"></div>`;
      };
      const listHtml = () => doc.findings.map(f => { const c = cvss(f.vec); return `<button class="rp-item ${f.id === sel ? "on" : ""}" data-sel="${esc(f.id)}"><span class="rpt-sev" style="background:${SEV[c.sev].col}">${c.score.toFixed(1)}</span><span class="rp-t">${esc(f.title)}</span></button>`; }).join("") || `<div class="dim" style="padding:10px">Noch keine Findings. Füge eines hinzu oder wähle eine Vorlage.</div>`;
      const drawFindings = () => {
        const f = sel && F(sel);
        body.querySelector(".rp-view").innerHTML = `<div class="rp-split"><div class="rp-side"><div class="opbar"><button class="btn" id="fadd">＋ Neu</button>
          <select class="field" id="ftpl" style="margin:0;width:auto;flex:1" aria-label="Vorlage"><option value="">Vorlage einfügen …</option>${TEMPLATES.map((t, i) => `<option value="${i}">${esc(t.name)}</option>`).join("")}</select></div><div class="rp-list" id="flist">${listHtml()}</div></div>
          <div class="rp-edit" id="fedit">${f ? editor(f) : `<div class="dim" style="padding:20px">Wähle links ein Finding oder lege ein neues an.</div>`}</div></div>`;
        if (f) wireEditor(f);
      };
      const editor = f => {
        const c = cvss(f.vec);
        return `<label class="rp-l">Titel<input class="field" data-f="title" value="${esc(f.title)}"></label><label class="rp-l">Betroffenes System / URL<input class="field" data-f="asset" value="${esc(f.asset)}" spellcheck="false"></label>
          <div class="rp-cvss"><div class="rp-cv-h"><b>CVSS 3.1</b><span id="rscore" class="rpt-sev" style="background:${SEV[c.sev].col}">${c.score.toFixed(1)} · ${SEV[c.sev].de}</span></div>
          <div class="rp-cv-g">${ORDER.map(k => `<label>${LABELS[k][0]}<select class="field" data-v="${k}">${Object.entries(LABELS[k][1]).map(([val, n]) => `<option value="${val}" ${f.vec[k] === val ? "selected" : ""}>${n}</option>`).join("")}</select></label>`).join("")}</div>
          <input class="field" id="rvec" value="${esc(c.vector)}" spellcheck="false" aria-label="CVSS-Vektor" style="font-family:var(--mono);font-size:12px;margin-bottom:0"></div>
          ${[["desc", "Beschreibung"], ["impact", "Auswirkung"], ["repro", "Nachvollziehen (Schritte)"], ["fix", "Empfehlung (Listen mit „- “)"], ["refs", "Referenzen (CWE, OWASP …)"]].map(([k, l]) => `<label class="rp-l">${l}<textarea class="field" data-f="${k}" rows="${k === "refs" ? 2 : 4}" spellcheck="false">${esc(f[k])}</textarea></label>`).join("")}
          <div class="opbar"><button class="btn" id="fdup">⧉ Duplizieren</button><button class="btn" id="fdel">🗑 Löschen</button></div>`;
      };
      const wireEditor = f => {
        const ed = $("#fedit", body);
        ed.oninput = e => {
          const t = e.target;
          if (t.dataset.f) { f[t.dataset.f] = t.value; if (t.dataset.f === "title") refreshList(); save(); }
          else if (t.dataset.v) { f.vec[t.dataset.v] = t.value; refreshCvss(f); save(); }
          else if (t.id === "rvec") { const p = parseVec(t.value); if (p) { f.vec = p; ed.querySelectorAll("[data-v]").forEach(s2 => { s2.value = p[s2.dataset.v]; }); refreshCvss(f, true); save(); } }
        };
        $("#fdup", body).onclick = () => { const n = { ...f, id: uid(), vec: { ...f.vec }, title: f.title + " (Kopie)" }; doc.findings.push(n); sel = n.id; save(); sfx("pop"); drawFindings(); };
        const del = $("#fdel", body);
        del.onclick = () => { if (!del.dataset.sure) { del.dataset.sure = 1; del.textContent = "Wirklich löschen?"; return; } doc.findings = doc.findings.filter(x => x.id !== f.id); sel = null; save(); sfx("close"); drawFindings(); };
      };
      const refreshList = () => { const l = $("#flist", body); if (l) l.innerHTML = listHtml(); };
      const refreshCvss = (f, keepVec) => {
        const c = cvss(f.vec), sc = $("#rscore", body); sc.style.background = SEV[c.sev].col; sc.textContent = `${c.score.toFixed(1)} · ${SEV[c.sev].de}`;
        if (!keepVec) $("#rvec", body).value = c.vector; refreshList();
      };
      const drawBericht = () => {
        const warn = /\[[A-ZÄÖÜ][A-ZÄÖÜ_ /-]{2,}\]/.test(JSON.stringify(doc));
        body.querySelector(".rp-view").innerHTML = `<div class="opbar"><button class="btn" id="emd">⬇ Markdown</button><button class="btn" id="ehtml">⬇ HTML</button><button class="btn" id="epdf">🖨 Drucken / PDF</button><button class="btn" id="ecopy">📋 Markdown kopieren</button></div>
          ${warn ? `<div class="rp-warn">⚠ Es sind noch Platzhalter in eckigen Klammern (z. B. [PARAMETER]) vorhanden – bitte ersetzen.</div>` : ""}
          <div class="rp-page">${renderHtml(doc)}</div>`;
        const base = slug(doc.meta.title);
        $("#emd", body).onclick = () => { download(base + ".md", "text/markdown;charset=utf-8", renderMd(doc)); achieve("report"); sfx("success"); };
        $("#ehtml", body).onclick = () => { download(base + ".html", "text/html;charset=utf-8", htmlDoc(doc)); achieve("report"); sfx("success"); };
        $("#ecopy", body).onclick = () => { navigator.clipboard?.writeText(renderMd(doc)).then(() => { toast("📋 Markdown kopiert."); achieve("report"); }).catch(() => toast("Kopieren vom Browser blockiert.")); };
        $("#epdf", body).onclick = () => {
          let r = document.getElementById("printroot"); if (!r) { r = document.createElement("div"); r.id = "printroot"; document.body.append(r); }
          r.innerHTML = renderHtml(doc); achieve("report");
          const t = document.title; document.title = base; window.print(); document.title = t; setTimeout(() => { r.innerHTML = ""; }, 1500);
        };
      };
      const draw = () => {
        body.innerHTML = `<div class="pad rp"><div class="tabs">${[["projekt", "Projekt"], ["findings", `Findings (${doc.findings.length})`], ["bericht", "Bericht"]].map(([k, t]) => `<button class="tab ${k === tab ? "on" : ""}" data-tab="${k}">${t}</button>`).join("")}</div><div class="rp-view"></div></div>`;
        body.querySelectorAll("[data-tab]").forEach(b => { b.onclick = () => { tab = b.dataset.tab; sfx("menu"); draw(); }; });
        ({ projekt: drawProjekt, findings: drawFindings, bericht: drawBericht })[tab]();
        const v = $(".rp-view", body);
        v.oninput = e => { const k = e.target.dataset?.m; if (k) { doc.meta[k] = e.target.value; save(); } };
        v.onchange = v.oninput;
        const msg = t => { const m = $("#rmsg", body); if (m) m.textContent = t; };
        const bind = (id, fn) => { const el_ = $(id, body); if (el_) el_.onclick = fn; };
        bind("#rdemo", () => { doc = demo(); save(); sfx("success"); toast("🧪 Beispielbericht geladen (fiktive Daten)."); draw(); });
        bind("#rnew", function () { if (!this.dataset.sure) { this.dataset.sure = 1; this.textContent = "Wirklich neu beginnen?"; return; } doc = blank(); sel = null; save(); sfx("close"); draw(); });
        bind("#rjson", () => { download(slug(doc.meta.title) + ".json", "application/json", JSON.stringify({ meta: doc.meta, findings: doc.findings.map(f => ({ ...f, vector: cvss(f.vec).vector })) }, null, 2)); sfx("success"); });
        bind("#rload", () => $("#rfile", body).click());
        const file = $("#rfile", body);
        if (file) file.onchange = () => {
          const fl = file.files[0]; if (!fl) return;
          if (fl.size > 2e6) { msg("Datei zu groß (max. 2 MB)."); return; }
          const r = new FileReader();
          r.onload = () => { try { doc = sanitize(JSON.parse(String(r.result))); sel = null; save(); sfx("success"); msg(`✔ ${doc.findings.length} Finding(s) geladen.`); } catch { sfx("error"); msg("Ungültige JSON-Datei."); } };
          r.readAsText(fl);
        };
        if (tab === "findings") {
          bind("#fadd", () => { const n = { id: uid(), title: "Neues Finding", vec: defVec(), asset: "", desc: "", impact: "", repro: "", fix: "", refs: "" }; doc.findings.push(n); sel = n.id; save(); sfx("pop"); draw(); });
          $("#ftpl", body).onchange = e => {
            const t = TEMPLATES[+e.target.value]; if (!t) return;
            const n = { id: uid(), title: t.name, vec: V(t.vec), asset: "", desc: t.desc, impact: t.impact, repro: t.repro, fix: t.fix, refs: t.refs };
            doc.findings.push(n); sel = n.id; save(); sfx("pop"); draw();
          };
          $("#flist", body).onclick = e => { const b = e.target.closest("[data-sel]"); if (b) { sel = b.dataset.sel; sfx("menu"); draw(); } };
        }
      };
      draw();
      return () => { clearTimeout(timer); store.set(KEY, doc); };
    },
  };
})();
