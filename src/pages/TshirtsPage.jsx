import { useState, useEffect, useRef, useCallback } from 'react';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';
import { fetchProducts } from '../services/products';
import { useResponsiveGrid } from '../utils/responsiveGrid';

export default function TshirtsPage({ onNavigate }) {
  const [showPrice, setShowPrice] = useState(false);
  const [products, setProducts] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeGender, setActiveGender] = useState('all');
  const observerTarget = useRef(null);
  const gridColumns = useResponsiveGrid();

  const PRODUCTS_PER_PAGE = 25;

  const filteredProducts = activeGender === 'all'
    ? products
    : products.filter(p => p.gender === activeGender || p.gender === 'unisex');

  // Fetch tshirts
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchProducts('tshirts', null, 1000);
        setProducts(data);
        setDisplayedProducts(data.slice(0, PRODUCTS_PER_PAGE));
        setCurrentIndex(PRODUCTS_PER_PAGE);
        setHasMore(data.length > PRODUCTS_PER_PAGE);
      } catch (err) {
        console.error('Error loading tshirts:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Re-slice when gender filter changes
  useEffect(() => {
    setDisplayedProducts(filteredProducts.slice(0, PRODUCTS_PER_PAGE));
    setCurrentIndex(PRODUCTS_PER_PAGE);
    setHasMore(filteredProducts.length > PRODUCTS_PER_PAGE);
  }, [activeGender, products]); // eslint-disable-line

  const loadMore = useCallback(() => {
    if (!hasMore || currentIndex >= filteredProducts.length) return;
    const newIndex = currentIndex + PRODUCTS_PER_PAGE;
    setDisplayedProducts(filteredProducts.slice(0, newIndex));
    setCurrentIndex(newIndex);
    setHasMore(newIndex < filteredProducts.length);
  }, [currentIndex, filteredProducts, hasMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) loadMore();
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [hasMore, loading, loadMore]);

  return (
    <div style={{ marginTop: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>

      {/* ── CATEGORY BANNER ── */}
      <section
        style={{
          position: 'relative',
          width: '100%',
          height: '52vh',
          backgroundColor: '#0a0a0a',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'flex-end',
        }}
      >
        {/* Grain overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.08\'/%3E%3C/svg%3E")',
            backgroundRepeat: 'repeat',
            backgroundSize: '200px',
            opacity: 0.6,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />

        {/* Large background text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -52%)',
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 'clamp(80px, 16vw, 200px)',
            letterSpacing: '-0.04em',
            color: 'transparent',
            WebkitTextStroke: '1px rgba(255,255,255,0.07)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 1,
          }}
        >
          T-SHIRTS
        </div>

        {/* Red accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '4px',
            height: '100%',
            backgroundColor: '#be1826',
            zIndex: 2,
          }}
        />

        {/* Bottom content */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            padding: '0 40px 36px',
            width: '100%',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
          }}
        >
          <div>
            {/* Breadcrumb */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
              }}
            >
              <button
                onClick={() => onNavigate?.('home')}
                style={{
                  fontFamily: "'Archivo', Helvetica, Arial, sans-serif",
                  fontSize: '10px',
                  letterSpacing: '0.14em',
                  color: 'rgba(255,255,255,0.4)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  textTransform: 'uppercase',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
              >
                SEE.COM
              </button>
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>›</span>
              <span
                style={{
                  fontFamily: "'Archivo', Helvetica, Arial, sans-serif",
                  fontSize: '10px',
                  letterSpacing: '0.14em',
                  color: '#be1826',
                  textTransform: 'uppercase',
                }}
              >
                T-Shirts
              </span>
            </div>

            <h1
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 'clamp(22px, 4vw, 40px)',
                letterSpacing: '0.06em',
                color: '#fff',
                margin: 0,
                lineHeight: 1,
              }}
            >
              SEE.TSHIRTS
            </h1>
          </div>

          {/* Product count */}
          {!loading && (
            <div
              style={{
                fontFamily: "'Archivo', Helvetica, Arial, sans-serif",
                fontSize: '11px',
                letterSpacing: '0.1em',
                color: 'rgba(255,255,255,0.3)',
                textTransform: 'uppercase',
              }}
            >
              {filteredProducts.length} STYLES
            </div>
          )}
        </div>
      </section>

      {/* ── PRODUCTS SECTION ── */}
      <main style={{ backgroundColor: '#fff', padding: '40px 40px', margin: 0 }}>

        {/* Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '28px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Left: title + toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h2
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 'clamp(12px, 1.5vw, 18px)',
                letterSpacing: '0.12em',
                color: '#000',
                margin: 0,
              }}
            >
              T-SHIRTS
            </h2>

            {/* Price / model toggle */}
            <div
              style={{
                display: 'inline-flex',
                border: '1px solid #000',
                borderRadius: '24px',
                padding: '4px',
                width: 'fit-content',
              }}
            >
              <button
                onClick={() => setShowPrice(false)}
                title="Model view"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '20px',
                  border: 'none',
                  background: showPrice ? 'transparent' : '#000',
                  cursor: 'pointer',
                  color: showPrice ? '#000' : '#fff',
                  transition: 'all 0.2s',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M5 20c0-3.314 3.582-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              <button
                onClick={() => setShowPrice(true)}
                title="Price view"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '20px',
                  border: 'none',
                  background: showPrice ? '#000' : 'transparent',
                  cursor: 'pointer',
                  color: showPrice ? '#fff' : '#000',
                  transition: 'all 0.2s',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="8" />
                </svg>
              </button>
            </div>
          </div>

          {/* Right: gender filter */}
          <div
            style={{
              display: 'inline-flex',
              gap: '0',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            {['all', 'male', 'female'].map((g) => (
              <button
                key={g}
                onClick={() => setActiveGender(g)}
                style={{
                  padding: '7px 14px',
                  fontFamily: "'Archivo', Helvetica, Arial, sans-serif",
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  background: activeGender === g ? '#000' : 'transparent',
                  color: activeGender === g ? '#fff' : '#888',
                  border: 'none',
                  borderRight: g !== 'female' ? '1px solid #e0e0e0' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {g === 'all' ? 'All' : g === 'male' ? 'Men' : 'Women'}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading && displayedProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#bbb' }}>
            <div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '11px',
                letterSpacing: '0.2em',
              }}
            >
              LOADING...
            </div>
          </div>
        ) : displayedProducts.length > 0 ? (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: gridColumns,
                gap: '24px',
              }}
            >
              {displayedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  showPrice={showPrice}
                  onProductClick={(id) => onNavigate?.('product', { productId: id })}
                />
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            <div
              ref={observerTarget}
              style={{ padding: '48px 0', textAlign: 'center', color: '#bbb' }}
            >
              {hasMore ? (
                <div
                  style={{
                    fontFamily: "'Archivo', Helvetica, Arial, sans-serif",
                    fontSize: '11px',
                    letterSpacing: '0.14em',
                  }}
                >
                  LOADING MORE...
                </div>
              ) : (
                <div
                  style={{
                    fontFamily: "'Archivo', Helvetica, Arial, sans-serif",
                    fontSize: '11px',
                    letterSpacing: '0.14em',
                  }}
                >
                  ALL {filteredProducts.length} STYLES SHOWN
                </div>
              )}
            </div>
          </>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '80px',
              fontFamily: "'Archivo', Helvetica, Arial, sans-serif",
              fontSize: '11px',
              letterSpacing: '0.14em',
              color: '#bbb',
            }}
          >
            NO T-SHIRTS AVAILABLE
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
