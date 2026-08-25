import * as THREE from '../../libs/three.module.js';

export class Weapon {
  constructor(parentHand) {
    this.parentHand = parentHand;
    this.group = new THREE.Group();
    this.baseScale = 1.0;
    this.currentScale = 1.0;
    this.rangeMultiplier = 1.0;

    // Weapon Tip & Base positions for collision & trail
    this.tipPosition = new THREE.Vector3();
    this.basePosition = new THREE.Vector3();

    // Trail points history
    this.trailHistory = [];
    this.maxTrailLength = 10;

    this.buildWeaponMesh();
    this.buildTrailMesh();

    if (this.parentHand) {
      this.parentHand.add(this.group);
    }
  }

  buildWeaponMesh() {
    // 1. Grip / Handle (Pivot is right at the hand center: Y=0)
    const handleGeo = new THREE.CylinderGeometry(0.06, 0.07, 1.4, 8);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.85 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    // Center the grip so the hand holds it at y=0
    handle.position.y = 0.35;
    handle.castShadow = true;
    this.group.add(handle);

    // Pommel (Bottom of handle)
    const pommelGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xddaa33, metalness: 0.8, roughness: 0.3 });
    const pommel = new THREE.Mesh(pommelGeo, goldMat);
    pommel.position.y = -0.35;
    this.group.add(pommel);

    // 2. Heavy Head (Megabonk Spiked Club / Hammer)
    const headGeo = new THREE.CylinderGeometry(0.28, 0.18, 1.1, 8);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x707888,
      metalness: 0.7,
      roughness: 0.35
    });
    this.head = new THREE.Mesh(headGeo, headMat);
    this.head.position.y = 1.35;
    this.head.castShadow = true;
    this.group.add(this.head);

    // 3. Spikes / Studs on Head
    for (let i = 0; i < 6; i++) {
      const spikeGeo = new THREE.ConeGeometry(0.09, 0.3, 5);
      const spike = new THREE.Mesh(spikeGeo, goldMat);
      const angle = (i * Math.PI) / 3;
      spike.position.set(Math.sin(angle) * 0.24, 1.15 + (i % 2) * 0.35, Math.cos(angle) * 0.24);
      spike.rotation.z = Math.PI / 2;
      spike.rotation.y = angle;
      this.group.add(spike);
    }

    // 4. Glowing Rune Core at the Tip
    const runeGeo = new THREE.SphereGeometry(0.14, 8, 8);
    this.runeMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const rune = new THREE.Mesh(runeGeo, this.runeMat);
    rune.position.y = 1.95;
    this.group.add(rune);

    // Initial position & orientation inside the hand
    this.group.position.set(0, 0, 0);
    this.group.rotation.set(Math.PI / 4, 0, 0); // Natural angled grip
  }

  buildTrailMesh() {
    this.trailGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxTrailLength * 2 * 3);
    this.trailGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.trailGeo.setDrawRange(0, 0); // Don't draw anything initially!

    this.trailMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    });

    this.trailMesh = new THREE.Mesh(this.trailGeo, this.trailMat);
    this.trailMesh.frustumCulled = false;
    this.trailMesh.visible = false;
  }

  setScale(multiplier) {
    this.currentScale = this.baseScale * multiplier;
    this.rangeMultiplier = multiplier;
    this.group.scale.set(this.currentScale, this.currentScale, this.currentScale);
  }

  setGlowColor(colorHex) {
    if (this.runeMat) {
      this.runeMat.color.setHex(colorHex);
    }
    if (this.trailMat) {
      this.trailMat.color.setHex(colorHex);
    }
  }

  update(isAttacking) {
    // Get World Position of weapon tip & base
    const localTip = new THREE.Vector3(0, 2.0 * this.currentScale, 0);
    const localBase = new THREE.Vector3(0, 0.2 * this.currentScale, 0);

    this.tipPosition.copy(localTip).applyMatrix4(this.group.matrixWorld);
    this.basePosition.copy(localBase).applyMatrix4(this.group.matrixWorld);

    if (isAttacking) {
      this.trailHistory.unshift({
        tip: this.tipPosition.clone(),
        base: this.basePosition.clone()
      });
      if (this.trailHistory.length > this.maxTrailLength) {
        this.trailHistory.pop();
      }
      this.updateTrailGeometry();
    } else {
      if (this.trailHistory.length > 0) {
        this.trailHistory.pop();
        this.updateTrailGeometry();
      } else {
        this.trailMesh.visible = false;
        this.trailGeo.setDrawRange(0, 0);
      }
    }
  }

  updateTrailGeometry() {
    if (this.trailHistory.length < 2) {
      this.trailMesh.visible = false;
      this.trailGeo.setDrawRange(0, 0);
      return;
    }

    this.trailMesh.visible = true;
    const posAttr = this.trailGeo.getAttribute('position');
    let idx = 0;

    for (let i = 0; i < this.trailHistory.length; i++) {
      const pt = this.trailHistory[i];
      posAttr.setXYZ(idx++, pt.tip.x, pt.tip.y, pt.tip.z);
      posAttr.setXYZ(idx++, pt.base.x, pt.base.y, pt.base.z);
    }

    posAttr.needsUpdate = true;
    this.trailGeo.setDrawRange(0, this.trailHistory.length * 2);
  }
}
