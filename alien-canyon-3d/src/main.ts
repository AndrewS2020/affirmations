import * as THREE from 'three';
import { SceneManager } from './scene';
import { TerrainSystem } from './terrain';
import { RuinsSystem } from './ruins';
import { VegetationSystem } from './vegetation';
import { FogSystem } from './fog';
import { CloudSystem } from './clouds';

class Application {
  private sceneManager: SceneManager;
  private terrain: TerrainSystem;
  private ruins: RuinsSystem;
  private vegetation: VegetationSystem;
  private fog: FogSystem;
  private clouds: CloudSystem;
  private clock: THREE.Clock;

  constructor() {
    const canvas = document.getElementById('webgl-canvas') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('Canvas element #webgl-canvas not found.');
    }

    this.clock = new THREE.Clock();

    // 1. Initialize Scene, Lights, Camera & Post-Processing
    this.sceneManager = new SceneManager(canvas);

    // 2. Initialize 20km Procedural LOD Terrain
    this.terrain = new TerrainSystem(this.sceneManager.scene, this.sceneManager.sunDirection);

    // 3. Initialize Instanced Ancient Ruins & Gothic Spires
    this.ruins = new RuinsSystem(this.sceneManager.scene, this.terrain);

    // 4. Initialize Sparse Desert Vegetation
    this.vegetation = new VegetationSystem(this.sceneManager.scene, this.terrain);

    // 5. Initialize Volumetric Valley Fog System
    this.fog = new FogSystem(this.sceneManager.scene, this.sceneManager.sunDirection);

    // 6. Initialize Animated Storm Clouds Dome
    this.clouds = new CloudSystem(this.sceneManager.scene, this.sceneManager.sunDirection);

    // 7. Start 60 FPS Render Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  private animate(): void {
    requestAnimationFrame(this.animate);

    const elapsedTime = this.clock.getElapsedTime();

    // Update dynamic atmospheric systems
    this.terrain.update(elapsedTime);
    this.fog.update(elapsedTime);
    this.clouds.update(elapsedTime);
    this.sceneManager.update(elapsedTime);

    // Render through EffectComposer with Bloom & Tone Mapping
    this.sceneManager.render();
  }
}

// Bootstrap application on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  new Application();
});
