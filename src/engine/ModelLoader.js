import * as THREE from '../../libs/three.module.js';

/**
 * Fast, offline 3D Model Loader for Blender-exported OBJ & MTL assets
 */
export class ModelLoader {
  constructor() {
    this.cache = new Map();
  }

  async loadOBJWithMTL(objUrl, mtlUrl = null) {
    if (this.cache.has(objUrl)) {
      return this.cache.get(objUrl).clone();
    }

    try {
      let materials = {};
      if (mtlUrl) {
        try {
          const mtlRes = await fetch(mtlUrl);
          const mtlText = await mtlRes.text();
          materials = this.parseMTL(mtlText);
        } catch (e) {
          console.warn('MTL load skipped:', e);
        }
      }

      const response = await fetch(objUrl);
      const text = await response.text();
      const group = this.parseOBJ(text, materials);
      this.cache.set(objUrl, group);
      return group.clone();
    } catch (e) {
      console.warn(`Could not load 3D model from ${objUrl}:`, e);
      return new THREE.Group();
    }
  }

  parseMTL(text) {
    const materials = {};
    let currentMat = null;
    const lines = text.split('\n');

    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('#')) continue;
      const parts = line.split(/\s+/);
      const type = parts[0];

      if (type === 'newmtl') {
        currentMat = parts[1];
        materials[currentMat] = {
          color: 0xcccccc,
          roughness: 0.6,
          metalness: 0.1,
          emissive: 0x000000
        };
      } else if (currentMat) {
        if (type === 'Kd') {
          const r = parseFloat(parts[1]);
          const g = parseFloat(parts[2]);
          const b = parseFloat(parts[3]);
          materials[currentMat].color = new THREE.Color(r, g, b);
        } else if (type === 'Ke') {
          const r = parseFloat(parts[1]);
          const g = parseFloat(parts[2]);
          const b = parseFloat(parts[3]);
          if (r > 0.05 || g > 0.05 || b > 0.05) {
            materials[currentMat].emissive = new THREE.Color(r, g, b);
          }
        } else if (type === 'Ks') {
          const r = parseFloat(parts[1]);
          materials[currentMat].metalness = Math.min(1.0, r * 0.9);
        } else if (type === 'Ns') {
          const ns = parseFloat(parts[1]);
          materials[currentMat].roughness = Math.max(0.1, 1.0 - ns / 700.0);
        }
      }
    }
    return materials;
  }

  parseOBJ(text, materialsMap = {}) {
    const lines = text.split('\n');
    const positions = [];
    const normals = [];
    const uvs = [];

    const group = new THREE.Group();

    let currentMtlName = null;
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

      // Material Lookup from MTL
      let matConfig = materialsMap[currentMtlName] || { color: 0xcccccc, roughness: 0.5, metalness: 0.2 };
      const mat = new THREE.MeshStandardMaterial({
        color: matConfig.color || 0xcccccc,
        roughness: matConfig.roughness !== undefined ? matConfig.roughness : 0.5,
        metalness: matConfig.metalness !== undefined ? matConfig.metalness : 0.2,
        emissive: matConfig.emissive || 0x000000
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

      if (type === 'usemtl') {
        flushMesh();
        currentMtlName = parts[1];
      } else if (type === 'o' || type === 'g') {
        flushMesh();
        currentObject = parts[1] || 'Mesh';
      } else if (type === 'v') {
        positions.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
      } else if (type === 'vn') {
        normals.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
      } else if (type === 'vt') {
        uvs.push([parseFloat(parts[1]), parseFloat(parts[2])]);
      } else if (type === 'f') {
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

        // Triangulate
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
