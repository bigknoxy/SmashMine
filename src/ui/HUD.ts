export function show(): void {
  const hud = document.getElementById('hud');
  if (hud) hud.classList.remove('hidden');
}

export function hide(): void {
  const hud = document.getElementById('hud');
  if (hud) hud.classList.add('hidden');
}

export function updateShards(current: number, target: number): void {
  const el = document.getElementById('shard-count');
  if (el) el.textContent = `${current}/${target}`;
}

export function updateCoins(coins: number): void {
  const el = document.getElementById('coin-count');
  if (el) el.textContent = coins.toString();
}

export function updateTokens(tokens: number): void {
  const el = document.getElementById('token-count');
  if (el) el.textContent = tokens.toString();
}

export function updateTimer(elapsed: number, limit: number): void {
  const remaining = Math.max(0, limit - elapsed);
  const minutes = Math.floor(remaining / 60);
  const seconds = Math.floor(remaining % 60);
  const el = document.getElementById('timer-display');
  if (el) {
    el.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Phase 2: Timer tension - Color shifts based on remaining time
    const ratio = remaining / limit;
    el.classList.remove('time-warning', 'time-critical', 'time-pulse');
    
    if (ratio <= 0.167) { // ≤0:10 (10 seconds = 16.7% of 60)
      el.classList.add('time-pulse');
    } else if (ratio <= 0.5) { // ≤0:30 (30 seconds = 50%)
      el.classList.add('time-critical');
    } else if (ratio <= 1) { // ≤1:00
      el.classList.add('time-warning');
    }
  }
}

export function showNearMiss(): void {
  // Phase 2: Timer tension - Near-miss messaging on 24/25 shards
  const el = document.getElementById('timer-display');
  if (el && !el.classList.contains('near-miss')) {
    const msg = document.createElement('span');
    msg.id = 'near-miss-msg';
    msg.textContent = 'NEAR MISS!';
    msg.className = 'near-miss-msg';
    el.appendChild(msg);
    el.classList.add('near-miss');
  }
}

export function hideNearMiss(): void {
  const el = document.getElementById('timer-display');
  if (el) {
    el.classList.remove('near-miss');
    const msg = document.getElementById('near-miss-msg');
    if (msg) msg.remove();
  }
}

export function updateLifetime(totalShards: number, totalCoins: number, missions: number): void {
  const el = document.getElementById('lifetime-stats');
  if (el) {
    el.textContent = `⭐${missions} 💎${totalShards} 💰${totalCoins}`;
  }
}

let tutorialTimeout: ReturnType<typeof setTimeout> | null = null;

export function showTutorial(message: string, progress: string): void {
  const el = document.getElementById('tutorial-toast');
  if (el && message) {
    el.textContent = message;
    el.classList.remove('hidden');
    if (tutorialTimeout) clearTimeout(tutorialTimeout);
    tutorialTimeout = setTimeout(() => {
      el.classList.add('hidden');
    }, 3000);
  }
}

export function hideTutorial(): void {
  const el = document.getElementById('tutorial-toast');
  if (el) el.classList.add('hidden');
}

// Phase 2: Combo meter - HUD display with scaling animation
let comboTimeout: ReturnType<typeof setTimeout> | null = null;

export function updateCombo(comboCount: number, comboWindow: number): void {
  const el = document.getElementById('combo-display');
  if (!el) return;
  
  if (comboCount > 0) {
    const multiplier = Math.min(1 + comboCount * 0.1, 3.0).toFixed(1);
    el.textContent = `x${multiplier}`;
    el.classList.add('combo-active');
    el.style.transform = 'scale(1.3)';
    
    // Reset scale after animation
    setTimeout(() => {
      el.style.transform = 'scale(1)';
    }, 100);
    
    // Auto-hide after combo window
    if (comboTimeout) clearTimeout(comboTimeout);
    comboTimeout = setTimeout(() => {
      el.classList.remove('combo-active');
    }, comboWindow);
  } else {
    el.classList.remove('combo-active');
  }
}

export function hideCombo(): void {
  const el = document.getElementById('combo-display');
  if (el) el.classList.remove('combo-active');
}