// ===================== NAVIGATION =====================
let currentGame = "";
function openGame(game) {
  currentGame = game;
  document.getElementById("home").classList.remove("active");
  const gs = document.getElementById("game-screen");
  gs.classList.add("active");
  const titles = {
    blackjack: "♠ Blackjack",
    roulette: "🎡 Roulette",
    slots: "🎰 Slots",
    poker: "♠ Poker",
    horses: "🐎 Horse Racing",
    crash: "🚀 Crash",
  };
  document.getElementById("game-title").textContent = titles[game];
  const gc = document.getElementById("game-container");
  gc.innerHTML = "";
  if (game === "blackjack") initBlackjack(gc);
  else if (game === "roulette") initRoulette(gc);
  else if (game === "slots") initSlots(gc);
  else if (game === "poker") initPoker(gc);
  else if (game === "horses") initHorses(gc);
  else if (game === "crash") initCrash(gc);
}
function closeGame() {
  document.getElementById("game-screen").classList.remove("active");
  document.getElementById("home").classList.add("active");
  currentGame = "";
}

// ===================== RULES =====================
const RULES = {
  blackjack: {
    title: "♠ Blackjack Rules",
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
    title: "🐎 Horse Racing Rules",
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
          "Thunder Bolt x2 (favorite)",
          "Golden Arrow x3",
          "Lucky Star x4",
          "Dark Shadow x5",
          "Iron Will x6",
          "Wild Spirit x8 (long shot)",
        ],
      },
      {
        h: "🎲 Fairness",
        p: "All horses have a real chance to win. Lower odds = slight speed advantage, but high randomness means any horse can surge and win!",
      },
    ],
  },
};

function openRules() {
  if (!currentGame) return;
  const rules = RULES[currentGame];
  document.getElementById('rules-modal-titlebar').textContent = rules.title;
  document.getElementById('rules-title').textContent = rules.title;
  document.getElementById('rules-body').innerHTML = rules.sections.map(s => `
    <div class="rule-section">
      <h3>${s.h}</h3>
      ${s.p ? `<p>${s.p}</p>` : ''}
      ${s.ul ? `<ul>${s.ul.map(i => `<li>${i}</li>`).join('')}</ul>` : ''}
    </div>
  `).join('');
  document.getElementById('rules-overlay').classList.add('active');
}
function closeRulesBtn() {
  document.getElementById('rules-overlay').classList.remove('active');
}
function closeRules(e) {
  if (e.target === document.getElementById('rules-overlay')) closeRulesBtn();
}
