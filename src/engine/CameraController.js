import * as THREE from '../../libs/three.module.js';
import { MathUtils } from '../utils/MathUtils.js';

export class CameraController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    // Camera offset from target in player-local space
    this.distance = 15;
    this.height = 11.5;
    this.pitch = 0.55; // Angle looking down in radians
    this.yaw = 0; // Horizontal orbit angle

    // Current smoothed position and target initialized immediately
    const initOffsetX = Math.sin(this.yaw) * this.distance * Math.cos(this.pitch);
    const initOffsetZ = Math.cos(this.yaw) * this.distance * Math.cos(this.pitch);
    this.currentPosition = new THREE.Vector3(initOffsetX, this.height, initOffsetZ);
    this.lookAtTarget = new THREE.Vector3(0, 1.2, 0);
    this.smoothedLookAt = new THREE.Vector3(0, 1.2, 0);
    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.smoothedLookAt);

    // Lock-on target
    this.lockOnTarget = null;

    // Screen Shake / Trauma system
    this.trauma = 0; // 0 to 1
    this.maxShakeAngle = 0.05; // radians
    this.maxShakeOffset = 0.4; // units

    // Dynamic FOV effects
    this.baseFov = 50;
    this.targetFov = 50;
  }

  addTrauma(amount) {
    this.trauma = MathUtils.clamp(this.trauma + amount, 0, 1);
  }

  setLockOnTarget(target) {
    this.lockOnTarget = target;
  }

  toggleLockOn(potentialTargets, playerPos) {
    if (this.lockOnTarget) {
      this.lockOnTarget = null;
      return null;
    }

    if (!potentialTargets || potentialTargets.length === 0) return null;

    // Find closest alive enemy
    let closest = null;
    let closestDistSq = Infinity;

    for (const enemy of potentialTargets) {
      if (enemy.isDead) continue;
      const dSq = MathUtils.distSq2D(playerPos.x, playerPos.z, enemy.position.x, enemy.position.z);
      if (dSq < closestDistSq && dSq < 35 * 35) {
        closestDistSq = dSq;
        closest = enemy;
      }
    }

    this.lockOnTarget = closest;
    return this.lockOnTarget;
  }

  update(dt, playerPosition, inputManager) {
    if (!playerPosition) return;

    // 1. Decay trauma
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - dt * 1.8);
    }

    // 2. Handle Lock-On or Free Orbit
    if (this.lockOnTarget && !this.lockOnTarget.isDead) {
      // Calculate angle between player and locked enemy
      const dx = this.lockOnTarget.position.x - playerPosition.x;
      const dz = this.lockOnTarget.position.z - playerPosition.z;
      const targetYaw = Math.atan2(dx, dz) + Math.PI;
      this.yaw = MathUtils.damp(this.yaw, targetYaw, 5.0, dt);

      // Midpoint framing
      this.lookAtTarget.set(
        (playerPosition.x + this.lockOnTarget.position.x) * 0.5,
        (playerPosition.y + this.lockOnTarget.position.y) * 0.5 + 1.2,
        (playerPosition.z + this.lockOnTarget.position.z) * 0.5
      );
    } else {
      this.lockOnTarget = null;

      // Soft camera auto-centering when moving
      if (inputManager && (inputManager.moveVector.x !== 0 || inputManager.moveVector.z !== 0)) {
        // Gently follow movement orientation
      }

      this.lookAtTarget.set(
        playerPosition.x,
        playerPosition.y + 1.2,
        playerPosition.z
      );
    }

    // 3. Compute desired camera position
    const offsetX = Math.sin(this.yaw) * this.distance * Math.cos(this.pitch);
    const offsetZ = Math.cos(this.yaw) * this.distance * Math.cos(this.pitch);
    const offsetY = this.height;

    const desiredX = playerPosition.x + offsetX;
    const desiredY = playerPosition.y + offsetY;
    const desiredZ = playerPosition.z + offsetZ;

    // 4. Smooth Camera Following (Framerate-independent)
    this.currentPosition.x = MathUtils.damp(this.currentPosition.x, desiredX, 7.0, dt);
    this.currentPosition.y = MathUtils.damp(this.currentPosition.y, desiredY, 7.0, dt);
    this.currentPosition.z = MathUtils.damp(this.currentPosition.z, desiredZ, 7.0, dt);

    this.smoothedLookAt.x = MathUtils.damp(this.smoothedLookAt.x, this.lookAtTarget.x, 9.0, dt);
    this.smoothedLookAt.y = MathUtils.damp(this.smoothedLookAt.y, this.lookAtTarget.y, 9.0, dt);
    this.smoothedLookAt.z = MathUtils.damp(this.smoothedLookAt.z, this.lookAtTarget.z, 9.0, dt);

    // 5. Apply Screen Shake via Trauma^2
    const shake = this.trauma * this.trauma;
    const shakeOffsetX = (Math.random() * 2 - 1) * this.maxShakeOffset * shake;
    const shakeOffsetY = (Math.random() * 2 - 1) * this.maxShakeOffset * shake;
    const shakeOffsetZ = (Math.random() * 2 - 1) * this.maxShakeOffset * shake;

    this.camera.position.set(
      this.currentPosition.x + shakeOffsetX,
      this.currentPosition.y + shakeOffsetY,
      this.currentPosition.z + shakeOffsetZ
    );

    this.camera.lookAt(this.smoothedLookAt);

    // 6. Smooth Dynamic FOV
    if (Math.abs(this.camera.fov - this.targetFov) > 0.1) {
      this.camera.fov = MathUtils.damp(this.camera.fov, this.targetFov, 6.0, dt);
      this.camera.updateProjectionMatrix();
    }
  }

  setFovPunch(fov, returnAfterMs = 250) {
    this.targetFov = fov;
    setTimeout(() => {
      this.targetFov = this.baseFov;
    }, returnAfterMs);
  }
}
