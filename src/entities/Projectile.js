import * as THREE from '../../libs/three.module.js';
import { MathUtils } from '../utils/MathUtils.js';
import { GlobalModelLoader } from '../engine/ModelLoader.js';

export class Projectile {
  constructor(scene, startPos, targetPos, speed = 12, damage = 18, isEnemy = true) {
    this.scene = scene;
    this.position = new THREE.Vector3(startPos.x, startPos.y + 1.2, startPos.z);
    this.velocity = new THREE.Vector3();
    this.speed = speed;
    this.damage = damage;
    this.isEnemy = isEnemy;
    this.radius = 0.5;
    this.life = 4.0;
    this.isDead = false;

    // Calculate direction
    const dx = targetPos.x - startPos.x;
    const dy = (targetPos.y + 1.0) - (startPos.y + 1.2);
    const dz = targetPos.z - startPos.z;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

    this.velocity.set((dx / len) * speed, (dy / len) * speed, (dz / len) * speed);

    this.buildMesh();
  }

  buildMesh() {
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.group.position.copy(this.position);

    // Glowing Magic Orb
    const orbGeo = new THREE.SphereGeometry(0.35, 8, 8);
    this.orbMat = new THREE.MeshBasicMaterial({
      color: this.isEnemy ? 0xcc00ff : 0x00ffff
    });
    this.orb = new THREE.Mesh(orbGeo, this.orbMat);
    this.group.add(this.orb);

    // Outer Aura Ring
    const ringGeo = new THREE.RingGeometry(0.2, 0.5, 12);
    const ringMat = new THREE.MeshBasicMaterial({
      color: this.isEnemy ? 0xff0088 : 0x00ffaa,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7
    });
    this.ring = new THREE.Mesh(ringGeo, ringMat);
    this.group.add(this.ring);
  }

  reflect(newDirX, newDirZ, bonusMultiplier = 2.5) {
    this.isEnemy = false;
    this.speed *= 1.8;
    this.damage = Math.floor(this.damage * bonusMultiplier);
    this.velocity.set(newDirX * this.speed, 0, newDirZ * this.speed);
    if (this.orbMat) this.orbMat.color.setHex(0x00ffff);
    this.life = 3.5;
  }

  destroy() {
    this.isDead = true;
    this.scene.remove(this.group);
    this.group.traverse((c) => {
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
    });
  }

  update(dt, player, enemies, audio, particles) {
    if (this.isDead) return;

    this.life -= dt;
    if (this.life <= 0) {
      this.destroy();
      return;
    }

    this.position.addScaledVector(this.velocity, dt);
    this.group.position.copy(this.position);
    if (this.ring) {
      this.ring.rotation.z += dt * 10;
      this.ring.rotation.x += dt * 8;
    }

    // Check collision with Player
    if (this.isEnemy && player) {
      const distSq = MathUtils.distSq2D(this.position.x, this.position.z, player.position.x, player.position.z);
      if (distSq < (this.radius + player.radius) ** 2) {
        if (!player.isInvulnerable) {
          player.takeDamage(this.damage, audio, particles);
          particles.spawnHitSparks(this.position, 0, 0, 8);
          this.destroy();
          return;
        }
      }
    }

    // Check collision with Enemies (if reflected by player's Bonk!)
    if (!this.isEnemy && enemies) {
      for (const enemy of enemies) {
        if (enemy.isDead) continue;
        const distSq = MathUtils.distSq2D(this.position.x, this.position.z, enemy.position.x, enemy.position.z);
        if (distSq < (this.radius + enemy.radius) ** 2) {
          const nx = this.velocity.x / this.speed;
          const nz = this.velocity.z / this.speed;
          enemy.takeDamage(this.damage, nx, nz, 22, true);
          audio.playBonk(1.6, true);
          particles.spawnHitSparks(this.position, nx, nz, 14, true);
          particles.spawnTextPopup("💥 REVOI DE COPIE ! " + this.damage, enemy.position, '#00ffff', true);
          this.destroy();
          return;
        }
      }
    }
  }
}

/**
 * Special Academic Exam Paper Projectile thrown by the Professor Boss!
 */
export class ExamPaperProjectile extends Projectile {
  buildMesh() {
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.group.position.copy(this.position);

    // Canvas texture with "0/20 !" written in bright red
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');

    // White paper sheet with lines
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 320);

    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 2;
    for (let y = 40; y < 300; y += 24) {
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(236, y);
      ctx.stroke();
    }

    // Big red "0/20" grade with circle
    ctx.fillStyle = '#ff0033';
    ctx.font = 'bold 54px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('0 / 20', 128, 120);

    ctx.strokeStyle = '#ff0033';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(128, 105, 75, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('RATTRAPAGE !', 128, 220);

    const texture = new THREE.CanvasTexture(canvas);
    const paperGeo = new THREE.PlaneGeometry(0.9, 1.2);
    this.paperMat = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide
    });

    this.paperMesh = new THREE.Mesh(paperGeo, this.paperMat);
    this.group.add(this.paperMesh);

    // Glowing red trailing aura
    const auraGeo = new THREE.RingGeometry(0.4, 0.8, 16);
    this.auraMat = new THREE.MeshBasicMaterial({
      color: 0xff0044,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6
    });
    this.aura = new THREE.Mesh(auraGeo, this.auraMat);
    this.group.add(this.aura);
  }

  reflect(newDirX, newDirZ, bonusMultiplier = 3.0) {
    this.isEnemy = false;
    this.speed *= 2.0;
    this.damage = Math.floor(this.damage * bonusMultiplier);
    this.velocity.set(newDirX * this.speed, 0, newDirZ * this.speed);
    if (this.auraMat) this.auraMat.color.setHex(0x00ffcc);
    this.life = 4.0;
  }

  update(dt, player, enemies, audio, particles) {
    super.update(dt, player, enemies, audio, particles);
    if (this.paperMesh) {
      this.paperMesh.rotation.z += dt * 8;
      this.paperMesh.rotation.y += dt * 6;
    }
  }
}

// ==========================================
// 3. THROWN AMPHI DOOR PROJECTILE (3D Blender Flying Door)
// ==========================================
export class ThrownDoorProjectile extends Projectile {
  constructor(scene, startPos, targetPos, speed = 14, damage = 38, isEnemy = true) {
    super(scene, startPos, targetPos, speed, damage, isEnemy);
    this.radius = 1.6;
    this.life = 4.5;
  }

  buildMesh() {
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.group.position.copy(this.position);

    this.modelGroup = new THREE.Group();
    this.group.add(this.modelGroup);

    // Load Blender 3D Flying Door Model
    GlobalModelLoader.loadOBJWithMTL('assets/models/thrown_door.obj', 'assets/models/thrown_door.mtl').then((model) => {
      if (model) {
        model.scale.set(0.9, 0.9, 0.9);
        this.modelGroup.add(model);
      }
    });

    // Glowing Red Aerodynamic Trail Ring
    const trailRingGeo = new THREE.RingGeometry(0.8, 1.8, 16);
    this.trailRingMat = new THREE.MeshBasicMaterial({
      color: 0xff2200,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65
    });
    this.trailRing = new THREE.Mesh(trailRingGeo, this.trailRingMat);
    this.group.add(this.trailRing);
  }

  reflect(newDirX, newDirZ, bonusMultiplier = 3.5) {
    this.isEnemy = false;
    this.speed *= 1.6;
    this.damage = Math.floor(this.damage * bonusMultiplier);
    this.velocity.set(newDirX * this.speed, 0, newDirZ * this.speed);
    if (this.trailRingMat) this.trailRingMat.color.setHex(0x00ffff);
    this.life = 4.0;
  }

  update(dt, player, enemies, audio, particles) {
    super.update(dt, player, enemies, audio, particles);

    // Fast tumbling 3D door rotation
    if (this.modelGroup) {
      this.modelGroup.rotation.x += dt * 12.0;
      this.modelGroup.rotation.z += dt * 6.0;
    }

    if (this.trailRing) {
      this.trailRing.rotation.y += dt * 10.0;
    }

    // Trailing sparks
    if (Math.random() < 0.4) {
      particles.spawnHitSparks(this.position, 0, 0, 4);
    }
  }

  destroy() {
    super.destroy();
  }
}
