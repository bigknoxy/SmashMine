import { WebGLRenderer, PerspectiveCamera, Scene, AmbientLight, DirectionalLight, Mesh, MeshLambertMaterial, BoxGeometry } from 'three';
import { CameraController } from './CameraController.js';
import type { Vec3 } from '../game/types.js';
import { World } from '../world/World.js';
import { buildScene } from './SceneBuilder.js';
import { generateQuarry } from '../world/BlockSpawner.js';

export class Renderer {
  canvas: HTMLCanvasElement;
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  cameraController: CameraController;
  world: World | null = null;

  private playerMesh: Mesh | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.scene = new Scene();
    this.scene.add(new AmbientLight(0xffffff, 0.5));
    const dir = new DirectionalLight(0xffffff, 0.6);
    dir.position.set(16, 16, 16);
    this.scene.add(dir);

    this.camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(12, 12, 14);
    this.camera.lookAt(8, 4, 8);
    this.cameraController = new CameraController();
  }

  createPlayerMesh(): void {
    const geo = new BoxGeometry(0.6, 1.8, 0.6);
    const mat = new MeshLambertMaterial({ color: 0x44aaff });
    this.playerMesh = new Mesh(geo, mat);
    this.playerMesh.userData.isPlayer = true;
    this.scene.add(this.playerMesh);
  }

  updatePlayerMesh(pos: Vec3): void {
    if (this.playerMesh) {
      this.playerMesh.position.set(pos.x, pos.y - 0.9, pos.z);
    }
  }

  initWorld(missionId: string): World {
    for (let i = this.scene.children.length - 1; i >= 0; i--) {
      const child = this.scene.children[i];
      if ((child as any).geometry) (child as any).geometry.dispose();
      if ((child as any).material) {
        if (Array.isArray((child as any).material)) {
          (child as any).material.forEach((m: any) => m.dispose());
        } else {
          ((child as any).material as any).dispose();
        }
      }
      this.scene.remove(child);
    }
    this.scene.add(new AmbientLight(0xffffff, 0.5));
    const dir = new DirectionalLight(0xffffff, 0.6);
    dir.position.set(16, 16, 16);
    this.scene.add(dir);

    const size: Vec3 = { x: 16, y: 8, z: 16 };
    this.world = new World(size);
    generateQuarry(this.world, missionId);
    buildScene(this.world, this.scene);

    this.camera.position.set(12, 12, 14);
    this.camera.lookAt(8, 4, 8);
    return this.world;
  }

  rebuildTerrain(): void {
    if (!this.world) return;
    const toRemove: any[] = [];
    for (const child of this.scene.children) {
      if (child.userData.isTerrain || child.userData.isGround || child.userData.isSpecial) {
        toRemove.push(child);
      }
    }
    for (const child of toRemove) {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m: any) => m.dispose());
        else child.material.dispose();
      }
      this.scene.remove(child);
    }
    buildScene(this.world, this.scene);
  }

  setPlayerPos(pos: Vec3, delta: number): void {
    this.cameraController.update(pos, this.camera, delta);
  }

  addShake(intensity: number): void {
    this.cameraController.addShake(intensity);
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}