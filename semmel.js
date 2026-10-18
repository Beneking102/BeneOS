// Troll-Seite für den NFC-Chip "Gratis Leberkässemmel": Der Einlösen-Knopf flüchtet vor dem Finger,
// wird mit der Zeit müde und lässt sich nach genug Versuchen fangen. Alles lokal, nichts wird gesendet.
(() => {
  const $ = id => document.getElementById(id);
  const btn = $("btn");
  const GIVE_UP = 18;
  const TAUNTS = [
    "Hoppla, daneben.", "Zu langsam!", "Fast!", "Nicht so stürmisch.", "Der Knopf ist schüchtern.",
    "Probier's mit beiden Händen.", "Ist das alles?", "Der Leberkäs wird kalt …", "Langsam wird's peinlich.",
    "Deine Oma wär schneller.", "Ich hab Zeit. Du auch?", "Der Knopf wird müde …",
    "Jetzt aber.", "Gleich, gleich …", "Komm schon, du schaffst das!", "Noch ein bisschen …", "Sooo knapp!",
  ];
  let n = 0;

  function dodge(e) {
    if (n >= GIVE_UP) return;
    e.preventDefault();
    n++;
    $("n").textContent = n;
    $("taunt").textContent = TAUNTS[(n - 1) % TAUNTS.length];
    if (navigator.vibrate) navigator.vibrate(25);

    // Neue Position irgendwo im Bildschirm, aber weit genug weg vom Finger.
    const r = btn.getBoundingClientRect(), W = innerWidth, H = innerHeight;
    const px = e.touches ? e.touches[0].clientX : e.clientX, py = e.touches ? e.touches[0].clientY : e.clientY;
    let x, y, tries = 0;
    do {
      x = r.width / 2 + 8 + Math.random() * (W - r.width - 16);
      y = r.height / 2 + 8 + Math.random() * (H - r.height - 16);
    } while (Math.hypot(x - px, y - py) < Math.min(W, H) * 0.35 && ++tries < 30);
    btn.style.left = x + "px";
    btn.style.top = y + "px";

    // Ab der Hälfte wird der Knopf langsamer und kleiner.
    if (n > GIVE_UP / 2) btn.classList.add("tired");
    if (n === 12) btn.textContent = "bitte nicht";
    if (n === 15) { btn.textContent = "na gut …"; btn.style.fontSize = "13px"; btn.style.padding = "10px 16px"; }
    if (n === GIVE_UP) { btn.textContent = "ich geb auf"; $("taunt").textContent = "Er gibt auf. Jetzt drück halt!"; }
  }

  btn.addEventListener("touchstart", dodge, { passive: false });
  btn.addEventListener("mouseenter", dodge);
  btn.addEventListener("click", e => {
    if (n < GIVE_UP) return dodge(e);
    btn.remove();
    $("n2").textContent = n;
    $("final").textContent = `${n} Versuche für eine Semmel. Respekt für die Ausdauer.`;
    document.body.classList.add("won");
    if (navigator.vibrate) navigator.vibrate([80, 60, 80]);
  });
})();
