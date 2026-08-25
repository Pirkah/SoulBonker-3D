import * as THREE from '../../libs/three.module.js';
import { Enemy } from './Enemy.js';
import { Projectile, ExamPaperProjectile } from './Projectile.js';
import { MathUtils } from '../utils/MathUtils.js';

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
    const bodyGeo = new THREE.DodecahedronGeometry(0.5);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x33aa44, roughness: 0.7 });
    this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.bodyMesh.position.y = 0.6;
    this.bodyMesh.castShadow = true;
    this.group.add(this.bodyMesh);

    const eyeGeo = new THREE.BoxGeometry(0.12, 0.08, 0.1);
    this.eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0022 });
    const eyeL = new THREE.Mesh(eyeGeo, this.eyeMat);
    eyeL.position.set(-0.18, 0.15, 0.4);
    this.bodyMesh.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, this.eyeMat);
    eyeR.position.set(0.18, 0.15, 0.4);
    this.bodyMesh.add(eyeR);

    const batGeo = new THREE.CylinderGeometry(0.08, 0.14, 0.9, 6);
    const batMat = new THREE.MeshStandardMaterial({ color: 0x664422 });
    this.bat = new THREE.Mesh(batGeo, batMat);
    this.bat.position.set(0.4, 0.6, 0.3);
    this.bat.rotation.set(0.2, 0, -0.4);
    this.group.add(this.bat);
  }

  animateWalk(dt) {
    this.bodyMesh.position.y = 0.6 + Math.abs(Math.sin(this.stateTimer * 12)) * 0.2;
    this.bat.rotation.x = 0.2 + Math.sin(this.stateTimer * 12) * 0.3;
  }

  animateTelegraph(progress) {
    this.bodyMesh.position.y = 0.6 + Math.sin(progress * Math.PI) * 0.3;
    this.bat.rotation.x = -progress * 1.5;
  }

  animateAttack(progress) {
    this.bat.rotation.x = progress * 2.0 - 0.5;
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
    this.group.scale.set(1.4, 1.4, 1.4);

    const bodyGeo = new THREE.BoxGeometry(1.2, 1.4, 1.0);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x444b59, roughness: 0.8 });
    this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.bodyMesh.position.y = 1.2;
    this.bodyMesh.castShadow = true;
    this.group.add(this.bodyMesh);

    const hornGeo = new THREE.ConeGeometry(0.18, 0.6, 5);
    const hornMat = new THREE.MeshStandardMaterial({ color: 0xaa2222, roughness: 0.3 });
    const hornL = new THREE.Mesh(hornGeo, hornMat);
    hornL.position.set(-0.45, 0.7, 0.2);
    hornL.rotation.z = 0.6;
    this.bodyMesh.add(hornL);

    const hornR = new THREE.Mesh(hornGeo, hornMat);
    hornR.position.set(0.45, 0.7, 0.2);
    hornR.rotation.z = -0.6;
    this.bodyMesh.add(hornR);

    const handleGeo = new THREE.CylinderGeometry(0.1, 0.1, 2.2, 8);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x332211 });
    this.hammer = new THREE.Mesh(handleGeo, handleMat);
    
    const headGeo = new THREE.BoxGeometry(0.8, 1.2, 0.8);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x666b75, metalness: 0.4 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.0;
    this.hammer.add(head);

    this.hammer.position.set(0.9, 1.0, 0.3);
    this.hammer.rotation.set(-0.2, 0, -0.4);
    this.group.add(this.hammer);

    this.telegraphMesh.geometry.dispose();
    this.telegraphMesh.geometry = new THREE.RingGeometry(0.2, 4.2, 32);
  }

  animateWalk(dt) {
    this.bodyMesh.position.y = 1.2 + Math.abs(Math.sin(this.stateTimer * 6)) * 0.15;
    this.bodyMesh.rotation.z = Math.sin(this.stateTimer * 6) * 0.1;
  }

  animateTelegraph(progress) {
    this.hammer.rotation.x = -progress * Math.PI * 1.1;
    this.hammer.position.y = 1.0 + progress * 0.8;
    this.bodyMesh.rotation.x = -progress * 0.3;
  }

  animateAttack(progress) {
    this.hammer.rotation.x = progress * Math.PI * 1.3 - 1.0;
    this.bodyMesh.rotation.x = progress * 0.4;
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
    const robeGeo = new THREE.ConeGeometry(0.6, 1.6, 8);
    const robeMat = new THREE.MeshStandardMaterial({ color: 0x4a1568, roughness: 0.6 });
    this.bodyMesh = new THREE.Mesh(robeGeo, robeMat);
    this.bodyMesh.position.y = 1.2;
    this.group.add(this.bodyMesh);

    const coreGeo = new THREE.SphereGeometry(0.25, 8, 8);
    this.coreMat = new THREE.MeshBasicMaterial({ color: 0xcc00ff });
    this.core = new THREE.Mesh(coreGeo, this.coreMat);
    this.core.position.y = 1.6;
    this.group.add(this.core);

    const crystalGeo = new THREE.OctahedronGeometry(0.25);
    const crystalMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    this.crystal = new THREE.Mesh(crystalGeo, crystalMat);
    this.crystal.position.set(0.6, 1.5, 0.4);
    this.group.add(this.crystal);
  }

  animateWalk(dt) {
    this.position.y = 0.3 + Math.sin(this.stateTimer * 4) * 0.25;
    this.crystal.rotation.y += dt * 5;
  }

  animateTelegraph(progress) {
    this.coreMat.color.setHex(0xff00ff);
    this.crystal.position.y = 1.5 + progress * 0.6;
  }

  animateAttack(progress) {
    this.crystal.position.y = 1.8 - progress * 0.4;
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
// 4. LE PROFESSEUR D'AMPHI (Main Boss - Exact Clean Cutout)
// ==========================================
let cachedProfTexture = null;

function getProfessorFullBodyTexture() {
  if (cachedProfTexture) return cachedProfTexture;
  const loader = new THREE.TextureLoader();
  cachedProfTexture = loader.load('assets/prof_boss_clean.png');
  return cachedProfTexture;
}

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
      "SILENCE AU FOND !",
      "INTERRO SURPRISE ! 0/20",
      "VOUS IREZ EN RATTRAPAGE !",
      "RANGEZ VOS AFFAIRES !",
      "LE COURS EST TERMINÉ !"
    ];

    this.buildProfessorMesh();
  }

  buildProfessorMesh() {
    this.group.scale.set(1.0, 1.0, 1.0);

    // 1. FULL-BODY STANDING CUTOUT (Exact Photo from assets/prof_boss_clean.png)
    const profTexture = getProfessorFullBodyTexture();
    const bodyGeo = new THREE.PlaneGeometry(2.1, 5.17);
    this.bodyMat = new THREE.MeshBasicMaterial({
      map: profTexture,
      side: THREE.DoubleSide,
      transparent: true,
      alphaTest: 0.08
    });

    this.bodyMesh = new THREE.Mesh(bodyGeo, this.bodyMat);
    this.bodyMesh.position.y = 2.58; // Feet solidly planted on the floor!
    this.group.add(this.bodyMesh);

    // 3D Shadow on the floor beneath his shoes
    const shadowGeo = new THREE.RingGeometry(0.2, 1.6, 24);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5 });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.05;
    this.group.add(shadow);

    // Glowing Academic Rune on the floor
    const runeGeo = new THREE.RingGeometry(1.6, 2.2, 32);
    this.floorRuneMat = new THREE.MeshBasicMaterial({ color: 0xff0044, transparent: true, opacity: 0.45 });
    this.floorRune = new THREE.Mesh(runeGeo, this.floorRuneMat);
    this.floorRune.rotation.x = -Math.PI / 2;
    this.floorRune.position.y = 0.06;
    this.group.add(this.floorRune);

    // 2. LASER EYES (Aligned with his eyes in the photo at Y = 4.45)
    const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8);
    this.laserEyeMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    
    this.eyeL = new THREE.Mesh(eyeGeo, this.laserEyeMat);
    this.eyeL.position.set(-0.16, 4.45, 0.08);
    this.group.add(this.eyeL);

    this.eyeR = new THREE.Mesh(eyeGeo, this.laserEyeMat);
    this.eyeR.position.set(0.16, 4.45, 0.08);
    this.group.add(this.eyeR);

    // 3. COLOSSAL RED GRADING PEN ("STYLO ROUGE 0/20")
    this.penGroup = new THREE.Group();
    const penBodyGeo = new THREE.CylinderGeometry(0.12, 0.12, 3.2, 8);
    const penBodyMat = new THREE.MeshStandardMaterial({ color: 0xee1133, metalness: 0.7, roughness: 0.3 });
    const pen = new THREE.Mesh(penBodyGeo, penBodyMat);

    const nibGeo = new THREE.ConeGeometry(0.2, 0.7, 8);
    const nibMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const nib = new THREE.Mesh(nibGeo, nibMat);
    nib.position.y = 1.95;
    pen.add(nib);

    this.penGroup.add(pen);
    this.penGroup.position.set(1.4, 2.4, 0.4);
    this.penGroup.rotation.set(-0.3, 0, -0.4);
    this.group.add(this.penGroup);

    // 4. ORBITING EXAM PAPERS ("COPIES D'EXAMEN 0/20")
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

    // Expanding Telegraph Ring
    this.telegraphMesh.geometry.dispose();
    this.telegraphMesh.geometry = new THREE.RingGeometry(0.3, 7.8, 36);
  }

  animateWalk(dt) {
    this.bodyMesh.position.y = 2.6 + Math.abs(Math.sin(this.stateTimer * 5)) * 0.2;
    this.bodyMesh.rotation.z = Math.sin(this.stateTimer * 5) * 0.05;

    // Spin floor rune & exam ring
    if (this.floorRune) this.floorRune.rotation.z += dt * 1.5;
    if (this.examRing) this.examRing.rotation.y += dt * 4.0;
  }

  animateTelegraph(progress) {
    // Raise giant red grading pen
    this.penGroup.rotation.x = -progress * Math.PI * 1.2;
    this.penGroup.position.y = 2.4 + progress * 1.4;
    this.laserEyeMat.color.setHex(0xff0022);
  }

  animateAttack(progress) {
    this.penGroup.rotation.x = progress * Math.PI * 1.5 - 1.2;
  }

  performAttack(player, audio, particles) {
    this.attackPatternIndex = (this.attackPatternIndex + 1) % 3;

    // ATTACK 1: "SILENCE AU FOND !" (Ground Slam Shockwave)
    if (this.attackPatternIndex === 0) {
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
    // ATTACK 2: "DISTRIBUTION DES COPIES 0/20 !" (Hurls 3 exam sheets)
    else if (this.attackPatternIndex === 1) {
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
    // ATTACK 3: "COUP DE STYLO ROUGE" (Estoc)
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
