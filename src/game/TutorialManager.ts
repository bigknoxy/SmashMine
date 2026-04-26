import type { Vec3 } from './types.js';

export interface TutorialStep {
  id: string;
  message: string;
  highlight?: string;
  position?: Vec3;
  trigger: 'move' | 'smash' | 'collect' | 'jump' | 'timer' | 'manual';
  condition?: () => boolean;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    message: 'Tap to START',
    trigger: 'manual',
  },
  {
    id: 'move',
    message: 'Swipe to MOVE',
    highlight: 'joystick-zone',
    trigger: 'move',
  },
  {
    id: 'smash',
    message: 'TAP to SMASH!',
    trigger: 'smash',
  },
  {
    id: 'collect',
    message: 'Collect LOOT! 📦',
    trigger: 'collect',
  },
  {
    id: 'goal',
    message: 'Get 25 💎 Shards! ⏱️',
    trigger: 'timer',
  },
];

export class TutorialManager {
  private currentStep = 0;
  private completed = false;
  private stepStartTime = 0;
  private skipRequested = false;

  constructor() {}

  isActive(): boolean {
    return !this.completed && this.currentStep < TUTORIAL_STEPS.length;
  }

  current(): TutorialStep | null {
    if (!this.isActive()) return null;
    return TUTORIAL_STEPS[this.currentStep];
  }

  message(): string {
    const step = this.current();
    return step?.message ?? '';
  }

  highlightId(): string | undefined {
    return this.current()?.highlight;
  }

  onAction(action: TutorialStep['trigger']): void {
    if (!this.isActive()) return;
    const step = TUTORIAL_STEPS[this.currentStep];
    if (step && step.trigger === action) {
      this.advance();
    }
  }

  advance(): void {
    this.currentStep++;
    this.stepStartTime = Date.now();
    if (this.currentStep >= TUTORIAL_STEPS.length) {
      this.completed = true;
    }
  }

  skip(): void {
    this.completed = true;
    this.skipRequested = true;
  }

  wasSkipped(): boolean {
    return this.skipRequested;
  }

  progress(): string {
    return `${this.currentStep + 1}/${TUTORIAL_STEPS.length}`;
  }

  getStepIndex(): number {
    return this.currentStep;
  }
}