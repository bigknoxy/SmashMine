import { InputState } from '../game/types.js';

export class Joystick {
  private container: HTMLElement;
  private inputState: InputState;
  
  private startX: number = 0;
  private startY: number = 0;
  private active: boolean = false;
  private joystickCenter: { x: number; y: number } = { x: 0, y: 0 };
  private heldKeys = new Set<string>();
  private smashQueued = false;
  
  constructor(inputState: InputState) {
    this.container = document.getElementById('joystick-zone') as HTMLElement;
    this.inputState = inputState;
    this.init();
  }
  
  private init() {
    this.container.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    this.container.addEventListener('pointermove', (e) => this.onPointerMove(e));
    this.container.addEventListener('pointerup', () => this.onPointerUp());
    this.container.addEventListener('pointercancel', () => this.onPointerUp());
    
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
    
    const smashBtn = document.getElementById('smash-btn');
    if (smashBtn) {
      smashBtn.addEventListener('pointerdown', () => this.inputState.smash = true);
      smashBtn.addEventListener('pointerup', () => this.inputState.smash = false);
      smashBtn.addEventListener('pointercancel', () => this.inputState.smash = false);
    }
    
    const specialBtn = document.getElementById('special-btn');
    if (specialBtn) {
      specialBtn.addEventListener('pointerdown', () => this.inputState.special = true);
      specialBtn.addEventListener('pointerup', () => this.inputState.special = false);
      specialBtn.addEventListener('pointercancel', () => this.inputState.special = false);
    }
  }
  
  private onPointerDown(e: PointerEvent) {
    this.active = true;
    this.container.setPointerCapture(e.pointerId);
    
    const rect = this.container.getBoundingClientRect();
    this.joystickCenter = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
    
    this.updateInputValues(e);
  }
  
  private onPointerMove(e: PointerEvent) {
    if (!this.active) return;
    this.updateInputValues(e);
  }
  
  private onPointerUp() {
    this.active = false;
    this.inputState.moveX = 0;
    this.inputState.moveY = 0;
  }
  
  private updateInputValues(e: PointerEvent) {
    const dx = e.clientX - this.joystickCenter.x;
    const dy = e.clientY - this.joystickCenter.y;
    
    const maxRadius = 50;
    const distance = Math.min(Math.sqrt(dx * dx + dy * dy), maxRadius);
    const angle = Math.atan2(dy, dx);
    
    const normalizedX = (Math.cos(angle) * distance) / maxRadius;
    const normalizedY = (Math.sin(angle) * distance) / maxRadius;
    
    this.inputState.moveX = parseFloat(normalizedX.toFixed(2));
    this.inputState.moveY = parseFloat(normalizedY.toFixed(2));
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
        if (this.heldKeys.size === 0) this.inputState.moveX = 0;
        break;
      case 'KeyW':
      case 'ArrowUp':
      case 'KeyS':
      case 'ArrowDown':
        if (this.heldKeys.size === 0) this.inputState.moveY = 0;
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
    // Recompute from held keys if any
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
    
    // Reset smash flag if it was queued
    if (this.smashQueued) {
      // Game.ts will reset smash to false after consuming it
      this.smashQueued = false;
    }
  }
}
