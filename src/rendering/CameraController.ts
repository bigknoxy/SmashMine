import * as THREE from 'three';

// Fix 2: camera collision raycast — never clip through geometry
const CAMERA_RADIUS = 0.3;
const BASE_OFFSET = new THREE.Vector3(5, 9, 11); // Landscape offset
const BASE_FOV = 60;
const LERP_FACTOR = 0.1; // Smooth camera follow

export class CameraController {
  private shakeIntensity = 0;
  private cameraPos = new THREE.Vector3(); // Current camera position (may be lerping)
  private desiredPos = new THREE.Vector3(); // Target position after collision
  private raycaster = new THREE.Raycaster(); // Reuse to reduce GC
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
    const targetPos = playerVec.clone().add(BASE_OFFSET);

    // Apply raycast collision push-out to desiredPos
    this.applyCollision(playerVec, targetPos);
    
    // Store the desired position for lerping
    this.desiredPos.copy(targetPos);

    // Smooth lerp toward desired position
    this.cameraPos.lerp(this.desiredPos, LERP_FACTOR);

    // Apply shake on top of lerped position
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

  private applyCollision(playerVec: THREE.Vector3, targetPos: THREE.Vector3): void {
    const dirToCamera = targetPos.clone().sub(playerVec).normalize();
    const distanceToTarget = playerVec.distanceTo(targetPos);

    this.raycaster.set(playerVec, dirToCamera);
    this.raycaster.far = distanceToTarget;

    const hits = this.raycaster.intersectObjects(this.collidableMeshes, false);

    if (hits.length > 0) {
      const safeDistance = Math.max(0.5, hits[0].distance - CAMERA_RADIUS);
      this.desiredPos.copy(playerVec).addScaledVector(dirToCamera, safeDistance);
    } else {
      this.desiredPos.copy(targetPos);
    }
  }

  /** Initialize camera position based on player position (called when mission starts) */
  initializeCameraPos(playerPos: { x: number; y: number; z: number }): void {
    const playerVec = new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z);
    this.cameraPos.copy(playerVec.clone().add(BASE_OFFSET));
    this.desiredPos.copy(this.cameraPos);
  }

  /** Called on init/resize — adapt FOV for portrait if orientation lock fails */
  onResize(width: number, height: number, camera: THREE.PerspectiveCamera): void {
    const aspect = width / height;
    camera.aspect = aspect;

    // If in portrait mode (aspect < 1), increase FOV to show more horizontally
    // Cap at 90° to prevent fish-eye distortion
    if (aspect < 1) {
      camera.fov = Math.min(BASE_FOV / aspect, 90);
    } else {
      camera.fov = BASE_FOV;
    }

    camera.updateProjectionMatrix();
  }

  addShake(intensity: number): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }
}
