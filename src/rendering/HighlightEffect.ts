import { InstancedMesh, Color, Matrix4, Vector3 } from 'three';
import type { Scene } from 'three';

interface HighlightInfo {
  instanceId: number;
  originalColor: Color;
  targetColor: Color;
  startTime: number;
  duration: number;
}

export class HighlightEffect {
  private highlights: Map<number, HighlightInfo> = new Map();
  private scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  hasActiveHighlights(): boolean {
    return this.highlights.size > 0;
  }

  highlightRareBlocks(duration: number = 3): void {
    const imesh = this.findInstancedMesh();
    if (!imesh) return;

    const color = new Color();
    for (let i = 0; i < imesh.count; i++) {
      imesh.getColorAt(i, color);
      const isSpecial = color.r > 0.8 || color.g > 0.8 || color.b > 0.8;
      if (isSpecial) {
        this.highlightInstance(i, new Color('#ffffff'), duration);
      }
    }
  }

  private findInstancedMesh(): InstancedMesh | null {
    for (const child of this.scene.children) {
      if (child instanceof InstancedMesh && child.userData.isSpecial) {
        return child;
      }
    }
    return null;
  }

  private highlightInstance(instanceId: number, targetColor: Color, duration: number): void {
    const imesh = this.findInstancedMesh();
    if (!imesh) return;

    const originalColor = new Color();
    imesh.getColorAt(instanceId, originalColor);

    this.highlights.set(instanceId, {
      instanceId,
      originalColor,
      targetColor,
      startTime: performance.now() / 1000,
      duration,
    });
  }

  update(delta: number): void {
    if (this.highlights.size === 0) return;

    const imesh = this.findInstancedMesh();
    if (!imesh) return;

    const now = performance.now() / 1000;
    const toRemove: number[] = [];
    const color = new Color();

    for (const [instanceId, info] of this.highlights) {
      const elapsed = now - info.startTime;
      const lifeRatio = elapsed / info.duration;

      if (lifeRatio >= 1) {
        toRemove.push(instanceId);
        continue;
      }

      const pulse = Math.sin(lifeRatio * Math.PI) * 0.5 + 0.5;
      color.copy(info.originalColor).lerp(info.targetColor, pulse);
      imesh.setColorAt(instanceId, color);
    }

    for (const id of toRemove) {
      const orig = this.highlights.get(id);
      if (orig) {
        imesh.setColorAt(id, orig.originalColor);
      }
      this.highlights.delete(id);
    }

    if (imesh.instanceColor) {
      imesh.instanceColor.needsUpdate = true;
    }
  }

  clear(): void {
    const imesh = this.findInstancedMesh();
    this.highlights.clear();
    if (imesh && imesh.instanceColor) {
      imesh.instanceColor.needsUpdate = true;
    }
  }
}