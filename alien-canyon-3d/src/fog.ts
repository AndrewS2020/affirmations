import * as THREE from 'three';
import fogVert from './shaders/fog.vert?raw';
import fogFrag from './shaders/fog.frag?raw';

export class FogSystem {
  public group: THREE.Group;
  private material: THREE.ShaderMaterial;
  private fogBoxMesh: THREE.Mesh;

  constructor(scene: THREE.Scene, sunDirection: THREE.Vector3) {
    this.group = new THREE.Group();
    scene.add(this.group);

    this.material = new THREE.ShaderMaterial({
      vertexShader: fogVert,
      fragmentShader: fogFrag,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
      uniforms: {
        uFogColor: { value: new THREE.Color(0xa69382) }, // Warm valley dust mist
        uSunDirection: { value: sunDirection },
        uSunColor: { value: new THREE.Color(0xffd5ad) },
        uTime: { value: 0 },
        uFogBaseHeight: { value: -700.0 }, // Deep valley bed
        uFogFalloff: { value: 0.0028 },    // Rate of dissipation upwards
        uFogDensity: { value: 0.85 }
      }
    });

    // Volumetric fog slab encompassing 20km x 20km valley
    const fogGeo = new THREE.BoxGeometry(20000, 1600, 20000);
    this.fogBoxMesh = new THREE.Mesh(fogGeo, this.material);
    this.fogBoxMesh.position.set(0, 100, 0);
    this.group.add(this.fogBoxMesh);

    // Additional low-lying dense fog layer in the immediate canyon
    const lowFogGeo = new THREE.PlaneGeometry(6000, 6000);
    lowFogGeo.rotateX(-Math.PI / 2);
    const lowFogMesh = new THREE.Mesh(lowFogGeo, this.material);
    lowFogMesh.position.set(0, -350, -1000);
    this.group.add(lowFogMesh);
  }

  public update(time: number): void {
    this.material.uniforms.uTime.value = time;
  }
}
