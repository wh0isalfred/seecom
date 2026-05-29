import { useState } from 'react';
import { useDiscount } from '../contexts/DiscountContext';
import { getEffectivePrice, isDiscounted, getDiscountLabel } from '../utils/discountUtils';

export default function ProductCard({ product, showPrice, onProductClick }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const { discount } = useDiscount();

  const effectivePrice = getEffectivePrice(product, discount);
  const discounted     = isDiscounted(product, discount);
  const discountLabel  = getDiscountLabel(product, discount);

  const images = [product.image_1, product.image_2, product.image_male, product.image_female].filter(Boolean);

  const handlePrevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const currentImage = images[currentImageIndex] || '';

  return (
    <div
      onClick={() => onProductClick?.(product.id)}
      style={{
        cursor: 'pointer',
      }}
    >
      {/* Image Container */}
      <div
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        style={{
          position: 'relative',
          aspectRatio: '1/1',
          backgroundColor: '#f5f5f5',
          overflow: 'hidden',
          marginBottom: '12px',
        }}
      >
        {/* Product Image */}
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundImage: `url(${currentImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        {/* Discount badge */}
        {discounted && discountLabel && (
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            backgroundColor: '#be1826',
            color: '#fff',
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: '10px',
            letterSpacing: '0.06em',
            padding: '3px 7px',
            zIndex: 5,
            pointerEvents: 'none',
          }}>
            {discountLabel}
          </div>
        )}
        {isHovering && (
          <>
            <button
              onClick={handlePrevImage}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0, 0, 0, 0.5)',
                border: 'none',
                color: '#fff',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
                fontSize: '18px',
              }}
            >
              ‹
            </button>

            <button
              onClick={handleNextImage}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0, 0, 0, 0.5)',
                border: 'none',
                color: '#fff',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
                fontSize: '18px',
              }}
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Info Below Image - Always reserve space, show conditionally */}
      <div
        style={{
          paddingBottom: 0,
          minHeight: '48px',
          overflow: 'hidden',
        }}
      >
        {/* Product Name */}
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 600,
            fontSize: '13px',
            letterSpacing: '0.05em',
            color: '#000',
            marginBottom: showPrice ? '6px' : 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            opacity: isHovering || showPrice ? 1 : 0,
            transition: 'opacity 0.2s',
            pointerEvents: 'none',
          }}
        >
          {product.name}
        </div>

        {/* Price */}
        <div style={{ opacity: showPrice ? 1 : 0, transition: 'opacity 0.2s', pointerEvents: 'none' }}>
          {discounted ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontWeight: 700, fontSize: '12px', letterSpacing: '0.05em', color: '#be1826' }}>
                ₦{effectivePrice.toLocaleString()}
              </span>
              <span style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontWeight: 400, fontSize: '11px', color: '#bbb', textDecoration: 'line-through' }}>
                ₦{product.price?.toLocaleString()}
              </span>
            </div>
          ) : (
            <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontWeight: 700, fontSize: '12px', letterSpacing: '0.05em', color: '#000' }}>
              ₦{product.price?.toLocaleString() || 'N/A'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
