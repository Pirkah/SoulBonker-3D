import * as THREE from '../../libs/three.module.js';
import { MathUtils } from '../utils/MathUtils.js';
import { Weapon } from './Weapon.js';
import { GlobalModelLoader } from '../engine/ModelLoader.js';
import { CHARACTER_CLASSES } from '../systems/ClassManager.js';
import { PlayerArrowProjectile, PlayerMagicOrbProjectile, PlayerBolterProjectile, PlayerHolyRayProjectile, PlayerNecroSkullProjectile } from './Projectile.js';
import { SkeletonMinion } from './SkeletonMinion.js';

export class Player {
  constructor(scene, projectilesList = null) {
    this.scene = scene;
    this.projectilesList = projectilesList;
    this.onProjectileSpawned = null; // Hook for 1v1 multiplayer synchronization
    this.onMeleeHit = null; // Hook for 1v1 multiplayer weapon hits

    // Character Class (Default: KNIGHT)
    this.currentClass = CHARACTER_CLASSES.KNIGHT;

    // Health & Stats
    this.maxHp = this.currentClass.maxHp;
    this.hp = this.maxHp;
    this.baseDamage = this.currentClass.baseDamage;
    this.moveSpeed = this.currentClass.moveSpeed;
    this.attackSpeed = this.currentClass.attackSpeed;
    this.critChance = 0.15;
    this.critMultiplier = 2.0;
    this.knockbackBonus = this.currentClass.knockbackMultiplier;
    this.damageModMultiplier = 1.0;
    this.knockbackModMultiplier = 1.0;

    // Stamina System
    this.maxStamina = this.currentClass.maxStamina;
    this.stamina = this.maxStamina;
    this.staminaRegenRate = 35;
    this.staminaRegenDelay = 0.45;
    this.staminaRegenTimer = 0;
    this.isExhausted = false;

    // Rogue-Lite Upgrades Perks
    this.thunderChain = 0;
    this.vampirism = 0;
    this.ghostDash = false;
    this.healOnPerfectDodge = 0;
    this.infiniteStaminaBuffTimer = 0;

    // Kinematics & Physics
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.radius = 0.75;
    this.mass = 1.0;
    this.rotationY = 0;
    this.targetRotationY = 0;

    // State Machine: IDLE, RUN, DODGE, ATTACK_LIGHT, ATTACK_HEAVY, HURT, DEAD
    this.state = 'IDLE';
    this.stateTimer = 0;
    this.isInvulnerable = false;
    this.invulnerableTimer = 0; // Post-damage i-frames to prevent 60fps instant melting

    // Combat Combo State
    this.comboIndex = 0;
    this.comboWindowTimer = 0;
    this.hasHitCurrentAttack = false;
    this.queuedLightAttack = false;

    // Heavy Charge
    this.isCharging = false;
    this.chargeTime = 0;

    // Perfect Dodge State
    this.perfectDodgeWindow = 0.22;
    this.megaBonkBuff = false;
    this.megaBonkTimer = 0;

    // Visual Mesh Hierarchy
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.buildCharacterMesh();

    // Weapon mounted into hand
    this.weapon = new Weapon(
      this.rightHand,
      this.currentClass.weaponModel,
      this.currentClass.weaponMtl,
      this.currentClass.weaponType
    );
    this.scene.add(this.weapon.trailMesh);

    this.animTime = 0;
  }

  setProjectilesList(list) {
    this.projectilesList = list;
  }

  setClass(classData) {
    if (!classData) return;
    this.currentClass = classData;

    // Apply class base stats
    this.maxHp = classData.maxHp;
    this.hp = this.maxHp;
    this.maxStamina = classData.maxStamina;
    this.stamina = this.maxStamina;
    this.moveSpeed = classData.moveSpeed;
    this.baseDamage = classData.baseDamage;
    this.attackSpeed = classData.attackSpeed;
    this.knockbackBonus = classData.knockbackMultiplier;

    // Swap 3D character mesh safely inside modelContainer with request tracking
    if (this.modelContainer) {
      const reqId = ++this.modelLoadRequestId;

      GlobalModelLoader.loadOBJWithMTL(classData.modelPath, classData.mtlPath).then((model) => {
        if (reqId !== this.modelLoadRequestId) return; // Discard outdated model if class changed rapidly

        while (this.modelContainer.children.length > 0) {
          const c = this.modelContainer.children[0];
          this.modelContainer.remove(c);
        }

        if (model) {
          let scale = 1.35;
          if (classData.id === 'SPACEMARINE' || classData.id === 'ORK') scale = 1.48;
          else if (classData.id === 'ARCHER' || classData.id === 'ROGUE') scale = 1.30;
          else if (classData.id === 'ANGEL') scale = 1.38;
          else if (classData.id === 'REAPER') scale = 1.36;
          else if (classData.id === 'MAGE' || classData.id === 'NECROMANCER') scale = 1.32;
          
          model.scale.set(scale, scale, scale);
          model.position.set(0, 0.12, 0);
          this.modelContainer.add(model);
        }
      }).catch((err) => {
        console.warn('Could not load character model:', err);
      });
    }

    // Swap Weapon
    if (this.weapon) {
      this.weapon.setWeaponClass(
        classData.weaponModel,
        classData.weaponMtl,
        classData.weaponType,
        classData.color || '#00f0ff'
      );
    }
  }

  buildCharacterMesh() {
    this.bodyGroup = new THREE.Group();
    this.group.add(this.bodyGroup);
    this.modelLoadRequestId = 0;

    // Torso root
    this.torso = new THREE.Group();
    this.torso.position.y = 0.95;
    this.bodyGroup.add(this.torso);

    // Dedicated container for Blender 3D Character Mesh
    this.modelContainer = new THREE.Group();
    this.torso.add(this.modelContainer);

    // Head Anchor
    this.head = new THREE.Group();
    this.head.position.set(0, 0.72, 0);
    this.torso.add(this.head);

    // Arms & Hands Joint Anchors
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.48, 0.32, 0);
    this.torso.add(this.rightArm);

    this.rightHand = new THREE.Group();
    this.rightHand.position.set(0, -0.45, 0.08);
    this.rightArm.add(this.rightHand);

    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.48, 0.32, 0);
    this.torso.add(this.leftArm);

    this.leftHand = new THREE.Group();
    this.leftHand.position.set(0, -0.45, 0.08);
    this.leftArm.add(this.leftHand);

    // Legs Joint Anchors
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.2, 0.55, 0);
    this.bodyGroup.add(this.leftLeg);

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.2, 0.55, 0);
    this.bodyGroup.add(this.rightLeg);

    // Initial class model load
    this.setClass(this.currentClass);
  }

  useStamina(amount) {
    if (this.infiniteStaminaBuffTimer > 0) return true;
    if (this.stamina < amount) return false;

    this.stamina -= amount;
    this.staminaRegenTimer = this.staminaRegenDelay;

    if (this.stamina <= 0) {
      this.stamina = 0;
      this.isExhausted = true;
    }
    return true;
  }

  update(dt, input, audio, particles, enemies, camYaw = 0) {
    this.animTime += dt;
    this.stateTimer += dt;

    if (this.infiniteStaminaBuffTimer > 0) {
      this.infiniteStaminaBuffTimer -= dt;
      this.stamina = this.maxStamina;
    }

    if (this.megaBonkTimer > 0) {
      this.megaBonkTimer -= dt;
      if (this.megaBonkTimer <= 0) {
        this.megaBonkBuff = false;
        if (this.weapon) this.weapon.setGlowColor(this.currentClass.color || 0x00f0ff);
      }
    }

    if (this.staminaRegenTimer > 0) {
      this.staminaRegenTimer -= dt;
    } else if (this.stamina < this.maxStamina) {
      this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegenRate * dt);
      if (this.isExhausted && this.stamina > 25) {
        this.isExhausted = false;
      }
    }

    if (this.comboWindowTimer > 0) {
      this.comboWindowTimer -= dt;
      if (this.comboWindowTimer <= 0) {
        this.comboIndex = 0;
      }
    }

    const sinYaw = Math.sin(camYaw);
    const cosYaw = Math.cos(camYaw);
    const worldMoveX = input.moveVector.x * cosYaw - input.moveVector.z * sinYaw;
    const worldMoveZ = input.moveVector.x * sinYaw + input.moveVector.z * cosYaw;
    const isMoving = (input.moveVector.x !== 0 || input.moveVector.z !== 0);

    if (input.actions.lightAttack) {
      if (this.state === 'ATTACK_LIGHT' || this.state === 'ATTACK_HEAVY') {
        this.queuedLightAttack = true;
      }
    }

    switch (this.state) {
      case 'IDLE':
      case 'RUN':
        this.handleMovementAndInputs(dt, input, worldMoveX, worldMoveZ, isMoving, audio, particles, enemies);
        break;
      case 'DODGE':
        this.handleDodge(dt, audio, particles, enemies);
        break;
      case 'ATTACK_LIGHT':
        this.handleLightAttack(dt, audio, particles, enemies);
        break;
      case 'ATTACK_HEAVY':
        this.handleHeavyAttack(dt, audio, particles, enemies);
        break;
      case 'HURT':
        if (this.stateTimer > 0.25) this.state = 'IDLE';
        break;
      case 'DEAD':
        this.velocity.set(0, 0, 0);
        break;
    }

    this.rotationY = MathUtils.dampAngle(this.rotationY, this.targetRotationY, 14.0, dt);
    this.group.position.copy(this.position);
    this.group.rotation.y = this.rotationY;

    // Post-damage immunity visual blinking
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
      if (this.characterModelGroup) {
        this.characterModelGroup.visible = Math.floor(this.invulnerableTimer * 24) % 2 === 0;
      }
    } else if (this.characterModelGroup && !this.characterModelGroup.visible) {
      this.characterModelGroup.visible = true;
    }

    const isAttacking = (this.state === 'ATTACK_LIGHT' || this.state === 'ATTACK_HEAVY');
    this.weapon.update(dt, isAttacking, this.scene);
  }

  handleMovementAndInputs(dt, input, worldMoveX, worldMoveZ, isMoving, audio, particles, enemies) {
    if (input.actions.dodge && this.useStamina(24)) {
      this.startDodge(worldMoveX, worldMoveZ, isMoving, audio, particles, enemies);
      return;
    }

    if (input.actions.heavyAttack && this.useStamina(35)) {
      this.aimTowardsTargetOrMouse(input, enemies, isMoving, worldMoveX, worldMoveZ);
      this.startHeavyAttack(audio);
      return;
    }

    if (input.actions.lightAttack || this.queuedLightAttack) {
      this.queuedLightAttack = false;
      if (this.useStamina(15)) {
        this.aimTowardsTargetOrMouse(input, enemies, isMoving, worldMoveX, worldMoveZ);
        this.startLightAttack(audio);
        return;
      }
    }

    if (isMoving) {
      this.state = 'RUN';
      const speed = this.isExhausted ? this.moveSpeed * 0.65 : this.moveSpeed;
      this.velocity.x = worldMoveX * speed;
      this.velocity.z = worldMoveZ * speed;
      this.targetRotationY = Math.atan2(worldMoveX, worldMoveZ);

      const walkCycle = Math.sin(this.animTime * 14);
      this.leftLeg.rotation.x = walkCycle * 0.6;
      this.rightLeg.rotation.x = -walkCycle * 0.6;
      this.leftArm.rotation.x = -walkCycle * 0.5;
      this.rightArm.rotation.x = walkCycle * 0.3;
      this.torso.position.y = 0.95 + Math.abs(walkCycle) * 0.08;

      if (Math.random() < 0.1) {
        particles.spawnDustRing(this.position, 0.4);
      }
    } else {
      this.state = 'IDLE';
      this.velocity.x = 0;
      this.velocity.z = 0;

      const breath = Math.sin(this.animTime * 3);
      this.torso.position.y = 0.95 + breath * 0.02;
      this.leftLeg.rotation.set(0, 0, 0);
      this.rightLeg.rotation.set(0, 0, 0);
      this.leftArm.rotation.set(0, 0, 0.1);
      this.rightArm.rotation.set(0.3 + breath * 0.05, 0, -0.2);
    }
  }

  aimTowardsTargetOrMouse(input, enemies, isMoving, worldMoveX, worldMoveZ) {
    if (enemies && enemies.length > 0) {
      let bestTarget = null;
      let bestScore = -Infinity;

      for (const e of enemies) {
        if (e.isDead) continue;
        const dx = e.position.x - this.position.x;
        const dz = e.position.z - this.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 22.0) continue;

        const angleToEnemy = Math.atan2(dx, dz);
        let score = (22.0 - dist) * 2.0;
        const refAngle = isMoving ? Math.atan2(worldMoveX, worldMoveZ) : this.rotationY;
        const angleDiff = Math.abs(MathUtils.angleDiff(angleToEnemy, refAngle));
        score += (Math.PI - angleDiff) * 6.0;

        if (e.state === 'ATTACKING' || e.state === 'TELEGRAPH') score += 10.0;
        if (e.type === 'BOSS_PROF') score += 15.0;

        if (score > bestScore) {
          bestScore = score;
          bestTarget = e;
        }
      }

      if (bestTarget) {
        const dx = bestTarget.position.x - this.position.x;
        const dz = bestTarget.position.z - this.position.z;
        this.targetRotationY = Math.atan2(dx, dz);
        this.rotationY = this.targetRotationY;
        return;
      }
    }

    if (isMoving) {
      this.targetRotationY = Math.atan2(worldMoveX, worldMoveZ);
      this.rotationY = this.targetRotationY;
      return;
    }

    if (input.hasMovedMouseRecently && input.mouseWorld) {
      const dx = input.mouseWorld.x - this.position.x;
      const dz = input.mouseWorld.z - this.position.z;
      if (dx * dx + dz * dz > 0.3) {
        this.targetRotationY = Math.atan2(dx, dz);
        this.rotationY = this.targetRotationY;
      }
    }
  }

  startDodge(worldMoveX, worldMoveZ, isMoving, audio, particles, enemies) {
    this.state = 'DODGE';
    this.stateTimer = 0;
    this.isInvulnerable = true;

    let rollX = isMoving ? worldMoveX : Math.sin(this.targetRotationY);
    let rollZ = isMoving ? worldMoveZ : Math.cos(this.targetRotationY);

    this.targetRotationY = Math.atan2(rollX, rollZ);
    this.rotationY = this.targetRotationY;

    const dodgeSpeed = (this.currentClass.id === 'ARCHER' ? 20.0 : (this.currentClass.id === 'SPACEMARINE' ? 15.5 : 17.5));
    this.velocity.x = rollX * dodgeSpeed;
    this.velocity.z = rollZ * dodgeSpeed;

    audio.playDodgeRoll();

    if (this.currentClass.id === 'MAGE') {
      particles.spawnShockwave(this.position, 4.0, 0xbb44ff, 0.4);
    } else {
      particles.spawnDustRing(this.position, 1.0);
    }

    this.checkPerfectDodge(enemies, audio, particles);
  }

  checkPerfectDodge(enemies, audio, particles) {
    if (!enemies || enemies.length === 0) return;

    let perfectDodgeTriggered = false;
    for (const enemy of enemies) {
      if (enemy.isDead) continue;
      const distSq = MathUtils.distSq2D(this.position.x, this.position.z, enemy.position.x, enemy.position.z);
      if (distSq <= 5.5 * 5.5 && (enemy.state === 'ATTACKING' || enemy.state === 'TELEGRAPH')) {
        perfectDodgeTriggered = true;
        break;
      }
    }

    if (perfectDodgeTriggered) {
      this.stamina = this.maxStamina;
      this.isExhausted = false;
      this.megaBonkBuff = true;
      this.megaBonkTimer = 3.5;
      if (this.weapon) this.weapon.setGlowColor(0xffcc00);

      audio.playPerfectDodge();
      particles.spawnShockwave(this.position, 8.5, 0x00ffff, 0.55);
      particles.spawnTextPopup("⚡ ESQUIVE PARFAITE ! ⚡", this.position, '#00ffff', true);

      if (this.healOnPerfectDodge) {
        this.heal(this.healOnPerfectDodge, particles);
      }

      if (window.triggerSlowMo) {
        window.triggerSlowMo(1.4, 0.15);
      }
    }
  }

  handleDodge(dt, audio, particles, enemies) {
    const dodgeDuration = 0.42;
    const progress = Math.min(1.0, this.stateTimer / dodgeDuration);
    const tuck = Math.sin(progress * Math.PI);

    // Maintain continuous smooth forward roll momentum throughout the entire animation
    const rollDirX = Math.sin(this.targetRotationY);
    const rollDirZ = Math.cos(this.targetRotationY);
    const baseDodgeSpeed = (this.currentClass.id === 'ARCHER' ? 19.0 : (this.currentClass.id === 'SPACEMARINE' ? 14.5 : 16.5));

    let currentSpeed;
    if (progress < 0.70) {
      currentSpeed = baseDodgeSpeed * (1.0 - progress * 0.15);
    } else {
      const exitProgress = (progress - 0.70) / 0.30;
      currentSpeed = (baseDodgeSpeed * 0.895) * (1.0 - exitProgress) + (this.moveSpeed) * exitProgress;
    }
    this.velocity.x = rollDirX * currentSpeed;
    this.velocity.z = rollDirZ * currentSpeed;

    // Somersault Flip
    this.bodyGroup.rotation.x = progress * Math.PI * 2;
    this.bodyGroup.position.y = tuck * 0.35;

    const squash = 1.0 - tuck * 0.20;
    this.bodyGroup.scale.set(squash, squash, squash);
    this.torso.position.y = 0.95 - tuck * 0.40;

    this.torso.rotation.x = tuck * 0.60;
    this.head.rotation.x = tuck * 0.80;
    this.leftLeg.rotation.x = tuck * 1.5;
    this.rightLeg.rotation.x = tuck * 1.3;
    this.leftArm.rotation.x = -tuck * 1.3;
    this.rightArm.rotation.x = -tuck * 1.1;
    this.weapon.group.rotation.set(0.2, 0, -1.2 * tuck);

    if (this.stateTimer >= dodgeDuration * 0.75) {
      this.isInvulnerable = false;
    }

    if (this.stateTimer >= dodgeDuration) {
      this.state = 'IDLE';
      this.isInvulnerable = false;
      this.bodyGroup.rotation.x = 0;
      this.bodyGroup.position.y = 0;
      this.bodyGroup.scale.set(1, 1, 1);
      this.torso.position.y = 0.95;
      this.torso.rotation.set(0, 0, 0);
      this.head.rotation.set(0, 0, 0);
      this.leftLeg.rotation.set(0, 0, 0);
      this.rightLeg.rotation.set(0, 0, 0);
      this.leftArm.rotation.set(0, 0, 0);
      this.rightArm.rotation.set(0, 0, 0);
      this.weapon.group.rotation.set(0.6, 0, -0.2);
      if (particles) particles.spawnDustRing(this.position, 0.6);
    }
  }

  startLightAttack(audio) {
    this.state = 'ATTACK_LIGHT';
    this.stateTimer = 0;
    this.hasHitCurrentAttack = false;
    this.comboWindowTimer = 0.85;

    audio.playSwing(false);

    const forwardX = Math.sin(this.targetRotationY);
    const forwardZ = Math.cos(this.targetRotationY);
    this.velocity.x = forwardX * 5.5;
    this.velocity.z = forwardZ * 5.5;
  }

  handleLightAttack(dt, audio, particles, enemies) {
    const attackDuration = 0.32 / this.attackSpeed;
    const progress = this.stateTimer / attackDuration;

    // Ranged class firing
    if (this.currentClass.isRanged) {
      this.rightArm.rotation.set(0.2, 0, -0.6);
      this.leftArm.rotation.set(0.2, 0, 0.6);

      if (progress >= 0.3 && !this.hasHitCurrentAttack && this.projectilesList) {
        this.hasHitCurrentAttack = true;
        const forwardX = Math.sin(this.targetRotationY);
        const forwardZ = Math.cos(this.targetRotationY);
        const targetPos = {
          x: this.position.x + forwardX * 20,
          y: this.position.y,
          z: this.position.z + forwardZ * 20
        };

        const dmg = this.getCalculatedDamage(false);

        if (this.currentClass.id === 'ARCHER') {
          const arrow = new PlayerArrowProjectile(this.scene, this.position, targetPos, 26, dmg);
          this.projectilesList.push(arrow);
          particles.spawnHitSparks(this.position, forwardX, forwardZ, 6);
          if (this.onProjectileSpawned) this.onProjectileSpawned('ARROW', this.position, targetPos, 26, dmg);
        } else if (this.currentClass.id === 'MAGE') {
          const orb = new PlayerMagicOrbProjectile(this.scene, this.position, targetPos, 18, dmg, false);
          this.projectilesList.push(orb);
          audio.playMagicCast(true);
          if (this.onProjectileSpawned) this.onProjectileSpawned('ORB', this.position, targetPos, 18, dmg, false);
        } else if (this.currentClass.id === 'NECROMANCER') {
          const necroSkull = new PlayerNecroSkullProjectile(this.scene, this.position, targetPos, 22, dmg);
          this.projectilesList.push(necroSkull);
          audio.playMagicCast(true);
          if (this.onProjectileSpawned) this.onProjectileSpawned('NECRO_SKULL', this.position, targetPos, 22, dmg);
        }
      }
    } else {
      // Melee Swing
      this.rightArm.rotation.set(0.3, progress * Math.PI * 1.5 - 1.2, 0.4);
      this.weapon.group.rotation.set(0.8, 0, 0.2);

      if (progress >= 0.25 && progress <= 0.75 && !this.hasHitCurrentAttack) {
        const isRogue = (this.currentClass.id === 'ROGUE');
        const isReaper = (this.currentClass.id === 'REAPER');
        this.checkWeaponHit(enemies, audio, particles, false, isRogue ? 2.5 : 1.0, 1.0, isReaper);
      }
    }

    if (this.stateTimer >= attackDuration) {
      this.state = 'IDLE';
      this.rightArm.rotation.set(0, 0, 0);
      this.leftArm.rotation.set(0, 0, 0);
      this.torso.rotation.set(0, 0, 0);
    }
  }

  startHeavyAttack(audio) {
    this.state = 'ATTACK_HEAVY';
    this.stateTimer = 0;
    this.hasHitCurrentAttack = false;

    audio.playSwing(true);

    const forwardX = Math.sin(this.targetRotationY);
    const forwardZ = Math.cos(this.targetRotationY);
    this.velocity.x = forwardX * 8.0;
    this.velocity.z = forwardZ * 8.0;
  }

  handleHeavyAttack(dt, audio, particles, enemies) {
    const attackDuration = 0.52 / this.attackSpeed;
    const progress = this.stateTimer / attackDuration;

    this.rightArm.rotation.set(progress * Math.PI * 2.2 - 1.4, 0, -0.2);
    this.leftArm.rotation.set(progress * Math.PI * 2.2 - 1.4, 0, 0.2);

    if (progress >= 0.4 && !this.hasHitCurrentAttack) {
      this.hasHitCurrentAttack = true;
      const forwardX = Math.sin(this.targetRotationY);
      const forwardZ = Math.cos(this.targetRotationY);
      const dmg = this.getCalculatedDamage(true);

      // Class-specific Heavy attacks
      if (this.currentClass.id === 'ARCHER' && this.projectilesList) {
        for (let i = -1; i <= 1; i++) {
          const targetPos = {
            x: this.position.x + forwardX * 20 + i * 4.0,
            y: this.position.y,
            z: this.position.z + forwardZ * 20 + i * 2.0
          };
          const arrow = new PlayerArrowProjectile(this.scene, this.position, targetPos, 28, dmg * 0.85);
          this.projectilesList.push(arrow);
          if (this.onProjectileSpawned) this.onProjectileSpawned('ARROW', this.position, targetPos, 28, dmg * 0.85);
        }
        particles.spawnTextPopup("🏹 PLUIE DE FLÈCHES !", this.position, '#00ff88', true);
      } else if (this.currentClass.id === 'MAGE' && this.projectilesList) {
        const targetPos = {
          x: this.position.x + forwardX * 20,
          y: this.position.y,
          z: this.position.z + forwardZ * 20
        };
        const bigOrb = new PlayerMagicOrbProjectile(this.scene, this.position, targetPos, 16, dmg * 1.5, true);
        this.projectilesList.push(bigOrb);
        if (this.onProjectileSpawned) this.onProjectileSpawned('ORB', this.position, targetPos, 16, dmg * 1.5, true);
        audio.playGroundSlam();
        particles.spawnShockwave(this.position, 7.0, 0xbb44ff, 0.6);
        particles.spawnTextPopup("🔮 SUPERNOVA ARCANIQUE !", this.position, '#bb44ff', true);
      } else if (this.currentClass.id === 'SPACEMARINE') {
        if (this.projectilesList) {
          const targetPos = {
            x: this.position.x + forwardX * 20,
            y: this.position.y,
            z: this.position.z + forwardZ * 20
          };
          const bolt = new PlayerBolterProjectile(this.scene, this.position, targetPos, 30, dmg * 1.4);
          this.projectilesList.push(bolt);
          if (this.onProjectileSpawned) this.onProjectileSpawned('BOLT', this.position, targetPos, 30, dmg * 1.4, true);
        }
        this.checkWeaponHit(enemies, audio, particles, true);
        particles.spawnShockwave(this.position, 6.0, 0xff3300, 0.5);
        particles.spawnTextPopup("⚔️ POUR L'EMPEREUR !", this.position, '#ff3300', true);
      } else if (this.currentClass.id === 'ANGEL') {
        if (this.projectilesList) {
          const targetPos = {
            x: this.position.x + forwardX * 20,
            y: this.position.y,
            z: this.position.z + forwardZ * 20
          };
          const holyRay = new PlayerHolyRayProjectile(this.scene, this.position, targetPos, 32, dmg * 1.5);
          this.projectilesList.push(holyRay);
          if (this.onProjectileSpawned) this.onProjectileSpawned('HOLY_RAY', this.position, targetPos, 32, dmg * 1.5, true);
        }
        this.checkWeaponHit(enemies, audio, particles, true);
        particles.spawnShockwave(this.position, 6.5, 0xffea00, 0.6);
        particles.spawnTextPopup("👼 CHÂTIMENT SACRÉ !", this.position, '#ffd700', true);
      } else if (this.currentClass.id === 'ROGUE') {
        this.checkWeaponHit(enemies, audio, particles, true, 3.0);
        audio.playSwing(true);
        particles.spawnHitSparks(this.position, forwardX, forwardZ, 12);
        particles.spawnTextPopup("🗡️ CRITIQUE MORTEL (3X) !", this.position, '#e0aaff', true);
      } else if (this.currentClass.id === 'ORK') {
        this.checkWeaponHit(enemies, audio, particles, true, 1.5, 2.2);
        audio.playGroundSlam();
        particles.spawnShockwave(this.position, 9.0, 0x44bb22, 0.7);
        particles.spawnTextPopup("🧌 WAAAAGH ! SLAM !", this.position, '#44bb22', true);
      } else if (this.currentClass.id === 'REAPER') {
        this.checkWeaponHit(enemies, audio, particles, true, 1.2, 1.0, true);
        audio.playGroundSlam();
        particles.spawnShockwave(this.position, 7.5, 0x00e5ff, 0.6);
        particles.spawnTextPopup("💀 MOISSON D'ÂMES (+PV) !", this.position, '#00e5ff', true);
      } else if (this.currentClass.id === 'NECROMANCER') {
        this.summonSkeletonMinions(particles, audio);
      } else {
        // Knight Slam
        this.checkWeaponHit(enemies, audio, particles, true);
        audio.playGroundSlam();
        particles.spawnShockwave(this.position, 6.5, 0x00f0ff, 0.6);
      }
    }

    if (this.stateTimer >= attackDuration) {
      this.state = 'IDLE';
      this.rightArm.rotation.set(0, 0, 0);
      this.leftArm.rotation.set(0, 0, 0);
      this.torso.rotation.set(0, 0, 0);
    }
  }

  getCalculatedDamage(isHeavy) {
    let dmg = this.baseDamage * (isHeavy ? 2.0 : 1.0);
    if (this.megaBonkBuff) dmg *= 2.2;
    dmg *= this.damageModMultiplier;
    return Math.floor(dmg);
  }

  checkWeaponHit(enemies, audio, particles, isHeavy = false, customCritMultiplier = 1.0, customKnockbackMultiplier = 1.0, isLifeSteal = false) {
    if (!enemies) return;

    const hitRange = (isHeavy ? 4.4 : 3.5) * this.weapon.rangeMultiplier;
    const hitAngle = isHeavy ? Math.PI * 0.9 : Math.PI * 0.75;
    let enemiesHit = 0;

    for (const enemy of enemies) {
      if (enemy.isDead) continue;

      const dx = enemy.position.x - this.position.x;
      const dz = enemy.position.z - this.position.z;
      const distSq = dx * dx + dz * dz;

      if (distSq <= hitRange * hitRange) {
        const angleToEnemy = Math.atan2(dx, dz);
        const angleDiff = Math.abs(MathUtils.angleDiff(angleToEnemy, this.rotationY));

        if (angleDiff <= hitAngle * 0.5) {
          const isCrit = Math.random() < this.critChance || this.megaBonkBuff || customCritMultiplier > 1.5;
          let dmg = this.getCalculatedDamage(isHeavy);
          if (isCrit) dmg = Math.floor(dmg * this.critMultiplier * (customCritMultiplier > 1.5 ? customCritMultiplier / 2.0 : 1.0));

          const len = Math.sqrt(dx * dx + dz * dz) || 1;
          const dirX = dx / len;
          const dirZ = dz / len;

          const baseKnock = (isHeavy ? 28 : 16) * this.knockbackBonus * this.knockbackModMultiplier * customKnockbackMultiplier;
          const knockForce = this.megaBonkBuff ? baseKnock * 1.8 : baseKnock;

          enemy.takeDamage(dmg, dirX, dirZ, knockForce, isCrit);
          audio.playHit();
          particles.spawnHitSparks(enemy.position, dirX, dirZ, isCrit ? 16 : 8, isCrit);

          if (this.onMeleeHit) {
            this.onMeleeHit(enemy, dmg, dirX, dirZ, knockForce, isCrit);
          }

          if (isLifeSteal) {
            const healAmount = Math.max(4, Math.floor(dmg * 0.25));
            this.heal(healAmount, particles);
          } else if (this.vampirism > 0 && Math.random() < this.vampirism) {
            this.heal(8, particles);
          }

          enemiesHit++;
        }
      }
    }

    if (enemiesHit > 0) {
      this.hasHitCurrentAttack = true;
    }
  }

  summonSkeletonMinions(particles = null, audio = null) {
    if (!this.minionsList) this.minionsList = [];
    this.minionsList = this.minionsList.filter(m => m.isAlive);

    const countToSpawn = Math.min(3, 3 - this.minionsList.length);
    for (let i = 0; i < countToSpawn; i++) {
      const angle = (i / 3) * Math.PI * 2 + Math.random() * 0.5;
      const spawnPos = new THREE.Vector3(
        this.position.x + Math.cos(angle) * 2.2,
        0,
        this.position.z + Math.sin(angle) * 2.2
      );
      const minion = new SkeletonMinion(this.scene, this, spawnPos);
      this.minionsList.push(minion);
    }

    if (audio) audio.playMagicCast(true);
    if (particles) {
      particles.spawnShockwave(this.position, 6.0, 0x00ff66, 0.6);
      particles.spawnTextPopup("🧟 SQUELETTES INVOQUÉS !", this.position, '#00ff66', true);
    }
    if (this.onMinionsSummoned) {
      this.onMinionsSummoned(countToSpawn, this.position);
    }
  }

  takeDamage(amount, audio = null, particles = null, isContinuous = false) {
    if (this.isInvulnerable || this.invulnerableTimer > 0 || this.state === 'DEAD') return;

    this.hp = Math.max(0, this.hp - Math.max(1, amount));
    this.state = 'HURT';
    this.stateTimer = 0;
    this.invulnerableTimer = isContinuous ? 0.35 : 0.45; // 0.45s invulnerability window prevents 60fps instant melting

    if (audio && audio.playPlayerHurt) audio.playPlayerHurt();
    if (particles && particles.spawnTextPopup) {
      particles.spawnTextPopup(`-${Math.ceil(amount)}`, this.position, '#ff2255', false);
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.state = 'DEAD';
      if (audio && audio.playDeath) audio.playDeath();
    }
  }

  heal(amount, particles) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
    particles.spawnTextPopup(`+${amount} PV`, this.position, '#00e676', false);
  }
}
