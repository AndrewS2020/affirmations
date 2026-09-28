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
  swipeTrigger = 0 
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const coreLightRef = useRef(null);
  const pulseRef = useRef(0);
  const swipeAnimRef = useRef(0);

  // Mouse / Touch interaction coords
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

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

    const primaryColor = new THREE.Color(theme?.threeColors?.primary || '#06b6d4');
    const secondaryColor = new THREE.Color(theme?.threeColors?.secondary || '#6366f1');
    const accentColor = new THREE.Color(theme?.threeColors?.accent || '#14b8a6');

    // =========================================================================
    // "БЕСФОРМЕННЫЙ КОМОК ЧАСТИЦ" (Amorphous Living Spirit Chaos Clump)
    // 3,800 particles forming a shapeless, constantly morphing cosmic blob
    // =========================================================================
    const particleCount = 3800;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    // Particle seed parameters: [baseRadius, theta, phi, speed]
    const seeds = new Float32Array(particleCount * 4);
    // Noise variation attributes: [freqTheta, freqPhi, phase1, phase2]
    const noiseAttrs = new Float32Array(particleCount * 4);

    for (let i = 0; i < particleCount; i++) {
      // Density distribution: high density near nucleus, tapering outward into wisps
      // using pow for core clustering
      const distFraction = Math.pow(Math.random(), 1.6);
      const baseRadius = 1.2 + distFraction * 7.5; // radius between 1.2 and 8.7
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;
      const speed = (0.3 + Math.random() * 0.7) * (Math.random() > 0.5 ? 1 : -1);

      seeds[i * 4] = baseRadius;
      seeds[i * 4 + 1] = theta;
      seeds[i * 4 + 2] = phi;
      seeds[i * 4 + 3] = speed;

      noiseAttrs[i * 4] = 2.0 + Math.floor(Math.random() * 4); // freqTheta (2..5)
      noiseAttrs[i * 4 + 1] = 2.0 + Math.floor(Math.random() * 3); // freqPhi (2..4)
      noiseAttrs[i * 4 + 2] = Math.random() * Math.PI * 2; // phase1
      noiseAttrs[i * 4 + 3] = Math.random() * Math.PI * 2; // phase2

      // Initial placement
      positions[i * 3] = baseRadius * Math.cos(theta) * Math.cos(phi);
      positions[i * 3 + 1] = baseRadius * Math.sin(theta) * Math.cos(phi);
      positions[i * 3 + 2] = baseRadius * Math.sin(phi);

      // Color gradation: inner core takes primary vibrant hue, outer wisps take astral accents
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

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: isDarkMode ? 0.62 : 0.48,
      vertexColors: true,
      map: particleTexture,
      transparent: true,
      opacity: isDarkMode ? 0.95 : 0.82,
      blending: isDarkMode ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false
    });

    const clumpPoints = new THREE.Points(geometry, material);
    scene.add(clumpPoints);

    // Dynamic Central Point Light illuminating the amorphous clump from inside
    const coreLight = new THREE.PointLight(primaryColor, isDarkMode ? 3.2 : 2.0, 30);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);
    coreLightRef.current = coreLight;

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
    // 4. ANIMATION LOOP: ORGANIC AMORPHOUS CLUMP SIMULATION
    // =========================================================================
    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth pointer damping (gentle and smooth)
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.028;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.028;

      // Parallax Camera movement
      camera.position.x = mouseRef.current.x * 2.0;
      camera.position.y = mouseRef.current.y * 2.0;
      camera.lookAt(0, 0, 0);

      // Supernova explosion decay on like (smooth dissipation)
      if (pulseRef.current > 0.005) {
        pulseRef.current *= 0.95;
      } else {
        pulseRef.current = 0;
      }

      // Swipe twist impulse decay on card change (smooth float)
      if (swipeAnimRef.current > 0.005) {
        swipeAnimRef.current *= 0.94;
      } else {
        swipeAnimRef.current = 0;
      }

      // Meditative, slow time scale (~3.5x slower, hypnotic liquid flow)
      const slowTime = elapsedTime * 0.28;
      const pulseEnergy = pulseRef.current * 3.8;
      const swipeTwist = swipeAnimRef.current * 0.8;

      // Pointer influence: fluid gentle gravity attractor
      const touchGravX = mouseRef.current.x * 1.2;
      const touchGravY = mouseRef.current.y * 1.2;

      const posArray = geometry.attributes.position.array;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const i4 = i * 4;

        const baseR = seeds[i4];
        let theta = seeds[i4 + 1];
        let phi = seeds[i4 + 2];
        const speed = seeds[i4 + 3];

        const fTheta = noiseAttrs[i4];
        const fPhi = noiseAttrs[i4 + 1];
        const phase1 = noiseAttrs[i4 + 2];
        const phase2 = noiseAttrs[i4 + 3];

        // Meditative, slow swirl
        theta += (speed * 0.0025) + (swipeTwist * 0.012);
        seeds[i4 + 1] = theta;

        // Harmonic 3D turbulence waves: slow, liquid, hypnotic deformation
        const wave1 = Math.sin(theta * fTheta + slowTime * 1.1 + phase1) * Math.cos(phi * fPhi + slowTime * 0.8);
        const wave2 = Math.sin(phi * 3.0 - slowTime * 1.2 + phase2) * 0.22;
        const wave3 = Math.cos(baseR * 0.4 + theta * 1.5 + slowTime * 0.6) * 0.18;

        // Dynamic morphed radius of the amorphous clump
        const morphR = baseR * (1.0 + (wave1 * 0.28) + wave2 + wave3) + pulseEnergy * (0.8 + (i % 7) * 0.35);

        // Gentle organic drift
        const curTheta = theta + Math.sin(slowTime * 0.6 + phase1) * 0.08;
        const curPhi = phi + Math.cos(slowTime * 0.7 + phase2) * 0.06;

        const cosPhi = Math.cos(curPhi);
        const x = morphR * Math.cos(curTheta) * cosPhi + touchGravX;
        const y = morphR * Math.sin(curTheta) * cosPhi + touchGravY;
        const z = morphR * Math.sin(curPhi) * 0.88;

        posArray[i3] = x;
        posArray[i3 + 1] = y;
        posArray[i3 + 2] = z;
      }

      geometry.attributes.position.needsUpdate = true;

      // Continuous, clear rotation of the clump around its own axis (~36s for full 360° turn)
      // Slight celestial tilt (20°) highlights the full 3D depth and volume as it spins
      const axisTiltX = 0.32 + Math.sin(slowTime * 0.4) * 0.06;
      const axisTiltZ = 0.16 + Math.cos(slowTime * 0.3) * 0.05;

      clumpPoints.rotation.x = axisTiltX;
      clumpPoints.rotation.z = axisTiltZ;
      clumpPoints.rotation.y = (elapsedTime * 0.16) + (swipeAnimRef.current * 0.85);

      // Pulse core light
      coreLight.intensity = (isDarkMode ? 3.0 : 2.0) + (pulseRef.current * 4.0);

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

      geometry.dispose();
      material.dispose();
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
