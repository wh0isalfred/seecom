import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { getAudio, stopAudio } from '../audio';

const seeComModelPath = new URL('../assets/see-com.glb', import.meta.url).href;

export default function Landing({ onNavigate }) {
  const mountRef   = useRef(null);
  const modelRef   = useRef(null);
  const animRef    = useRef(null);
  const baseRotY   = useRef(0);
  const baseRotX   = useRef(0);
  const targetRotY = useRef(0);
  const targetRotX = useRef(0);
  const lastTX     = useRef(null);
  const lastTY     = useRef(null);

  const [ready, setReady]         = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume]       = useState(0.3);
  const [showVol, setShowVol]     = useState(false);
  const [isMobile, setIsMobile]   = useState(window.innerWidth < 768);

  // Responsive
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  // Audio
  useEffect(() => {
    const audio = getAudio();
    audio.volume = 0.3;
    audio.play().catch(() => {
      const unlock = () => { audio.play().catch(() => {}); };
      window.addEventListener('touchstart', unlock, { once: true });
      window.addEventListener('mousedown',  unlock, { once: true });
    });
    return () => stopAudio();
  }, []);

  useEffect(() => {
    const audio = getAudio();
    if (!audio) return;
    audio.volume = volume;
    if (isPlaying && volume > 0) audio.play().catch(() => {});
    else audio.pause();
  }, [isPlaying, volume]);

  // Mouse rotation
  useEffect(() => {
    const onMove = e => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      targetRotY.current = x * Math.PI * 0.3;
      targetRotX.current = y * Math.PI * 0.15;
      baseRotY.current = targetRotY.current;
      baseRotX.current = targetRotX.current;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // Touch rotation
  useEffect(() => {
    const onStart = e => {
      lastTX.current = e.touches[0].clientX;
      lastTY.current = e.touches[0].clientY;
    };
    const onMove = e => {
      if (lastTX.current === null) return;
      const dx = e.touches[0].clientX - lastTX.current;
      const dy = e.touches[0].clientY - lastTY.current;
      baseRotY.current += dx * 0.01;
      baseRotX.current -= dy * 0.01;
      baseRotX.current = Math.max(-0.5, Math.min(0.5, baseRotX.current));
      targetRotY.current = baseRotY.current;
      targetRotX.current = baseRotX.current;
      lastTX.current = e.touches[0].clientX;
      lastTY.current = e.touches[0].clientY;
    };
    const onEnd = () => { lastTX.current = null; lastTY.current = null; };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove',  onMove,  { passive: true });
    window.addEventListener('touchend',   onEnd,   { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove',  onMove);
      window.removeEventListener('touchend',   onEnd);
    };
  }, []);

  // Three.js
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const W = window.innerWidth;
    const H = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 1000);
    camera.position.z = 20; // temporary — overwritten by auto-fit after model loads

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const key = new THREE.DirectionalLight(0xffeedd, 2.0);
    key.position.set(4, 6, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xc8d8ff, 0.7);
    fill.position.set(-5, 2, 3);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xbe1826, 0.5);
    rim.position.set(0, -5, -4);
    scene.add(rim);

    const loader = new GLTFLoader();
    loader.load(seeComModelPath, gltf => {
      const model = gltf.scene;
      model.scale.set(0.35, 0.35, 0.35);
      modelRef.current = model;
      scene.add(model);

      // Compute bounding box AFTER scale applied
      const box    = new THREE.Box3().setFromObject(model);
      const size   = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);

      // Centre the model at origin
      model.position.sub(center);

      // Fit camera so the entire model is visible with breathing room
      const maxDim  = Math.max(size.x, size.y, size.z);
      const fovRad  = (camera.fov * Math.PI) / 180;
      // Distance needed to fit the tallest dimension in view
      let   dist    = (maxDim / 2) / Math.tan(fovRad / 2);
      // Also account for width on wide screens
      const aspect  = camera.aspect;
      const distW   = (maxDim / 2) / Math.tan((fovRad * aspect) / 2);
      dist = Math.max(dist, distW) * 1.35; // 1.35 = comfortable padding

      camera.position.z = dist;
      camera.near = dist * 0.01;
      camera.far  = dist * 10;
      camera.updateProjectionMatrix();

      setTimeout(() => setReady(true), 80);
    }, undefined, err => console.error(err));

    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      if (modelRef.current) {
        // Slow idle rotation
        targetRotY.current += 0.002;
        baseRotY.current    = targetRotY.current;
        modelRef.current.rotation.y += (targetRotY.current - modelRef.current.rotation.y) * 0.05;
        modelRef.current.rotation.x += (targetRotX.current - modelRef.current.rotation.x) * 0.05;
      }
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const nW = window.innerWidth;
      const nH = window.innerHeight;
      camera.aspect = nW / nH;
      // Refit the model if it's loaded
      if (modelRef.current) {
        const box   = new THREE.Box3().setFromObject(modelRef.current);
        const size  = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const fovRad = (camera.fov * Math.PI) / 180;
        let dist     = (maxDim / 2) / Math.tan(fovRad / 2);
        const distW  = (maxDim / 2) / Math.tan((fovRad * camera.aspect) / 2);
        dist = Math.max(dist, distW) * 1.35;
        camera.position.z = dist;
      }
      camera.updateProjectionMatrix();
      renderer.setSize(nW, nH);
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', onResize);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);
// #0c0c0c
  return (
    <div style={{
      position: 'relative', width: '100vw', height: '100dvh',
      overflow: 'hidden', backgroundColor: '#ffffff',
      userSelect: 'none',
    }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Canvas — full bleed */}
      <div ref={mountRef} style={{ position: 'absolute', inset: 0, zIndex: 1, touchAction: 'none' }} />

      {/* Logo — top center */}
      <div style={{
        position: 'absolute', top: isMobile ? 24 : 32,
        left: 0, right: 0, textAlign: 'center', zIndex: 10,
        animation: ready ? 'fadeIn 0.8s 0.3s both' : 'none',
        opacity: ready ? undefined : 0,
      }}>
        <span style={{
          fontFamily: "'Clash Display', sans-serif",
          fontWeight: 600,
          fontSize: isMobile ? 18 : 22,
          letterSpacing: '0.26em',
          color: '#0c0c0c',
        }}>
          See.Com
        </span>
      </div>

      {/* Music — single hover zone wraps both button and slider */}
      <div
        onMouseEnter={() => !isMobile && setShowVol(true)}
        onMouseLeave={() => !isMobile && setShowVol(false)}
        style={{
          position: 'absolute', top: isMobile ? 18 : 26, right: isMobile ? 16 : 28,
          zIndex: 10, display: 'flex', alignItems: 'center', gap: 8,
          animation: ready ? 'fadeIn 0.8s 0.4s both' : 'none',
          opacity: ready ? undefined : 0,
        }}
      >
        {showVol && (
          <input
            type="range" min="0" max="1" step="0.01" value={volume}
            onChange={e => {
              const v = parseFloat(e.target.value);
              setVolume(v);
              if (v > 0 && !isPlaying) setIsPlaying(true);
            }}
            style={{ width: isMobile ? 64 : 80, accentColor: '#be1826', cursor: 'pointer', verticalAlign: 'middle' }}
          />
        )}
        <button
          onClick={() => {
            if (isMobile) {
              // On mobile: first tap = show/hide slider, tap again to toggle play
              if (!showVol) { setShowVol(true); return; }
              setIsPlaying(p => !p);
            } else {
              setIsPlaying(p => !p);
            }
          }}
          aria-label="Music"
          style={{
            width: 32, height: 32, borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(6px)',
            color: isPlaying && volume > 0 ? '#be1826' : 'rgba(255,255,255,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'color 0.2s',
            WebkitTapHighlightColor: 'transparent',
            flexShrink: 0,
          }}
        >
          {isPlaying && volume > 0
            ? <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
            : <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          }
        </button>
      </div>

      {/* Drag hint — mobile only, bottom center above strip */}
      {isMobile && ready && (
        <p style={{
          position: 'absolute',
          bottom: 72,
          left: 0, right: 0, textAlign: 'center',
          fontFamily: "'Archivo', sans-serif",
          fontSize: 8, letterSpacing: '0.22em',
          color: 'rgba(255,255,255,0.2)',
          textTransform: 'uppercase',
          margin: 0, zIndex: 10,
          pointerEvents: 'none',
          animation: 'fadeIn 1s 1.5s both',
        }}>
          drag to rotate
        </p>
      )}

      {/* Red strip — enter the store */}
      <div
        onClick={() => onNavigate('home')}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: isMobile ? 52 : 58,
          backgroundColor: '#be1826',
          zIndex: 10, cursor: 'pointer',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 12,
          opacity: ready ? 1 : 0,
          animation: ready ? 'slideUp 0.7s 0.8s both' : 'none',
          transition: 'filter 0.2s',
          WebkitTapHighlightColor: 'transparent',
        }}
        onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.08)'}
        onMouseLeave={e => e.currentTarget.style.filter = 'none'}
      >
        <span style={{
          fontFamily: "'Clash Display', sans-serif",
          fontWeight: 600,
          fontSize: isMobile ? 12 : 14,
          letterSpacing: '0.3em',
          color: '#fff',
        }}>
          see.SHOP
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
}
