export class TitleScreen {
  private element: HTMLElement;
  private shown: boolean = false;
  private callback: (() => void) | null = null;
  private initialized: boolean = false;
  
  constructor() {
    this.element = document.getElementById('title-screen') as HTMLElement;
    this.showVersion();
  }
  
  private showVersion() {
    const versionTag = document.getElementById('version-tag');
    if (versionTag && typeof __APP_VERSION__ !== 'undefined') {
      versionTag.textContent = `v${__APP_VERSION__}`;
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
