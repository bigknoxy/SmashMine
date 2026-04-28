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

export function updateTimer(elapsed: number, limit: number): void {
  const remaining = Math.max(0, limit - elapsed);
  const minutes = Math.floor(remaining / 60);
  const seconds = Math.floor(remaining % 60);
  const el = document.getElementById('timer-display');
  if (el) {
    el.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    if (elapsed / limit > 0.8) {
      el.classList.add('time-critical');
    } else {
      el.classList.remove('time-critical');
    }
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