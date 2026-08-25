import * as THREE from '../../libs/three.module.js';
import { GlobalModelLoader } from '../engine/ModelLoader.js';

export class Arena {
  constructor(scene, radius = 32) {
    this.scene = scene;
    this.radius = radius;
    this.pillars = [];
    this.torches = [];
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.createFloor();
    this.createPerimeterWalls();
    this.createPillars();
    this.createTorches();
    this.createVoidBackdrop();
  }

  createFloorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Dark slate stone base
    ctx.fillStyle = '#161922';
    ctx.fillRect(0, 0, 1024, 1024);

    // Stone slab tile grid
    ctx.strokeStyle = '#232838';
    ctx.lineWidth = 6;
    const tileSize = 64;
    for (let x = 0; x <= 1024; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1024);
      ctx.stroke();
    }
    for (let y = 0; y <= 1024; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    // Rune Circles
    ctx.strokeStyle = 'rgba(78, 140, 255, 0.45)';
    ctx.lineWidth = 8;
    
    // Outer rune ring
    ctx.beginPath();
    ctx.arc(512, 512, 420, 0, Math.PI * 2);
    ctx.stroke();

    // Middle rune ring
    ctx.strokeStyle = 'rgba(120, 80, 255, 0.35)';
    ctx.beginPath();
    ctx.arc(512, 512, 260, 0, Math.PI * 2);
    ctx.stroke();

    // Center rune star
    ctx.strokeStyle = 'rgba(100, 220, 255, 0.5)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const x = 512 + Math.cos(angle) * 160;
      const y = 512 + Math.sin(angle) * 160;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  createFloor() {
    const floorGeo = new THREE.CylinderGeometry(this.radius, this.radius + 3, 4, 48);
    const floorMat = new THREE.MeshStandardMaterial({
      map: this.createFloorTexture(),
      roughness: 0.75,
      metalness: 0.2
    });

    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = -2;
    floorMesh.receiveShadow = true;
    this.group.add(floorMesh);

    // Invisible ground plane for mouse raycasting
    const raycastPlaneGeo = new THREE.PlaneGeometry(this.radius * 3, this.radius * 3);
    const raycastPlaneMat = new THREE.MeshBasicMaterial({ visible: false });
    this.groundRaycastPlane = new THREE.Mesh(raycastPlaneGeo, raycastPlaneMat);
    this.groundRaycastPlane.rotation.x = -Math.PI / 2;
    this.groundRaycastPlane.position.y = 0;
    this.group.add(this.groundRaycastPlane);
  }

  createPerimeterWalls() {
    const wallSegments = 24;
    const rimRadius = this.radius - 0.5;

    for (let i = 0; i < wallSegments; i++) {
      // Leave gaps for knockback ring-outs!
      if (i % 4 === 0) continue;

      const angle = (i / wallSegments) * Math.PI * 2;
      const x = Math.sin(angle) * rimRadius;
      const z = Math.cos(angle) * rimRadius;

      const wallGeo = new THREE.BoxGeometry(4.5, 1.8, 1.2);
      const wallMat = new THREE.MeshStandardMaterial({
        color: 0x2c3345,
        roughness: 0.8
      });
      const wallMesh = new THREE.Mesh(wallGeo, wallMat);
      wallMesh.position.set(x, 0.9, z);
      wallMesh.rotation.y = angle + Math.PI / 2;
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      this.group.add(wallMesh);
    }
  }

  createPillars() {
    const pillarPositions = [
      { x: -14, z: -14 },
      { x: 14, z: -14 },
      { x: -14, z: 14 },
      { x: 14, z: 14 }
    ];

    pillarPositions.forEach((pos) => {
      const pillarGroup = new THREE.Group();
      pillarGroup.position.set(pos.x, 0, pos.z);
      this.group.add(pillarGroup);

      // Load Master Blender 3D Pillar Model
      GlobalModelLoader.loadOBJWithMTL('assets/models/arena_pillar.obj', 'assets/models/arena_pillar.mtl').then((model) => {
        if (model) {
          model.scale.set(1.5, 1.5, 1.5);
          pillarGroup.add(model);
        }
      });

      // Store physics collision data
      this.pillars.push({
        position: new THREE.Vector3(pos.x, 0, pos.z),
        radius: 2.2
      });
    });
  }

  createTorches() {
    const torchAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
    torchAngles.forEach((angle) => {
      const x = Math.sin(angle) * (this.radius - 2.5);
      const z = Math.cos(angle) * (this.radius - 2.5);

      const standGeo = new THREE.CylinderGeometry(0.4, 0.6, 3.5, 8);
      const standMat = new THREE.MeshStandardMaterial({ color: 0x222226, metalness: 0.7 });
      const stand = new THREE.Mesh(standGeo, standMat);
      stand.position.set(x, 1.75, z);
      this.group.add(stand);

      // Torch Flame Light (Soft point light)
      const light = new THREE.PointLight(0xff6611, 2.0, 16);
      light.position.set(x, 4.0, z);
      this.group.add(light);

      // Glowing flame mesh
      const flameGeo = new THREE.DodecahedronGeometry(0.45);
      const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa33 });
      const flameMesh = new THREE.Mesh(flameGeo, flameMat);
      flameMesh.position.set(x, 3.7, z);
      this.group.add(flameMesh);

      this.torches.push({ light, flameMesh, baseY: 3.7, phase: Math.random() * 10 });
    });
  }

  createVoidBackdrop() {
    // Floating cosmic stardust particles
    const particleCount = 200;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const r = this.radius * (1.1 + Math.random() * 1.5);
      const theta = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.sin(theta) * r;
      positions[i * 3 + 1] = -15 + Math.random() * 40;
      positions[i * 3 + 2] = Math.cos(theta) * r;

      // Mystic Cyan & Purple stardust
      if (Math.random() > 0.5) {
        colors[i * 3] = 0.2; colors[i * 3 + 1] = 0.8; colors[i * 3 + 2] = 1.0;
      } else {
        colors[i * 3] = 0.7; colors[i * 3 + 1] = 0.2; colors[i * 3 + 2] = 0.9;
      }
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.6
    });

    this.voidParticles = new THREE.Points(geo, mat);
    this.group.add(this.voidParticles);
  }

  update(dt, time) {
    // Torch flame flickering
    this.torches.forEach((torch) => {
      const flicker = Math.sin(time * 8 + torch.phase) * 0.3 + Math.cos(time * 12) * 0.2;
      torch.light.intensity = 1.8 + flicker;
      torch.flameMesh.position.y = torch.baseY + flicker * 0.08;
    });

    // Rotate cosmic background slowly
    if (this.voidParticles) {
      this.voidParticles.rotation.y += dt * 0.02;
    }
  }
}
