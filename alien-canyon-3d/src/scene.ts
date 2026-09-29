import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public controls: OrbitControls;
  public composer: EffectComposer;
  public sunDirection: THREE.Vector3;
  private dustPoints: THREE.Points;

  constructor(canvas: HTMLCanvasElement) {
    // 1. Scene & Atmosphere
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xa69382, 0.00035);

    // 2. Camera: Positioned on the high rocky overlook looking down into the canyon
    this.camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 1.0, 35000);
    this.camera.position.set(0, 160, 260);

    // 3. WebGL Renderer with ACES Tone Mapping
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. OrbitControls with smooth damping
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, -50, -600);
    this.controls.maxDistance = 6000;
    this.controls.minDistance = 20;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.05;

    // 5. Lighting: Low sunset sun behind clouds + cool sky ambient
    this.sunDirection = new THREE.Vector3(-0.55, 0.35, -0.75).normalize();

    const sunLight = new THREE.DirectionalLight(0xffdeb6, 2.8);
    sunLight.position.set(
      this.sunDirection.x * 5000,
      this.sunDirection.y * 5000,
      this.sunDirection.z * 5000
    );
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 100;
    sunLight.shadow.camera.far = 12000;
    const shadowD = 2500;
    sunLight.shadow.camera.left = -shadowD;
    sunLight.shadow.camera.right = shadowD;
    sunLight.shadow.camera.top = shadowD;
    sunLight.shadow.camera.bottom = -shadowD;
    this.scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0x4a5d70, 0x544131, 1.4);
    this.scene.add(hemiLight);

    // 6. Lone Wanderer Silhouette atop the cliff
    this.createWandererSilhouette();

    // 7. Ambient floating golden dust motes in the foreground
    this.dustPoints = this.createFloatingDust();
    this.scene.add(this.dustPoints);

    // 8. Post-Processing Effect Composer
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.35, // strength
      0.65, // radius
      0.82  // threshold
    );
    this.composer.addPass(bloomPass);

    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);

    // 9. Resize Listener
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private createWandererSilhouette(): void {
    const wandererGroup = new THREE.Group();
    wandererGroup.position.set(0, 122, 60);

    const mat = new THREE.MeshBasicMaterial({ color: 0x14110f });

    // Cloak & torso
    const cloakGeo = new THREE.ConeGeometry(3.5, 12, 6);
    cloakGeo.translate(0, 6, 0);
    const cloak = new THREE.Mesh(cloakGeo, mat);
    wandererGroup.add(cloak);

    // Hood / cowl
    const headGeo = new THREE.SphereGeometry(1.9, 6, 6);
    headGeo.translate(0, 13.2, 0.4);
    const head = new THREE.Mesh(headGeo, mat);
    wandererGroup.add(head);

    this.scene.add(wandererGroup);
  }

  private createFloatingDust(): THREE.Points {
    const count = 300;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 400;
      positions[i * 3 + 1] = 100 + Math.random() * 150;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 400;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xfde047,
      size: 2.2,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });

    return new THREE.Points(geo, mat);
  }

  private onWindowResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
  }

  public update(time: number): void {
    this.controls.update();

    // Animate foreground dust motes
    const pos = this.dustPoints.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < pos.length / 3; i++) {
      pos[i * 3 + 1] += 0.08;
      pos[i * 3] += Math.sin(time * 0.8 + i) * 0.06;
      if (pos[i * 3 + 1] > 250) {
        pos[i * 3 + 1] = 100;
      }
    }
    this.dustPoints.geometry.attributes.position.needsUpdate = true;
  }

  public render(): void {
    this.composer.render();
  }
}
