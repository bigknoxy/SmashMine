import type { PerspectiveCamera } from 'three';

export class CameraController {
  private targetOffset = { x: 4, y: 8, z: 10 };
  private lerpFactor = 0.1;
  private shakeIntensity = 0;
  private shakeDecay = 0.3;
  private cameraPos = { x: 12, y: 12, z: 14 };
  private initialized = false;

  update(playerPos: { x: number; y: number; z: number }, camera: PerspectiveCamera, delta: number): void {
    const targetX = playerPos.x + this.targetOffset.x;
    const targetY = playerPos.y + this.targetOffset.y;
    const targetZ = playerPos.z + this.targetOffset.z;

    if (this.shakeIntensity > 0) {
      const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      const shakeY = (Math.random() - 0.5) * this.shakeIntensity;
      const shakeZ = (Math.random() - 0.5) * this.shakeIntensity;
      this.cameraPos.x += (targetX + shakeX - this.cameraPos.x) * this.lerpFactor;
      this.cameraPos.y += (targetY + shakeY - this.cameraPos.y) * this.lerpFactor;
      this.cameraPos.z += (targetZ + shakeZ - this.cameraPos.z) * this.lerpFactor;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - delta / this.shakeDecay * 5);
    } else {
      this.cameraPos.x += (targetX - this.cameraPos.x) * this.lerpFactor;
      this.cameraPos.y += (targetY - this.cameraPos.y) * this.lerpFactor;
      this.cameraPos.z += (targetZ - this.cameraPos.z) * this.lerpFactor;
    }

    camera.position.set(this.cameraPos.x, this.cameraPos.y, this.cameraPos.z);
    camera.lookAt(playerPos.x, playerPos.y, playerPos.z);
    if (!this.initialized) {
      camera.fov = 60;
      camera.updateProjectionMatrix();
      this.initialized = true;
    }
  }

  addShake(intensity: number): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }
}