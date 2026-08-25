import * as THREE from '../../libs/three.module.js';
import { MathUtils } from '../utils/MathUtils.js';
import { Weapon } from './Weapon.js';
import { GlobalModelLoader } from '../engine/ModelLoader.js';

export class Player {
  constructor(scene) {
    this.scene = scene;
    this.isPlayer = true;

    // Transform & Movement
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotationY = 0;
    this.targetRotationY = 0;
    this.radius = 0.8;
    this.isAirborne = false;
    this.isFallingToAbyss = false;

    // Stats
    this.maxHp = 100;
    this.hp = 100;
    this.maxStamina = 100;
    this.stamina = 100;
    this.staminaRegenRate = 38; // per sec
    this.staminaRegenDelay = 0.35;
    this.staminaRegenTimer = 0;
    this.isExhausted = false;

    // Combat Stats
    this.baseDamage = 35;
    this.attackSpeed = 1.0;
    this.moveSpeed = 10.0;
    this.critChance = 0.15;
    this.critMultiplier = 2.0;
    this.knockbackBonus = 1.0;
    this.vampirism = 0;
    this.thunderChain = 0;
    this.ghostDash = false;
    this.meteorSlam = false;
    this.infiniteStaminaBuffTimer = 0;

    // State Machine
    this.state = 'IDLE'; // IDLE, RUN, DODGE, ATTACK_LIGHT, ATTACK_HEAVY, HURT, DEAD
    this.stateTimer = 0;
    this.isInvulnerable = false;

    // Attack Buffering & Combos
    this.comboIndex = 0; // 0, 1, 2
    this.comboWindowTimer = 0;
    this.hasHitCurrentAttack = false;
    this.queuedLightAttack = false;

    // Heavy Charge
    this.isCharging = false;
    this.chargeTime = 0;

    // Perfect Dodge State
    this.perfectDodgeWindow = 0.22; // First 0.22s of dodge
    this.megaBonkBuff = false;
    this.megaBonkTimer = 0;

    // Visual Mesh Hierarchy
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.buildCharacterMesh();

    // Weapon is solidly mounted into the right hand
    this.weapon = new Weapon(this.rightHand);
    this.scene.add(this.weapon.trailMesh);

    // Procedural Animation Clock
    this.animTime = 0;
  }

  buildCharacterMesh() {
    // Body root group (handles somersaults and tilts)
    this.bodyGroup = new THREE.Group();
    this.group.add(this.bodyGroup);

    // Materials
    const armorMat = new THREE.MeshStandardMaterial({ color: 0x1e2436, roughness: 0.45, metalness: 0.6 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xddaa33, metalness: 0.85, roughness: 0.25 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0x334466, roughness: 0.7 });

    // 1. Torso & Blender Master 3D Armor
    this.torso = new THREE.Group();
    this.torso.position.y = 0.95;
    this.bodyGroup.add(this.torso);

    GlobalModelLoader.loadOBJWithMTL('assets/models/player.obj', 'assets/models/player.mtl').then((model) => {
      if (model) {
        model.scale.set(0.9, 0.9, 0.9);
        model.position.set(0, -0.95, 0);
        this.torso.add(model);
      }
    });

    // Cape / Scarf
    const capeGeo = new THREE.PlaneGeometry(0.55, 0.85);
    const capeMat = new THREE.MeshStandardMaterial({
      color: 0x0099ff,
      side: THREE.DoubleSide,
      roughness: 0.9
    });
    this.cape = new THREE.Mesh(capeGeo, capeMat);
    this.cape.position.set(0, 0.35, -0.26);
    this.cape.rotation.x = 0.15;
    this.torso.add(this.cape);

    // 2. Head / Helmet
    const headGeo = new THREE.DodecahedronGeometry(0.35);
    const helmMat = new THREE.MeshStandardMaterial({ color: 0x2b334d, metalness: 0.75, roughness: 0.3 });
    this.head = new THREE.Mesh(headGeo, helmMat);
    this.head.position.set(0, 0.72, 0);
    this.head.castShadow = true;
    this.torso.add(this.head);

    // Glowing Visor
    const visorGeo = new THREE.BoxGeometry(0.36, 0.1, 0.18);
    this.visorMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const visor = new THREE.Mesh(visorGeo, this.visorMat);
    visor.position.set(0, 0, 0.26);
    this.head.add(visor);

    // Horns
    const hornGeo = new THREE.ConeGeometry(0.07, 0.35, 5);
    const hornL = new THREE.Mesh(hornGeo, goldMat);
    hornL.position.set(-0.22, 0.25, 0);
    hornL.rotation.z = 0.5;
    this.head.add(hornL);

    const hornR = new THREE.Mesh(hornGeo, goldMat);
    hornR.position.set(0.22, 0.25, 0);
    hornR.rotation.z = -0.5;
    this.head.add(hornR);

    // 3. Arms & Hands
    // Right Arm (Shoulder Pivot)
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.48, 0.32, 0);
    this.torso.add(this.rightArm);

    const armGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.45, 6);
    const armMeshR = new THREE.Mesh(armGeo, armorMat);
    armMeshR.position.y = -0.22;
    this.rightArm.add(armMeshR);

    const handGeo = new THREE.SphereGeometry(0.12, 6, 6);
    this.rightHand = new THREE.Mesh(handGeo, goldMat);
    this.rightHand.position.set(0, -0.45, 0.08);
    this.rightArm.add(this.rightHand);

    // Left Arm (Shoulder Pivot)
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.48, 0.32, 0);
    this.torso.add(this.leftArm);

    const armMeshL = new THREE.Mesh(armGeo, armorMat);
    armMeshL.position.y = -0.22;
    this.leftArm.add(armMeshL);

    this.leftHand = new THREE.Mesh(handGeo, goldMat);
    this.leftHand.position.set(0, -0.45, 0.08);
    this.leftArm.add(this.leftHand);

    // 4. Legs (Hip Pivots)
    const legGeo = new THREE.CylinderGeometry(0.13, 0.11, 0.55, 6);
    
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.2, 0.55, 0);
    const legMeshL = new THREE.Mesh(legGeo, armorMat);
    legMeshL.position.y = -0.28;
    this.leftLeg.add(legMeshL);
    this.bodyGroup.add(this.leftLeg);

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.2, 0.55, 0);
    const legMeshR = new THREE.Mesh(legGeo, armorMat);
    legMeshR.position.y = -0.28;
    this.rightLeg.add(legMeshR);
    this.bodyGroup.add(this.rightLeg);
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

    // 1. Buffs & Cooldowns
    if (this.infiniteStaminaBuffTimer > 0) {
      this.infiniteStaminaBuffTimer -= dt;
      this.stamina = this.maxStamina;
    }

    if (this.megaBonkTimer > 0) {
      this.megaBonkTimer -= dt;
      if (this.megaBonkTimer <= 0) {
        this.megaBonkBuff = false;
        this.visorMat.color.setHex(0x00f0ff);
        this.weapon.setGlowColor(0x00f0ff);
      }
    }

    // 2. Stamina Regeneration
    if (this.staminaRegenTimer > 0) {
      this.staminaRegenTimer -= dt;
    } else if (this.stamina < this.maxStamina) {
      this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegenRate * dt);
      if (this.isExhausted && this.stamina > 25) {
        this.isExhausted = false;
      }
    }

    // 3. Combo window decay
    if (this.comboWindowTimer > 0) {
      this.comboWindowTimer -= dt;
      if (this.comboWindowTimer <= 0) {
        this.comboIndex = 0;
      }
    }

    // 4. Compute camera-relative movement vectors
    const sinYaw = Math.sin(camYaw);
    const cosYaw = Math.cos(camYaw);
    // Forward (Z=-1) -> (-sinYaw, -cosYaw)
    // Right (X=+1) -> (cosYaw, -sinYaw)
    const worldMoveX = input.moveVector.x * cosYaw - input.moveVector.z * sinYaw;
    const worldMoveZ = input.moveVector.x * sinYaw + input.moveVector.z * cosYaw;
    const isMoving = (input.moveVector.x !== 0 || input.moveVector.z !== 0);

    // Buffer attack input if clicked during attack
    if (input.actions.lightAttack) {
      if (this.state === 'ATTACK_LIGHT' || this.state === 'ATTACK_HEAVY') {
        this.queuedLightAttack = true;
      }
    }

    // 5. State Machine Handling
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
        if (this.stateTimer > 0.25) {
          this.state = 'IDLE';
        }
        break;
    }

    // Update Weapon & Glowing Trail
    const isAttacking = (this.state === 'ATTACK_LIGHT' || this.state === 'ATTACK_HEAVY');
    this.weapon.update(isAttacking);

    // Sync World Position & Smooth Yaw Rotation
    this.group.position.copy(this.position);
    this.rotationY = MathUtils.damp(this.rotationY, this.targetRotationY, 16.0, dt);
    this.group.rotation.y = this.rotationY;

    // Cape Physics
    if (this.cape) {
      const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
      this.cape.rotation.x = 0.15 + (speed / this.moveSpeed) * 0.6 + Math.sin(this.animTime * 10) * 0.08;
    }
  }

  handleMovementAndInputs(dt, input, worldMoveX, worldMoveZ, isMoving, audio, particles, enemies) {
    // Check Dodge Roll (Space / Shift) - Priority 1
    if (input.actions.dodge && !this.isExhausted) {
      if (this.useStamina(22)) {
        this.startDodge(worldMoveX, worldMoveZ, isMoving, audio, particles, enemies);
        return;
      }
    }

    // Check Light Attack (Left Click / J) - Priority 2
    if ((input.actions.lightAttack || this.queuedLightAttack) && !this.isExhausted) {
      this.queuedLightAttack = false;
      if (this.useStamina(14)) {
        this.aimTowardsTargetOrMouse(input, enemies, isMoving, worldMoveX, worldMoveZ);
        this.startLightAttack(audio);
        return;
      }
    }

    // Check Heavy Attack (Right Click release / E / K) - Priority 3
    if (input.actions.heavyAttack && !this.isExhausted) {
      if (this.useStamina(30)) {
        this.aimTowardsTargetOrMouse(input, enemies, isMoving, worldMoveX, worldMoveZ);
        this.startHeavyAttack(audio);
        return;
      }
    }

    // Normal Movement Handling
    if (isMoving) {
      this.state = 'RUN';
      const speed = this.isExhausted ? this.moveSpeed * 0.65 : this.moveSpeed;
      this.velocity.x = worldMoveX * speed;
      this.velocity.z = worldMoveZ * speed;

      // Face direction of movement
      this.targetRotationY = Math.atan2(worldMoveX, worldMoveZ);

      // Running animation
      const walkCycle = Math.sin(this.animTime * 14);
      this.leftLeg.rotation.x = walkCycle * 0.6;
      this.rightLeg.rotation.x = -walkCycle * 0.6;
      this.leftArm.rotation.x = -walkCycle * 0.5;
      this.rightArm.rotation.x = walkCycle * 0.3;
      this.torso.position.y = 0.95 + Math.abs(walkCycle) * 0.08;
      this.torso.rotation.x = 0.12;

      // Rest weapon angle in hand
      this.weapon.group.rotation.set(0.5, 0, -0.2);

      if (Math.random() < 0.1) {
        particles.spawnDustRing(this.position, 0.4);
      }
    } else {
      this.state = 'IDLE';
      this.velocity.x = 0;
      this.velocity.z = 0;

      // Idle breathing pose
      const breath = Math.sin(this.animTime * 3);
      this.torso.position.y = 0.95 + breath * 0.02;
      this.torso.rotation.set(0, 0, 0);
      this.leftLeg.rotation.set(0, 0, 0);
      this.rightLeg.rotation.set(0, 0, 0);
      this.leftArm.rotation.set(0, 0, 0.1);
      this.rightArm.rotation.set(0.3 + breath * 0.05, 0, -0.2);
      this.weapon.group.rotation.set(0.6, 0, -0.2);
    }
  }

  aimTowardsTargetOrMouse(input, enemies, isMoving, worldMoveX, worldMoveZ) {
    // 1. SMART AUTO-TARGETING (Optimized for comfortable laptop play without mouse!)
    if (enemies && enemies.length > 0) {
      let bestTarget = null;
      let bestScore = -Infinity;

      for (const e of enemies) {
        if (e.isDead) continue;
        const dx = e.position.x - this.position.x;
        const dz = e.position.z - this.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 18.0) continue; // Range check

        const angleToEnemy = Math.atan2(dx, dz);
        
        // Priority 1: Closer is higher priority
        let score = (18.0 - dist) * 2.0;

        // Priority 2: Direction alignment (bonus if facing or moving towards enemy)
        const refAngle = isMoving ? Math.atan2(worldMoveX, worldMoveZ) : this.rotationY;
        const angleDiff = Math.abs(MathUtils.angleDiff(angleToEnemy, refAngle));
        score += (Math.PI - angleDiff) * 6.0;

        // Priority 3: High threat enemies (attacking, telegraphing, or Boss)
        if (e.state === 'ATTACKING' || e.state === 'TELEGRAPH') score += 10.0;
        if (e.type === 'BOSS_GOLEM') score += 15.0;

        if (score > bestScore) {
          bestScore = score;
          bestTarget = e;
        }
      }

      if (bestTarget) {
        this.targetRotationY = MathUtils.angleTo(this.position.x, this.position.z, bestTarget.position.x, bestTarget.position.z);
        this.rotationY = this.targetRotationY;
        return;
      }
    }

    // 2. Fallback: Attack in movement direction if moving
    if (isMoving) {
      this.targetRotationY = Math.atan2(worldMoveX, worldMoveZ);
      this.rotationY = this.targetRotationY;
      return;
    }

    // 3. Fallback: Mouse cursor ONLY if actively used
    if (input.hasMovedMouseRecently && input.mouseWorld) {
      const dx = input.mouseWorld.x - this.position.x;
      const dz = input.mouseWorld.z - this.position.z;
      if (dx * dx + dz * dz > 0.3) {
        this.targetRotationY = Math.atan2(dx, dz);
        this.rotationY = this.targetRotationY;
        return;
      }
    }
  }

  startDodge(worldMoveX, worldMoveZ, isMoving, audio, particles, enemies) {
    this.state = 'DODGE';
    this.stateTimer = 0;
    this.isInvulnerable = true;

    // Roll in movement direction, or forward if standing still
    let rollX = isMoving ? worldMoveX : Math.sin(this.targetRotationY);
    let rollZ = isMoving ? worldMoveZ : Math.cos(this.targetRotationY);

    this.targetRotationY = Math.atan2(rollX, rollZ);
    this.rotationY = this.targetRotationY;

    const dodgeSpeed = 17.5;
    this.velocity.x = rollX * dodgeSpeed;
    this.velocity.z = rollZ * dodgeSpeed;

    audio.playDodgeRoll();
    particles.spawnDustRing(this.position, 1.0);

    // Check PERFECT DODGE
    this.checkPerfectDodge(enemies, audio, particles);
  }

  checkPerfectDodge(enemies, audio, particles) {
    if (!enemies || enemies.length === 0) return;

    let perfectDodgeTriggered = false;

    for (const enemy of enemies) {
      if (enemy.isDead) continue;
      const distSq = MathUtils.distSq2D(this.position.x, this.position.z, enemy.position.x, enemy.position.z);
      
      // If enemy is actively attacking or in telegraph windup within 5.0 meters
      if (distSq <= 5.0 * 5.0 && (enemy.state === 'ATTACKING' || enemy.state === 'TELEGRAPH')) {
        perfectDodgeTriggered = true;
        break;
      }
    }

    if (perfectDodgeTriggered) {
      // 1. Refill Stamina
      this.stamina = this.maxStamina;
      this.isExhausted = false;

      // 2. Activate Mega Bonk Crit Buff
      this.megaBonkBuff = true;
      this.megaBonkTimer = 3.5;
      this.visorMat.color.setHex(0xffcc00);
      this.weapon.setGlowColor(0xffcc00);

      // 3. Audio & Visuals
      audio.playPerfectDodge();
      particles.spawnShockwave(this.position, 8.5, 0x00ffff, 0.55);
      particles.spawnTextPopup("⚡ ESQUIVE PARFAITE ! ⚡", this.position, '#00ffff', true);

      if (this.healOnPerfectDodge) {
        this.heal(this.healOnPerfectDodge, particles);
      }

      // 4. Trigger Slow Motion
      if (window.triggerSlowMo) {
        window.triggerSlowMo(1.4, 0.15);
      }
    }
  }

  handleDodge(dt, audio, particles, enemies) {
    const dodgeDuration = 0.44;
    const progress = Math.min(1.0, this.stateTimer / dodgeDuration);

    // 1. Organic Ball Tuck & Joint Articulation
    const tuck = Math.sin(progress * Math.PI); // 0 -> 1 -> 0

    // Body Somersault & Arc trajectory
    this.bodyGroup.rotation.x = progress * Math.PI * 2;
    this.bodyGroup.position.y = tuck * 0.38;

    // Athletic compression & low center of gravity
    const squash = 1.0 - tuck * 0.22;
    this.bodyGroup.scale.set(squash, squash, squash);
    this.torso.position.y = 0.95 - tuck * 0.45;

    // Spine & Head Tuck (Chin to chest)
    this.torso.rotation.x = tuck * 0.65;
    this.head.rotation.x = tuck * 0.85;

    // Knees curled up into the chest
    this.leftLeg.rotation.x = tuck * 1.6;
    this.rightLeg.rotation.x = tuck * 1.4;

    // Arms wrapped tight, heavy weapon tucked securely across the back
    this.leftArm.rotation.x = -tuck * 1.4;
    this.leftArm.rotation.z = tuck * 0.3;
    this.rightArm.rotation.x = -tuck * 1.2;
    this.rightArm.rotation.z = tuck * 0.4;
    this.weapon.group.rotation.set(0.2, 0, -1.2 * tuck);

    // Roll path dust sparks
    if (Math.random() < 0.35 && progress > 0.2 && progress < 0.8) {
      particles.spawnDustRing(this.position, 0.4);
    }

    // Ghost Dash perk
    if (this.ghostDash && enemies) {
      for (const enemy of enemies) {
        if (!enemy.isDead && MathUtils.distSq2D(this.position.x, this.position.z, enemy.position.x, enemy.position.z) < 2.5 * 2.5) {
          enemy.takeDamage(25, this.velocity.x * 0.2, this.velocity.z * 0.2, 8, false);
          particles.spawnHitSparks(enemy.position, 0, 0, 6);
        }
      }
    }

    // Invulnerability window: first 65% of dodge
    if (this.stateTimer >= dodgeDuration * 0.65) {
      this.isInvulnerable = false;
    }

    // Landing recovery on feet
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

      // Foot landing dust puff
      particles.spawnDustRing(this.position, 0.6);
    }
  }

  startLightAttack(audio) {
    this.state = 'ATTACK_LIGHT';
    this.stateTimer = 0;
    this.hasHitCurrentAttack = false;
    this.comboWindowTimer = 0.85;

    audio.playSwing(false);

    // Forward step lunge
    const forwardX = Math.sin(this.targetRotationY);
    const forwardZ = Math.cos(this.targetRotationY);
    this.velocity.x = forwardX * 6.5;
    this.velocity.z = forwardZ * 6.5;
  }

  handleLightAttack(dt, audio, particles, enemies) {
    const attackDuration = 0.32 / this.attackSpeed;
    const progress = this.stateTimer / attackDuration;

    if (this.comboIndex === 0) {
      // Strike 1: Horizontal Slash
      this.rightArm.rotation.set(0.3, progress * Math.PI * 1.5 - 1.2, 0.4);
      this.weapon.group.rotation.set(0.8, 0, 0.2);
      this.torso.rotation.y = Math.sin(progress * Math.PI) * 0.6;
    } else if (this.comboIndex === 1) {
      // Strike 2: Vertical Overhead Smash
      this.rightArm.rotation.set(progress * Math.PI * 1.8 - 1.2, 0, -0.2);
      this.weapon.group.rotation.set(0.2, 0, 0);
      this.torso.rotation.x = Math.sin(progress * Math.PI) * 0.5;
    } else {
      // Strike 3: 360 Spin Bonk!
      this.bodyGroup.rotation.y = progress * Math.PI * 2;
      this.rightArm.rotation.set(0.5, 0, -1.2);
      this.weapon.group.rotation.set(0.6, 0, 0);
    }

    // Active Hitbox Window
    if (progress >= 0.25 && progress <= 0.75 && !this.hasHitCurrentAttack) {
      this.checkWeaponHit(enemies, audio, particles, false);
    }

    if (this.stateTimer >= attackDuration) {
      this.comboIndex = (this.comboIndex + 1) % 3;
      this.state = 'IDLE';
      this.bodyGroup.rotation.set(0, 0, 0);
      this.rightArm.rotation.set(0, 0, 0);
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
    this.velocity.x = forwardX * 9.0;
    this.velocity.z = forwardZ * 9.0;
  }

  handleHeavyAttack(dt, audio, particles, enemies) {
    const attackDuration = 0.52 / this.attackSpeed;
    const progress = this.stateTimer / attackDuration;

    // Both arms raise colossal hammer high and slam down
    this.rightArm.rotation.set(progress * Math.PI * 2.2 - 1.4, 0, -0.2);
    this.leftArm.rotation.set(progress * Math.PI * 2.2 - 1.4, 0, 0.2);
    this.torso.rotation.x = Math.sin(progress * Math.PI) * 0.7;

    if (progress >= 0.35 && progress <= 0.8 && !this.hasHitCurrentAttack) {
      this.checkWeaponHit(enemies, audio, particles, true);
    }

    if (this.stateTimer >= attackDuration) {
      this.state = 'IDLE';
      this.rightArm.rotation.set(0, 0, 0);
      this.leftArm.rotation.set(0, 0, 0);
      this.torso.rotation.set(0, 0, 0);
    }
  }

  checkWeaponHit(enemies, audio, particles, isHeavy = false) {
    if (!enemies) return;

    const hitRange = (isHeavy ? 4.2 : 3.4) * this.weapon.rangeMultiplier;
    const hitAngle = isHeavy ? Math.PI * 0.85 : (this.comboIndex === 2 ? Math.PI * 2 : Math.PI * 0.75);

    let enemiesHit = 0;

    for (const enemy of enemies) {
      if (enemy.isDead) continue;

      const dx = enemy.position.x - this.position.x;
      const dz = enemy.position.z - this.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist <= hitRange) {
        const enemyAngle = Math.atan2(dx, dz);
        const diff = Math.abs(MathUtils.angleDiff(enemyAngle, this.targetRotationY));

        if (diff <= hitAngle * 0.5 || this.comboIndex === 2) {
          enemiesHit++;

          // Damage Calculation
          let isCrit = (Math.random() < this.critChance) || this.megaBonkBuff;
          let damageMultiplier = isHeavy ? 2.2 : (this.comboIndex === 2 ? 1.5 : 1.0);
          if (isCrit) damageMultiplier *= this.critMultiplier;
          if (this.megaBonkBuff) damageMultiplier *= 1.6;

          const finalDamage = Math.floor(this.baseDamage * damageMultiplier * (this.damageModMultiplier || 1.0));

          const normX = dist > 0.01 ? dx / dist : Math.sin(this.targetRotationY);
          const normZ = dist > 0.01 ? dz / dist : Math.cos(this.targetRotationY);
          const knockForce = (isHeavy ? 26 : (this.comboIndex === 2 ? 20 : 13)) * this.knockbackBonus * (this.knockbackModMultiplier || 1.0);

          enemy.takeDamage(finalDamage, normX, normZ, knockForce, isCrit);

          // Audio & Sparks
          audio.playBonk(isHeavy ? 1.6 : 1.0, isCrit);
          particles.spawnHitSparks(enemy.position, normX, normZ, isCrit ? 16 : 8, isCrit);

          const popupText = (this.megaBonkBuff ? "💥 MEGA BONK! " : (isCrit ? "CRIT! " : "")) + finalDamage;
          particles.spawnTextPopup(popupText, enemy.position, isCrit ? '#ff0055' : '#ffdd00', isCrit);

          // Vampirism
          if (this.vampirism > 0 && Math.random() < this.vampirism) {
            this.heal(8, particles);
          }

          // Thunder Chain
          if (this.thunderChain > 0) {
            this.triggerThunderChain(enemy, enemies, audio, particles);
          }
        }
      }
    }

    if (enemiesHit > 0) {
      this.hasHitCurrentAttack = true;

      if (isHeavy) {
        audio.playGroundSlam();
        particles.spawnShockwave(this.position, 5.8, 0xffaa00, 0.45);
      }

      if (this.megaBonkBuff) {
        this.megaBonkBuff = false;
        this.megaBonkTimer = 0;
        this.visorMat.color.setHex(0x00f0ff);
        this.weapon.setGlowColor(0x00f0ff);
      }
    }
  }

  triggerThunderChain(primaryTarget, allEnemies, audio, particles) {
    audio.playThunder();
    let chains = 0;

    for (const other of allEnemies) {
      if (other === primaryTarget || other.isDead) continue;
      const dSq = MathUtils.distSq2D(primaryTarget.position.x, primaryTarget.position.z, other.position.x, other.position.z);
      if (dSq < 9 * 9) {
        particles.spawnLightning(primaryTarget.position, other.position);
        other.takeDamage(Math.floor(this.baseDamage * 0.65), 0, 0, 5, false);
        chains++;
        if (chains >= this.thunderChain) break;
      }
    }
  }

  takeDamage(amount, audio, particles) {
    if (this.isInvulnerable || this.hp <= 0) return;

    this.hp = Math.max(0, this.hp - amount);
    this.state = 'HURT';
    this.stateTimer = 0;

    audio.playPlayerHurt();
    particles.spawnTextPopup("-" + amount, this.position, '#ff2222', true);

    if (this.hp <= 0) {
      this.state = 'DEAD';
    }
  }

  heal(amount, particles) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
    if (particles) {
      particles.spawnTextPopup("+" + amount + " HP", this.position, '#00ff88', false);
    }
  }
}
