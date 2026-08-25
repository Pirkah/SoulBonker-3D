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

    // Apply Knockback Impulse
    this.velocity.x = normX * force;
    this.velocity.z = normZ * force;
    this.velocity.y = force * (isCrit ? 0.6 : 0.35); // Launch into air

    this.state = 'KNOCKED_BACK';
    this.stateTimer = 0;

    // Flash Red on hit
    this.flashHitColor();

    if (this.hp <= 0) {
      this.die();
    }
  }

  flashHitColor() {
    if (this.bodyMesh && this.bodyMesh.material) {
      const origColor = this.bodyMesh.material.color.getHex();
      this.bodyMesh.material.color.setHex(0xffffff);
      setTimeout(() => {
        if (this.bodyMesh && this.bodyMesh.material) {
          this.bodyMesh.material.color.setHex(origColor);
        }
      }, 80);
    }
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.state = 'DEAD';
    this.deathTimer = 0;
  }

  destroy() {
    this.scene.remove(this.group);
    this.group.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
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
        // Tumbling ragdoll physics through the air
        this.group.rotation.x += dt * 15;
        this.group.rotation.z += dt * 10;

        if (this.position.y <= 0 && this.stateTimer > 0.4) {
          this.state = 'CHASE';
          this.group.rotation.x = 0;
          this.group.rotation.z = 0;
        }
        break;
    }

    // Sync 3D Group Transform
    this.group.position.copy(this.position);
    if (this.state !== 'KNOCKED_BACK') {
      this.group.rotation.y = this.rotationY;
    }
  }

  animateWalk(dt) {}
  animateTelegraph(progress) {}
  animateAttack(progress) {}
  performAttack(player, audio, particles) {}
}
