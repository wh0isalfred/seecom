import { useState, useEffect, useRef } from 'react';
import { fetchProductById, fetchProductInventory } from '../services/products';
import Footer from '../components/Footer';

export default function ProductDetailPage({ productId, cart, setCart, onNavigate }) {
  const [product, setProduct]     = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading]     = useState(true);

  const [activeImage, setActiveImage]   = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [expanded, setExpanded]         = useState(null); // 'size' | 'color' | 'description'
  const [bagState, setBagState]         = useState('idle'); // 'idle' | 'added' | 'soldout'
  const [isDesktop, setIsDesktop]       = useState(window.innerWidth >= 820);

  useEffect(() => {
    const h = () => setIsDesktop(window.innerWidth >= 820);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    setSelectedSize(null);
    setSelectedColor(null);
    setExpanded(null);
    setActiveImage(0);

    Promise.all([fetchProductById(productId), fetchProductInventory(productId)])
      .then(([p, inv]) => {
        setProduct(p);
        setInventory(inv);
        // Auto-select if only one size (e.g. chains / one-size products)
        const sz = Array.isArray(p?.sizes) ? p.sizes : [];
        if (sz.length === 1) setSelectedSize(sz[0]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) return <LoadingState />;
  if (!product)  return <NotFoundState onNavigate={onNavigate} />;

  // ── Derived data ─────────────────────────────────────────
  const images = [product.image_1, product.image_2, product.image_male, product.image_female].filter(Boolean);
  if (images.length === 0) images.push(''); // fallback placeholder

  const sizes  = Array.isArray(product.sizes)  ? product.sizes  : [];
  const colors = Array.isArray(product.colors) ? product.colors : [];

  const stockFor = (size, color) => {
    if (inventory.length === 0) return 999; // no inventory data → assume in stock
    const row = inventory.find(
      i => (!size || i.size === size) && (!color || i.color === color)
    );
    return row?.stock_quantity ?? 0;
  };

  // A size is "dead" if ALL colors have 0 stock for it
  const sizeIsOOS = (size) => {
    if (inventory.length === 0) return false;
    if (colors.length === 0) return stockFor(size, null) === 0;
    return colors.every(c => stockFor(size, c) === 0);
  };

  // The currently selected combo
  const selectedStock = (() => {
    if (!selectedSize) return null;
    if (colors.length > 0 && !selectedColor) return null;
    return stockFor(selectedSize, selectedColor);
  })();

  const isSoldOut  = selectedStock !== null && selectedStock === 0;
  const canAddToBag = selectedSize && (colors.length === 0 || selectedColor);

  // ── Actions ──────────────────────────────────────────────
  const toggle = (section) => setExpanded(p => p === section ? null : section);

  const handleAddToBag = () => {
    if (!canAddToBag) { setExpanded('size'); return; }
    if (isSoldOut) { setBagState('soldout'); return; }

    const id = `${product.id}__${selectedSize}__${selectedColor ?? 'default'}`;
    setCart(prev => {
      const exists = prev.find(i => i.id === id);
      if (exists) return prev.map(i => i.id === id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, {
        id,
        productId: product.id,
        name: product.name,
        price: product.discount_price || product.price,
        image: images[0],
        size: selectedSize,
        color: selectedColor,
        quantity: 1,
      }];
    });

    setBagState('added');
    setTimeout(() => setBagState('idle'), 1800);
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#fff' }}>

      {/* Breadcrumb header */}
      <div style={{
        padding: '16px 40px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <BreadCrumb label="SEE.COM" onClick={() => onNavigate?.('home')} />
        <Chevron />
        {product.category && (
          <>
            <BreadCrumb
              label={product.category.toUpperCase()}
              onClick={() => onNavigate?.(product.category)}
            />
            <Chevron />
          </>
        )}
        <span style={crumbActive}>{product.name}</span>
      </div>

      {/* Main content */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isDesktop ? '1fr 420px' : '1fr',
        flex: 1,
        alignItems: 'start',
      }}>

        {/* ── Left: image gallery ── */}
        <ImageGallery
          images={images}
          activeImage={activeImage}
          setActiveImage={setActiveImage}
          isDesktop={isDesktop}
        />

        {/* ── Right: product info ── */}
        <div style={{
          position: isDesktop ? 'sticky' : 'static',
          top: 0,
          borderLeft: isDesktop ? '1px solid #f0f0f0' : 'none',
          display: 'flex',
          flexDirection: 'column',
          minHeight: isDesktop ? '100vh' : 'auto',
        }}>

          {/* Name + price */}
          <div style={{
            padding: '28px 28px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '16px',
            borderBottom: '1px solid #f0f0f0',
          }}>
            <div>
              <h1 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: '14px',
                letterSpacing: '0.06em',
                color: '#000',
                margin: 0,
                lineHeight: 1.3,
              }}>
                {product.name}
              </h1>
              {product.discount_price && (
                <span style={{
                  fontFamily: "'Archivo', sans-serif",
                  fontSize: '11px',
                  color: '#aaa',
                  textDecoration: 'line-through',
                  marginTop: '4px',
                  display: 'block',
                }}>
                  ₦{product.price?.toLocaleString()}
                </span>
              )}
            </div>
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: '14px',
              letterSpacing: '0.04em',
              color: '#000',
              whiteSpace: 'nowrap',
            }}>
              ₦{(product.discount_price || product.price)?.toLocaleString()}
            </span>
          </div>

          {/* Accordion sections */}
          <div style={{ padding: '16px 28px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>

            {/* SIZE — hidden if only one option (auto-selected above) */}
            {sizes.length > 1 && (
              <AccordionSection
                label="SIZE"
                isOpen={expanded === 'size'}
                onToggle={() => toggle('size')}
              >
                <div style={{ padding: '14px 0 6px' }}>
                  <button
                    style={{
                      background: 'none', border: 'none', padding: '0 0 14px',
                      fontFamily: "'Archivo', sans-serif",
                      fontSize: '11px', letterSpacing: '0.06em',
                      color: '#888', textDecoration: 'underline',
                      cursor: 'pointer',
                    }}
                  >
                    size guide
                  </button>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {sizes.map(size => {
                      const oos      = sizeIsOOS(size);
                      const selected = selectedSize === size;
                      return (
                        <SizeButton
                          key={size}
                          label={size}
                          selected={selected}
                          oos={oos}
                          onClick={() => { if (!oos) setSelectedSize(size); }}
                        />
                      );
                    })}
                  </div>
                </div>
              </AccordionSection>
            )}

            {/* Single size label (e.g. chains) */}
            {sizes.length === 1 && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '8px 14px', backgroundColor: '#f0f0f0',
              }}>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', color: '#999' }}>
                  SIZE
                </span>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '11px', letterSpacing: '0.08em', color: '#000' }}>
                  {sizes[0]}
                </span>
              </div>
            )}

            {/* COLOR */}
            {colors.length > 0 && (
              <AccordionSection
                label="COLOR"
                isOpen={expanded === 'color'}
                onToggle={() => toggle('color')}
                badge={selectedColor || null}
              >
                <div style={{ padding: '14px 0 6px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {colors.map(color => {
                    const oos = selectedSize
                      ? stockFor(selectedSize, color) === 0
                      : inventory.length > 0 && inventory.filter(i => i.color === color).every(i => i.stock_quantity === 0);
                    const selected = selectedColor === color;
                    return (
                      <ColorButton
                        key={color}
                        label={color}
                        selected={selected}
                        oos={oos}
                        onClick={() => { if (!oos) setSelectedColor(color); }}
                      />
                    );
                  })}
                </div>
              </AccordionSection>
            )}

            {/* DESCRIPTION */}
            {product.description && (
              <AccordionSection
                label="DESCRIPTION"
                isOpen={expanded === 'description'}
                onToggle={() => toggle('description')}
              >
                <p style={{
                  fontFamily: "'Archivo', Helvetica, Arial, sans-serif",
                  fontSize: '13px',
                  lineHeight: 1.75,
                  color: '#444',
                  letterSpacing: '0.01em',
                  margin: '14px 0 8px',
                }}>
                  {product.description}
                </p>
              </AccordionSection>
            )}

          </div>

          {/* ADD TO BAG — pinned to bottom */}
          <div style={{ padding: '20px 28px 28px', borderTop: '1px solid #f0f0f0' }}>

            {/* Selection nudge */}
            {!selectedSize && sizes.length > 1 && (
              <p style={{
                fontFamily: "'Archivo', sans-serif",
                fontSize: '11px', letterSpacing: '0.06em',
                color: '#aaa', textAlign: 'center',
                marginBottom: '12px',
              }}>
                SELECT A SIZE TO CONTINUE
              </p>
            )}

            <AddToBagButton
              state={bagState}
              canAdd={canAddToBag}
              isSoldOut={isSoldOut}
              onClick={handleAddToBag}
            />
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}

// ── Image Gallery ─────────────────────────────────────────
function ImageGallery({ images, activeImage, setActiveImage, isDesktop }) {
  const touchStart = useRef(null);

  const prev = () => setActiveImage(i => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setActiveImage(i => (i === images.length - 1 ? 0 : i + 1));

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>

      {/* Main image */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingBottom: isDesktop ? '120%' : '100%',
          backgroundColor: '#f5f5f5',
          overflow: 'hidden',
        }}
        onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchStart.current === null) return;
          const dx = e.changedTouches[0].clientX - touchStart.current;
          if (Math.abs(dx) > 40) dx < 0 ? next() : prev();
          touchStart.current = null;
        }}
      >
        {images.map((src, idx) => (
          <div
            key={idx}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: src ? `url(${src})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: activeImage === idx ? 1 : 0,
              transition: 'opacity 0.35s ease',
              backgroundColor: '#f5f5f5',
            }}
          />
        ))}

        {/* Prev/Next arrows */}
        {images.length > 1 && (
          <>
            <button onClick={prev} style={arrowBtn('left')}>‹</button>
            <button onClick={next} style={arrowBtn('right')}>›</button>
          </>
        )}

        {/* Dot indicator */}
        {images.length > 1 && (
          <div style={{
            position: 'absolute', bottom: '16px', left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex', gap: '6px',
          }}>
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(idx)}
                style={{
                  width: activeImage === idx ? '20px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  background: activeImage === idx ? '#000' : 'rgba(0,0,0,0.25)',
                  border: 'none', cursor: 'pointer', padding: 0,
                  transition: 'width 0.25s ease, background 0.25s ease',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div style={{
          display: 'flex', gap: '8px', padding: '12px 16px',
          overflowX: 'auto',
        }}>
          {images.map((src, idx) => (
            <button
              key={idx}
              onClick={() => setActiveImage(idx)}
              style={{
                flexShrink: 0,
                width: '60px', height: '72px',
                backgroundImage: src ? `url(${src})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: '#f5f5f5',
                border: `2px solid ${activeImage === idx ? '#000' : 'transparent'}`,
                cursor: 'pointer',
                padding: 0,
                transition: 'border-color 0.15s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Accordion Section ─────────────────────────────────────
function AccordionSection({ label, isOpen, onToggle, badge, children }) {
  return (
    <div>
      {/* Toggle pill (collapsed) */}
      {!isOpen && (
        <button
          onClick={onToggle}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 16px',
            backgroundColor: '#f0f0f0',
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: '11px',
            letterSpacing: '0.12em',
            color: '#000',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#e8e8e8')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#f0f0f0')}
        >
          {label}
          {badge && (
            <span style={{
              fontFamily: "'Archivo', sans-serif",
              fontSize: '10px',
              fontWeight: 400,
              color: '#666',
              letterSpacing: '0.04em',
            }}>
              {badge}
            </span>
          )}
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 3l4 4 4-4" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* Expanded box */}
      {isOpen && (
        <div style={{
          border: '1px solid #e0e0e0',
          backgroundColor: '#fff',
        }}>
          {/* Header */}
          <button
            onClick={onToggle}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '11px 16px',
              backgroundColor: '#f0f0f0',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: '11px',
              letterSpacing: '0.12em',
              color: '#000',
            }}>
              {label}
            </span>
            {/* × close */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M4 4l16 16M20 4L4 20" stroke="#000" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>

          {/* Content */}
          <div style={{ padding: '0 16px 16px' }}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Size Button ───────────────────────────────────────────
function SizeButton({ label, selected, oos, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={oos}
      style={{
        position: 'relative',
        width: '52px',
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `1px solid ${selected ? '#000' : '#d0d0d0'}`,
        background: selected ? '#000' : '#fff',
        cursor: oos ? 'default' : 'pointer',
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 600,
        fontSize: '11px',
        letterSpacing: '0.08em',
        color: oos ? '#ccc' : selected ? '#fff' : '#000',
        transition: 'all 0.15s',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => { if (!oos && !selected) e.currentTarget.style.borderColor = '#000'; }}
      onMouseLeave={(e) => { if (!oos && !selected) e.currentTarget.style.borderColor = '#d0d0d0'; }}
    >
      {label}

      {/* Red slash overlay for OOS */}
      {oos && (
        <span style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom right, transparent calc(50% - 0.8px), #be1826 calc(50% - 0.8px), #be1826 calc(50% + 0.8px), transparent calc(50% + 0.8px))',
          pointerEvents: 'none',
        }} />
      )}
    </button>
  );
}

// ── Color Button ──────────────────────────────────────────
function ColorButton({ label, selected, oos, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={oos}
      style={{
        position: 'relative',
        padding: '8px 14px',
        border: `1px solid ${selected ? '#000' : '#d0d0d0'}`,
        background: selected ? '#000' : '#fff',
        cursor: oos ? 'default' : 'pointer',
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 600,
        fontSize: '11px',
        letterSpacing: '0.08em',
        color: oos ? '#ccc' : selected ? '#fff' : '#000',
        transition: 'all 0.15s',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => { if (!oos && !selected) e.currentTarget.style.borderColor = '#000'; }}
      onMouseLeave={(e) => { if (!oos && !selected) e.currentTarget.style.borderColor = '#d0d0d0'; }}
    >
      {label}
      {oos && (
        <span style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom right, transparent calc(50% - 0.8px), #be1826 calc(50% - 0.8px), #be1826 calc(50% + 0.8px), transparent calc(50% + 0.8px))',
          pointerEvents: 'none',
        }} />
      )}
    </button>
  );
}

// ── Add to Bag Button ─────────────────────────────────────
function AddToBagButton({ state, canAdd, isSoldOut, onClick }) {
  const isSoldOutDisplay = isSoldOut || state === 'soldout';

  const bg = isSoldOutDisplay
    ? '#7c4a2d'        // brown for sold out
    : state === 'added'
    ? '#1a6b3c'        // green flash when added
    : '#000';          // default black

  const label = isSoldOutDisplay
    ? 'SOLD OUT'
    : state === 'added'
    ? 'ADDED ✓'
    : 'ADD TO BAG';

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '16px',
        background: bg,
        color: '#fff',
        border: 'none',
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 700,
        fontSize: '12px',
        letterSpacing: '0.18em',
        cursor: isSoldOutDisplay ? 'not-allowed' : 'pointer',
        transition: 'background 0.3s ease',
      }}
    >
      {label}
    </button>
  );
}

// ── Loading / Not Found ───────────────────────────────────
function LoadingState() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '11px', letterSpacing: '0.2em', color: '#aaa',
      }}>
        LOADING...
      </span>
    </div>
  );
}

function NotFoundState({ onNavigate }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '20px',
    }}>
      <p style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '13px', letterSpacing: '0.1em', color: '#000',
      }}>
        PRODUCT NOT FOUND
      </p>
      <button
        onClick={() => onNavigate?.('shop')}
        style={{
          padding: '12px 28px', background: '#000', color: '#fff',
          border: 'none', cursor: 'pointer',
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700, fontSize: '11px', letterSpacing: '0.14em',
        }}
      >
        BACK TO SHOP
      </button>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────
function BreadCrumb({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none', border: 'none', padding: 0, cursor: 'pointer',
        fontFamily: "'Clash Display', sans-serif",
        fontSize: '10px', letterSpacing: '0.22em',
        color: '#aaa', textTransform: 'uppercase',
        transition: 'color 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = '#000')}
      onMouseLeave={(e) => (e.currentTarget.style.color = '#aaa')}
    >
      {label}
    </button>
  );
}

function Chevron() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
      <path d="M9 18l6-6-6-6" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const crumbActive = {
  fontFamily: "'Archivo', Helvetica, Arial, sans-serif",
  fontSize: '10px', letterSpacing: '0.1em',
  color: '#000', textTransform: 'uppercase',
};

const arrowBtn = (side) => ({
  position: 'absolute',
  top: '50%',
  [side]: '12px',
  transform: 'translateY(-50%)',
  width: '36px', height: '36px',
  borderRadius: '50%',
  background: 'rgba(255,255,255,0.85)',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '22px',
  color: '#000',
  zIndex: 2,
  transition: 'background 0.15s',
});
