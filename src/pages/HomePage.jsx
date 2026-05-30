import { useState, useEffect, useRef } from 'react';
import heroImage     from '../assets/see.png';
import shopAllImage  from '../assets/shopallchain.jpeg';
import lookbookImage from '../assets/lookbook3.webp';
import { fetchProducts } from '../services/products';
import ProductCard from '../components/ProductCard';
import { useResponsiveGrid } from '../utils/responsiveGrid';
import Footer from '../components/Footer';

// Gentle scroll reveal — barely perceptible movement
function useInView() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.unobserve(el); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

function ViewToggle({ showPrice, setShowPrice }) {
  return (
    <div style={{ display: 'inline-flex', border: '1px solid #000', borderRadius: '24px', padding: '4px' }}>
      <button onClick={() => setShowPrice(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '20px', border: 'none', background: showPrice ? 'transparent' : '#000', cursor: 'pointer', color: showPrice ? '#000' : '#fff', transition: 'all 0.2s' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M5 20c0-3.314 3.582-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </button>
      <button onClick={() => setShowPrice(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '20px', border: 'none', background: showPrice ? '#000' : 'transparent', cursor: 'pointer', color: showPrice ? '#fff' : '#000', transition: 'all 0.2s' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg>
      </button>
    </div>
  );
}

export default function HomePage({ onNavigate }) {
  const [pastHero, setPastHero]               = useState(false);
  const [showPrice, setShowPrice]             = useState(false);
  const [products, setProducts]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [shopAllProducts, setShopAllProducts] = useState([]);
  const [shopAllLoading, setShopAllLoading]   = useState(true);
  const [heroReady, setHeroReady]             = useState(false);
  const [isMobile, setIsMobile]               = useState(window.innerWidth < 768);
  const heroRef = useRef(null);
  const gridColumns = useResponsiveGrid();

  const [arrivalsRef, arrivalsInView]   = useInView();
  const [shopGridRef, shopGridInView]   = useInView();
  const [communityRef, communityInView] = useInView();

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    document.documentElement.style.cssText = 'margin:0;padding:0;';
    document.body.style.cssText = 'margin:0;padding:0;overflow-x:hidden;';
    const t = setTimeout(() => setHeroReady(true), 80);
    const onScroll = () => {
      if (heroRef.current) setPastHero(heroRef.current.getBoundingClientRect().bottom <= 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); clearTimeout(t); };
  }, []);

  useEffect(() => {
    fetchProducts(null, null, 5, true).then(setProducts).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchProducts(null, null, 10, false).then(setShopAllProducts).catch(console.error).finally(() => setShopAllLoading(false));
  }, []);

  const reveal = (inView, delay = 0) => ({
    opacity: inView ? 1 : 0,
    transform: inView ? 'translateY(0)' : 'translateY(12px)',
    transition: `opacity 0.6s ${delay}s ease, transform 0.6s ${delay}s ease`,
  });

  return (
    <div style={{ margin: 0, padding: 0, display: 'flex', flexDirection: 'column', overflowX: 'hidden', backgroundColor: '#fff' }}>
      <style>{`
        @keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
        @keyframes riseUp   { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes marquee  { from { transform:translateX(0) } to { transform:translateX(-50%) } }
      `}</style>

      {/* ── HERO ── */}
      <section
        ref={heroRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '100dvh',
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#111',
          overflow: 'hidden',
        }}
      >
        {/* Subtle bottom vignette only */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 45%)', zIndex: 1 }} />

        {/* Bottom-left: just the brand name + quiet label */}
        <div style={{
          position: 'absolute', bottom: isMobile ? 72 : 88, left: isMobile ? 20 : 44,
          zIndex: 2,
          animation: heroReady ? 'riseUp 1s 0.2s both' : 'none',
        }}>
          <p style={{
            fontFamily: "'Clash Display', sans-serif",
            fontWeight: 600,
            fontSize: isMobile ? '13px' : '15px',
            letterSpacing: '0.26em',
            color: 'rgba(255,255,255,0.55)',
            textTransform: 'uppercase',
            margin: '0 0 6px',
          }}>
            Streetwear — Abuja
          </p>
        </div>

        {/* Red strip — bottom, right half, navigates to landing */}
        <div
          onClick={() => onNavigate?.('landing')}
          style={{
            position: 'absolute', bottom: 0, right: 0,
            width: isMobile ? '56%' : '45%', height: '44px',
            backgroundColor: '#be1826',
            display: 'flex', alignItems: 'center', paddingLeft: '24px',
            zIndex: 2, cursor: 'pointer',
            animation: heroReady ? 'fadeIn 0.8s 0.5s both' : 'none',
          }}
        >
          <span style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 600, fontSize: isMobile ? '15px' : '18px', color: '#fff', letterSpacing: '0.22em', pointerEvents: 'none' }}>
            SEE.COM
          </span>
        </div>

        {/* Scroll indicator — minimal */}
        <div style={{
          position: 'absolute', bottom: isMobile ? 20 : 28, left: isMobile ? 20 : 44,
          zIndex: 2, display: 'flex', alignItems: 'center', gap: 10,
          animation: heroReady ? 'fadeIn 1s 1s both' : 'none',
        }}>
          <div style={{ width: 28, height: 1, backgroundColor: 'rgba(255,255,255,0.35)' }} />
          <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: '9px', letterSpacing: '0.22em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>
            Scroll
          </span>
        </div>
      </section>

      {/* ── STICKY STRIP ── */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '44px',
        display: 'flex', alignItems: 'stretch', zIndex: 50,
        transform: pastHero ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.3s ease',
        pointerEvents: pastHero ? 'auto' : 'none',
      }}>
        <div style={{ flex: '0 0 55%' }} />
        <div
          onClick={() => onNavigate?.('landing')}
          style={{ flex: 1, backgroundColor: '#be1826', display: 'flex', alignItems: 'center', paddingLeft: '24px', cursor: 'pointer' }}
        >
          <span style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 600, fontSize: '17px', color: '#fff', letterSpacing: '0.22em' }}>SEE.COM</span>
        </div>
      </div>

      {/* ── MARQUEE — barely there ── */}
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
          {Array(12).fill('SEE.COM · New Drop · Abuja · Limited Pieces · Free Delivery Over ₦50K · ').join('')}
        </div>
      </div>

      {/* ── NEW ARRIVALS ── */}
      <section
        ref={arrivalsRef}
        style={{
          padding: isMobile ? '64px 20px 56px' : '96px 40px 80px',
          ...reveal(arrivalsInView),
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '40px' }}>
          <div>
            <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '9px', letterSpacing: '0.24em', color: '#bbb', textTransform: 'uppercase', margin: '0 0 8px' }}>
              Latest
            </p>
            <h2 style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 600, fontSize: isMobile ? '20px' : '26px', letterSpacing: '0.08em', color: '#000', margin: 0 }}>
              NEW ARRIVALS
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <ViewToggle showPrice={showPrice} setShowPrice={setShowPrice} />
            <button onClick={() => onNavigate?.('shop')} style={{ fontFamily: "'Archivo', sans-serif", fontSize: '10px', letterSpacing: '0.14em', color: '#888', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase', padding: 0 }}>
              All →
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: '9px', letterSpacing: '0.22em', color: '#ddd', textTransform: 'uppercase' }}>—</span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: gridColumns, gap: isMobile ? '16px' : '24px' }}>
            {products.map((p, i) => (
              <div key={p.id} style={{ ...reveal(arrivalsInView, i * 0.06) }}>
                <ProductCard product={p} showPrice={showPrice} onProductClick={id => onNavigate?.('product', { productId: id })} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── SHOP ALL BANNER ── */}
      <section style={{
        position: 'relative',
        width: '100%',
        height: isMobile ? '75dvh' : '92dvh',
        overflow: 'hidden',
        backgroundColor: '#111',
      }}>
        {/* Background image with subtle scale on mount */}
        <div style={{
          position: 'absolute', inset: '-4%',
          backgroundImage: `url(${shopAllImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
          filter: 'brightness(0.82)',
          transform: 'scale(1.04)',
          transition: 'transform 8s ease',
        }} />

        {/* Two-tone overlay — lighter top, heavier bottom */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.55) 100%)' }} />

        {/* Top-left: category label */}
        <div style={{
          position: 'absolute', top: isMobile ? 24 : 36, left: isMobile ? 20 : 44,
          zIndex: 2,
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
        {shopAllProducts.length > 0 && (
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
          <div>
            <h2 style={{
              fontFamily: "'Clash Display', sans-serif",
              fontWeight: 700,
              fontSize: isMobile ? 'clamp(32px, 10vw, 44px)' : 'clamp(44px, 6vw, 72px)',
              letterSpacing: '-0.02em',
              color: '#fff',
              lineHeight: 0.95,
              margin: 0,
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
                e.currentTarget.style.background = '#be1826';
                e.currentTarget.style.borderColor = '#be1826';
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
          padding: isMobile ? '64px 20px' : '96px 40px',
          ...reveal(shopGridInView),
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '40px' }}>
          <h2 style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 600, fontSize: isMobile ? '20px' : '26px', letterSpacing: '0.08em', color: '#000', margin: 0 }}>
            SHOP ALL
          </h2>
          <ViewToggle showPrice={showPrice} setShowPrice={setShowPrice} />
        </div>

        {shopAllLoading ? (
          <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: '9px', letterSpacing: '0.22em', color: '#ddd', textTransform: 'uppercase' }}>—</span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: gridColumns, gap: isMobile ? '16px' : '24px' }}>
            {shopAllProducts.map(p => (
              <ProductCard key={p.id} product={p} showPrice={showPrice} onProductClick={id => onNavigate?.('product', { productId: id })} />
            ))}
          </div>
        )}
      </section>

      {/* ── EDITORIAL — image + brand line ── */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        minHeight: isMobile ? 'auto' : '480px',
        borderTop: '1px solid #f0f0f0',
      }}>
        {/* Image */}
        <div
          onClick={() => window.open('https://instagram.com', '_blank')}
          style={{
            backgroundImage: `url(${lookbookImage})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            backgroundColor: '#111', minHeight: isMobile ? '260px' : 'auto',
            cursor: 'pointer', position: 'relative', overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0)',
            transition: 'background 0.4s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
          />
          <span style={{
            position: 'absolute', bottom: 16, left: 16,
            fontFamily: "'Archivo', sans-serif", fontSize: '9px',
            letterSpacing: '0.18em', color: 'rgba(255,255,255,0.6)',
            textTransform: 'uppercase',
          }}>
            Instagram ↗
          </span>
        </div>

        {/* Statement */}
        <div style={{
          backgroundColor: '#fafafa',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: isMobile ? '52px 24px' : '64px 52px',
          borderLeft: isMobile ? 'none' : '1px solid #f0f0f0',
        }}>
          <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '9px', letterSpacing: '0.22em', color: '#be1826', textTransform: 'uppercase', margin: '0 0 18px' }}>
            The brand
          </p>
          <h2 style={{
            fontFamily: "'Clash Display', sans-serif", fontWeight: 700,
            fontSize: isMobile ? '26px' : 'clamp(28px, 3vw, 40px)',
            letterSpacing: '-0.01em', color: '#000', lineHeight: 1.15,
            margin: '0 0 20px',
          }}>
            Built for people<br />who refuse ordinary.
          </h2>
          <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '13px', color: '#999', lineHeight: 1.7, margin: '0 0 28px', maxWidth: '340px' }}>
            Limited drops. No restocks. Streetwear from Abuja.
          </p>
          <button
            onClick={() => onNavigate?.('shop')}
            style={{
              alignSelf: 'flex-start',
              padding: '11px 24px', background: '#000', color: '#fff',
              border: 'none',
              fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
              fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase',
              cursor: 'pointer', transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#be1826'}
            onMouseLeave={e => e.currentTarget.style.background = '#000'}
          >
            Shop Now
          </button>
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
            <h2 style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 600, fontSize: isMobile ? '22px' : '28px', letterSpacing: '0.04em', color: '#000', margin: '0 0 6px' }}>
              First to know.
            </h2>
            <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '12px', color: '#bbb', letterSpacing: '0.06em', margin: 0 }}>
              New drops only. No spam.
            </p>
          </div>

          <form onSubmit={e => e.preventDefault()} style={{ display: 'flex', width: isMobile ? '100%' : '360px', border: '1px solid #e0e0e0', transition: 'border-color 0.2s' }}
            onFocusCapture={e => e.currentTarget.style.borderColor = '#000'}
            onBlurCapture={e => e.currentTarget.style.borderColor = '#e0e0e0'}
          >
            <input
              type="email" placeholder="Email address" required
              style={{
                flex: 1, padding: '13px 16px', border: 'none', outline: 'none',
                fontFamily: "'Archivo', sans-serif", fontSize: '13px',
                backgroundColor: '#fff', color: '#000',
              }}
            />
            <button type="submit" style={{
              padding: '13px 18px', background: '#000', color: '#fff', border: 'none',
              fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
              fontSize: '10px', letterSpacing: '0.16em',
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#be1826'}
              onMouseLeave={e => e.currentTarget.style.background = '#000'}
            >
              Join
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
}
