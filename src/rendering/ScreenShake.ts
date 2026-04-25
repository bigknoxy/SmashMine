import type { PerspectiveCamera } from 'three';
import { Vector3 } from 'three';

export class ScreenShake {
  private intensity = 0;
  private duration = 0;
  private remainingTime = 0;
  private cameraOffset = new Vector3();
  private targetPosition = new Vector3();
  private isShaking = false;

  shake(intensity: number, duration: number = 0.3): void {
    this.intensity = intensity;
    this.duration = duration;
    this.remainingTime = duration;
    this.isShaking = true;
  }

  update(camera: PerspectiveCamera, delta: number): void {
    if (!this.isShaking) return;
    this.remainingTime -= delta;
    if (this.remainingTime <= 0) {
      this.intensity = 0;
      this.isShaking = false;
      camera.position.copy(this.targetPosition);
      return;
    }
    const decay = Math.exp(-3 * delta);
    this.intensity *= decay;
    const randomX = (Math.random() - 0.5) * 2 * this.intensity;
    const randomY = (Math.random() - 0.5) * 2 * this.intensity;
    const randomZ = (Math.random() - 0.5) * 2 * this.intensity;
    camera.position.set(
      this.targetPosition.x + randomX,
      this.targetPosition.y + randomY,
      this.targetPosition.z + randomZ
    );
  }

  setTargetPosition(x: number, y: number, z: number): void {
    this.targetPosition.set(x, y, z);
  }

  smashShake(): void { this.shake(0.15, 0.2); }
  bigSmashShake(): void { this.shake(0.4, 0.5); }
  upgradeShake(): void { this.shake(0.2, 0.3); }
  opModeShake(): void { this.shake(0.6, 0.8); }
}