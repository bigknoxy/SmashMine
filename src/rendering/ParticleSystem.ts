import { BufferGeometry, Float32BufferAttribute, Points, PointsMaterial, Color, Scene } from 'three';

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  r: number;
  g: number;
  b: number;
  age: number;
  maxAge: number;
  size: number;
  gravity: number;
}

interface ParticleConfig {
  pos: { x: number; y: number; z: number };
  count: number;
  color: string;
  speed: number;
  lifetime: number;
  size: number;
  spread: number;
  gravity: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private points: Points;
  private maxParticles = 500;
  private positionData: Float32Array;
  private colorData: Float32Array;
  private sizeData: Float32Array;
  private geometry: BufferGeometry;
  private visible = false;

  constructor(scene?: Scene) {
    this.positionData = new Float32Array(this.maxParticles * 3);
    this.colorData = new Float32Array(this.maxParticles * 3);
    this.sizeData = new Float32Array(this.maxParticles);

    this.geometry = new BufferGeometry();
    this.geometry.setAttribute('position', new Float32BufferAttribute(this.positionData, 3));
    this.geometry.setAttribute('color', new Float32BufferAttribute(this.colorData, 3));

    this.geometry.setDrawRange(0, 0);

    const material = new PointsMaterial({
      vertexColors: true,
      size: 0.3,
      sizeAttenuation: true,
      transparent: true,
    });

    this.points = new Points(this.geometry, material);
    this.points.frustumCulled = false;
    this.points.visible = false;

    if (scene) scene.add(this.points);
  }

  emitBurst(pos: { x: number; y: number; z: number }, color: string = '#ffaa00'): void {
    this.emit({ pos, count: 10, color, speed: 3, lifetime: 0.5, size: 0.5, spread: 1, gravity: 0.5 });
  }

  emit(config: ParticleConfig): void {
    const { pos, count, color, speed, lifetime, size, spread, gravity } = config;
    const c = new Color(color);

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * spread;
      const speedMult = Math.random() * speed + 0.1;

      this.particles.push({
        x: pos.x + Math.cos(angle) * radius,
        y: pos.y,
        z: pos.z + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * speedMult,
        vy: Math.random() * speedMult + 0.5,
        vz: (Math.random() - 0.5) * speedMult,
        r: c.r, g: c.g, b: c.b,
        age: 0,
        maxAge: lifetime,
        size,
        gravity,
      });
    }
    this.points.visible = true;
    this.visible = true;
  }

  update(delta: number): void {
    if (this.particles.length === 0) {
      this.points.visible = false;
      return;
    }

    let aliveCount = 0;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.age += delta;
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.z += p.vz * delta;
      p.vy -= p.gravity * delta;

      const lifeRatio = 1 - p.age / p.maxAge;
      if (lifeRatio <= 0) continue;

      const idx = aliveCount * 3;
      this.positionData[idx] = p.x;
      this.positionData[idx + 1] = p.y;
      this.positionData[idx + 2] = p.z;
      this.colorData[idx] = p.r * lifeRatio;
      this.colorData[idx + 1] = p.g * lifeRatio;
      this.colorData[idx + 2] = p.b * lifeRatio;
      aliveCount++;
    }

    // Remove dead particles in-place
    let writeIdx = 0;
    for (let i = 0; i < this.particles.length; i++) {
      if (this.particles[i].age < this.particles[i].maxAge) {
        this.particles[writeIdx++] = this.particles[i];
      }
    }
    this.particles.length = writeIdx;

    (this.geometry.attributes.position as Float32BufferAttribute).needsUpdate = true;
    (this.geometry.attributes.color as Float32BufferAttribute).needsUpdate = true;
    this.geometry.setDrawRange(0, this.particles.length);

    if (this.particles.length === 0) {
      this.points.visible = false;
    }
  }

  reset(): void {
    this.particles = [];
    this.points.visible = false;
    this.geometry.setDrawRange(0, 0);
  }
}