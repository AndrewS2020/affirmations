import * as THREE from 'three';
import terrainVert from './shaders/terrain.vert?raw';
import terrainFrag from './shaders/terrain.frag?raw';

export interface TerrainHeightProvider {
  getHeightAt(x: number, z: number): number;
}

export class TerrainSystem implements TerrainHeightProvider {
  public group: THREE.Group;
  private material: THREE.ShaderMaterial;
  private meshes: THREE.Mesh[] = [];

  constructor(scene: THREE.Scene, sunDirection: THREE.Vector3) {
    this.group = new THREE.Group();
    scene.add(this.group);

    this.material = new THREE.ShaderMaterial({
      vertexShader: terrainVert,
      fragmentShader: terrainFrag,
      uniforms: {
        uSunDirection: { value: sunDirection },
        uSunColor: { value: new THREE.Color(0xffdeb6) },
        uAmbientColor: { value: new THREE.Color(0x404e5d) },
        uFogColor: { value: new THREE.Color(0xa69382) },
        uFogDensity: { value: 0.00035 },
        uTime: { value: 0 }
      },
      wireframe: false
    });

    this.generateLODTerrain();
  }

  // Multi-frequency procedural height formula (20km scale)
  public getHeightAt(x: number, z: number): number {
    // S-curve canyon valley path in the center
    const canyonWander = Math.sin(z * 0.0008) * 1200.0;
    const distToCanyon = Math.abs(x - canyonWander);

    // 1. Base continental relief & mountain ridges
    const baseFreq = 0.00015;
    const n1 = Math.sin(x * baseFreq + z * baseFreq * 0.7) * Math.cos(z * baseFreq * 0.9 - x * baseFreq * 0.4);
    const n2 = Math.sin(x * baseFreq * 2.3 - z * baseFreq * 1.8) * 0.5;
    const baseMountain = (n1 + n2) * 1200.0;

    // 2. Canyon depression (deep carved canyon in center)
    const canyonTrough = -Math.exp(-Math.pow(distToCanyon / 900.0, 2)) * 650.0;

    // 3. Stepped mesa terraces
    const terraceNoise = (Math.sin(x * 0.001) + Math.cos(z * 0.001)) * 0.5 + 0.5;
    const steppedTerraces = (Math.floor(terraceNoise * 6.0) / 6.0) * 350.0;

    // 4. Distant sharp fantasy mountain spires (peaks rising at edges of 20km)
    const distFromOrigin = Math.sqrt(x * x + z * z);
    const distantNeedles = distFromOrigin > 3500.0 
      ? Math.pow(Math.max(0.0, Math.sin(x * 0.002) * Math.cos(z * 0.002)), 2.5) * 1400.0 
      : 0.0;

    // 5. Rocky foreground promontory near camera origin (x: 0, z: -100 to 100)
    let foregroundOverlook = 0;
    if (Math.abs(x) < 300 && Math.abs(z) < 300) {
      foregroundOverlook = Math.exp(-Math.pow(x / 140.0, 2) - Math.pow(z / 140.0, 2)) * 120.0;
    }

    return baseMountain + canyonTrough + steppedTerraces + distantNeedles + foregroundOverlook;
  }

  private generateLODTerrain(): void {
    // 3 Concentric LOD zones for seamless 20km x 20km exploration:
    // Zone 1: High-detail inner zone (2km x 2km, high vertex density)
    // Zone 2: Mid-detail canyon zone (8km x 8km)
    // Zone 3: Low-detail distant mountain horizons (20km x 20km)
    const lodConfigs = [
      { size: 2400, segments: 180, ring: 0 },
      { size: 8000, segments: 120, ring: 1 },
      { size: 20000, segments: 90, ring: 2 }
    ];

    lodConfigs.forEach(cfg => {
      const geo = new THREE.PlaneGeometry(cfg.size, cfg.size, cfg.segments, cfg.segments);
      geo.rotateX(-Math.PI / 2);

      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);

        // Don't render interior of outer rings to avoid overlapping duplicate geometry
        if (cfg.ring === 1 && Math.abs(x) < 1100 && Math.abs(z) < 1100) {
          pos.setY(i, -9999);
          continue;
        }
        if (cfg.ring === 2 && Math.abs(x) < 3900 && Math.abs(z) < 3900) {
          pos.setY(i, -9999);
          continue;
        }

        const y = this.getHeightAt(x, z);
        pos.setY(i, y);
      }

      geo.computeVertexNormals();

      const mesh = new THREE.Mesh(geo, this.material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);
      this.meshes.push(mesh);
    });
  }

  public update(time: number): void {
    this.material.uniforms.uTime.value = time;
  }
}
