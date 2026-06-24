import { useState, useEffect, useRef, useCallback } from 'react';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';
import { fetchProducts } from '../services/products';
import { useResponsiveGrid } from '../utils/responsiveGrid';
import logoBadge from '../assets/badge.webp';

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

export default function ShopPage({ onNavigate }) {
  const [showPrice, setShowPrice]           = useState(false);
  const [products, setProducts]             = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [loading, setLoading]               = useState(true);
  const [hasMore, setHasMore]               = useState(true);
  const [currentIndex, setCurrentIndex]     = useState(0);
  const [ready, setReady]                   = useState(false);
  const [isMobile, setIsMobile]             = useState(window.innerWidth < 768);
  const observerTarget = useRef(null);
  const gridColumns = useResponsiveGrid();
  const PRODUCTS_PER_PAGE = 25;

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    setTimeout(() => setReady(true), 60);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    fetchProducts(null, null, 1000)
      .then(all => {
        setProducts(all);
        setDisplayedProducts(all.slice(0, PRODUCTS_PER_PAGE));
        setCurrentIndex(PRODUCTS_PER_PAGE);
        setHasMore(all.length > PRODUCTS_PER_PAGE);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const loadMore = useCallback(() => {
    if (!hasMore || currentIndex >= products.length) return;
    const next = currentIndex + PRODUCTS_PER_PAGE;
    setDisplayedProducts(products.slice(0, next));
    setCurrentIndex(next);
    setHasMore(next < products.length);
  }, [currentIndex, products, hasMore]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting && hasMore && !loading) loadMore(); },
      { threshold: 0.1 }
    );
    if (observerTarget.current) obs.observe(observerTarget.current);
    return () => { if (observerTarget.current) obs.unobserve(observerTarget.current); };
  }, [hasMore, loading, loadMore]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', backgroundColor: '#fff' }}>
      <style>{`
        @keyframes fadeDown { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeUp   { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes lineGrow { from { transform:scaleX(0) } to { transform:scaleX(1) } }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{
        padding: isMobile ? '16px 20px' : '20px 40px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
        animation: ready ? 'fadeDown 0.6s ease both' : 'none',
      }}>
        <button
          onClick={() => onNavigate?.('home')}
          style={{
            fontFamily: "'Clash Display', sans-serif",
            fontWeight: 600, fontSize: isMobile ? '18px' : '22px',
            letterSpacing: '0.22em', color: '#000',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          }}
        >
          SEE.COM
        </button>

        <img
          src={logoBadge}
          alt="SEE.COM"
          onClick={() => onNavigate?.('landing')}
          style={{
            position: 'absolute', right: isMobile ? '20px' : '40px',
            top: '50%', transform: 'translateY(-50%)',
            width: isMobile ? '40px' : '48px', height: isMobile ? '40px' : '48px',
            objectFit: 'cover', cursor: 'pointer',
          }}
        />
      </header>

      {/* ── MAIN ── */}
      <main style={{
        flex: 1,
        padding: isMobile ? '24px 12px' : '64px 40px',
        animation: ready ? 'fadeUp 0.7s 0.1s ease both' : 'none',
      }}>

        {/* Section label + controls */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '40px' }}>
          <div>
            <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '9px', letterSpacing: '0.24em', color: '#bbb', textTransform: 'uppercase', margin: '0 0 8px' }}>
              All pieces
            </p>
            <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 600, fontSize: isMobile ? '20px' : '26px', letterSpacing: '0.06em', color: '#000', margin: 0 }}>
              SHOP ALL
            </h1>
            <div style={{
              height: 1, backgroundColor: '#000', marginTop: 10,
              transformOrigin: 'left',
              animation: ready ? 'lineGrow 0.8s 0.3s cubic-bezier(0.16,1,0.3,1) both' : 'none',
            }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ViewToggle showPrice={showPrice} setShowPrice={setShowPrice} />
            {!loading && products.length > 0 && (
              <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: '10px', letterSpacing: '0.1em', color: '#ccc', textTransform: 'uppercase' }}>
                {products.length}
              </span>
            )}
          </div>
        </div>

        {/* Grid */}
        {loading && displayedProducts.length === 0 ? (
          <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: '9px', letterSpacing: '0.22em', color: '#ddd', textTransform: 'uppercase' }}>—</span>
          </div>
        ) : displayedProducts.length > 0 ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: gridColumns, gap: isMobile ? '10px' : '24px' }}>
              {displayedProducts.map((product, i) => (
                <div key={product.id} style={{
                  opacity: ready ? 1 : 0,
                  transform: ready ? 'translateY(0)' : 'translateY(16px)',
                  transition: `opacity 0.6s ${0.05 + i * 0.03}s ease, transform 0.6s ${0.05 + i * 0.03}s ease`,
                }}>
                  <ProductCard
                    product={product}
                    showPrice={showPrice}
                    onProductClick={id => onNavigate?.('product', { productId: id })}
                  />
                </div>
              ))}
            </div>

            <div ref={observerTarget} style={{ padding: '60px 0', textAlign: 'center' }}>
              {hasMore ? (
                <div style={{ width: 24, height: 24, border: '1.5px solid #e0e0e0', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
              ) : (
                <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '9px', letterSpacing: '0.22em', color: '#ccc', textTransform: 'uppercase', margin: 0 }}>
                  {products.length} pieces
                </p>
              )}
            </div>
          </>
        ) : (
          <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '9px', letterSpacing: '0.22em', color: '#ccc', textTransform: 'uppercase', margin: 0 }}>No products available</p>
          </div>
        )}
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <Footer />
    </div>
  );
}
