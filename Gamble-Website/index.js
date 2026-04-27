// ===================== GLOBAL STATE =====================
let wallet = 1000;
 
// Highscore system
const GAMES = ['blackjack','roulette','slots','poker','horses','crash'];
const AMOUNTS = [100, 250, 500, 1000, 5000, 10000];
const AMOUNT_LABELS = ['$100','$250','$500','$1,000','$5,000','$10,000'];
 
// streak: current consecutive wins per game
// highscore: best streak ever per game (must reach 5 to count as "cleared")
let streaks   = { blackjack:0, roulette:0, slots:0, poker:0, horses:0, crash:0 };
let highscores = { blackjack:0, roulette:0, slots:0, poker:0, horses:0, crash:0 };
let gamesCleared = 0;      // how many games have reached streak ≥ 5
let unlockedOptions = 0;   // how many add-money options are unlocked (0–6)
let addMoneyUnlocked = false; // true after first win ever
 
function formatMoney(n) { return '$' + n.toLocaleString('en-US'); }
 
function updateWallet(amount) {
  wallet += amount;
  if (wallet < 0) wallet = 0;
  document.getElementById('wallet-display').textContent = formatMoney(wallet);
}
 

// ---- Streak / Highscore logic ----
function recordWin(game) {
  streaks[game]++;
  const s = streaks[game];
  if (s > highscores[game]) highscores[game] = s;
 
  // Unlock add-money button on very first win
  if (!addMoneyUnlocked) {
    addMoneyUnlocked = true;
    document.getElementById('modal-subtitle').textContent = 'Unlock more options by reaching streaks of 5!';
    const btn = document.querySelector('.add-money-btn');
    btn.classList.remove('locked-btn');
    showUnlockNotif(false, '🎉 Add Money feature unlocked! Tap + to add funds!');
  }
 
  // Check if this game just hit exactly 5 (clears for the first time each time highscore reaches 5)
  // We track clears per game via highscores reaching 5 for the first time
  if (s === 5) {
    // Check if this game hadn't contributed to gamesCleared yet
    const prevCleared = gamesCleared;
    gamesCleared = GAMES.filter(g => highscores[g] >= 5).length;
    if (gamesCleared > prevCleared) {
      // Unlock next option
      unlockNextOption();
    }
  }
 
  updateStreakBadge(game);
  updateStreakDisplay(game);
}
 
function recordLoss(game) {
  streaks[game] = 0;
  updateStreakBadge(game);
  updateStreakDisplay(game);
}
 
function updateStreakBadge(game) {
  const el = document.getElementById('streak-' + game);
  if (!el) return;
  const s = streaks[game];
  const h = highscores[game];
  el.textContent = `🔥 ${s}`;
  if (h >= 5) el.classList.add('max');
  else if (s >= 3) el.classList.add('hot');
  else { el.classList.remove('hot'); el.classList.remove('max'); }
}
 
function updateStreakDisplay(game) {
  // Update in-game streak display if it exists
  const el = document.getElementById('ingame-streak');
  if (el) {
    el.textContent = `🔥 Streak: ${streaks[game]}  |  🏆 Best: ${highscores[game]}`;
  }
}


function unlockNextOption() {
  const idx = unlockedOptions; // 0-based index of button to unlock
  if (idx >= 6) return;
 
  unlockedOptions++;
  const btn = document.getElementById('amt-' + idx);
  if (btn) {
    btn.classList.remove('locked');
    btn.disabled = false;
    btn.textContent = AMOUNT_LABELS[idx];
  }
 
  // Show notification
  const allDone = unlockedOptions === 6;
  showUnlockNotif(
    allDone,
    allDone
      ? '🎊 All options unlocked! You are a true high roller!'
      : `💸 ${AMOUNT_LABELS[idx]} unlocked! Keep winning to unlock more!`
  );
 
  // Update subtitle
  if (!allDone) {
    document.getElementById('modal-subtitle').textContent =
      `${unlockedOptions}/6 options unlocked. Reach streak of 5 in another game!`;
  } else {
    document.getElementById('modal-subtitle').textContent = 'All options unlocked! 🎊';
  }
}
 
function showUnlockNotif(allDone, text) {
  const el = document.getElementById('unlock-notif');
  const icon = document.getElementById('unlock-icon');
  const textEl = document.getElementById('unlock-text');
  textEl.textContent = text;
  icon.textContent = allDone ? '🏆' : '🔓';
  el.className = 'unlock-notif' + (allDone ? ' all-unlocked' : '');
  // Force reflow
  void el.offsetWidth;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 5000);
}

// ---- Streak display helper for in-game ----
function streakBarHTML(game) {
  const s = streaks[game], h = highscores[game];
  const pips = Array.from({length:5}, (_,i) =>
    `<span style="width:14px;height:14px;border-radius:50%;display:inline-block;margin:0 2px;
      background:${i < s ? '#f5c820' : 'rgba(255,255,255,0.15)'};
      border:2px solid ${i < s ? '#c9a84c' : 'rgba(255,255,255,0.2)'};
      box-shadow:${i < s ? '0 0 6px rgba(245,200,32,0.6)' : 'none'};
      transition:all 0.3s;"></span>`
  ).join('');
  return `<div id="ingame-streak-wrap" style="display:flex;align-items:center;gap:8px;padding:8px 14px;
    background:rgba(0,0,0,0.25);border-radius:6px;margin-bottom:10px;flex-wrap:wrap;justify-content:center;">
    <span style="font-family:'Tahoma',Arial,sans-serif;color:rgba(255,255,255,0.8);font-size:1rem;">🔥 Streak:</span>
    <span style="display:inline-flex;align-items:center;">${pips}</span>
    <span style="font-family:'Tahoma',Arial,sans-serif;color:var(--yellow);font-size:1rem;font-weight:700;">${s}</span>
    <span style="font-family:'Tahoma',Arial,sans-serif;color:rgba(255,255,255,0.4);font-size:0.9rem;">| 🏆 Best: ${h}</span>
    ${h >= 5 ? '<span style="font-family:\'Caveat\',cursive;color:#c9a84c;font-size:0.85rem;">✓ Cleared!</span>' : ''}
  </div>`;
}

// ---- Modal ----
function openModal() {
  if (!addMoneyUnlocked) {
    showToast('Win a game first to unlock! 🎮');
    return;
  }
  document.getElementById('modal-overlay').classList.add('active');
}
function closeModal() { document.getElementById('modal-overlay').classList.remove('active'); }
function addMoney(amount) {
  updateWallet(amount);
  showToast(`${formatMoney(amount)} added! 💰`);
  closeModal();
}
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}
 
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


// ===================== BLACKJACK =====================
function initBlackjack(container) {
  let deck = [], playerHand = [], dealerHand = [], bet = 0, gameOver = true;
  let msg = 'Place your bet and deal!', msgClass = 'msg-info';
  let splitHands = null, splitBets = null, activeSplit = 0;
 
  function canSplit() {
    if (gameOver || playerHand.length !== 2 || splitHands) return false;
    if (wallet < bet) return false;
    return cardValue(playerHand[0]) === cardValue(playerHand[1]);
  }
 
  function renderHand(hand, label, value, active=true) {
    const border = active ? 'border: 2px solid var(--yellow);' : 'opacity:0.6;';
    return `<div style="${border} border-radius:6px; padding:6px; margin-bottom:6px; transition:all 0.2s;">
      <div class="hand-label">${label} <span class="hand-value">${value}</span></div>
      <div class="hand">${hand.map(renderCard).join('')}</div>
    </div>`;
  }
 
  function render() {
    const dv = handValue(dealerHand.filter(c=>!c.faceDown));
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
    let betDisplay = splitHands
      ? `<span class="bet-label">Hand 1:</span><span class="bet-display">${formatMoney(splitBets[0])}</span>
         <span class="bet-label" style="margin-left:8px">Hand 2:</span><span class="bet-display">${formatMoney(splitBets[1])}</span>`
      : `<span class="bet-label">Bet:</span><span class="bet-display">${formatMoney(bet)}</span>`;
    let actionBtns = '';
    if (!gameOver) {
      actionBtns = `
        <button class="btn btn-gold" onclick="bjHit()">Hit</button>
        <button class="btn btn-outline" onclick="bjStand()">Stand</button>
        ${!splitHands && playerHand.length===2 && wallet>=bet ? `<button class="btn btn-red" onclick="bjDouble()">Double Down</button>` : ''}
        ${canSplit() ? `<button class="btn btn-purple" onclick="bjSplit()">✂ Split</button>` : ''}
      `;
    }
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
          <div class="chip chip-5" onclick="placeBet(5)">$5</div>
          <div class="chip chip-10" onclick="placeBet(10)">$10</div>
          <div class="chip chip-25" onclick="placeBet(25)">$25</div>
          <div class="chip chip-50" onclick="placeBet(50)">$50</div>
          <div class="chip chip-100" onclick="placeBet(100)">$100</div>
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
 
  window.placeBet = function(amount) {
    if (!gameOver || playerHand.length > 0 || splitHands) return;
    if (wallet < amount) { showToast('Not enough funds!'); return; }
    bet += amount; wallet -= amount;
    document.getElementById('wallet-display').textContent = formatMoney(wallet);
    render();
  };
  window.bjClearBet = function() {
    wallet += bet; bet = 0;
    document.getElementById('wallet-display').textContent = formatMoney(wallet);
    render();
  };
  window.bjDeal = function() {
    if (bet === 0 || !gameOver) return;
    deck = createDeck();
    playerHand = [deck.pop(), deck.pop()];
    dealerHand = [deck.pop(), {...deck.pop(), faceDown: true}];
    splitHands = null; splitBets = null; activeSplit = 0;
    gameOver = false;
    msg = 'Hit or Stand?'; msgClass = 'msg-info';
 
    const playerBJ = handValue(playerHand) === 21;
    // Check dealer blackjack by peeking at full hand
    const dealerBJ = handValue(dealerHand) === 21;
 
    if (dealerBJ) {
      // Reveal dealer hand immediately
      revealDealer();
      gameOver = true;
      if (playerBJ) {
        // Both have blackjack → Push
        updateWallet(bet);
        msg = '🤝 Both Blackjack! Push — bet returned.'; msgClass = 'msg-push';
        recordLoss('blackjack');
      } else {
        msg = '🃏 Dealer Blackjack! You lose.'; msgClass = 'msg-lose';
        recordLoss('blackjack');
      }
      bet = 0; render(); return;
    }
 
    // No dealer blackjack — if player has BJ, play out normally (wins 2.5x)
    if (playerBJ) { bjStand(); return; }
    render();
  };
  window.bjHit = function() {
    if (gameOver) return;
    if (splitHands) {
      splitHands[activeSplit].push(deck.pop());
      const pv = handValue(splitHands[activeSplit]);
      if (pv > 21) {
        if (activeSplit === 0) { activeSplit = 1; msg = '💀 Hand 1 busts! Now play Hand 2.'; msgClass = 'msg-lose'; render(); }
        else { bjResolveSplit(); }
      } else if (pv === 21) {
        if (activeSplit === 0) { activeSplit = 1; msg = '21 on Hand 1! Now play Hand 2.'; msgClass = 'msg-info'; render(); }
        else { bjResolveSplit(); }
      } else render();
    } else {
      playerHand.push(deck.pop());
      const pv = handValue(playerHand);
      if (pv > 21) {
        revealDealer(); msg = '💀 Bust! You lose.'; msgClass = 'msg-lose';
        gameOver = true; recordLoss('blackjack'); render();
      } else if (pv === 21) { bjStand(); }
      else render();
    }
  };
  window.bjStand = function() {
    if (gameOver) return;
    if (splitHands) {
      if (activeSplit === 0) { activeSplit = 1; msg = 'Hand 1 done. Now play Hand 2 — Hit or Stand?'; msgClass = 'msg-info'; render(); }
      else { bjResolveSplit(); }
    } else {
      revealDealer();
      while (handValue(dealerHand) < 17) dealerHand.push(deck.pop());
      const pv = handValue(playerHand), dv = handValue(dealerHand);
      gameOver = true;
      if (dv > 21 || pv > dv) {
        if (pv === 21 && playerHand.length === 2) {
          const bj = Math.floor(bet * 2.5);
          updateWallet(bj); msg = `🎉 Blackjack! You win ${formatMoney(bj)}!`; msgClass = 'msg-win';
        } else {
          updateWallet(bet * 2); msg = `🎉 You win ${formatMoney(bet*2)}!`; msgClass = 'msg-win';
        }
        recordWin('blackjack');
      } else if (pv === dv) {
        updateWallet(bet); msg = '🤝 Push! Bet returned.'; msgClass = 'msg-push';
        recordLoss('blackjack');
      } else {
        msg = `😔 Dealer wins with ${dv}.`; msgClass = 'msg-lose';
        recordLoss('blackjack');
      }
      bet = 0; render();
    }
  };
  function resolveHand(pv, dv, handBet) {
    if (pv > 21) return false;
    if (dv > 21 || pv > dv) return true;
    return false;
  }
  function bjResolveSplit() {
    if (gameOver) return;
    revealDealer();
    while (handValue(dealerHand) < 17) dealerHand.push(deck.pop());
    const dv = handValue(dealerHand);
    gameOver = true;
    const pv0 = handValue(splitHands[0]), pv1 = handValue(splitHands[1]);
    let won0 = false, push0 = false, won1 = false, push1 = false;
    if (pv0 <= 21) {
      if (dv > 21 || pv0 > dv) { updateWallet(splitBets[0]*2); won0 = true; }
      else if (pv0 === dv) { updateWallet(splitBets[0]); push0 = true; }
    }
    if (pv1 <= 21) {
      if (dv > 21 || pv1 > dv) { updateWallet(splitBets[1]*2); won1 = true; }
      else if (pv1 === dv) { updateWallet(splitBets[1]); push1 = true; }
    }
    const r0 = won0 ? '🎉 Win' : push0 ? '🤝 Push' : '😔 Lose';
    const r1 = won1 ? '🎉 Win' : push1 ? '🤝 Push' : '😔 Lose';
    const allWin = won0 && won1, allLose = !won0 && !push0 && !won1 && !push1;
    msg = `Hand 1: ${r0} (${pv0}) | Hand 2: ${r1} (${pv1}) | Dealer: ${dv}`;
    msgClass = allWin ? 'msg-win' : allLose ? 'msg-lose' : 'msg-push';
    // Streak: win only if both won, lose if both lost, push resets streak
    if (won0 || won1) recordWin('blackjack'); else recordLoss('blackjack');
    render();
  }
  window.bjDouble = function() {
    if (wallet < bet) { showToast('Not enough funds!'); return; }
    wallet -= bet; bet *= 2;
    document.getElementById('wallet-display').textContent = formatMoney(wallet);
    playerHand.push(deck.pop());
    if (handValue(playerHand) > 21) {
      revealDealer(); msg = '💀 Bust! You lose.'; msgClass = 'msg-lose';
      gameOver = true; bet = 0; recordLoss('blackjack'); render();
    } else bjStand();
  };
  window.bjSplit = function() {
    if (!canSplit()) return;
    wallet -= bet;
    document.getElementById('wallet-display').textContent = formatMoney(wallet);
    splitHands = [[playerHand[0], deck.pop()], [playerHand[1], deck.pop()]];
    splitBets = [bet, bet];
    activeSplit = 0;
    msg = 'Split! Playing Hand 1 — Hit or Stand?'; msgClass = 'msg-info';
    render();
  };
  window.bjNewGame = function() {
    bet = 0; playerHand = []; dealerHand = [];
    splitHands = null; splitBets = null; activeSplit = 0;
    gameOver = true;
    msg = 'Place your bet and deal!'; msgClass = 'msg-info';
    render();
  };
  function revealDealer() { dealerHand.forEach(c => { delete c.faceDown; }); }
  render();
}
 