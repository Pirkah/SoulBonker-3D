import * as THREE from '../../libs/three.module.js';
import { GlobalModelLoader } from '../engine/ModelLoader.js';

export class SkeletonMinion {
  constructor(scene, owner, startPos) {
    this.scene = scene;
    this.owner = owner;
    
    this.position = new THREE.Vector3().copy(startPos);
    this.rotationY = 0;
    
    this.hp = 50;
    this.maxHp = 50;
    this.speed = 9.5;
    this.damage = 22;
    this.attackRange = 1.8;
    this.attackCooldown = 0.8;
    this.attackTimer = 0;
    
    this.isAlive = true;
    this.isSkeletonMinion = true;
    
    this.group = new THREE.Group();
    this.group.position.copy(this.position);
    this.scene.add(this.group);
    
    // Green Summoning Ground Circle
    const circleGeo = new THREE.RingGeometry(0.3, 0.8, 16);
    const circleMat = new THREE.MeshBasicMaterial({ color: 0x00ff66, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
    this.summonRing = new THREE.Mesh(circleGeo, circleMat);
    this.summonRing.rotation.x = -Math.PI / 2;
    this.summonRing.position.y = 0.05;
    this.group.add(this.summonRing);
    this.summonTime = 0.8;

    // Load Skeleton 3D Model
    this.modelContainer = new THREE.Group();
    this.group.add(this.modelContainer);
    
    GlobalModelLoader.loadOBJWithMTL('assets/models/skeleton_minion.obj', 'assets/models/skeleton_minion.mtl').then((model) => {
      if (model && this.isAlive) {
        model.scale.set(1.15, 1.15, 1.15);
        model.position.set(0, 0.12, 0);
        this.modelContainer.add(model);
      }
    }).catch((err) => console.warn('Could not load skeleton minion model:', err));

    this.walkCycle = Math.random() * Math.PI;
  }

  takeDamage(amount, soundManager = null) {
    if (!this.isAlive) return;
    this.hp -= amount;
    
    // Flash white/red
    this.modelContainer.traverse((child) => {
      if (child.isMesh && child.material) {
        const origColor = child.material.color.getHex();
        child.material.color.setHex(0xff3333);
        setTimeout(() => {
          if (child.material) child.material.color.setHex(origColor);
        }, 100);
      }
    });

    if (this.hp <= 0) {
      this.die(soundManager);
    }
  }

  die(soundManager = null) {
    if (!this.isAlive) return;
    this.isAlive = false;
    if (soundManager) soundManager.playHit();
    
    // Death collapse animation
    let elapsed = 0;
    const collapseInterval = setInterval(() => {
      elapsed += 0.03;
      this.group.position.y -= 0.05;
      this.group.rotation.x += 0.1;
      this.group.scale.multiplyScalar(0.92);
      if (elapsed > 0.4) {
        clearInterval(collapseInterval);
        this.scene.remove(this.group);
      }
    }, 30);
  }

  update(dt, enemiesList = [], remotePlayer = null, soundManager = null) {
    if (!this.isAlive) return;

    if (this.summonTime > 0) {
      this.summonTime -= dt;
      this.summonRing.scale.multiplyScalar(0.97);
      if (this.summonTime <= 0) {
        this.group.remove(this.summonRing);
      }
    }

    if (this.attackTimer > 0) {
      this.attackTimer -= dt;
    }

    // 1. Find Closest Target (Monsters or Remote Player in 1v1)
    let closestTarget = null;
    let closestDistSq = Infinity;

    // Check remote opponent in 1v1
    if (remotePlayer && remotePlayer.hp > 0) {
      const dSq = this.position.distanceToSquared(remotePlayer.position);
      if (dSq < closestDistSq) {
        closestDistSq = dSq;
        closestTarget = remotePlayer;
      }
    }

    // Check offline mobs
    for (const enemy of enemiesList) {
      if (enemy && enemy.hp > 0) {
        const dSq = this.position.distanceToSquared(enemy.position);
        if (dSq < closestDistSq) {
          closestDistSq = dSq;
          closestTarget = enemy;
        }
      }
    }

    // 2. Movement & Combat AI
    const dist = Math.sqrt(closestDistSq);

    if (closestTarget && dist < 22) {
      // Move toward enemy
      const dirX = closestTarget.position.x - this.position.x;
      const dirZ = closestTarget.position.z - this.position.z;
      this.rotationY = Math.atan2(dirX, dirZ);

      if (dist > this.attackRange) {
        const moveStep = this.speed * dt;
        this.position.x += (dirX / dist) * moveStep;
        this.position.z += (dirZ / dist) * moveStep;
        this.walkCycle += dt * 10;
        this.modelContainer.rotation.z = Math.sin(this.walkCycle) * 0.15;
      } else {
        // Attack Target
        if (this.attackTimer <= 0) {
          this.attackTimer = this.attackCooldown;
          if (closestTarget.takeDamage) {
            closestTarget.takeDamage(this.damage);
            if (soundManager) soundManager.playHit();
          }
          // Visual Attack Lunge
          this.modelContainer.position.z = 0.35;
          setTimeout(() => {
            if (this.isAlive) this.modelContainer.position.z = 0;
          }, 150);
        }
      }
    } else if (this.owner) {
      // Follow Master Necromancer
      const toOwnerX = this.owner.position.x - this.position.x;
      const toOwnerZ = this.owner.position.z - this.position.z;
      const distToOwner = Math.hypot(toOwnerX, toOwnerZ);

      if (distToOwner > 2.8) {
        this.rotationY = Math.atan2(toOwnerX, toOwnerZ);
        const followSpeed = this.speed * 1.1;
        this.position.x += (toOwnerX / distToOwner) * followSpeed * dt;
        this.position.z += (toOwnerZ / distToOwner) * followSpeed * dt;
        this.walkCycle += dt * 8;
        this.modelContainer.rotation.z = Math.sin(this.walkCycle) * 0.1;
      }
    }

    // Sync 3D Transform
    this.group.position.set(this.position.x, 0, this.position.z);
    this.group.rotation.y = this.rotationY;
  }
}
