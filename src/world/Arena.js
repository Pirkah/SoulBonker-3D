import * as THREE from '../../libs/three.module.js';
import { GlobalModelLoader } from '../engine/ModelLoader.js';

export class Arena {
  constructor(scene, radius = 32, initialTheme = 'ACADEMIA') {
    this.scene = scene;
    this.radius = radius;
    this.currentTheme = initialTheme;
    this.pillars = [];
    this.torches = [];
    this.themeMeshes = [];
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.buildTheme(this.currentTheme);
  }

  // ===========================================================================
  // 1. DYNAMIC FLOOR CANVAS TEXTURES (PER THEME)
  // ===========================================================================
  createFloorTexture(theme) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    if (theme === 'ROMAN_COLOSSEUM') {
      // 🏛️ Roman Colosseum: Golden Sand with Gladiator Arena Markings & Blood Stains
      ctx.fillStyle = '#c8a870';
      ctx.fillRect(0, 0, 1024, 1024);

      // Sand Grain noise / texture
      for (let i = 0; i < 4000; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        ctx.fillStyle = Math.random() > 0.5 ? '#b89458' : '#d4b680';
        ctx.fillRect(x, y, 3, 3);
      }

      // Outer Gladiator Ring (Travertine border)
      ctx.strokeStyle = '#8a6838';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.arc(512, 512, 440, 0, Math.PI * 2);
      ctx.stroke();

      // Inner Duelling Circle
      ctx.strokeStyle = '#a83232';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(512, 512, 280, 0, Math.PI * 2);
      ctx.stroke();

      // Imperial Gold Eagle / SPQR Laurel Wreath in Center
      ctx.strokeStyle = '#e6b800';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(512, 512, 120, 0, Math.PI * 2);
      ctx.stroke();

      // Battle blood splatters
      ctx.fillStyle = 'rgba(120, 20, 20, 0.45)';
      ctx.beginPath();
      ctx.arc(380, 420, 35, 0, Math.PI * 2);
      ctx.arc(640, 580, 45, 0, Math.PI * 2);
      ctx.arc(500, 620, 25, 0, Math.PI * 2);
      ctx.fill();

    } else if (theme === 'MAGMA_ABYSS') {
      // 🌋 Magma Abyss: Cracked Obsidian with Molten Lava Veins
      ctx.fillStyle = '#100808';
      ctx.fillRect(0, 0, 1024, 1024);

      // Molten Lava River Veins
      ctx.strokeStyle = '#ff3300';
      ctx.lineWidth = 16;
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 20;

      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(512, 512);
        ctx.lineTo(512 + Math.cos(angle) * 480, 512 + Math.sin(angle) * 480);
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ffaa00';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(512, 512, 380, 0, Math.PI * 2);
      ctx.arc(512, 512, 200, 0, Math.PI * 2);
      ctx.stroke();

      // Central Magma Core
      ctx.fillStyle = '#ff2200';
      ctx.beginPath();
      ctx.arc(512, 512, 80, 0, Math.PI * 2);
      ctx.fill();

    } else if (theme === 'FROZEN_CITADEL') {
      // ❄️ Frozen Citadel: Glacial Ice with Frost Cracks & Skull Runes
      ctx.fillStyle = '#081c2e';
      ctx.fillRect(0, 0, 1024, 1024);

      // Ice tiles
      ctx.strokeStyle = '#1a4468';
      ctx.lineWidth = 5;
      for (let x = 0; x <= 1024; x += 64) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1024); ctx.stroke();
      }
      for (let y = 0; y <= 1024; y += 64) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1024, y); ctx.stroke();
      }

      // Frost Cyan Rune Circles
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.65)';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(512, 512, 420, 0, Math.PI * 2);
      ctx.arc(512, 512, 240, 0, Math.PI * 2);
      ctx.stroke();

      // 8-Point Ice Snowflake Star
      ctx.strokeStyle = '#88f0ff';
      ctx.lineWidth = 5;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        ctx.moveTo(512, 512);
        ctx.lineTo(512 + Math.cos(a) * 160, 512 + Math.sin(a) * 160);
      }
      ctx.stroke();

    } else if (theme === 'TITAN_TEMPLE') {
      // ☀️ Titan Temple: Antique Gold-Inlaid Monolithic Slabs
      ctx.fillStyle = '#1e1c18';
      ctx.fillRect(0, 0, 1024, 1024);

      ctx.strokeStyle = '#38342a';
      ctx.lineWidth = 6;
      for (let x = 0; x <= 1024; x += 80) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1024); ctx.stroke();
      }
      for (let y = 0; y <= 1024; y += 80) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1024, y); ctx.stroke();
      }

      // Glowing Solar Titan Glyphs
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.arc(512, 512, 430, 0, Math.PI * 2);
      ctx.arc(512, 512, 280, 0, Math.PI * 2);
      ctx.arc(512, 512, 130, 0, Math.PI * 2);
      ctx.stroke();

      // Titan Sunburst Rays
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.45)';
      ctx.lineWidth = 6;
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        ctx.beginPath();
        ctx.moveTo(512 + Math.cos(a) * 130, 512 + Math.sin(a) * 130);
        ctx.lineTo(512 + Math.cos(a) * 280, 512 + Math.sin(a) * 280);
        ctx.stroke();
      }

    } else {
      // 🎓 Academia (Default PvE 1-5): Dark Slate Stone with Cyan & Purple Arcane Circles
      ctx.fillStyle = '#161922';
      ctx.fillRect(0, 0, 1024, 1024);

      ctx.strokeStyle = '#232838';
      ctx.lineWidth = 6;
      for (let x = 0; x <= 1024; x += 64) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1024); ctx.stroke();
      }
      for (let y = 0; y <= 1024; y += 64) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1024, y); ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(78, 140, 255, 0.5)';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(512, 512, 420, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(120, 80, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(512, 512, 260, 0, Math.PI * 2);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  // ===========================================================================
  // 2. BUILD THEMATIC ARENA & 3D PROPS
  // ===========================================================================
  buildTheme(theme) {
    this.currentTheme = theme;

    // 1. Themed Floor
    const floorGeo = new THREE.CylinderGeometry(this.radius, this.radius + 3, 4, 48);
    const floorMat = new THREE.MeshStandardMaterial({
      map: this.createFloorTexture(theme),
      roughness: (theme === 'FROZEN_CITADEL' ? 0.2 : (theme === 'ROMAN_COLOSSEUM' ? 0.9 : 0.75)),
      metalness: (theme === 'TITAN_TEMPLE' ? 0.4 : 0.15)
    });

    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = -2;
    floorMesh.receiveShadow = true;
    this.group.add(floorMesh);
    this.themeMeshes.push(floorMesh);

    // Invisible ground plane for raycasting
    if (!this.groundRaycastPlane) {
      const raycastPlaneGeo = new THREE.PlaneGeometry(this.radius * 3, this.radius * 3);
      const raycastPlaneMat = new THREE.MeshBasicMaterial({ visible: false });
      this.groundRaycastPlane = new THREE.Mesh(raycastPlaneGeo, raycastPlaneMat);
      this.groundRaycastPlane.rotation.x = -Math.PI / 2;
      this.group.add(this.groundRaycastPlane);
    }

    // 2. Themed Perimeter Walls & Arches
    this.createThemedWalls(theme);

    // 3. Themed 3D Pillars
    this.createThemedPillars(theme);

    // 4. Themed Torches / Braziers
    this.createThemedTorches(theme);

    // 5. Themed Atmosphere Particles
    this.createThemedBackdrop(theme);

    // 6. Apply Lighting & Fog to Scene
    this.applyThemedAtmosphere(theme);
  }

  createThemedWalls(theme) {
    const wallSegments = 24;
    const rimRadius = this.radius - 0.5;

    let wallColor = 0x2c3345;
    if (theme === 'ROMAN_COLOSSEUM') wallColor = 0xbaa282; // Travertine marble
    else if (theme === 'MAGMA_ABYSS') wallColor = 0x221111; // Basalt
    else if (theme === 'FROZEN_CITADEL') wallColor = 0x1a3348; // Glacier stone
    else if (theme === 'TITAN_TEMPLE') wallColor = 0x3d3525; // Ancient gold stone

    for (let i = 0; i < wallSegments; i++) {
      if (i % 4 === 0) continue; // Knockback ring-out gaps

      const angle = (i / wallSegments) * Math.PI * 2;
      const x = Math.sin(angle) * rimRadius;
      const z = Math.cos(angle) * rimRadius;

      const wallGeo = new THREE.BoxGeometry(4.5, 1.8, 1.2);
      const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.75 });
      const wallMesh = new THREE.Mesh(wallGeo, wallMat);
      wallMesh.position.set(x, 0.9, z);
      wallMesh.rotation.y = angle + Math.PI / 2;
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      this.group.add(wallMesh);
      this.themeMeshes.push(wallMesh);

      // Roman Banners on every other wall
      if (theme === 'ROMAN_COLOSSEUM' && i % 2 === 0) {
        const bannerGeo = new THREE.PlaneGeometry(1.6, 2.8);
        const bannerMat = new THREE.MeshStandardMaterial({ color: 0x991122, side: THREE.DoubleSide });
        const banner = new THREE.Mesh(bannerGeo, bannerMat);
        banner.position.set(x * 0.97, 1.4, z * 0.97);
        banner.rotation.y = angle + Math.PI / 2;
        this.group.add(banner);
        this.themeMeshes.push(banner);
      }
    }
  }

  createThemedPillars(theme) {
    const pillarPositions = [
      { x: -14, z: -14 },
      { x: 14, z: -14 },
      { x: -14, z: 14 },
      { x: 14, z: 14 }
    ];

    let modelPath = 'assets/models/arena_pillar.obj';
    let mtlPath = 'assets/models/arena_pillar.mtl';
    let scale = 1.5;

    if (theme === 'ROMAN_COLOSSEUM') {
      modelPath = 'assets/models/roman_pillar.obj';
      mtlPath = 'assets/models/roman_pillar.mtl';
      scale = 1.35;
    } else if (theme === 'MAGMA_ABYSS') {
      modelPath = 'assets/models/magma_pillar.obj';
      mtlPath = 'assets/models/magma_pillar.mtl';
      scale = 1.4;
    } else if (theme === 'FROZEN_CITADEL') {
      modelPath = 'assets/models/ice_pillar.obj';
      mtlPath = 'assets/models/ice_pillar.mtl';
      scale = 1.4;
    } else if (theme === 'TITAN_TEMPLE') {
      modelPath = 'assets/models/titan_pillar.obj';
      mtlPath = 'assets/models/titan_pillar.mtl';
      scale = 1.4;
    }

    pillarPositions.forEach((pos) => {
      const pillarGroup = new THREE.Group();
      pillarGroup.position.set(pos.x, 0, pos.z);
      this.group.add(pillarGroup);
      this.themeMeshes.push(pillarGroup);

      GlobalModelLoader.loadOBJWithMTL(modelPath, mtlPath).then((model) => {
        if (model) {
          model.scale.set(scale, scale, scale);
          pillarGroup.add(model);
        }
      });

      this.pillars.push({
        group: pillarGroup,
        position: new THREE.Vector3(pos.x, 0, pos.z),
        radius: 2.2,
        currentOpacity: 1.0
      });
    });
  }

  createThemedTorches(theme) {
    const torchAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];

    let lightColor = 0xff6611;
    let flameColor = 0xffaa33;
    let modelPath = null;
    let mtlPath = null;

    if (theme === 'ROMAN_COLOSSEUM') {
      lightColor = 0xff7711;
      flameColor = 0xffbb22;
      modelPath = 'assets/models/roman_brazier.obj';
      mtlPath = 'assets/models/roman_brazier.mtl';
    } else if (theme === 'MAGMA_ABYSS') {
      lightColor = 0xff2200;
      flameColor = 0xff4400;
    } else if (theme === 'FROZEN_CITADEL') {
      lightColor = 0x00e5ff;
      flameColor = 0x88f0ff;
    } else if (theme === 'TITAN_TEMPLE') {
      lightColor = 0xffd700;
      flameColor = 0xffee55;
    }

    torchAngles.forEach((angle) => {
      const x = Math.sin(angle) * (this.radius - 2.5);
      const z = Math.cos(angle) * (this.radius - 2.5);

      const torchGroup = new THREE.Group();
      torchGroup.position.set(x, 0, z);
      this.group.add(torchGroup);
      this.themeMeshes.push(torchGroup);

      if (modelPath) {
        GlobalModelLoader.loadOBJWithMTL(modelPath, mtlPath).then((m) => {
          if (m) {
            m.scale.set(1.2, 1.2, 1.2);
            torchGroup.add(m);
          }
        });
      } else {
        const standGeo = new THREE.CylinderGeometry(0.4, 0.6, 3.5, 8);
        const standMat = new THREE.MeshStandardMaterial({ color: 0x222226, metalness: 0.7 });
        const stand = new THREE.Mesh(standGeo, standMat);
        stand.position.y = 1.75;
        torchGroup.add(stand);

        const flameGeo = new THREE.DodecahedronGeometry(0.45);
        const flameMat = new THREE.MeshBasicMaterial({ color: flameColor });
        const flameMesh = new THREE.Mesh(flameGeo, flameMat);
        flameMesh.position.y = 3.7;
        torchGroup.add(flameMesh);
      }

      const light = new THREE.PointLight(lightColor, 2.2, 18);
      light.position.set(x, 4.0, z);
      this.group.add(light);
      this.themeMeshes.push(light);

      this.torches.push({ light, baseY: 4.0, phase: Math.random() * 10 });
    });
  }

  createThemedBackdrop(theme) {
    const count = 250;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const r = this.radius * (1.1 + Math.random() * 1.5);
      const theta = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.sin(theta) * r;
      positions[i * 3 + 1] = -10 + Math.random() * 40;
      positions[i * 3 + 2] = Math.cos(theta) * r;

      if (theme === 'ROMAN_COLOSSEUM') {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.8; colors[i * 3 + 2] = 0.4; // Sun dust
      } else if (theme === 'MAGMA_ABYSS') {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.25; colors[i * 3 + 2] = 0.05; // Magma embers
      } else if (theme === 'FROZEN_CITADEL') {
        colors[i * 3] = 0.5; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 1.0; // Snowflakes
      } else if (theme === 'TITAN_TEMPLE') {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.85; colors[i * 3 + 2] = 0.1; // Golden motes
      } else {
        colors[i * 3] = 0.3; colors[i * 3 + 1] = 0.6; colors[i * 3 + 2] = 1.0; // Stardust
      }
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: (theme === 'MAGMA_ABYSS' ? 0.9 : 0.65),
      vertexColors: true,
      transparent: true,
      opacity: 0.75
    });

    this.voidParticles = new THREE.Points(geo, mat);
    this.group.add(this.voidParticles);
    this.themeMeshes.push(this.voidParticles);
  }

  applyThemedAtmosphere(theme) {
    if (!this.scene) return;

    if (theme === 'ROMAN_COLOSSEUM') {
      this.scene.background = new THREE.Color(0x24160e);
      this.scene.fog = new THREE.FogExp2(0x281810, 0.012);
    } else if (theme === 'MAGMA_ABYSS') {
      this.scene.background = new THREE.Color(0x1a0604);
      this.scene.fog = new THREE.FogExp2(0x1f0804, 0.015);
    } else if (theme === 'FROZEN_CITADEL') {
      this.scene.background = new THREE.Color(0x040d18);
      this.scene.fog = new THREE.FogExp2(0x061422, 0.014);
    } else if (theme === 'TITAN_TEMPLE') {
      this.scene.background = new THREE.Color(0x161208);
      this.scene.fog = new THREE.FogExp2(0x1a1508, 0.013);
    } else {
      this.scene.background = new THREE.Color(0x0a0c14);
      this.scene.fog = new THREE.FogExp2(0x0a0c14, 0.015);
    }
  }

  // ===========================================================================
  // 3. TRANSITION & DISPOSAL (ZERO MEMORY LEAKS)
  // ===========================================================================
  setTheme(newTheme, onComplete) {
    if (this.currentTheme === newTheme && this.themeMeshes.length > 0) {
      if (onComplete) onComplete();
      return;
    }

    // 1. Dispose previous theme meshes & textures
    this.themeMeshes.forEach((mesh) => {
      this.group.remove(mesh);
      mesh.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
          else child.material.dispose();
        }
      });
    });

    this.themeMeshes = [];
    this.pillars = [];
    this.torches = [];

    // 2. Build new theme
    this.buildTheme(newTheme);

    // 3. Update physics pillars if physics engine is available
    if (window.game && window.game.physics) {
      window.game.physics.setPillars(this.pillars);
    }

    if (onComplete) onComplete();
  }

  updateCameraOcclusion(cameraPos, playerPos, dt) {
    if (!cameraPos || !playerPos) return;

    const camX = cameraPos.x;
    const camZ = cameraPos.z;
    const plX = playerPos.x;
    const plZ = playerPos.z;

    const segDx = plX - camX;
    const segDz = plZ - camZ;
    const segLenSq = segDx * segDx + segDz * segDz;

    this.pillars.forEach((p) => {
      let isOccluding = false;

      if (segLenSq > 0.01) {
        const t = Math.max(0, Math.min(1, ((p.position.x - camX) * segDx + (p.position.z - camZ) * segDz) / segLenSq));
        const projX = camX + t * segDx;
        const projZ = camZ + t * segDz;
        const distSq = (p.position.x - projX) ** 2 + (p.position.z - projZ) ** 2;

        if (distSq < 3.5 * 3.5 && t > 0.05 && t < 0.95) {
          isOccluding = true;
        }
      }

      const camDistSq = (p.position.x - camX) ** 2 + (p.position.z - camZ) ** 2;
      if (camDistSq < 4.8 * 4.8) {
        isOccluding = true;
      }

      const targetOpacity = isOccluding ? 0.22 : 1.0;
      p.currentOpacity = p.currentOpacity + (targetOpacity - p.currentOpacity) * Math.min(1.0, dt * 9.0);

      if (p.group) {
        p.group.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.transparent = true;
            child.material.opacity = p.currentOpacity;
            child.material.depthWrite = (p.currentOpacity > 0.7);
          }
        });
      }
    });
  }

  update(dt, time) {
    this.torches.forEach((torch) => {
      const flicker = Math.sin(time * 8 + torch.phase) * 0.35 + Math.cos(time * 12) * 0.2;
      torch.light.intensity = 2.0 + flicker;
    });

    if (this.voidParticles) {
      this.voidParticles.rotation.y += dt * 0.025;
      if (this.currentTheme === 'MAGMA_ABYSS') {
        const pos = this.voidParticles.geometry.attributes.position.array;
        for (let i = 1; i < pos.length; i += 3) {
          pos[i] += dt * 3.0;
          if (pos[i] > 30) pos[i] = -10;
        }
        this.voidParticles.geometry.attributes.position.needsUpdate = true;
      }
    }
  }
}
