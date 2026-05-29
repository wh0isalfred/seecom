import { useState, useEffect } from 'react';
import Footer from '../components/Footer';
import logoBadge from '../assets/logo.jpeg';

// Cart item shape (set by ProductDetailPage when adding to cart):
// { id: string, productId: string, name: string, price: number,
//   image: string, size: string, color: string, quantity: number }

const SHIPPING_THRESHOLD = 50000; // free shipping above ₦50,000
const FLAT_SHIPPING      = 3500;  // ₦3,500 flat rate below threshold

export default function CartPage({ cart = [], setCart, onNavigate }) {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 900);

  useEffect(() => {
    const handle = () => setIsDesktop(window.innerWidth >= 900);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  // ── Cart operations ─────────────────────────────────────
  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // ── Totals ───────────────────────────────────────────────
  const subtotal  = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping  = subtotal === 0 ? 0 : subtotal >= SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
  const total     = subtotal + shipping;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const fmt = (n) => `₦${n.toLocaleString()}`;

  // ── Empty state ──────────────────────────────────────────
  if (cart.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <PageHeader onNavigate={onNavigate} />

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 40px',
            gap: '28px',
          }}
        >
          {/* Bag outline illustration */}
          <svg width="64" height="68" viewBox="0 0 64 68" fill="none" opacity="0.18">
            <path d="M22 26V13a10 10 0 0 1 20 0V26" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M8 26h48l5 40H3L8 26Z" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
          </svg>

          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: '13px',
                letterSpacing: '0.14em',
                color: '#000',
                marginBottom: '10px',
              }}
            >
              YOUR BAG IS EMPTY
            </p>
            <p
              style={{
                fontFamily: "'Archivo', Helvetica, Arial, sans-serif",
                fontSize: '13px',
                color: '#999',
                letterSpacing: '0.02em',
              }}
            >
              Add something to get started.
            </p>
          </div>

          <button
            onClick={() => onNavigate?.('shop')}
            style={{
              padding: '13px 36px',
              background: '#000',
              color: '#fff',
              border: 'none',
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: '11px',
              letterSpacing: '0.16em',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#be1826')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#000')}
          >
            SHOP ALL
          </button>
        </div>

        <Footer />
      </div>
    );
  }

  // ── Filled cart ──────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#fff' }}>
      <PageHeader onNavigate={onNavigate} />

      {/* Title row */}
      <div
        style={{
          padding: '32px 40px 20px',
          display: 'flex',
          alignItems: 'baseline',
          gap: '12px',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <h1
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 'clamp(16px, 2vw, 22px)',
            letterSpacing: '0.1em',
            color: '#000',
            margin: 0,
          }}
        >
          YOUR BAG
        </h1>
        <span
          style={{
            fontFamily: "'Archivo', Helvetica, Arial, sans-serif",
            fontSize: '12px',
            letterSpacing: '0.06em',
            color: '#aaa',
          }}
        >
          {itemCount} {itemCount === 1 ? 'ITEM' : 'ITEMS'}
        </span>
      </div>

      {/* Main layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isDesktop ? '1fr 360px' : '1fr',
          gap: 0,
          flex: 1,
          alignItems: 'start',
        }}
      >
        {/* ── Left: item list ── */}
        <div style={{ padding: isDesktop ? '0 0 60px' : '0 0 40px' }}>
          {cart.map((item, idx) => (
            <CartItem
              key={item.id}
              item={item}
              isLast={idx === cart.length - 1}
              onUpdateQty={updateQty}
              onRemove={removeItem}
              onProductClick={() => onNavigate?.('product', { productId: item.productId })}
              fmt={fmt}
            />
          ))}

          {/* Continue shopping */}
          <div style={{ padding: '24px 40px 0' }}>
            <button
              onClick={() => onNavigate?.('shop')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'Archivo', Helvetica, Arial, sans-serif",
                fontSize: '11px',
                letterSpacing: '0.1em',
                color: '#888',
                textTransform: 'uppercase',
                padding: 0,
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#000')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#888')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Continue Shopping
            </button>
          </div>
        </div>

        {/* ── Right: order summary ── */}
        <div
          style={{
            position: isDesktop ? 'sticky' : 'static',
            top: 0,
            borderLeft: isDesktop ? '1px solid #f0f0f0' : 'none',
            borderTop: isDesktop ? 'none' : '1px solid #f0f0f0',
            padding: '32px 40px 40px',
            backgroundColor: '#fff',
          }}
        >
          <p
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: '11px',
              letterSpacing: '0.16em',
              color: '#000',
              marginBottom: '24px',
            }}
          >
            ORDER SUMMARY
          </p>

          {/* Line items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
            <SummaryLine label="Subtotal" value={fmt(subtotal)} />
            <SummaryLine
              label="Shipping"
              value={
                subtotal >= SHIPPING_THRESHOLD
                  ? 'FREE'
                  : fmt(FLAT_SHIPPING)
              }
              valueColor={subtotal >= SHIPPING_THRESHOLD ? '#16a34a' : '#000'}
            />
          </div>

          {/* Shipping note */}
          {subtotal < SHIPPING_THRESHOLD && subtotal > 0 && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: '#f9f9f9',
                borderLeft: '3px solid #e0e0e0',
                marginBottom: '20px',
              }}
            >
              <p
                style={{
                  fontFamily: "'Archivo', Helvetica, Arial, sans-serif",
                  fontSize: '11px',
                  color: '#666',
                  letterSpacing: '0.02em',
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                Add {fmt(SHIPPING_THRESHOLD - subtotal)} more for{' '}
                <span style={{ color: '#16a34a', fontWeight: 600 }}>free shipping</span>
              </p>
            </div>
          )}

          {/* Divider */}
          <div style={{ height: '1px', background: '#f0f0f0', marginBottom: '20px' }} />

          {/* Total */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: '28px',
            }}
          >
            <span
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: '13px',
                letterSpacing: '0.1em',
                color: '#000',
              }}
            >
              TOTAL
            </span>
            <span
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: '18px',
                letterSpacing: '0.04em',
                color: '#000',
              }}
            >
              {fmt(total)}
            </span>
          </div>

          {/* Checkout button */}
          <button
            onClick={() => onNavigate?.('checkout')}
            style={{
              width: '100%',
              padding: '15px',
              background: '#be1826',
              color: '#fff',
              border: 'none',
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: '12px',
              letterSpacing: '0.16em',
              cursor: 'pointer',
              transition: 'background 0.2s',
              marginBottom: '12px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#a3111f')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#be1826')}
          >
            PROCEED TO CHECKOUT
          </button>

          {/* Trust note */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '16px',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" stroke="#bbb" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            <span
              style={{
                fontFamily: "'Archivo', Helvetica, Arial, sans-serif",
                fontSize: '10px',
                letterSpacing: '0.06em',
                color: '#bbb',
                textTransform: 'uppercase',
              }}
            >
              Secure Checkout
            </span>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────

function PageHeader({ onNavigate }) {
  return (
    <div
      style={{
        padding: '18px 40px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <button
        onClick={() => onNavigate?.('home')}
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          fontSize: '18px',
          letterSpacing: '0.08em',
          color: '#000',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        SEE.COM
      </button>

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
          width: '48px',
          height: '48px',
          objectFit: 'cover',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      />
    </div>
  );
}

function CartItem({ item, isLast, onUpdateQty, onRemove, onProductClick, fmt }) {
  const [removing, setRemoving] = useState(false);

  const handleRemove = () => {
    setRemoving(true);
    setTimeout(() => onRemove(item.id), 220);
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '100px 1fr',
        gap: '20px',
        padding: '28px 40px',
        borderBottom: isLast ? 'none' : '1px solid #f5f5f5',
        opacity: removing ? 0 : 1,
        transform: removing ? 'translateX(-8px)' : 'none',
        transition: 'opacity 0.22s ease, transform 0.22s ease',
      }}
    >
      {/* Thumbnail */}
      <div
        onClick={onProductClick}
        style={{
          width: '100px',
          height: '120px',
          backgroundColor: '#f5f5f5',
          backgroundImage: item.image ? `url(${item.image})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      />

      {/* Details */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          {/* Name + remove */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
            <button
              onClick={onProductClick}
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600,
                fontSize: '13px',
                letterSpacing: '0.04em',
                color: '#000',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                textAlign: 'left',
                lineHeight: 1.3,
              }}
            >
              {item.name}
            </button>

            <button
              onClick={handleRemove}
              title="Remove"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#ccc',
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
                flexShrink: 0,
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#be1826')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#ccc')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M4 4l16 16M20 4L4 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Variant tags */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {item.size && <Tag label={item.size} />}
            {item.color && <Tag label={item.color} />}
          </div>
        </div>

        {/* Bottom row: qty + price */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Quantity stepper */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              border: '1px solid #e0e0e0',
              height: '34px',
            }}
          >
            <StepBtn
              onClick={() => onUpdateQty(item.id, -1)}
              disabled={item.quantity <= 1}
              label="−"
            />
            <span
              style={{
                minWidth: '36px',
                textAlign: 'center',
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600,
                fontSize: '13px',
                color: '#000',
                userSelect: 'none',
              }}
            >
              {item.quantity}
            </span>
            <StepBtn
              onClick={() => onUpdateQty(item.id, 1)}
              label="+"
            />
          </div>

          {/* Price */}
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: '14px',
                letterSpacing: '0.02em',
                color: '#000',
              }}
            >
              {fmt(item.price * item.quantity)}
            </div>
            {item.quantity > 1 && (
              <div
                style={{
                  fontFamily: "'Archivo', Helvetica, Arial, sans-serif",
                  fontSize: '10px',
                  letterSpacing: '0.04em',
                  color: '#aaa',
                  marginTop: '2px',
                }}
              >
                {fmt(item.price)} each
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepBtn({ onClick, disabled, label }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '34px',
        height: '34px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'none',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '16px',
        color: disabled ? '#ddd' : '#000',
        transition: 'background 0.15s',
        userSelect: 'none',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = '#f5f5f5'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
    >
      {label}
    </button>
  );
}

function Tag({ label }) {
  return (
    <span
      style={{
        padding: '3px 8px',
        border: '1px solid #e8e8e8',
        fontFamily: "'Archivo', Helvetica, Arial, sans-serif",
        fontSize: '10px',
        letterSpacing: '0.08em',
        color: '#666',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </span>
  );
}

function SummaryLine({ label, value, valueColor = '#000' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span
        style={{
          fontFamily: "'Archivo', Helvetica, Arial, sans-serif",
          fontSize: '12px',
          letterSpacing: '0.06em',
          color: '#888',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "'Archivo', Helvetica, Arial, sans-serif",
          fontSize: '13px',
          letterSpacing: '0.04em',
          color: valueColor,
          fontWeight: 500,
        }}
      >
        {value}
      </span>
    </div>
  );
}
