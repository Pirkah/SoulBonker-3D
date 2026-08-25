import * as THREE from '../../libs/three.module.js';
import { Enemy } from './Enemy.js';
import { Projectile, ExamPaperProjectile } from './Projectile.js';
import { MathUtils } from '../utils/MathUtils.js';
import { GlobalModelLoader } from '../engine/ModelLoader.js';

// ==========================================
// 1. BONKLING (Fast Goblin Swarmer)
// ==========================================
export class Bonkling extends Enemy {
  constructor(scene, x, z) {
    super(scene, x, z);
    this.type = 'BONKLING';
    this.maxHp = 50;
    this.hp = 50;
    this.damage = 12;
    this.moveSpeed = 6.8;
    this.attackRange = 2.0;
    this.telegraphDuration = 0.45;
    this.attackDuration = 0.25;
    this.scoreValue = 75;
    this.radius = 0.65;

    this.buildMesh();
  }

  buildMesh() {
    this.modelGroup = new THREE.Group();
    this.group.add(this.modelGroup);

    GlobalModelLoader.loadOBJWithMTL('assets/models/bonkling.obj', 'assets/models/bonkling.mtl').then((model) => {
      if (model) {
        model.scale.set(1.0, 1.0, 1.0);
        this.modelGroup.add(model);
      }
    });

    const eyeGeo = new THREE.BoxGeometry(0.12, 0.08, 0.1);
    this.eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0022 });
    const eyeL = new THREE.Mesh(eyeGeo, this.eyeMat);
    eyeL.position.set(-0.18, 0.65, 0.4);
    this.group.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, this.eyeMat);
    eyeR.position.set(0.18, 0.65, 0.4);
    this.group.add(eyeR);
  }

  animateWalk(dt) {
    this.modelGroup.position.y = Math.abs(Math.sin(this.stateTimer * 12)) * 0.2;
    this.modelGroup.rotation.z = Math.sin(this.stateTimer * 12) * 0.1;
  }

  animateTelegraph(progress) {
    this.modelGroup.position.y = Math.sin(progress * Math.PI) * 0.3;
    this.modelGroup.rotation.x = -progress * 0.4;
  }

  animateAttack(progress) {
    this.modelGroup.rotation.x = progress * 0.8 - 0.3;
  }

  performAttack(player, audio, particles) {
    const distSq = MathUtils.distSq2D(this.position.x, this.position.z, player.position.x, player.position.z);
    if (distSq <= (this.attackRange + 0.8) ** 2) {
      if (!player.isInvulnerable) {
        player.takeDamage(this.damage, audio, particles);
      }
    }
  }
}

// ==========================================
// 2. HAMMER BRUTE (Tank / Ground Slammer)
// ==========================================
export class HammerBrute extends Enemy {
  constructor(scene, x, z) {
    super(scene, x, z);
    this.type = 'HAMMER_BRUTE';
    this.maxHp = 260;
    this.hp = 260;
    this.damage = 32;
    this.moveSpeed = 3.2;
    this.attackRange = 3.8;
    this.telegraphDuration = 1.1;
    this.attackDuration = 0.45;
    this.cooldownDuration = 0.9;
    this.scoreValue = 250;
    this.radius = 1.3;

    this.buildMesh();
  }

  buildMesh() {
    this.modelGroup = new THREE.Group();
    this.group.add(this.modelGroup);

    GlobalModelLoader.loadOBJWithMTL('assets/models/hammer_brute.obj', 'assets/models/hammer_brute.mtl').then((model) => {
      if (model) {
        model.scale.set(1.3, 1.3, 1.3);
        this.modelGroup.add(model);
      }
    });

    this.telegraphMesh.geometry.dispose();
    this.telegraphMesh.geometry = new THREE.RingGeometry(0.2, 4.2, 32);
  }

  animateWalk(dt) {
    this.modelGroup.position.y = Math.abs(Math.sin(this.stateTimer * 6)) * 0.15;
    this.modelGroup.rotation.z = Math.sin(this.stateTimer * 6) * 0.1;
  }

  animateTelegraph(progress) {
    this.modelGroup.rotation.x = -progress * 0.5;
  }

  animateAttack(progress) {
    this.modelGroup.rotation.x = progress * 0.7 - 0.2;
  }

  performAttack(player, audio, particles) {
    audio.playGroundSlam();
    particles.spawnShockwave(this.position, 6.0, 0xff0033, 0.5);

    const distSq = MathUtils.distSq2D(this.position.x, this.position.z, player.position.x, player.position.z);
    if (distSq <= 4.8 * 4.8) {
      if (!player.isInvulnerable) {
        player.takeDamage(this.damage, audio, particles);
        const dx = player.position.x - this.position.x;
        const dz = player.position.z - this.position.z;
        const len = Math.sqrt(dx * dx + dz * dz) || 1;
        player.velocity.x = (dx / len) * 16;
        player.velocity.z = (dz / len) * 16;
      }
    }
  }
}

// ==========================================
// 3. VOID MAGE (Ranged Caster)
// ==========================================
export class VoidMage extends Enemy {
  constructor(scene, x, z, projectilesList) {
    super(scene, x, z);
    this.type = 'VOID_MAGE';
    this.projectilesList = projectilesList;
    this.maxHp = 80;
    this.hp = 80;
    this.damage = 22;
    this.moveSpeed = 4.2;
    this.attackRange = 16.0;
    this.preferredRange = 10.0;
    this.telegraphDuration = 0.9;
    this.attackDuration = 0.3;
    this.cooldownDuration = 1.8;
    this.scoreValue = 180;
    this.radius = 0.75;

    this.buildMesh();
  }

  buildMesh() {
    this.modelGroup = new THREE.Group();
    this.group.add(this.modelGroup);

    GlobalModelLoader.loadOBJWithMTL('assets/models/void_mage.obj', 'assets/models/void_mage.mtl').then((model) => {
      if (model) {
        model.scale.set(1.0, 1.0, 1.0);
        this.modelGroup.add(model);
      }
    });
  }

  animateWalk(dt) {
    this.position.y = 0.3 + Math.sin(this.stateTimer * 4) * 0.25;
    this.modelGroup.rotation.y += dt * 3.0;
  }

  animateTelegraph(progress) {
    this.modelGroup.position.y = 0.3 + progress * 0.5;
  }

  animateAttack(progress) {
    this.modelGroup.position.y = 0.6 - progress * 0.3;
  }

  performAttack(player, audio, particles) {
    audio.playMagicCast(false);
    particles.spawnHitSparks(this.position, 0, 0, 8);

    if (this.projectilesList) {
      const proj = new Projectile(this.scene, this.position, player.position, 13, this.damage, true);
      this.projectilesList.push(proj);
    }
  }
}

// ==========================================
// 4. LE PROFESSEUR D'AMPHI (Boss 3D Noir & Attaque 'Prendre la porte')
// ==========================================
export class ProfesseurAmphi extends Enemy {
  constructor(scene, x, z, projectilesList) {
    super(scene, x, z);
    this.type = 'BOSS_PROF';
    this.projectilesList = projectilesList;
    this.maxHp = 1800;
    this.hp = 1800;
    this.damage = 40;
    this.moveSpeed = 4.2;
    this.attackRange = 5.5;
    this.telegraphDuration = 1.15;
    this.attackDuration = 0.55;
    this.cooldownDuration = 0.75;
    this.scoreValue = 3000;
    this.radius = 2.2;

    this.isEnraged = false;
    this.attackPatternIndex = 0;
    this.quotes = [
      "PRENEZ LA PORTE !",
      "SILENCE AU FOND !",
      "INTERRO SURPRISE ! 0/20",
      "VOUS IREZ EN RATTRAPAGE !",
      "SORTEZ DE MON AMPHI !"
    ];

    this.buildProfessorMesh();
  }

  buildProfessorMesh() {
    this.modelGroup = new THREE.Group();
    this.group.add(this.modelGroup);

    // 1. Load Master Blender 3D Model (Black skin, white sweater, navy pants, glasses, pen)
    GlobalModelLoader.loadOBJWithMTL('assets/models/prof_boss.obj', 'assets/models/prof_boss.mtl').then((model) => {
      if (model) {
        model.scale.set(1.4, 1.4, 1.4);
        this.modelGroup.add(model);
      }
    });

    // 2. 3D Shadow on the floor
    const shadowGeo = new THREE.RingGeometry(0.2, 1.8, 24);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5 });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.05;
    this.group.add(shadow);

    // Glowing Floor Rune
    const runeGeo = new THREE.RingGeometry(1.8, 2.5, 32);
    this.floorRuneMat = new THREE.MeshBasicMaterial({ color: 0xff0044, transparent: true, opacity: 0.5 });
    this.floorRune = new THREE.Mesh(runeGeo, this.floorRuneMat);
    this.floorRune.rotation.x = -Math.PI / 2;
    this.floorRune.position.y = 0.06;
    this.group.add(this.floorRune);

    // 3. Glowing Laser Eyes (aligned with 3D head at Y = 4.0)
    const eyeGeo = new THREE.SphereGeometry(0.07, 8, 8);
    this.laserEyeMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    
    this.eyeL = new THREE.Mesh(eyeGeo, this.laserEyeMat);
    this.eyeL.position.set(-0.16, 4.0, 0.15);
    this.group.add(this.eyeL);

    this.eyeR = new THREE.Mesh(eyeGeo, this.laserEyeMat);
    this.eyeR.position.set(0.16, 4.0, 0.15);
    this.group.add(this.eyeR);

    // 4. Orbiting 3D Exam Papers ("0/20")
    this.examRing = new THREE.Group();
    this.group.add(this.examRing);
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const sheetGeo = new THREE.PlaneGeometry(0.7, 0.95);
      const sheetMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
      const sheet = new THREE.Mesh(sheetGeo, sheetMat);
      sheet.position.set(Math.sin(angle) * 2.2, 2.5, Math.cos(angle) * 2.2);
      sheet.rotation.y = angle;
      this.examRing.add(sheet);
    }

    // Telegraph indicator
    this.telegraphMesh.geometry.dispose();
    this.telegraphMesh.geometry = new THREE.RingGeometry(0.3, 8.5, 36);
  }

  animateWalk(dt) {
    this.modelGroup.position.y = Math.abs(Math.sin(this.stateTimer * 5)) * 0.15;
    this.modelGroup.rotation.y = Math.sin(this.stateTimer * 5) * 0.05;

    if (this.floorRune) this.floorRune.rotation.z += dt * 1.5;
    if (this.examRing) this.examRing.rotation.y += dt * 4.0;
  }

  animateTelegraph(progress) {
    this.modelGroup.rotation.x = -progress * 0.5;
    this.laserEyeMat.color.setHex(0xff0022);
  }

  animateAttack(progress) {
    this.modelGroup.rotation.x = progress * 0.8 - 0.3;
  }

  performAttack(player, audio, particles) {
    this.attackPatternIndex = (this.attackPatternIndex + 1) % 4;

    // =========================================================================
    // ATTACK 0: "🚪 PRENEZ LA PORTE !" (Porte d'Amphi Claquée au Sol)
    // =========================================================================
    if (this.attackPatternIndex === 0) {
      audio.playGroundSlam();

      // Spawn 3D Amphitheatre Door
      const forwardX = Math.sin(this.rotationY);
      const forwardZ = Math.cos(this.rotationY);
      const doorSpawnPos = new THREE.Vector3(
        this.position.x + forwardX * 3.5,
        0,
        this.position.z + forwardZ * 3.5
      );

      const doorGroup = new THREE.Group();
      doorGroup.position.copy(doorSpawnPos);
      doorGroup.rotation.y = this.rotationY;
      this.scene.add(doorGroup);

      GlobalModelLoader.loadOBJWithMTL('assets/models/amphi_door.obj', 'assets/models/amphi_door.mtl').then((doorModel) => {
        if (doorModel) {
          doorModel.scale.set(1.2, 1.2, 1.2);
          doorGroup.add(doorModel);
        }
      });

      // Door Slam Shockwave & Wood Splinters
      particles.spawnShockwave(doorSpawnPos, 11.0, 0x994411, 0.8);
      particles.spawnHitSparks(doorSpawnPos, forwardX, forwardZ, 20, true);
      particles.spawnTextPopup("🚪 'PRENEZ LA PORTE ! SORTEZ !'", doorSpawnPos, '#ff3300', true);

      // Launch Player Backwards with Megabonk force
      const distSq = MathUtils.distSq2D(doorSpawnPos.x, doorSpawnPos.z, player.position.x, player.position.z);
      if (distSq <= 7.0 * 7.0 && !player.isInvulnerable) {
        player.takeDamage(this.damage * 1.25, audio, particles);
        const dx = player.position.x - this.position.x;
        const dz = player.position.z - this.position.z;
        const len = Math.sqrt(dx * dx + dz * dz) || 1;
        player.velocity.x = (dx / len) * 28;
        player.velocity.z = (dz / len) * 28;
      }

      // Remove door mesh after 2 seconds
      setTimeout(() => {
        this.scene.remove(doorGroup);
        doorGroup.traverse(c => {
          if (c.geometry) c.geometry.dispose();
          if (c.material) c.material.dispose();
        });
      }, 2000);
    }
    // =========================================================================
    // ATTACK 1: "📢 SILENCE AU FOND !" (Séisme d'ondes de choc)
    // =========================================================================
    else if (this.attackPatternIndex === 1) {
      audio.playGroundSlam();
      particles.spawnShockwave(this.position, 10.0, 0xff0044, 0.7);

      const quote = this.quotes[Math.floor(Math.random() * this.quotes.length)];
      particles.spawnTextPopup("📢 " + quote, this.position, '#ff0044', true);

      const distSq = MathUtils.distSq2D(this.position.x, this.position.z, player.position.x, player.position.z);
      if (distSq <= 7.8 * 7.8) {
        if (!player.isInvulnerable) {
          player.takeDamage(this.damage, audio, particles);
          const dx = player.position.x - this.position.x;
          const dz = player.position.z - this.position.z;
          const len = Math.sqrt(dx * dx + dz * dz) || 1;
          player.velocity.x = (dx / len) * 22;
          player.velocity.z = (dz / len) * 22;
        }
      }
    }
    // =========================================================================
    // ATTACK 2: "📝 DISTRIBUTION DES COPIES 0/20 !" (Copies volantes)
    // =========================================================================
    else if (this.attackPatternIndex === 2) {
      audio.playMagicCast(false);
      particles.spawnTextPopup("📝 INTERRO SURPRISE ! 0/20", this.position, '#ff2200', true);

      if (this.projectilesList) {
        for (let i = -1; i <= 1; i++) {
          const spreadPos = {
            x: player.position.x + i * 3.5,
            y: player.position.y,
            z: player.position.z + i * 2.0
          };
          const examProj = new ExamPaperProjectile(this.scene, this.position, spreadPos, 14, 25, true);
          this.projectilesList.push(examProj);
        }
      }
    }
    // =========================================================================
    // ATTACK 3: "🖊️ COUP DE STYLO ROUGE"
    // =========================================================================
    else {
      audio.playSwing(true);
      particles.spawnHitSparks(this.position, 0, 0, 14, true);

      const distSq = MathUtils.distSq2D(this.position.x, this.position.z, player.position.x, player.position.z);
      if (distSq <= 6.0 * 6.0) {
        if (!player.isInvulnerable) {
          player.takeDamage(this.damage * 0.85, audio, particles);
        }
      }
    }

    // Phase 2 Enrage (HP < 50%)
    if (this.hp < this.maxHp * 0.5 && !this.isEnraged) {
      this.isEnraged = true;
      this.moveSpeed = 5.5;
      this.telegraphDuration = 0.8;
      this.laserEyeMat.color.setHex(0xff0000);
      this.floorRuneMat.color.setHex(0xff0000);
      particles.spawnTextPopup("🔥 'VOUS IREZ EN RATTRAPAGE !' 🔥", this.position, '#ff0033', true);
    }
  }
}
