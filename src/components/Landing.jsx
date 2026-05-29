import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FiInstagram } from 'react-icons/fi';

const TikTokIcon = ({ size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.99a8.26 8.26 0 0 0 4.83 1.56V7.1a4.85 4.85 0 0 1-1.06-.41z" />
  </svg>
);

const ShirtIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 2H8L7 8H6v13h12V8h-1L16 2zm-4 2h2v3h-2V4z" />
  </svg>
);

const seeComModelPath = new URL('../assets/see-com.glb', import.meta.url).href;
const musicPath = new URL('../assets/music.mp3', import.meta.url).href;

export default function Landing({ onNavigate }) {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const modelRef = useRef(null);
  const audioRef = useRef(null);
  const [time, setTime] = useState({ date: "", clock: "" });
  const [hoveredLink, setHoveredLink] = useState(null);
  const [hoveredSocial, setHoveredSocial] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [hoveredMusic, setHoveredMusic] = useState(false);
  const mouseX = useRef(0);
  const mouseY = useRef(0);
  const targetRotX = useRef(0);
  const targetRotY = useRef(0);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const clock = now.toLocaleTimeString("en-US", {
        timeZone: "Africa/Lagos",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
      const d = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Lagos" }));
      const date = `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
      setTime({ date, clock });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      if (isPlaying && volume > 0) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, volume]);

  const togglePlay = () => {
    if (volume === 0) {
      setVolume(0.5);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (hoveredMusic) {
        targetRotY.current = 0;
        targetRotX.current = 0;
        return;
      }

      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseX.current = x;
      mouseY.current = y;
      targetRotY.current = x * Math.PI * 0.4;
      targetRotX.current = y * Math.PI * 0.3;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Touch: rotate model on swipe
    const handleTouchStart = (e) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };
    const handleTouchMove = (e) => {
      if (touchStartX.current === null) return;
      const dx = e.touches[0].clientX - touchStartX.current;
      const dy = e.touches[0].clientY - touchStartY.current;
      targetRotY.current = (dx / window.innerWidth) * Math.PI * 2;
      targetRotX.current = -(dy / window.innerHeight) * Math.PI * 1.5;
    };
    const handleTouchEnd = () => {
      touchStartX.current = null;
      touchStartY.current = null;
      // Gently return to neutral
      targetRotX.current = 0;
      targetRotY.current = 0;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [hoveredMusic]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const getCanvasSize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      
      if (vw < 480) {
        return { W: Math.min(vw * 0.9, 350), H: Math.min(vh * 0.25, 220) };
      } else if (vw < 768) {
        return { W: Math.min(vw * 0.85, 450), H: Math.min(vh * 0.3, 280) };
      } else {
        return { W: Math.min(vw * 0.8, 600), H: Math.min(vh * 0.32, 320) };
      }
    };

    const { W, H } = getCanvasSize();
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0xedeae3, 0);
    rendererRef.current = renderer;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 1000);
    camera.position.z = 10;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    keyLight.position.set(5, 5, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xcccccc, 0.8);
    fillLight.position.set(-5, -3, 3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.6);
    rimLight.position.set(0, -5, -3);
    scene.add(rimLight);

    const loader = new GLTFLoader();
    loader.load(seeComModelPath, (gltf) => {
      const model = gltf.scene;
      model.scale.set(0.35, 0.35, 0.35);
      model.position.set(0, 0, 0);
      modelRef.current = model;
      scene.add(model);

      let animId;
      const animate = () => {
        animId = requestAnimationFrame(animate);
        
        if (modelRef.current) {
          modelRef.current.rotation.y += (targetRotY.current - modelRef.current.rotation.y) * 0.08;
          modelRef.current.rotation.x += (targetRotX.current - modelRef.current.rotation.x) * 0.08;
        }
        
        renderer.render(scene, camera);
      };
      animate();
    }, undefined, (error) => {
      console.error('Error loading GLB model:', error);
    });

    const handleResize = () => {
      if (!mount) return;
      const { W: newW, H: newH } = getCanvasSize();
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mount && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  const links = [
    { label: "SHOP NOW", href: "#", action: () => onNavigate('home') },
    { label: "SEE.TSHIRTS", href: "#", action: () => onNavigate('tshirts') },
    { label: "SEE.CHAINS", href: "#", action: () => onNavigate('chains') },
    { label: "SEE.RETURN POLICY", href: "#", action: () => onNavigate('home') }
  ];

  const socials = [
    { id: 'instagram', icon: FiInstagram, label: 'Instagram', href: '#' },
    { id: 'tiktok', icon: TikTokIcon, label: 'TikTok', href: '#' }
  ];

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      margin: 0,
      padding: 0,
      backgroundColor: "#ffffff",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      WebkitFontSmoothing: "antialiased",
      userSelect: "none",
      overflow: 'hidden',
      position: 'fixed',
      left: 0,
      top: 0,
    }}>

      <audio ref={audioRef} loop crossOrigin="anonymous">
        <source src={musicPath} type="audio/mpeg" />
      </audio>

      {/* Volume / Music control */}
      <div
        onMouseEnter={() => { setHoveredMusic(true); setShowVolumeControl(true); }}
        onMouseLeave={() => { setHoveredMusic(false); setShowVolumeControl(false); }}
        style={{ position: 'fixed', top: 20, right: 20, display: 'flex', alignItems: 'center', gap: 14, zIndex: 100 }}
      >
        {/* Volume slider — horizontal on mobile, vertical tube on desktop */}
        {showVolumeControl && (
          <div style={{ animation: 'slideInLeft 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}>
            {isMobile ? (
              /* ── Mobile: horizontal slider ── */
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill={volume > 0 ? '#be1826' : '#999'}>
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                </svg>
                <input
                  type="range" min="0" max="1" step="0.01" value={volume}
                  onChange={(e) => { setVolume(parseFloat(e.target.value)); if (parseFloat(e.target.value) > 0) setIsPlaying(true); }}
                  style={{ width: 80, height: 4, accentColor: '#be1826', cursor: 'pointer' }}
                />
              </div>
            ) : (
              /* ── Desktop: vertical tube ── */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ position: 'relative', width: 14, height: 140, background: 'rgba(200,200,200,0.3)', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(220,38,38,0.2)', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)' }}>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: `${volume * 100}%`, background: 'linear-gradient(180deg, #be1826 0%, #b91c1c 100%)', borderRadius: '10px 10px 0 0', transition: 'height 0.15s ease', boxShadow: '0 0 12px rgba(220,38,38,0.4)' }} />
                  <input
                    type="range" min="0" max="1" step="0.01" value={volume}
                    onChange={(e) => { setVolume(parseFloat(e.target.value)); if (parseFloat(e.target.value) > 0) setIsPlaying(true); }}
                    style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer', writingMode: 'bt-lr', appearance: 'slider-vertical', WebkitAppearance: 'slider-vertical' }}
                  />
                </div>
                <div style={{ color: volume > 0 ? '#be1826' : '#999', transition: 'color 0.2s ease' }}>
                  <ShirtIcon size={18} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Play/Pause button */}
        <button
          onClick={togglePlay}
          onTouchStart={() => { setShowVolumeControl(true); }}
          aria-label="Toggle music"
          style={{
            color: isPlaying && volume > 0 ? '#ffffff' : '#666',
            display: 'flex',
            background: isPlaying && volume > 0 ? 'linear-gradient(135deg, #be1826, #b91c1c)' : 'rgba(200,200,200,0.4)',
            backdropFilter: 'blur(10px)',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            padding: '12px',
            borderRadius: '50%',
            alignItems: 'center',
            justifyContent: 'center',
            width: isMobile ? 52 : 48,
            height: isMobile ? 52 : 48,
            boxShadow: isPlaying && volume > 0 ? '0 8px 24px rgba(220,38,38,0.3)' : 'none',
            transform: showVolumeControl ? 'scale(1.1)' : 'scale(1)',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {isPlaying && volume > 0 ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>
      </div>

      <style>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        input[type="range"] {
          -webkit-appearance: slider-vertical;
          writing-mode: bt-lr;
          appearance: slider-vertical;
        }
      `}</style>

      <div
        ref={mountRef}
        style={{ 
          marginBottom: 20, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          flex: '0 0 auto'
        }}
      />

      <div style={{
        width: 60,
        height: 3,
        backgroundColor: '#be1826',
        marginBottom: 20,
      }} />

      <p style={{
        margin: "0 0 26px",
        fontSize: 9,
        fontWeight: 500,
        letterSpacing: "0.22em",
        color: "#777",
        textTransform: "uppercase",
        lineHeight: 1,
      }}>
        {time.date}&nbsp;&nbsp;&nbsp;{time.clock}
      </p>

      <nav
        role="navigation"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: isMobile ? 18 : 14,
          marginBottom: isMobile ? 36 : 44,
        }}
      >
        {links.map(({ label, href, action }) => (
          <div key={label} style={{ position: 'relative' }}>
            <button
              onClick={action}
              onMouseEnter={() => setHoveredLink(label)}
              onMouseLeave={() => setHoveredLink(null)}
              style={{
                fontSize: isMobile ? 12 : 10.5,
                fontFamily: "'Arial Black', 'Impact', Arial, sans-serif",
                fontWeight: 600,
                letterSpacing: "0.26em",
                color: hoveredLink === label ? "#be1826" : "#1a1a1a",
                textDecoration: "none",
                textTransform: "uppercase",
                lineHeight: 1,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                transform: hoveredLink === label ? 'scale(1.12)' : 'scale(1)',
                padding: isMobile ? '10px 20px' : '4px 0',
                margin: 0,
                position: 'relative',
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
              }}
            >
              {label}
            </button>
            <div
              style={{
                position: 'absolute',
                bottom: isMobile ? 4 : -6,
                left: '50%',
                transform: 'translateX(-50%)',
                width: hoveredLink === label ? '80%' : '0%',
                height: 2,
                backgroundColor: '#be1826',
                transition: 'width 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              }}
            />
          </div>
        ))}
      </nav>
      </nav>

      <div style={{ display: "flex", gap: isMobile ? 32 : 22, alignItems: "center", flex: '0 0 auto' }}>
        {socials.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => {}}
            onMouseEnter={() => setHoveredSocial(id)}
            onMouseLeave={() => setHoveredSocial(null)}
            aria-label={label}
            style={{
              color: hoveredSocial === id ? "#be1826" : "#333",
              display: "flex",
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              transform: hoveredSocial === id ? 'scale(1.3)' : 'scale(1)',
              padding: isMobile ? '10px' : '0',
              margin: 0,
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 44,
              minHeight: 44,
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
            }}
          >
            {id === 'instagram' ? <Icon size={isMobile ? 24 : 20} strokeWidth={1.8} /> : <Icon size={isMobile ? 24 : 20} />}
          </button>
        ))}
      </div>
    </div>
  );
}
