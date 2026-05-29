import { useState, useEffect, useRef, useCallback } from 'react';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';
import { fetchProducts } from '../services/products';
import { useResponsiveGrid } from '../utils/responsiveGrid';
import logoBadge from '../assets/logo.jpeg';

export default function ShopPage({ onNavigate }) {
  const [showPrice, setShowPrice] = useState(false);
  const [products, setProducts] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const observerTarget = useRef(null);
  const gridColumns = useResponsiveGrid();

  const PRODUCTS_PER_PAGE = 25;

  // Fetch all products once
  useEffect(() => {
    const loadAllProducts = async () => {
      setLoading(true);
      try {
        const allProducts = await fetchProducts(null, null, 1000);
        setProducts(allProducts);
        setDisplayedProducts(allProducts.slice(0, PRODUCTS_PER_PAGE));
        setCurrentIndex(PRODUCTS_PER_PAGE);
        setHasMore(allProducts.length > PRODUCTS_PER_PAGE);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAllProducts();
  }, []);

  // Infinite scroll handler
  const loadMore = useCallback(() => {
    if (!hasMore || currentIndex >= products.length) return;

    const newIndex = currentIndex + PRODUCTS_PER_PAGE;
    setDisplayedProducts(products.slice(0, newIndex));
    setCurrentIndex(newIndex);
    setHasMore(newIndex < products.length);
  }, [currentIndex, products, hasMore]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loading, loadMore]);

  return (
    <div style={{ marginTop: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Header with clickable logo */}
      <div
        style={{
          padding: '20px 40px 10px',
          backgroundColor: '#fff',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <div
          onClick={() => onNavigate?.('home')}
          style={{ cursor: 'pointer', display: 'inline-block' }}
        >
          <div
            style={{
              fontFamily: "'Archivo', sans-serif",
              fontWeight: 500,
              fontSize: '38px',
              letterSpacing: '0.05em',
              color: '#000',
            }}
          >
            SEE.COM
          </div>
        </div>

        {/* Logo badge — click to go to landing */}
        <img
          src={logoBadge}
          alt="SEE.COM"
          onClick={() => onNavigate?.('landing')}
          style={{
            position: 'absolute',
            right: '40px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '56px',
            height: '56px',
            objectFit: 'cover',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        />
      </div>

      {/* Products section */}
      <main style={{ backgroundColor: '#fff', padding: '48px 40px', margin: 0 }}>
        {/* Header with Title and Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <h2
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: window.innerWidth >= 1024 ? '18px' : window.innerWidth >= 768 ? '15px' : '13px',
              letterSpacing: '0.12em',
              color: '#000',
              margin: 0,
            }}
          >
            ALL PRODUCTS
          </h2>

          {/* Toggle Button - Smaller Pill Shape */}
          <div
            style={{
              display: 'inline-flex',
              border: '1px solid #000',
              borderRadius: '24px',
              padding: '4px',
              gap: '0',
              width: 'fit-content',
            }}
          >
            {/* Person Icon (Model View) */}
            <button
              onClick={() => setShowPrice(false)}
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
                <path
                  d="M5 20c0-3.314 3.582-6 7-6s7 2.686 7 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {/* Filled Circle (Price View) */}
            <button
              onClick={() => setShowPrice(true)}
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

        {/* Product Grid */}
        {loading && displayedProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#999' }}>
            LOADING PRODUCTS...
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

            {/* Infinite scroll trigger */}
            <div
              ref={observerTarget}
              style={{
                padding: '40px 0',
                textAlign: 'center',
                color: '#999',
              }}
            >
              {hasMore ? (
                <div style={{ fontSize: '12px', letterSpacing: '0.05em' }}>
                  LOADING MORE...
                </div>
              ) : (
                <div style={{ fontSize: '12px', letterSpacing: '0.05em' }}>
                  ALL {products.length} PRODUCTS LOADED
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px', color: '#999' }}>
            NO PRODUCTS AVAILABLE
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
