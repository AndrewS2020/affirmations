import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeBreatheMandala({ 
  currentAction = 'inhale', // 'inhale' | 'hold' | 'exhale' | 'pause'
  isActive = false, 
  timeLeft = 4, 
  totalDuration = 4,
  isDarkMode = true 
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const targetScaleRef = useRef(1.0);
  const currentScaleRef = useRef(1.0);
  const petalsGroupRef = useRef(null);
  const coreMeshRef = useRef(null);
  const particleSystemRef = useRef(null);

  // Touch rotation
  const isDraggingRef = useRef(false);
  const prevPointerRef = useRef({ x: 0, y: 0 });
  const rotVelocityRef = useRef({ x: 0, y: 0 });

  // Update target scale based on phase
  useEffect(() => {
    if (!isActive) {
      targetScaleRef.current = 0.95;
      return;
    }

    if (currentAction === 'inhale') {
      targetScaleRef.current = 1.35;
    } else if (currentAction === 'hold') {
      targetScaleRef.current = 1.38;
    } else if (currentAction === 'exhale') {
      targetScaleRef.current = 0.85;
    } else if (currentAction === 'pause') {
      targetScaleRef.current = 0.82;
    }
  }, [currentAction, isActive]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 300;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 16;

    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 1. Core Sacred Icosahedron Crystal
    const coreGeom = new THREE.IcosahedronGeometry(1.6, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(isDarkMode ? 0x38bdf8 : 0x0284c7),
      wireframe: true,
      transparent: true,
      opacity: isDarkMode ? 0.7 : 0.6
    });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    scene.add(coreMesh);
    coreMeshRef.current = coreMesh;

    // Glowing Inner Pearl
    const pearlGeom = new THREE.SphereGeometry(0.8, 32, 32);
    const pearlMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(isDarkMode ? 0xffffff : 0x9333ea),
      transparent: true,
      opacity: isDarkMode ? 0.9 : 0.75
    });
    const pearlMesh = new THREE.Mesh(pearlGeom, pearlMat);
    coreMesh.add(pearlMesh);

    // 2. Blooming Sacred Lotus Petal Layers
    const petalsGroup = new THREE.Group();
    scene.add(petalsGroup);
    petalsGroupRef.current = petalsGroup;

    const petalCount = 8;
    const layers = [
      { radius: 2.8, tube: 0.12, rotZ: 0, color: isDarkMode ? 0xa855f7 : 0x7c3aed },
      { radius: 3.8, tube: 0.1, rotZ: Math.PI / 8, color: isDarkMode ? 0xec4899 : 0xdb2777 },
      { radius: 4.8, tube: 0.08, rotZ: Math.PI / 4, color: isDarkMode ? 0x06b6d4 : 0x0891b2 }
    ];

    layers.forEach((layer) => {
      for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI * 2;
        const petalGeom = new THREE.TorusGeometry(layer.radius, layer.tube, 16, 48, Math.PI);
        const petalMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(layer.color),
          transparent: true,
          opacity: isDarkMode ? 0.35 : 0.25,
          blending: isDarkMode ? THREE.AdditiveBlending : THREE.NormalBlending
        });
        const petalMesh = new THREE.Mesh(petalGeom, petalMat);

        petalMesh.position.x = Math.cos(angle) * (layer.radius * 0.45);
        petalMesh.position.y = Math.sin(angle) * (layer.radius * 0.45);
        petalMesh.rotation.z = angle + layer.rotZ;
        petalMesh.rotation.x = Math.PI / 3;

        petalsGroup.add(petalMesh);
      }
    });

    // 3. Orbital Prismatic Particle Halo (300 particles)
    const haloCount = 300;
    const haloGeom = new THREE.BufferGeometry();
    const haloPos = new Float32Array(haloCount * 3);
    const haloAngles = new Float32Array(haloCount);
    const haloRadii = new Float32Array(haloCount);
    const haloSpeeds = new Float32Array(haloCount);

    for (let i = 0; i < haloCount; i++) {
      const radius = 3.5 + Math.random() * 3.5;
      const angle = Math.random() * Math.PI * 2;
      haloPos[i * 3] = Math.cos(angle) * radius;
      haloPos[i * 3 + 1] = Math.sin(angle) * radius;
      haloPos[i * 3 + 2] = (Math.random() - 0.5) * 2;

      haloAngles[i] = angle;
      haloRadii[i] = radius;
      haloSpeeds[i] = 0.005 + Math.random() * 0.015;
    }

    haloGeom.setAttribute('position', new THREE.BufferAttribute(haloPos, 3));

    const haloMat = new THREE.PointsMaterial({
      color: new THREE.Color(isDarkMode ? 0xfef08a : 0xeab308),
      size: 0.18,
      transparent: true,
      opacity: isDarkMode ? 0.8 : 0.6,
      blending: isDarkMode ? THREE.AdditiveBlending : THREE.NormalBlending
    });

    const haloParticles = new THREE.Points(haloGeom, haloMat);
    scene.add(haloParticles);
    particleSystemRef.current = haloParticles;

    // 4. Touch & Pointer Interaction
    const handleDown = (e) => {
      isDraggingRef.current = true;
      const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
      const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0;
      prevPointerRef.current = { x: clientX, y: clientY };
    };

    const handleMove = (e) => {
      if (!isDraggingRef.current) return;
      const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
      const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0;
      const deltaX = clientX - prevPointerRef.current.x;
      const deltaY = clientY - prevPointerRef.current.y;
      prevPointerRef.current = { x: clientX, y: clientY };

      rotVelocityRef.current.y += deltaX * 0.005;
      rotVelocityRef.current.x += deltaY * 0.005;
    };

    const handleUp = () => {
      isDraggingRef.current = false;
    };

    container.addEventListener('pointerdown', handleDown);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);

    container.addEventListener('touchstart', handleDown, { passive: true });
    window.addEventListener('touchmove', handleMove, { passive: true });
    window.addEventListener('touchend', handleUp);

    // 5. Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth interpolation toward target scale (breathe physics)
      const lerpSpeed = currentAction === 'inhale' ? 0.035 : 0.045;
      currentScaleRef.current += (targetScaleRef.current - currentScaleRef.current) * lerpSpeed;
      const s = currentScaleRef.current;

      // Apply scale to groups
      if (petalsGroupRef.current) {
        petalsGroupRef.current.scale.set(s, s, s);
        petalsGroupRef.current.rotation.z += (rotVelocityRef.current.y + 0.004);
        petalsGroupRef.current.rotation.x += rotVelocityRef.current.x;
      }

      if (coreMeshRef.current) {
        const coreScale = s * (1 + Math.sin(elapsed * 2.5) * 0.04);
        coreMeshRef.current.scale.set(coreScale, coreScale, coreScale);
        coreMeshRef.current.rotation.y += 0.015;
        coreMeshRef.current.rotation.x += 0.008;
      }

      // Inertia damping for touch spin
      rotVelocityRef.current.x *= 0.94;
      rotVelocityRef.current.y *= 0.94;

      // Animate halo particles
      if (haloParticles) {
        const posArr = haloGeom.attributes.position.array;
        for (let i = 0; i < haloCount; i++) {
          haloAngles[i] += haloSpeeds[i] * (currentAction === 'inhale' ? 1.8 : 1.0);
          const currentRadius = haloRadii[i] * s;
          posArr[i * 3] = Math.cos(haloAngles[i]) * currentRadius;
          posArr[i * 3 + 1] = Math.sin(haloAngles[i]) * currentRadius;
          posArr[i * 3 + 2] = Math.sin(elapsed + haloAngles[i] * 3) * 0.5;
        }
        haloGeom.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('pointerdown', handleDown);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      container.removeEventListener('touchstart', handleDown);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);

      coreGeom.dispose();
      coreMat.dispose();
      pearlGeom.dispose();
      pearlMat.dispose();
      haloGeom.dispose();
      haloMat.dispose();

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isDarkMode]);

  return (
    <div 
      ref={mountRef} 
      className="w-64 h-64 sm:w-72 sm:h-72 cursor-grab active:cursor-grabbing relative flex items-center justify-center select-none"
    />
  );
}
