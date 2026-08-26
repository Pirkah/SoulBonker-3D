import * as THREE from '../../libs/three.module.js';
import { MathUtils } from '../utils/MathUtils.js';

export class CameraController {
  constructor(camera, domElement, scene = null) {
    this.camera = camera;
    this.domElement = domElement;
    this.scene = scene;

    // Camera offset from target in player-local space
    this.distance = 12.0;
    this.height = 8.5;
    this.pitch = 0.50; // Angle looking down in radians
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
    this.lockReticle = null;

    if (this.scene) {
      this.initReticle(this.scene);
    }

    // Screen Shake / Trauma system
    this.trauma = 0; // 0 to 1
    this.maxShakeAngle = 0.05; // radians
    this.maxShakeOffset = 0.4; // units

    // Dynamic FOV effects
    this.baseFov = 50;
    this.targetFov = 50;
  }

  initReticle(scene) {
    this.scene = scene;
    const group = new THREE.Group();

    // Outer neon targeting ring
    const ringGeo = new THREE.RingGeometry(0.4, 0.55, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    group.add(ring);

    // Inner glowing diamond pip
    const pipGeo = new THREE.OctahedronGeometry(0.18);
    const pipMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
    const pip = new THREE.Mesh(pipGeo, pipMat);
    group.add(pip);

    group.visible = false;
    this.scene.add(group);
    this.lockReticle = group;
  }

  addTrauma(amount) {
    this.trauma = MathUtils.clamp(this.trauma + amount, 0, 1);
  }

  setLockOnTarget(target) {
    this.lockOnTarget = target;
  }

  toggleLockOn(potentialTargets, playerPos, particles = null) {
    if (this.lockOnTarget) {
      this.lockOnTarget = null;
      if (this.lockReticle) this.lockReticle.visible = false;
      if (particles) particles.spawnTextPopup("🔓 CIBLAGE DÉSACTIVÉ", playerPos, '#94a3b8', true);
      return null;
    }

    if (!potentialTargets || potentialTargets.length === 0) return null;

    // Find closest alive enemy
    let closest = null;
    let closestDistSq = Infinity;

    for (const enemy of potentialTargets) {
      if (enemy.isDead) continue;
      const dSq = MathUtils.distSq2D(playerPos.x, playerPos.z, enemy.position.x, enemy.position.z);
      if (dSq < closestDistSq && dSq < 32 * 32) {
        closestDistSq = dSq;
        closest = enemy;
      }
    }

    this.lockOnTarget = closest;
    if (this.lockOnTarget && particles) {
      particles.spawnTextPopup("🎯 CIBLE VERROUILLÉE", this.lockOnTarget.position, '#00f0ff', true);
    }
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
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 34.0) {
        // Break lock-on if distance exceeds range
        this.lockOnTarget = null;
        if (this.lockReticle) this.lockReticle.visible = false;
      } else {
        const targetYaw = Math.atan2(dx, dz) + Math.PI;
        this.yaw = MathUtils.dampAngle(this.yaw, targetYaw, 3.8, dt);

        // Smooth midpoint framing between player and locked target
        this.lookAtTarget.set(
          (playerPosition.x + this.lockOnTarget.position.x) * 0.5,
          (playerPosition.y + this.lockOnTarget.position.y) * 0.5 + 1.2,
          (playerPosition.z + this.lockOnTarget.position.z) * 0.5
        );

        // Update 3D Reticle
        if (this.lockReticle) {
          this.lockReticle.visible = true;
          const targetY = (this.lockOnTarget.position.y || 0) + (this.lockOnTarget.radius ? this.lockOnTarget.radius * 1.8 : 2.2);
          this.lockReticle.position.set(this.lockOnTarget.position.x, targetY, this.lockOnTarget.position.z);
          this.lockReticle.rotation.z += dt * 3.5;
          this.lockReticle.lookAt(this.camera.position);
        }
      }
    } else {
      this.lockOnTarget = null;
      if (this.lockReticle) {
        this.lockReticle.visible = false;
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
