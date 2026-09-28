import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Generate a soft round radial glowing star sprite programmatically
function createGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.9)');
  gradient.addColorStop(0.45, 'rgba(255, 255, 255, 0.4)');
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

    const camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 1000);
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

    const starTexture = createGlowTexture();

    // 3. Central Sacred Geometry: Majestic Breathing Torus Knot
    // Scaled so outer loops swirl visibly around and behind the card
    const torusGeom = new THREE.TorusKnotGeometry(5.4, 1.45, 120, 28, 2, 3);
    
    const primaryColor = new THREE.Color(theme?.threeColors?.primary || '#06b6d4');
    const secondaryColor = new THREE.Color(theme?.threeColors?.secondary || '#6366f1');
    const accentColor = new THREE.Color(theme?.threeColors?.accent || '#14b8a6');

    // Wireframe Mesh
    const wireMat = new THREE.MeshBasicMaterial({
      color: primaryColor,
      wireframe: true,
      transparent: true,
      opacity: isDarkMode ? 0.42 : 0.36,
      blending: isDarkMode ? THREE.AdditiveBlending : THREE.NormalBlending
    });
    const torusMesh = new THREE.Mesh(torusGeom, wireMat);
    scene.add(torusMesh);

    // Glowing Vertex Constellation on Torus Knot
    const knotPointsMat = new THREE.PointsMaterial({
      color: accentColor,
      size: isDarkMode ? 0.68 : 0.52,
      map: starTexture,
      transparent: true,
      opacity: isDarkMode ? 0.95 : 0.85,
      blending: isDarkMode ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false
    });
    const knotPoints = new THREE.Points(torusGeom, knotPointsMat);
    torusMesh.add(knotPoints);

    // 4. Radiant Core Glow Light
    const coreLight = new THREE.PointLight(primaryColor, isDarkMode ? 2.5 : 1.8, 35);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);
    coreLightRef.current = coreLight;

    // 5. Sacred Concentric Meditation Rings (Visible 3D Orbital Halos)
    const ringGroup = new THREE.Group();
    scene.add(ringGroup);

    const ringDefs = [
      { radius: 8.2, tube: 0.05, rx: Math.PI / 3, ry: 0.2 },
      { radius: 11.0, tube: 0.045, rx: Math.PI / 2.3, ry: -0.35 },
      { radius: 14.0, tube: 0.04, rx: Math.PI / 3.8, ry: 0.5 }
    ];

    const rings = ringDefs.map((def, idx) => {
      const ringGeom = new THREE.TorusGeometry(def.radius, def.tube, 12, 100);
      const ringMat = new THREE.MeshBasicMaterial({
        color: secondaryColor,
        transparent: true,
        wireframe: true,
        opacity: isDarkMode ? (0.55 - idx * 0.12) : (0.42 - idx * 0.1),
        blending: isDarkMode ? THREE.AdditiveBlending : THREE.NormalBlending
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.rotation.x = def.rx;
      ringMesh.rotation.y = def.ry;
      ringGroup.add(ringMesh);
      return { mesh: ringMesh, speed: (idx % 2 === 0 ? 1 : -1) * (0.06 + idx * 0.02) };
    });

    // 6. Floating Celestial Stardust Cloud (1000 particles)
    // Distributed both directly behind the card (inner cluster) and outer atmosphere
    const particleCount = 1000;
    const particleGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const phaseOffsets = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const isInner = i < 350; // Inner stars swimming right through the card
      const radius = isInner ? (1.5 + Math.random() * 6.5) : (7 + Math.random() * 18);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = (Math.random() - 0.5) * (isInner ? 12 : 22);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;

      // Color variation across theme palette
      const randChoice = Math.random();
      const col = randChoice < 0.4 ? primaryColor : (randChoice < 0.75 ? secondaryColor : accentColor);
      particleColors[i * 3] = col.r;
      particleColors[i * 3 + 1] = col.g;
      particleColors[i * 3 + 2] = col.b;

      phaseOffsets[i] = Math.random() * Math.PI * 2;
    }

    particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeom.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particlesMat = new THREE.PointsMaterial({
      size: isDarkMode ? 0.65 : 0.48,
      vertexColors: true,
      map: starTexture,
      transparent: true,
      opacity: isDarkMode ? 0.95 : 0.82,
      blending: isDarkMode ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false
    });

    const particles = new THREE.Points(particleGeom, particlesMat);
    scene.add(particles);

    // 7. Interactive Parallax Listeners
    const handlePointerMove = (e) => {
      const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
      const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0;
      mouseRef.current.targetX = ((clientX / window.innerWidth) - 0.5) * 2;
      mouseRef.current.targetY = -((clientY / window.innerHeight) - 0.5) * 2;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    // Window Resize Handler
    const handleResize = () => {
      if (!rendererRef.current) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 8. Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth pointer damping
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      // Parallax Camera Offset
      camera.position.x = mouseRef.current.x * 2.5;
      camera.position.y = mouseRef.current.y * 2.5;
      camera.lookAt(0, 0, 0);

      // Supernova pulse decay on like
      if (pulseRef.current > 0.005) {
        pulseRef.current *= 0.93;
      } else {
        pulseRef.current = 0;
      }

      // Swipe twist impulse decay on card change
      if (swipeAnimRef.current > 0.005) {
        swipeAnimRef.current *= 0.92;
      } else {
        swipeAnimRef.current = 0;
      }

      const pulseScale = 1 + pulseRef.current * 0.4;
      const breatheScale = (1 + Math.sin(elapsedTime * 0.7) * 0.07) * pulseScale;

      // Rotate & Breathe Torus Knot
      torusMesh.rotation.x = elapsedTime * 0.16 + (swipeAnimRef.current * 0.8);
      torusMesh.rotation.y = elapsedTime * 0.24 + (swipeAnimRef.current * 1.1);
      torusMesh.scale.set(breatheScale, breatheScale, breatheScale);

      // Rotate Concentric Rings
      rings.forEach((r) => {
        r.mesh.rotation.z += r.speed * 0.02;
        r.mesh.rotation.y += r.speed * 0.01;
      });

      // Wave undulation in particle field
      const posAttr = particleGeom.attributes.position;
      const posArray = posAttr.array;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const offset = phaseOffsets[i];
        
        const origX = originalPositions[i3];
        const origY = originalPositions[i3 + 1];
        const origZ = originalPositions[i3 + 2];

        const wave = Math.sin(elapsedTime * 0.8 + offset) * 0.45;
        const pulsePush = pulseRef.current * 4.0;

        posArray[i3] = origX * (1 + (wave * 0.06)) + (origX > 0 ? pulsePush : -pulsePush);
        posArray[i3 + 1] = origY * (1 + (wave * 0.06)) + (origY > 0 ? pulsePush : -pulsePush);
        posArray[i3 + 2] = origZ + Math.cos(elapsedTime * 0.5 + offset) * 0.7;
      }
      posAttr.needsUpdate = true;

      // Slow majestic cloud drift
      particles.rotation.y = elapsedTime * 0.035;
      particles.rotation.z = Math.sin(elapsedTime * 0.03) * 0.12;

      renderer.render(scene, camera);
    };

    animate();

    // 9. Cleanup on Unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('resize', handleResize);

      torusGeom.dispose();
      wireMat.dispose();
      knotPointsMat.dispose();
      particleGeom.dispose();
      particlesMat.dispose();
      starTexture.dispose();
      rings.forEach(r => {
        r.mesh.geometry.dispose();
        r.mesh.material.dispose();
      });

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
      coreLightRef.current.intensity = isDarkMode ? 2.5 : 1.8;
    }

    scene.traverse((obj) => {
      if (obj.isMesh && obj.geometry?.type === 'TorusKnotGeometry') {
        obj.material.color.copy(primary);
        obj.material.opacity = isDarkMode ? 0.42 : 0.36;
      }
      if (obj.isPoints && obj.geometry?.type === 'TorusKnotGeometry') {
        obj.material.color.copy(accent);
        obj.material.opacity = isDarkMode ? 0.95 : 0.85;
      }
      if (obj.isMesh && obj.geometry?.type === 'TorusGeometry') {
        obj.material.color.copy(secondary);
      }
      if (obj.isPoints && obj.geometry?.attributes?.color) {
        const colAttr = obj.geometry.attributes.color;
        const arr = colAttr.array;
        for (let i = 0; i < arr.length / 3; i++) {
          const rand = Math.random();
          const targetCol = rand < 0.4 ? primary : (rand < 0.75 ? secondary : accent);
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
      style={{ opacity: isDarkMode ? 1.0 : 0.92 }}
    />
  );
}
