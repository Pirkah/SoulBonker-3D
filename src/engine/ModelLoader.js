import * as THREE from '../../libs/three.module.js';

/**
 * Fast, offline 3D Model Loader for Blender-exported OBJ assets
 */
export class ModelLoader {
  constructor() {
    this.cache = new Map();
  }

  async loadOBJ(url, defaultMaterial = null) {
    if (this.cache.has(url)) {
      return this.cache.get(url).clone();
    }

    try {
      const response = await fetch(url);
      const text = await response.text();
      const group = this.parseOBJ(text, defaultMaterial);
      this.cache.set(url, group);
      return group.clone();
    } catch (e) {
      console.warn(`Could not load 3D model from ${url}:`, e);
      return new THREE.Group();
    }
  }

  parseOBJ(text, defaultMaterial) {
    const lines = text.split('\n');
    const positions = [];
    const normals = [];
    const uvs = [];

    const group = new THREE.Group();

    let currentObject = null;
    let currentVertices = [];
    let currentNormals = [];
    let currentUvs = [];

    const flushMesh = () => {
      if (currentVertices.length === 0) return;

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(currentVertices, 3));
      if (currentNormals.length > 0) {
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(currentNormals, 3));
      } else {
        geometry.computeVertexNormals();
      }
      if (currentUvs.length > 0) {
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(currentUvs, 2));
      }

      const mat = defaultMaterial || new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        roughness: 0.5,
        metalness: 0.2
      });

      const mesh = new THREE.Mesh(geometry, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (currentObject) mesh.name = currentObject;
      group.add(mesh);

      currentVertices = [];
      currentNormals = [];
      currentUvs = [];
    };

    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('#')) continue;

      const parts = line.split(/\s+/);
      const type = parts[0];

      if (type === 'o' || type === 'g') {
        flushMesh();
        currentObject = parts[1] || 'Mesh';
      } else if (type === 'v') {
        positions.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
      } else if (type === 'vn') {
        normals.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
      } else if (type === 'vt') {
        uvs.push([parseFloat(parts[1]), parseFloat(parts[2])]);
      } else if (type === 'f') {
        // Handle triangles and quads
        const faceVertices = [];
        for (let i = 1; i < parts.length; i++) {
          const vertParts = parts[i].split('/');
          const vIdx = parseInt(vertParts[0], 10) - 1;
          const vtIdx = vertParts[1] ? parseInt(vertParts[1], 10) - 1 : -1;
          const vnIdx = vertParts[2] ? parseInt(vertParts[2], 10) - 1 : -1;

          faceVertices.push({
            pos: positions[vIdx],
            uv: vtIdx >= 0 ? uvs[vtIdx] : [0, 0],
            norm: vnIdx >= 0 ? normals[vnIdx] : [0, 1, 0]
          });
        }

        // Fan triangulation for quads / n-gons
        for (let i = 1; i < faceVertices.length - 1; i++) {
          const tri = [faceVertices[0], faceVertices[i], faceVertices[i + 1]];
          for (const v of tri) {
            if (v.pos) currentVertices.push(...v.pos);
            if (v.norm) currentNormals.push(...v.norm);
            if (v.uv) currentUvs.push(...v.uv);
          }
        }
      }
    }

    flushMesh();
    return group;
  }
}

export const GlobalModelLoader = new ModelLoader();
