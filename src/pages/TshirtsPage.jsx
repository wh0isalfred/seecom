import { useState, useEffect, useRef, useCallback } from 'react';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';
import { fetchProducts } from '../services/products';
import { useResponsiveGrid } from '../utils/responsiveGrid';

function ViewToggle({ showPrice, setShowPrice }) {
  return (
    <div style={{ display: 'inline-flex', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '24px', padding: '4px' }}>
      <button onClick={() => setShowPrice(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '20px', border: 'none', background: showPrice ? 'transparent' : 'rgba(255,255,255,0.9)', cursor: 'pointer', color: showPrice ? 'rgba(255,255,255,0.6)' : '#000', transition: 'all 0.2s' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M5 20c0-3.314 3.582-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </button>
      <button onClick={() => setShowPrice(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '20px', border: 'none', background: showPrice ? 'rgba(255,255,255,0.9)' : 'transparent', cursor: 'pointer', color: showPrice ? '#000' : 'rgba(255,255,255,0.6)', transition: 'all 0.2s' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg>
      </button>
    </div>
  );
}

export default function TshirtsPage({ onNavigate }) {
  const [showPrice, setShowPrice]           = useState(false);
  const [products, setProducts]             = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [loading, setLoading]               = useState(true);
  const [hasMore, setHasMore]               = useState(true);
  const [currentIndex, setCurrentIndex]     = useState(0);
  const [activeGender, setActiveGender]     = useState('all');
  const [ready, setReady]                   = useState(false);
  const [isMobile, setIsMobile]             = useState(window.innerWidth < 768);
  const observerTarget = useRef(null);
  const gridColumns = useResponsiveGrid();
  const PRODUCTS_PER_PAGE = 25;

  const filteredProducts = activeGender === 'all'
    ? products
    : products.filter(p => p.gender === activeGender || p.gender === 'unisex');

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    setTimeout(() => setReady(true), 80);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    fetchProducts('tshirts', null, 1000)
      .then(data => {
        setProducts(data);
        setDisplayedProducts(data.slice(0, PRODUCTS_PER_PAGE));
        setCurrentIndex(PRODUCTS_PER_PAGE);
        setHasMore(data.length > PRODUCTS_PER_PAGE);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setDisplayedProducts(filteredProducts.slice(0, PRODUCTS_PER_PAGE));
    setCurrentIndex(PRODUCTS_PER_PAGE);
    setHasMore(filteredProducts.length > PRODUCTS_PER_PAGE);
  }, [activeGender, products]); // eslint-disable-line

  const loadMore = useCallback(() => {
    if (!hasMore || currentIndex >= filteredProducts.length) return;
    const next = currentIndex + PRODUCTS_PER_PAGE;
    setDisplayedProducts(filteredProducts.slice(0, next));
    setCurrentIndex(next);
    setHasMore(next < filteredProducts.length);
  }, [currentIndex, filteredProducts, hasMore]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting && hasMore && !loading) loadMore(); },
      { threshold: 0.1 }
    );
    if (observerTarget.current) obs.observe(observerTarget.current);
    return () => { if (observerTarget.current) obs.unobserve(observerTarget.current); };
  }, [hasMore, loading, loadMore]);

  const genders = ['all', 'male', 'female'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', backgroundColor: '#fff' }}>
      <style>{`
        @keyframes clipUp  { from { clip-path:inset(0 0 100% 0); transform:translateY(60%) } to { clip-path:inset(0 0 0 0); transform:translateY(0) } }
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin    { to { transform:rotate(360deg) } }
      `}</style>

      {/* ── BANNER ── */}
      <section style={{
        position: 'relative', width: '100%',
        height: isMobile ? '52dvh' : '62dvh',
        backgroundColor: '#0a0a0a',
        overflow: 'hidden', display: 'flex', alignItems: 'flex-end',
      }}>
        {/* Subtle grain */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', opacity: 0.5,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.06\'/%3E%3C/svg%3E")',
          backgroundRepeat: 'repeat', backgroundSize: '200px',
        }} />

        {/* Large ghost text */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Clash Display', sans-serif", fontWeight: 700,
          fontSize: 'clamp(80px, 18vw, 200px)',
          letterSpacing: '-0.04em', color: 'rgba(255,255,255,0.04)',
          whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 0,
          userSelect: 'none',
        }}>
          TOPS
        </div>

        {/* Breadcrumb */}
        <div style={{
          position: 'absolute', top: isMobile ? 16 : 24, left: isMobile ? 20 : 40,
          display: 'flex', alignItems: 'center', gap: 8, zIndex: 2,
          opacity: ready ? 1 : 0, transition: 'opacity 0.5s ease',
        }}>
          <button onClick={() => onNavigate?.('home')} style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 600, fontSize: '12px', letterSpacing: '0.22em', color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>SEE.COM</button>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>›</span>
          <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: '10px', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>T-Shirts</span>
        </div>

        {/* Bottom content */}
        <div style={{
          position: 'relative', zIndex: 2, width: '100%',
          padding: isMobile ? '0 20px 28px' : '0 40px 36px',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        }}>
          <div style={{ overflow: 'hidden' }}>
            <h1 style={{
              fontFamily: "'Clash Display', sans-serif", fontWeight: 700,
              fontSize: isMobile ? 'clamp(28px, 8vw, 44px)' : 'clamp(44px, 6vw, 64px)',
              letterSpacing: '-0.02em', color: '#fff', margin: 0, lineHeight: 1,
              animation: ready ? 'clipUp 0.9s 0.1s cubic-bezier(0.16,1,0.3,1) both' : 'none',
            }}>
              T-Shirts
            </h1>
          </div>
          <div style={{ animation: ready ? 'fadeIn 0.6s 0.4s both' : 'none' }}>
            <ViewToggle showPrice={showPrice} setShowPrice={setShowPrice} />
          </div>
        </div>
      </section>

      {/* ── GENDER FILTER ── */}
      <div style={{
        borderBottom: '1px solid #f0f0f0',
        padding: isMobile ? '0 20px' : '0 40px',
        display: 'flex', gap: 0,
        animation: ready ? 'fadeUp 0.5s 0.3s both' : 'none',
      }}>
        {genders.map(g => (
          <button key={g} onClick={() => setActiveGender(g)} style={{
            padding: '14px 20px',
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
            fontSize: '10px', letterSpacing: '0.12em',
            textTransform: 'uppercase', color: activeGender === g ? '#000' : '#ccc',
            background: 'none', border: 'none',
            borderBottom: activeGender === g ? '2px solid #000' : '2px solid transparent',
            cursor: 'pointer', transition: 'color 0.2s, border-color 0.2s',
          }}>
            {g === 'all' ? 'All' : g === 'male' ? 'Men' : 'Women'}
          </button>
        ))}
      </div>

      {/* ── GRID ── */}
      <main style={{ flex: 1, padding: isMobile ? '40px 20px' : '64px 40px' }}>
        {loading && displayedProducts.length === 0 ? (
          <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: '9px', letterSpacing: '0.22em', color: '#ddd', textTransform: 'uppercase' }}>—</span>
          </div>
        ) : displayedProducts.length > 0 ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: gridColumns, gap: isMobile ? '16px' : '24px' }}>
              {displayedProducts.map((p, i) => (
                <div key={p.id} style={{
                  opacity: ready ? 1 : 0,
                  transform: ready ? 'translateY(0)' : 'translateY(16px)',
                  transition: `opacity 0.6s ${0.1 + i * 0.03}s ease, transform 0.6s ${0.1 + i * 0.03}s ease`,
                }}>
                  <ProductCard product={p} showPrice={showPrice} onProductClick={id => onNavigate?.('product', { productId: id })} />
                </div>
              ))}
            </div>
            <div ref={observerTarget} style={{ padding: '60px 0', textAlign: 'center' }}>
              {hasMore
                ? <div style={{ width: 24, height: 24, border: '1.5px solid #e0e0e0', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
                : <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '9px', letterSpacing: '0.22em', color: '#ccc', textTransform: 'uppercase', margin: 0 }}>{filteredProducts.length} pieces</p>
              }
            </div>
          </>
        ) : (
          <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '9px', letterSpacing: '0.22em', color: '#ccc', textTransform: 'uppercase', margin: 0 }}>No pieces found</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
