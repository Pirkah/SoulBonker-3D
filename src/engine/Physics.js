import * as THREE from '../../libs/three.module.js';
import { MathUtils } from '../utils/MathUtils.js';

export class PhysicsSystem {
  constructor(arenaRadius = 32) {
    this.arenaRadius = arenaRadius;
    this.gravity = -30;
    this.groundFriction = 7.0;
    this.airResistance = 1.2;

    // Obstacles / Pillars in the arena
    this.pillars = [];
  }

  setPillars(pillars) {
    this.pillars = pillars;
  }

  /**
   * Updates an entity's position, velocity, knockback, and handles collisions
   */
  updateEntity(entity, dt, audioManager, particleManager) {
    if (!entity || !entity.position) return;

    // 1. Apply Vertical Gravity if airborne
    if (entity.position.y > 0 || entity.velocity.y > 0) {
      entity.velocity.y += this.gravity * dt;
      entity.position.y += entity.velocity.y * dt;

      // Ground bounce
      if (entity.position.y <= 0) {
        entity.position.y = 0;
        if (entity.velocity.y < -6) {
          // Bounce
          entity.velocity.y = -entity.velocity.y * 0.35;
          if (audioManager) audioManager.playBonk(0.4);
          if (particleManager) particleManager.spawnDustRing(entity.position, 1.2);
        } else {
          entity.velocity.y = 0;
          entity.isAirborne = false;
        }
      } else {
        entity.isAirborne = true;
      }
    }

    // 2. Apply Horizontal Velocity (Movement + Knockback)
    entity.position.x += entity.velocity.x * dt;
    entity.position.z += entity.velocity.z * dt;

    // 3. Friction Damping
    const friction = entity.position.y > 0.1 ? this.airResistance : this.groundFriction;
    entity.velocity.x = MathUtils.damp(entity.velocity.x, 0, friction, dt);
    entity.velocity.z = MathUtils.damp(entity.velocity.z, 0, friction, dt);

    // 4. Pillar / Obstacle Collisions
    for (const pillar of this.pillars) {
      const dx = entity.position.x - pillar.position.x;
      const dz = entity.position.z - pillar.position.z;
      const distSq = dx * dx + dz * dz;
      const minDist = entity.radius + pillar.radius;

      if (distSq < minDist * minDist) {
        const dist = Math.sqrt(distSq) || 0.001;
        const overlap = minDist - dist;
        const nx = dx / dist;
        const nz = dz / dist;

        // Push out of pillar
        entity.position.x += nx * overlap;
        entity.position.z += nz * overlap;

        // High speed bounce / wall slam damage!
        const speedSq = entity.velocity.x * entity.velocity.x + entity.velocity.z * entity.velocity.z;
        if (speedSq > 100 && !entity.isPlayer) {
          // Wall slam impact
          const slamDamage = Math.floor(Math.sqrt(speedSq) * 3.5);
          entity.takeDamage(slamDamage, nx, nz, 5, true);
          if (audioManager) audioManager.playBonk(1.4, true);
          if (particleManager) {
            particleManager.spawnHitSparks(entity.position, nx, nz, 15);
            particleManager.spawnTextPopup("💥 SLAM! " + slamDamage, entity.position, '#ff9900');
          }
          // Reflect velocity
          entity.velocity.x = nx * 10;
          entity.velocity.z = nz * 10;
        }
      }
    }

    // 5. Arena Boundary Check (Ring Out vs Boundary wall)
    const distFromCenterSq = entity.position.x * entity.position.x + entity.position.z * entity.position.z;
    const maxRadius = this.arenaRadius;

    if (distFromCenterSq > maxRadius * maxRadius) {
      const distFromCenter = Math.sqrt(distFromCenterSq);
      
      // If knocked with huge speed, trigger RING OUT!
      if (!entity.isPlayer && (Math.abs(entity.velocity.x) > 10 || Math.abs(entity.velocity.z) > 10 || entity.position.y > 2)) {
        if (!entity.isFallingToAbyss) {
          entity.isFallingToAbyss = true;
          entity.takeDamage(9999, 0, 0, 0, true);
          if (particleManager) {
            particleManager.spawnTextPopup("☠️ RING OUT!", entity.position, '#ff0055');
          }
        }
      } else {
        // Soft arena boundary keeps player & regular walking mobs inside
        const nx = entity.position.x / distFromCenter;
        const nz = entity.position.z / distFromCenter;
        entity.position.x = nx * maxRadius;
        entity.position.z = nz * maxRadius;
        entity.velocity.x *= -0.2;
        entity.velocity.z *= -0.2;
      }
    }
  }

  /**
   * Resolves push/separation collisions between entities (crowd physics)
   */
  resolveEntityCollisions(entities) {
    for (let i = 0; i < entities.length; i++) {
      const a = entities[i];
      if (a.isDead) continue;

      for (let j = i + 1; j < entities.length; j++) {
        const b = entities[j];
        if (b.isDead) continue;

        const dx = b.position.x - a.position.x;
        const dz = b.position.z - a.position.z;
        const distSq = dx * dx + dz * dz;
        const minDist = a.radius + b.radius;

        if (distSq < minDist * minDist && distSq > 0.0001) {
          const dist = Math.sqrt(distSq);
          const overlap = (minDist - dist) * 0.5;
          const nx = dx / dist;
          const nz = dz / dist;

          // Push both apart
          a.position.x -= nx * overlap;
          a.position.z -= nz * overlap;
          b.position.x += nx * overlap;
          b.position.z += nz * overlap;
        }
      }
    }
  }
}
