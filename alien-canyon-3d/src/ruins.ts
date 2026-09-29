import * as THREE from 'three';
import { TerrainHeightProvider } from './terrain';

export class RuinsSystem {
  public group: THREE.Group;

  constructor(scene: THREE.Scene, terrain: TerrainHeightProvider) {
    this.group = new THREE.Group();
    scene.add(this.group);

    this.createGothicCathedralSpires(terrain);
    this.createInstancedRuinedTowers(terrain);
    this.createInstancedStoneArches(terrain);
  }

  // 1. Iconic Gothic Natural Rock Spire Cluster (from right side of reference)
  private createGothicCathedralSpires(terrain: TerrainHeightProvider): void {
    const spireMat = new THREE.MeshStandardMaterial({
      color: 0x5a483a,
      roughness: 0.90,
      metalness: 0.05,
      flatShading: true
    });

    const rootX = 680;
    const rootZ = -1200;
    const baseY = terrain.getHeightAt(rootX, rootZ);

    const pillars = [
      { dx: 0, dz: 0, rBase: 45, rTop: 8, h: 420 },
      { dx: 38, dz: 24, rBase: 32, rTop: 5, h: 360 },
      { dx: -32, dz: 18, rBase: 36, rTop: 6, h: 320 },
      { dx: 22, dz: -35, rBase: 26, rTop: 4, h: 280 },
      { dx: -28, dz: -22, rBase: 24, rTop: 3, h: 240 },
      { dx: 52, dz: -12, rBase: 20, rTop: 2, h: 190 }
    ];

    pillars.forEach(p => {
      const geo = new THREE.CylinderGeometry(p.rTop, p.rBase, p.h, 7, 8);
      geo.translate(0, p.h / 2, 0);

      // Procedural rock weathering notches
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const vy = pos.getY(i);
        const notch = Math.sin(vy * 0.08) * 4.0;
        pos.setX(i, pos.getX(i) + notch);
        pos.setZ(i, pos.getZ(i) + notch);
      }
      geo.computeVertexNormals();

      const mesh = new THREE.Mesh(geo, spireMat);
      mesh.position.set(rootX + p.dx, baseY - 20, rootZ + p.dz);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);
    });
  }

  // 2. Instanced Ancient Ruined Towers
  private createInstancedRuinedTowers(terrain: TerrainHeightProvider): void {
    const count = 120;
    const towerGeo = new THREE.CylinderGeometry(14, 20, 95, 8, 4);
    towerGeo.translate(0, 47.5, 0);

    const ruinMat = new THREE.MeshStandardMaterial({
      color: 0x4f4135,
      roughness: 0.92,
      metalness: 0.04,
      flatShading: true
    });

    const instancedTowers = new THREE.InstancedMesh(towerGeo, ruinMat, count);
    instancedTowers.castShadow = true;
    instancedTowers.receiveShadow = true;

    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      // Scatter along canyon ridges and high plateaus
      const angle = (i / count) * Math.PI * 2;
      const radius = 800 + Math.random() * 4500;
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 400;
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 400;
      const y = terrain.getHeightAt(x, z);

      dummy.position.set(x, y - 8, z);
      const scaleY = 0.6 + Math.random() * 1.8;
      const scaleXZ = 0.8 + Math.random() * 0.9;
      dummy.scale.set(scaleXZ, scaleY, scaleXZ);
      dummy.rotation.set((Math.random() - 0.5) * 0.12, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.12);
      dummy.updateMatrix();

      instancedTowers.setMatrixAt(i, dummy.matrix);
    }

    instancedTowers.instanceMatrix.needsUpdate = true;
    this.group.add(instancedTowers);
  }

  // 3. Instanced Ancient Stone Arches & Temple Remains
  private createInstancedStoneArches(terrain: TerrainHeightProvider): void {
    const count = 45;
    const archGroupGeo = new THREE.TorusGeometry(35, 8, 5, 8, Math.PI);
    archGroupGeo.translate(0, 0, 0);

    const archMat = new THREE.MeshStandardMaterial({
      color: 0x44372c,
      roughness: 0.95,
      metalness: 0.05,
      flatShading: true
    });

    const instancedArches = new THREE.InstancedMesh(archGroupGeo, archMat, count);
    instancedArches.castShadow = true;
    instancedArches.receiveShadow = true;

    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const radius = 950 + Math.random() * 3200;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = terrain.getHeightAt(x, z);

      dummy.position.set(x, y - 4, z);
      const s = 0.7 + Math.random() * 1.1;
      dummy.scale.set(s, s * 1.3, s);
      dummy.rotation.set(0, Math.random() * Math.PI, 0);
      dummy.updateMatrix();

      instancedArches.setMatrixAt(i, dummy.matrix);
    }

    instancedArches.instanceMatrix.needsUpdate = true;
    this.group.add(instancedArches);
  }
}
