import * as THREE from 'three';

// Fix 2: camera collision raycast — never clip through geometry
const CAMERA_RADIUS = 0.3;
const BASE_OFFSET = new THREE.Vector3(5, 9, 11); // Landscape-only offset
const BASE_FOV = 60;

export class CameraController {
  private shakeIntensity = 0;
  private cameraPos = new THREE.Vector3(12, 12, 14);
  private collidableMeshes: THREE.Object3D[] = [];

  /** Set collidable meshes (block meshes from chunk mesher) for raycast collision */
  setCollidableMeshes(meshes: THREE.Object3D[]): void {
    this.collidableMeshes = meshes;
  }

  update(
    playerPos: { x: number; y: number; z: number },
    camera: THREE.PerspectiveCamera,
    delta: number
  ): void {
    const playerVec = new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z);
    const desiredPos = playerVec.clone().add(BASE_OFFSET);

    // Apply raycast collision push-out
    this.applyCollision(playerVec, desiredPos, camera);

    // Apply shake on top of collision-adjusted position
    if (this.shakeIntensity > 0) {
      const intensity = this.shakeIntensity;
      camera.position.set(
        this.cameraPos.x + (Math.random() - 0.5) * 2 * intensity,
        this.cameraPos.y + (Math.random() - 0.5) * 2 * intensity,
        this.cameraPos.z + (Math.random() - 0.5) * 2 * intensity
      );
      this.shakeIntensity = Math.max(0, this.shakeIntensity - delta / 0.06);
    } else {
      camera.position.copy(this.cameraPos);
    }

    camera.lookAt(playerVec);
  }

  private applyCollision(playerPos: THREE.Vector3, desiredPos: THREE.Vector3, camera: THREE.PerspectiveCamera): void {
    const dirToCamera = desiredPos.clone().sub(playerPos).normalize();
    const distanceToDesired = playerPos.distanceTo(desiredPos);

    const raycaster = new THREE.Raycaster();
    raycaster.set(playerPos, dirToCamera);
    raycaster.far = distanceToDesired;

    const hits = raycaster.intersectObjects(this.collidableMeshes, false);

    if (hits.length > 0) {
      const safeDistance = Math.max(0.5, hits[0].distance - CAMERA_RADIUS);
      this.cameraPos.copy(playerPos).addScaledVector(dirToCamera, safeDistance);
    } else {
      this.cameraPos.copy(desiredPos);
    }
  }

  /** Called on init/resize — force landscape FOV (Path A: orientation lock) */
  onResize(_width: number, _height: number, camera: THREE.PerspectiveCamera): void {
    camera.fov = BASE_FOV;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }

  addShake(intensity: number): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }
}