import { PerspectiveCamera } from 'three';

interface CameraConfig {
  fov: number;
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  lerp: number;
}

const PORTRAIT_CONFIG: CameraConfig = { fov: 75, offsetX: 4, offsetY: 7, offsetZ: 9, lerp: 0.1 };
const LANDSCAPE_CONFIG: CameraConfig = { fov: 60, offsetX: 5, offsetY: 9, offsetZ: 11, lerp: 0.1 };

export class CameraController {
  private config: CameraConfig = { ...LANDSCAPE_CONFIG };
  private shakeIntensity = 0;
  private cameraPos = { x: 12, y: 12, z: 14 };

  update(playerPos: { x: number; y: number; z: number }, camera: PerspectiveCamera, delta: number): void {
    const cfg = this.config;
    const targetX = playerPos.x + cfg.offsetX;
    const targetY = playerPos.y + cfg.offsetY;
    const targetZ = playerPos.z + cfg.offsetZ;

    if (this.shakeIntensity > 0) {
      const sx = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      const sy = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      const sz = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      this.cameraPos.x += (targetX + sx - this.cameraPos.x) * cfg.lerp;
      this.cameraPos.y += (targetY + sy - this.cameraPos.y) * cfg.lerp;
      this.cameraPos.z += (targetZ + sz - this.cameraPos.z) * cfg.lerp;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - delta / 0.06);
    } else {
      this.cameraPos.x += (targetX - this.cameraPos.x) * cfg.lerp;
      this.cameraPos.y += (targetY - this.cameraPos.y) * cfg.lerp;
      this.cameraPos.z += (targetZ - this.cameraPos.z) * cfg.lerp;
    }

    camera.position.set(this.cameraPos.x, this.cameraPos.y, this.cameraPos.z);
    camera.lookAt(playerPos.x, playerPos.y, playerPos.z);
  }

  /** Called on resize — selects portrait or landscape config and applies FOV. */
  onResize(width: number, height: number, camera: PerspectiveCamera): void {
    this.config = height > width ? PORTRAIT_CONFIG : LANDSCAPE_CONFIG;
    camera.fov = this.config.fov;
    camera.updateProjectionMatrix();
  }

  addShake(intensity: number): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }
}