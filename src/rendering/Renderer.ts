import {
  WebGLRenderer, PerspectiveCamera, Scene, AmbientLight, DirectionalLight,
  Mesh, MeshStandardMaterial, BoxGeometry, CircleGeometry, MeshBasicMaterial,
  Group, Color, EdgesGeometry, LineSegments, LineBasicMaterial, BufferGeometry, Line, Vector3,
  type Object3D,
} from 'three';
import { CameraController } from './CameraController.js';
import type { Vec3 } from '../game/types.js';
import { World } from '../world/World.js';
import { buildScene } from './SceneBuilder.js';
import { generateQuarry } from '../world/BlockSpawner.js';

/** Tags used to identify scene objects for selective removal/rebuild. */
const TERRAIN_TAGS = ['isTerrain', 'isGround', 'isSpecial'] as const;

function disposeObject3D(obj: any): void {
  if (obj.geometry) obj.geometry.dispose();
  if (obj.material) {
    if (Array.isArray(obj.material)) {
      obj.material.forEach((m: any) => m.dispose());
    } else {
      obj.material.dispose();
    }
  }
}

export class Renderer {
  canvas: HTMLCanvasElement;
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  cameraController: CameraController;
  world: World | null = null;

  private playerGroup: Group | null = null;
  private playerBody: MeshStandardMaterial | null = null;
  private playerSilhouette: MeshBasicMaterial | null = null;
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

    this.targetIndicator = this.buildTargetIndicator();
    this.miningBeam = this.buildMiningBeam();
  }

  // ── Scene object builders ──────────────────────────────────────────

  private buildTargetIndicator(): LineSegments {
    const edges = new EdgesGeometry(new BoxGeometry(1.05, 1.05, 1.05));
    const mat = new LineBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.8 });
    const mesh = new LineSegments(edges, mat);
    mesh.visible = false;
    this.scene.add(mesh);
    return mesh;
  }

  private buildMiningBeam(): Line {
    const geo = new BufferGeometry().setFromPoints([new Vector3(), new Vector3()]);
    const mat = new LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8 });
    const line = new Line(geo, mat);
    line.visible = false;
    this.scene.add(line);
    return line;
  }

  // ── Player mesh ────────────────────────────────────────────────────

  createPlayerMesh(): void {
    if (this.playerGroup) return;

    const group = new Group();

    const bodyMat = new MeshStandardMaterial({
      color: 0xff6600, // Brighter orange
      emissive: 0xff3300, 
      emissiveIntensity: 1.0,
      roughness: 0.1, 
      metalness: 0.8,
    });
    const body = new Mesh(new BoxGeometry(0.8, 1.8, 0.8), bodyMat); // Thicker bot (0.8 instead of 0.6)
    body.userData.isPlayer = true;
    group.add(body);

    const visor = new Mesh(new BoxGeometry(0.45, 0.15, 0.1), new MeshBasicMaterial({ color: 0x00ffff }));
    visor.position.set(0, 0.6, 0.4); // Moved slightly forward for better visibility
    group.add(visor);

    // X-Ray Silhouette (Visible through walls)
    const silhouetteMat = new MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.3,
      depthTest: false,
      depthWrite: false,
    });
    const silhouette = new Mesh(body.geometry, silhouetteMat);
    group.add(silhouette);
    this.playerSilhouette = silhouetteMat;

    this.scene.add(group);
    this.playerGroup = group;
    this.playerBody = bodyMat;

    const shadow = new Mesh(
      new CircleGeometry(0.5, 16),
      new MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.7 }),
    );
    shadow.rotation.x = -Math.PI / 2;
    this.scene.add(shadow);
    this.shadowBlob = shadow;
  }

  // ── Per-frame updates ───────────────────────────────────────────────

  updatePlayerMesh(pos: Vec3, moveDir: { x: number; y: number }, delta: number): void {
    this.time += delta;

    this.updatePlayerPosition(pos, moveDir);
    this.updateShadowBlob(pos);
    this.updateMiningBeam(pos);
    this.updateTargetPulse();
  }

  private updatePlayerPosition(pos: Vec3, moveDir: { x: number; y: number }): void {
    if (!this.playerGroup) return;
    this.playerGroup.position.set(pos.x, pos.y - 0.9, pos.z);

    if (Math.abs(moveDir.x) > 0.01 || Math.abs(moveDir.y) > 0.01) {
      this.playerGroup.rotation.y = Math.atan2(moveDir.x, moveDir.y);
    }

    if (this.playerBody) {
      this.playerBody.emissiveIntensity = 0.8 + Math.sin(this.time * 6) * 0.4;
    }
    if (this.playerSilhouette) {
      this.playerSilhouette.opacity = 0.2 + Math.sin(this.time * 6) * 0.1;
    }
  }

  private updateShadowBlob(pos: Vec3): void {
    if (!this.shadowBlob || !this.world) return;

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
    (this.shadowBlob.material as MeshBasicMaterial).opacity = Math.max(0, 0.7 * (1 - dist / 8));
  }

  private updateMiningBeam(pos: Vec3): void {
    if (!this.miningBeam || !this.miningBeam.visible || !this.targetIndicator?.visible) return;
    const start = new Vector3(pos.x, pos.y, pos.z);
    this.miningBeam.geometry.setFromPoints([start, this.targetIndicator.position.clone()]);
    (this.miningBeam.material as LineBasicMaterial).opacity = 0.4 + Math.sin(this.time * 30) * 0.4;
  }

  private updateTargetPulse(): void {
    if (!this.targetIndicator?.visible) return;
    const s = 1.0 + Math.sin(this.time * 10) * 0.05;
    this.targetIndicator.scale.set(s, s, s);
    (this.targetIndicator.material as LineBasicMaterial).opacity = 0.5 + Math.sin(this.time * 10) * 0.3;
  }

  // ── Target / smash beam ─────────────────────────────────────────────

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

  // ── World / terrain ─────────────────────────────────────────────────

  initWorld(missionId: string, dailySeed?: string): World {
    this.removeTerrain();

    const size: Vec3 = { x: 16, y: 8, z: 16 };
    this.world = new World(size);
    // Phase 2: Daily seed - use daily seed if provided for consistent daily worlds
    const seed = dailySeed || missionId;
    generateQuarry(this.world, seed);
    buildScene(this.world, this.scene);
    this.updateCameraCollidables();
    return this.world;
  }

  rebuildTerrain(): void {
    if (!this.world) return;
    this.removeTerrain();
    buildScene(this.world, this.scene);
    this.updateCameraCollidables();
  }

  private updateCameraCollidables(): void {
    const meshes: Object3D[] = [];
    this.scene.traverse((child) => {
      if (TERRAIN_TAGS.some((tag) => child.userData[tag])) {
        meshes.push(child);
      }
    });
    this.cameraController.setCollidableMeshes(meshes);
  }

  private removeTerrain(): void {
    const toRemove = this.scene.children.filter(
      (child) => TERRAIN_TAGS.some((tag) => child.userData[tag]),
    );
    for (const child of toRemove) {
      disposeObject3D(child);
      this.scene.remove(child);
    }
  }

  // ── Camera delegation ───────────────────────────────────────────────

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
    this.cameraController.onResize(width, height, this.camera);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}
