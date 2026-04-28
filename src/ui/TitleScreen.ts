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
    const title = document.getElementById('game-title');
    if (title) {
      // Phase 2: Daily Seed - Show "Today's Quarry" on title screen
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
  }
  
  hide() {
    if (!this.shown) return;
    this.element.classList.add('hidden');
    this.shown = false;
  }
  
  onStart(callback: () => void) {
    this.callback = callback;
    
    const startBtn = document.getElementById('start-btn');
    if (!startBtn) return;
    
    const handleStart = (e: PointerEvent) => {
      if (!this.initialized) {
        this.initializeAudio();
        this.initialized = true;
      }
      if (this.callback) {
        this.callback();
      }
      startBtn.removeEventListener('pointerdown', handleStart);
    };
    
    startBtn.addEventListener('pointerdown', handleStart);
  }
  
  private initializeAudio() {
    if (typeof AudioContext !== 'undefined') {
      const audioContext = new AudioContext();
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
    }
  }
}
