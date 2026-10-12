"use strict";
/* Einheitliches Icon-Set (24×24, Linienstil, Duotone). Die Farben kommen aus --accent / --accent2 und passen sich
   damit automatisch dem Theme des jeweiligen Desktops an. Ersetzt die uneinheitlichen Emoji in der Oberfläche. */
(() => {
  const G = {
    about: `<circle class="fl" cx="12" cy="8.2" r="3.6"/><path d="M4.6 20c.7-4 3.8-6 7.4-6s6.7 2 7.4 6"/>`,
    projects: `<path d="M3 7.6a2 2 0 0 1 2-2h4l2 2.4h8a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path class="a2" d="M10 12.6L8.6 14l1.4 1.4M14 12.6l1.4 1.4-1.4 1.4"/>`,
    terminal: `<rect x="3" y="4.5" width="18" height="15" rx="2.6"/><path d="M7 9.8l3 2.4-3 2.4"/><path class="a2" d="M12.5 15h4.5"/>`,
    snake: `<path d="M5.2 8.2c0-2.3 1.9-3.6 4-3.6h5.6c2 0 3.6 1.1 3.6 3s-1.6 3-3.6 3H9.4c-2.1 0-3.6 1.1-3.6 3.2S7.4 17.8 9.4 17.8h8"/><circle class="fl" cx="18.6" cy="17.8" r="1.4"/>`,
    notes: `<path d="M6 3.5h8.5L18.5 7.5V20a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5z"/><path d="M14.5 3.5v4h4"/><path class="a2" d="M8.5 12h7M8.5 15.5h5"/>`,
    contact: `<rect x="3" y="5.5" width="18" height="13" rx="2.6"/><path class="a2" d="M3.8 7.6L12 13.4l8.2-5.8"/>`,
    cipher: `<rect x="5" y="10.5" width="14" height="9.5" rx="2.4"/><path d="M8.2 10.5V8a3.8 3.8 0 0 1 7.6 0v2.5"/><circle class="fl" cx="12" cy="15.2" r="1.4"/>`,
    passlab: `<circle class="fl" cx="8" cy="12" r="3.6"/><path d="M11.6 12H21M17.6 12v3M20.2 12v2"/>`,
    phish: `<path d="M13 3.5v11.2a4 4 0 0 1-8 0v-1.6"/><path class="a2" d="M3 14.8l2-2 2 2"/><circle class="fl" cx="13" cy="3.5" r="1.1"/>`,
    ctf: `<path d="M6 21V4"/><path class="fl" d="M6 4.6h11.5l-2.4 3.7 2.4 3.7H6"/>`,
    settings: `<circle class="fl" cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="6.3"/><path d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7"/>`,
    certs: `<circle cx="12" cy="9.2" r="5.2"/><path d="M8.6 13.4L7.4 21l4.6-2.6 4.6 2.6-1.2-7.6"/><path class="a2" d="M12 6.8v4.8M9.6 9.2h4.8"/>`,
    hashbreak: `<rect x="5" y="10.5" width="14" height="9.5" rx="2.4"/><path d="M8.2 10.5V8a3.8 3.8 0 0 1 7.3-1.5"/><circle class="fl" cx="12" cy="15.2" r="1.4"/>`,
    loghunter: `<circle cx="10.5" cy="10.5" r="5.7"/><path d="M14.8 14.8L20 20"/><path class="a2" d="M7.8 9.4h5.4M7.8 12h3.2"/>`,
    defender: `<rect x="3.5" y="5" width="17" height="14" rx="1.8"/><path d="M3.5 9.7h17M3.5 14.3h17"/><path class="a2" d="M9 5v4.7M15 9.7v4.6M9 14.3V19"/>`,
    calc: `<rect x="5" y="3.5" width="14" height="17" rx="2.4"/><rect class="fl" x="7.5" y="6" width="9" height="3.6" rx=".9"/><path class="a2" d="M8 13h.01M12 13h.01M16 13h.01M8 16.8h.01M12 16.8h.01M16 16.8h.01" stroke-width="2.6"/>`,
    paint: `<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.4 0 2-.9 2-1.8 0-1.4-1.2-1.6-1.2-2.8 0-1 .8-1.6 1.9-1.6H17a3.5 3.5 0 0 0 3.5-3.4C20.5 6.7 16.8 3.5 12 3.5z"/><circle class="fl" cx="8" cy="10.2" r="1"/><circle class="fl" cx="12" cy="7.6" r="1"/><circle class="fl" cx="16" cy="10.2" r="1"/>`,
    mines: `<circle cx="11" cy="13.5" r="6"/><path d="M15.4 9.1L18 6.5M16.5 4.6l2.9 2.9"/><path class="a2" d="M8.4 12a3 3 0 0 1 2-1.4"/>`,
    tetris: `<rect x="4" y="4" width="7" height="7" rx="1.3"/><rect class="fl" x="13" y="4" width="7" height="7" rx="1.3"/><rect class="a2" x="4" y="13" width="7" height="7" rx="1.3"/><rect x="13" y="13" width="7" height="7" rx="1.3"/>`,
    typing: `<rect x="2.8" y="6.5" width="18.4" height="11" rx="2.4"/><path d="M6.6 10h.01M10.2 10h.01M13.8 10h.01M17.4 10h.01M6.6 13.6h.01M17.4 13.6h.01" stroke-width="2.3"/><path class="a2" d="M9.6 14h4.8"/>`,
    toolbox: `<rect x="3.5" y="8" width="17" height="11.5" rx="2.4"/><path d="M9 8V6.4a1.8 1.8 0 0 1 1.8-1.8h2.4A1.8 1.8 0 0 1 15 6.4V8"/><path class="a2" d="M3.5 13h17"/><rect class="fl" x="10.5" y="11.4" width="3" height="3.2" rx=".7"/>`,
    dnslab: `<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path class="a2" d="M12 3.5c2.6 2.4 3.8 5.2 3.8 8.5s-1.2 6.1-3.8 8.5c-2.6-2.4-3.8-5.2-3.8-8.5S9.4 5.9 12 3.5z"/>`,
    vault: `<rect x="3.5" y="5" width="17" height="14" rx="2.4"/><circle class="fl" cx="12" cy="12" r="3.2"/><path class="a2" d="M12 8.6v-.01M15.4 12h.01M12 15.4v.01M8.6 12h-.01" stroke-width="2"/>`,
    globe: `<circle cx="12" cy="12" r="6.2"/><path class="a2" d="M3 15.5c3.2-6.4 14.6-9.4 18-3.6"/><path d="M12 5.8v12.4M5.8 12h12.4" opacity=".55"/>`,
    sysmon: `<rect x="3.5" y="4" width="17" height="16" rx="2.4"/><path class="a2" d="M7 15l3-4 3 2.6L17 8.5"/><path d="M7 17.6h10" opacity=".55"/>`,
    radio: `<rect x="3.5" y="8" width="17" height="11.5" rx="2.4"/><path d="M7 8l9.8-3.6"/><circle class="fl" cx="15.6" cy="13.8" r="2.7"/><path class="a2" d="M6.8 12.2h4M6.8 15.4h4"/>`,
    bot: `<rect x="5" y="8" width="14" height="11.5" rx="3.2"/><path d="M12 8V5.3"/><circle class="fl" cx="12" cy="4.2" r="1.2"/><circle class="fl" cx="9.3" cy="13.2" r="1.15"/><circle class="fl" cx="14.7" cy="13.2" r="1.15"/><path d="M9.5 16.4h5"/>`,
    achievements: `<path d="M8 4.5h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5.6a1 1 0 0 0-1 1c0 2 1.5 3.5 3.4 3.5M16 6h2.4a1 1 0 0 1 1 1c0 2-1.5 3.5-3.4 3.5"/><path class="a2" d="M12 13.5V17M8.6 19.5h6.8M9.6 17h4.8"/>`,
    files: `<path d="M4 6.6A1.6 1.6 0 0 1 5.6 5h4l1.6 2h7.2A1.6 1.6 0 0 1 20 8.6v8.8a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 17.4z"/><path class="a2" d="M4 10.6h16"/>`,
    sysinfo: `<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.6"/><circle class="fl" cx="12" cy="7.9" r=".7"/>`,
    report: `<path d="M6 3.5h8.5L19 8v12.5H6z"/><path d="M14.5 3.5V8H19"/><path class="a2" d="M9 17.4v-3M12 17.4v-5M15 17.4v-2"/>`,
    /* Repo-Kategorien */
    shield: `<path d="M12 3l7 2.8v5.4c0 4.4-3 7.8-7 9.8-4-2-7-5.4-7-9.8V5.8z"/><path class="a2" d="M9 11.8l2.2 2.2 3.8-4"/>`,
    cube: `<path d="M12 3.5l7.5 4.2v8.6L12 20.5l-7.5-4.2V7.7z"/><path class="a2" d="M4.5 7.7L12 12l7.5-4.3M12 12v8.5"/>`,
    scroll: `<path d="M7 4.5h10a2 2 0 0 1 2 2V17a2.5 2.5 0 0 1-2.5 2.5H7"/><path d="M7 4.5a2 2 0 0 0-2 2V8h4V6.5a2 2 0 0 0-2-2z"/><path d="M7 19.5a2 2 0 0 1-2-2V16h4v1.5a2 2 0 0 1-2 2z"/><path class="a2" d="M11 9h5M11 12h5"/>`,
    gamepad: `<rect x="3" y="7.5" width="18" height="10" rx="4.8"/><path d="M8 10.4v4M6 12.4h4"/><circle class="fl" cx="15.4" cy="11.6" r=".9"/><circle class="fl" cx="17.6" cy="13.6" r=".9"/>`,
    phone: `<rect x="7" y="3" width="10" height="18" rx="2.6"/><path class="a2" d="M10.5 18h3"/>`,
    diamond: `<path d="M12 3.5l7 8.5-7 8.5-7-8.5z"/><path class="a2" d="M5 12h14"/>`,
    box: `<path d="M3.5 8L12 4l8.5 4v8L12 20l-8.5-4z"/><path class="a2" d="M3.5 8L12 12l8.5-4M12 12v8"/>`,
    web: `<circle cx="12" cy="12" r="8.5"/><path class="a2" d="M3.5 12h17M12 3.5c2.6 2.4 3.8 5.2 3.8 8.5s-1.2 6.1-3.8 8.5c-2.6-2.4-3.8-5.2-3.8-8.5S9.4 5.9 12 3.5z"/>`,
    /* Taskleiste */
    bell: `<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path class="a2" d="M10 20.5a2 2 0 0 0 4 0"/>`,
    sliders: `<path d="M4 7h9M19 7h1M4 12h3M13 12h7M4 17h10M20 17h0"/><circle class="fl" cx="16" cy="7" r="2"/><circle class="fl" cx="10" cy="12" r="2"/><circle class="fl" cx="17" cy="17" r="2"/>`,
    overview: `<rect x="4" y="4" width="7" height="7" rx="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.6"/><rect x="4" y="13" width="7" height="7" rx="1.6"/><rect class="fl" x="13" y="13" width="7" height="7" rx="1.6"/>`,
  };
  const APP_KEY = { about: "about", projects: "projects", terminal: "terminal", snake: "snake", notes: "notes", contact: "contact", cipher: "cipher", passlab: "passlab", phish: "phish", ctf: "ctf", settings: "settings",
    certs: "certs", hashbreak: "hashbreak", loghunter: "loghunter", defender: "defender", calc: "calc", paint: "paint", mines: "mines", tetris: "tetris", typing: "typing", toolbox: "toolbox",
    dnslab: "dnslab", vault: "vault", globe: "globe", sysmon: "sysmon", radio: "radio", bot: "bot", achievements: "achievements", files: "files", sysinfo: "sysinfo", report: "report" };
  const EMOJI_KEY = { "🛡️": "shield", "🛡": "shield", "🧊": "cube", "📜": "scroll", "🎨": "paint", "🌐": "web", "🎮": "gamepad", "📱": "phone", "💠": "diamond", "📦": "box" };
  const svg = key => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${G[key] || G.box}</svg>`;
  window.ICONS = G;
  window.iconSvg = svg;
  window.iconByEmoji = e => svg(EMOJI_KEY[e] || "box");
  window.iconHTML = id => {
    if (APP_KEY[id]) return svg(APP_KEY[id]);
    if (typeof id === "string" && id.startsWith("repo:") && typeof APPS !== "undefined" && APPS[id]) return svg(EMOJI_KEY[APPS[id].icon] || "box");
    return svg("box");
  };
})();
