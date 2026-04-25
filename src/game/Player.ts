import type { Vec3, InputState, UpgradeId } from './types.js';
import type { World } from '../world/World.js';

export class Player {
  private static readonly SPEED = 6;
  private static readonly GRAVITY = -18;
  private static readonly JUMP_VEL = 8;
  private static readonly HEIGHT = 1.8;
  private static readonly WIDTH = 0.6;

  position: Vec3;
  velocity: Vec3;
  onGround = true;
  upgrades: Map<UpgradeId, number> = new Map();

  constructor(world: World) {
    this.position = { x: world.size.x / 2, y: world.size.y - 2, z: world.size.z / 2 };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.onGround = false;
  }

  hasUpgrade(id: UpgradeId): boolean { return this.upgrades.has(id); }
  getUpgradeLevel(id: UpgradeId): number { return this.upgrades.get(id) || 0; }
  applyUpgrade(id: UpgradeId): void { this.upgrades.set(id, (this.upgrades.get(id) || 0) + 1); }

  resetPosition(): void {
    this.position = { x: 8, y: 7, z: 8 };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.onGround = true;
  }

  update(delta: number, input: InputState, world: World): void {
    this.velocity.y += Player.GRAVITY * delta;
    this.velocity.x = input.moveX * Player.SPEED;
    this.velocity.z = input.moveY * Player.SPEED;

    const newPos = { ...this.position };

    newPos.x += this.velocity.x * delta;
    if (this.collides(newPos, world)) { newPos.x = this.position.x; this.velocity.x = 0; }

    newPos.z += this.velocity.z * delta;
    if (this.collides(newPos, world)) { newPos.z = this.position.z; this.velocity.z = 0; }

    newPos.y += this.velocity.y * delta;
    if (this.collides(newPos, world)) {
      if (this.velocity.y < 0) {
        this.onGround = true;
        newPos.y = Math.ceil(newPos.y - Player.HEIGHT) + Player.HEIGHT;
      }
      this.velocity.y = 0;
    } else {
      this.onGround = false;
    }

    if (newPos.y < -5) { this.resetPosition(); return; }
    this.position = newPos;

    if (input.jump && this.onGround) {
      this.velocity.y = Player.JUMP_VEL;
      this.onGround = false;
      input.jump = false;
    }
  }

  getPosition(): Vec3 { return { ...this.position }; }

  private collides(pos: Vec3, world: World): boolean {
    const hw = Player.WIDTH / 2;
    const minX = Math.floor(pos.x - hw);
    const maxX = Math.floor(pos.x + hw);
    const minY = Math.floor(pos.y - Player.HEIGHT);
    const maxY = Math.floor(pos.y);
    const minZ = Math.floor(pos.z - hw);
    const maxZ = Math.floor(pos.z + hw);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const block = world.getBlock(x, y, z);
          if (block !== 'air') return true;
        }
      }
    }
    return false;
  }
}