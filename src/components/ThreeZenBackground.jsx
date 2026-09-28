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

export default function ThreeZenBackground({ 
  theme, 
  isDarkMode = true, 
  pulseTrigger = 0, 
  swipeTrigger = 0,
  affirmationId,
  visualMode = 'clump' // 'clump' | 'jellyfish'
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
      fTheta: 1.6 + pseudoRand(1) * 4.2,      // number of lobes / folds (1.6 .. 5.8)
      fPhi: 1.2 + pseudoRand(2) * 2.8,        // vertical undulation modes (1.2 .. 4.0)
      stretchX: 0.72 + pseudoRand(3) * 0.58,  // width factor
      stretchY: 0.75 + pseudoRand(4) * 0.55,  // height factor
      stretchZ: 0.68 + pseudoRand(5) * 0.50,  // depth factor
      turbAmp: 0.16 + pseudoRand(6) * 0.22,   // surface ripple roughness
      coreComp: 0.80 + pseudoRand(7) * 0.42   // core nucleus compactness
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
    // SYSTEM A: "БЕСФОРМЕННЫЙ КОМОК ЧАСТИЦ" (Amorphous Clump Mode)
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
        size: isDarkMode ? 0.31 : 0.24,
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
    // SYSTEM B: "КОСМИЧЕСКАЯ МЕДУЗА" (Bioluminescent Jellyfish Mode)
    // 4,600 particles: pulsating bell dome, waving oral curtains, trailing tentacles
    // =========================================================================
    let jellyGroup = null;
    let jellyGeometry = null;
    let jellyPositions = null;
    let jellyOrigCoords = null;
    let jellyTypes = null; // 0: dome, 1: core, 2: oral arms, 3: tentacles

    const JELLY_DOME = 2000;
    const JELLY_CORE = 400;
    const JELLY_ARMS = 800;
    const JELLY_TENTACLES_COUNT = 20;
    const JELLY_TENTACLES_SEGS = 70;
    const JELLY_TENTACLES = JELLY_TENTACLES_COUNT * JELLY_TENTACLES_SEGS; // 1400
    const jellyTotal = JELLY_DOME + JELLY_CORE + JELLY_ARMS + JELLY_TENTACLES; // 4600

    if (visualMode === 'jellyfish') {
      jellyGroup = new THREE.Group();
      scene.add(jellyGroup);

      jellyPositions = new Float32Array(jellyTotal * 3);
      jellyOrigCoords = new Float32Array(jellyTotal * 4); // [u, theta, baseY, index]
      jellyTypes = new Uint8Array(jellyTotal);
      const jellyColors = new Float32Array(jellyTotal * 3);

      let idx = 0;

      // 1. Bell Dome (Купол медузы)
      for (let i = 0; i < JELLY_DOME; i++) {
        const u = Math.sqrt(Math.random()); // radial fraction from 0 to 1
        const theta = Math.random() * Math.PI * 2;
        const radius = u * 4.6;
        // Parabolic dome curved downwards at rims
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

        // Color: apex is primary, rim is accent/secondary
        const col = u < 0.4 ? primaryColor : (u < 0.8 ? secondaryColor : accentColor);
        jellyColors[idx * 3] = col.r;
        jellyColors[idx * 3 + 1] = col.g;
        jellyColors[idx * 3 + 2] = col.b;

        idx++;
      }

      // 2. Inner Glowing Organ Core
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

        // High intensity primary/accent glow
        const col = Math.random() < 0.6 ? primaryColor : accentColor;
        jellyColors[idx * 3] = col.r;
        jellyColors[idx * 3 + 1] = col.g;
        jellyColors[idx * 3 + 2] = col.b;

        idx++;
      }

      // 3. Oral Arms / Ribbons (Фалды в центре)
      for (let i = 0; i < JELLY_ARMS; i++) {
        const armIdx = i % 4; // 4 main oral arms
        const progress = Math.random(); // 0 at dome, 1 at bottom
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

      // 4. Trailing Tentacles (Светящиеся длинные щупальца)
      for (let t = 0; t < JELLY_TENTACLES_COUNT; t++) {
        const tentacleTheta = (t / JELLY_TENTACLES_COUNT) * Math.PI * 2;
        const rimRadius = 4.3 + (Math.random() - 0.5) * 0.4;
        const rimY = -0.7;

        for (let s = 0; s < JELLY_TENTACLES_SEGS; s++) {
          const depthFraction = s / JELLY_TENTACLES_SEGS; // 0 to 1
          const y = rimY - depthFraction * 13.5;

          jellyPositions[idx * 3] = rimRadius * Math.cos(tentacleTheta);
          jellyPositions[idx * 3 + 1] = y;
          jellyPositions[idx * 3 + 2] = rimRadius * Math.sin(tentacleTheta);

          jellyOrigCoords[idx * 4] = depthFraction;
          jellyOrigCoords[idx * 4 + 1] = tentacleTheta;
          jellyOrigCoords[idx * 4 + 2] = y;
          jellyOrigCoords[idx * 4 + 3] = t; // tentacle index

          jellyTypes[idx] = 3;

          // Bioluminescent gradation: top is secondary, trailing tips are fairy starlight
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
        size: isDarkMode ? 0.32 : 0.25,
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
    // 3. INTERACTIVE POINTER / TOUCH
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
    // 4. ANIMATION LOOP
    // =========================================================================
    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

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

        // Smooth fluid lerp of morphing parameters
        const m = currentMorph.current;
        const tm = targetMorph.current;
        const lerp = 0.024;
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

          theta += (speed * 0.0025) + (swipeTwist * 0.012);
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

        // Continuous rotation around tilted axis
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
        // Hypnotic swimming cycle: ~3.2s per propulsion stroke
        const swimSpeed = 1.95 + (pulseRef.current * 3.0);
        const swimTime = elapsedTime * swimSpeed;
        const stroke = (Math.sin(swimTime) + 1) * 0.5; // 0 to 1
        const strokeContract = Math.pow(Math.max(0, Math.sin(swimTime)), 3); // sharp contraction
        const strokePropulsion = Math.sin(swimTime) * 1.2; // upward push

        // Jellyfish posture: tilts towards touch direction
        const targetTiltZ = -mouseRef.current.x * 0.35;
        const targetTiltX = mouseRef.current.y * 0.30;
        jellyGroup.rotation.z += (targetTiltZ - jellyGroup.rotation.z) * 0.05;
        jellyGroup.rotation.x += (targetTiltX - jellyGroup.rotation.x) * 0.05;

        // Floating posture position
        jellyGroup.position.x += ((mouseRef.current.x * 1.8) - jellyGroup.position.x) * 0.04;
        const floatY = 1.0 + strokePropulsion * 0.6 + (pulseRef.current * 2.5);
        jellyGroup.position.y += (floatY - jellyGroup.position.y) * 0.06;

        // Gentle yaw rotation on swipe
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
            // --- Dome Particle ---
            const u = p1;
            const theta = p2;
            const baseY = p3;

            // Contraction shrinks radius inwards during thrust
            const rContraction = 1.0 - (strokeContract * 0.30 * u);
            const curR = u * 4.6 * rContraction;

            // Ruffled rim wave
            const rimWave = u > 0.6 ? Math.sin(theta * 8.0 + elapsedTime * 2.5) * 0.22 * u : 0;
            const y = baseY + (strokeContract * 0.6) + rimWave;

            pos[i3] = curR * Math.cos(theta);
            pos[i3 + 1] = y;
            pos[i3 + 2] = curR * Math.sin(theta);
          } else if (type === 1) {
            // --- Core Organ ---
            const r = p1;
            const theta = p2;
            const baseY = p3;

            const pulseGlow = Math.sin(swimTime * 2.0 + p4) * 0.15;
            pos[i3] = (r + pulseGlow) * Math.cos(theta);
            pos[i3 + 1] = baseY + strokePropulsion * 0.3;
            pos[i3 + 2] = (r + pulseGlow) * Math.sin(theta);
          } else if (type === 2) {
            // --- Oral Arms Curtains ---
            const progress = p1;
            const theta = p2;
            const baseY = p3;
            const armIdx = p4;

            // Fluid lag wave down the curtain
            const lag = progress * 2.2;
            const ruffleX = Math.sin(elapsedTime * 2.2 - lag + armIdx) * (0.3 + progress * 0.6);
            const ruffleZ = Math.cos(elapsedTime * 2.0 - lag + armIdx) * (0.3 + progress * 0.5);

            const r = (0.5 + Math.sin(progress * Math.PI) * 1.0) * (1.0 - strokeContract * 0.2);
            pos[i3] = r * Math.cos(theta) + ruffleX;
            pos[i3 + 1] = baseY - (strokePropulsion * progress * 0.4);
            pos[i3 + 2] = r * Math.sin(theta) + ruffleZ;
          } else if (type === 3) {
            // --- Trailing Tentacles ---
            const depth = p1; // 0 to 1
            const tTheta = p2;
            const baseY = p3;
            const tIdx = p4;

            // Wave lag traveling down the tentacle
            const waveLag = depth * 3.8;
            const tentacleRadius = 4.3 * (1.0 - strokeContract * 0.28);

            // Flowing currents in water
            const flowX = Math.sin(swimTime - waveLag + tIdx * 0.3) * (0.25 + depth * 1.4);
            const flowZ = Math.cos(swimTime * 0.85 - waveLag + tIdx * 0.3) * (0.25 + depth * 1.2);
            const swirlTwist = Math.sin(elapsedTime * 0.5 + depth * 2.0) * 0.4;

            // Upward drag stretch when propelling
            const dragLift = strokePropulsion * (1.0 - depth) * 0.5;

            pos[i3] = tentacleRadius * Math.cos(tTheta + swirlTwist) + flowX;
            pos[i3 + 1] = baseY + dragLift;
            pos[i3 + 2] = tentacleRadius * Math.sin(tTheta + swirlTwist) + flowZ;
          }
        }

        jellyGeometry.attributes.position.needsUpdate = true;

        // Core light pulses with jellyfish stroke
        coreLight.position.set(jellyGroup.position.x, jellyGroup.position.y + 1.2, jellyGroup.position.z);
        coreLight.intensity = (isDarkMode ? 2.8 : 1.8) + (strokeContract * 2.5) + (pulseRef.current * 4.0);
      }

      renderer.render(scene, camera);
    };

    animate();

    // =========================================================================
    // 5. CLEANUP ON UNMOUNT
    // =========================================================================
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('resize', handleResize);

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
