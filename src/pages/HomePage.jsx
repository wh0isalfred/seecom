import { useState, useEffect, useRef, useCallback } from 'react';
import heroVideoDesktop from '../assets/hero-video-desktop.mp4';
import heroVideoMobile  from '../assets/hero-video-mobile.mp4';
import heroPoster       from '../assets/hero-poster.jpg';
import shopAllImage  from '../assets/shopallsection.jpeg';
import lookbookImage from '../assets/lookbook3.webp';
import { fetchProducts } from '../services/products';
import { subscribeEmail } from '../services/subscribersService';
import { useAsyncFetch } from '../utils/useAsyncFetch';
import FetchErrorState from '../components/FetchErrorState';
import ProductCard from '../components/ProductCard';
import { useResponsiveGrid } from '../utils/responsiveGrid';
import Footer from '../components/Footer';

// Scroll reveal hook
function useInView(rootMargin = '0px 0px -60px 0px') {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.unobserve(el); } },
      { threshold: 0, rootMargin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

// Parallax hook — returns scroll offset
function useParallax(speed = 0.15) {
  const ref    = useRef(null);
  const [y, setY] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const center = rect.top + rect.height / 2 - window.innerHeight / 2;
      setY(center * speed);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [speed]);
  return [ref, y];
}

function ViewToggle({ showPrice, setShowPrice }) {
  return (
    <div style={{ display: 'inline-flex', border: '1px solid #000', borderRadius: '24px', padding: '4px' }}>
      <button onClick={() => setShowPrice(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '20px', border: 'none', background: showPrice ? 'transparent' : '#000', cursor: 'pointer', color: showPrice ? '#000' : '#fff', transition: 'all 0.2s' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M5 20c0-3.314 3.582-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </button>
      <button onClick={() => setShowPrice(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '20px', border: 'none', background: showPrice ? '#bd3b28' : 'transparent', cursor: 'pointer', color: showPrice ? '#fff' : '#000', transition: 'all 0.2s' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg>
      </button>
    </div>
  );
}

export default function HomePage({ onNavigate }) {
  const [showPrice, setShowPrice]             = useState(false);
  const [heroReady, setHeroReady]             = useState(false);
  const [isMobile, setIsMobile]               = useState(window.innerWidth < 768);
  const heroRef = useRef(null);
  const gridColumns = useResponsiveGrid();

  const newArrivalsFetcher = useCallback(() => fetchProducts(null, null, 5, true), []);
  const { data: products, loading, error, retry } = useAsyncFetch(newArrivalsFetcher);

  const shopAllFetcher = useCallback(() => fetchProducts(null, null, 10, false), []);
  const { data: shopAllProducts, loading: shopAllLoading, error: shopAllError, retry: retryShopAll } = useAsyncFetch(shopAllFetcher);

  const [arrivalsRef, arrivalsInView]   = useInView();
  const [bannerRef, bannerParallaxY]    = useParallax(0.12);
  const [shopGridRef, shopGridInView]   = useInView();
  const [editorialRef, editorialInView] = useInView();
  const [communityRef, communityInView] = useInView();

  // Newsletter signup ("First to know")
  const [subEmail, setSubEmail]   = useState('');
  const [subStatus, setSubStatus] = useState('idle'); // idle | loading | success | duplicate | error
  const [subError, setSubError]   = useState('');

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (subStatus === 'loading') return;
    setSubStatus('loading');
    setSubError('');
    try {
      const { alreadySubscribed } = await subscribeEmail(subEmail);
      setSubStatus(alreadySubscribed ? 'duplicate' : 'success');
      setSubEmail('');
    } catch (err) {
      setSubStatus('error');
      setSubError(err.code === 'INVALID_EMAIL' ? err.message : 'Something went wrong. Try again.');
    }
  };

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    document.documentElement.style.cssText = 'margin:0;padding:0;';
    document.body.style.cssText = 'margin:0;padding:0;overflow-x:hidden;';
    const t = setTimeout(() => setHeroReady(true), 80);
    return () => { clearTimeout(t); };
  }, []);

  // Standard reveal
  const reveal = (inView, delay = 0) => ({
    opacity: inView ? 1 : 0,
    transform: inView ? 'translateY(0)' : 'translateY(16px)',
    transition: `opacity 0.7s ${delay}s cubic-bezier(0.25,0.1,0.25,1), transform 0.7s ${delay}s cubic-bezier(0.25,0.1,0.25,1)`,
  });

  // Text clip reveal (heading lines)
  const clipReveal = (inView, delay = 0) => ({
    clipPath: inView ? 'inset(0 0 0 0)' : 'inset(0 0 100% 0)',
    transform: inView ? 'translateY(0)' : 'translateY(100%)',
    transition: `clip-path 0.8s ${delay}s cubic-bezier(0.16,1,0.3,1), transform 0.8s ${delay}s cubic-bezier(0.16,1,0.3,1)`,
  });

  return (
    <div style={{ margin: 0, padding: 0, display: 'flex', flexDirection: 'column', overflowX: 'hidden', backgroundColor: '#fff' }}>
      <style>{`
        @keyframes fadeIn      { from { opacity:0 } to { opacity:1 } }
        @keyframes riseUp      { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes marquee     { from { transform:translateX(0) } to { transform:translateX(-50%) } }
        @keyframes lineGrow    { from { transform:scaleX(0); transform-origin:left } to { transform:scaleX(1); transform-origin:left } }
        @keyframes imgReveal   { from { opacity:0; transform:scale(1.04) } to { opacity:1; transform:scale(1) } }
        @keyframes countUp     { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
        @keyframes curtainUp   { from { transform:translateY(0) } to { transform:translateY(-100%) } }
        @keyframes heroImgIn   { from { transform:scale(1.08) } to { transform:scale(1) } }
        @keyframes clipUp      { from { clip-path:inset(0 0 100% 0); transform:translateY(60%) } to { clip-path:inset(0 0 0 0); transform:translateY(0) } }
        @keyframes slideRight  { from { transform:translateX(-100%) } to { transform:translateX(0) } }
      `}</style>

      {/* ── HERO ── */}
      <section
        ref={heroRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '80dvh',
          backgroundColor: '#111',
          overflow: 'hidden',
        }}
      >
        {/* Hero video — starts scaled, zooms to normal, muted + looping autoplay */}
        {isMobile ? (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            animation: heroReady ? 'heroImgIn 1.6s cubic-bezier(0.25,0.1,0.25,1) both' : 'none',
          }}>
            {/* Top bar — blends the page black into the video's white top edge */}
            <div style={{ flex: 1, background: 'linear-gradient(to bottom, #111 0%, #fefefe 100%)' }} />
            <div style={{ width: '100%', aspectRatio: '1920 / 1004', flexShrink: 0 }}>
              <video
                key="mobile"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                poster={heroPoster}
                fetchpriority="high"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              >
                <source src={heroVideoMobile} type="video/mp4" />
              </video>
            </div>
            {/* Bottom bar — continues the video's white edge down into the page black / vignette */}
            <div style={{ flex: 1, background: 'linear-gradient(to bottom, #fefefe 0%, #111 100%)' }} />
          </div>
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            overflow: 'hidden',
            animation: heroReady ? 'heroImgIn 1.6s cubic-bezier(0.25,0.1,0.25,1) both' : 'none',
          }}>
            <video
              key="desktop"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster={heroPoster}
              fetchpriority="high"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
            >
              <source src={heroVideoDesktop} type="video/mp4" />
            </video>
          </div>
        )}

        {/* Black curtain — slides up to reveal the image */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundColor: '#000',
          zIndex: 3,
          animation: heroReady ? 'curtainUp 1.1s 0.15s cubic-bezier(0.76,0,0.24,1) both' : 'none',
          transformOrigin: 'top',
          pointerEvents: 'none',
        }} />

        {/* Bottom vignette */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)', zIndex: 1 }} />

        {/* Bottom-left: label — clips up after curtain lifts */}
        <div style={{
          position: 'absolute', bottom: isMobile ? 72 : 88, left: isMobile ? 20 : 44,
          zIndex: 2, overflow: 'hidden',
        }}>
          <p style={{
            fontFamily: "'Clash Display', sans-serif",
            fontWeight: 600,
            fontSize: isMobile ? '13px' : '15px',
            letterSpacing: '0.26em',
            color: 'rgba(255,255,255,0.55)',
            textTransform: 'uppercase',
            margin: 0,
            animation: heroReady ? 'clipUp 0.9s 1s cubic-bezier(0.16,1,0.3,1) both' : 'none',
          }}>
            {/* Streetwear — Abuja */}
          </p>
        </div>

        {/* Black strip — enter the store */}
        <div
          onClick={() => onNavigate?.('landing')}
          style={{
            position: 'absolute', bottom: 0, right: 0,
            width: isMobile ? '56%' : '45%', height: '36px',
            backgroundColor: '#000',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            zIndex: 2, cursor: 'pointer', overflow: 'hidden',
            animation: heroReady ? 'fadeIn 0.6s 1.2s both' : 'none',
          }}
        >
          <span style={{
            fontFamily: "'Clash Display', sans-serif",
            fontWeight: 600,
            fontSize: isMobile ? '13px' : '15px',
            color: '#fff', letterSpacing: '0.22em',
            pointerEvents: 'none',
            display: 'inline-block',
            animation: heroReady ? 'clipUp 0.8s 1.3s cubic-bezier(0.16,1,0.3,1) both' : 'none',
          }}>
            see.Com
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ pointerEvents: 'none' }}>
            <path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Scroll indicator — last to appear */}
        <div style={{
          position: 'absolute', bottom: isMobile ? 20 : 28, left: isMobile ? 20 : 44,
          zIndex: 2, display: 'flex', alignItems: 'center', gap: 10,
          animation: heroReady ? 'fadeIn 1s 1.6s both' : 'none',
        }}>
          <div style={{ width: 28, height: 1, backgroundColor: 'rgba(255,255,255,0.35)' }} />
          <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: '9px', letterSpacing: '0.22em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>
            Scroll
          </span>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div style={{ borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', padding: '9px 0', overflow: 'hidden', whiteSpace: 'nowrap', backgroundColor: '#fff' }}>
        <div style={{
          display: 'inline-block',
          animation: 'marquee 22s linear infinite',
          fontFamily: "'Archivo', sans-serif",
          fontSize: '9px',
          letterSpacing: '0.26em',
          color: '#bbb',
          textTransform: 'uppercase',
        }}>
          {Array(12).fill('see.Com · New Drop · Limited Pieces · Free Delivery Over ₦100K · ').join('')}
        </div>
      </div>

      {/* ── NEW ARRIVALS ── */}
      <section
        ref={arrivalsRef}
        style={{
          padding: isMobile ? '20px 12px 56px' : '28px 40px 80px',
          ...reveal(arrivalsInView),
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '40px' }}>
          <div>
            <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '9px', letterSpacing: '0.24em', color: '#bbb', textTransform: 'uppercase', margin: '0 0 10px', ...reveal(arrivalsInView, 0) }}>
              Latest
            </p>
            <div style={{ overflow: 'hidden' }}>
              <h2 style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 600, fontSize: isMobile ? '20px' : '26px', letterSpacing: '0.08em', color: '#000', margin: 0, ...clipReveal(arrivalsInView, 0.1) }}>
                NEW ARRIVALS
              </h2>
            </div>
            {/* Animated underline */}
            <div style={{ height: 1, backgroundColor: '#bd3b28', marginTop: 10, animation: arrivalsInView ? 'lineGrow 0.8s 0.4s cubic-bezier(0.16,1,0.3,1) both' : 'none', transformOrigin: 'left', transform: arrivalsInView ? 'scaleX(1)' : 'scaleX(0)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, ...reveal(arrivalsInView, 0.2) }}>
            <ViewToggle showPrice={showPrice} setShowPrice={setShowPrice} />
            <button onClick={() => onNavigate?.('shop')} style={{ fontFamily: "'Archivo', sans-serif", fontSize: '10px', letterSpacing: '0.14em', color: '#888', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase', padding: 0 }}>
              All →
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 22, height: 22, border: '1.5px solid #e0e0e0', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : error ? (
          <FetchErrorState onRetry={retry} height={220} message="Couldn't load new arrivals." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: gridColumns, gap: isMobile ? '10px' : '24px' }}>
            {(products || []).map((p, i) => (
              <div key={p.id} style={{
                opacity: arrivalsInView ? 1 : 0,
                transform: arrivalsInView ? 'translateY(0)' : 'translateY(20px)',
                transition: `opacity 0.7s ${0.1 + i * 0.08}s cubic-bezier(0.25,0.1,0.25,1), transform 0.7s ${0.1 + i * 0.08}s cubic-bezier(0.25,0.1,0.25,1)`,
              }}>
                <ProductCard product={p} showPrice={showPrice} onProductClick={id => onNavigate?.('product', { productId: id })} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── SHOP ALL BANNER ── */}
      <section ref={bannerRef} style={{
        position: 'relative',
        width: '100%',
        height: isMobile ? '75dvh' : '92dvh',
        overflow: 'hidden',
        backgroundColor: '#111',
      }}>
        {/* Background image with parallax */}
        <div style={{
          position: 'absolute', inset: '-8%',
          backgroundImage: `url(${shopAllImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
          filter: 'brightness(0.82)',
          transform: `translateY(${bannerParallaxY}px) scale(1.06)`,
          willChange: 'transform',
        }} />

        {/* Two-tone overlay — lighter top, heavier bottom */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.55) 100%)' }} />

        {/* Top-left: category label */}
        <div style={{
          position: 'absolute', top: isMobile ? 24 : 36, left: isMobile ? 20 : 44,
          zIndex: 2,
          opacity: 0,
          animation: 'fadeIn 0.8s 0.3s both',
        }}>
          <span style={{
            fontFamily: "'Archivo', sans-serif",
            fontSize: '9px', letterSpacing: '0.26em',
            color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase',
          }}>
            Full Collection
          </span>
        </div>

        {/* Top-right: product count */}
        {shopAllProducts?.length > 0 && (
          <div style={{
            position: 'absolute', top: isMobile ? 24 : 36, right: isMobile ? 20 : 44,
            zIndex: 2,
          }}>
            <span style={{
              fontFamily: "'Archivo', sans-serif",
              fontSize: '9px', letterSpacing: '0.26em',
              color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
            }}>
              {shopAllProducts.length}+ pieces
            </span>
          </div>
        )}

        {/* Bottom content */}
        <div style={{
          position: 'absolute',
          bottom: isMobile ? 32 : 52,
          left: isMobile ? 20 : 44,
          right: isMobile ? 20 : 44,
          zIndex: 2,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
        }}>
          {/* Left: heading */}
          <div style={{ overflow: 'hidden', borderLeft: '3px solid #bd3b28', paddingLeft: 16 }}>
            <h2 style={{
              fontFamily: "'Clash Display', sans-serif",
              fontWeight: 700,
              fontSize: isMobile ? 'clamp(32px, 10vw, 44px)' : 'clamp(44px, 6vw, 72px)',
              letterSpacing: '-0.02em',
              color: '#fff',
              lineHeight: 0.95,
              margin: 0,
              animation: 'riseUp 1s 0.15s cubic-bezier(0.16,1,0.3,1) both',
            }}>
              SHOP<br />ALL
            </h2>
          </div>

          {/* Right: button + subtle line */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12, paddingBottom: 4 }}>
            <div style={{ width: 32, height: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} />
            <button
              onClick={() => onNavigate?.('shop')}
              style={{
                padding: isMobile ? '10px 22px' : '12px 28px',
                background: 'transparent',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.5)',
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: '10px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'background 0.25s, border-color 0.25s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#bd3b28';
                e.currentTarget.style.borderColor = '#bd3b28';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
              }}
            >
              View All
            </button>
          </div>
        </div>
      </section>

      {/* ── SHOP ALL GRID ── */}
      <section
        ref={shopGridRef}
        style={{
          padding: isMobile ? '40px 12px' : '96px 40px',
          ...reveal(shopGridInView),
        }}
      >
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div style={{ overflow: 'hidden' }}>
                <h2 style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 600, fontSize: isMobile ? '20px' : '26px', letterSpacing: '0.08em', color: '#000', margin: 0, ...clipReveal(shopGridInView, 0) }}>
                  SHOP ALL
                </h2>
              </div>
              <div style={{ height: 1, backgroundColor: '#bd3b28', marginTop: 10, animation: shopGridInView ? 'lineGrow 0.8s 0.4s cubic-bezier(0.16,1,0.3,1) both' : 'none', transformOrigin: 'left', transform: shopGridInView ? 'scaleX(1)' : 'scaleX(0)' }} />
            </div>
            <div style={{ ...reveal(shopGridInView, 0.15) }}>
              <ViewToggle showPrice={showPrice} setShowPrice={setShowPrice} />
            </div>
          </div>
        </div>

        {shopAllLoading ? (
          <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 22, height: 22, border: '1.5px solid #e0e0e0', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : shopAllError ? (
          <FetchErrorState onRetry={retryShopAll} height={220} message="Couldn't load products." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: gridColumns, gap: isMobile ? '10px' : '24px' }}>
            {(shopAllProducts || []).map(p => (
              <ProductCard key={p.id} product={p} showPrice={showPrice} onProductClick={id => onNavigate?.('product', { productId: id })} />
            ))}
          </div>
        )}
      </section>

      {/* ── EDITORIAL — image + brand line ── */}
      <section
        ref={editorialRef}
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          minHeight: isMobile ? 'auto' : '480px',
          borderTop: '1px solid #f0f0f0',
        }}
      >
        {/* Image — reveals with scale */}
        <div
          onClick={() => window.open('https://www.instagram.com/jeh._see/', '_blank')}
          style={{
            position: 'relative',
            backgroundColor: '#111',
            minHeight: isMobile ? '280px' : 'auto',
            cursor: 'pointer',
            overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${lookbookImage})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            transform: editorialInView ? 'scale(1)' : 'scale(1.06)',
            transition: 'transform 1.2s cubic-bezier(0.25,0.1,0.25,1)',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: editorialInView ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.4)',
            transition: 'background 1.2s ease',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'}
          />
          <span style={{
            position: 'absolute', bottom: 16, left: 16, zIndex: 2,
            fontFamily: "'Archivo', sans-serif", fontSize: '9px',
            letterSpacing: '0.18em', color: 'rgba(255,255,255,0.6)',
            textTransform: 'uppercase',
            opacity: editorialInView ? 1 : 0,
            transition: 'opacity 0.8s 0.6s ease',
          }}>
            Instagram ↗
          </span>
        </div>

        {/* Statement — staggered text reveals */}
        <div style={{
          backgroundColor: '#fafafa',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: isMobile ? '52px 24px' : '64px 52px',
          borderLeft: isMobile ? 'none' : '1px solid #f0f0f0',
        }}>
          <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '9px', letterSpacing: '0.22em', color: '#bd3b28', textTransform: 'uppercase', margin: '0 0 18px', ...reveal(editorialInView, 0.1) }}>
            .Com
          </p>
          <div style={{ overflow: 'hidden', marginBottom: 20 }}>
            <h2 style={{
              fontFamily: "'Clash Display', sans-serif", fontWeight: 700,
              fontSize: isMobile ? '26px' : 'clamp(28px, 3vw, 40px)',
              letterSpacing: '-0.01em', color: '#000', lineHeight: 1.15, margin: 0,
              ...clipReveal(editorialInView, 0.2),
            }}>
              Noone's more <br/> tapped in<br />than you!
            </h2>
          </div>
          <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '13px', color: '#999', lineHeight: 1.7, margin: '0 0 28px', maxWidth: '340px', ...reveal(editorialInView, 0.35) }}>
            Limited drops. No restocks.
          </p>
          <div style={{ ...reveal(editorialInView, 0.45) }}>
            <button
              onClick={() => onNavigate?.('shop')}
              style={{
                padding: '11px 24px', background: '#bd3b28', color: '#fff', border: 'none',
                fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
                fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase',
                cursor: 'pointer', transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#000'}
              onMouseLeave={e => e.currentTarget.style.background = '#bd3b28'}
            >
              Shop Now
            </button>
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ── */}
      <section
        ref={communityRef}
        style={{
          padding: isMobile ? '56px 20px' : '80px 40px',
          borderTop: '1px solid #f0f0f0',
          ...reveal(communityInView),
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          gap: isMobile ? '28px' : '60px',
          maxWidth: '960px',
        }}>
          <div>
            <div style={{ overflow: 'hidden' }}>
              <h2 style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 600, fontSize: isMobile ? '22px' : '28px', letterSpacing: '0.04em', color: '#000', margin: '0 0 6px', ...clipReveal(communityInView, 0) }}>
                First to know.
              </h2>
            </div>
            <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '12px', color: '#bbb', letterSpacing: '0.06em', margin: 0, ...reveal(communityInView, 0.2) }}>
              New drops only. No spam.
            </p>
          </div>

          <div style={{ ...reveal(communityInView, 0.15), width: isMobile ? '100%' : '360px' }}>
            <form onSubmit={handleSubscribe} style={{ display: 'flex', width: '100%', border: '1px solid #e0e0e0', transition: 'border-color 0.2s' }}
              onFocusCapture={e => e.currentTarget.style.borderColor = '#000'}
              onBlurCapture={e => e.currentTarget.style.borderColor = '#e0e0e0'}
            >
              <input
                type="email" placeholder="Email address" required
                value={subEmail}
                onChange={e => setSubEmail(e.target.value)}
                disabled={subStatus === 'loading'}
                style={{
                  flex: 1, padding: '13px 16px', border: 'none', outline: 'none',
                  fontFamily: "'Archivo', sans-serif", fontSize: '13px',
                  backgroundColor: '#fff', color: '#000',
                }}
              />
              <button type="submit" disabled={subStatus === 'loading'} style={{
                padding: '13px 18px', background: '#bd3b28', color: '#fff', border: 'none',
                fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
                fontSize: '10px', letterSpacing: '0.16em',
                cursor: subStatus === 'loading' ? 'default' : 'pointer', whiteSpace: 'nowrap', transition: 'background 0.2s',
                opacity: subStatus === 'loading' ? 0.6 : 1,
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#000'}
                onMouseLeave={e => e.currentTarget.style.background = '#bd3b28'}
              >
                {subStatus === 'loading' ? '...' : 'Join'}
              </button>
            </form>
            <p style={{
              fontFamily: "'Archivo', sans-serif", fontSize: '10px', letterSpacing: '0.06em', margin: '10px 0 0',
              color: subStatus === 'error' ? '#bd3b28' : '#bbb',
            }}>
              {subStatus === 'success'   && "You're on the list. First to know."}
              {subStatus === 'duplicate' && "You're already on the list."}
              {subStatus === 'error'     && subError}
              {(subStatus === 'idle' || subStatus === 'loading') && 'No spam. Unsubscribe anytime.'}
            </p>
          </div>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
