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

    // Check collision with Enemies (if player-fired or reflected)
    if (!this.isEnemy && enemies) {
      for (const enemy of enemies) {
        if (enemy.isDead) continue;
        const distSq = MathUtils.distSq2D(this.position.x, this.position.z, enemy.position.x, enemy.position.z);
        if (distSq < (this.radius + enemy.radius) ** 2) {
          enemy.takeDamage(this.damage, this.velocity.x * 0.3, this.velocity.z * 0.3, 12, true, audio, particles);
          audio.playHit();
          particles.spawnHitSparks(this.position, this.velocity.x, this.velocity.z, 14, true);
          this.destroy();
          return;
        }
      }
    }
  }
}

// ==========================================
// 2. EXAM PAPER PROJECTILE ("COPIES 0/20")
// ==========================================
export class ExamPaperProjectile extends Projectile {
  constructor(scene, startPos, targetPos, speed = 14, damage = 22, isEnemy = true) {
    super(scene, startPos, targetPos, speed, damage, isEnemy);
    this.radius = 0.8;
  }

  buildMesh() {
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.group.position.copy(this.position);

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');

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

    GlobalModelLoader.loadOBJWithMTL('assets/models/thrown_door.obj', 'assets/models/thrown_door.mtl').then((model) => {
      if (model) {
        model.scale.set(0.9, 0.9, 0.9);
        this.modelGroup.add(model);
      }
    });

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
    if (this.modelGroup) {
      this.modelGroup.rotation.x += dt * 12.0;
      this.modelGroup.rotation.z += dt * 6.0;
    }
  }
}

// ==========================================
// 4. 🏹 PLAYER ARROW PROJECTILE (Archer)
// ==========================================
export class PlayerArrowProjectile extends Projectile {
  constructor(scene, startPos, targetPos, speed = 26, damage = 35) {
    super(scene, startPos, targetPos, speed, damage, false);
    this.radius = 0.6;
    this.life = 3.0;

    // Point arrow mesh in flight direction
    this.group.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      this.velocity.clone().normalize()
    );
  }

  buildMesh() {
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.group.position.copy(this.position);

    // Arrow Shaft
    const shaftGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6);
    const shaftMat = new THREE.MeshStandardMaterial({ color: 0x4a321a, roughness: 0.8 });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    this.group.add(shaft);

    // Arrowhead (Glowing Cyan)
    const headGeo = new THREE.ConeGeometry(0.12, 0.35, 5);
    const headMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 0.95;
    this.group.add(head);

    // Fletchings
    const fletchGeo = new THREE.PlaneGeometry(0.25, 0.4);
    const fletchMat = new THREE.MeshBasicMaterial({ color: 0x00ffaa, side: THREE.DoubleSide });
    const fletch = new THREE.Mesh(fletchGeo, fletchMat);
    fletch.position.y = -0.65;
    this.group.add(fletch);
  }

  update(dt, player, enemies, audio, particles) {
    super.update(dt, player, enemies, audio, particles);
    if (Math.random() < 0.3) {
      particles.spawnHitSparks(this.position, 0, 0, 2);
    }
  }
}

// ==========================================
// 5. 🧙 PLAYER ARCANE ORB (Mage)
// ==========================================
export class PlayerMagicOrbProjectile extends Projectile {
  constructor(scene, startPos, targetPos, speed = 18, damage = 42, isCharged = false) {
    super(scene, startPos, targetPos, speed, damage, false);
    this.radius = isCharged ? 1.4 : 0.7;
    this.isCharged = isCharged;
    this.life = 3.5;
  }

  buildMesh() {
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.group.position.copy(this.position);

    const r = this.isCharged ? 0.65 : 0.38;
    const orbGeo = new THREE.SphereGeometry(r, 10, 10);
    this.orbMat = new THREE.MeshBasicMaterial({
      color: this.isCharged ? 0xff00aa : 0x00f0ff
    });
    const orb = new THREE.Mesh(orbGeo, this.orbMat);
    this.group.add(orb);

    const ringGeo = new THREE.RingGeometry(r * 0.8, r * 1.6, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: this.isCharged ? 0xff88ff : 0x7700ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    this.ring = new THREE.Mesh(ringGeo, ringMat);
    this.group.add(this.ring);
  }

  update(dt, player, enemies, audio, particles) {
    super.update(dt, player, enemies, audio, particles);
    if (this.ring) {
      this.ring.rotation.z += dt * 14;
      this.ring.rotation.x += dt * 8;
    }
  }
}

// ==========================================
// 6. ⚔️ PLAYER BOLTER SHOT (Space Marine)
// ==========================================
export class PlayerBolterProjectile extends Projectile {
  constructor(scene, startPos, targetPos, speed = 28, damage = 65) {
    super(scene, startPos, targetPos, speed, damage, false);
    this.radius = 0.8;
    this.life = 2.5;

    this.group.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      this.velocity.clone().normalize()
    );
  }

  buildMesh() {
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.group.position.copy(this.position);

    // Bolter Casing
    const boltGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.65, 8);
    const boltMat = new THREE.MeshStandardMaterial({ color: 0x222226, metalness: 0.9, roughness: 0.2 });
    const bolt = new THREE.Mesh(boltGeo, boltMat);
    this.group.add(bolt);

    // Rocket Exhaust Flare
    const flareGeo = new THREE.ConeGeometry(0.14, 0.4, 6);
    const flareMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
    const flare = new THREE.Mesh(flareGeo, flareMat);
    flare.position.y = -0.45;
    this.group.add(flare);
  }

  update(dt, player, enemies, audio, particles) {
    super.update(dt, player, enemies, audio, particles);
    particles.spawnHitSparks(this.position, 0, 0, 3);
  }
}

// ==========================================
// 7. 👼 PLAYER HOLY RAY (Angel)
// ==========================================
export class PlayerHolyRayProjectile extends Projectile {
  constructor(scene, startPos, targetPos, speed = 32, damage = 55) {
    super(scene, startPos, targetPos, speed, damage, false);
    this.radius = 1.2;
    this.life = 2.0;

    this.group.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      this.velocity.clone().normalize()
    );
  }

  buildMesh() {
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.group.position.copy(this.position);

    // Radiant Beam Cylinder
    const rayGeo = new THREE.CylinderGeometry(0.18, 0.18, 1.8, 8);
    const rayMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
    const ray = new THREE.Mesh(rayGeo, rayMat);
    this.group.add(ray);

    // Holy Aura Ring
    const ringGeo = new THREE.RingGeometry(0.2, 0.6, 12);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    this.group.add(ring);
  }

  update(dt, player, enemies, audio, particles) {
    super.update(dt, player, enemies, audio, particles);
    particles.spawnHitSparks(this.position, 0, 0, 2);
  }
}

// ==========================================
// 8. 🧟 PLAYER NECRO SKULL (Necromancer)
// ==========================================
export class PlayerNecroSkullProjectile extends Projectile {
  constructor(scene, startPos, targetPos, speed = 20, damage = 35) {
    super(scene, startPos, targetPos, speed, damage, false);
    this.radius = 0.8;
    this.life = 3.0;
  }

  buildMesh() {
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.group.position.copy(this.position);

    // Glowing Green Skull Orb
    const orbGeo = new THREE.SphereGeometry(0.42, 8, 8);
    this.orbMat = new THREE.MeshBasicMaterial({ color: 0x00ff66 });
    const orb = new THREE.Mesh(orbGeo, this.orbMat);
    this.group.add(orb);

    // Dark soul flame ring
    const ringGeo = new THREE.RingGeometry(0.3, 0.7, 12);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x004422, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
    this.ring = new THREE.Mesh(ringGeo, ringMat);
    this.group.add(this.ring);
  }

  update(dt, player, enemies, audio, particles) {
    super.update(dt, player, enemies, audio, particles);
    if (this.ring) {
      this.ring.rotation.z += dt * 10;
    }
  }
}

// ==========================================
// 9. 🐸 TOXIC PUDDLE PROJECTILE (Gromp)
// ==========================================
export class ToxicPuddleProjectile extends Projectile {
  constructor(scene, startPos, targetPos, speed = 14, damage = 18) {
    super(scene, startPos, targetPos, speed, damage, true);
    this.radius = 0.6;
    this.hasLanded = false;
    this.puddleTimer = 4.5;
    this.puddleMesh = null;
  }

  buildMesh() {
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.group.position.copy(this.position);

    const blobGeo = new THREE.SphereGeometry(0.4, 8, 8);
    const blobMat = new THREE.MeshBasicMaterial({ color: 0x33ff00 });
    this.blob = new THREE.Mesh(blobGeo, blobMat);
    this.group.add(this.blob);
  }

  update(dt, player, enemies, audio, particles) {
    if (!this.hasLanded) {
      this.position.addScaledVector(this.velocity, dt);
      this.velocity.y -= 15.0 * dt; // Gravity arc
      this.group.position.copy(this.position);

      if (this.position.y <= 0.1) {
        this.position.y = 0.05;
        this.hasLanded = true;
        this.velocity.set(0, 0, 0);

        // Turn into lingering acid pool on floor
        this.blob.visible = false;
        const poolGeo = new THREE.RingGeometry(0.2, 2.2, 24);
        const poolMat = new THREE.MeshBasicMaterial({ color: 0x33ff00, side: THREE.DoubleSide, transparent: true, opacity: 0.65 });
        this.puddleMesh = new THREE.Mesh(poolGeo, poolMat);
        this.puddleMesh.rotation.x = -Math.PI / 2;
        this.group.add(this.puddleMesh);

        if (particles) {
          particles.spawnHitSparks(this.position, 0, 0, 10);
        }
      }
    } else {
      // Lingering puddle damage
      this.puddleTimer -= dt;
      if (this.puddleMesh) {
        this.puddleMesh.material.opacity = Math.min(0.65, this.puddleTimer / 2.0);
      }

      const distSq = MathUtils.distSq2D(this.position.x, this.position.z, player.position.x, player.position.z);
      if (distSq <= 2.2 * 2.2 && !player.isInvulnerable) {
        player.takeDamage(this.damage * dt * 2.5, audio, particles);
      }

      if (this.puddleTimer <= 0) {
        this.destroy();
      }
    }
  }
}

// ==========================================
// 10. ☄️ DEMON METEOR PROJECTILE (Demon Lord)
// ==========================================
export class DemonMeteorProjectile extends Projectile {
  constructor(scene, targetPos, damage = 45) {
    const startPos = { x: targetPos.x + (Math.random() * 4 - 2), y: 22, z: targetPos.z + (Math.random() * 4 - 2) };
    super(scene, startPos, targetPos, 24, damage, true);
    this.targetPos = targetPos;
    this.radius = 1.2;
    this.hasExploded = false;
  }

  buildMesh() {
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.group.position.copy(this.position);

    const rockGeo = new THREE.DodecahedronGeometry(0.85);
    const rockMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
    this.rock = new THREE.Mesh(rockGeo, rockMat);
    this.group.add(this.rock);

    // Target telegraph ring on the ground
    const targetGeo = new THREE.RingGeometry(0.3, 4.5, 32);
    const targetMat = new THREE.MeshBasicMaterial({ color: 0xff1100, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
    this.targetIndicator = new THREE.Mesh(targetGeo, targetMat);
    this.targetIndicator.rotation.x = -Math.PI / 2;
    this.targetIndicator.position.set(this.targetPos.x, 0.05, this.targetPos.z);
    this.scene.add(this.targetIndicator);
  }

  update(dt, player, enemies, audio, particles) {
    if (this.isDead) return;
    this.position.addScaledVector(this.velocity, dt);
    this.group.position.copy(this.position);
    this.rock.rotation.x += dt * 5;
    this.rock.rotation.y += dt * 7;

    if (this.position.y <= 0.3 && !this.hasExploded) {
      this.hasExploded = true;
      if (audio) audio.playGroundSlam();
      if (particles) {
        particles.spawnShockwave(this.position, 8.5, 0xff3300, 0.8);
        particles.spawnHitSparks(this.position, 0, 0, 24, true);
        particles.spawnTextPopup("💥 IMPACT MAGMATIQUE !", this.position, '#ff3300', true);
      }

      const distSq = MathUtils.distSq2D(this.position.x, this.position.z, player.position.x, player.position.z);
      if (distSq <= 4.5 * 4.5 && !player.isInvulnerable) {
        player.takeDamage(this.damage, audio, particles);
        const dx = player.position.x - this.position.x;
        const dz = player.position.z - this.position.z;
        const len = Math.sqrt(dx * dx + dz * dz) || 1;
        player.velocity.x = (dx / len) * 22;
        player.velocity.z = (dz / len) * 22;
      }

      if (this.targetIndicator) {
        this.scene.remove(this.targetIndicator);
      }
      this.destroy();
    }
  }

  destroy() {
    if (this.targetIndicator) {
      this.scene.remove(this.targetIndicator);
    }
    super.destroy();
  }
}

// ==========================================
// 11. 💀 DEATH RAY PROJECTILE (Lich King)
// ==========================================
export class DeathRayProjectile extends Projectile {
  constructor(scene, startPos, targetPos, speed = 26, damage = 35) {
    super(scene, startPos, targetPos, speed, damage, true);
    this.radius = 0.9;
    this.life = 2.5;
  }

  buildMesh() {
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.group.position.copy(this.position);

    const beamGeo = new THREE.CylinderGeometry(0.28, 0.28, 3.2, 8);
    const beamMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    this.beam = new THREE.Mesh(beamGeo, beamMat);
    this.beam.rotation.x = Math.PI / 2;
    this.group.add(this.beam);
  }

  update(dt, player, enemies, audio, particles) {
    super.update(dt, player, enemies, audio, particles);
    if (particles) {
      particles.spawnHitSparks(this.position, 0, 0, 2);
    }
  }
}

// ==========================================
// 12. 🗿 BOULDER PROJECTILE (Titan Golem)
// ==========================================
export class BoulderProjectile extends Projectile {
  constructor(scene, startPos, targetPos, speed = 16, damage = 42) {
    super(scene, startPos, targetPos, speed, damage, true);
    this.radius = 1.4;
    this.life = 4.0;
  }

  buildMesh() {
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.group.position.copy(this.position);

    const rockGeo = new THREE.DodecahedronGeometry(1.2);
    const rockMat = new THREE.MeshBasicMaterial({ color: 0x666677 });
    this.rock = new THREE.Mesh(rockGeo, rockMat);
    this.group.add(this.rock);
  }

  update(dt, player, enemies, audio, particles) {
    super.update(dt, player, enemies, audio, particles);
    if (this.rock) {
      this.rock.rotation.x += dt * 6;
      this.rock.rotation.z += dt * 4;
    }
  }
}
