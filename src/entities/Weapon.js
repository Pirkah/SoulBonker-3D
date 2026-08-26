import * as THREE from '../../libs/three.module.js';
import { GlobalModelLoader } from '../engine/ModelLoader.js';

export class Weapon {
  constructor(parentHand, weaponModel = 'assets/models/megabonk_club.obj', weaponMtl = 'assets/models/megabonk_club.mtl', weaponType = 'CLUB') {
    this.parentHand = parentHand;
    this.group = new THREE.Group();
    this.baseScale = 1.0;
    this.currentScale = 1.0;
    this.rangeMultiplier = 1.0;
    this.weaponType = weaponType;

    // Weapon Tip & Base positions for collision & trail
    this.tipPosition = new THREE.Vector3();
    this.basePosition = new THREE.Vector3();

    // Trail points history
    this.trailHistory = [];
    this.maxTrailLength = 10;

    this.buildWeaponMesh(weaponModel, weaponMtl, weaponType);
    this.buildTrailMesh();

    if (this.parentHand) {
      this.parentHand.add(this.group);
    }
  }

  buildWeaponMesh(modelPath = 'assets/models/megabonk_club.obj', mtlPath = 'assets/models/megabonk_club.mtl', weaponType = 'CLUB') {
    // Clear previous children
    while (this.group.children.length > 0) {
      const c = this.group.children[0];
      this.group.remove(c);
    }

    this.weaponType = weaponType;

    if (!modelPath) {
      this.group.visible = false;
      return;
    }
    this.group.visible = true;

    this.modelGroup = new THREE.Group();
    this.group.add(this.modelGroup);

    if (this.weaponLoadRequestId === undefined) this.weaponLoadRequestId = 0;
    const reqId = ++this.weaponLoadRequestId;

    // Load Blender 3D Model
    GlobalModelLoader.loadOBJWithMTL(modelPath, mtlPath).then((model) => {
      if (reqId !== this.weaponLoadRequestId) return;

      while (this.modelGroup.children.length > 0) {
        const c = this.modelGroup.children[0];
        this.modelGroup.remove(c);
      }

      if (model) {
        if (weaponType === 'BOW') {
          model.scale.set(1.30, 1.30, 1.30);
          model.position.set(0, 0, 0);
          model.rotation.set(-Math.PI / 4, 0, 0);
        } else if (weaponType === 'STAFF') {
          model.scale.set(1.15, 1.15, 1.15);
          model.position.set(0, 0.15, 0);
        } else if (weaponType === 'CHAINSWORD') {
          model.scale.set(1.18, 1.18, 1.18);
          model.position.set(0, 0.28, 0);
        } else if (weaponType === 'SCYTHE') {
          model.scale.set(1.30, 1.30, 1.30);
          model.position.set(0, 0, 0);
          model.rotation.set(0, 0, 0);
        } else if (weaponType === 'ANGEL_SWORD') {
          model.scale.set(1.45, 1.45, 1.45);
          model.position.set(0, 0.15, 0);
          model.rotation.set(0, 0, 0);
        } else if (weaponType === 'DAGGER') {
          model.scale.set(1.12, 1.12, 1.12);
          model.position.set(0, 0.15, 0);
        } else if (weaponType === 'CHOPPA') {
          model.scale.set(1.16, 1.16, 1.16);
          model.position.set(0, 0.22, 0);
        } else if (weaponType === 'NECRO_STAFF') {
          model.scale.set(1.20, 1.20, 1.20);
          model.position.set(0, 0, 0);
          model.rotation.set(0, 0, 0);
        } else if (weaponType === 'CLUB') {
          model.scale.set(1.15, 1.15, 1.15);
          model.position.set(0, 0.10, 0);
          model.rotation.set(0, 0, 0);
        } else {
          model.scale.set(1.05, 1.05, 1.05);
          model.position.set(0, 0.2, 0);
        }
        this.modelGroup.add(model);
      }
    }).catch(err => console.warn('Could not load weapon model:', err));

    // Optional Glowing Rune Gem at the Tip (for Mage staff only)
    if (weaponType === 'STAFF') {
      const runeGeo = new THREE.OctahedronGeometry(0.14);
      this.runeMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
      this.rune = new THREE.Mesh(runeGeo, this.runeMat);
      this.rune.position.y = 2.4;
      this.group.add(this.rune);
    }

    // Initial position & orientation inside the hand
    this.group.position.set(0, 0, 0);
    this.group.rotation.set(Math.PI / 4, 0, 0);
  }

  setWeaponClass(modelPath, mtlPath, weaponType, glowColor = 0x00ffff) {
    this.buildWeaponMesh(modelPath, mtlPath, weaponType);
    this.setGlowColor(glowColor);
    if (this.parentHand && this.group.parent !== this.parentHand) {
      this.parentHand.add(this.group);
    }
  }

  buildTrailMesh() {
    this.trailGeo = new THREE.BufferGeometry();
    const maxPoints = this.maxTrailLength * 2;
    const positions = new Float32Array(maxPoints * 3);
    const alphas = new Float32Array(maxPoints);

    this.trailGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.trailGeo.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

    this.trailMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uColor: { value: new THREE.Color(0x00ffff) }
      },
      vertexShader: `
        attribute float alpha;
        varying float vAlpha;
        void main() {
          vAlpha = alpha;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          gl_FragColor = vec4(uColor, vAlpha * 0.7);
        }
      `
    });

    this.trailMesh = new THREE.Mesh(this.trailGeo, this.trailMat);
    this.trailMesh.frustumCulled = false;
    this.trailMesh.visible = false;
  }

  setScale(scaleMultiplier) {
    this.rangeMultiplier = scaleMultiplier;
    this.currentScale = this.baseScale * scaleMultiplier;
    this.group.scale.set(this.currentScale, this.currentScale, this.currentScale);
  }

  setGlowColor(hex) {
    if (this.runeMat) {
      this.runeMat.color.set(hex);
    }
    if (this.trailMat && this.trailMat.uniforms.uColor) {
      this.trailMat.uniforms.uColor.value.set(hex);
    }
  }

  update(dt, isAttacking, worldScene) {
    if (!worldScene) return;

    if (this.trailMesh.parent !== worldScene) {
      worldScene.add(this.trailMesh);
    }

    if (this.rune) {
      this.rune.rotation.y += dt * 6.0;
    }

    const tipLocal = new THREE.Vector3(0, 2.3, 0);
    const baseLocal = new THREE.Vector3(0, 0.2, 0);

    this.tipPosition.copy(tipLocal).applyMatrix4(this.group.matrixWorld);
    this.basePosition.copy(baseLocal).applyMatrix4(this.group.matrixWorld);

    if (isAttacking) {
      this.trailMesh.visible = true;
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
      }
    }
  }

  updateTrailGeometry() {
    const posAttr = this.trailGeo.getAttribute('position');
    const alphaAttr = this.trailGeo.getAttribute('alpha');
    const positions = posAttr.array;
    const alphas = alphaAttr.array;

    const count = this.trailHistory.length;
    for (let i = 0; i < count; i++) {
      const pt = this.trailHistory[i];
      const factor = 1.0 - i / count;

      positions[i * 6 + 0] = pt.tip.x;
      positions[i * 6 + 1] = pt.tip.y;
      positions[i * 6 + 2] = pt.tip.z;
      alphas[i * 2 + 0] = factor;

      positions[i * 6 + 3] = pt.base.x;
      positions[i * 6 + 4] = pt.base.y;
      positions[i * 6 + 5] = pt.base.z;
      alphas[i * 2 + 1] = factor;
    }

    posAttr.needsUpdate = true;
    alphaAttr.needsUpdate = true;
    this.trailGeo.setDrawRange(0, count * 2);
  }
}
