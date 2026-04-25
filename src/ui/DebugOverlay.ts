export class DebugOverlay {
  private container: HTMLDivElement;
  private visible = false;
  private fps = 0;
  private frameCount = 0;
  private lastTime = performance.now();

  constructor() {
    this.container = document.createElement('div');
    this.container.style.cssText = 'position:fixed;top:8px;right:8px;background:rgba(0,0,0,0.7);color:#00ff88;font-family:monospace;padding:8px;border-radius:6px;font-size:11px;z-index:10000;pointer-events:none;line-height:1.4;display:none;';
    this.container.innerHTML = '<div>FPS: <span id="dbg-fps">--</span></div><div>Pos: <span id="dbg-pos">0,0,0</span></div>';
    document.body.appendChild(this.container);

    window.addEventListener('keydown', (e) => {
      if (e.key === '`') this.toggle(!this.visible);
    });
  }

  toggle(visible: boolean): void {
    this.visible = visible;
    this.container.style.display = visible ? 'block' : 'none';
  }

  update(delta: number, playerPos?: { x: number; y: number ; z: number }): void {
    if (!this.visible) return;
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastTime >= 500) {
      this.fps = Math.round(this.frameCount * 1000 / (now - this.lastTime));
      this.frameCount = 0;
      this.lastTime = now;
    }
    const fpsEl = this.container.querySelector('#dbg-fps');
    if (fpsEl) fpsEl.textContent = this.fps.toString();
    const posEl = this.container.querySelector('#dbg-pos');
    if (posEl && playerPos) posEl.textContent = `${playerPos.x.toFixed(1)},${playerPos.y.toFixed(1)},${playerPos.z.toFixed(1)}`;
  }
}

export const debugOverlay = new DebugOverlay();