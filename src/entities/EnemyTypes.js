import * as THREE from '../../libs/three.module.js';
import { Enemy } from './Enemy.js';
import { Projectile, ExamPaperProjectile, ThrownDoorProjectile, ToxicPuddleProjectile, DemonMeteorProjectile, DeathRayProjectile, BoulderProjectile } from './Projectile.js';
import { MathUtils } from '../utils/MathUtils.js';
import { GlobalModelLoader } from '../engine/ModelLoader.js';
import { SkeletonMinion } from './SkeletonMinion.js';

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

    // Torso joint
    this.torso = new THREE.Group();
    this.torso.position.y = 0.65;
    this.modelGroup.add(this.torso);

    this.limbContainers = {
      torso: new THREE.Group(),
      rightArm: new THREE.Group(),
      leftArm: new THREE.Group(),
      rightLeg: new THREE.Group(),
      leftLeg: new THREE.Group()
    };

    this.torso.add(this.limbContainers.torso);

    // Arms
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(-0.22, 0.17, 0);
    this.torso.add(this.rightArm);
    this.rightArm.add(this.limbContainers.rightArm);

    this.leftArm = new THREE.Group();
    this.leftArm.position.set(0.22, 0.17, 0);
    this.torso.add(this.leftArm);
    this.leftArm.add(this.limbContainers.leftArm);

    // Legs
    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(-0.12, 0.52, 0);
    this.modelGroup.add(this.rightLeg);
    this.rightLeg.add(this.limbContainers.rightLeg);

    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(0.12, 0.52, 0);
    this.modelGroup.add(this.leftLeg);
    this.leftLeg.add(this.limbContainers.leftLeg);

    // Load parts
    GlobalModelLoader.loadOBJWithMTL('assets/models/bonkling_torso.obj', 'assets/models/bonkling.mtl').then(m => m && this.limbContainers.torso.add(m));
    GlobalModelLoader.loadOBJWithMTL('assets/models/bonkling_arm_r.obj', 'assets/models/bonkling.mtl').then(m => m && this.limbContainers.rightArm.add(m));
    GlobalModelLoader.loadOBJWithMTL('assets/models/bonkling_arm_l.obj', 'assets/models/bonkling.mtl').then(m => m && this.limbContainers.leftArm.add(m));
    GlobalModelLoader.loadOBJWithMTL('assets/models/bonkling_leg_r.obj', 'assets/models/bonkling.mtl').then(m => m && this.limbContainers.rightLeg.add(m));
    GlobalModelLoader.loadOBJWithMTL('assets/models/bonkling_leg_l.obj', 'assets/models/bonkling.mtl').then(m => m && this.limbContainers.leftLeg.add(m));
  }

  animateWalk(dt) {
    const t = this.stateTimer * 16;
    if (this.rightLeg && this.leftLeg) {
      this.rightLeg.rotation.x = Math.sin(t) * 0.65;
      this.leftLeg.rotation.x = -Math.sin(t) * 0.65;
    }
    if (this.rightArm && this.leftArm) {
      this.rightArm.rotation.x = -Math.sin(t) * 0.55;
      this.leftArm.rotation.x = Math.sin(t) * 0.55;
    }
    if (this.torso) {
      this.torso.position.y = 0.65 + Math.abs(Math.sin(t)) * 0.08;
      this.torso.rotation.z = Math.sin(t) * 0.08;
    }
  }

  animateTelegraph(progress) {
    if (this.rightArm) {
      this.rightArm.rotation.x = -progress * 1.6;
      this.rightArm.rotation.z = -progress * 0.3;
    }
    if (this.leftArm) {
      this.leftArm.rotation.x = progress * 0.4;
    }
    if (this.torso) {
      this.torso.rotation.x = -progress * 0.25;
      this.torso.rotation.y = -progress * 0.35;
    }
  }

  animateAttack(progress) {
    if (this.rightArm) {
      this.rightArm.rotation.x = 1.2 - progress * 2.2;
    }
    if (this.torso) {
      this.torso.rotation.x = progress * 0.4 - 0.2;
    }
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
        model.position.set(0, 1.45, 0);
        this.modelGroup.add(model);
      }
    });

    this.telegraphMesh.geometry.dispose();
    this.telegraphMesh.geometry = new THREE.RingGeometry(0.2, 4.2, 32);
  }

  animateWalk(dt) {
    this.modelGroup.position.y = Math.abs(Math.sin(this.stateTimer * 6)) * 0.15;
    this.modelGroup.rotation.z = Math.sin(this.stateTimer * 6) * 0.08;
  }

  animateTelegraph(progress) {
    this.modelGroup.position.y = Math.sin(progress * Math.PI) * 0.5;
    this.modelGroup.rotation.x = -progress * 0.6;
  }

  animateAttack(progress) {
    this.modelGroup.rotation.x = progress * 1.2 - 0.4;
  }

  performAttack(player, audio, particles) {
    audio.playGroundSlam();
    particles.spawnShockwave(this.position, 4.2, 0xff5500);

    const distSq = MathUtils.distSq2D(this.position.x, this.position.z, player.position.x, player.position.z);
    if (distSq <= (this.attackRange + 0.4) ** 2) {
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
// 3. 🔮 VOID MAGE (Dark Ranged Projectiles)
// ==========================================
export class VoidMage extends Enemy {
  constructor(scene, x, z, projectilesList) {
    super(scene, x, z);
    this.type = 'VOID_MAGE';
    this.projectilesList = projectilesList;
    this.maxHp = 90;
    this.hp = 90;
    this.damage = 18;
    this.moveSpeed = 4.0;
    this.attackRange = 16.0;
    this.telegraphDuration = 0.75;
    this.attackDuration = 0.35;
    this.cooldownDuration = 1.3;
    this.scoreValue = 180;
    this.radius = 0.9;

    this.teleportCooldown = 4.0;
    this.teleportTimer = 0;

    this.buildMesh();
  }

  buildMesh() {
    this.modelGroup = new THREE.Group();
    this.group.add(this.modelGroup);

    GlobalModelLoader.loadOBJWithMTL('assets/models/void_mage.obj', 'assets/models/void_mage.mtl').then((model) => {
      if (model) {
        model.scale.set(1.15, 1.15, 1.15);
        model.position.set(0, 1.05, 0);
        this.modelGroup.add(model);
      }
    });

    const runeGeo = new THREE.RingGeometry(0.5, 1.2, 16);
    const runeMat = new THREE.MeshBasicMaterial({ color: 0x9900ff, side: THREE.DoubleSide });
    this.rune = new THREE.Mesh(runeGeo, runeMat);
    this.rune.rotation.x = -Math.PI / 2;
    this.rune.position.y = 0.05;
    this.group.add(this.rune);
  }

  animateWalk(dt) {
    this.modelGroup.position.y = 0.2 + Math.sin(this.stateTimer * 4) * 0.15;
    if (this.rune) this.rune.rotation.z += dt * 2.0;
  }

  animateTelegraph(progress) {
    this.modelGroup.position.y = 0.3 + Math.sin(progress * Math.PI) * 0.4;
    this.modelGroup.rotation.y += 0.08;
  }

  animateAttack(progress) {
    this.modelGroup.position.y = 0.4 - progress * 0.2;
  }

  update(dt, player, audio, particles) {
    this.teleportTimer += dt;
    const distSq = MathUtils.distSq2D(this.position.x, this.position.z, player.position.x, player.position.z);
    
    if (distSq < 6.0 * 6.0 && this.teleportTimer >= this.teleportCooldown) {
      this.teleport(audio, particles);
      this.teleportTimer = 0;
    }

    super.update(dt, player, audio, particles);
  }

  teleport(audio, particles) {
    particles.spawnDeathBurst(this.position, 0xaa00ff);
    audio.playPlayerDash();

    const angle = Math.random() * Math.PI * 2;
    const dist = 10 + Math.random() * 8;
    this.position.x += Math.sin(angle) * dist;
    this.position.z += Math.cos(angle) * dist;

    const maxR = 26;
    const currentR = Math.sqrt(this.position.x ** 2 + this.position.z ** 2);
    if (currentR > maxR) {
      this.position.x = (this.position.x / currentR) * (maxR - 2);
      this.position.z = (this.position.z / currentR) * (maxR - 2);
    }

    this.group.position.copy(this.position);
    particles.spawnShockwave(this.position, 2.0, 0xaa00ff);
  }

  performAttack(player, audio, particles) {
    audio.playFireballLaunch();
    const spawnPos = new THREE.Vector3(this.position.x, 1.2, this.position.z);
    const targetPos = new THREE.Vector3(player.position.x, 1.0, player.position.z);
    const dir = new THREE.Vector3().subVectors(targetPos, spawnPos).normalize();

    const proj = new Projectile(this.scene, spawnPos, dir, 14.0, this.damage, false, 0xaa00ff);
    if (this.projectilesList) {
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
    this.type = 'PROFESSEUR_AMPHI';
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

    // Torso joint
    this.torso = new THREE.Group();
    this.torso.position.y = 1.20;
    this.modelGroup.add(this.torso);

    this.limbContainers = {
      torso: new THREE.Group(),
      rightArm: new THREE.Group(),
      leftArm: new THREE.Group(),
      rightLeg: new THREE.Group(),
      leftLeg: new THREE.Group()
    };

    this.torso.add(this.limbContainers.torso);

    // Arms
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(-0.35, 0.75, 0);
    this.torso.add(this.rightArm);
    this.rightArm.add(this.limbContainers.rightArm);

    this.leftArm = new THREE.Group();
    this.leftArm.position.set(0.35, 0.75, 0);
    this.torso.add(this.leftArm);
    this.leftArm.add(this.limbContainers.leftArm);

    // Legs
    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(-0.14, 1.18, 0);
    this.modelGroup.add(this.rightLeg);
    this.rightLeg.add(this.limbContainers.rightLeg);

    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(0.14, 1.18, 0);
    this.modelGroup.add(this.leftLeg);
    this.leftLeg.add(this.limbContainers.leftLeg);

    // Load parts
    GlobalModelLoader.loadOBJWithMTL('assets/models/prof_boss_torso.obj', 'assets/models/prof_boss.mtl').then(m => m && this.limbContainers.torso.add(m));
    GlobalModelLoader.loadOBJWithMTL('assets/models/prof_boss_arm_r.obj', 'assets/models/prof_boss.mtl').then(m => m && this.limbContainers.rightArm.add(m));
    GlobalModelLoader.loadOBJWithMTL('assets/models/prof_boss_arm_l.obj', 'assets/models/prof_boss.mtl').then(m => m && this.limbContainers.leftArm.add(m));
    GlobalModelLoader.loadOBJWithMTL('assets/models/prof_boss_leg_r.obj', 'assets/models/prof_boss.mtl').then(m => m && this.limbContainers.rightLeg.add(m));
    GlobalModelLoader.loadOBJWithMTL('assets/models/prof_boss_leg_l.obj', 'assets/models/prof_boss.mtl').then(m => m && this.limbContainers.leftLeg.add(m));

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

    // 3. Glowing Laser Eyes (aligned with 3D head on torso)
    const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8);
    this.laserEyeMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    
    this.eyeL = new THREE.Mesh(eyeGeo, this.laserEyeMat);
    this.eyeL.position.set(-0.14, 1.10, 0.16);
    this.torso.add(this.eyeL);

    this.eyeR = new THREE.Mesh(eyeGeo, this.laserEyeMat);
    this.eyeR.position.set(0.14, 1.10, 0.16);
    this.torso.add(this.eyeR);

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
    const t = this.stateTimer * 6.0;
    if (this.rightLeg && this.leftLeg) {
      this.rightLeg.rotation.x = Math.sin(t) * 0.50;
      this.leftLeg.rotation.x = -Math.sin(t) * 0.50;
    }
    if (this.rightArm && this.leftArm) {
      this.rightArm.rotation.x = -Math.sin(t) * 0.40;
      this.leftArm.rotation.x = Math.sin(t) * 0.40;
    }
    if (this.torso) {
      this.torso.position.y = 1.20 + Math.abs(Math.sin(t)) * 0.08;
      this.torso.rotation.y = Math.sin(t) * 0.05;
    }

    if (this.floorRune) this.floorRune.rotation.z += dt * 1.5;
    if (this.examRing) this.examRing.rotation.y += dt * 4.0;
  }

  animateTelegraph(progress) {
    if (this.rightArm && this.leftArm) {
      this.rightArm.rotation.x = -progress * 1.8;
      this.leftArm.rotation.x = -progress * 1.8;
    }
    if (this.torso) {
      this.torso.rotation.x = -progress * 0.35;
    }
    this.laserEyeMat.color.setHex(0xff0022);
  }

  animateAttack(progress) {
    if (this.rightArm && this.leftArm) {
      this.rightArm.rotation.x = 1.0 - progress * 2.4;
      this.leftArm.rotation.x = 1.0 - progress * 2.4;
    }
    if (this.torso) {
      this.torso.rotation.x = progress * 0.5 - 0.2;
    }
  }

  performAttack(player, audio, particles) {
    this.attackPatternIndex = (this.attackPatternIndex + 1) % 5;

    // =========================================================================
    // ATTACK 0: "🚪 PRENEZ LA PORTE !" (Porte d'Amphi Claquée au Sol)
    // =========================================================================
    if (this.attackPatternIndex === 0) {
      audio.playGroundSlam();

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

      setTimeout(() => {
        this.scene.remove(doorGroup);
        doorGroup.traverse(c => {
          if (c.geometry) c.geometry.dispose();
          if (c.material) c.material.dispose();
        });
      }, 2000);
    }
    // =========================================================================
    // ATTACK 1: "🚀 LANCER DE PORTE D'AMPHI !" (Porte 3D Volante)
    // =========================================================================
    else if (this.attackPatternIndex === 1) {
      audio.playSwing(true);
      particles.spawnHitSparks(this.position, 0, 0, 16, true);
      particles.spawnTextPopup("🚪 'C'EST LA PORTE POUR VOUS !'", this.position, '#ff2200', true);

      if (this.projectilesList) {
        const flyingDoor = new ThrownDoorProjectile(
          this.scene,
          this.position,
          player.position,
          16,
          40,
          true
        );
        this.projectilesList.push(flyingDoor);
      }
    }
    // =========================================================================
    // ATTACK 2: "📢 SILENCE AU FOND !" (Séisme d'ondes de choc)
    // =========================================================================
    else if (this.attackPatternIndex === 2) {
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
    // ATTACK 3: "📝 DISTRIBUTION DES COPIES 0/20 !" (Copies volantes)
    // =========================================================================
    else if (this.attackPatternIndex === 3) {
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
    // ATTACK 4: "🖊️ COUP DE STYLO ROUGE"
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

// ==========================================
// 5. 🦇 GARGOYLE (Flying Aerial Dive Bomber)
// ==========================================
export class Gargoyle extends Enemy {
  constructor(scene, x, z) {
    super(scene, x, z);
    this.type = 'GARGOYLE';
    this.maxHp = 95;
    this.hp = 95;
    this.damage = 18;
    this.moveSpeed = 7.5;
    this.attackRange = 3.5;
    this.telegraphDuration = 0.55;
    this.attackDuration = 0.35;
    this.scoreValue = 140;
    this.radius = 0.9;

    this.buildMesh();
  }

  buildMesh() {
    this.modelGroup = new THREE.Group();
    this.group.add(this.modelGroup);

    GlobalModelLoader.loadOBJWithMTL('assets/models/gargoyle.obj', 'assets/models/gargoyle.mtl').then((model) => {
      if (model) {
        model.scale.set(1.15, 1.15, 1.15);
        model.position.set(0, 0.85, 0);
        this.modelGroup.add(model);
      }
    });
  }

  animateWalk(dt) {
    this.position.y = 1.8 + Math.sin(this.stateTimer * 8) * 0.35;
    this.modelGroup.rotation.z = Math.sin(this.stateTimer * 8) * 0.15;
    this.modelGroup.rotation.x = 0.25;
  }

  animateTelegraph(progress) {
    this.position.y = 2.2 + progress * 0.5;
    this.modelGroup.rotation.x = -0.3;
  }

  animateAttack(progress) {
    this.position.y = Math.max(0.2, 2.7 - progress * 2.5);
    this.modelGroup.rotation.x = 0.6;
  }

  performAttack(player, audio, particles) {
    audio.playSwing(true);
    particles.spawnHitSparks(this.position, 0, 0, 10);

    const distSq = MathUtils.distSq2D(this.position.x, this.position.z, player.position.x, player.position.z);
    if (distSq <= (this.attackRange + 1.2) ** 2) {
      if (!player.isInvulnerable) {
        player.takeDamage(this.damage, audio, particles);
      }
    }
  }
}

// ==========================================
// 6. 🐸 TOXIC GROMP (Plague Acid Spitter)
// ==========================================
export class ToxicGromp extends Enemy {
  constructor(scene, x, z, projectilesList) {
    super(scene, x, z);
    this.type = 'TOXIC_GROMP';
    this.projectilesList = projectilesList;
    this.maxHp = 140;
    this.hp = 140;
    this.damage = 20;
    this.moveSpeed = 4.0;
    this.attackRange = 15.0;
    this.preferredRange = 9.0;
    this.telegraphDuration = 0.85;
    this.attackDuration = 0.35;
    this.cooldownDuration = 1.6;
    this.scoreValue = 200;
    this.radius = 1.1;

    this.buildMesh();
  }

  buildMesh() {
    this.modelGroup = new THREE.Group();
    this.group.add(this.modelGroup);

    GlobalModelLoader.loadOBJWithMTL('assets/models/toxic_gromp.obj', 'assets/models/toxic_gromp.mtl').then((model) => {
      if (model) {
        model.scale.set(1.2, 1.2, 1.2);
        model.position.set(0, 0.75, 0);
        this.modelGroup.add(model);
      }
    });
  }

  animateWalk(dt) {
    const hop = Math.abs(Math.sin(this.stateTimer * 6));
    this.position.y = hop * 0.45;
    this.modelGroup.scale.set(1.0 + hop * 0.1, 1.0 - hop * 0.1, 1.0 + hop * 0.1);
  }

  animateTelegraph(progress) {
    this.modelGroup.scale.set(1.0 + progress * 0.25, 1.0 + progress * 0.25, 1.0 + progress * 0.25);
  }

  animateAttack(progress) {
    this.modelGroup.scale.set(1.0, 1.0, 1.0);
  }

  performAttack(player, audio, particles) {
    audio.playPlayerHurt();
    particles.spawnHitSparks(this.position, 0, 0, 12);
    particles.spawnTextPopup("🧪 CRACHAT TOXIQUE !", this.position, '#33ff00', true);

    if (this.projectilesList) {
      const acid = new ToxicPuddleProjectile(this.scene, this.position, player.position, 14, this.damage);
      this.projectilesList.push(acid);
    }
  }
}

// ==========================================
// 7. 🛡️ CURSED KNIGHT (Skeleton Shield Bearer)
// ==========================================
export class CursedKnight extends Enemy {
  constructor(scene, x, z) {
    super(scene, x, z);
    this.type = 'CURSED_KNIGHT';
    this.maxHp = 190;
    this.hp = 190;
    this.damage = 26;
    this.moveSpeed = 4.8;
    this.attackRange = 2.8;
    this.telegraphDuration = 0.75;
    this.attackDuration = 0.4;
    this.cooldownDuration = 0.8;
    this.scoreValue = 220;
    this.radius = 1.0;
    this.isShieldStaggered = false;
    this.staggerTimer = 0;

    this.buildMesh();
  }

  buildMesh() {
    this.modelGroup = new THREE.Group();
    this.group.add(this.modelGroup);

    GlobalModelLoader.loadOBJWithMTL('assets/models/cursed_knight.obj', 'assets/models/cursed_knight.mtl').then((model) => {
      if (model) {
        model.scale.set(1.25, 1.25, 1.25);
        model.position.set(0, 1.15, 0);
        this.modelGroup.add(model);
      }
    });
  }

  takeDamage(amount, dirX = 0, dirZ = 0, knockForce = 10, isCrit = false) {
    if (this.isDead) return;

    // Check if attack hit front of shield
    const attackAngle = Math.atan2(-dirX, -dirZ);
    const angleDiff = Math.abs(MathUtils.angleDiff(attackAngle, this.rotationY));

    // Shield blocks frontal attacks unless heavy attack / crit breaks guard!
    if (!this.isShieldStaggered && angleDiff < Math.PI * 0.45 && !isCrit && knockForce < 20) {
      this.stateTimer = 0;
      return; // 100% BLOCKED
    }

    if (isCrit || knockForce >= 20) {
      this.isShieldStaggered = true;
      this.staggerTimer = 1.8;
    }

    super.takeDamage(amount, dirX, dirZ, knockForce, isCrit);
  }

  update(dt, player, audio, particles) {
    if (this.isShieldStaggered) {
      this.staggerTimer -= dt;
      if (this.staggerTimer <= 0) {
        this.isShieldStaggered = false;
      }
    }
    super.update(dt, player, audio, particles);
  }

  animateWalk(dt) {
    this.modelGroup.position.y = Math.abs(Math.sin(this.stateTimer * 6)) * 0.1;
  }

  animateTelegraph(progress) {
    this.modelGroup.rotation.y = this.rotationY + progress * 0.4;
  }

  animateAttack(progress) {
    this.modelGroup.rotation.y = this.rotationY - progress * 0.6;
  }

  performAttack(player, audio, particles) {
    audio.playSwing(true);
    particles.spawnHitSparks(this.position, 0, 0, 10);

    const distSq = MathUtils.distSq2D(this.position.x, this.position.z, player.position.x, player.position.z);
    if (distSq <= (this.attackRange + 0.8) ** 2) {
      if (!player.isInvulnerable) {
        player.takeDamage(this.damage, audio, particles);
      }
    }
  }
}

// ==========================================
// 8. 😈 SEIGNEUR DÉMON MALAKOR (Boss Vague 10)
// ==========================================
export class DemonLordBoss extends Enemy {
  constructor(scene, x, z, projectilesList) {
    super(scene, x, z);
    this.type = 'BOSS_DEMON';
    this.projectilesList = projectilesList;
    this.maxHp = 2800;
    this.hp = 2800;
    this.damage = 48;
    this.moveSpeed = 4.4;
    this.attackRange = 6.0;
    this.telegraphDuration = 1.1;
    this.attackDuration = 0.55;
    this.cooldownDuration = 0.7;
    this.scoreValue = 5000;
    this.radius = 2.6;
    this.isEnraged = false;
    this.attackPatternIndex = 0;

    this.buildMesh();
  }

  buildMesh() {
    this.modelGroup = new THREE.Group();
    this.group.add(this.modelGroup);

    // Torso joint
    this.torso = new THREE.Group();
    this.torso.position.y = 0.0;
    this.modelGroup.add(this.torso);

    this.limbContainers = {
      torso: new THREE.Group(),
      rightArm: new THREE.Group(),
      leftArm: new THREE.Group(),
      rightLeg: new THREE.Group(),
      leftLeg: new THREE.Group()
    };

    this.torso.add(this.limbContainers.torso);

    // Right Arm (centered at shoulder pivot)
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.42, 1.85, 0.0);
    this.torso.add(this.rightArm);
    this.rightArm.add(this.limbContainers.rightArm);

    // Left Arm (centered at shoulder pivot)
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.42, 1.85, 0.0);
    this.torso.add(this.leftArm);
    this.leftArm.add(this.limbContainers.leftArm);

    // Legs / Hooves
    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.20, 0.95, 0.0);
    this.modelGroup.add(this.rightLeg);
    this.rightLeg.add(this.limbContainers.rightLeg);

    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.20, 0.95, 0.0);
    this.modelGroup.add(this.leftLeg);
    this.leftLeg.add(this.limbContainers.leftLeg);

    // Load modular OBJ parts
    GlobalModelLoader.loadOBJWithMTL('assets/models/demon_lord_torso.obj', 'assets/models/demon_lord_torso.mtl').then(m => m && this.limbContainers.torso.add(m));
    GlobalModelLoader.loadOBJWithMTL('assets/models/demon_lord_arm_r.obj', 'assets/models/demon_lord_arm_r.mtl').then(m => m && this.limbContainers.rightArm.add(m));
    GlobalModelLoader.loadOBJWithMTL('assets/models/demon_lord_arm_l.obj', 'assets/models/demon_lord_arm_l.mtl').then(m => m && this.limbContainers.leftArm.add(m));
    GlobalModelLoader.loadOBJWithMTL('assets/models/demon_lord_leg_r.obj', 'assets/models/demon_lord_leg_r.mtl').then(m => m && this.limbContainers.rightLeg.add(m));
    GlobalModelLoader.loadOBJWithMTL('assets/models/demon_lord_leg_l.obj', 'assets/models/demon_lord_leg_l.mtl').then(m => m && this.limbContainers.leftLeg.add(m));

    // Glowing Magma Eyes
    const eyeGeo = new THREE.SphereGeometry(0.05, 8, 8);
    this.magmaEyeMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
    
    this.eyeL = new THREE.Mesh(eyeGeo, this.magmaEyeMat);
    this.eyeL.position.set(-0.09, 1.98, 0.16);
    this.torso.add(this.eyeL);

    this.eyeR = new THREE.Mesh(eyeGeo, this.magmaEyeMat);
    this.eyeR.position.set(0.09, 1.98, 0.16);
    this.torso.add(this.eyeR);

    // Fiery Hellfire Floor Rune
    const runeGeo = new THREE.RingGeometry(2.2, 3.6, 32);
    this.hellfireRuneMat = new THREE.MeshBasicMaterial({ color: 0xff2200, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
    this.hellfireRune = new THREE.Mesh(runeGeo, this.hellfireRuneMat);
    this.hellfireRune.rotation.x = -Math.PI / 2;
    this.hellfireRune.position.y = 0.06;
    this.group.add(this.hellfireRune);

    // Floor Shadow
    const shadowGeo = new THREE.RingGeometry(0.2, 2.2, 24);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5 });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.05;
    this.group.add(shadow);

    this.telegraphMesh.geometry.dispose();
    this.telegraphMesh.geometry = new THREE.RingGeometry(0.4, 9.5, 36);
  }

  animateWalk(dt) {
    const t = this.stateTimer * 5.0;
    if (this.rightLeg && this.leftLeg) {
      this.rightLeg.rotation.x = Math.sin(t) * 0.45;
      this.leftLeg.rotation.x = -Math.sin(t) * 0.45;
    }
    if (this.rightArm && this.leftArm) {
      this.rightArm.rotation.x = -Math.sin(t) * 0.35;
      this.leftArm.rotation.x = Math.sin(t) * 0.35;
    }
    if (this.torso) {
      this.torso.position.y = Math.abs(Math.sin(t)) * 0.10;
      this.torso.rotation.y = Math.sin(t) * 0.05;
    }
    if (this.hellfireRune) {
      this.hellfireRune.rotation.z += dt * 1.8;
    }
  }

  animateTelegraph(progress) {
    if (this.rightArm && this.leftArm) {
      this.rightArm.rotation.x = -progress * 1.8;
      this.leftArm.rotation.x = -progress * 1.8;
    }
    if (this.torso) {
      this.torso.rotation.x = -progress * 0.35;
    }
  }

  animateAttack(progress) {
    if (this.rightArm && this.leftArm) {
      this.rightArm.rotation.x = -1.8 + progress * 2.6;
      this.leftArm.rotation.x = -1.8 + progress * 2.6;
    }
    if (this.torso) {
      this.torso.rotation.x = progress * 0.5 - 0.2;
    }
  }

  performAttack(player, audio, particles) {
    this.attackPatternIndex = (this.attackPatternIndex + 1) % 4;

    // Pattern 0: Meteor Shower
    if (this.attackPatternIndex === 0) {
      audio.playMagicCast(true);
      particles.spawnTextPopup("☄️ PLUIE DE MÉTÉORES !", this.position, '#ff3300', true);

      if (this.projectilesList) {
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            if (this.projectilesList) {
              const targetOffset = {
                x: player.position.x + (Math.random() * 6 - 3),
                y: 0,
                z: player.position.z + (Math.random() * 6 - 3)
              };
              const meteor = new DemonMeteorProjectile(this.scene, targetOffset, 45);
              this.projectilesList.push(meteor);
            }
          }, i * 350);
        }
      }
    }
    // Pattern 1: Magma Ground Slam
    else if (this.attackPatternIndex === 1) {
      audio.playGroundSlam();
      particles.spawnShockwave(this.position, 12.0, 0xff2200, 0.8);
      particles.spawnTextPopup("🔥 SEISME DE MAGMA !", this.position, '#ff2200', true);

      const distSq = MathUtils.distSq2D(this.position.x, this.position.z, player.position.x, player.position.z);
      if (distSq <= 8.5 * 8.5 && !player.isInvulnerable) {
        player.takeDamage(this.damage * 1.2, audio, particles);
        const dx = player.position.x - this.position.x;
        const dz = player.position.z - this.position.z;
        const len = Math.sqrt(dx * dx + dz * dz) || 1;
        player.velocity.x = (dx / len) * 25;
        player.velocity.z = (dz / len) * 25;
      }
    }
    // Pattern 2: Hellfire Cleaver Slash
    else if (this.attackPatternIndex === 2) {
      audio.playSwing(true);
      particles.spawnHitSparks(this.position, 0, 0, 18, true);
      particles.spawnTextPopup("⚔️ TRANCHANT INFERNAL !", this.position, '#ff6600', true);

      const distSq = MathUtils.distSq2D(this.position.x, this.position.z, player.position.x, player.position.z);
      if (distSq <= 6.5 * 6.5 && !player.isInvulnerable) {
        player.takeDamage(this.damage, audio, particles);
      }
    }
    // Pattern 3: Infernal Roar
    else {
      audio.playPlayerHurt();
      particles.spawnShockwave(this.position, 9.0, 0xff0044, 0.6);
      particles.spawnTextPopup("📢 RUGISSEMENT D'ABYSSES !", this.position, '#ff0044', true);

      const dx = player.position.x - this.position.x;
      const dz = player.position.z - this.position.z;
      const len = Math.sqrt(dx * dx + dz * dz) || 1;
      player.velocity.x = (dx / len) * 22;
      player.velocity.z = (dz / len) * 22;
    }

    if (this.hp < this.maxHp * 0.5 && !this.isEnraged) {
      this.isEnraged = true;
      this.moveSpeed = 5.8;
      this.telegraphDuration = 0.75;
      particles.spawnTextPopup("🔥 MALAKOR ENTRE EN ENRAGE ! 🔥", this.position, '#ff0000', true);
    }
  }
}

// ==========================================
// 9. 💀 ROI LICHE MORTIS (Boss Vague 15)
// ==========================================
export class LichKingBoss extends Enemy {
  constructor(scene, x, z, projectilesList) {
    super(scene, x, z);
    this.type = 'BOSS_LICH';
    this.projectilesList = projectilesList;
    this.maxHp = 3400;
    this.hp = 3400;
    this.damage = 44;
    this.moveSpeed = 4.0;
    this.attackRange = 16.0;
    this.preferredRange = 10.0;
    this.telegraphDuration = 1.0;
    this.attackDuration = 0.5;
    this.cooldownDuration = 0.8;
    this.scoreValue = 7500;
    this.radius = 2.4;
    this.isEnraged = false;
    this.attackPatternIndex = 0;

    this.buildMesh();
  }

  buildMesh() {
    this.modelGroup = new THREE.Group();
    this.group.add(this.modelGroup);

    // Torso joint
    this.torso = new THREE.Group();
    this.torso.position.y = 0.0;
    this.modelGroup.add(this.torso);

    this.limbContainers = {
      torso: new THREE.Group(),
      rightArm: new THREE.Group(),
      leftArm: new THREE.Group(),
      rightLeg: new THREE.Group(),
      leftLeg: new THREE.Group()
    };

    this.torso.add(this.limbContainers.torso);

    // Right Arm (centered at shoulder pivot)
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.30, 1.74, 0.16);
    this.torso.add(this.rightArm);
    this.rightArm.add(this.limbContainers.rightArm);

    // Left Arm (centered at shoulder pivot)
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.32, 1.74, 0.16);
    this.torso.add(this.leftArm);
    this.leftArm.add(this.limbContainers.leftArm);

    // Legs / Lower Robe base
    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.15, 0.35, 0);
    this.modelGroup.add(this.rightLeg);
    this.rightLeg.add(this.limbContainers.rightLeg);

    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.15, 0.35, 0);
    this.modelGroup.add(this.leftLeg);
    this.leftLeg.add(this.limbContainers.leftLeg);

    // Load modular OBJ parts
    GlobalModelLoader.loadOBJWithMTL('assets/models/lich_king_torso.obj', 'assets/models/lich_king_torso.mtl').then(m => m && this.limbContainers.torso.add(m));
    GlobalModelLoader.loadOBJWithMTL('assets/models/lich_king_arm_r.obj', 'assets/models/lich_king_arm_r.mtl').then(m => m && this.limbContainers.rightArm.add(m));
    GlobalModelLoader.loadOBJWithMTL('assets/models/lich_king_arm_l.obj', 'assets/models/lich_king_arm_l.mtl').then(m => m && this.limbContainers.leftArm.add(m));
    GlobalModelLoader.loadOBJWithMTL('assets/models/lich_king_leg_r.obj', 'assets/models/lich_king_leg_r.mtl').then(m => m && this.limbContainers.rightLeg.add(m));
    GlobalModelLoader.loadOBJWithMTL('assets/models/lich_king_leg_l.obj', 'assets/models/lich_king_leg_l.mtl').then(m => m && this.limbContainers.leftLeg.add(m));

    // Glowing Icy Cyan Skull Eyes
    const eyeGeo = new THREE.SphereGeometry(0.045, 8, 8);
    this.iceEyeMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    
    this.eyeL = new THREE.Mesh(eyeGeo, this.iceEyeMat);
    this.eyeL.position.set(-0.08, 1.96, 0.14);
    this.torso.add(this.eyeL);

    this.eyeR = new THREE.Mesh(eyeGeo, this.iceEyeMat);
    this.eyeR.position.set(0.08, 1.96, 0.14);
    this.torso.add(this.eyeR);

    // Ethereal Necrotic Floor Rune
    const runeGeo = new THREE.RingGeometry(2.0, 3.2, 32);
    this.frostRuneMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
    this.frostRune = new THREE.Mesh(runeGeo, this.frostRuneMat);
    this.frostRune.rotation.x = -Math.PI / 2;
    this.frostRune.position.y = 0.06;
    this.group.add(this.frostRune);

    // Shadow on floor
    const shadowGeo = new THREE.RingGeometry(0.2, 2.0, 24);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5 });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.05;
    this.group.add(shadow);

    this.telegraphMesh.geometry.dispose();
    this.telegraphMesh.geometry = new THREE.RingGeometry(0.4, 9.0, 36);
  }

  animateWalk(dt) {
    const t = this.stateTimer * 3.5;
    // Eerie floating hover motion
    this.position.y = 0.6 + Math.sin(t) * 0.25;

    if (this.rightArm && this.leftArm) {
      this.rightArm.rotation.x = Math.sin(t) * 0.20;
      this.rightArm.rotation.z = Math.sin(t * 0.5) * 0.10;
      this.leftArm.rotation.x = -Math.sin(t) * 0.20;
      this.leftArm.rotation.z = -Math.sin(t * 0.5) * 0.10;
    }
    if (this.torso) {
      this.torso.rotation.y = Math.sin(t * 0.7) * 0.08;
      this.torso.rotation.x = 0.05;
    }
    if (this.frostRune) {
      this.frostRune.rotation.z += dt * 1.6;
    }
  }

  animateTelegraph(progress) {
    // Rise high and raise casting skeletal arms
    this.position.y = 0.8 + progress * 0.6;
    if (this.rightArm && this.leftArm) {
      this.rightArm.rotation.x = -progress * 1.9;
      this.rightArm.rotation.z = progress * 0.4;
      this.leftArm.rotation.x = -progress * 1.9;
      this.leftArm.rotation.z = -progress * 0.4;
    }
    if (this.torso) {
      this.torso.rotation.x = -progress * 0.3;
    }
  }

  animateAttack(progress) {
    // Thrust spellcast forward
    this.position.y = 0.7;
    if (this.rightArm && this.leftArm) {
      this.rightArm.rotation.x = -1.9 + progress * 2.8;
      this.leftArm.rotation.x = -1.9 + progress * 2.8;
    }
    if (this.torso) {
      this.torso.rotation.x = progress * 0.4 - 0.2;
    }
  }

  performAttack(player, audio, particles) {
    this.attackPatternIndex = (this.attackPatternIndex + 1) % 4;

    // Pattern 0: Death Ray Beam
    if (this.attackPatternIndex === 0) {
      audio.playMagicCast(true);
      particles.spawnTextPopup("⚡ RAYON DE MORT SPECTRALE !", this.position, '#00f0ff', true);

      if (this.projectilesList) {
        const beam = new DeathRayProjectile(this.scene, this.position, player.position, 26, 40);
        this.projectilesList.push(beam);
      }
    }
    // Pattern 1: Soul Blizzard Vortex
    else if (this.attackPatternIndex === 1) {
      audio.playMagicCast(false);
      particles.spawnShockwave(player.position, 8.0, 0x00ffff, 0.7);
      particles.spawnTextPopup("❄️ BLIZZARD D'ÂMES GELÉES !", player.position, '#00ffff', true);

      const distSq = MathUtils.distSq2D(this.position.x, this.position.z, player.position.x, player.position.z);
      if (distSq <= 10.0 * 10.0 && !player.isInvulnerable) {
        player.takeDamage(this.damage, audio, particles);
      }
    }
    // Pattern 2: Summon Undead Minions
    else if (this.attackPatternIndex === 2) {
      audio.playMagicCast(true);
      particles.spawnShockwave(this.position, 7.0, 0x00ff66, 0.6);
      particles.spawnTextPopup("🧟 ARMÉE DES MORTS !", this.position, '#00ff66', true);

      // Spawn Bonklings / Skeletons around boss
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2;
        const b = new Bonkling(this.scene, this.position.x + Math.sin(angle) * 3, this.position.z + Math.cos(angle) * 3);
        if (this.scene) {
          // Add to enemy list if available through event or hook
        }
      }
    }
    // Pattern 3: Soul Nova 360
    else {
      audio.playGroundSlam();
      particles.spawnShockwave(this.position, 11.0, 0x9900ff, 0.8);
      particles.spawnTextPopup("🔮 SUPERNOVA DES ÂMES !", this.position, '#9900ff', true);

      const distSq = MathUtils.distSq2D(this.position.x, this.position.z, player.position.x, player.position.z);
      if (distSq <= 8.5 * 8.5 && !player.isInvulnerable) {
        player.takeDamage(this.damage * 1.15, audio, particles);
      }
    }

    if (this.hp < this.maxHp * 0.5 && !this.isEnraged) {
      this.isEnraged = true;
      this.moveSpeed = 5.2;
      this.telegraphDuration = 0.7;
      particles.spawnTextPopup("💀 MORTIS DÉCHAÎNE LE NÉANT ! 💀", this.position, '#00e5ff', true);
    }
  }
}

// ==========================================
// 10. 🗿 TITAN ANCIEN DE PIERRE (Boss Vague 20)
// ==========================================
export class TitanGolemBoss extends Enemy {
  constructor(scene, x, z, projectilesList) {
    super(scene, x, z);
    this.type = 'BOSS_TITAN';
    this.projectilesList = projectilesList;
    this.maxHp = 4500;
    this.hp = 4500;
    this.damage = 55;
    this.moveSpeed = 3.6;
    this.attackRange = 7.0;
    this.telegraphDuration = 1.3;
    this.attackDuration = 0.6;
    this.cooldownDuration = 0.9;
    this.scoreValue = 10000;
    this.radius = 3.2;
    this.isEnraged = false;
    this.attackPatternIndex = 0;

    this.buildMesh();
  }

  buildMesh() {
    this.modelGroup = new THREE.Group();
    this.group.add(this.modelGroup);

    // Torso joint
    this.torso = new THREE.Group();
    this.torso.position.y = 0.0;
    this.modelGroup.add(this.torso);

    this.limbContainers = {
      torso: new THREE.Group(),
      rightArm: new THREE.Group(),
      leftArm: new THREE.Group(),
      rightLeg: new THREE.Group(),
      leftLeg: new THREE.Group()
    };

    this.torso.add(this.limbContainers.torso);

    // Right Arm (centered at shoulder pivot)
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.55, 2.15, 0.0);
    this.torso.add(this.rightArm);
    this.rightArm.add(this.limbContainers.rightArm);

    // Left Arm (centered at shoulder pivot)
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.55, 2.15, 0.0);
    this.torso.add(this.leftArm);
    this.leftArm.add(this.limbContainers.leftArm);

    // Legs / Stone Pillars
    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.28, 1.15, 0.0);
    this.modelGroup.add(this.rightLeg);
    this.rightLeg.add(this.limbContainers.rightLeg);

    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.28, 1.15, 0.0);
    this.modelGroup.add(this.leftLeg);
    this.leftLeg.add(this.limbContainers.leftLeg);

    // Load modular OBJ parts
    GlobalModelLoader.loadOBJWithMTL('assets/models/titan_golem_torso.obj', 'assets/models/titan_golem_torso.mtl').then(m => m && this.limbContainers.torso.add(m));
    GlobalModelLoader.loadOBJWithMTL('assets/models/titan_golem_arm_r.obj', 'assets/models/titan_golem_arm_r.mtl').then(m => m && this.limbContainers.rightArm.add(m));
    GlobalModelLoader.loadOBJWithMTL('assets/models/titan_golem_arm_l.obj', 'assets/models/titan_golem_arm_l.mtl').then(m => m && this.limbContainers.leftArm.add(m));
    GlobalModelLoader.loadOBJWithMTL('assets/models/titan_golem_leg_r.obj', 'assets/models/titan_golem_leg_r.mtl').then(m => m && this.limbContainers.rightLeg.add(m));
    GlobalModelLoader.loadOBJWithMTL('assets/models/titan_golem_leg_l.obj', 'assets/models/titan_golem_leg_l.mtl').then(m => m && this.limbContainers.leftLeg.add(m));

    // Glowing Golden Cyclops Eye
    const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8);
    this.golemEyeMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    
    this.eye = new THREE.Mesh(eyeGeo, this.golemEyeMat);
    this.eye.position.set(0.0, 2.46, 0.16);
    this.torso.add(this.eye);

    // Seismic Earth Floor Rune
    const runeGeo = new THREE.RingGeometry(2.6, 4.2, 32);
    this.seismicRuneMat = new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
    this.seismicRune = new THREE.Mesh(runeGeo, this.seismicRuneMat);
    this.seismicRune.rotation.x = -Math.PI / 2;
    this.seismicRune.position.y = 0.06;
    this.group.add(this.seismicRune);

    // Floor Shadow
    const shadowGeo = new THREE.RingGeometry(0.3, 2.6, 24);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5 });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.05;
    this.group.add(shadow);

    this.telegraphMesh.geometry.dispose();
    this.telegraphMesh.geometry = new THREE.RingGeometry(0.5, 12.0, 40);
  }

  animateWalk(dt) {
    const t = this.stateTimer * 4.0;
    if (this.rightLeg && this.leftLeg) {
      this.rightLeg.rotation.x = Math.sin(t) * 0.40;
      this.leftLeg.rotation.x = -Math.sin(t) * 0.40;
    }
    if (this.rightArm && this.leftArm) {
      this.rightArm.rotation.x = -Math.sin(t) * 0.30;
      this.leftArm.rotation.x = Math.sin(t) * 0.30;
    }
    if (this.torso) {
      this.torso.position.y = Math.abs(Math.sin(t)) * 0.12;
      this.torso.rotation.y = Math.sin(t) * 0.04;
    }
    if (this.seismicRune) {
      this.seismicRune.rotation.z += dt * 1.4;
    }
  }

  animateTelegraph(progress) {
    if (this.rightArm && this.leftArm) {
      this.rightArm.rotation.x = -progress * 2.0;
      this.leftArm.rotation.x = -progress * 2.0;
    }
    if (this.torso) {
      this.torso.rotation.x = -progress * 0.4;
    }
  }

  animateAttack(progress) {
    if (this.rightArm && this.leftArm) {
      this.rightArm.rotation.x = -2.0 + progress * 2.8;
      this.leftArm.rotation.x = -2.0 + progress * 2.8;
    }
    if (this.torso) {
      this.torso.rotation.x = progress * 0.6 - 0.2;
    }
  }

  performAttack(player, audio, particles) {
    this.attackPatternIndex = (this.attackPatternIndex + 1) % 4;

    // Pattern 0: Cataclysmic Earth Stomp
    if (this.attackPatternIndex === 0) {
      audio.playGroundSlam();
      particles.spawnShockwave(this.position, 14.0, 0xffd700, 0.9);
      particles.spawnTextPopup("💥 SÉISME CATACLYSMIQUE !", this.position, '#ffd700', true);

      const distSq = MathUtils.distSq2D(this.position.x, this.position.z, player.position.x, player.position.z);
      if (distSq <= 10.5 * 10.5 && !player.isInvulnerable) {
        player.takeDamage(this.damage * 1.3, audio, particles);
        const dx = player.position.x - this.position.x;
        const dz = player.position.z - this.position.z;
        const len = Math.sqrt(dx * dx + dz * dz) || 1;
        player.velocity.x = (dx / len) * 30;
        player.velocity.z = (dz / len) * 30;
      }
    }
    // Pattern 1: Rolling Boulder Toss
    else if (this.attackPatternIndex === 1) {
      audio.playSwing(true);
      particles.spawnTextPopup("🪨 LANCER DE MONOLITHE !", this.position, '#aaaaaa', true);

      if (this.projectilesList) {
        const boulder = new BoulderProjectile(this.scene, this.position, player.position, 16, 45);
        this.projectilesList.push(boulder);
      }
    }
    // Pattern 2: Ancient Eye Laser Beam
    else if (this.attackPatternIndex === 2) {
      audio.playMagicCast(true);
      particles.spawnShockwave(this.position, 10.0, 0xffaa00, 0.7);
      particles.spawnTextPopup("☀️ RAYON OCULAIRE ANCIEN !", this.position, '#ffaa00', true);

      if (this.projectilesList) {
        const laser = new DeathRayProjectile(this.scene, this.position, player.position, 28, 50);
        this.projectilesList.push(laser);
      }
    }
    // Pattern 3: Rock Fists Smash
    else {
      audio.playGroundSlam();
      particles.spawnHitSparks(this.position, 0, 0, 20, true);
      particles.spawnTextPopup("🔨 DOUBLE FRACAS DE PIERRE !", this.position, '#ffffff', true);

      const distSq = MathUtils.distSq2D(this.position.x, this.position.z, player.position.x, player.position.z);
      if (distSq <= 7.5 * 7.5 && !player.isInvulnerable) {
        player.takeDamage(this.damage, audio, particles);
      }
    }

    if (this.hp < this.maxHp * 0.5 && !this.isEnraged) {
      this.isEnraged = true;
      this.moveSpeed = 4.8;
      this.telegraphDuration = 0.9;
      particles.spawnTextPopup("🗿 ÉVEIL TOTAL DU TITAN ! 🗿", this.position, '#ffd700', true);
    }
  }
}
