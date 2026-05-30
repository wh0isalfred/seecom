import { useState, useEffect } from 'react';
import Footer from '../components/Footer';
import logoBadge from '../assets/logo.webp';

const SHIPPING_THRESHOLD = 50000;
const FLAT_SHIPPING      = 3500;
const fmt = n => `₦${n.toLocaleString()}`;

export default function CartPage({ cart = [], setCart, onNavigate }) {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 900);
  const [isMobile, setIsMobile]   = useState(window.innerWidth < 640);
  const [ready, setReady]         = useState(false);
  const [pendingOrders, setPendingOrders] = useState(() =>
    JSON.parse(localStorage.getItem('pendingOrders') || '[]')
  );

  useEffect(() => {
    const h = () => { setIsDesktop(window.innerWidth >= 900); setIsMobile(window.innerWidth < 640); };
    window.addEventListener('resize', h);
    setTimeout(() => setReady(true), 60);
    return () => window.removeEventListener('resize', h);
  }, []);

  // Sync pending orders — remove delivered
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('pendingOrders') || '[]');
    if (stored.length === 0) return;
    import('../services/supabase').then(({ supabase }) => {
      const ids = stored.map(o => o.id).filter(Boolean);
      if (!ids.length) return;
      supabase.from('orders').select('id, order_status').in('id', ids).then(({ data }) => {
        if (!data) return;
        const active = stored.filter(o => {
          const live = data.find(d => d.id === o.id);
          return !live || !['delivered', 'cancelled'].includes(live.order_status);
        });
        localStorage.setItem('pendingOrders', JSON.stringify(active));
        setPendingOrders(active);
      });
    });
  }, []);

  const updateQty = (id, delta) => setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: i.quantity + delta } : i).filter(i => i.quantity > 0));
  const removeItem = id => setCart(prev => prev.filter(i => i.id !== id));

  const subtotal  = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping  = subtotal === 0 ? 0 : subtotal >= SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
  const total     = subtotal + shipping;
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  if (cart.length === 0 && pendingOrders.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', backgroundColor: '#fff' }}>
        <PageHeader onNavigate={onNavigate} isMobile={isMobile} ready={ready} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: '60px 24px', animation: ready ? 'fadeUp 0.6s ease both' : 'none' }}>
          <svg width="48" height="52" viewBox="0 0 48 52" fill="none" opacity="0.12">
            <path d="M16 20V10a8 8 0 0116 0v10" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
            <path d="M6 20h36l4 30H2L6 20z" stroke="#000" strokeWidth="2" strokeLinejoin="round"/>
          </svg>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 600, fontSize: '16px', letterSpacing: '0.06em', color: '#000', margin: '0 0 8px' }}>Your bag is empty</p>
            <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '13px', color: '#bbb', letterSpacing: '0.02em', margin: 0 }}>Add something to get started.</p>
          </div>
          <button onClick={() => onNavigate?.('shop')} style={{ padding: '12px 32px', background: '#000', color: '#fff', border: 'none', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '10px', letterSpacing: '0.18em', cursor: 'pointer', transition: 'background 0.2s', textTransform: 'uppercase' }}
            onMouseEnter={e => e.currentTarget.style.background = '#be1826'}
            onMouseLeave={e => e.currentTarget.style.background = '#000'}
          >Shop All</button>
        </div>
        <Footer />
        <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', backgroundColor: '#fff' }}>
      <style>{`
        @keyframes fadeDown { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeUp   { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse    { 0%,100% { opacity:1 } 50% { opacity:0.35 } }
      `}</style>

      <PageHeader onNavigate={onNavigate} isMobile={isMobile} ready={ready} />

      {/* Title */}
      <div style={{
        padding: isMobile ? '28px 20px 16px' : '36px 40px 20px',
        borderBottom: '1px solid #f0f0f0',
        animation: ready ? 'fadeUp 0.5s 0.05s ease both' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 600, fontSize: isMobile ? '22px' : '28px', letterSpacing: '0.04em', color: '#000', margin: 0 }}>
            Your Bag
          </h1>
          {itemCount > 0 && (
            <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: '11px', letterSpacing: '0.1em', color: '#bbb', textTransform: 'uppercase' }}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>
      </div>

      {/* Layout */}
      <div style={{
        display: isDesktop ? 'grid' : 'block',
        gridTemplateColumns: isDesktop ? '1fr 340px' : undefined,
        flex: 1, alignItems: 'start',
        animation: ready ? 'fadeUp 0.6s 0.1s ease both' : 'none',
      }}>
        {/* Items */}
        <div style={{ padding: isDesktop ? '0 0 60px' : '0 0 40px' }}>
          {cart.map((item, idx) => (
            <CartItem
              key={item.id}
              item={item}
              isLast={idx === cart.length - 1}
              onUpdateQty={updateQty}
              onRemove={removeItem}
              onProductClick={() => onNavigate?.('product', { productId: item.productId })}
              isMobile={isMobile}
            />
          ))}
          <div style={{ padding: isMobile ? '20px 20px 0' : '20px 40px 0' }}>
            <button onClick={() => onNavigate?.('shop')} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Archivo', sans-serif", fontSize: '10px', letterSpacing: '0.14em', color: '#bbb', textTransform: 'uppercase', padding: 0, transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#000'}
              onMouseLeave={e => e.currentTarget.style.color = '#bbb'}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Continue Shopping
            </button>
          </div>
        </div>

        {/* Summary */}
        <div style={{
          position: isDesktop ? 'sticky' : 'static', top: 0,
          borderLeft: isDesktop ? '1px solid #f0f0f0' : 'none',
          borderTop: isDesktop ? 'none' : '1px solid #f0f0f0',
          padding: isMobile ? '28px 20px 32px' : '32px 40px 40px',
        }}>
          <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '9px', letterSpacing: '0.24em', color: '#bbb', textTransform: 'uppercase', margin: '0 0 20px' }}>Order Summary</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            <SummaryRow label="Subtotal" value={fmt(subtotal)} />
            <SummaryRow
              label="Shipping"
              value={subtotal >= SHIPPING_THRESHOLD ? 'FREE' : fmt(FLAT_SHIPPING)}
              accent={subtotal >= SHIPPING_THRESHOLD}
            />
          </div>

          {subtotal < SHIPPING_THRESHOLD && subtotal > 0 && (
            <div style={{ padding: '10px 12px', backgroundColor: '#f9f9f9', borderLeft: '2px solid #e8e8e8', marginBottom: 16 }}>
              <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '11px', color: '#888', margin: 0, lineHeight: 1.5 }}>
                Add {fmt(SHIPPING_THRESHOLD - subtotal)} for <span style={{ color: '#16a34a', fontWeight: 600 }}>free shipping</span>
              </p>
            </div>
          )}

          <div style={{ height: 1, background: '#f0f0f0', margin: '0 0 16px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
            <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: '10px', letterSpacing: '0.16em', color: '#888', textTransform: 'uppercase' }}>Total</span>
            <span style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 600, fontSize: '22px', letterSpacing: '0.02em', color: '#000' }}>{fmt(total)}</span>
          </div>

          <button onClick={() => onNavigate?.('checkout')} style={{ width: '100%', padding: '15px', background: '#be1826', color: '#fff', border: 'none', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '11px', letterSpacing: '0.18em', cursor: 'pointer', transition: 'background 0.2s', marginBottom: 12 }}
            onMouseEnter={e => e.currentTarget.style.background = '#a3111f'}
            onMouseLeave={e => e.currentTarget.style.background = '#be1826'}
          >
            Proceed to Checkout
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" stroke="#ccc" strokeWidth="1.5" strokeLinejoin="round"/></svg>
            <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: '9px', letterSpacing: '0.1em', color: '#ccc', textTransform: 'uppercase' }}>Secure Checkout</span>
          </div>
        </div>
      </div>

      {/* Pending Orders */}
      {pendingOrders.length > 0 && (
        <div style={{ borderTop: '2px solid #000', padding: isMobile ? '36px 20px' : '48px 40px' }}>
          <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '9px', letterSpacing: '0.24em', color: '#bbb', textTransform: 'uppercase', margin: '0 0 24px' }}>Pending Delivery</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pendingOrders.map((order, oi) => (
              <div key={order.id || oi} style={{ border: '1px solid #f0f0f0', padding: isMobile ? '16px' : '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '12px', letterSpacing: '0.06em', color: '#000', margin: 0 }}>{order.order_number}</p>
                    <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '10px', color: '#ccc', margin: '3px 0 0', letterSpacing: '0.04em' }}>
                      {order.created_at ? new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                    </p>
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', border: '1px solid #fde68a', backgroundColor: '#fef9e8' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#f59e0b', animation: 'pulse 2s infinite' }} />
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '8px', letterSpacing: '0.12em', color: '#92400e', textTransform: 'uppercase' }}>Awaiting delivery</span>
                  </div>
                </div>
                {(order.items || []).map((item, ii) => (
                  <div key={ii} style={{ display: 'grid', gridTemplateColumns: '44px 1fr auto', gap: 10, alignItems: 'center', padding: '8px 0', borderTop: '1px solid #f8f8f8' }}>
                    <div style={{ width: 44, height: 52, backgroundColor: '#f5f5f5', backgroundImage: item.image ? `url(${item.image})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.7 }} />
                    <div>
                      <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '11px', color: '#666', margin: 0 }}>{item.name}</p>
                      <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '10px', color: '#ccc', margin: '2px 0 0', letterSpacing: '0.04em' }}>{[item.size, item.color].filter(Boolean).join(' / ')} × {item.quantity}</p>
                    </div>
                    <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '11px', color: '#aaa', margin: 0 }}>{fmt(item.price * item.quantity)}</p>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10, borderTop: '1px solid #f5f5f5', marginTop: 4 }}>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '12px', color: '#000' }}>{fmt(order.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

function PageHeader({ onNavigate, isMobile, ready }) {
  return (
    <header style={{
      padding: isMobile ? '16px 20px' : '18px 40px',
      borderBottom: '1px solid #f0f0f0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative',
      animation: ready ? 'fadeDown 0.5s ease both' : 'none',
    }}>
      <button onClick={() => onNavigate?.('home')} style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 600, fontSize: isMobile ? '16px' : '20px', letterSpacing: '0.22em', color: '#000', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        SEE.COM
      </button>
      <img src={logoBadge} alt="SEE.COM" onClick={() => onNavigate?.('landing')} style={{ position: 'absolute', right: isMobile ? '20px' : '40px', top: '50%', transform: 'translateY(-50%)', width: isMobile ? '36px' : '44px', height: isMobile ? '36px' : '44px', objectFit: 'cover', cursor: 'pointer' }} />
    </header>
  );
}

function CartItem({ item, isLast, onUpdateQty, onRemove, onProductClick, isMobile }) {
  const [removing, setRemoving] = useState(false);
  const handleRemove = () => { setRemoving(true); setTimeout(() => onRemove(item.id), 220); };

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: isMobile ? '80px 1fr' : '96px 1fr',
      gap: isMobile ? '14px' : '20px',
      padding: isMobile ? '20px 20px' : '24px 40px',
      borderBottom: isLast ? 'none' : '1px solid #f5f5f5',
      opacity: removing ? 0 : 1,
      transform: removing ? 'translateX(-6px)' : 'none',
      transition: 'opacity 0.22s ease, transform 0.22s ease',
    }}>
      <div onClick={onProductClick} style={{ width: isMobile ? 80 : 96, height: isMobile ? 96 : 116, backgroundColor: '#f5f5f5', backgroundImage: item.image ? `url(${item.image})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', cursor: 'pointer', flexShrink: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
            <button onClick={onProductClick} style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '13px', letterSpacing: '0.02em', color: '#000', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', lineHeight: 1.3 }}>{item.name}</button>
            <button onClick={handleRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ddd', padding: '2px', flexShrink: 0, transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#be1826'}
              onMouseLeave={e => e.currentTarget.style.color = '#ddd'}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M4 4l16 16M20 4L4 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {item.size  && <span style={{ padding: '2px 8px', border: '1px solid #ebebeb', fontFamily: "'Archivo', sans-serif", fontSize: '9px', letterSpacing: '0.1em', color: '#999', textTransform: 'uppercase' }}>{item.size}</span>}
            {item.color && <span style={{ padding: '2px 8px', border: '1px solid #ebebeb', fontFamily: "'Archivo', sans-serif", fontSize: '9px', letterSpacing: '0.1em', color: '#999', textTransform: 'uppercase' }}>{item.color}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #ebebeb', height: 32 }}>
            <button onClick={() => onUpdateQty(item.id, -1)} disabled={item.quantity <= 1} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer', fontSize: '14px', color: item.quantity <= 1 ? '#ddd' : '#000', transition: 'background 0.15s' }}
              onMouseEnter={e => { if (item.quantity > 1) e.currentTarget.style.background = '#f5f5f5'; }}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >−</button>
            <span style={{ minWidth: 28, textAlign: 'center', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '12px', color: '#000', userSelect: 'none' }}>{item.quantity}</span>
            <button onClick={() => onUpdateQty(item.id, 1)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#000', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >+</button>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '13px', color: '#000', margin: 0 }}>{fmt(item.price * item.quantity)}</p>
            {item.quantity > 1 && <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '10px', color: '#ccc', margin: '1px 0 0' }}>{fmt(item.price)} each</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, accent }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: '10px', letterSpacing: '0.12em', color: '#bbb', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: '13px', color: accent ? '#16a34a' : '#000', fontWeight: accent ? 600 : 400 }}>{value}</span>
    </div>
  );
}
