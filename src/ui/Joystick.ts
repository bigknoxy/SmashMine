import { InputState } from '../game/types.js';

const KNOB_SIZE_PX = 50;
const KNOB_MIN_SIZE_PX = 40;
const KNOB_GROW_PX = 20;

export class Joystick {
  private container: HTMLElement;
  private knob!: HTMLElement;
  private inputState: InputState;

  private active = false;
  private pointerId: number | null = null;
  private startPos = { x: 0, y: 0 };
  private maxRadius = 60;
  private smashQueued = false;
  private heldKeys = new Set<string>();

  constructor(inputState: InputState) {
    this.inputState = inputState;
    this.container = document.getElementById('joystick-zone') as HTMLElement;
    if (this.container) {
      this.knob = this.createKnob();
      this.init();
    }
  }

  private createKnob(): HTMLElement {
    const knob = document.createElement('div');
    knob.id = 'joystick-knob';
    knob.style.cssText = `
      position: absolute;
      width: ${KNOB_SIZE_PX}px;
      height: ${KNOB_SIZE_PX}px;
      background: rgba(0, 255, 136, 0.6);
      border: 3px solid rgba(0, 255, 136, 0.9);
      border-radius: 50%;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      box-shadow: 0 0 15px rgba(0, 255, 136, 0.5);
    `;
    this.container.appendChild(knob);
    return knob;
  }

  private init() {
    this.container.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    this.container.addEventListener('pointermove', (e) => this.onPointerMove(e));
    this.container.addEventListener('pointerup', () => this.onPointerUp());
    this.container.addEventListener('pointercancel', () => this.onPointerUp());

    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.forceReset();
    });
    window.addEventListener('blur', () => this.forceReset());

    this.bindActionButton('smash-btn', 'smash');
    this.bindActionButton('special-btn', 'special');
  }

  private bindActionButton(id: string, key: 'smash' | 'special') {
    const btn = document.getElementById(id);
    if (!btn) return;
    const activate = (e: Event) => { e.preventDefault(); this.inputState[key] = true; };
    const deactivate = () => { this.inputState[key] = false; };
    btn.addEventListener('pointerdown', activate);
    btn.addEventListener('pointerup', deactivate);
    btn.addEventListener('pointercancel', deactivate);
    btn.addEventListener('pointerleave', deactivate);
  }

  private onPointerDown(e: PointerEvent) {
    e.preventDefault();
    if (this.active) this.reset();

    this.pointerId = e.pointerId;
    this.active = true;

    const rect = this.container.getBoundingClientRect();
    this.startPos = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };

    try { this.container.setPointerCapture(e.pointerId); } catch {}

    this.updateKnobVisual(e.clientX, e.clientY);
    this.updateInputValues(e.clientX, e.clientY);
  }

  private onPointerMove(e: PointerEvent) {
    if (!this.active) return;
    if (this.pointerId !== null && e.pointerId !== this.pointerId) return;
    if (e.buttons === 0) { this.reset(); return; }

    this.updateKnobVisual(e.clientX, e.clientY);
    this.updateInputValues(e.clientX, e.clientY);
  }

  private onPointerUp() { this.reset(); }

  private computeDisplacement(clientX: number, clientY: number) {
    const dx = clientX - this.startPos.x;
    const dy = clientY - this.startPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clampedDist = Math.min(dist, this.maxRadius);
    return { dx, dy, dist, clampedDist };
  }

  private updateKnobVisual(clientX: number, clientY: number) {
    const { dx, dy, dist, clampedDist } = this.computeDisplacement(clientX, clientY);
    const displayX = dist > 0 ? (dx / dist) * clampedDist : 0;
    const displayY = dist > 0 ? (dy / dist) * clampedDist : 0;
    const size = KNOB_MIN_SIZE_PX + (clampedDist / this.maxRadius) * KNOB_GROW_PX;

    this.knob.style.transform = `translate(calc(-50% + ${displayX}px), calc(-50% + ${displayY}px))`;
    this.knob.style.width = `${size}px`;
    this.knob.style.height = `${size}px`;
  }

  private updateInputValues(clientX: number, clientY: number) {
    const { dx, dy, dist, clampedDist } = this.computeDisplacement(clientX, clientY);
    const normalizer = dist > 0.1 ? clampedDist / this.maxRadius : 0;
    this.inputState.moveX = parseFloat(((dx / (dist || 1)) * normalizer).toFixed(2));
    this.inputState.moveY = parseFloat(((dy / (dist || 1)) * normalizer).toFixed(2));
  }

  private reset() {
    if (this.pointerId !== null) {
      try { this.container.releasePointerCapture(this.pointerId); } catch {}
    }
    this.active = false;
    this.pointerId = null;
    this.inputState.moveX = 0;
    this.inputState.moveY = 0;
    this.knob.style.transform = 'translate(-50%, -50%)';
    this.knob.style.width = `${KNOB_SIZE_PX}px`;
    this.knob.style.height = `${KNOB_SIZE_PX}px`;
  }

  private forceReset() {
    this.reset();
    this.heldKeys.clear();
    this.inputState.smash = false;
    this.inputState.special = false;
    this.inputState.jump = false;
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
        if (!this.smashQueued) { this.inputState.smash = true; this.smashQueued = true; }
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

    if (this.smashQueued) this.smashQueued = false;
  }
}