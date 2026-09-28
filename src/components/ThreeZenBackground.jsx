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
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.9)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.35)');
  gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.08)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Generate volumetric 3D Heart coordinates for the "Love Spirit" core
function createHeartCoordinates(count, scale = 0.34) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Parameter t along the heart contour
    const t = Math.random() * Math.PI * 2;
    // Volume & depth spread
    const phi = (Math.random() - 0.5) * Math.PI;
    const fuzz = 0.88 + Math.random() * 0.25;

    // Classical parametric 3D Heart formulas
    const xBase = 16 * Math.pow(Math.sin(t), 3);
    const yBase = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    const zBase = Math.sin(phi) * 6.5 * Math.sin(t) * Math.sin(t);

    positions[i * 3] = xBase * scale * fuzz * Math.cos(phi * 0.3);
    positions[i * 3 + 1] = (yBase * scale * fuzz) + 0.6; // slightly centered
    positions[i * 3 + 2] = zBase * scale * fuzz;
  }
  return positions;
}

export default function ThreeZenBackground({ 
  theme, 
  isDarkMode = true, 
  pulseTrigger = 0, 
  swipeTrigger = 0 
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const pulseRef = useRef(0);
  const swipeAnimRef = useRef(0);

  // Mouse / Touch interaction coords
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, speed: 0 });

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

    const primaryColor = new THREE.Color(theme?.threeColors?.primary || '#ec4899');
    const secondaryColor = new THREE.Color(theme?.threeColors?.secondary || '#8b5cf6');
    const accentColor = new THREE.Color(theme?.threeColors?.accent || '#f43f5e');

    // =========================================================================
    // LAYER 1: "LOVE SPIRIT HEART" (1,200 crystalline breathing heart nodes)
    // =========================================================================
    const heartCount = 1200;
    const heartPositions = createHeartCoordinates(heartCount, 0.35);
    const heartOriginals = new Float32Array(heartPositions);
    const heartColors = new Float32Array(heartCount * 3);
    const heartPhases = new Float32Array(heartCount);

    for (let i = 0; i < heartCount; i++) {
      const rand = Math.random();
      const col = rand < 0.5 ? primaryColor : (rand < 0.85 ? accentColor : secondaryColor);
      heartColors[i * 3] = col.r;
      heartColors[i * 3 + 1] = col.g;
      heartColors[i * 3 + 2] = col.b;
      heartPhases[i] = Math.random() * Math.PI * 2;
    }

    const heartGeom = new THREE.BufferGeometry();
    heartGeom.setAttribute('position', new THREE.BufferAttribute(heartPositions, 3));
    heartGeom.setAttribute('color', new THREE.BufferAttribute(heartColors, 3));

    const heartMat = new THREE.PointsMaterial({
      size: isDarkMode ? 0.65 : 0.48,
      vertexColors: true,
      map: particleTexture,
      transparent: true,
      opacity: isDarkMode ? 0.95 : 0.85,
      blending: isDarkMode ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false
    });

    const heartPoints = new THREE.Points(heartGeom, heartMat);
    scene.add(heartPoints);

    // =========================================================================
    // LAYER 2: "CHAOS SPIRIT SWARM" (2,400 turbulent vortex particles)
    // =========================================================================
    const chaosCount = 2400;
    const chaosPositions = new Float32Array(chaosCount * 3);
    const chaosVelocities = new Float32Array(chaosCount * 3);
    const chaosColors = new Float32Array(chaosCount * 3);
    const chaosData = new Float32Array(chaosCount * 4); // [radius, theta, phi, speed]

    for (let i = 0; i < chaosCount; i++) {
      const radius = 3.5 + Math.random() * 18.0;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;
      const speed = (0.2 + Math.random() * 0.8) * (Math.random() > 0.5 ? 1 : -1);

      chaosPositions[i * 3] = radius * Math.cos(theta) * Math.cos(phi);
      chaosPositions[i * 3 + 1] = radius * Math.sin(theta) * Math.cos(phi);
      chaosPositions[i * 3 + 2] = radius * Math.sin(phi) * 0.7;

      chaosVelocities[i * 3] = 0;
      chaosVelocities[i * 3 + 1] = 0;
      chaosVelocities[i * 3 + 2] = 0;

      chaosData[i * 4] = radius;
      chaosData[i * 4 + 1] = theta;
      chaosData[i * 4 + 2] = phi;
      chaosData[i * 4 + 3] = speed;

      // Color distribution: inner is fiery/love, outer is astral spirit
      const distRatio = Math.min(radius / 18, 1);
      const col = distRatio < 0.45 ? primaryColor : (distRatio < 0.8 ? secondaryColor : accentColor);
      chaosColors[i * 3] = col.r;
      chaosColors[i * 3 + 1] = col.g;
      chaosColors[i * 3 + 2] = col.b;
    }

    const chaosGeom = new THREE.BufferGeometry();
    chaosGeom.setAttribute('position', new THREE.BufferAttribute(chaosPositions, 3));
    chaosGeom.setAttribute('color', new THREE.BufferAttribute(chaosColors, 3));

    const chaosMat = new THREE.PointsMaterial({
      size: isDarkMode ? 0.55 : 0.42,
      vertexColors: true,
      map: particleTexture,
      transparent: true,
      opacity: isDarkMode ? 0.92 : 0.80,
      blending: isDarkMode ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false
    });

    const chaosPoints = new THREE.Points(chaosGeom, chaosMat);
    scene.add(chaosPoints);

    // =========================================================================
    // LAYER 3: "SPIRIT FILAMENTS" (Harmonic Infinity Curves)
    // =========================================================================
    const ringGroup = new THREE.Group();
    scene.add(ringGroup);

    // Spirit Infinity Ribbon 1
    const ribbonGeom1 = new THREE.TorusGeometry(8.5, 0.05, 12, 100);
    const ribbonMat1 = new THREE.MeshBasicMaterial({
      color: secondaryColor,
      wireframe: true,
      transparent: true,
      opacity: isDarkMode ? 0.35 : 0.28,
      blending: isDarkMode ? THREE.AdditiveBlending : THREE.NormalBlending
    });
    const ribbon1 = new THREE.Mesh(ribbonGeom1, ribbonMat1);
    ribbon1.rotation.x = Math.PI / 3;
    ringGroup.add(ribbon1);

    // Spirit Infinity Ribbon 2 (Opposing Tilt)
    const ribbonGeom2 = new THREE.TorusGeometry(12.0, 0.04, 12, 100);
    const ribbonMat2 = new THREE.MeshBasicMaterial({
      color: primaryColor,
      wireframe: true,
      transparent: true,
      opacity: isDarkMode ? 0.25 : 0.20,
      blending: isDarkMode ? THREE.AdditiveBlending : THREE.NormalBlending
    });
    const ribbon2 = new THREE.Mesh(ribbonGeom2, ribbonMat2);
    ribbon2.rotation.y = Math.PI / 4;
    ringGroup.add(ribbon2);

    // Central Radiant Love Core Light
    const coreLight = new THREE.PointLight(primaryColor, isDarkMode ? 3.0 : 2.0, 30);
    coreLight.position.set(0, 0.6, 0);
    scene.add(coreLight);

    // =========================================================================
    // 4. INTERACTION LISTENERS (Touch & Pointer Gravity Vortex)
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
    // 5. ANIMATION LOOP: "LOVE SPIRIT CHAOS"
    // =========================================================================
    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth pointer damping
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      // Parallax Camera movement
      camera.position.x = mouseRef.current.x * 2.8;
      camera.position.y = mouseRef.current.y * 2.8;
      camera.lookAt(0, 0.5, 0);

      // Supernova Love Shockwave decay
      if (pulseRef.current > 0.005) {
        pulseRef.current *= 0.94;
      } else {
        pulseRef.current = 0;
      }

      // Swipe vortex impulse decay
      if (swipeAnimRef.current > 0.005) {
        swipeAnimRef.current *= 0.92;
      } else {
        swipeAnimRef.current = 0;
      }

      // -----------------------------------------------------------------------
      // A. "LIVING HEARTBEAT" (Lub-Dub rhythm of love)
      // -----------------------------------------------------------------------
      const heartRate = 2.6; // ~75 bpm
      const beatCycle = (elapsedTime * heartRate) % (Math.PI * 2);
      // Double beat: primary lub + secondary dub
      const lub = Math.pow(Math.max(0, Math.sin(beatCycle)), 8) * 0.16;
      const dub = Math.pow(Math.max(0, Math.sin(beatCycle - 0.45)), 8) * 0.10;
      const heartBeatScale = 1 + lub + dub + (pulseRef.current * 0.5);

      const heartPosArr = heartGeom.attributes.position.array;
      for (let i = 0; i < heartCount; i++) {
        const i3 = i * 3;
        const phase = heartPhases[i];
        
        // Gentle organic shimmer / breathing
        const shimmer = Math.sin(elapsedTime * 3 + phase) * 0.06;
        const currentScale = heartBeatScale + shimmer;

        // Love shockwave outward burst when user taps favorite
        const pulseBlast = pulseRef.current * (1.5 + Math.sin(phase) * 0.8);

        heartPosArr[i3] = heartOriginals[i3] * currentScale + (heartOriginals[i3] > 0 ? pulseBlast : -pulseBlast);
        heartPosArr[i3 + 1] = heartOriginals[i3 + 1] * currentScale + (heartOriginals[i3 + 1] > 0 ? pulseBlast : -pulseBlast);
        heartPosArr[i3 + 2] = heartOriginals[i3 + 2] * currentScale + Math.cos(elapsedTime * 2 + phase) * 0.2;
      }
      heartGeom.attributes.position.needsUpdate = true;

      // Slowly rotate and float the heart
      heartPoints.rotation.y = elapsedTime * 0.12 + (swipeAnimRef.current * 0.9);
      heartPoints.rotation.z = Math.sin(elapsedTime * 0.35) * 0.06;

      // -----------------------------------------------------------------------
      // B. "CHAOTIC SPIRIT SWARM" (Strange attractor & fluid vortex turbulence)
      // -----------------------------------------------------------------------
      const chaosPosArr = chaosGeom.attributes.position.array;
      const swipeBoost = swipeAnimRef.current * 3.5;
      const touchGravX = mouseRef.current.x * 2.0;
      const touchGravY = mouseRef.current.y * 2.0;

      for (let i = 0; i < chaosCount; i++) {
        const i3 = i * 3;
        const i4 = i * 4;

        let r = chaosData[i4];
        let theta = chaosData[i4 + 1];
        let phi = chaosData[i4 + 2];
        const baseSpeed = chaosData[i4 + 3];

        // Swirling angle speed + swipe burst
        theta += (baseSpeed * 0.015) + (swipeBoost * 0.04);
        chaosData[i4 + 1] = theta;

        // Lorenz / Clifford chaotic oscillations
        const curlX = Math.sin(elapsedTime * 0.8 + phi * 3) * 0.8;
        const curlY = Math.cos(elapsedTime * 0.9 + theta * 2) * 0.8;
        const curlZ = Math.sin(elapsedTime * 1.1 + r) * 0.6;

        // Supernova explosion expansion
        const shockwavePush = pulseRef.current * (4.0 + (i % 5));

        // Effective position
        const targetX = (r + shockwavePush) * Math.cos(theta) * Math.cos(phi) + curlX + touchGravX;
        const targetY = (r + shockwavePush) * Math.sin(theta) * Math.cos(phi) + curlY + touchGravY;
        const targetZ = (r + shockwavePush) * Math.sin(phi) * 0.7 + curlZ;

        // Fluid spring interpolation towards chaotic trajectory
        chaosPosArr[i3] += (targetX - chaosPosArr[i3]) * 0.08;
        chaosPosArr[i3 + 1] += (targetY - chaosPosArr[i3 + 1]) * 0.08;
        chaosPosArr[i3 + 2] += (targetZ - chaosPosArr[i3 + 2]) * 0.08;
      }
      chaosGeom.attributes.position.needsUpdate = true;

      // Gentle overall swirl of the spirit chaos
      chaosPoints.rotation.y = elapsedTime * 0.04;
      chaosPoints.rotation.x = Math.sin(elapsedTime * 0.03) * 0.08;

      // -----------------------------------------------------------------------
      // C. SPIRIT INFINITY CURVES ROTATION
      // -----------------------------------------------------------------------
      ribbon1.rotation.z += 0.003 + (swipeAnimRef.current * 0.05);
      ribbon1.rotation.y += 0.002;
      ribbon2.rotation.z -= 0.002 + (swipeAnimRef.current * 0.04);
      ribbon2.rotation.x += 0.001;

      // Pulse core light intensity
      coreLight.intensity = (isDarkMode ? 3.0 : 2.0) + (pulseRef.current * 5.0) + (lub * 3.0);

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

      heartGeom.dispose();
      heartMat.dispose();
      chaosGeom.dispose();
      chaosMat.dispose();
      ribbonGeom1.dispose();
      ribbonMat1.dispose();
      ribbonGeom2.dispose();
      ribbonMat2.dispose();
      particleTexture.dispose();

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Dynamically update colors when theme changes without re-initializing WebGL
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    const primary = new THREE.Color(theme?.threeColors?.primary || '#ec4899');
    const secondary = new THREE.Color(theme?.threeColors?.secondary || '#8b5cf6');
    const accent = new THREE.Color(theme?.threeColors?.accent || '#f43f5e');

    scene.traverse((obj) => {
      if (obj.isPoints && obj.geometry?.attributes?.color) {
        const colAttr = obj.geometry.attributes.color;
        const arr = colAttr.array;
        for (let i = 0; i < arr.length / 3; i++) {
          const rand = Math.random();
          const targetCol = rand < 0.45 ? primary : (rand < 0.78 ? secondary : accent);
          arr[i * 3] = targetCol.r;
          arr[i * 3 + 1] = targetCol.g;
          arr[i * 3 + 2] = targetCol.b;
        }
        colAttr.needsUpdate = true;
      }
      if (obj.isMesh && obj.material) {
        if (obj.material.color) {
          obj.material.color.copy(secondary);
        }
      }
      if (obj.isPointLight) {
        obj.color.copy(primary);
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
