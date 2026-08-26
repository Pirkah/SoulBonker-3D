import * as THREE from '../../libs/three.module.js';
import { MathUtils } from '../utils/MathUtils.js';
import { GlobalModelLoader } from '../engine/ModelLoader.js';
import { Weapon } from './Weapon.js';
import { CHARACTER_CLASSES } from '../systems/ClassManager.js';

export class RemotePlayer {
  constructor(scene) {
    this.scene = scene;
    this.isPlayer = false; // Is remote opponent

    // Transform
    this.position = new THREE.Vector3(0, 0, 12);
    this.velocity = new THREE.Vector3();
    this.rotationY = Math.PI; // Face towards origin
    this.targetRotationY = Math.PI;
    this.radius = 0.95;

    // Network Target Interpolation Buffer
    this.targetPosition = new THREE.Vector3(0, 0, 12);
    this.targetVelocity = new THREE.Vector3();

    // Stats
    this.currentClass = CHARACTER_CLASSES.KNIGHT;
    this.maxHp = 120;
    this.hp = 120;
    this.state = 'IDLE'; // IDLE, RUN, DODGE, ATTACK_LIGHT, ATTACK_HEAVY, HURT, DEAD
    this.animTime = 0;
    this.stateTimer = 0;
    this.isDead = false;

    // Visual Mesh Hierarchy
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.group.position.copy(this.position);
    this.group.rotation.y = this.rotationY;

    this.buildMesh();
  }

  buildMesh() {
    this.bodyGroup = new THREE.Group();
    this.group.add(this.bodyGroup);

    this.torso = new THREE.Group();
    this.torso.position.y = 0.95;
    this.bodyGroup.add(this.torso);

    this.modelContainer = new THREE.Group();
    this.torso.add(this.modelContainer);

    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.48, 0.32, 0);
    this.torso.add(this.rightArm);

    this.rightHand = new THREE.Group();
    this.rightHand.position.set(0, -0.45, 0.08);
    this.rightArm.add(this.rightHand);

    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.48, 0.32, 0);
    this.torso.add(this.leftArm);

    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.2, 0.55, 0);
    this.bodyGroup.add(this.leftLeg);

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.2, 0.55, 0);
    this.bodyGroup.add(this.rightLeg);

    this.weapon = new Weapon(this.rightHand, this.currentClass.weaponModel, this.currentClass.weaponMtl, this.currentClass.weaponType);

    this.setClass(this.currentClass);
  }

  setClass(classData) {
    if (!classData) return;
    this.currentClass = classData;
    this.maxHp = classData.maxHp;
    this.hp = classData.maxHp;

    if (this.modelContainer) {
      GlobalModelLoader.loadOBJWithMTL(classData.modelPath, classData.mtlPath).then((model) => {
        while (this.modelContainer.children.length > 0) {
          this.modelContainer.remove(this.modelContainer.children[0]);
        }
        if (model) {
          const scale = classData.id === 'SPACEMARINE' ? 1.05 : (classData.id === 'ARCHER' ? 0.95 : 0.9);
          model.scale.set(scale, scale, scale);
          model.position.set(0, -0.95, 0);
          this.modelContainer.add(model);
        }
      }).catch(err => console.warn('Remote model load error:', err));
    }

    if (this.weapon) {
      this.weapon.setWeaponClass(
        classData.weaponModel,
        classData.weaponMtl,
        classData.weaponType,
        classData.color || '#ff0055'
      );
    }
  }

  /**
   * Apply incoming network state packet
   */
  applyNetworkState(data) {
    if (!data) return;

    if (data.pos) {
      this.targetPosition.set(data.pos[0], data.pos[1], data.pos[2]);
    }
    if (data.rot !== undefined) {
      this.targetRotationY = data.rot;
    }
    if (data.vel) {
      this.targetVelocity.set(data.vel[0], 0, data.vel[1]);
    }
    if (data.hp !== undefined) {
      this.hp = data.hp;
    }
    if (data.state && this.state !== data.state) {
      this.state = data.state;
      this.stateTimer = 0;
    }
    if (data.classKey && data.classKey !== this.currentClass.id) {
      const cls = CHARACTER_CLASSES[data.classKey];
      if (cls) this.setClass(cls);
    }
  }

  triggerAttack(isHeavy = false, audio = null) {
    this.state = isHeavy ? 'ATTACK_HEAVY' : 'ATTACK_LIGHT';
    this.stateTimer = 0;
    if (audio) audio.playSwing(isHeavy);
  }

  triggerDodge(audio = null) {
    this.state = 'DODGE';
    this.stateTimer = 0;
    if (audio) audio.playDodgeRoll();
  }

  takeDamage(amount, normX, normZ, force = 10, isCrit = false, audio = null, particles = null) {
    this.hp = Math.max(0, this.hp - amount);
    this.velocity.x = normX * force;
    this.velocity.z = normZ * force;
    this.velocity.y = force * 0.35;

    if (audio) audio.playHit(isCrit ? 1.5 : 1.0, isCrit);
    if (particles) {
      particles.spawnHitSparks(this.position, normX, normZ, isCrit ? 16 : 8, isCrit);
      particles.spawnTextPopup(`-${Math.ceil(amount)}`, this.position, isCrit ? '#ffd700' : '#ff3366', isCrit);
    }

    if (this.hp <= 0) {
      this.isDead = true;
      this.state = 'DEAD';
      if (audio) audio.playDeath();
    }
  }

  update(dt, audio, particles) {
    this.animTime += dt;
    this.stateTimer += dt;

    // Smooth Interpolation towards network target position & rotation
    this.position.x = MathUtils.damp(this.position.x, this.targetPosition.x, 15.0, dt);
    this.position.y = MathUtils.damp(this.position.y, this.targetPosition.y, 15.0, dt);
    this.position.z = MathUtils.damp(this.position.z, this.targetPosition.z, 15.0, dt);

    this.rotationY = MathUtils.dampAngle(this.rotationY, this.targetRotationY, 14.0, dt);

    this.group.position.copy(this.position);
    this.group.rotation.y = this.rotationY;

    // Visual State Machine Animations
    const isMoving = this.targetVelocity.lengthSq() > 0.5;

    if (this.state === 'DODGE') {
      const dodgeDur = 0.42;
      const prog = Math.min(1.0, this.stateTimer / dodgeDur);
      this.bodyGroup.rotation.x = Math.sin(prog * Math.PI) * Math.PI * 2;
      this.bodyGroup.position.y = Math.sin(prog * Math.PI) * 0.5;
      if (this.stateTimer >= dodgeDur) {
        this.state = 'IDLE';
        this.bodyGroup.rotation.x = 0;
        this.bodyGroup.position.y = 0;
      }
    } else if (this.state === 'ATTACK_LIGHT' || this.state === 'ATTACK_HEAVY') {
      const isHeavy = (this.state === 'ATTACK_HEAVY');
      const attackDur = isHeavy ? 0.65 : 0.32;
      const prog = Math.min(1.0, this.stateTimer / attackDur);

      if (this.currentClass.isRanged) {
        this.rightArm.rotation.set(0.2, 0, -0.6);
        this.leftArm.rotation.set(0.2, 0, 0.6);
      } else {
        const swingAngle = Math.sin(prog * Math.PI) * (isHeavy ? 2.8 : 2.2);
        this.rightArm.rotation.set(0.6 - swingAngle, 0, -0.2);
      }

      if (this.stateTimer >= attackDur) {
        this.state = 'IDLE';
        this.rightArm.rotation.set(0.3, 0, -0.2);
        this.leftArm.rotation.set(0, 0, 0.1);
      }
    } else if (isMoving) {
      const walkCycle = Math.sin(this.animTime * 14);
      this.leftLeg.rotation.x = walkCycle * 0.6;
      this.rightLeg.rotation.x = -walkCycle * 0.6;
      this.leftArm.rotation.x = -walkCycle * 0.5;
      this.rightArm.rotation.x = walkCycle * 0.3;
      this.torso.position.y = 0.95 + Math.abs(walkCycle) * 0.08;
    } else {
      const breath = Math.sin(this.animTime * 3);
      this.torso.position.y = 0.95 + breath * 0.02;
      this.leftLeg.rotation.set(0, 0, 0);
      this.rightLeg.rotation.set(0, 0, 0);
      this.leftArm.rotation.set(0, 0, 0.1);
      this.rightArm.rotation.set(0.3 + breath * 0.05, 0, -0.2);
    }

    const isAttacking = (this.state === 'ATTACK_LIGHT' || this.state === 'ATTACK_HEAVY');
    if (this.weapon) {
      this.weapon.update(dt, isAttacking, this.scene);
    }
  }

  destroy() {
    this.scene.remove(this.group);
    this.group.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }
}
