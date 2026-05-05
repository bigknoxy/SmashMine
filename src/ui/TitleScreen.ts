import { saveSystem } from '../game/SaveSystem.js';

export class TitleScreen {
  private element: HTMLElement;
  private shown: boolean = false;
  private callback: (() => void) | null = null;
  private initialized: boolean = false;
  private todayDate: string = '';
  
  constructor() {
    this.element = document.getElementById('title-screen') as HTMLElement;
    this.showVersion();
    
    // Phase 2: Daily Seed - Get today's date
    this.todayDate = saveSystem.getTodayDateString();
    this.showDailySeed();
  }
  
  private showVersion() {
    const versionTag = document.getElementById('version-tag');
    if (versionTag && typeof __APP_VERSION__ !== 'undefined') {
      versionTag.textContent = `v${__APP_VERSION__}`;
    }
  }
  
  private showDailySeed() {
    this.todayDate = saveSystem.getTodayDateString();
    const existing = document.getElementById('daily-seed-text');
    if (existing) {
      existing.textContent = `Today's Quarry: ${this.todayDate}`;
      return;
    }
    const title = document.querySelector('.game-title');
    if (title) {
      const dailyTitle = document.createElement('div');
      dailyTitle.id = 'daily-seed-text';
      dailyTitle.textContent = `Today's Quarry: ${this.todayDate}`;
      dailyTitle.className = 'daily-seed';
      title.appendChild(dailyTitle);
    }
  }

  show() {
    if (this.shown) return;
    this.element.classList.remove('hidden');
    this.shown = true;
    this.showDailySeed();
    this.wireStartButton();
  }

  hide() {
    if (!this.shown) return;
    this.element.classList.add('hidden');
    this.shown = false;
  }

  onStart(callback: () => void) {
    this.callback = callback;
    this.wireStartButton();
  }

  private wireStartButton(): void {
    const startBtn = document.getElementById('start-btn');
    if (!startBtn) return;

    const handleStart = () => {
      if (this.callback) this.callback();
    };

    startBtn.onpointerdown = handleStart;
  }
}
