import { 
  WebGLRenderer, PerspectiveCamera, Scene, AmbientLight, DirectionalLight, 
  Mesh, MeshStandardMaterial, BoxGeometry, CircleGeometry, MeshBasicMaterial,
  Group, Color, EdgesGeometry, LineSegments, LineBasicMaterial, BufferGeometry, Line, Vector3
} from 'three';
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

  private playerGroup: Group | null = null;
  private playerBody: Mesh | null = null;
  private shadowBlob: Mesh | null = null;
  private targetIndicator: LineSegments | null = null;
  private miningBeam: Line | null = null;
  private time = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.scene = new Scene();
    this.scene.background = new Color(0x050510);
    this.scene.add(new AmbientLight(0xffffff, 0.4));
    
    const dir = new DirectionalLight(0xffffff, 1.0);
    dir.position.set(20, 30, 10);
    this.scene.add(dir);

    this.camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.cameraController = new CameraController();
    
    this.createTargetIndicator();
    this.createMiningBeam();
  }

  private createTargetIndicator(): void {
    const geo = new BoxGeometry(1.05, 1.05, 1.05);
    const edges = new EdgesGeometry(geo);
    const mat = new LineBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.8 });
    this.targetIndicator = new LineSegments(edges, mat);
    this.targetIndicator.visible = false;
    this.scene.add(this.targetIndicator);
  }

  private createMiningBeam(): void {
    const geo = new BufferGeometry().setFromPoints([new Vector3(0, 0, 0), new Vector3(0, 0, 0)]);
    const mat = new LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8 });
    this.miningBeam = new Line(geo, mat);
    this.miningBeam.visible = false;
    this.scene.add(this.miningBeam);
  }

  createPlayerMesh(): void {
    if (this.playerGroup) return;

    this.playerGroup = new Group();
    
    // Main Body (Neon Orange)
    const bodyGeo = new BoxGeometry(0.6, 1.8, 0.6);
    const bodyMat = new MeshStandardMaterial({ 
      color: 0xff4400,
      emissive: 0xff2200,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.9
    });
    this.playerBody = new Mesh(bodyGeo, bodyMat);
    this.playerBody.userData.isPlayer = true;
    this.playerGroup.add(this.playerBody);

    // Cyan Visor
    const visorGeo = new BoxGeometry(0.45, 0.15, 0.1);
    const visorMat = new MeshBasicMaterial({ color: 0x00ffff });
    const visor = new Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.6, 0.3); 
    this.playerGroup.add(visor);

    this.scene.add(this.playerGroup);

    // Shadow blob
    const shadowGeo = new CircleGeometry(0.5, 16);
    const shadowMat = new MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.7 });
    this.shadowBlob = new Mesh(shadowGeo, shadowMat);
    this.shadowBlob.rotation.x = -Math.PI / 2;
    this.scene.add(this.shadowBlob);
  }

  updatePlayerMesh(pos: Vec3, moveDir: { x: number, y: number }, delta: number): void {
    this.time += delta;

    if (this.playerGroup && this.playerBody) {
      this.playerGroup.position.set(pos.x, pos.y - 0.9, pos.z);
      
      if (Math.abs(moveDir.x) > 0.01 || Math.abs(moveDir.y) > 0.01) {
        const angle = Math.atan2(moveDir.x, moveDir.y);
        this.playerGroup.rotation.y = angle;
      }

      (this.playerBody.material as MeshStandardMaterial).emissiveIntensity = 0.6 + Math.sin(this.time * 4) * 0.4;
    }

    if (this.shadowBlob && this.world) {
      let floorY = 0.01;
      const px = Math.floor(pos.x);
      const pz = Math.floor(pos.z);
      
      for (let y = Math.floor(pos.y - 0.8); y >= 0; y--) {
        if (this.world.getBlock(px, y, pz) !== 'air') {
          floorY = y + 1.02;
          break;
        }
      }
      this.shadowBlob.position.set(pos.x, floorY, pos.z);
      
      const dist = Math.max(0, pos.y - 0.9 - floorY);
      const opacity = Math.max(0, 0.7 * (1 - dist / 8));
      (this.shadowBlob.material as MeshBasicMaterial).opacity = opacity;
    }

    // Mining beam
    if (this.miningBeam && this.miningBeam.visible && this.targetIndicator && this.targetIndicator.visible) {
      const start = new Vector3(pos.x, pos.y, pos.z);
      const end = this.targetIndicator.position.clone();
      this.miningBeam.geometry.setFromPoints([start, end]);
      (this.miningBeam.material as LineBasicMaterial).opacity = 0.4 + Math.sin(this.time * 30) * 0.4;
    }

    // Target pulse
    if (this.targetIndicator && this.targetIndicator.visible) {
      const s = 1.0 + Math.sin(this.time * 10) * 0.05;
      this.targetIndicator.scale.set(s, s, s);
      (this.targetIndicator.material as LineBasicMaterial).opacity = 0.5 + Math.sin(this.time * 10) * 0.3;
    }
  }

  setTargetBlock(pos: Vec3 | null, isSmashing = false): void {
    if (this.targetIndicator) {
      if (pos) {
        this.targetIndicator.position.set(pos.x + 0.5, pos.y + 0.5, pos.z + 0.5);
        this.targetIndicator.visible = true;
      } else {
        this.targetIndicator.visible = false;
      }
    }
    if (this.miningBeam) {
      this.miningBeam.visible = isSmashing && !!pos;
    }
  }

  initWorld(missionId: string): World {
    for (let i = this.scene.children.length - 1; i >= 0; i--) {
      const child = this.scene.children[i];
      if (child.userData.isTerrain || child.userData.isGround || child.userData.isSpecial) {
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
    }

    const size: Vec3 = { x: 16, y: 8, z: 16 };
    this.world = new World(size);
    generateQuarry(this.world, missionId);
    buildScene(this.world, this.scene);

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
