import * as THREE from '../../libs/three.module.js';

export class ParticleManager {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.shockwaves = [];
    this.lightningBolts = [];
    this.textPopups = [];

    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Shared Materials & Geometries for low memory & battery saving
    this.sparkGeo = new THREE.TetrahedronGeometry(0.18);
    this.sparkMat = new THREE.MeshBasicMaterial({ color: 0xffdd44 });
    this.critMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
    this.dustMat = new THREE.MeshBasicMaterial({ color: 0x8899aa, transparent: true, opacity: 0.6 });
    this.lightningMat = new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 2 });
  }

  /**
   * Spawns punchy comic hit sparks
   */
  spawnHitSparks(pos, normalX = 0, normalZ = 0, count = 12, isCrit = false) {
    const mat = isCrit ? this.critMat : this.sparkMat;

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.sparkGeo, mat);
      mesh.position.set(pos.x, pos.y + 0.8 + (Math.random() * 0.5 - 0.25), pos.z);
      this.group.add(mesh);

      const speed = isCrit ? (6 + Math.random() * 8) : (4 + Math.random() * 5);
      const angle = Math.random() * Math.PI * 2;
      const vx = Math.cos(angle) * speed + normalX * 4;
      const vy = 3 + Math.random() * 5;
      const vz = Math.sin(angle) * speed + normalZ * 4;

      this.particles.push({
        mesh,
        vx,
        vy,
        vz,
        rotSpeedX: Math.random() * 15,
        rotSpeedY: Math.random() * 15,
        scale: isCrit ? 1.4 : 1.0,
        life: 0.35 + Math.random() * 0.2,
        maxLife: 0.45
      });
    }
  }

  /**
   * Expanding ground dust ring on dodge roll or landing
   */
  spawnDustRing(pos, scale = 1.0) {
    const count = 8;
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.sparkGeo, this.dustMat);
      const angle = (i / count) * Math.PI * 2;
      mesh.position.set(pos.x, 0.15, pos.z);
      this.group.add(mesh);

      const speed = (2.5 + Math.random() * 2) * scale;
      this.particles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: 0.5 + Math.random() * 1.5,
        vz: Math.sin(angle) * speed,
        rotSpeedX: Math.random() * 5,
        rotSpeedY: Math.random() * 5,
        scale: 1.2 * scale,
        life: 0.35,
        maxLife: 0.35
      });
    }
  }

  /**
   * Expanding 3D Shockwave Ring (Ground Slams, Perfect Dodge)
   */
  spawnShockwave(pos, maxRadius = 6.0, color = 0x00f0ff, duration = 0.4) {
    const ringGeo = new THREE.RingGeometry(0.2, 0.8, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });

    const mesh = new THREE.Mesh(ringGeo, ringMat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(pos.x, 0.12, pos.z);
    this.group.add(mesh);

    this.shockwaves.push({
      mesh,
      maxRadius,
      duration,
      elapsed: 0
    });
  }

  /**
   * Lightning arc between two points for Thunder Bonk perk
   */
  spawnLightning(startPos, endPos, segments = 6) {
    const points = [];
    points.push(new THREE.Vector3(startPos.x, startPos.y + 1, startPos.z));

    const dx = endPos.x - startPos.x;
    const dy = (endPos.y + 1) - (startPos.y + 1);
    const dz = endPos.z - startPos.z;

    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const jitter = 0.6;
      points.push(new THREE.Vector3(
        startPos.x + dx * t + (Math.random() * 2 - 1) * jitter,
        startPos.y + 1 + dy * t + (Math.random() * 2 - 1) * jitter,
        startPos.z + dz * t + (Math.random() * 2 - 1) * jitter
      ));
    }
    points.push(new THREE.Vector3(endPos.x, endPos.y + 1, endPos.z));

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geo, this.lightningMat);
    this.group.add(line);

    this.lightningBolts.push({
      line,
      life: 0.15
    });
  }

  /**
   * Floating 3D text popup ("BONK!", "180!", "PERFECT DODGE!")
   */
  spawnTextPopup(text, pos, color = '#ffffff', isCrit = false) {
    this.textPopups.push({
      text,
      x: pos.x + (Math.random() * 0.4 - 0.2),
      y: (pos.y || 0) + 2.0,
      z: pos.z + (Math.random() * 0.4 - 0.2),
      vy: 2.2,
      color,
      isCrit,
      life: 0.8,
      maxLife: 0.8
    });
  }

  update(dt) {
    // 1. Update Spark & Dust Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.group.remove(p.mesh);
        p.mesh.geometry.dispose();
        this.particles.splice(i, 1);
        continue;
      }

      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;

      p.vy -= 18 * dt; // Gravity

      const progress = p.life / p.maxLife;
      const currentScale = p.scale * progress;
      p.mesh.scale.set(currentScale, currentScale, currentScale);
      p.mesh.rotation.x += p.rotSpeedX * dt;
      p.mesh.rotation.y += p.rotSpeedY * dt;
    }

    // 2. Update Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.elapsed += dt;
      const t = sw.elapsed / sw.duration;

      if (t >= 1.0) {
        this.group.remove(sw.mesh);
        sw.mesh.geometry.dispose();
        sw.mesh.material.dispose();
        this.shockwaves.splice(i, 1);
        continue;
      }

      const radius = sw.maxRadius * Math.sin(t * Math.PI * 0.5);
      sw.mesh.scale.set(radius, radius, 1);
      sw.mesh.material.opacity = (1 - t) * 0.9;
    }

    // 3. Update Lightning Bolts
    for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
      const lb = this.lightningBolts[i];
      lb.life -= dt;
      if (lb.life <= 0) {
        this.group.remove(lb.line);
        lb.line.geometry.dispose();
        this.lightningBolts.splice(i, 1);
      }
    }

    // 4. Update Floating Text Popups
    for (let i = this.textPopups.length - 1; i >= 0; i--) {
      const tp = this.textPopups[i];
      tp.life -= dt;
      if (tp.life <= 0) {
        this.textPopups.splice(i, 1);
        continue;
      }
      tp.y += tp.vy * dt;
      tp.vy = Math.max(0.4, tp.vy - 3.0 * dt);
    }
  }

  getTextPopups() {
    return this.textPopups;
  }
}
