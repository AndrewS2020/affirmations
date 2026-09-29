import * as THREE from 'three';
import { TerrainHeightProvider } from './terrain';

export class VegetationSystem {
  public group: THREE.Group;

  constructor(scene: THREE.Scene, terrain: TerrainHeightProvider) {
    this.group = new THREE.Group();
    scene.add(this.group);

    this.createInstancedSucculents(terrain);
    this.createInstancedDryGrass(terrain);
  }

  // 1. Alien Desert Succulents (low-poly rosettes nestled in rock crevices)
  private createInstancedSucculents(terrain: TerrainHeightProvider): void {
    const count = 350;
    const coneGeo = new THREE.ConeGeometry(3.5, 7.0, 5);
    coneGeo.rotateX(0.2);

    const succulentMat = new THREE.MeshStandardMaterial({
      color: 0x4a5d4d, // Muted sage/olive
      roughness: 0.85,
      metalness: 0.05,
      flatShading: true
    });

    const instancedSucculents = new THREE.InstancedMesh(coneGeo, succulentMat, count);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      // Clustered heavily around foreground overlook and canyon rocky edges
      const radius = 60 + Math.random() * 850;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = terrain.getHeightAt(x, z);

      dummy.position.set(x, y + 1.0, z);
      const s = 0.5 + Math.random() * 0.9;
      dummy.scale.set(s, s * 0.9, s);
      dummy.rotation.set((Math.random() - 0.5) * 0.3, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.3);
      dummy.updateMatrix();

      instancedSucculents.setMatrixAt(i, dummy.matrix);
    }

    instancedSucculents.instanceMatrix.needsUpdate = true;
    this.group.add(instancedSucculents);
  }

  // 2. Dry Grass Clusters
  private createInstancedDryGrass(terrain: TerrainHeightProvider): void {
    const count = 500;
    const grassGeo = new THREE.CylinderGeometry(0.2, 1.8, 5.5, 4);
    grassGeo.translate(0, 2.75, 0);

    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x6e6047, // Dry ochre straw
      roughness: 0.95,
      metalness: 0.0,
      flatShading: true
    });

    const instancedGrass = new THREE.InstancedMesh(grassGeo, grassMat, count);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const radius = 40 + Math.random() * 1200;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = terrain.getHeightAt(x, z);

      dummy.position.set(x, y, z);
      const s = 0.6 + Math.random() * 1.2;
      dummy.scale.set(s, s * 1.4, s);
      dummy.rotation.set((Math.random() - 0.5) * 0.25, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.25);
      dummy.updateMatrix();

      instancedGrass.setMatrixAt(i, dummy.matrix);
    }

    instancedGrass.instanceMatrix.needsUpdate = true;
    this.group.add(instancedGrass);
  }
}
