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

    // Adjust FOV and Zoom for portrait mode
    if (camera.aspect < 1) {
      camera.fov = 75;
      this.targetOffset.x = 3;
      this.targetOffset.y = 6;
      this.targetOffset.z = 8;
    } else {
      camera.fov = 60;
      this.targetOffset.x = 4;
      this.targetOffset.y = 8;
      this.targetOffset.z = 10;
    }
    camera.updateProjectionMatrix();

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
  }

  addShake(intensity: number): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }
}