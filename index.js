// ===================== GLOBALER ZUSTAND =====================
// Startguthaben des Spielers (in Dollar)
let wallet = 1000;

// Liste aller verfügbaren Spiele
const GAMES = ['blackjack','horses'];

// Mögliche Beträge, die man sich hinzufügen kann (entspricht den Button-Optionen)
const AMOUNTS = [100, 250, 500, 1000, 5000, 10000];
// Die gleichen Beträge als lesbaren Text für die Buttons
const AMOUNT_LABELS = ['$100','$250','$500','$1,000','$5,000','$10,000'];

// Aktuelle Gewinnsträhne (wie viele Spiele hintereinander gewonnen) pro Spiel
// Wird bei einer Niederlage auf 0 zurückgesetzt
let streaks   = { blackjack:0, horses:0 };

// Bisher beste Gewinnsträhne (wird nie zurückgesetzt) pro Spiel
let highscores = { blackjack:0, horses:0 };

// Zählt, wie viele Spiele schon einmal eine Strähne von 5+ erreicht haben
let gamesCleared = 0;

// Wie viele Geld-Hinzufügen-Optionen bereits freigeschaltet sind (max. 6)
let unlockedOptions = 0;

// Wird true, sobald der Spieler seinen ersten Sieg erzielt hat
let addMoneyUnlocked = false;

// Zahl mit Dollar-Zeichen und Tausenderpunkt formatieren, z.B. 1000 → "$1,000"
function formatMoney(n) { return '$' + n.toLocaleString('en-US'); }

// Geldbeutel um einen Betrag erhöhen (oder verringern bei negativem Wert)
// und die Anzeige im UI aktualisieren
function updateWallet(amount) {
  wallet += amount;
  if (wallet < 0) wallet = 0; // Guthaben kann nicht negativ werden
  document.getElementById('wallet-display').textContent = formatMoney(wallet);
}


// ---- Strähne & Highscore-Logik ----

// Wird nach jedem Gewinn aufgerufen
function recordWin(game) {
  streaks[game]++; // Aktuelle Strähne um 1 erhöhen
  const s = streaks[game];

  // Wenn neue Strähne höher als bisheriger Rekord → Rekord aktualisieren
  if (s > highscores[game]) highscores[game] = s;

  // Beim allerersten Sieg überhaupt: "Geld hinzufügen"-Knopf freischalten
  if (!addMoneyUnlocked) {
    addMoneyUnlocked = true;
    document.getElementById('modal-subtitle').textContent = 'Unlock more options by reaching streaks of 5!';
    const btn = document.querySelector('.add-money-btn');
    btn.classList.remove('locked-btn'); // Schloss-Aussehen entfernen
    showUnlockNotif(false, '🎉 Add Money feature unlocked! Tap + to add funds!');
  }

  // Genau bei Strähne 5: prüfen, ob ein neues Spiel "gecleared" wurde
  // und ggf. die nächste Geld-Option freischalten
  if (s === 5) {
    const prevCleared = gamesCleared;
    // Zählt, für wie viele Spiele schon mind. Strähne 5 erreicht wurde
    gamesCleared = GAMES.filter(g => highscores[g] >= 5).length;
    if (gamesCleared > prevCleared) {
      unlockNextOption(); // Nächste Geld-Option im Modal freischalten
    }
  }

  // Badge und Anzeige im Spiel aktualisieren
  updateStreakBadge(game);
  updateStreakDisplay(game);
}

// Wird nach jeder Niederlage aufgerufen: Strähne auf 0 zurücksetzen
function recordLoss(game) {
  streaks[game] = 0;
  updateStreakBadge(game);
  updateStreakDisplay(game);
}

// Kleines Feuer-Badge neben dem Spielnamen aktualisieren
function updateStreakBadge(game) {
  const el = document.getElementById('streak-' + game);
  if (!el) return;
  const s = streaks[game];
  const h = highscores[game];
  el.textContent = `🔥 ${s}`;
  // Goldene Farbe wenn Highscore ≥ 5, heiße Farbe ab Strähne 3
  if (h >= 5) el.classList.add('max');
  else if (s >= 3) el.classList.add('hot');
  else { el.classList.remove('hot'); el.classList.remove('max'); }
}

// Strähne-Anzeige innerhalb des laufenden Spiels aktualisieren
function updateStreakDisplay(game) {
  const el = document.getElementById('ingame-streak');
  if (el) {
    el.textContent = `🔥 Streak: ${streaks[game]}  |  🏆 Best: ${highscores[game]}`;
  }
}

// Nächste gesperrte Geld-Option im "Geld hinzufügen"-Modal freischalten
function unlockNextOption() {
  const idx = unlockedOptions; // Index des nächsten freizuschaltenden Buttons
  if (idx >= 6) return; // Alle 6 Optionen bereits freigeschaltet

  unlockedOptions++;
  const btn = document.getElementById('amt-' + idx);
  if (btn) {
    btn.classList.remove('locked');
    btn.disabled = false;
    btn.textContent = AMOUNT_LABELS[idx]; // Betrag als Text anzeigen
  }

  // Benachrichtigung anzeigen
  const allDone = unlockedOptions === 6;
  showUnlockNotif(
    allDone,
    allDone
      ? '🎊 All options unlocked! You are a true high roller!'
      : `💸 ${AMOUNT_LABELS[idx]} unlocked! Keep winning to unlock more!`
  );

  // Untertitel im Modal aktualisieren
  if (!allDone) {
    document.getElementById('modal-subtitle').textContent =
      `${unlockedOptions}/6 options unlocked. Reach streak of 5 in another game!`;
  } else {
    document.getElementById('modal-subtitle').textContent = 'All options unlocked! 🎊';
  }
}

// Kurzzeit-Benachrichtigung oben anzeigen (erscheint und verschwindet nach 5 Sekunden)
function showUnlockNotif(allDone, text) {
  const el = document.getElementById('unlock-notif');
  const icon = document.getElementById('unlock-icon');
  const textEl = document.getElementById('unlock-text');
  textEl.textContent = text;
  icon.textContent = allDone ? '🏆' : '🔓'; // Pokal wenn alles freigeschaltet, sonst Schloss
  el.className = 'unlock-notif' + (allDone ? ' all-unlocked' : '');
  void el.offsetWidth; // Browser zwingt, den Stil neu zu berechnen (für CSS-Animation nötig)
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 5000);
}

// ---- Strähne-Balken innerhalb des Spiels als HTML erzeugen ----
// Zeigt 5 Kreise (gefüllt = bereits gewonnen), aktuelle Strähne und Highscore
function streakBarHTML(game) {
  const s = streaks[game], h = highscores[game];
  // 5 Kreise: gelb wenn innerhalb der aktuellen Strähne, sonst durchsichtig
  const pips = Array.from({length:5}, (_,i) =>
    `<span style="width:14px;height:14px;border-radius:50%;display:inline-block;margin:0 2px;
      background:${i < s ? '#f5c820' : 'rgba(255,255,255,0.15)'};
      border:2px solid ${i < s ? '#c9a84c' : 'rgba(255,255,255,0.2)'};
      box-shadow:${i < s ? '0 0 6px rgba(245,200,32,0.6)' : 'none'};
      transition:all 0.3s;"></span>`
  ).join('');
  return `<div id="ingame-streak-wrap" style="display:flex;align-items:center;gap:8px;padding:8px 14px;
    background:rgba(0,0,0,0.25);border-radius:6px;margin-bottom:10px;flex-wrap:wrap;justify-content:center;">
    <span style="color:rgba(255,255,255,0.8);font-size:1rem;">🔥 Streak:</span>
    <span style="display:inline-flex;align-items:center;">${pips}</span>
    <span style="color:var(--yellow);font-size:1rem;font-weight:700;">${s}</span>
    <span style="font-size:0.9rem;">| 🏆 Best: ${h}</span>
    ${h >= 5 ? '<span style="font-family:\'ink free\'font-size:1rem;">✓ Cleared!</span>' : ''}
  </div>`;
}

// ---- Modal (Geld-Hinzufügen-Fenster) ----

// Modal öffnen – nur wenn bereits ein Sieg erzielt wurde
function openModal() {
  if (!addMoneyUnlocked) {
    showToast('Win a game first to unlock! 🎮');
    return;
  }
  document.getElementById('modal-overlay').classList.add('active');
}

// Modal schließen
function closeModal() { document.getElementById('modal-overlay').classList.remove('active'); }

// Guthaben um den gewählten Betrag erhöhen und Modal schließen
function addMoney(amount) {
  updateWallet(amount);
  showToast(`${formatMoney(amount)} added! 💰`);
  closeModal();
}

// Kurze Info-Nachricht am unteren Bildschirmrand anzeigen (verschwindet nach 2,5 Sekunden)
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ===================== NAVIGATION =====================
let currentGame = ""; // Welches Spiel gerade geöffnet ist ("blackjack", "horses" oder leer)

// Vom Hauptmenü in ein Spiel wechseln
function openGame(game) {
  currentGame = game;
  document.getElementById("home").classList.remove("active"); // Hauptmenü ausblenden
  const gs = document.getElementById("game-screen");
  gs.classList.add("active"); // Spielbildschirm einblenden

  // Titel oben setzen
  const titles = {
    blackjack: "Blackjack",
    horses: "Horse Racing",
  };
  document.getElementById("game-title").textContent = titles[game];

  // Spielbereich leeren und das gewählte Spiel initialisieren
  const gc = document.getElementById("game-container");
  gc.innerHTML = "";
  if (game === "blackjack") initBlackjack(gc);
  else if (game === "horses") initHorses(gc);
}

// Zurück zum Hauptmenü
function closeGame() {
  document.getElementById("game-screen").classList.remove("active");
  document.getElementById("home").classList.add("active");
  currentGame = "";
}

// ===================== REGELN =====================
// Regeltexte für jedes Spiel als strukturiertes Objekt gespeichert
const RULES = {
  blackjack: {
    sections: [
      {
        h: "🎯 Goal",
        p: "Beat the dealer by getting a hand value closer to 21 without going over (busting).",
      },
      {
        h: "🃏 Card Values",
        p: "Number cards = face value. Jack, Queen, King = 10. Ace = 11 or 1 (whichever helps more).",
      },
      {
        h: "▶️ How to Play",
        ul: [
          "Place your bet using chips.",
          "Press Deal — you and the dealer each get 2 cards. One dealer card is face-down.",
          "Hit: take another card. Stand: keep your hand.",
          "Double Down: double your bet and take exactly one more card.",
          "Split: if your first two cards have the same value, split into two hands.",
        ],
      },
      {
        h: "🏆 Winning",
        ul: [
          "Beat dealer's total → win 1x your bet (get back 2x).",
          "Blackjack (Ace + 10-card) → win 1.5x your bet.",
          "Dealer busts → you win.",
          "Tie (push) → bet is returned.",
        ],
      },
      {
        h: "🃏 Dealer Rules",
        p: "Dealer must hit until reaching 17 or higher. If the dealer has Blackjack on the initial deal, you lose immediately (or push if you also have Blackjack).",
      },
    ],
  },
  horses: {
    sections: [
      {
        h: "🎯 Goal",
        p: "Pick the horse you think will cross the finish line first and bet on it.",
      },
      {
        h: "▶️ How to Play",
        ul: [
          "Select a horse from the grid — each has different odds.",
          "Place your bet using chips.",
          "Press Race and watch them gallop to the finish!",
        ],
      },
      {
        h: "💰 Payouts",
        p: "If your horse wins, you receive your bet × the horse's odds.",
      },
      {
        h: "🐴 The Horses",
        ul: [
          "Alogo x2 (favorite)",
          "JimmyPferdo x3",
          "Johnny Blue x4",
          "Lerry x5",
          "Margepferd x6",
          "Paule x8 (long shot)",
        ],
      },
      {
        h: "🎲 Fairness",
        p: "All horses have a real chance to win. Lower odds = slight speed advantage, but high randomness means any horse can surge and win!",
      },
    ],
  },
};

// Regel-Modal für das aktuelle Spiel öffnen und mit Inhalt befüllen
function openRules() {
  if (!currentGame) return;
  const rules = RULES[currentGame];
  document.getElementById('rules-modal-titlebar').textContent = rules.title;
  document.getElementById('rules-title').textContent = rules.title;
  // Jede Regel-Sektion als HTML-Block einfügen
  document.getElementById('rules-body').innerHTML = rules.sections.map(s => `
    <div class="rule-section">
      <h3>${s.h}</h3>
      ${s.p ? `<p>${s.p}</p>` : ''}
      ${s.ul ? `<ul>${s.ul.map(i => `<li>${i}</li>`).join('')}</ul>` : ''}
    </div>
  `).join('');
  document.getElementById('rules-overlay').classList.add('active');
}

// Regel-Modal über den Schließen-Button schließen
function closeRulesBtn() {
  document.getElementById('rules-overlay').classList.remove('active');
}

// Regel-Modal schließen, wenn man außerhalb des Fensters klickt
function closeRules(e) {
  if (e.target === document.getElementById('rules-overlay')) closeRulesBtn();
}


// ===================== KARTEN-HILFSFUNKTIONEN =====================
const CARD_IMG_FOLDER = 'assets/BlackJack'; // Ordner mit den Kartenbildern
const CARD_IMG_EXT = '.png';
const CARD_BACK_IMG = `${CARD_IMG_FOLDER}/CARD_BACK${CARD_IMG_EXT}`; // Bild für verdeckte Karten
// Deutsche Namen für die Kartensymbole (für Dateinamen)
const SUIT_NAMES = { '♠': 'Pik', '♥': 'Herz', '♦': 'Karo', '♣': 'Kreuz' };
const SUITS = ['♠','♥','♦','♣'];
const RANKS = ['A','2','3','4','5','6','7','8','9','10','Jack','Queen','King'];

// Neues gemischtes Kartenspiel (52 Karten) erstellen
function createDeck() {
  let deck = [];
  // Alle 52 Karten hinzufügen
  for (let s of SUITS) for (let r of RANKS) deck.push({ suit: s, rank: r });
  // Karten zufällig mischen (Fisher-Yates-Algorithmus)
  for (let i = deck.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// Dateiname des Kartenbilds aus dem Kartenobjekt ableiten, z.B. "Herz_King.png"
function cardImageName(card) {
  const suitName = SUIT_NAMES[card.suit] || card.suit;
  return `${suitName}_${card.rank}${CARD_IMG_EXT}`;
}

// Vollständigen Pfad zum Kartenbild zurückgeben
function cardImagePath(card) {
  return `${CARD_IMG_FOLDER}/${cardImageName(card)}`;
}

// Zahlenwert einer einzelnen Karte berechnen
// Bild-Karten = 10, Ass = 11 (kann später auf 1 reduziert werden)
function cardValue(card) {
  if (['Jack','Queen','King'].includes(card.rank)) return 10;
  if (card.rank === 'Ace' || card.rank === 'A') return 11;
  return parseInt(card.rank, 10) || 0;
}

// Gesamtwert einer Hand berechnen
// Asse werden automatisch von 11 auf 1 reduziert, wenn man sonst über 21 kommt
function handValue(hand) {
  let val = 0, aces = 0;
  for (let c of hand) {
    if (c.faceDown) continue; // Verdeckte Karten nicht mitzählen
    val += cardValue(c);
    if (['Ace','A'].includes(c.rank)) aces++;
  }
  // Solange man über 21 ist und noch Asse als 11 gezählt werden: auf 1 reduzieren
  while (val > 21 && aces > 0) { val -= 10; aces--; }
  return val;
}

// HTML für eine einzelne Karte erzeugen (verdeckt oder offen)
function renderCard(card) {
  if (card.faceDown) {
    return `<div class="card face-down"><img src="${CARD_BACK_IMG}" alt="Card back"></div>`;
  }
  return `<div class="card card-face">
    <img src="${cardImagePath(card)}" alt="${card.rank} ${card.suit}">
  </div>`;
}


// ===================== BLACKJACK =====================
function initBlackjack(container) {
  // Lokale Spielvariablen
  let deck = [], playerHand = [], dealerHand = [], bet = 0, gameOver = true;
  let msg = 'Place your bet and deal!', msgClass = 'msg-info';
  // splitHands: Array mit zwei Händen beim Splitten, null wenn kein Split
  let splitHands = null, splitBets = null, activeSplit = 0;

  // Prüfen ob der Spieler splitten darf:
  // – Spiel läuft, genau 2 Karten, noch nicht gesplittet, genug Geld, beide Karten gleich wertvoll
  function canSplit() {
    if (gameOver || playerHand.length !== 2 || splitHands) return false;
    if (wallet < bet) return false;
    return cardValue(playerHand[0]) === cardValue(playerHand[1]);
  }

  // HTML für eine einzelne Hand (mit Rahmen wenn aktiv)
  function renderHand(hand, label, value, active=true) {
    const border = active ? 'border: 2px solid var(--yellow);' : 'opacity:0.6;';
    return `<div style="${border} border-radius:6px; padding:6px; margin-bottom:6px; transition:all 0.2s;">
      <div class="hand-label">${label} <span class="hand-value">${value}</span></div>
      <div class="hand">${hand.map(renderCard).join('')}</div>
    </div>`;
  }

  // Gesamtes Spielfeld neu zeichnen
  function render() {
    // Dealer-Handwert nur aus sichtbaren Karten berechnen
    const dv = handValue(dealerHand.filter(c=>!c.faceDown));

    // Spieler-Bereich: bei Split zwei Hände nebeneinander, sonst eine Hand
    let playerSection = '';
    if (splitHands) {
      const v0 = handValue(splitHands[0]), v1 = handValue(splitHands[1]);
      playerSection = `<hr class="section-sep">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          ${renderHand(splitHands[0], '✋ Hand 1', v0, activeSplit===0 && !gameOver)}
          ${renderHand(splitHands[1], '✋ Hand 2', v1, activeSplit===1 && !gameOver)}
        </div>`;
    } else {
      const pv = handValue(playerHand);
      playerSection = `<hr class="section-sep">
        <div class="hand-label">You <span class="hand-value">${pv}</span></div>
        <div class="hand">${playerHand.map(renderCard).join('')}</div>`;
    }

    // Einsatz-Anzeige: bei Split beide Einsätze, sonst einen
    let betDisplay = splitHands
      ? `<span class="bet-label">Hand 1:</span><span class="bet-display">${formatMoney(splitBets[0])}</span>
         <span class="bet-label" style="margin-left:8px">Hand 2:</span><span class="bet-display">${formatMoney(splitBets[1])}</span>`
      : `<span class="bet-label">Bet:</span><span class="bet-display">${formatMoney(bet)}</span>`;

    // Aktions-Buttons während des Spiels (Hit, Stand, ggf. Double Down und Split)
    let actionBtns = '';
    if (!gameOver) {
      actionBtns = `
        <button class="btn btn-gold" onclick="bjHit()">Hit</button>
        <button class="btn btn-outline" onclick="bjStand()">Stand</button>
        ${!splitHands && playerHand.length===2 && wallet>=bet ? `<button class="btn btn-red" onclick="bjDouble()">Double Down</button>` : ''}
        ${canSplit() ? `<button class="btn btn-purple" onclick="bjSplit()">✂ Split</button>` : ''}
      `;
    }

    // true, wenn wir in der Einsatz-Phase sind (vor dem Deal)
    const inBettingPhase = gameOver && playerHand.length === 0 && !splitHands;

    container.innerHTML = `
      ${streakBarHTML('blackjack')}
      <div class="felt-table">
        <div class="hand-label">Dealer <span class="hand-value">${gameOver ? handValue(dealerHand) : dv}</span></div>
        <div class="hand">${dealerHand.map(renderCard).join('')}</div>
        ${playerSection}
        <div class="message-box ${msgClass}" style="margin-top:10px">${msg}</div>
      </div>
      <div class="bet-area">
        ${betDisplay}
        ${inBettingPhase ? `
          <img class="chip chip-5" src="assets/universal/Chip5.png" onclick="placeBet(5)" alt="$5 Chip" />
          <img class="chip chip-10" src="assets/universal/Chip10.png" onclick="placeBet(10)" alt="$10 Chip" />
          <img class="chip chip-25" src="assets/universal/Chip25.png" onclick="placeBet(25)" alt="$25 Chip" />
          <img class="chip chip-50" src="assets/universal/Chip50.png" onclick="placeBet(50)" alt="$50 Chip" />
          <img class="chip chip-100" src="assets/universal/Chip100.png" onclick="placeBet(100)" alt="$100 Chip" />
          <img class="chip chip-500" src="assets/universal/Chip500.png" onclick="placeBet(500)" alt="$500 Chip" />
        ` : ''}
      </div>
      <div class="controls">
        ${inBettingPhase ? `<button class="btn btn-gold" onclick="bjDeal()" ${bet===0?'disabled':''}>Deal</button>
        <button class="btn btn-outline" onclick="bjClearBet()">Clear Bet</button>` : ''}
        ${actionBtns}
        ${gameOver && (playerHand.length > 0 || splitHands) ? `<button class="btn btn-outline" onclick="bjNewGame()">New Game</button>` : ''}
      </div>
    `;
  }

  // Chip angeklickt: Einsatz um diesen Betrag erhöhen
  window.placeBet = function(amount) {
    if (!gameOver || playerHand.length > 0 || splitHands) return;
    if (wallet < amount) { showToast('Not enough funds!'); return; }
    bet += amount; wallet -= amount;
    document.getElementById('wallet-display').textContent = formatMoney(wallet);
    render();
  };

  // Einsatz zurücksetzen und Chips wieder gutschreiben
  window.bjClearBet = function() {
    wallet += bet; bet = 0;
    document.getElementById('wallet-display').textContent = formatMoney(wallet);
    render();
  };

  // Karten austeilen und Spiel starten
  window.bjDeal = function() {
    if (bet === 0 || !gameOver) return;
    deck = createDeck();
    // Spieler bekommt 2 offene Karten, Dealer 1 offen + 1 verdeckt
    playerHand = [deck.pop(), deck.pop()];
    dealerHand = [deck.pop(), {...deck.pop(), faceDown: true}];
    splitHands = null; splitBets = null; activeSplit = 0;
    gameOver = false;
    msg = 'Hit or Stand?'; msgClass = 'msg-info';

    const playerBJ = handValue(playerHand) === 21;
    // Prüfen ob der Dealer Blackjack hat (beide Karten zählen für die Prüfung)
    const dealerBJ = handValue(dealerHand) === 21;

    if (dealerBJ) {
      revealDealer(); // Dealer-Karte aufdecken
      gameOver = true;
      if (playerBJ) {
        // Beide haben Blackjack → Unentschieden, Einsatz zurück
        updateWallet(bet);
        msg = '🤝 Both Blackjack! Push — bet returned.'; msgClass = 'msg-push';
        recordLoss('blackjack');
      } else {
        msg = '🃏 Dealer Blackjack! You lose.'; msgClass = 'msg-lose';
        recordLoss('blackjack');
      }
      bet = 0; render(); return;
    }

    // Kein Dealer-Blackjack: wenn Spieler Blackjack hat, direkt zu Stand (Gewinn wird dort berechnet)
    if (playerBJ) { bjStand(); return; }
    render();
  };

  // Spieler zieht eine weitere Karte
  window.bjHit = function() {
    if (gameOver) return;
    if (splitHands) {
      // Bei Split: Karte zur aktiven Hand hinzufügen
      splitHands[activeSplit].push(deck.pop());
      const pv = handValue(splitHands[activeSplit]);
      if (pv > 21) {
        // Aktive Hand überkauft: zur nächsten Hand wechseln oder Runde auswerten
        if (activeSplit === 0) { activeSplit = 1; msg = '💀 Hand 1 busts! Now play Hand 2.'; msgClass = 'msg-lose'; render(); }
        else { bjResolveSplit(); }
      } else if (pv === 21) {
        // 21 erreicht: automatisch zur nächsten Hand oder auswerten
        if (activeSplit === 0) { activeSplit = 1; msg = '21 on Hand 1! Now play Hand 2.'; msgClass = 'msg-info'; render(); }
        else { bjResolveSplit(); }
      } else render();
    } else {
      // Normale Hand: Karte hinzufügen
      playerHand.push(deck.pop());
      const pv = handValue(playerHand);
      if (pv > 21) {
        // Überkauft (bust): sofort verloren
        revealDealer(); msg = '💀 Bust! You lose.'; msgClass = 'msg-lose';
        gameOver = true; recordLoss('blackjack'); render();
      } else if (pv === 21) { bjStand(); } // Automatisch stehen bei 21
      else render();
    }
  };

  // Spieler hält (Stand) – Dealer spielt und Ergebnis wird berechnet
  window.bjStand = function() {
    if (gameOver) return;
    if (splitHands) {
      // Bei Split: zur nächsten Hand wechseln oder auswerten
      if (activeSplit === 0) { activeSplit = 1; msg = 'Hand 1 done. Now play Hand 2 — Hit or Stand?'; msgClass = 'msg-info'; render(); }
      else { bjResolveSplit(); }
    } else {
      revealDealer(); // Dealer-Karte aufdecken
      // Dealer muss Karten ziehen bis er mindestens 17 hat
      while (handValue(dealerHand) < 17) dealerHand.push(deck.pop());
      const pv = handValue(playerHand), dv = handValue(dealerHand);
      gameOver = true;
      if (dv > 21 || pv > dv) {
        // Spieler gewinnt
        if (pv === 21 && playerHand.length === 2) {
          // Blackjack: 2,5-facher Einsatz zurück
          const bj = Math.floor(bet * 2.5);
          updateWallet(bj); msg = `🎉 Blackjack! You win ${formatMoney(bj)}!`; msgClass = 'msg-win';
        } else {
          // Normaler Sieg: doppelter Einsatz zurück
          updateWallet(bet * 2); msg = `🎉 You win ${formatMoney(bet*2)}!`; msgClass = 'msg-win';
        }
        recordWin('blackjack');
      } else if (pv === dv) {
        // Unentschieden: Einsatz zurück
        updateWallet(bet); msg = '🤝 Push! Bet returned.'; msgClass = 'msg-push';
        recordLoss('blackjack');
      } else {
        // Dealer gewinnt
        msg = `😔 Dealer wins with ${dv}.`; msgClass = 'msg-lose';
        recordLoss('blackjack');
      }
      bet = 0; render();
    }
  };

  // Hilfsfunktion: prüft ob eine Hand gegen den Dealer gewonnen hat
  function resolveHand(pv, dv, handBet) {
    if (pv > 21) return false; // Bust verliert immer
    if (dv > 21 || pv > dv) return true; // Dealer bust oder Spieler höher = Gewinn
    return false;
  }

  // Split-Runde auswerten: beide Hände gegen den Dealer vergleichen
  function bjResolveSplit() {
    if (gameOver) return;
    revealDealer();
    while (handValue(dealerHand) < 17) dealerHand.push(deck.pop());
    const dv = handValue(dealerHand);
    gameOver = true;
    const pv0 = handValue(splitHands[0]), pv1 = handValue(splitHands[1]);
    let won0 = false, push0 = false, won1 = false, push1 = false;

    // Hand 1 auswerten
    if (pv0 <= 21) {
      if (dv > 21 || pv0 > dv) { updateWallet(splitBets[0]*2); won0 = true; }
      else if (pv0 === dv) { updateWallet(splitBets[0]); push0 = true; }
    }
    // Hand 2 auswerten
    if (pv1 <= 21) {
      if (dv > 21 || pv1 > dv) { updateWallet(splitBets[1]*2); won1 = true; }
      else if (pv1 === dv) { updateWallet(splitBets[1]); push1 = true; }
    }

    const r0 = won0 ? '🎉 Win' : push0 ? '🤝 Push' : '😔 Lose';
    const r1 = won1 ? '🎉 Win' : push1 ? '🤝 Push' : '😔 Lose';
    const allWin = won0 && won1, allLose = !won0 && !push0 && !won1 && !push1;
    msg = `Hand 1: ${r0} (${pv0}) | Hand 2: ${r1} (${pv1}) | Dealer: ${dv}`;
    msgClass = allWin ? 'msg-win' : allLose ? 'msg-lose' : 'msg-push';
    // Strähne: Sieg wenn mind. eine Hand gewonnen, Niederlage wenn beide verloren
    if (won0 || won1) recordWin('blackjack'); else recordLoss('blackjack');
    render();
  }

  // Double Down: Einsatz verdoppeln, genau eine weitere Karte ziehen, dann stehen
  window.bjDouble = function() {
    if (wallet < bet) { showToast('Not enough funds!'); return; }
    wallet -= bet; bet *= 2; // Einsatz verdoppeln
    document.getElementById('wallet-display').textContent = formatMoney(wallet);
    playerHand.push(deck.pop());
    if (handValue(playerHand) > 21) {
      // Überkauft nach Double Down: verloren
      revealDealer(); msg = '💀 Bust! You lose.'; msgClass = 'msg-lose';
      gameOver = true; bet = 0; recordLoss('blackjack'); render();
    } else bjStand(); // Sonst automatisch stehen
  };

  // Split: die zwei gleichen Karten in zwei separate Hände aufteilen
  window.bjSplit = function() {
    if (!canSplit()) return;
    wallet -= bet; // Zweiten Einsatz vom Guthaben abziehen
    document.getElementById('wallet-display').textContent = formatMoney(wallet);
    // Zwei neue Hände erstellen, jede mit einer der ursprünglichen Karten + einer neuen
    splitHands = [[playerHand[0], deck.pop()], [playerHand[1], deck.pop()]];
    splitBets = [bet, bet]; // Jede Hand hat denselben Einsatz
    activeSplit = 0; // Mit Hand 1 beginnen
    msg = 'Split! Playing Hand 1 — Hit or Stand?'; msgClass = 'msg-info';
    render();
  };

  // Neues Spiel starten: alle Variablen zurücksetzen
  window.bjNewGame = function() {
    bet = 0; playerHand = []; dealerHand = [];
    splitHands = null; splitBets = null; activeSplit = 0;
    gameOver = true;
    msg = 'Place your bet and deal!'; msgClass = 'msg-info';
    render();
  };

  // Alle verdeckten Dealer-Karten aufdecken
  function revealDealer() { dealerHand.forEach(c => { delete c.faceDown; }); }

  render(); // Erstes Rendering beim Start
}

// ===================== PFERDERENNEN =====================
function initHorses(container) {
  // Alle Pferde mit Namen, Bild, Quote und Farbe
  const horses = [
    { name:'Alogo', img:'Alogo.png', odds:2, color:'#e74c3c' },
    { name:'JimmyPferdo', img:'JimmyPferdo.png', odds:3, color:'#f0d080' },
    { name:'Johnny Blue', img:'Johnny_Blue.png', odds:5, color:'#9b59b6' },
    { name:'Lerry', img:'Lerry.png', odds:4, color:'#3498db' },
    { name:'Margepferd', img:'Margepferd.png', odds:6, color:'#2ecc71' },
    { name:'Paule', img:'Paule.png', odds:8, color:'#e67e22' },
  ];

  let bet = 0,
      selectedHorse = null, // Index des gewählten Pferdes (null = keines gewählt)
      racing = false,        // true während das Rennen läuft
      positions = [],        // Aktuelle Position jedes Pferdes auf der Bahn (0–85%)
      winner = null,         // Index des Gewinners nach dem Rennen
      raceFinished = false;  // true wenn das Rennen beendet ist

  // Alle Pferde zurück an den Start setzen (5% = kurz hinter der Startlinie)
  function initPositions() { positions = horses.map(()=>5); }

  // Gesamtes Spielfeld neu zeichnen
  function render(msg='', msgClass='msg-info') {
    container.innerHTML = `
      ${streakBarHTML('horses')}
      <div class="felt-table" style="background:radial-gradient(ellipse, #2d7a2a 0%, #1a5a18 100%)">
        <div class="track horse-track" id="track-container">
          ${horses.map((h,i)=>`
            <div class="horse-lane" id="lane-${i}">
              <div class="finish-line"></div>
              <span class="horse-emoji" id="horse-${i}" style="left:${positions[i]||5}%">
                <img class="horse-select-icon" src="assets/Pferde_png/${h.img}" alt="${h.name}" />
              </span>
              <span class="horse-name" style="color:${h.color}">${h.name}</span>
            </div>
          `).join('')}
        </div>
        ${msg ? `<div class="message-box ${msgClass}" style="margin-top:10px">${msg}</div>` : ''}
      </div>
      <div class="horse-select-grid">
        ${horses.map((h,i)=>`
          <button class="horse-select-btn ${selectedHorse===i?'selected':''}" onclick="selectHorse(${i})">
            ${h.name} <span style="float:right;color:#c8a820">x${h.odds}</span>
          </button>
        `).join('')}
      </div>
      <div class="bet-area">
        <span class="bet-label">Bet:</span>
        <span class="bet-display">${formatMoney(bet)}</span>
        ${!racing && !raceFinished ? `
          <img class="chip chip-5" src="assets/universal/Chip5.png" onclick="hPlaceBet(5)" alt="$5 Chip" />
          <img class="chip chip-10" src="assets/universal/Chip10.png" onclick="hPlaceBet(10)" alt="$10 Chip" />
          <img class="chip chip-25" src="assets/universal/Chip25.png" onclick="hPlaceBet(25)" alt="$25 Chip" />
          <img class="chip chip-50" src="assets/universal/Chip50.png" onclick="hPlaceBet(50)" alt="$50 Chip" />
          <img class="chip chip-100" src="assets/universal/Chip100.png" onclick="hPlaceBet(100)" alt="$100 Chip" />
          <img class="chip chip-500" src="assets/universal/Chip500.png" onclick="hPlaceBet(500)" alt="$500 Chip" />
        ` : ''}
      </div>
      <div class="controls">
        ${!raceFinished ? `
          <button class="btn btn-gold" onclick="hRace()" ${racing||bet===0||selectedHorse===null?'disabled':''}>🏁 Race!</button>
          <button class="btn btn-outline" onclick="hClear()" ${racing?'disabled':''}>Clear</button>
        ` : `<button class="btn btn-gold" onclick="hNewRace()">New Race</button>`}
      </div>
    `;
  }

  initPositions(); // Startpositionen setzen

  // Pferd auswählen (nur vor dem Rennen möglich)
  window.selectHorse = function(i) {
    if (racing || raceFinished) return;
    selectedHorse = i; render('Place your bet and race!', 'msg-info');
  };

  // Chip angeklickt: Einsatz erhöhen
  window.hPlaceBet = function(amount) {
    if (racing || raceFinished) return;
    if (wallet < amount) { showToast('Not enough funds!'); return; }
    bet += amount; wallet -= amount;
    document.getElementById('wallet-display').textContent = formatMoney(wallet);
    render();
  };

  // Einsatz und Pferdeauswahl zurücksetzen
  window.hClear = function() {
    wallet += bet; bet = 0;
    document.getElementById('wallet-display').textContent = formatMoney(wallet);
    render();
  };

  // Rennen starten
  window.hRace = function() {
    if (racing || bet === 0 || selectedHorse === null) return;
    racing = true; raceFinished = false;
    initPositions(); // Alle Pferde zurück an den Start
    render('🏁 They\'re off!', 'msg-info');

    // Grundgeschwindigkeit für alle Pferde (annähernd gleich für Spannung)
    // Niedrige Quote = leichter Vorteil, aber viel Zufall gleicht das aus
    const baseSpeed = 1.2;
    const speeds = horses.map(h => {
      // Favoriten-Bonus: je niedriger die Quote, desto minimal schneller
      // z.B. Quote 2 → +0.32, Quote 8 → +0.08 Bonus
      const favBonus = (10 - h.odds) * 0.04;
      return baseSpeed + favBonus;
    });

    winner = null;
    // Alle 160ms die Positionen aktualisieren und Bild bewegen
    const iv = setInterval(() => {
      let finishers = []; // Pferde, die diese Runde die Ziellinie überschreiten
      horses.forEach((h, i) => {
        // Große Zufallskomponente: jedes Pferd kann in jedem Tick schnell oder langsam sein
        const variance = Math.random() * 2.2;
        positions[i] = Math.min(positions[i] + speeds[i] * variance, 85); // max. 85% = Ziellinie
        const el = document.getElementById(`horse-${i}`);
        if (el) el.style.left = positions[i] + '%'; // Bild im DOM verschieben
        if (positions[i] >= 85) finishers.push(i); // Pferd hat Ziel erreicht
      });

      if (finishers.length > 0) {
        // Falls mehrere Pferde gleichzeitig ankommen: zufälligen Gewinner wählen
        winner = finishers[Math.floor(Math.random() * finishers.length)];
        clearInterval(iv); // Rennen-Ticker stoppen
        racing = false; raceFinished = true;
        const w = horses[winner];
        if (winner === selectedHorse) {
          // Spieler hat das richtige Pferd gewählt: Gewinn = Einsatz × Quote
          const win = bet * w.odds;
          updateWallet(win);
          render(`🏆 ${w.name} wins! You win ${formatMoney(win)}!`, 'msg-win');
          recordWin('horses');
        } else {
          // Falsches Pferd gewählt: Einsatz verloren
          render(`🏁 ${w.name} wins! Better luck next time.`, 'msg-lose');
          recordLoss('horses');
        }
        bet = 0; // Einsatz verbraucht
      }
    }, 160);
  };

  // Neues Rennen starten: alle Variablen zurücksetzen
  window.hNewRace = function() {
    bet = 0; selectedHorse = null; racing = false; raceFinished = false;
    initPositions();
    render('Pick your horse and place your bet!', 'msg-info');
  };

  render('Pick your horse and place your bet!', 'msg-info'); // Erstes Rendering
}

// Geld-Modal schließen wenn man außerhalb klickt
document.getElementById('modal-overlay').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});
