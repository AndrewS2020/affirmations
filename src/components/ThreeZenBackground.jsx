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
  gradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.7)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.25)');
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
  const pulseRef = useRef(0);
  const swipeAnimRef = useRef(0);

  // Mouse / Touch interaction coords
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  // Update pulse trigger from props
  useEffect(() => {
    if (pulseTrigger > 0) {
      pulseRef.current = 1.0;
    }
  }, [pulseTrigger]);

  useEffect(() => {
    if (swipeTrigger !== 0) {
      swipeAnimRef.current = 1.0;
    }
  }, [swipeTrigger]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Dimensions
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.z = 24;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // Transparent background
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    const starTexture = createGlowTexture();

    // 3. Sacred Central Geometry: Breathing Ethereal Torus Knot
    const torusGeom = new THREE.TorusKnotGeometry(4.8, 1.2, 100, 24, 2, 3);
    
    // Wireframe Mesh
    const wireMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(theme?.threeColors?.primary || '#06b6d4'),
      wireframe: true,
      transparent: true,
      opacity: isDarkMode ? 0.16 : 0.12,
      blending: isDarkMode ? THREE.AdditiveBlending : THREE.NormalBlending
    });
    const torusMesh = new THREE.Mesh(torusGeom, wireMat);
    scene.add(torusMesh);

    // Glowing Vertex Constellation on Torus Knot
    const knotPointsMat = new THREE.PointsMaterial({
      color: new THREE.Color(theme?.threeColors?.accent || '#14b8a6'),
      size: isDarkMode ? 0.35 : 0.28,
      map: starTexture,
      transparent: true,
      opacity: isDarkMode ? 0.85 : 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const knotPoints = new THREE.Points(torusGeom, knotPointsMat);
    torusMesh.add(knotPoints);

    // 4. Sacred Concentric Meditation Rings
    const ringGroup = new THREE.Group();
    scene.add(ringGroup);

    const ringCount = 3;
    const rings = [];
    for (let i = 0; i < ringCount; i++) {
      const ringGeom = new THREE.RingGeometry(6 + i * 2.2, 6.06 + i * 2.2, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(theme?.threeColors?.secondary || '#6366f1'),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: (isDarkMode ? 0.2 : 0.12) - i * 0.04,
        blending: isDarkMode ? THREE.AdditiveBlending : THREE.NormalBlending
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.rotation.x = Math.PI / 2.5 + (i * 0.2);
      ringGroup.add(ringMesh);
      rings.push(ringMesh);
    }

    // 5. Floating Celestial Stardust Cloud (800 particles)
    const particleCount = 800;
    const particleGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);
    const phaseOffsets = new Float32Array(particleCount);

    const primaryCol = new THREE.Color(theme?.threeColors?.primary || '#06b6d4');
    const secCol = new THREE.Color(theme?.threeColors?.secondary || '#6366f1');
    const accCol = new THREE.Color(theme?.threeColors?.accent || '#14b8a6');

    for (let i = 0; i < particleCount; i++) {
      const radius = 5 + Math.random() * 22;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = (Math.random() - 0.5) * 16;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;

      // Color variation across theme palette
      const randChoice = Math.random();
      const col = randChoice < 0.45 ? primaryCol : (randChoice < 0.8 ? secCol : accCol);
      particleColors[i * 3] = col.r;
      particleColors[i * 3 + 1] = col.g;
      particleColors[i * 3 + 2] = col.b;

      scales[i] = 0.2 + Math.random() * 0.45;
      phaseOffsets[i] = Math.random() * Math.PI * 2;
    }

    particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeom.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particlesMat = new THREE.PointsMaterial({
      size: isDarkMode ? 0.4 : 0.3,
      vertexColors: true,
      map: starTexture,
      transparent: true,
      opacity: isDarkMode ? 0.75 : 0.45,
      blending: isDarkMode ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false
    });

    const particles = new THREE.Points(particleGeom, particlesMat);
    scene.add(particles);

    // 6. Pointer & Parallax Listeners
    const handlePointerMove = (e) => {
      const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
      const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0;
      mouseRef.current.targetX = ((clientX / window.innerWidth) - 0.5) * 2;
      mouseRef.current.targetY = -((clientY / window.innerHeight) - 0.5) * 2;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    // Resize handler
    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 7. Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth pointer damping
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      // Parallax Camera Offset
      camera.position.x = mouseRef.current.x * 2.2;
      camera.position.y = mouseRef.current.y * 2.2;
      camera.lookAt(0, 0, 0);

      // Handle Heart pulse supernova decay
      if (pulseRef.current > 0.005) {
        pulseRef.current *= 0.94;
      } else {
        pulseRef.current = 0;
      }

      // Handle swipe twist decay
      if (swipeAnimRef.current > 0.005) {
        swipeAnimRef.current *= 0.92;
      } else {
        swipeAnimRef.current = 0;
      }

      const pulseScale = 1 + pulseRef.current * 0.35;
      const breatheScale = (1 + Math.sin(elapsedTime * 0.7) * 0.06) * pulseScale;

      // Rotate & Breathe Torus Knot
      torusMesh.rotation.x = elapsedTime * 0.15 + (swipeAnimRef.current * 0.6);
      torusMesh.rotation.y = elapsedTime * 0.22 + (swipeAnimRef.current * 0.8);
      torusMesh.scale.set(breatheScale, breatheScale, breatheScale);

      // Rotate Concentric Rings
      rings.forEach((r, idx) => {
        r.rotation.z = elapsedTime * (0.08 + idx * 0.03) * (idx % 2 === 0 ? 1 : -1);
      });

      // Animate Particles
      const posAttr = particleGeom.attributes.position;
      const posArray = posAttr.array;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const offset = phaseOffsets[i];
        
        // Gentle wave drift
        const origX = originalPositions[i3];
        const origY = originalPositions[i3 + 1];
        const origZ = originalPositions[i3 + 2];

        const wave = Math.sin(elapsedTime * 0.8 + offset) * 0.4;
        const pulsePush = pulseRef.current * 3.5;

        posArray[i3] = origX * (1 + (wave * 0.05)) + (origX > 0 ? pulsePush : -pulsePush);
        posArray[i3 + 1] = origY * (1 + (wave * 0.05)) + (origY > 0 ? pulsePush : -pulsePush);
        posArray[i3 + 2] = origZ + Math.cos(elapsedTime * 0.5 + offset) * 0.6;
      }
      posAttr.needsUpdate = true;

      // Slow overall cloud rotation
      particles.rotation.y = elapsedTime * 0.04;
      particles.rotation.z = Math.sin(elapsedTime * 0.03) * 0.1;

      renderer.render(scene, camera);
    };

    animate();

    // 8. Cleanup
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
        r.geometry.dispose();
        r.material.dispose();
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

    scene.traverse((obj) => {
      if (obj.isMesh && obj.geometry.type === 'TorusKnotGeometry') {
        obj.material.color.copy(primary);
        obj.material.opacity = isDarkMode ? 0.16 : 0.12;
      }
      if (obj.isPoints && obj.geometry.type === 'TorusKnotGeometry') {
        obj.material.color.copy(accent);
        obj.material.opacity = isDarkMode ? 0.85 : 0.55;
      }
      if (obj.isMesh && obj.geometry.type === 'RingGeometry') {
        obj.material.color.copy(secondary);
      }
      if (obj.isPoints && obj.geometry.attributes.color) {
        const colAttr = obj.geometry.attributes.color;
        const arr = colAttr.array;
        for (let i = 0; i < arr.length / 3; i++) {
          const rand = Math.random();
          const targetCol = rand < 0.45 ? primary : (rand < 0.8 ? secondary : accent);
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
      className="absolute inset-0 pointer-events-none overflow-hidden -z-10 transition-opacity duration-1000"
      style={{ opacity: isDarkMode ? 0.95 : 0.75 }}
    />
  );
}
