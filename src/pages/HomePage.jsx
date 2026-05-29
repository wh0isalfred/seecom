import { useState, useEffect, useRef } from 'react';
import heroImage from '../assets/see.png';
import shopAllImage from '../assets/shopallchain.jpeg';
import { fetchProducts } from '../services/products';
import ProductCard from '../components/ProductCard';
import { useResponsiveGrid } from '../utils/responsiveGrid';
import Footer from '../components/Footer';
import lookbookImage from '../assets/lookbook3.jpeg';

export default function HomePage({ onNavigate }) {
  const [pastHero, setPastHero] = useState(false);
  const [showPrice, setShowPrice] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shopAllProducts, setShopAllProducts] = useState([]);
  const [shopAllLoading, setShopAllLoading] = useState(true);
  const heroRef = useRef(null);
  const gridColumns = useResponsiveGrid();

  useEffect(() => {
    document.documentElement.style.cssText = 'margin:0;padding:0;';
    document.body.style.cssText = 'margin:0;padding:0;overflow-x:hidden;';

    const handleScroll = () => {
      if (heroRef.current) {
        setPastHero(heroRef.current.getBoundingClientRect().bottom <= 0);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const data = await fetchProducts(null, null, 5, true);
        setProducts(data);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  // Fetch non-new-arrival products for SHOP ALL section
  useEffect(() => {
    const loadShopAllProducts = async () => {
      setShopAllLoading(true);
      try {
        // Fetch products where is_new_arrival = false, limit to 10
        const data = await fetchProducts(null, null, 10, false);
        setShopAllProducts(data);
      } catch (error) {
        console.error('Error loading shop all products:', error);
      } finally {
        setShopAllLoading(false);
      }
    };
    loadShopAllProducts();
  }, []);

  return (
    <div style={{ marginTop: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
      {/* HERO SECTION */}
      <section
        ref={heroRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '85dvh',
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#350000',
          display: 'block',
          overflow: 'hidden',
          margin: 0,
          padding: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: 70,
            left: 0,
            right: 0,
            height: '35px',
            display: 'flex',
            alignItems: 'stretch',
            zIndex: 10,
          }}
        >
          <div style={{ flex: '0 0 55%' }} />
          <div
            style={{
              flex: 1,
              backgroundColor: '#b91c1c',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '28px',
            }}
          >
            <span
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: '20px',
                color: '#fff',
                letterSpacing: '0.03em',
              }}
            >
              <button onClick={() => onNavigate?.('landing')} style={{background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: '20px',
                color: '#fff',
                letterSpacing: '0.03em'}}>SEE.COM</button>
              
            </span>
          </div>
        </div>
      </section>

      {/* STICKY STRIP */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '35px',
          display: 'flex',
          alignItems: 'stretch',
          zIndex: 50,
          transform: pastHero ? 'translateY(100%)' : 'translateY(-100%)',
          transition: 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: pastHero ? 'auto' : 'none',
        }}
      >
        <div style={{ flex: '0 0 55%' }} />
        <div
          style={{
            flex: 1,
            backgroundColor: '#b91c1c',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '28px',
          }}
        >
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: '20px',
              color: '#fff',
              letterSpacing: '0.03em',
            }}
          >
            <button onClick={() => onNavigate?.('landing')} style={{background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: '20px',
                color: '#fff',
                letterSpacing: '0.03em'}}>SEE.COM</button>
          </span>
        </div>
      </div>

      {/* NEW ARRIVALS SECTION */}
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
            NEW ARRIVALS
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
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#999' }}>
            LOADING PRODUCTS...
          </div>
        ) : products.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: gridColumns,
              gap: '24px',
            }}
          >
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                showPrice={showPrice}
                onProductClick={(id) => onNavigate?.('product', { productId: id })}
              />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px', color: '#999' }}>
            NO PRODUCTS AVAILABLE
          </div>
        )}
      </main>

      {/* SHOP ALL BANNER SECTION */}
      <section
        style={{
          position: 'relative',
          width: '100%',
          height: '95vh',
          backgroundImage: `url(${shopAllImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundColor: '#e8e8e8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: 0,
          padding: 0,
        }}
      >
        <button
          onClick={() => onNavigate?.('shop')}
          style={{
            padding: '12px 32px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.75)',
            color: '#fff',
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 400,
            fontSize: '13px',
            letterSpacing: '0.18em',
            cursor: 'pointer',
            transition: 'border-color 0.2s, color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.75)';
          }}
        >
          SHOP ALL
        </button>
      </section>

      <section style={{ backgroundColor: '#fff', padding: '48px 40px', margin: 0 }}>
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
            SHOP ALL
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
        {shopAllLoading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#999' }}>
            LOADING PRODUCTS...
          </div>
        ) : shopAllProducts.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: gridColumns,
              gap: '24px',
            }}
          >
            {shopAllProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                showPrice={showPrice}
                onProductClick={(id) => onNavigate?.('product', { productId: id })}
              />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px', color: '#999' }}>
            NO PRODUCTS AVAILABLE
          </div>
        )}
      </section>

      {/* NEWSLETTER + LOOKBOOK SECTION */}
      <section style={{ backgroundColor: '#f9f9f9', padding: '80px 40px', margin: 0 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 0.6fr',
            gap: '60px',
            maxWidth: '1400px',
            margin: '0 auto',
            alignItems: 'center',
          }}
        >
          {/* Newsletter CTA */}
          <div>
            <h2
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: '24px',
                letterSpacing: '0.08em',
                color: '#000',
                marginBottom: '16px',
              }}
            >
              STAY UPDATED
            </h2>
            <p
              style={{
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontSize: '14px',
                letterSpacing: '0.02em',
                color: '#666',
                marginBottom: '24px',
                lineHeight: 1.6,
              }}
            >
              Get notified about new drops, exclusive releases, and behind-the-scenes content.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                console.log('Newsletter signup');
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <input
                type="email"
                placeholder="Enter your email"
                required
                style={{
                  padding: '12px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  fontSize: '14px',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#000')}
                onBlur={(e) => (e.target.style.borderColor = '#ddd')}
              />
              <button
                type="submit"
                style={{
                  padding: '12px 16px',
                  background: '#000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '13px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#222')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#000')}
              >
                SUBSCRIBE
              </button>
            </form>
          </div>

          {/* Lookbook CTA */}
          <div
            onClick={() => window.open('https://instagram.com', '_blank')}
            style={{
              position: 'relative',
              width: '100%',
              paddingBottom: '100%',
              borderRadius: '8px',
              overflow: 'hidden',
              cursor: 'pointer',
              backgroundImage: `url(${lookbookImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.3s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                color: '#fff',
                padding: '40px',
              }}
            >
              <div
                style={{
                  fontSize: '24px',
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  marginBottom: '8px',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                }}
              >
                SEE.COM
              </div>
              <p
                style={{
                  fontSize: '10px',
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  opacity: 0.85,
                }}
              >
                View →
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
