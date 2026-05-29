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
const musicPath       = new URL('../assets/music.mp3',   import.meta.url).href;

export default function Landing({ onNavigate }) {
  const mountRef    = useRef(null);
  const rendererRef = useRef(null);
  const modelRef    = useRef(null);
  const cameraRef   = useRef(null);
  const audioRef    = useRef(null);

  const [time, setTime]                   = useState({ date: "", clock: "" });
  const [hoveredLink, setHoveredLink]     = useState(null);
  const [hoveredSocial, setHoveredSocial] = useState(null);
  const [isPlaying, setIsPlaying]         = useState(false);
  const [volume, setVolume]               = useState(0);
  const [showVolume, setShowVolume]       = useState(false);
  const [isMobile, setIsMobile]           = useState(window.innerWidth < 768);

  // Rotation targets (lerped in animation loop)
  const targetRotX  = useRef(0);
  const targetRotY  = useRef(0);
  // Accumulated base rotation (persists between gestures)
  const baseRotX    = useRef(0);
  const baseRotY    = useRef(0);
  // Last touch position for delta calculation
  const lastTouchX  = useRef(null);
  const lastTouchY  = useRef(null);

  // ── Clock ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const now   = new Date();
      const clock = now.toLocaleTimeString("en-US", {
        timeZone: "Africa/Lagos", hour: "2-digit", minute: "2-digit", hour12: true,
      });
      const days   = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
      const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
      const d = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Lagos" }));
      setTime({ date: `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`, clock });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ── Responsive breakpoint ──────────────────────────────────────────────────
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  // ── Audio ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
    if (isPlaying && volume > 0) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
  }, [isPlaying, volume]);

  const togglePlay = () => {
    if (volume === 0) { setVolume(0.5); setIsPlaying(true); }
    else setIsPlaying(p => !p);
  };

  // ── Mouse rotation ─────────────────────────────────────────────────────────
  useEffect(() => {
    const onMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth)  * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      targetRotY.current = x * Math.PI * 0.4;
      targetRotX.current = y * Math.PI * 0.3;
      baseRotX.current   = targetRotX.current;
      baseRotY.current   = targetRotY.current;
    };
    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  // ── Touch rotation (delta-based, no snap-back) ─────────────────────────────
  useEffect(() => {
    const onTouchStart = (e) => {
      lastTouchX.current = e.touches[0].clientX;
      lastTouchY.current = e.touches[0].clientY;
    };
    const onTouchMove = (e) => {
      if (lastTouchX.current === null) return;
      const dx = e.touches[0].clientX - lastTouchX.current;
      const dy = e.touches[0].clientY - lastTouchY.current;

      // Accumulate: each move adds a small delta to the base
      baseRotY.current += dx * 0.012;
      baseRotX.current -= dy * 0.012;

      // Clamp vertical tilt so model doesn't flip upside-down
      baseRotX.current = Math.max(-Math.PI * 0.4, Math.min(Math.PI * 0.4, baseRotX.current));

      targetRotY.current = baseRotY.current;
      targetRotX.current = baseRotX.current;

      lastTouchX.current = e.touches[0].clientX;
      lastTouchY.current = e.touches[0].clientY;
    };
    const onTouchEnd = () => {
      lastTouchX.current = null;
      lastTouchY.current = null;
      // No reset — model stays where user left it
    };

    window.addEventListener('touchstart',  onTouchStart, { passive: true });
    window.addEventListener('touchmove',   onTouchMove,  { passive: true });
    window.addEventListener('touchend',    onTouchEnd,   { passive: true });
    return () => {
      window.removeEventListener('touchstart',  onTouchStart);
      window.removeEventListener('touchmove',   onTouchMove);
      window.removeEventListener('touchend',    onTouchEnd);
    };
  }, []);

  // ── Three.js ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const getSize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (vw < 480) return { W: vw,             H: Math.round(vh * 0.38) };
      if (vw < 768) return { W: vw,             H: Math.round(vh * 0.36) };
      return               { W: Math.min(vw * 0.82, 640), H: Math.round(vh * 0.34) };
    };

    const { W, H } = getSize();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    // Wider FOV on mobile so model fills the frame
    const fov = window.innerWidth < 480 ? 52 : window.innerWidth < 768 ? 46 : 40;
    const camera = new THREE.PerspectiveCamera(fov, W / H, 0.1, 1000);
    // Move camera closer on mobile so model appears bigger
    camera.position.z = window.innerWidth < 480 ? 7.5 : window.innerWidth < 768 ? 8.5 : 10;
    cameraRef.current = camera;

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const k = new THREE.DirectionalLight(0xffffff, 1.5); k.position.set(5, 5, 5);   scene.add(k);
    const f = new THREE.DirectionalLight(0xcccccc, 0.8); f.position.set(-5, -3, 3); scene.add(f);
    const r = new THREE.DirectionalLight(0xffffff, 0.6); r.position.set(0, -5, -3); scene.add(r);

    const loader = new GLTFLoader();
    loader.load(seeComModelPath, (gltf) => {
      const model = gltf.scene;
      model.scale.set(0.35, 0.35, 0.35);
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

      return () => cancelAnimationFrame(animId);
    }, undefined, (err) => console.error('GLB load error:', err));

    const onResize = () => {
      const { W: nW, H: nH } = getSize();
      camera.fov    = window.innerWidth < 480 ? 52 : window.innerWidth < 768 ? 46 : 40;
      camera.aspect = nW / nH;
      camera.position.z = window.innerWidth < 480 ? 7.5 : window.innerWidth < 768 ? 8.5 : 10;
      camera.updateProjectionMatrix();
      renderer.setSize(nW, nH);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  // ── Data ───────────────────────────────────────────────────────────────────
  const links = [
    { label: "SHOP NOW",           action: () => onNavigate('home')    },
    { label: "SEE.TSHIRTS",        action: () => onNavigate('tshirts') },
    { label: "SEE.CHAINS",         action: () => onNavigate('chains')  },
    { label: "SEE.RETURN POLICY",  action: () => onNavigate('home')    },
  ];
  const socials = [
    { id: 'instagram', icon: FiInstagram, label: 'Instagram' },
    { id: 'tiktok',    icon: TikTokIcon,  label: 'TikTok'    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      width: '100vw',
      minHeight: '100dvh',       // dvh = dynamic viewport height (respects mobile browser chrome)
      margin: 0, padding: 0,
      backgroundColor: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      WebkitFontSmoothing: 'antialiased',
      userSelect: 'none',
      overflowX: 'hidden',
      overflowY: 'auto',         // allow scroll on very small phones
      boxSizing: 'border-box',
      paddingTop: isMobile ? 16 : 0,
      paddingBottom: isMobile ? 24 : 0,
    }}>

      <audio ref={audioRef} loop crossOrigin="anonymous">
        <source src={musicPath} type="audio/mpeg" />
      </audio>

      {/* ── Music control ── */}
      <div
        onMouseEnter={() => setShowVolume(true)}
        onMouseLeave={() => setShowVolume(false)}
        style={{ position: 'fixed', top: 20, right: 20, display: 'flex', alignItems: 'center', gap: 12, zIndex: 200 }}
      >
        {showVolume && (
          <div style={{ animation: 'fadeSlideIn 0.3s ease', display: 'flex', alignItems: 'center', gap: 8 }}>
            {isMobile ? (
              // Horizontal slider on mobile
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill={volume > 0 ? '#be1826' : '#aaa'}>
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                </svg>
                <input
                  type="range" min="0" max="1" step="0.01" value={volume}
                  onChange={e => { setVolume(parseFloat(e.target.value)); if (parseFloat(e.target.value) > 0) setIsPlaying(true); }}
                  style={{ width: 72, accentColor: '#be1826', cursor: 'pointer', touchAction: 'none' }}
                />
              </>
            ) : (
              // Vertical tube on desktop
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ position: 'relative', width: 14, height: 130, background: 'rgba(200,200,200,0.3)', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(220,38,38,0.2)' }}>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: `${volume * 100}%`, background: 'linear-gradient(180deg,#be1826,#b91c1c)', borderRadius: '10px 10px 0 0', transition: 'height 0.15s' }} />
                  <input
                    type="range" min="0" max="1" step="0.01" value={volume}
                    onChange={e => { setVolume(parseFloat(e.target.value)); if (parseFloat(e.target.value) > 0) setIsPlaying(true); }}
                    style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer', writingMode: 'vertical-lr', direction: 'rtl' }}
                  />
                </div>
                <ShirtIcon size={16} style={{ color: volume > 0 ? '#be1826' : '#999' }} />
              </div>
            )}
          </div>
        )}

        <button
          onClick={togglePlay}
          onTouchStart={() => setShowVolume(true)}
          aria-label="Toggle music"
          style={{
            width: isMobile ? 52 : 48, height: isMobile ? 52 : 48,
            borderRadius: '50%', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isPlaying && volume > 0 ? 'linear-gradient(135deg,#be1826,#b91c1c)' : 'rgba(200,200,200,0.4)',
            color: isPlaying && volume > 0 ? '#fff' : '#666',
            boxShadow: isPlaying && volume > 0 ? '0 6px 20px rgba(190,24,38,0.35)' : 'none',
            transition: 'all 0.3s ease',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
          }}
        >
          {isPlaying && volume > 0
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          }
        </button>
      </div>

      {/* ── Touch hint on mobile (disappears after 2s once model loads) ── */}
      {isMobile && (
        <p style={{
          position: 'absolute', top: 20, left: 0, right: 0, textAlign: 'center',
          fontSize: 9, letterSpacing: '0.16em', color: '#ccc', textTransform: 'uppercase',
          margin: 0, pointerEvents: 'none', zIndex: 10,
        }}>
          drag to rotate
        </p>
      )}

      {/* ── 3D Canvas ── */}
      <div
        ref={mountRef}
        style={{
          width: isMobile ? '100%' : 'auto',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: isMobile ? 12 : 20,
          flex: '0 0 auto',
          touchAction: 'none', // prevents browser scroll hijack during drag
        }}
      />

      {/* ── Red divider ── */}
      <div style={{ width: 52, height: 3, backgroundColor: '#be1826', marginBottom: isMobile ? 14 : 20 }} />

      {/* ── Date / time ── */}
      <p style={{
        margin: `0 0 ${isMobile ? 20 : 26}px`,
        fontSize: isMobile ? 8.5 : 9,
        fontWeight: 500,
        letterSpacing: '0.2em',
        color: '#888',
        textTransform: 'uppercase',
        lineHeight: 1,
        textAlign: 'center',
        padding: '0 16px',
      }}>
        {time.date}&nbsp;&nbsp;&nbsp;{time.clock}
      </p>

      {/* ── Nav links ── */}
      <nav role="navigation" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: isMobile ? 4 : 14,
        marginBottom: isMobile ? 28 : 44,
      }}>
        {links.map(({ label, action }) => (
          <div key={label} style={{ position: 'relative' }}>
            <button
              onClick={action}
              onMouseEnter={() => setHoveredLink(label)}
              onMouseLeave={() => setHoveredLink(null)}
              style={{
                fontSize: isMobile ? 11 : 10.5,
                fontFamily: "'Arial Black', 'Impact', Arial, sans-serif",
                fontWeight: 600,
                letterSpacing: '0.24em',
                color: hoveredLink === label ? '#be1826' : '#1a1a1a',
                textTransform: 'uppercase',
                lineHeight: 1,
                background: 'none', border: 'none', cursor: 'pointer',
                padding: isMobile ? '11px 24px' : '6px 4px',
                margin: 0,
                display: 'flex', alignItems: 'center',
                minHeight: 44,
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                transition: 'color 0.25s ease',
              }}
            >
              {label}
            </button>
            <div style={{
              position: 'absolute', bottom: isMobile ? 5 : -4, left: '50%',
              transform: 'translateX(-50%)',
              width: hoveredLink === label ? '70%' : '0%', height: 2,
              backgroundColor: '#be1826',
              transition: 'width 0.3s ease',
            }} />
          </div>
        ))}
      </nav>

      {/* ── Social icons ── */}
      <div style={{ display: 'flex', gap: isMobile ? 36 : 22, alignItems: 'center' }}>
        {socials.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => {}}
            onMouseEnter={() => setHoveredSocial(id)}
            onMouseLeave={() => setHoveredSocial(null)}
            aria-label={label}
            style={{
              color: hoveredSocial === id ? '#be1826' : '#333',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: isMobile ? '8px' : '0',
              minWidth: 44, minHeight: 44,
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              transition: 'color 0.25s ease',
              transform: hoveredSocial === id ? 'scale(1.25)' : 'scale(1)',
            }}
          >
            {id === 'instagram'
              ? <Icon size={isMobile ? 22 : 20} strokeWidth={1.8} />
              : <Icon size={isMobile ? 22 : 20} />
            }
          </button>
        ))}
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
