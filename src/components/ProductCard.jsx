import { useState, useRef } from 'react';
import { useDiscount } from '../contexts/DiscountContext';
import { getEffectivePrice, isDiscounted, getDiscountLabel } from '../utils/discountUtils';

const thumbImage = (url) => {
  if (!url || !url.includes('supabase.co/storage') || url.includes('width=')) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}width=600&format=webp&quality=75`;
};

export default function ProductCard({ product, showPrice, onProductClick }) {
  const [idx, setIdx]           = useState(0);
  const [hovering, setHovering] = useState(false);
  const { discount }            = useDiscount();
  const tx   = useRef(null);
  const ty   = useRef(null);
  const drag = useRef(false);

  const effectivePrice = getEffectivePrice(product, discount);
  const discounted     = isDiscounted(product, discount);
  const discountLabel  = getDiscountLabel(product, discount);

  const images = [product.image_1, product.image_2, product.image_male, product.image_female]
    .filter(Boolean).map(thumbImage);

  const next = (e) => { e?.stopPropagation(); setIdx(i => (i + 1) % images.length); };
  const prev = (e) => { e?.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length); };

  return (
    <div
      onClick={() => { if (!drag.current) onProductClick?.(product.id); }}
      style={{ cursor: 'pointer', userSelect: 'none' }}
    >
      <style>{`
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(5px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

      {/* ── Image ── */}
      <div
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onTouchStart={e => {
          tx.current   = e.touches[0].clientX;
          ty.current   = e.touches[0].clientY;
          drag.current = false;
        }}
        onTouchMove={e => {
          if (tx.current === null) return;
          const dxAbs = Math.abs(e.touches[0].clientX - tx.current);
          const dyAbs = Math.abs(e.touches[0].clientY - ty.current);
          if (dxAbs > dyAbs && dxAbs > 6) {
            drag.current = true;
            e.preventDefault(); // prevent vertical scroll during horizontal swipe
          }
        }}
        onTouchEnd={e => {
          if (tx.current === null) return;
          const dx = e.changedTouches[0].clientX - tx.current;
          const dy = Math.abs(e.changedTouches[0].clientY - ty.current);
          if (Math.abs(dx) > 36 && dy < 80 && images.length > 1) {
            dx < 0 ? next() : prev();
          }
          tx.current = null;
          ty.current = null;
        }}
        style={{
          position: 'relative',
          aspectRatio: '3/4',
          overflow: 'hidden',
          backgroundColor: '#fff',
          touchAction: 'pan-y', // allow vertical scroll, intercept horizontal
        }}
      >
        {/* Product image */}
        <div style={{
          width: '100%', height: '100%',
          backgroundImage: images[idx] ? `url(${images[idx]})` : 'none',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1)',
          transform: hovering ? 'scale(1.03)' : 'scale(1)',
        }} />

        {/* Discount badge */}
        {discounted && discountLabel && (
          <div style={{
            position: 'absolute', top: 8, left: 8, zIndex: 4,
            backgroundColor: '#be1826', color: '#fff',
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700, fontSize: 9, letterSpacing: '0.1em',
            padding: '3px 7px', pointerEvents: 'none',
          }}>
            {discountLabel}
          </div>
        )}

        {/* Image counter — top right */}
        {images.length > 1 && (
          <div style={{
            position: 'absolute', top: 10, right: 10, zIndex: 4,
            display: 'flex', gap: 3, pointerEvents: 'none',
          }}>
            {images.map((_, i) => (
              <div key={i} style={{
                width: i === idx ? 16 : 4, height: 3, borderRadius: 2,
                backgroundColor: i === idx ? '#000' : 'rgba(0,0,0,0.2)',
                transition: 'width 0.25s ease',
              }} />
            ))}
          </div>
        )}

        {/* Desktop arrows */}
        {hovering && images.length > 1 && (
          <>
            <button onClick={prev} style={arrow('left')}>‹</button>
            <button onClick={next} style={arrow('right')}>›</button>
          </>
        )}
      </div>

      {/* ── Info — fixed 48px always, nothing ever shifts ── */}
      <div style={{ paddingTop: 10, height: 48, overflow: 'hidden' }}>
        <p style={{
          fontFamily: "'Clash Display', sans-serif",
          fontWeight: 600, fontSize: 13,
          letterSpacing: '0.04em', color: '#000',
          margin: '0 0 4px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          opacity: hovering || showPrice ? 1 : 0,
          transition: 'opacity 0.25s ease',
        }}>
          {product.name}
        </p>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          opacity: showPrice ? 1 : 0,
          transition: 'opacity 0.25s ease',
        }}>
          {discounted ? (
            <>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 12, color: '#be1826' }}>
                ₦{effectivePrice.toLocaleString()}
              </span>
              <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: 11, color: '#bbb', textDecoration: 'line-through' }}>
                ₦{product.price?.toLocaleString()}
              </span>
            </>
          ) : (
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 12, color: '#000' }}>
              ₦{effectivePrice?.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const arrow = (side) => ({
  position: 'absolute', top: '50%', [side]: 8,
  transform: 'translateY(-50%)',
  width: 28, height: 28, borderRadius: '50%',
  background: 'rgba(255,255,255,0.9)',
  border: '1px solid rgba(0,0,0,0.08)',
  color: '#000', fontSize: 16,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', zIndex: 4,
  backdropFilter: 'blur(4px)',
  boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
});
