import * as THREE from 'three';
import cloudsVert from './shaders/clouds.vert?raw';
import cloudsFrag from './shaders/clouds.frag?raw';

export class CloudSystem {
  public group: THREE.Group;
  private material: THREE.ShaderMaterial;
  private domeMesh: THREE.Mesh;

  constructor(scene: THREE.Scene, sunDirection: THREE.Vector3) {
    this.group = new THREE.Group();
    scene.add(this.group);

    this.material = new THREE.ShaderMaterial({
      vertexShader: cloudsVert,
      fragmentShader: cloudsFrag,
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uSunDirection: { value: sunDirection },
        uSunColor: { value: new THREE.Color(0xffdeb6) },
        uSkyTopColor: { value: new THREE.Color(0x232c37) },      // Heavy storm overcast slate
        uSkyHorizonColor: { value: new THREE.Color(0xd49b73) },  // Warm peach/amber sunset break
        uTime: { value: 0 }
      }
    });

    // Massive skydome over 20km terrain
    const domeGeo = new THREE.SphereGeometry(14000, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.62);
    this.domeMesh = new THREE.Mesh(domeGeo, this.material);
    this.group.add(this.domeMesh);
  }

  public update(time: number): void {
    this.material.uniforms.uTime.value = time;
  }
}
