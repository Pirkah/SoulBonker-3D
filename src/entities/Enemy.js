import * as THREE from '../../libs/three.module.js';
import { MathUtils } from '../utils/MathUtils.js';

export class Enemy {
  constructor(scene, x, z) {
    this.scene = scene;
    this.isPlayer = false;

    // Transform
    this.position = new THREE.Vector3(x, 0, z);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotationY = Math.random() * Math.PI * 2;
    this.radius = 0.9;
    this.isAirborne = false;
    this.isFallingToAbyss = false;

    // Base Stats (Overridden by specific types)
    this.maxHp = 60;
    this.hp = 60;
    this.damage = 15;
    this.moveSpeed = 4.5;
    this.attackRange = 2.2;
    this.telegraphDuration = 0.8;
    this.attackDuration = 0.35;
    this.cooldownDuration = 0.6;
    this.scoreValue = 100;

    // State
    this.state = 'SPAWN'; // SPAWN, CHASE, TELEGRAPH, ATTACK, COOLDOWN, KNOCKED_BACK, DEAD
    this.stateTimer = 0;
    this.isDead = false;
    this.deathTimer = 0;

    // Visual Mesh Group
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.group.position.copy(this.position);

    // Telegraph Ground Indicator Mesh
    this.buildTelegraphDecal();
  }

  buildTelegraphDecal() {
    const ringGeo = new THREE.RingGeometry(0.1, 2.0, 24);
    this.telegraphMat = new THREE.MeshBasicMaterial({
      color: 0xff0044,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0
    });
    this.telegraphMesh = new THREE.Mesh(ringGeo, this.telegraphMat);
    this.telegraphMesh.rotation.x = -Math.PI / 2;
    this.telegraphMesh.position.y = 0.08;
    this.group.add(this.telegraphMesh);
  }

  takeDamage(amount, normX, normZ, force = 10, isCrit = false) {
    if (this.isDead) return;

    this.hp -= amount;

    // 1. Immediately cancel active attack telegraph indicators so they don't linger
    if (this.telegraphMat) {
      this.telegraphMat.opacity = 0;
    }
    if (this.telegraphMesh) {
      this.telegraphMesh.scale.set(1, 1, 1);
    }

    // 2. Heavy units & Bosses have poise armor (reduced knockback, no vertical launch)
    const isBoss = this.type.startsWith('BOSS_') || this.type === 'HAMMER_BRUTE' || this.type === 'TITAN_GOLEM';
    const effectiveForce = isBoss ? force * 0.25 : force;

    // Apply Knockback Impulse
    this.velocity.x = normX * effectiveForce;
    this.velocity.z = normZ * effectiveForce;
    
    // Only launch vertically for regular mobs on heavy bonk/crit
    if (!isBoss) {
      this.velocity.y = (isCrit || force >= 18) ? Math.min(force * 0.25, 5.0) : 0;
    } else {
      this.velocity.y = 0;
    }

    // Flinch recoil angle (tilt backward smoothly without spinning)
    if (this.modelGroup) {
      this.modelGroup.rotation.x = -0.35;
    }
    this.group.rotation.x = 0;
    this.group.rotation.z = 0;

    this.state = 'KNOCKED_BACK';
    this.stateTimer = 0;

    // Flash hit emissive on hit
    this.flashHitColor();

    if (this.hp <= 0) {
      this.die();
    }
  }

  flashHitColor() {
    this.group.traverse((child) => {
      if (child.isMesh && child.material && child !== this.telegraphMesh) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        for (const mat of mats) {
          if (mat.emissive) {
            const origEmissive = mat.emissive.getHex();
            mat.emissive.setHex(0xff2222);
            setTimeout(() => {
              if (mat && mat.emissive) mat.emissive.setHex(origEmissive);
            }, 90);
          }
        }
      }
    });
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.state = 'DEAD';
    this.deathTimer = 0;
    if (this.telegraphMat) {
      this.telegraphMat.opacity = 0;
    }
  }

  destroy() {
    this.scene.remove(this.group);
    this.group.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }

  update(dt, player, audio, particles) {
    this.stateTimer += dt;

    if (this.isDead) {
      this.deathTimer += dt;
      // Shrink and sink
      this.group.scale.multiplyScalar(Math.max(0, 1 - dt * 4));
      this.group.position.y -= dt * 2.0;
      return;
    }

    const distToPlayer = MathUtils.dist2D(this.position.x, this.position.z, player.position.x, player.position.z);
    const angleToPlayer = MathUtils.angleTo(this.position.x, this.position.z, player.position.x, player.position.z);
    const isBoss = this.type.startsWith('BOSS_') || this.type === 'HAMMER_BRUTE' || this.type === 'TITAN_GOLEM';

    // Handle Enemy State Machine
    switch (this.state) {
      case 'SPAWN':
        if (this.stateTimer < 0.4) {
          const t = this.stateTimer / 0.4;
          this.group.scale.set(t, t, t);
          this.position.y = (1 - t) * -2;
        } else {
          this.group.scale.set(1, 1, 1);
          this.position.y = 0;
          this.state = 'CHASE';
        }
        break;

      case 'CHASE':
        this.targetRotationY = angleToPlayer;
        this.rotationY = MathUtils.damp(this.rotationY, this.targetRotationY, 8.0, dt);

        if (distToPlayer <= this.attackRange) {
          this.state = 'TELEGRAPH';
          this.stateTimer = 0;
        } else {
          // Move towards player
          const dirX = Math.sin(angleToPlayer);
          const dirZ = Math.cos(angleToPlayer);
          this.velocity.x = dirX * this.moveSpeed;
          this.velocity.z = dirZ * this.moveSpeed;

          this.animateWalk(dt);
        }
        break;

      case 'TELEGRAPH':
        // Wind-up attack telegraph
        this.targetRotationY = angleToPlayer;
        this.rotationY = MathUtils.damp(this.rotationY, this.targetRotationY, 4.0, dt);
        this.velocity.x = 0;
        this.velocity.z = 0;

        const telegraphProgress = this.stateTimer / this.telegraphDuration;
        this.telegraphMat.opacity = telegraphProgress * 0.75;
        this.telegraphMesh.scale.set(1 + telegraphProgress * 0.5, 1 + telegraphProgress * 0.5, 1);

        this.animateTelegraph(telegraphProgress);

        if (this.stateTimer >= this.telegraphDuration) {
          this.state = 'ATTACK';
          this.stateTimer = 0;
          this.telegraphMat.opacity = 0;
          this.performAttack(player, audio, particles);
        }
        break;

      case 'ATTACK':
        this.animateAttack(this.stateTimer / this.attackDuration);
        if (this.stateTimer >= this.attackDuration) {
          this.state = 'COOLDOWN';
          this.stateTimer = 0;
        }
        break;

      case 'COOLDOWN':
        if (this.stateTimer >= this.cooldownDuration) {
          this.state = 'CHASE';
        }
        break;

      case 'KNOCKED_BACK':
        // Smoothly recover from flinch tilt without wild spinning
        this.group.rotation.x = MathUtils.damp(this.group.rotation.x, 0, 12, dt);
        this.group.rotation.z = MathUtils.damp(this.group.rotation.z, 0, 12, dt);
        if (this.modelGroup) {
          this.modelGroup.rotation.x = MathUtils.damp(this.modelGroup.rotation.x, 0, 8, dt);
          this.modelGroup.rotation.z = MathUtils.damp(this.modelGroup.rotation.z, 0, 8, dt);
        }

        const isGrounded = this.position.y <= 0.05;
        const stunDuration = isBoss ? 0.20 : 0.32;

        if (isGrounded && this.stateTimer >= stunDuration) {
          this.state = 'CHASE';
          this.stateTimer = 0;
          this.group.rotation.x = 0;
          this.group.rotation.z = 0;
          if (this.modelGroup) {
            this.modelGroup.rotation.x = 0;
            this.modelGroup.rotation.z = 0;
          }
        }
        break;
    }

    // Sync 3D Group Transform
    this.group.position.copy(this.position);
    this.group.rotation.y = this.rotationY;
  }

  animateWalk(dt) {}
  animateTelegraph(progress) {}
  animateAttack(progress) {}
  performAttack(player, audio, particles) {}
}
