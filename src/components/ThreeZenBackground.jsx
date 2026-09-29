import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Create a glowing spiritual particle aura texture
function createParticleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.9)');
  gradient.addColorStop(0.55, 'rgba(255, 255, 255, 0.35)');
  gradient.addColorStop(0.85, 'rgba(255, 255, 255, 0.08)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Procedural mist cloud texture for canyon atmospheric fog
function createMistTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(235, 220, 205, 0.44)');
  gradient.addColorStop(0.35, 'rgba(215, 200, 190, 0.22)');
  gradient.addColorStop(0.7, 'rgba(180, 170, 165, 0.08)');
  gradient.addColorStop(1, 'rgba(160, 155, 150, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Fast procedural fractal noise for terrain, mountains, and canyon erosion
function fbm2D(x, y, octaves = 4) {
  let val = 0;
  let freq = 1.0;
  let amp = 1.0;
  let max = 0;
  for (let i = 0; i < octaves; i++) {
    val += (Math.sin(x * freq * 1.1 + y * freq * 0.45) * Math.cos(y * freq * 1.35 - x * freq * 0.35) * 0.5 + 0.5) * amp;
    max += amp;
    freq *= 2.08;
    amp *= 0.49;
  }
  return val / max;
}

export default function ThreeZenBackground({ 
  theme, 
  isDarkMode = true, 
  pulseTrigger = 0, 
  swipeTrigger = 0,
  affirmationId,
  visualMode = 'clump' // 'clump' | 'jellyfish' | 'lotus' | 'landscape'
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const coreLightRef = useRef(null);
  const pulseRef = useRef(0);
  const swipeAnimRef = useRef(0);

  // Dynamic fluid morphing parameters for the amorphous clump
  const currentMorph = useRef({
    fTheta: 3.0,
    fPhi: 2.0,
    stretchX: 1.0,
    stretchY: 1.0,
    stretchZ: 0.88,
    turbAmp: 0.22,
    coreComp: 1.0
  });

  const targetMorph = useRef({
    fTheta: 3.0,
    fPhi: 2.0,
    stretchX: 1.0,
    stretchY: 1.0,
    stretchZ: 0.88,
    turbAmp: 0.22,
    coreComp: 1.0
  });

  // Mouse / Touch interaction coords
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  // When affirmation changes or on swipe, generate a unique new amorphous shape for clump mode
  useEffect(() => {
    const seed = affirmationId 
      ? affirmationId.split('').reduce((acc, c, idx) => acc + c.charCodeAt(0) * (idx + 1), 0) + (swipeTrigger * 13)
      : (swipeTrigger * 17) + Math.random() * 50;

    const pseudoRand = (offset) => {
      const x = Math.sin(seed * 9.8 + offset * 13.7) * 10000;
      return x - Math.floor(x);
    };

    targetMorph.current = {
      fTheta: 1.6 + pseudoRand(1) * 4.2,
      fPhi: 1.2 + pseudoRand(2) * 2.8,
      stretchX: 0.72 + pseudoRand(3) * 0.58,
      stretchY: 0.75 + pseudoRand(4) * 0.55,
      stretchZ: 0.68 + pseudoRand(5) * 0.50,
      turbAmp: 0.16 + pseudoRand(6) * 0.22,
      coreComp: 0.80 + pseudoRand(7) * 0.42
    };
  }, [affirmationId, swipeTrigger]);

  // Update pulse trigger from props (e.g. on heart click)
  useEffect(() => {
    if (pulseTrigger > 0) {
      pulseRef.current = 1.0;
    }
  }, [pulseTrigger]);

  // Update swipe twist trigger from props (on card change)
  useEffect(() => {
    if (swipeTrigger !== 0) {
      swipeAnimRef.current = 1.0;
    }
  }, [swipeTrigger]);

  // Main Three.js lifecycle
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Viewport Dimensions
    const width = window.innerWidth;
    const height = window.innerHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 1000);
    camera.position.z = 21;

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // Pure transparent
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    const particleTexture = createParticleTexture();

    const primaryColor = new THREE.Color(theme?.threeColors?.primary || '#06b6d4');
    const secondaryColor = new THREE.Color(theme?.threeColors?.secondary || '#6366f1');
    const accentColor = new THREE.Color(theme?.threeColors?.accent || '#14b8a6');

    // Central Point Light
    const coreLight = new THREE.PointLight(primaryColor, isDarkMode ? 3.0 : 2.0, 32);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);
    coreLightRef.current = coreLight;

    // Disposables bucket
    const disposables = [particleTexture];

    // =========================================================================
    // SYSTEM 1: "БЕСФОРМЕННЫЙ КОМОК ЧАСТИЦ" (Amorphous Clump Mode)
    // =========================================================================
    let clumpPoints = null;
    let clumpPositions = null;
    let clumpSeeds = null;
    let clumpNoiseAttrs = null;
    let clumpGeometry = null;

    if (visualMode === 'clump') {
      const particleCount = 4800;
      clumpPositions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      clumpSeeds = new Float32Array(particleCount * 4);
      clumpNoiseAttrs = new Float32Array(particleCount * 4);

      for (let i = 0; i < particleCount; i++) {
        const distFraction = Math.pow(Math.random(), 1.6);
        const baseRadius = 1.2 + distFraction * 7.5;
        const theta = Math.random() * Math.PI * 2;
        const phi = (Math.random() - 0.5) * Math.PI;
        const speed = (0.3 + Math.random() * 0.7) * (Math.random() > 0.5 ? 1 : -1);

        clumpSeeds[i * 4] = baseRadius;
        clumpSeeds[i * 4 + 1] = theta;
        clumpSeeds[i * 4 + 2] = phi;
        clumpSeeds[i * 4 + 3] = speed;

        clumpNoiseAttrs[i * 4] = 2.0 + Math.floor(Math.random() * 4);
        clumpNoiseAttrs[i * 4 + 1] = 2.0 + Math.floor(Math.random() * 3);
        clumpNoiseAttrs[i * 4 + 2] = Math.random() * Math.PI * 2;
        clumpNoiseAttrs[i * 4 + 3] = Math.random() * Math.PI * 2;

        clumpPositions[i * 3] = baseRadius * Math.cos(theta) * Math.cos(phi);
        clumpPositions[i * 3 + 1] = baseRadius * Math.sin(theta) * Math.cos(phi);
        clumpPositions[i * 3 + 2] = baseRadius * Math.sin(phi);

        const normDist = baseRadius / 8.7;
        let col;
        if (normDist < 0.4) {
          col = primaryColor;
        } else if (normDist < 0.75) {
          col = Math.random() < 0.6 ? secondaryColor : primaryColor;
        } else {
          col = Math.random() < 0.5 ? accentColor : secondaryColor;
        }

        colors[i * 3] = col.r;
        colors[i * 3 + 1] = col.g;
        colors[i * 3 + 2] = col.b;
      }

      clumpGeometry = new THREE.BufferGeometry();
      clumpGeometry.setAttribute('position', new THREE.BufferAttribute(clumpPositions, 3));
      clumpGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const clumpMaterial = new THREE.PointsMaterial({
        size: isDarkMode ? 0.155 : 0.12,
        vertexColors: true,
        map: particleTexture,
        transparent: true,
        opacity: isDarkMode ? 0.95 : 0.85,
        blending: isDarkMode ? THREE.AdditiveBlending : THREE.NormalBlending,
        depthWrite: false
      });

      clumpPoints = new THREE.Points(clumpGeometry, clumpMaterial);
      scene.add(clumpPoints);
      disposables.push(clumpGeometry, clumpMaterial);
    }

    // =========================================================================
    // SYSTEM 2: "КОСМИЧЕСКАЯ МЕДУЗА" (Bioluminescent Jellyfish Mode)
    // =========================================================================
    let jellyGroup = null;
    let jellyGeometry = null;
    let jellyPositions = null;
    let jellyOrigCoords = null;
    let jellyTypes = null;

    const JELLY_DOME = 2000;
    const JELLY_CORE = 400;
    const JELLY_ARMS = 800;
    const JELLY_TENTACLES_COUNT = 20;
    const JELLY_TENTACLES_SEGS = 70;
    const JELLY_TENTACLES = JELLY_TENTACLES_COUNT * JELLY_TENTACLES_SEGS; // 1400
    const jellyTotal = JELLY_DOME + JELLY_CORE + JELLY_ARMS + JELLY_TENTACLES;

    if (visualMode === 'jellyfish') {
      jellyGroup = new THREE.Group();
      scene.add(jellyGroup);

      jellyPositions = new Float32Array(jellyTotal * 3);
      jellyOrigCoords = new Float32Array(jellyTotal * 4);
      jellyTypes = new Uint8Array(jellyTotal);
      const jellyColors = new Float32Array(jellyTotal * 3);

      let idx = 0;

      // 1. Dome
      for (let i = 0; i < JELLY_DOME; i++) {
        const u = Math.sqrt(Math.random());
        const theta = Math.random() * Math.PI * 2;
        const radius = u * 4.6;
        const baseY = 2.6 - Math.pow(u, 2.2) * 3.4;
        const thickness = (Math.random() - 0.5) * 0.25;

        jellyPositions[idx * 3] = radius * Math.cos(theta);
        jellyPositions[idx * 3 + 1] = baseY + thickness;
        jellyPositions[idx * 3 + 2] = radius * Math.sin(theta);

        jellyOrigCoords[idx * 4] = u;
        jellyOrigCoords[idx * 4 + 1] = theta;
        jellyOrigCoords[idx * 4 + 2] = baseY;
        jellyOrigCoords[idx * 4 + 3] = i;

        jellyTypes[idx] = 0;

        const col = u < 0.4 ? primaryColor : (u < 0.8 ? secondaryColor : accentColor);
        jellyColors[idx * 3] = col.r;
        jellyColors[idx * 3 + 1] = col.g;
        jellyColors[idx * 3 + 2] = col.b;

        idx++;
      }

      // 2. Core
      for (let i = 0; i < JELLY_CORE; i++) {
        const r = Math.pow(Math.random(), 1.5) * 1.8;
        const theta = Math.random() * Math.PI * 2;
        const baseY = 1.0 + (Math.random() - 0.5) * 1.4;

        jellyPositions[idx * 3] = r * Math.cos(theta);
        jellyPositions[idx * 3 + 1] = baseY;
        jellyPositions[idx * 3 + 2] = r * Math.sin(theta);

        jellyOrigCoords[idx * 4] = r;
        jellyOrigCoords[idx * 4 + 1] = theta;
        jellyOrigCoords[idx * 4 + 2] = baseY;
        jellyOrigCoords[idx * 4 + 3] = i;

        jellyTypes[idx] = 1;

        const col = Math.random() < 0.6 ? primaryColor : accentColor;
        jellyColors[idx * 3] = col.r;
        jellyColors[idx * 3 + 1] = col.g;
        jellyColors[idx * 3 + 2] = col.b;

        idx++;
      }

      // 3. Oral Arms
      for (let i = 0; i < JELLY_ARMS; i++) {
        const armIdx = i % 4;
        const progress = Math.random();
        const baseY = 0.8 - progress * 5.5;
        const baseRadius = 0.5 + Math.sin(progress * Math.PI) * 1.0;
        const theta = (armIdx * Math.PI / 2) + progress * 2.5 + (Math.random() - 0.5) * 0.4;

        jellyPositions[idx * 3] = baseRadius * Math.cos(theta);
        jellyPositions[idx * 3 + 1] = baseY;
        jellyPositions[idx * 3 + 2] = baseRadius * Math.sin(theta);

        jellyOrigCoords[idx * 4] = progress;
        jellyOrigCoords[idx * 4 + 1] = theta;
        jellyOrigCoords[idx * 4 + 2] = baseY;
        jellyOrigCoords[idx * 4 + 3] = armIdx;

        jellyTypes[idx] = 2;

        const col = progress < 0.5 ? secondaryColor : accentColor;
        jellyColors[idx * 3] = col.r;
        jellyColors[idx * 3 + 1] = col.g;
        jellyColors[idx * 3 + 2] = col.b;

        idx++;
      }

      // 4. Tentacles
      for (let t = 0; t < JELLY_TENTACLES_COUNT; t++) {
        const tentacleTheta = (t / JELLY_TENTACLES_COUNT) * Math.PI * 2;
        const rimRadius = 4.3 + (Math.random() - 0.5) * 0.4;
        const rimY = -0.7;

        for (let s = 0; s < JELLY_TENTACLES_SEGS; s++) {
          const depthFraction = s / JELLY_TENTACLES_SEGS;
          const y = rimY - depthFraction * 13.5;

          jellyPositions[idx * 3] = rimRadius * Math.cos(tentacleTheta);
          jellyPositions[idx * 3 + 1] = y;
          jellyPositions[idx * 3 + 2] = rimRadius * Math.sin(tentacleTheta);

          jellyOrigCoords[idx * 4] = depthFraction;
          jellyOrigCoords[idx * 4 + 1] = tentacleTheta;
          jellyOrigCoords[idx * 4 + 2] = y;
          jellyOrigCoords[idx * 4 + 3] = t;

          jellyTypes[idx] = 3;

          const col = depthFraction < 0.4 ? secondaryColor : (depthFraction < 0.8 ? accentColor : primaryColor);
          jellyColors[idx * 3] = col.r;
          jellyColors[idx * 3 + 1] = col.g;
          jellyColors[idx * 3 + 2] = col.b;

          idx++;
        }
      }

      jellyGeometry = new THREE.BufferGeometry();
      jellyGeometry.setAttribute('position', new THREE.BufferAttribute(jellyPositions, 3));
      jellyGeometry.setAttribute('color', new THREE.BufferAttribute(jellyColors, 3));

      const jellyMaterial = new THREE.PointsMaterial({
        size: isDarkMode ? 0.16 : 0.125,
        vertexColors: true,
        map: particleTexture,
        transparent: true,
        opacity: isDarkMode ? 0.95 : 0.85,
        blending: isDarkMode ? THREE.AdditiveBlending : THREE.NormalBlending,
        depthWrite: false
      });

      const jellyMesh = new THREE.Points(jellyGeometry, jellyMaterial);
      jellyGroup.add(jellyMesh);
      disposables.push(jellyGeometry, jellyMaterial);
    }

    // =========================================================================
    // SYSTEM 3: "ИНОПЛАНЕТНЫЙ РАСПУСКАЮЩИЙСЯ ЛОТОС" (Alien Blooming Lotus Mode)
    // 4,800 particles: 3 tiers of crystalline petals, glowing stamen & rising spores
    // =========================================================================
    let lotusGroup = null;
    let lotusGeometry = null;
    let lotusPositions = null;
    let lotusOrigCoords = null; // [u, v, layer, petalIdx]
    let lotusTypes = null; // 0: petals, 1: stamen core, 2: ascending spores

    const LOTUS_PETAL_LAYERS = 3;
    const LOTUS_PETALS_PER_LAYER = 8;
    const LOTUS_PARTICLES_PER_PETAL = 110;
    const LOTUS_PETALS_TOTAL = LOTUS_PETAL_LAYERS * LOTUS_PETALS_PER_LAYER * LOTUS_PARTICLES_PER_PETAL; // 2640
    const LOTUS_STAMEN_COUNT = 960;
    const LOTUS_SPORES_COUNT = 1200;
    const lotusTotal = LOTUS_PETALS_TOTAL + LOTUS_STAMEN_COUNT + LOTUS_SPORES_COUNT; // 4800

    if (visualMode === 'lotus') {
      lotusGroup = new THREE.Group();
      scene.add(lotusGroup);

      lotusPositions = new Float32Array(lotusTotal * 3);
      lotusOrigCoords = new Float32Array(lotusTotal * 4);
      lotusTypes = new Uint8Array(lotusTotal);
      const lotusColors = new Float32Array(lotusTotal * 3);

      let lIdx = 0;

      // 1. Petals (3 Layers of 8 Alien Crystalline Blooming Petals)
      for (let layer = 0; layer < LOTUS_PETAL_LAYERS; layer++) {
        const layerAngleOffset = layer * (Math.PI / 8); // stagger layers
        const layerReach = 5.6 - (layer * 1.2); // inner petals are smaller

        for (let p = 0; p < LOTUS_PETALS_PER_LAYER; p++) {
          const petalBaseAngle = (p / LOTUS_PETALS_PER_LAYER) * Math.PI * 2 + layerAngleOffset;

          for (let i = 0; i < LOTUS_PARTICLES_PER_PETAL; i++) {
            const u = Math.random(); // 0 at base, 1 at tip
            const v = (Math.random() - 0.5) * 2; // -1 to 1 across width
            const petalWidth = Math.sin(u * Math.PI) * (0.85 - layer * 0.15) * (1.0 - u * 0.25);

            // Base position in open state
            const r = (u * layerReach) + 0.3;
            const baseY = (u * 1.5) - (layer * 0.4) - 0.8;

            const x = (r * Math.cos(petalBaseAngle)) - (v * petalWidth * Math.sin(petalBaseAngle));
            const y = baseY;
            const z = (r * Math.sin(petalBaseAngle)) + (v * petalWidth * Math.cos(petalBaseAngle));

            lotusPositions[lIdx * 3] = x;
            lotusPositions[lIdx * 3 + 1] = y;
            lotusPositions[lIdx * 3 + 2] = z;

            lotusOrigCoords[lIdx * 4] = u;
            lotusOrigCoords[lIdx * 4 + 1] = v;
            lotusOrigCoords[lIdx * 4 + 2] = layer;
            lotusOrigCoords[lIdx * 4 + 3] = petalBaseAngle;

            lotusTypes[lIdx] = 0;

            // Gradient: base is deep primary, tips are ethereal bioluminescent accent
            const col = u < 0.4 ? primaryColor : (u < 0.8 ? secondaryColor : accentColor);
            lotusColors[lIdx * 3] = col.r;
            lotusColors[lIdx * 3 + 1] = col.g;
            lotusColors[lIdx * 3 + 2] = col.b;

            lIdx++;
          }
        }
      }

      // 2. Central Alien Seed Crystal & Stamen Filaments
      for (let s = 0; s < LOTUS_STAMEN_COUNT; s++) {
        const isCore = s < 300;
        const r = isCore ? (Math.random() * 1.2) : (0.4 + Math.random() * 1.6);
        const theta = Math.random() * Math.PI * 2;
        const progress = Math.random();
        const y = isCore ? ((Math.random() - 0.5) * 0.6 - 0.6) : (-0.6 + progress * 2.2);

        lotusPositions[lIdx * 3] = r * Math.cos(theta);
        lotusPositions[lIdx * 3 + 1] = y;
        lotusPositions[lIdx * 3 + 2] = r * Math.sin(theta);

        lotusOrigCoords[lIdx * 4] = r;
        lotusOrigCoords[lIdx * 4 + 1] = theta;
        lotusOrigCoords[lIdx * 4 + 2] = progress;
        lotusOrigCoords[lIdx * 4 + 3] = s;

        lotusTypes[lIdx] = 1;

        const col = isCore ? primaryColor : accentColor;
        lotusColors[lIdx * 3] = col.r;
        lotusColors[lIdx * 3 + 1] = col.g;
        lotusColors[lIdx * 3 + 2] = col.b;

        lIdx++;
      }

      // 3. Ascending Starlight Spores & Pollen Swarm
      for (let sp = 0; sp < LOTUS_SPORES_COUNT; sp++) {
        const radius = 0.5 + Math.random() * 8.5;
        const theta = Math.random() * Math.PI * 2;
        const y = -2.0 + Math.random() * 14.0;

        lotusPositions[lIdx * 3] = radius * Math.cos(theta);
        lotusPositions[lIdx * 3 + 1] = y;
        lotusPositions[lIdx * 3 + 2] = radius * Math.sin(theta);

        lotusOrigCoords[lIdx * 4] = radius;
        lotusOrigCoords[lIdx * 4 + 1] = theta;
        lotusOrigCoords[lIdx * 4 + 2] = y; // original height
        lotusOrigCoords[lIdx * 4 + 3] = Math.random() * Math.PI * 2; // phase

        lotusTypes[lIdx] = 2;

        const randChoice = Math.random();
        const col = randChoice < 0.4 ? primaryColor : (randChoice < 0.75 ? secondaryColor : accentColor);
        lotusColors[lIdx * 3] = col.r;
        lotusColors[lIdx * 3 + 1] = col.g;
        lotusColors[lIdx * 3 + 2] = col.b;

        lIdx++;
      }

      lotusGeometry = new THREE.BufferGeometry();
      lotusGeometry.setAttribute('position', new THREE.BufferAttribute(lotusPositions, 3));
      lotusGeometry.setAttribute('color', new THREE.BufferAttribute(lotusColors, 3));

      const lotusMaterial = new THREE.PointsMaterial({
        size: isDarkMode ? 0.155 : 0.12,
        vertexColors: true,
        map: particleTexture,
        transparent: true,
        opacity: isDarkMode ? 0.95 : 0.85,
        blending: isDarkMode ? THREE.AdditiveBlending : THREE.NormalBlending,
        depthWrite: false
      });

      const lotusMesh = new THREE.Points(lotusGeometry, lotusMaterial);
      lotusGroup.add(lotusMesh);
      disposables.push(lotusGeometry, lotusMaterial);
    }

    // =========================================================================
    // SYSTEM 4: "ИНОПЛАНЕТНЫЙ КАНЬОН" (Natural Alien Solid Landscape Mode)
    // =========================================================================
    let landscapeGroup = null;
    let landscapeMistPlanes = [];
    let sunLight = null;

    if (visualMode === 'landscape') {
      landscapeGroup = new THREE.Group();
      scene.add(landscapeGroup);
      disposables.push(landscapeGroup);

      // Disable point light in landscape mode to keep dramatic sunlight shadows
      coreLight.intensity = 0;

      // 1. Atmosphere & Scene Fog
      const fogColor = new THREE.Color(isDarkMode ? 0x222a34 : 0x9c8e82);
      scene.fog = new THREE.FogExp2(fogColor, 0.016);

      // 2. Lighting: Directional Sunset Sun + Cool Hemisphere Sky Ambient
      const hemiLight = new THREE.HemisphereLight(
        isDarkMode ? 0x3d4e60 : 0x6d859d, // Sky cool slate
        isDarkMode ? 0x261d17 : 0x5a4635, // Ground warm earth
        isDarkMode ? 1.3 : 1.9
      );
      scene.add(hemiLight);
      disposables.push(hemiLight);

      sunLight = new THREE.DirectionalLight(
        isDarkMode ? 0xffc48c : 0xffdeb6, 
        isDarkMode ? 2.4 : 3.2
      );
      sunLight.position.set(-25, 18, -65);
      sunLight.target.position.set(0, -2, -25);
      scene.add(sunLight);
      scene.add(sunLight.target);
      disposables.push(sunLight);

      // Adjust camera for landscape overlook vantage point
      camera.position.set(0, 1.4, 9.0);

      // -----------------------------------------------------------------------
      // A. Moody Skydome (Storm clouds overhead down to warm horizon glow)
      // -----------------------------------------------------------------------
      const skyGeo = new THREE.SphereGeometry(125, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.65);
      skyGeo.scale(-1, 1, 1);

      const skyColors = [];
      const skyPos = skyGeo.attributes.position;
      const topCol = new THREE.Color(isDarkMode ? 0x161c24 : 0x2e3b48);
      const midCol = new THREE.Color(isDarkMode ? 0x2c3947 : 0x4f6274);
      const horizonCol = new THREE.Color(isDarkMode ? 0x5c4234 : 0xdfa075);
      const hazeCol = new THREE.Color(isDarkMode ? 0x25201c : 0xa68c78);

      for (let i = 0; i < skyPos.count; i++) {
        const y = skyPos.getY(i);
        const normY = THREE.MathUtils.clamp(y / 110, 0, 1);
        let col = new THREE.Color();
        if (normY > 0.45) {
          col.lerpColors(midCol, topCol, (normY - 0.45) / 0.55);
        } else if (normY > 0.12) {
          col.lerpColors(horizonCol, midCol, (normY - 0.12) / 0.33);
        } else {
          col.lerpColors(hazeCol, horizonCol, normY / 0.12);
        }
        skyColors.push(col.r, col.g, col.b);
      }
      skyGeo.setAttribute('color', new THREE.Float32BufferAttribute(skyColors, 3));

      const skyMat = new THREE.MeshBasicMaterial({
        vertexColors: true,
        side: THREE.BackSide,
        depthWrite: false
      });
      const skyMesh = new THREE.Mesh(skyGeo, skyMat);
      skyMesh.rotation.y = 0.4;
      landscapeGroup.add(skyMesh);
      disposables.push(skyGeo, skyMat);

      // -----------------------------------------------------------------------
      // B. Distant Mountain Ridge (Jagged needles & massive mountain wall)
      // -----------------------------------------------------------------------
      const mountainGeo = new THREE.PlaneGeometry(175, 42, 110, 24);
      mountainGeo.translate(0, 15, -72);

      const mPos = mountainGeo.attributes.position;
      const mColors = [];
      const peakSunCol = new THREE.Color(isDarkMode ? 0xa87754 : 0xebaf84);
      const mShadowCol = new THREE.Color(isDarkMode ? 0x27313c : 0x475565);
      const mBaseCol = new THREE.Color(isDarkMode ? 0x202730 : 0x8a7b6f);

      for (let i = 0; i < mPos.count; i++) {
        const x = mPos.getX(i);
        const y = mPos.getY(i);
        const normX = x * 0.038;

        // Jagged mountain peaks with sharp needles
        const n1 = Math.pow(fbm2D(normX, 0.4, 4), 1.9) * 24.0;
        const n2 = Math.sin(normX * 3.4) * 4.2;
        const isSpire = Math.exp(-Math.pow((x - 22) * 0.22, 2)) * 14.0 + Math.exp(-Math.pow((x + 36) * 0.25, 2)) * 11.0;

        const ridgeHeight = n1 + n2 + isSpire;
        const vertFactor = THREE.MathUtils.clamp((y - 2) / 36, 0, 1);
        mPos.setY(i, (y * (0.35 + vertFactor * 0.65)) + (ridgeHeight * vertFactor));
        mPos.setZ(i, mPos.getZ(i) + (fbm2D(normX * 1.5, y * 0.1, 2) * 5.0 * vertFactor));

        const finalY = mPos.getY(i);
        let col = new THREE.Color();
        if (finalY > 20) {
          col.lerpColors(mShadowCol, peakSunCol, THREE.MathUtils.clamp((finalY - 20) / 12, 0, 1));
        } else {
          col.lerpColors(mBaseCol, mShadowCol, THREE.MathUtils.clamp(finalY / 20, 0, 1));
        }
        mColors.push(col.r, col.g, col.b);
      }
      mountainGeo.setAttribute('color', new THREE.Float32BufferAttribute(mColors, 3));
      mountainGeo.computeVertexNormals();

      const mountainMat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.95,
        metalness: 0.05,
        flatShading: true
      });
      const mountainMesh = new THREE.Mesh(mountainGeo, mountainMat);
      landscapeGroup.add(mountainMesh);
      disposables.push(mountainGeo, mountainMat);

      // -----------------------------------------------------------------------
      // C. Canyon Valley Floor (Terraces, sediment trails & mesa steps)
      // -----------------------------------------------------------------------
      const canyonGeo = new THREE.PlaneGeometry(130, 85, 90, 60);
      canyonGeo.rotateX(-Math.PI / 2);
      canyonGeo.translate(0, -6.2, -36);

      const cPos = canyonGeo.attributes.position;
      const cColors = [];

      const floorCol = new THREE.Color(isDarkMode ? 0x483a2d : 0x8f755a);
      const cliffCol = new THREE.Color(isDarkMode ? 0x2e241c : 0x544335);
      const roadCol = new THREE.Color(isDarkMode ? 0x6e5845 : 0xc7af93);
      const shadowClayCol = new THREE.Color(isDarkMode ? 0x221a14 : 0x453529);

      for (let i = 0; i < cPos.count; i++) {
        const x = cPos.getX(i);
        const z = cPos.getZ(i);

        // Canyon winding canyon center: S-curve through the valley
        const canyonCenter = Math.sin((z + 36) * 0.07) * 7.5;
        const distFromCenter = Math.abs(x - canyonCenter);

        // Mesa stepped terraces
        const terrNoise = fbm2D(x * 0.07, z * 0.07, 4);
        const steppedTerrace = (Math.floor(terrNoise * 5) / 5) * 6.5;

        // Depth trough in middle, rising walls on left and right
        const wallRise = Math.pow(THREE.MathUtils.clamp(distFromCenter / 24, 0, 1), 1.6) * 12.0;
        const microNoise = (fbm2D(x * 0.22, z * 0.22, 3) - 0.5) * 1.8;

        const y = -6.2 + wallRise + steppedTerrace + microNoise - 3.5;
        cPos.setY(i, y);

        // Winding trails / dust roads
        const roadWander = Math.sin((z + 30) * 0.12) * 3.5;
        const isRoad = Math.abs(x - canyonCenter - roadWander) < 1.4;

        let col = new THREE.Color();
        if (isRoad && y < -2) {
          col.copy(roadCol);
        } else if (distFromCenter > 16) {
          col.copy(cliffCol);
        } else if (y < -5.5) {
          col.copy(shadowClayCol);
        } else {
          col.copy(floorCol);
        }
        cColors.push(col.r, col.g, col.b);
      }
      canyonGeo.setAttribute('color', new THREE.Float32BufferAttribute(cColors, 3));
      canyonGeo.computeVertexNormals();

      const canyonMat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.92,
        metalness: 0.06,
        flatShading: true
      });
      const canyonMesh = new THREE.Mesh(canyonGeo, canyonMat);
      landscapeGroup.add(canyonMesh);
      disposables.push(canyonGeo, canyonMat);

      // -----------------------------------------------------------------------
      // D. Right Cathedral Monolith Spires (Iconic Gothic natural rock tower)
      // -----------------------------------------------------------------------
      const spireGroup = new THREE.Group();
      spireGroup.position.set(16.5, -6.5, -34);

      const spireRockMat = new THREE.MeshStandardMaterial({
        color: isDarkMode ? 0x3d3126 : 0x6e5642,
        roughness: 0.88,
        metalness: 0.08,
        flatShading: true
      });
      disposables.push(spireRockMat);

      const spireData = [
        { x: 0, z: 0, rBase: 2.4, rTop: 0.5, h: 22 },
        { x: 1.8, z: 1.2, rBase: 1.6, rTop: 0.2, h: 18 },
        { x: -1.5, z: 0.8, rBase: 1.9, rTop: 0.3, h: 16 },
        { x: 0.8, z: -1.6, rBase: 1.4, rTop: 0.1, h: 14 },
        { x: -1.2, z: -1.1, rBase: 1.2, rTop: 0.2, h: 11 },
        { x: 2.6, z: -0.6, rBase: 1.0, rTop: 0.1, h: 9 }
      ];

      spireData.forEach(sd => {
        const pillarGeo = new THREE.CylinderGeometry(sd.rTop, sd.rBase, sd.h, 7, 10);
        pillarGeo.translate(0, sd.h / 2, 0);

        const pPos = pillarGeo.attributes.position;
        for (let j = 0; j < pPos.count; j++) {
          const vy = pPos.getY(j);
          const noise = fbm2D(pPos.getX(j) * 0.8, vy * 0.4, 2) * 0.45;
          const notch = Math.sin(vy * 1.5) * 0.2;
          pPos.setX(j, pPos.getX(j) * (1.0 + noise + notch));
          pPos.setZ(j, pPos.getZ(j) * (1.0 + noise + notch));
        }
        pillarGeo.computeVertexNormals();

        const pillarMesh = new THREE.Mesh(pillarGeo, spireRockMat);
        pillarMesh.position.set(sd.x, 0, sd.z);
        spireGroup.add(pillarMesh);
        disposables.push(pillarGeo);
      });
      landscapeGroup.add(spireGroup);

      // -----------------------------------------------------------------------
      // E. Left Ruin Monolith & Ancient Archway (Ruined Citadel)
      // -----------------------------------------------------------------------
      const ruinGroup = new THREE.Group();
      ruinGroup.position.set(-15, -6.5, -26);

      const ruinMat = new THREE.MeshStandardMaterial({
        color: isDarkMode ? 0x362b21 : 0x5d4a39,
        roughness: 0.94,
        metalness: 0.05,
        flatShading: true
      });
      disposables.push(ruinMat);

      const ruinBlocks = [
        { x: 0, z: 0, w: 3.5, h: 12, d: 3.0 },
        { x: 3.0, z: 1.0, w: 2.6, h: 9.0, d: 2.2 },
        { x: -2.8, z: 0.5, w: 2.2, h: 8.5, d: 2.5 },
        { x: 5.2, z: 1.8, w: 2.0, h: 6.0, d: 2.0 },
        { x: -5.0, z: 1.2, w: 1.8, h: 5.5, d: 1.8 },
        { x: 1.5, z: 0.5, w: 3.8, h: 1.4, d: 1.8, y: 7.2 }
      ];

      ruinBlocks.forEach(rb => {
        const boxGeo = new THREE.BoxGeometry(rb.w, rb.h, rb.d, 3, 5, 3);
        boxGeo.translate(0, (rb.y ?? (rb.h / 2)), 0);

        const bPos = boxGeo.attributes.position;
        for (let j = 0; j < bPos.count; j++) {
          const rough = (fbm2D(bPos.getX(j) * 0.9, bPos.getY(j) * 0.7, 2) - 0.5) * 0.45;
          bPos.setX(j, bPos.getX(j) + rough);
          bPos.setZ(j, bPos.getZ(j) + rough);
        }
        boxGeo.computeVertexNormals();

        const boxMesh = new THREE.Mesh(boxGeo, ruinMat);
        boxMesh.position.set(rb.x, 0, rb.z);
        ruinGroup.add(boxMesh);
        disposables.push(boxGeo);
      });
      landscapeGroup.add(ruinGroup);

      // -----------------------------------------------------------------------
      // F. Drifting Canyon Mist Planes (Atmospheric Depth)
      // -----------------------------------------------------------------------
      const mistTexture = createMistTexture();
      disposables.push(mistTexture);

      const mistPlanesData = [
        { x: 0, y: -2.8, z: -22, w: 75, d: 30, speed: 0.18, opacity: isDarkMode ? 0.32 : 0.45 },
        { x: 6, y: -2.0, z: -35, w: 90, d: 35, speed: -0.14, opacity: isDarkMode ? 0.38 : 0.55 },
        { x: -8, y: -1.2, z: -48, w: 110, d: 40, speed: 0.12, opacity: isDarkMode ? 0.42 : 0.60 },
        { x: 2, y: 1.0, z: -60, w: 130, d: 45, speed: -0.09, opacity: isDarkMode ? 0.48 : 0.65 }
      ];

      mistPlanesData.forEach((mpd) => {
        const mGeo = new THREE.PlaneGeometry(mpd.w, mpd.d);
        mGeo.rotateX(-Math.PI / 2);

        const mMat = new THREE.MeshBasicMaterial({
          map: mistTexture,
          transparent: true,
          opacity: mpd.opacity,
          depthWrite: false,
          blending: THREE.NormalBlending
        });

        const mMesh = new THREE.Mesh(mGeo, mMat);
        mMesh.position.set(mpd.x, mpd.y, mpd.z);
        landscapeGroup.add(mMesh);
        disposables.push(mGeo, mMat);

        landscapeMistPlanes.push({
          mesh: mMesh,
          baseX: mpd.x,
          speed: mpd.speed,
          baseY: mpd.y,
          opacity: mpd.opacity
        });
      });

      // -----------------------------------------------------------------------
      // G. Foreground Precipice & Craggy Cliff Ledge
      // -----------------------------------------------------------------------
      const cliffGeo = new THREE.PlaneGeometry(16, 12, 28, 22);
      cliffGeo.rotateX(-Math.PI * 0.44);
      cliffGeo.translate(0, -1.2, 2.0);

      const clPos = cliffGeo.attributes.position;
      const clColors = [];
      const rockHighCol = new THREE.Color(isDarkMode ? 0x5a483a : 0x8a705a);
      const rockShadowCol = new THREE.Color(isDarkMode ? 0x221a14 : 0x3d3025);

      for (let i = 0; i < clPos.count; i++) {
        const x = clPos.getX(i);
        const z = clPos.getZ(i);

        const promontory = Math.exp(-Math.pow(x * 0.5, 2)) * Math.exp(-Math.pow((z + 1.2) * 0.6, 2)) * 1.6;
        const cragNoise = (fbm2D(x * 0.8, z * 0.8, 3) - 0.5) * 1.1;
        const dropoff = z < -1.5 ? Math.pow(Math.abs(z + 1.5) * 1.2, 1.8) * -2.4 : 0;

        clPos.setY(i, clPos.getY(i) + promontory + cragNoise + dropoff);

        const col = new THREE.Color();
        col.lerpColors(rockShadowCol, rockHighCol, THREE.MathUtils.clamp((clPos.getY(i) + 1.5) / 1.8, 0, 1));
        clColors.push(col.r, col.g, col.b);
      }
      cliffGeo.setAttribute('color', new THREE.Float32BufferAttribute(clColors, 3));
      cliffGeo.computeVertexNormals();

      const cliffMat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.90,
        metalness: 0.08,
        flatShading: true
      });
      const cliffMesh = new THREE.Mesh(cliffGeo, cliffMat);
      landscapeGroup.add(cliffMesh);
      disposables.push(cliffGeo, cliffMat);

      // Low-poly desert succulents nestled on cliff edges
      const succulentMat = new THREE.MeshStandardMaterial({
        color: isDarkMode ? 0x3b4c3e : 0x566d5b,
        roughness: 0.85,
        flatShading: true
      });
      disposables.push(succulentMat);

      const plantCoords = [
        { x: -2.8, y: -0.65, z: -0.4, scale: 0.35 },
        { x: 3.2, y: -0.75, z: -0.2, scale: 0.42 },
        { x: -1.6, y: -0.9, z: 0.8, scale: 0.28 },
        { x: 2.2, y: -0.85, z: 1.0, scale: 0.32 }
      ];

      plantCoords.forEach(pc => {
        const plantGeo = new THREE.ConeGeometry(pc.scale * 1.2, pc.scale * 1.5, 5);
        plantGeo.rotateX(-0.3);
        const plantMesh = new THREE.Mesh(plantGeo, succulentMat);
        plantMesh.position.set(pc.x, pc.y, pc.z);
        landscapeGroup.add(plantMesh);
        disposables.push(plantGeo);
      });

      // -----------------------------------------------------------------------
      // H. The Lone Wanderer Silhouette (Cloaked traveler overlooking the abyss)
      // -----------------------------------------------------------------------
      const wandererGroup = new THREE.Group();
      wandererGroup.position.set(0, -0.25, -1.35);

      const silhouetteMat = new THREE.MeshBasicMaterial({
        color: 0x14110f
      });
      disposables.push(silhouetteMat);

      const cloakGeo = new THREE.ConeGeometry(0.38, 1.25, 6);
      cloakGeo.translate(0, 0.62, 0);
      const cloakMesh = new THREE.Mesh(cloakGeo, silhouetteMat);
      wandererGroup.add(cloakMesh);
      disposables.push(cloakGeo);

      const headGeo = new THREE.SphereGeometry(0.20, 6, 6);
      const headMesh = new THREE.Mesh(headGeo, silhouetteMat);
      headMesh.position.set(0, 1.35, 0.05);
      wandererGroup.add(headMesh);
      disposables.push(headGeo);

      const legGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.45, 5);
      const legLeft = new THREE.Mesh(legGeo, silhouetteMat);
      legLeft.position.set(-0.13, 0.15, 0);
      const legRight = new THREE.Mesh(legGeo, silhouetteMat);
      legRight.position.set(0.13, 0.15, 0);
      wandererGroup.add(legLeft, legRight);
      disposables.push(legGeo);

      landscapeGroup.add(wandererGroup);
    }

    // =========================================================================
    // 4. INTERACTIVE POINTER / TOUCH
    // =========================================================================
    const handlePointerMove = (e) => {
      const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
      const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0;
      mouseRef.current.targetX = ((clientX / window.innerWidth) - 0.5) * 2;
      mouseRef.current.targetY = -((clientY / window.innerHeight) - 0.5) * 2;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    const handleResize = () => {
      if (!rendererRef.current) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // =========================================================================
    // 5. ANIMATION LOOP
    // =========================================================================
    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // 2x slower global meditative speed
      const elapsedTime = clock.getElapsedTime() * 0.5;

      // Smooth pointer damping
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.028;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.028;

      // Parallax Camera movement
      camera.position.x = mouseRef.current.x * 2.0;
      camera.position.y = mouseRef.current.y * 2.0;
      camera.lookAt(0, 0, 0);

      // Supernova explosion decay on like
      if (pulseRef.current > 0.005) {
        pulseRef.current *= 0.95;
      } else {
        pulseRef.current = 0;
      }

      // Swipe impulse decay
      if (swipeAnimRef.current > 0.005) {
        swipeAnimRef.current *= 0.94;
      } else {
        swipeAnimRef.current = 0;
      }

      // -----------------------------------------------------------------------
      // ANIMATION: CLUMP MODE
      // -----------------------------------------------------------------------
      if (visualMode === 'clump' && clumpGeometry && clumpPoints) {
        const slowTime = elapsedTime * 0.28;
        const pulseEnergy = pulseRef.current * 3.8;
        const swipeTwist = swipeAnimRef.current * 0.8;

        const m = currentMorph.current;
        const tm = targetMorph.current;
        const lerp = 0.012;
        m.fTheta += (tm.fTheta - m.fTheta) * lerp;
        m.fPhi += (tm.fPhi - m.fPhi) * lerp;
        m.stretchX += (tm.stretchX - m.stretchX) * lerp;
        m.stretchY += (tm.stretchY - m.stretchY) * lerp;
        m.stretchZ += (tm.stretchZ - m.stretchZ) * lerp;
        m.turbAmp += (tm.turbAmp - m.turbAmp) * lerp;
        m.coreComp += (tm.coreComp - m.coreComp) * lerp;

        const touchGravX = mouseRef.current.x * 1.2;
        const touchGravY = mouseRef.current.y * 1.2;

        const posArray = clumpGeometry.attributes.position.array;
        const count = posArray.length / 3;

        for (let i = 0; i < count; i++) {
          const i3 = i * 3;
          const i4 = i * 4;

          const baseR = clumpSeeds[i4];
          let theta = clumpSeeds[i4 + 1];
          let phi = clumpSeeds[i4 + 2];
          const speed = clumpSeeds[i4 + 3];

          const phase1 = clumpNoiseAttrs[i4 + 2];
          const phase2 = clumpNoiseAttrs[i4 + 3];

          theta += (speed * 0.00125) + (swipeTwist * 0.012);
          clumpSeeds[i4 + 1] = theta;

          const wave1 = Math.sin(theta * m.fTheta + slowTime * 1.1 + phase1) * Math.cos(phi * m.fPhi + slowTime * 0.8);
          const wave2 = Math.sin(phi * 3.0 - slowTime * 1.2 + phase2) * m.turbAmp;
          const wave3 = Math.cos(baseR * 0.4 + theta * 1.5 + slowTime * 0.6) * 0.18;

          const morphR = (baseR * m.coreComp) * (1.0 + (wave1 * 0.28) + wave2 + wave3) + pulseEnergy * (0.8 + (i % 7) * 0.35);

          const curTheta = theta + Math.sin(slowTime * 0.6 + phase1) * 0.08;
          const curPhi = phi + Math.cos(slowTime * 0.7 + phase2) * 0.06;

          const cosPhi = Math.cos(curPhi);
          const x = (morphR * Math.cos(curTheta) * cosPhi) * m.stretchX + touchGravX;
          const y = (morphR * Math.sin(curTheta) * cosPhi) * m.stretchY + touchGravY;
          const z = (morphR * Math.sin(curPhi)) * m.stretchZ;

          posArray[i3] = x;
          posArray[i3 + 1] = y;
          posArray[i3 + 2] = z;
        }

        clumpGeometry.attributes.position.needsUpdate = true;

        const axisTiltX = 0.32 + Math.sin(slowTime * 0.4) * 0.06;
        const axisTiltZ = 0.16 + Math.cos(slowTime * 0.3) * 0.05;

        clumpPoints.rotation.x = axisTiltX;
        clumpPoints.rotation.z = axisTiltZ;
        clumpPoints.rotation.y = (elapsedTime * 0.16) + (swipeAnimRef.current * 0.85);

        coreLight.intensity = (isDarkMode ? 3.0 : 2.0) + (pulseRef.current * 4.0);
      }

      // -----------------------------------------------------------------------
      // ANIMATION: JELLYFISH MODE
      // -----------------------------------------------------------------------
      if (visualMode === 'jellyfish' && jellyGeometry && jellyGroup) {
        const swimSpeed = 1.95 + (pulseRef.current * 3.0);
        const swimTime = elapsedTime * swimSpeed;
        const strokeContract = Math.pow(Math.max(0, Math.sin(swimTime)), 3);
        const strokePropulsion = Math.sin(swimTime) * 1.2;

        const targetTiltZ = -mouseRef.current.x * 0.35;
        const targetTiltX = mouseRef.current.y * 0.30;
        jellyGroup.rotation.z += (targetTiltZ - jellyGroup.rotation.z) * 0.05;
        jellyGroup.rotation.x += (targetTiltX - jellyGroup.rotation.x) * 0.05;

        jellyGroup.position.x += ((mouseRef.current.x * 1.8) - jellyGroup.position.x) * 0.04;
        const floatY = 1.0 + strokePropulsion * 0.6 + (pulseRef.current * 2.5);
        jellyGroup.position.y += (floatY - jellyGroup.position.y) * 0.06;

        jellyGroup.rotation.y = (elapsedTime * 0.08) + (swipeAnimRef.current * 1.2);

        const pos = jellyGeometry.attributes.position.array;

        for (let i = 0; i < jellyTotal; i++) {
          const i3 = i * 3;
          const i4 = i * 4;
          const type = jellyTypes[i];

          const p1 = jellyOrigCoords[i4];
          const p2 = jellyOrigCoords[i4 + 1];
          const p3 = jellyOrigCoords[i4 + 2];
          const p4 = jellyOrigCoords[i4 + 3];

          if (type === 0) {
            const u = p1;
            const theta = p2;
            const baseY = p3;

            const rContraction = 1.0 - (strokeContract * 0.30 * u);
            const curR = u * 4.6 * rContraction;

            const rimWave = u > 0.6 ? Math.sin(theta * 8.0 + elapsedTime * 2.5) * 0.22 * u : 0;
            const y = baseY + (strokeContract * 0.6) + rimWave;

            pos[i3] = curR * Math.cos(theta);
            pos[i3 + 1] = y;
            pos[i3 + 2] = curR * Math.sin(theta);
          } else if (type === 1) {
            const r = p1;
            const theta = p2;
            const baseY = p3;

            const pulseGlow = Math.sin(swimTime * 2.0 + p4) * 0.15;
            pos[i3] = (r + pulseGlow) * Math.cos(theta);
            pos[i3 + 1] = baseY + strokePropulsion * 0.3;
            pos[i3 + 2] = (r + pulseGlow) * Math.sin(theta);
          } else if (type === 2) {
            const progress = p1;
            const theta = p2;
            const baseY = p3;
            const armIdx = p4;

            const lag = progress * 2.2;
            const ruffleX = Math.sin(elapsedTime * 2.2 - lag + armIdx) * (0.3 + progress * 0.6);
            const ruffleZ = Math.cos(elapsedTime * 2.0 - lag + armIdx) * (0.3 + progress * 0.5);

            const r = (0.5 + Math.sin(progress * Math.PI) * 1.0) * (1.0 - strokeContract * 0.2);
            pos[i3] = r * Math.cos(theta) + ruffleX;
            pos[i3 + 1] = baseY - (strokePropulsion * progress * 0.4);
            pos[i3 + 2] = r * Math.sin(theta) + ruffleZ;
          } else if (type === 3) {
            const depth = p1;
            const tTheta = p2;
            const baseY = p3;
            const tIdx = p4;

            const waveLag = depth * 3.8;
            const tentacleRadius = 4.3 * (1.0 - strokeContract * 0.28);

            const flowX = Math.sin(swimTime - waveLag + tIdx * 0.3) * (0.25 + depth * 1.4);
            const flowZ = Math.cos(swimTime * 0.85 - waveLag + tIdx * 0.3) * (0.25 + depth * 1.2);
            const swirlTwist = Math.sin(elapsedTime * 0.5 + depth * 2.0) * 0.4;

            const dragLift = strokePropulsion * (1.0 - depth) * 0.5;

            pos[i3] = tentacleRadius * Math.cos(tTheta + swirlTwist) + flowX;
            pos[i3 + 1] = baseY + dragLift;
            pos[i3 + 2] = tentacleRadius * Math.sin(tTheta + swirlTwist) + flowZ;
          }
        }

        jellyGeometry.attributes.position.needsUpdate = true;
        coreLight.position.set(jellyGroup.position.x, jellyGroup.position.y + 1.2, jellyGroup.position.z);
        coreLight.intensity = (isDarkMode ? 2.8 : 1.8) + (strokeContract * 2.5) + (pulseRef.current * 4.0);
      }

      // -----------------------------------------------------------------------
      // ANIMATION: LOTUS MODE (Alien Blooming Lotus)
      // -----------------------------------------------------------------------
      if (visualMode === 'lotus' && lotusGeometry && lotusGroup) {
        // Hypnotic 8-second blooming breath cycle: 0 (closed crystal bud) to 1 (full cosmic bloom)
        const bloomTime = elapsedTime * 0.55;
        const naturalBloom = (Math.sin(bloomTime) + 1.0) * 0.5; // 0 to 1
        const superBloom = Math.min(naturalBloom + pulseRef.current * 0.6, 1.35); // expands on like!

        // Alien Lotus posture: tilts toward pointer/touch
        const targetTiltX = 0.55 + mouseRef.current.y * 0.35; // default tilted towards viewer
        const targetTiltZ = -mouseRef.current.x * 0.30;
        lotusGroup.rotation.x += (targetTiltX - lotusGroup.rotation.x) * 0.05;
        lotusGroup.rotation.z += (targetTiltZ - lotusGroup.rotation.z) * 0.05;

        // Continuous slow celestial spin on stem
        lotusGroup.rotation.y = (elapsedTime * 0.09) + (swipeAnimRef.current * 1.4);

        const pos = lotusGeometry.attributes.position.array;

        for (let i = 0; i < lotusTotal; i++) {
          const i3 = i * 3;
          const i4 = i * 4;
          const type = lotusTypes[i];

          const p1 = lotusOrigCoords[i4];
          const p2 = lotusOrigCoords[i4 + 1];
          const p3 = lotusOrigCoords[i4 + 2];
          const p4 = lotusOrigCoords[i4 + 3];

          if (type === 0) {
            // --- Crystalline Petal Particle ---
            const u = p1; // length fraction (0 to 1)
            const v = p2; // width fraction (-1 to 1)
            const layer = p3; // 0: outer, 1: mid, 2: inner
            const petalBaseAngle = p4;

            const layerReach = 5.8 - (layer * 1.3);
            const petalWidth = Math.sin(u * Math.PI) * (0.85 - layer * 0.14) * (1.0 - u * 0.22);

            // Blooming physics:
            // When closed (superBloom low): petals stand upright like a glowing chalice
            // When open (superBloom high): petals unfold outward and curve downward at the tips
            const layerBloomLag = Math.max(0, superBloom - layer * 0.12);
            const bloomExpansion = 0.4 + layerBloomLag * 0.85;

            // Height and curve
            const uprightHeight = (u * 3.8) * (1.1 - layerBloomLag * 0.75);
            const tipArch = Math.sin(u * Math.PI) * 1.1 * (1.0 - layerBloomLag * 0.4);
            const tipOutwardCurl = Math.pow(Math.max(0, u - 0.65), 2) * 3.5 * layerBloomLag;
            const tipDrop = Math.pow(Math.max(0, u - 0.65), 2) * 2.2 * layerBloomLag;

            const r = (u * layerReach * bloomExpansion) + tipOutwardCurl + 0.3;
            const y = uprightHeight + tipArch - tipDrop - 0.8;

            // Subtle organic breathing flutter on petal margins
            const flutter = Math.sin(elapsedTime * 2.0 + u * 4.0 + petalBaseAngle) * 0.08 * u;

            const x = (r * Math.cos(petalBaseAngle)) - (v * petalWidth * Math.sin(petalBaseAngle));
            const z = (r * Math.sin(petalBaseAngle)) + (v * petalWidth * Math.cos(petalBaseAngle));

            pos[i3] = x;
            pos[i3 + 1] = y + flutter;
            pos[i3 + 2] = z;
          } else if (type === 1) {
            // --- Alien Crystal Core & Stamen ---
            const r = p1;
            const theta = p2;
            const progress = p3;
            const sIdx = p4;

            // Stamens breathe and shimmer upwards
            const coreShimmer = Math.sin(elapsedTime * 3.0 + sIdx) * 0.12;
            const lift = superBloom * 0.4;

            pos[i3] = (r + coreShimmer * 0.2) * Math.cos(theta);
            pos[i3 + 1] = -0.6 + (progress * 2.2) + lift + coreShimmer;
            pos[i3 + 2] = (r + coreShimmer * 0.2) * Math.sin(theta);
          } else if (type === 2) {
            // --- Ascending Starlight Spores (Cosmic Pollen) ---
            const baseRadius = p1;
            let theta = p2;
            const initialY = p3;
            const phase = p4;

            // Anti-gravity spiral rise
            const speed = 0.8 + (phase % 1) * 0.6;
            const currentY = ((initialY + elapsedTime * speed + 2.0) % 16.0) - 2.0;
            const spiralTheta = theta + (elapsedTime * 0.3) + (currentY * 0.2);

            const spreadRadius = baseRadius + (currentY > 0 ? currentY * 0.3 : 0);
            const wobble = Math.sin(elapsedTime * 1.5 + phase) * 0.25;

            pos[i3] = (spreadRadius + wobble) * Math.cos(spiralTheta);
            pos[i3 + 1] = currentY;
            pos[i3 + 2] = (spreadRadius + wobble) * Math.sin(spiralTheta);
          }
        }

        lotusGeometry.attributes.position.needsUpdate = true;

        coreLight.position.set(lotusGroup.position.x, lotusGroup.position.y + 0.5, lotusGroup.position.z);
        coreLight.intensity = (isDarkMode ? 3.0 : 2.0) + (superBloom * 2.8) + (pulseRef.current * 4.0);
      }

      // -----------------------------------------------------------------------
      // ANIMATION: LANDSCAPE MODE (Alien Canyon Overlook)
      // -----------------------------------------------------------------------
      if (visualMode === 'landscape' && landscapeGroup) {
        // Subtle meditative breeze drone sway
        const droneX = Math.sin(elapsedTime * 0.42) * 0.24;
        const droneY = Math.cos(elapsedTime * 0.32) * 0.12;

        // Cinematic 3D Parallax from mouse/touch
        const targetCamX = (mouseRef.current.x * 2.4) + droneX;
        const targetCamY = 1.35 + (mouseRef.current.y * 1.3) + droneY;
        camera.position.x += (targetCamX - camera.position.x) * 0.04;
        camera.position.y += (targetCamY - camera.position.y) * 0.04;
        camera.position.z = 9.0;

        // Camera aims slightly downward across the canyon toward distant spires
        camera.lookAt(
          mouseRef.current.x * 0.9,
          -0.4 + (mouseRef.current.y * 0.6),
          -38
        );

        // Drifting canyon mist planes
        landscapeMistPlanes.forEach((mp) => {
          mp.mesh.position.x = mp.baseX + Math.sin(elapsedTime * 0.25 + mp.baseY) * 3.6;
          mp.mesh.material.opacity = mp.opacity * (0.85 + Math.sin(elapsedTime * 0.4 + mp.baseY) * 0.15);
        });

        // Sun flare pulse on like / favorite trigger
        if (sunLight) {
          const baseIntensity = isDarkMode ? 2.4 : 3.2;
          sunLight.intensity = baseIntensity + (pulseRef.current * 3.5);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // =========================================================================
    // 6. CLEANUP ON UNMOUNT
    // =========================================================================
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('resize', handleResize);

      scene.fog = null; // Clean up scene fog so other modes stay pristine

      disposables.forEach((item) => {
        if (item && item.dispose) item.dispose();
      });

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [visualMode]);

  // Dynamically update colors when theme changes without re-initializing WebGL
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    const primary = new THREE.Color(theme?.threeColors?.primary || '#06b6d4');
    const secondary = new THREE.Color(theme?.threeColors?.secondary || '#6366f1');
    const accent = new THREE.Color(theme?.threeColors?.accent || '#14b8a6');

    if (coreLightRef.current) {
      coreLightRef.current.color.copy(primary);
    }

    scene.traverse((obj) => {
      if (obj.isPoints && obj.geometry?.attributes?.color) {
        const colAttr = obj.geometry.attributes.color;
        const arr = colAttr.array;
        for (let i = 0; i < arr.length / 3; i++) {
          const rand = Math.random();
          const targetCol = rand < 0.42 ? primary : (rand < 0.78 ? secondary : accent);
          arr[i * 3] = targetCol.r;
          arr[i * 3 + 1] = targetCol.g;
          arr[i * 3 + 2] = targetCol.b;
        }
        colAttr.needsUpdate = true;
      }
    });
  }, [theme, isDarkMode]);

  return (
    <div 
      ref={mountRef} 
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 transition-opacity duration-700"
      style={{ opacity: isDarkMode ? 1.0 : 0.95 }}
    />
  );
}
