// "Hack me"-Intro für die NFC-Karte: reine Animation, es wird nichts vom Gerät gelesen oder gesendet,
// außer dem anonymen Besucherzähler (/api/visit).
(() => {
  const log = document.getElementById("log"), prog = document.getElementById("prog");
  const ua = navigator.userAgent;
  const device = (ua.match(/\(([^)]+)\)/) || [, "unbekanntes Gerät"])[1].split(";").slice(0, 2).join(" ").trim();
  const lines = [
    ["> nfc_tap detected", 250],
    ["> handshake mit " + device + " ...", 450],
    ["> scanne offene Ports ........ [OK]", 450],
    ["> umgehe Sperrbildschirm ..... [OK]", 500],
    ["> lade Kontakte ............. [FAKE]", 450],
    ["> sende alle Selfies an Bene ..", 600],
    ["> ABBRUCH: Bene hat nur ein Portfolio gebaut.", 700],
    ["> willkommen 👋", 400],
  ];
  const wait = ms => new Promise(r => setTimeout(r, ms));

  async function counter() {
    const el = document.getElementById("count");
    let day = "";
    try { day = new Date().toDateString(); } catch (e) {}
    let seen = false;
    try { seen = localStorage.getItem("tapDay") === day; } catch (e) {}
    try {
      const res = await fetch("/api/visit", { method: seen ? "GET" : "POST" });
      const { count } = await res.json();
      try { localStorage.setItem("tapDay", day); } catch (e) {}
      el.innerHTML = "Du bist Besucher Nr. <b>" + count + "</b> 🎉";
    } catch (e) { el.textContent = ""; }
  }

  (async () => {
    for (let i = 0; i < lines.length; i++) {
      log.textContent += lines[i][0] + "\n";
      prog.style.width = Math.round(((i + 1) / lines.length) * 100) + "%";
      if (navigator.vibrate && i === 5) navigator.vibrate([80, 40, 80]);
      await wait(lines[i][1]);
    }
    document.getElementById("done").style.display = "block";
    counter();
  })();
})();
