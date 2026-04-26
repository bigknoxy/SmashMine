import { InputState } from '../game/types.js';

export class Joystick {
  private container: HTMLElement;
  private knob: HTMLElement;
  private inputState: InputState;
  
  private active = false;
  private touchId: number | null = null;
  private startPos = { x: 0, y: 0 };
  private currentPos = { x: 0, y: 0 };
  private maxRadius = 60;
  private smashQueued = false;
  private heldKeys = new Set<string>();
  
  constructor(inputState: InputState) {
    this.inputState = inputState;
    this.container = document.getElementById('joystick-zone') as HTMLElement;
    if (this.container) {
      this.knob = this.createKnob();
      this.init();
      console.log('[Joystick] ✅ Fully initialized');
    } else {
      console.error('[Joystick] ❌ joystick-zone NOT FOUND at constructor time');
    }
  }

  private createKnob(): HTMLElement {
    const knob = document.createElement('div');
    knob.id = 'joystick-knob';
    knob.style.cssText = `
      position: absolute;
      width: 50px;
      height: 50px;
      background: rgba(0, 255, 136, 0.6);
      border: 3px solid rgba(0, 255, 136, 0.9);
      border-radius: 50%;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      transition: transform 0.05s;
      box-shadow: 0 0 15px rgba(0, 255, 136, 0.5);
    `;
    if (this.container) {
      this.container.appendChild(knob);
    }
    return knob;
  }

  private init() {
    Object.assign(this.container.style, {
      position: 'absolute',
      left: '0',
      bottom: '0',
      width: '50%',
      height: '60%',
      zIndex: '100',
      touchAction: 'none',
      webkitTouchCallout: 'none',
      webkitUserSelect: 'none',
      userSelect: 'none',
      pointerEvents: 'auto'
    });
    
    this.container.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    this.container.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    this.container.addEventListener('touchend', (e) => this.onTouchEnd(e));
    this.container.addEventListener('touchcancel', (e) => this.onTouchEnd(e));

    this.container.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    this.container.addEventListener('pointermove', (e) => this.onPointerMove(e));
    this.container.addEventListener('pointerup', () => this.onPointerUp());
    this.container.addEventListener('pointercancel', () => this.onPointerUp());
    
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
    
    const smashBtn = document.getElementById('smash-btn');
    if (smashBtn) {
      smashBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.inputState.smash = true; }, { passive: false });
      smashBtn.addEventListener('touchend', () => { this.inputState.smash = false; });
      smashBtn.addEventListener('pointerdown', () => { this.inputState.smash = true; });
      smashBtn.addEventListener('pointerup', () => { this.inputState.smash = false; });
    }
    
    const specialBtn = document.getElementById('special-btn');
    if (specialBtn) {
      specialBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.inputState.special = true; }, { passive: false });
      specialBtn.addEventListener('touchend', () => { this.inputState.special = false; });
    }
  }

  private onTouchStart(e: TouchEvent) {
    e.preventDefault();
    if (this.active) return;
    
    const touch = e.changedTouches[0];
    this.touchId = touch.identifier;
    this.active = true;
    
    const rect = this.container.getBoundingClientRect();
    this.startPos = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
    this.currentPos = { x: touch.clientX, y: touch.clientY };
    
    this.updateKnobVisual(touch.clientX, touch.clientY);
    this.updateInputValues(touch.clientX, touch.clientY);
  }

  private onTouchMove(e: TouchEvent) {
    e.preventDefault();
    if (!this.active) return;
    
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.touchId) {
        this.currentPos = { x: touch.clientX, y: touch.clientY };
        this.updateKnobVisual(touch.clientX, touch.clientY);
        this.updateInputValues(touch.clientX, touch.clientY);
        break;
      }
    }
  }

  private onTouchEnd(e: TouchEvent) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === this.touchId) {
        this.reset();
        break;
      }
    }
  }

  private onPointerDown(e: PointerEvent) {
    if (this.active) return;
    
    this.touchId = e.pointerId;
    this.active = true;
    
    const rect = this.container.getBoundingClientRect();
    this.startPos = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
    this.currentPos = { x: e.clientX, y: e.clientY };
    this.container.setPointerCapture(e.pointerId);
    
    this.updateKnobVisual(e.clientX, e.clientY);
    this.updateInputValues(e.clientX, e.clientY);
  }

  private onPointerMove(e: PointerEvent) {
    if (!this.active) return;
    this.currentPos = { x: e.clientX, y: e.clientY };
    this.updateKnobVisual(e.clientX, e.clientY);
    this.updateInputValues(e.clientX, e.clientY);
  }

  private onPointerUp() {
    this.reset();
  }

  private updateKnobVisual(touchX: number, touchY: number) {
    const dx = touchX - this.startPos.x;
    const dy = touchY - this.startPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clampedDist = Math.min(dist, this.maxRadius);
    
    let displayX = 0, displayY = 0;
    if (dist > 0) {
      displayX = (dx / dist) * clampedDist;
      displayY = (dy / dist) * clampedDist;
    }
    
    this.knob.style.transform = `translate(calc(-50% + ${displayX}px), calc(-50% + ${displayY}px))`;
    this.knob.style.width = `${40 + clampedDist / this.maxRadius * 20}px`;
    this.knob.style.height = `${40 + clampedDist / this.maxRadius * 20}px`;
  }

  private updateInputValues(touchX: number, touchY: number) {
    const dx = touchX - this.startPos.x;
    const dy = touchY - this.startPos.y;
    
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clampedDist = Math.min(dist, this.maxRadius);
    
    let normX = 0, normY = 0;
    if (dist > 0.1) {
      normX = (dx / dist) * (clampedDist / this.maxRadius);
      normY = (dy / dist) * (clampedDist / this.maxRadius);
    }
    
    this.inputState.moveX = parseFloat(normX.toFixed(2));
    this.inputState.moveY = parseFloat(normY.toFixed(2));
  }

  private reset() {
    this.active = false;
    this.touchId = null;
    this.inputState.moveX = 0;
    this.inputState.moveY = 0;
    this.knob.style.transform = 'translate(-50%, -50%)';
    this.knob.style.width = '50px';
    this.knob.style.height = '50px';
  }

  private onKeyDown(e: KeyboardEvent) {
    this.heldKeys.add(e.code);

    switch (e.code) {
      case 'KeyA':
      case 'ArrowLeft':
        this.inputState.moveX = -1;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.inputState.moveX = 1;
        break;
      case 'KeyW':
      case 'ArrowUp':
        this.inputState.moveY = -1;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.inputState.moveY = 1;
        break;
      case 'Space':
        if (!this.smashQueued) {
          this.inputState.smash = true;
          this.smashQueued = true;
        }
        this.inputState.jump = true;
        break;
      case 'KeyE':
        this.inputState.special = true;
        break;
    }
  }

  private onKeyUp(e: KeyboardEvent) {
    this.heldKeys.delete(e.code);

    switch (e.code) {
      case 'KeyA':
      case 'ArrowLeft':
      case 'KeyD':
      case 'ArrowRight':
        this.inputState.moveX = 0;
        break;
      case 'KeyW':
      case 'ArrowUp':
      case 'KeyS':
      case 'ArrowDown':
        this.inputState.moveY = 0;
        break;
      case 'Space':
        this.inputState.jump = false;
        break;
      case 'KeyE':
        this.inputState.special = false;
        break;
    }
  }

  public updateInput() {
    if (this.heldKeys.size > 0) {
      let mx = 0, my = 0;
      if (this.heldKeys.has('KeyA') || this.heldKeys.has('ArrowLeft')) mx = -1;
      if (this.heldKeys.has('KeyD') || this.heldKeys.has('ArrowRight')) mx = 1;
      if (this.heldKeys.has('KeyW') || this.heldKeys.has('ArrowUp')) my = -1;
      if (this.heldKeys.has('KeyS') || this.heldKeys.has('ArrowDown')) my = 1;
      this.inputState.moveX = mx;
      this.inputState.moveY = my;
    } else if (!this.active) {
      this.inputState.moveX = 0;
      this.inputState.moveY = 0;
    }
    
    if (this.smashQueued) {
      this.smashQueued = false;
    }
  }
}