import { useState, useEffect, useRef } from 'react';
import { fetchProductById, fetchProductInventory } from '../services/products';
import Footer from '../components/Footer';
import logoBadge from '../assets/logo.webp';
import { useDiscount } from '../contexts/DiscountContext';
import { getEffectivePrice, isDiscounted, getDiscountLabel } from '../utils/discountUtils';

export default function ProductDetailPage({ productId, cart, setCart, onNavigate }) {
  const [product, setProduct]           = useState(null);
  const [inventory, setInventory]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeImage, setActiveImage]   = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [expanded, setExpanded]         = useState(null);
  const [bagState, setBagState]         = useState('idle');
  const [isDesktop, setIsDesktop]       = useState(window.innerWidth >= 820);
  const [ready, setReady]               = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const { discount }                    = useDiscount();

  useEffect(() => {
    const h = () => setIsDesktop(window.innerWidth >= 820);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    if (!productId) return;
    setLoading(true); setSelectedSize(null); setSelectedColor(null); setExpanded(null); setActiveImage(0); setReady(false);
    Promise.all([fetchProductById(productId), fetchProductInventory(productId)])
      .then(([p, inv]) => {
        setProduct(p);
        setInventory(inv);
        const sz = Array.isArray(p?.sizes) ? p.sizes : [];
        if (sz.length === 1) setSelectedSize(sz[0]);
        setTimeout(() => setReady(true), 60);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) return <LoadingState />;
  if (!product)  return <NotFoundState onNavigate={onNavigate} />;

  const images = [product.image_1, product.image_2, product.image_male, product.image_female].filter(Boolean);
  if (!images.length) images.push('');

  const sizes  = Array.isArray(product.sizes)  ? product.sizes  : [];
  const colors = Array.isArray(product.colors) ? product.colors : [];

  const effectivePrice  = getEffectivePrice(product, discount);
  const discounted      = isDiscounted(product, discount);
  const discountLabel   = getDiscountLabel(product, discount);

  const stockFor = (size, color) => {
    if (!inventory.length) return 999;
    const row = inventory.find(i => (!size || i.size === size) && (!color || i.color === color));
    return row?.stock_quantity ?? 0;
  };

  const sizeIsOOS = size => {
    if (!inventory.length) return false;
    if (!colors.length) return stockFor(size, null) === 0;
    return colors.every(c => stockFor(size, c) === 0);
  };

  const selectedStock = (() => {
    if (!selectedSize) return null;
    if (colors.length > 0 && !selectedColor) return null;
    return stockFor(selectedSize, selectedColor);
  })();

  const isSoldOut  = selectedStock !== null && selectedStock === 0;
  const canAddToBag = selectedSize && (colors.length === 0 || selectedColor);

  const toggle = section => setExpanded(p => p === section ? null : section);

  const handleAddToBag = () => {
    // No size selected — expand size accordion
    if (!selectedSize && sizes.length > 1) { setExpanded('size'); return; }
    // Size selected but no color — expand color accordion
    if (selectedSize && colors.length > 0 && !selectedColor) { setExpanded('color'); return; }
    if (isSoldOut) { setBagState('soldout'); return; }
    const id = `${product.id}__${selectedSize}__${selectedColor ?? 'default'}`;
    setCart(prev => {
      const exists = prev.find(i => i.id === id);
      if (exists) return prev.map(i => i.id === id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { id, productId: product.id, name: product.name, price: effectivePrice, image: images[0], size: selectedSize, color: selectedColor, quantity: 1 }];
    });
    setBagState('added');
    setTimeout(() => setBagState('idle'), 1800);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', backgroundColor: '#fff' }}>
      <style>{`
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes clipUp  { from { clip-path:inset(0 0 100% 0); transform:translateY(60%) } to { clip-path:inset(0 0 0 0); transform:translateY(0) } }
        @keyframes modalIn { from { opacity:0; transform:translateY(16px) scale(0.98) } to { opacity:1; transform:translateY(0) scale(1) } }
      `}</style>

      {/* Breadcrumb */}
      <nav style={{
        padding: isDesktop ? '14px 40px' : '12px 20px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex', alignItems: 'center', gap: 8,
        position: 'relative',
        animation: ready ? 'fadeIn 0.5s ease both' : 'none',
      }}>
        <button onClick={() => onNavigate?.('home')} style={crumbBtn}>SEE.COM</button>
        <span style={{ color: '#ddd', fontSize: '10px' }}>›</span>
        {product.category && (
          <>
            <button onClick={() => onNavigate?.(product.category)} style={crumbBtn}>{product.category.toUpperCase()}</button>
            <span style={{ color: '#ddd', fontSize: '10px' }}>›</span>
          </>
        )}
        <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: '10px', letterSpacing: '0.1em', color: '#000', textTransform: 'uppercase' }}>{product.name}</span>

        {/* Logo badge */}
        <img src={logoBadge} alt="SEE.COM" onClick={() => onNavigate?.('landing')} style={{ position: 'absolute', right: isDesktop ? '40px' : '20px', top: '50%', transform: 'translateY(-50%)', width: isDesktop ? '40px' : '34px', height: isDesktop ? '40px' : '34px', objectFit: 'cover', cursor: 'pointer' }} />
      </nav>

      {/* Main */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isDesktop ? '1fr 400px' : '1fr',
        flex: 1, alignItems: 'start',
      }}>
        {/* Gallery */}
        <ImageGallery images={images} activeImage={activeImage} setActiveImage={setActiveImage} isDesktop={isDesktop} ready={ready} />

        {/* Info panel */}
        <div style={{
          position: isDesktop ? 'sticky' : 'static', top: 0,
          borderLeft: isDesktop ? '1px solid #f0f0f0' : 'none',
          display: 'flex', flexDirection: 'column',
          minHeight: isDesktop ? '100dvh' : 'auto',
          opacity: ready ? 1 : 0,
          transform: ready ? 'none' : isDesktop ? 'translateX(12px)' : 'translateY(12px)',
          transition: 'opacity 0.6s 0.2s ease, transform 0.6s 0.2s ease',
        }}>

          {/* Name + price */}
          <div style={{ padding: isDesktop ? '28px 32px 20px' : '24px 20px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div>
              <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '9px', letterSpacing: '0.22em', color: '#be1826', textTransform: 'uppercase', margin: '0 0 8px' }}>
                {product.category}
              </p>
              <div style={{ overflow: 'hidden' }}>
                <h1 style={{
                  fontFamily: "'Clash Display', sans-serif", fontWeight: 600,
                  fontSize: '17px', letterSpacing: '0.04em', color: '#000',
                  margin: 0, lineHeight: 1.2,
                  animation: ready ? 'clipUp 0.7s 0.3s cubic-bezier(0.16,1,0.3,1) both' : 'none',
                }}>
                  {product.name}
                </h1>
              </div>
              {discounted && (
                <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: '11px', color: '#bbb', textDecoration: 'line-through', marginTop: 4, display: 'block' }}>
                  ₦{product.price?.toLocaleString()}
                </span>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 600, fontSize: '18px', letterSpacing: '0.02em', color: discounted ? '#be1826' : '#000', whiteSpace: 'nowrap' }}>
                ₦{effectivePrice?.toLocaleString()}
              </span>
              {discounted && discountLabel && (
                <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '9px', letterSpacing: '0.1em', color: '#be1826', margin: '2px 0 0' }}>{discountLabel} OFF</p>
              )}
            </div>
          </div>

          {/* Accordions */}
          <div style={{ padding: isDesktop ? '20px 32px' : '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* SIZE */}
            {sizes.length > 1 && (
              <Accordion label="SIZE" isOpen={expanded === 'size'} onToggle={() => toggle('size')} badge={selectedSize}>
                <div style={{ padding: '14px 0 6px' }}>
                  <button onClick={() => setShowSizeGuide(true)} style={{ background: 'none', border: 'none', padding: '0 0 12px', fontFamily: "'Archivo', sans-serif", fontSize: '10px', letterSpacing: '0.08em', color: '#bbb', textDecoration: 'underline', textUnderlineOffset: '3px', cursor: 'pointer', transition: 'color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#000'}
                    onMouseLeave={e => e.currentTarget.style.color = '#bbb'}
                  >
                    Size guide
                  </button>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {sizes.map(size => {
                      const oos = sizeIsOOS(size);
                      return <SizeBtn key={size} label={size} selected={selectedSize === size} oos={oos} onClick={() => { if (!oos) setSelectedSize(size); }} />;
                    })}
                  </div>
                </div>
              </Accordion>
            )}

            {sizes.length === 1 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 12px', border: '1px solid #f0f0f0' }}>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', color: '#bbb' }}>SIZE</span>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '10px', letterSpacing: '0.08em', color: '#000' }}>{sizes[0]}</span>
              </div>
            )}

            {/* COLOR */}
            {colors.length > 0 && (
              <Accordion label="COLOR" isOpen={expanded === 'color'} onToggle={() => toggle('color')} badge={selectedColor}>
                <div style={{ padding: '14px 0 6px', display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {colors.map(color => {
                    const oos = selectedSize ? stockFor(selectedSize, color) === 0 : inventory.length > 0 && inventory.filter(i => i.color === color).every(i => i.stock_quantity === 0);
                    return <ColorBtn key={color} label={color} selected={selectedColor === color} oos={oos} onClick={() => { if (!oos) setSelectedColor(color); }} />;
                  })}
                </div>
              </Accordion>
            )}

            {/* DESCRIPTION */}
            {product.description && (
              <Accordion label="DESCRIPTION" isOpen={expanded === 'description'} onToggle={() => toggle('description')}>
                <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '13px', lineHeight: 1.8, color: '#666', letterSpacing: '0.01em', margin: '14px 0 6px' }}>
                  {product.description}
                </p>
              </Accordion>
            )}
          </div>

          {/* Add to bag */}
          <div style={{ padding: isDesktop ? '20px 32px 32px' : '16px 20px 28px', borderTop: '1px solid #f0f0f0' }}>
            {!selectedSize && sizes.length > 1 && (
              <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '10px', letterSpacing: '0.1em', color: '#bbb', textAlign: 'center', margin: '0 0 12px', textTransform: 'uppercase' }}>
                Select a size to continue
              </p>
            )}
            <AddToBag state={bagState} isSoldOut={isSoldOut} onClick={handleAddToBag} />
          </div>
        </div>
      </div>

      {/* ── SIZE GUIDE MODAL ── */}
      {showSizeGuide && (
        <div
          onClick={() => setShowSizeGuide(false)}
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 99999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: '#fff',
              width: '100%', maxWidth: '520px',
              maxHeight: '90dvh', overflowY: 'auto',
              animation: 'modalIn 0.3s cubic-bezier(0.16,1,0.3,1) both',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #f0f0f0' }}>
              <div>
                <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '9px', letterSpacing: '0.22em', color: '#be1826', textTransform: 'uppercase', margin: '0 0 4px' }}>
                  Reference
                </p>
                <h2 style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 600, fontSize: '18px', letterSpacing: '0.04em', color: '#000', margin: 0 }}>
                  Size Guide
                </h2>
              </div>
              <button onClick={() => setShowSizeGuide(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', padding: 4, transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#000'}
                onMouseLeave={e => e.currentTarget.style.color = '#bbb'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 4l16 16M20 4L4 20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
              </button>
            </div>

            {/* T-Shirts table */}
            {(!product.category || product.category === 'tshirts') && (
              <div style={{ padding: '20px 24px 0' }}>
                <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '10px', letterSpacing: '0.14em', color: '#000', textTransform: 'uppercase', margin: '0 0 14px' }}>T-Shirts — cm</p>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Archivo', sans-serif" }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #000' }}>
                      {['Size', 'Chest', 'Length', 'Shoulder', 'Sleeve'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: '9px', letterSpacing: '0.14em', fontWeight: 700, color: '#000', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['XS', '86–91', '66', '41', '60'],
                      ['S',  '91–96', '69', '43', '62'],
                      ['M',  '96–101','71', '45', '64'],
                      ['L',  '101–106','74','47', '66'],
                      ['XL', '106–111','76','49', '68'],
                    ].map(([size, ...vals], i) => (
                      <tr key={size} style={{ backgroundColor: i % 2 === 0 ? '#fafafa' : '#fff', borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '10px 10px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '12px', color: '#000' }}>{size}</td>
                        {vals.map((v, vi) => (
                          <td key={vi} style={{ padding: '10px 10px', fontSize: '12px', color: '#555' }}>{v}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Chains note */}
            {product.category === 'chains' && (
              <div style={{ padding: '24px' }}>
                <div style={{ padding: '16px', backgroundColor: '#f9f9f9', borderLeft: '2px solid #be1826' }}>
                  <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '13px', color: '#555', lineHeight: 1.7, margin: 0 }}>
                    All SEE.COM chains are <strong style={{ color: '#000' }}>one size fits all</strong>. Standard length: <strong style={{ color: '#000' }}>50cm</strong> with an adjustable clasp. Contact us if you need a custom length.
                  </p>
                </div>
              </div>
            )}

            {/* How to measure */}
            <div style={{ padding: '20px 24px', borderTop: '1px solid #f0f0f0', marginTop: 4 }}>
              <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '9px', letterSpacing: '0.14em', color: '#000', textTransform: 'uppercase', margin: '0 0 12px' }}>
                How to measure
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  ['Chest',    'Measure around the fullest part of your chest, keeping the tape horizontal.'],
                  ['Length',   'From the highest point of the shoulder down to the hem.'],
                  ['Shoulder', 'From shoulder seam to shoulder seam across the back.'],
                  ['Sleeve',   'From the shoulder seam to the end of the cuff.'],
                ].map(([label, desc]) => (
                  <div key={label} style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8 }}>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '11px', color: '#000' }}>{label}</span>
                    <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: '11px', color: '#888', lineHeight: 1.5 }}>{desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer note */}
            <div style={{ padding: '14px 24px 24px' }}>
              <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '10px', color: '#bbb', letterSpacing: '0.04em', margin: 0, lineHeight: 1.6 }}>
                Measurements are in centimetres. If you're between sizes, size up. All SEE.COM pieces are designed with a relaxed fit.
              </p>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

function ImageGallery({ images, activeImage, setActiveImage, isDesktop, ready }) {
  const touchStart = useRef(null);
  const prev = () => setActiveImage(i => i === 0 ? images.length - 1 : i - 1);
  const next = () => setActiveImage(i => i === images.length - 1 ? 0 : i + 1);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      opacity: ready ? 1 : 0,
      transition: 'opacity 0.7s ease',
    }}>
      <div style={{ position: 'relative', width: '100%', paddingBottom: isDesktop ? '120%' : '100%', backgroundColor: '#f7f7f7', overflow: 'hidden' }}
        onTouchStart={e => { touchStart.current = e.touches[0].clientX; }}
        onTouchEnd={e => {
          if (touchStart.current === null) return;
          const dx = e.changedTouches[0].clientX - touchStart.current;
          if (Math.abs(dx) > 40) dx < 0 ? next() : prev();
          touchStart.current = null;
        }}
      >
        {images.map((src, idx) => (
          <div key={idx} style={{
            position: 'absolute', inset: 0,
            backgroundImage: src ? `url(${src})` : 'none',
            backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: activeImage === idx ? 1 : 0,
            transition: 'opacity 0.4s ease',
            backgroundColor: '#f7f7f7',
          }} />
        ))}

        {images.length > 1 && (
          <>
            <button onClick={prev} style={arrowStyle('left')}>‹</button>
            <button onClick={next} style={arrowStyle('right')}>›</button>
          </>
        )}

        {images.length > 1 && (
          <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5 }}>
            {images.map((_, idx) => (
              <button key={idx} onClick={() => setActiveImage(idx)} style={{ width: activeImage === idx ? 18 : 5, height: 5, borderRadius: 3, background: activeImage === idx ? '#000' : 'rgba(0,0,0,0.2)', border: 'none', cursor: 'pointer', padding: 0, transition: 'width 0.25s ease, background 0.25s ease' }} />
            ))}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div style={{ display: 'flex', gap: 7, padding: '10px 14px', overflowX: 'auto' }}>
          {images.map((src, idx) => (
            <button key={idx} onClick={() => setActiveImage(idx)} style={{ flexShrink: 0, width: 56, height: 68, backgroundImage: src ? `url(${src})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#f5f5f5', border: `2px solid ${activeImage === idx ? '#000' : 'transparent'}`, cursor: 'pointer', padding: 0, transition: 'border-color 0.15s' }} />
          ))}
        </div>
      )}
    </div>
  );
}

function Accordion({ label, isOpen, onToggle, badge, children }) {
  return (
    <div>
      {!isOpen && (
        <button onClick={onToggle} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', backgroundColor: '#f5f5f5', border: 'none', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '10px', letterSpacing: '0.14em', color: '#000', textTransform: 'uppercase', transition: 'background 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = '#ebebeb'}
          onMouseLeave={e => e.currentTarget.style.background = '#f5f5f5'}
        >
          {label}
          {badge && <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: '10px', fontWeight: 400, color: '#888', letterSpacing: '0.04em' }}>{badge}</span>}
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M1 3l4 4 4-4" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      )}
      {isOpen && (
        <div style={{ border: '1px solid #ebebeb' }}>
          <button onClick={onToggle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 14px', backgroundColor: '#f5f5f5', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '10px', letterSpacing: '0.14em', color: '#000', textTransform: 'uppercase' }}>{label}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M4 4l16 16M20 4L4 20" stroke="#000" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </button>
          <div style={{ padding: '0 14px 14px' }}>{children}</div>
        </div>
      )}
    </div>
  );
}

function SizeBtn({ label, selected, oos, onClick }) {
  return (
    <button onClick={onClick} disabled={oos} style={{ position: 'relative', width: 50, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${selected ? '#000' : '#e0e0e0'}`, background: selected ? '#000' : '#fff', cursor: oos ? 'default' : 'pointer', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '11px', letterSpacing: '0.08em', color: oos ? '#ccc' : selected ? '#fff' : '#000', transition: 'all 0.15s', overflow: 'hidden', minWidth: 48, minHeight: 48 }}
      onMouseEnter={e => { if (!oos && !selected) e.currentTarget.style.borderColor = '#000'; }}
      onMouseLeave={e => { if (!oos && !selected) e.currentTarget.style.borderColor = '#e0e0e0'; }}
    >
      {label}
      {oos && <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom right, transparent calc(50% - 0.8px), #be1826 calc(50% - 0.8px), #be1826 calc(50% + 0.8px), transparent calc(50% + 0.8px))', pointerEvents: 'none' }} />}
    </button>
  );
}

function ColorBtn({ label, selected, oos, onClick }) {
  return (
    <button onClick={onClick} disabled={oos} style={{ position: 'relative', padding: '7px 12px', border: `1px solid ${selected ? '#000' : '#e0e0e0'}`, background: selected ? '#000' : '#fff', cursor: oos ? 'default' : 'pointer', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '10px', letterSpacing: '0.08em', color: oos ? '#ccc' : selected ? '#fff' : '#000', transition: 'all 0.15s', overflow: 'hidden' }}
      onMouseEnter={e => { if (!oos && !selected) e.currentTarget.style.borderColor = '#000'; }}
      onMouseLeave={e => { if (!oos && !selected) e.currentTarget.style.borderColor = '#e0e0e0'; }}
    >
      {label}
      {oos && <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom right, transparent calc(50% - 0.8px), #be1826 calc(50% - 0.8px), #be1826 calc(50% + 0.8px), transparent calc(50% + 0.8px))', pointerEvents: 'none' }} />}
    </button>
  );
}

function AddToBag({ state, isSoldOut, onClick }) {
  const soldOut = isSoldOut || state === 'soldout';
  const bg = soldOut ? '#7c4a2d' : state === 'added' ? '#1a6b3c' : '#000';
  const label = soldOut ? 'SOLD OUT' : state === 'added' ? 'ADDED ✓' : 'ADD TO BAG';
  return (
    <button onClick={onClick} style={{ width: '100%', padding: '16px', background: bg, color: '#fff', border: 'none', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '11px', letterSpacing: '0.2em', cursor: soldOut ? 'not-allowed' : 'pointer', transition: 'background 0.3s ease', minHeight: 52, WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}>
      {label}
    </button>
  );
}

function LoadingState() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 24, height: 24, border: '1.5px solid #e0e0e0', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

function NotFoundState({ onNavigate }) {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <p style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 600, fontSize: '16px', letterSpacing: '0.04em', color: '#ccc' }}>Product not found</p>
      <button onClick={() => onNavigate?.('shop')} style={{ padding: '11px 24px', background: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Back to Shop</button>
    </div>
  );
}

const crumbBtn = { background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: "'Archivo', sans-serif", fontSize: '10px', letterSpacing: '0.1em', color: '#bbb', textTransform: 'uppercase', transition: 'color 0.15s' };

const arrowStyle = side => ({
  position: 'absolute', top: '50%', [side]: '10px',
  transform: 'translateY(-50%)',
  width: 34, height: 34, borderRadius: '50%',
  background: 'rgba(255,255,255,0.88)', border: 'none',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '20px', color: '#000', zIndex: 2, transition: 'background 0.15s',
});
