import { useState, useEffect } from 'react';
import { createOrderAfterPayment } from '../services/checkoutService';
import logoBadge from '../assets/badge.webp';

const SHIPPING_THRESHOLD = 100000;
const FLAT_SHIPPING      = 3500;

const NG_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT (Abuja)','Gombe',
  'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos',
  'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers',
  'Sokoto','Taraba','Yobe','Zamfara',
];

const fmt = (n) => `₦${(n || 0).toLocaleString()}`;

export default function CheckoutPage({ cart = [], setCart, onNavigate }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    phone: '', address: '', city: '', state: '', landmark: '',
  });
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [scriptReady, setReady]       = useState(false);
  const [orderDone, setOrderDone]     = useState(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [isMobile, setIsMobile]       = useState(window.innerWidth < 768);

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
  const total    = subtotal + shipping;
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  // Load Paystack
  useEffect(() => {
    if (window.PaystackPop) { setReady(true); return; }
    const s = document.createElement('script');
    s.src = 'https://js.paystack.co/v1/inline.js';
    s.async = true;
    s.onload  = () => setReady(true);
    s.onerror = () => setError('Could not load payment system. Check your connection.');
    document.head.appendChild(s);
    return () => { try { document.head.removeChild(s); } catch {} };
  }, []);

  const set = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    const required = [
      ['firstName', 'First name'], ['lastName', 'Last name'],
      ['email', 'Email'], ['phone', 'Phone number'],
      ['address', 'Delivery address'], ['city', 'City'], ['state', 'State'],
    ];
    for (const [key, label] of required) {
      if (!form[key].trim()) { setError(`${label} is required.`); return false; }
    }
    if (!form.email.includes('@')) { setError('Please enter a valid email address.'); return false; }
    setError('');
    return true;
  };

  const handlePay = () => {
    if (!validate()) return;
    if (!scriptReady || !window.PaystackPop) {
      setError('Payment system still loading — please wait a moment.');
      return;
    }
    const ref = `SEE-${Date.now()}-${Math.random().toString(36).substr(2,5).toUpperCase()}`;
    const handler = window.PaystackPop.setup({
      key:      import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email:    form.email,
      amount:   total * 100,
      currency: 'NGN',
      ref,
      metadata: {
        custom_fields: [
          { display_name: 'Name',    variable_name: 'name',    value: `${form.firstName} ${form.lastName}` },
          { display_name: 'Phone',   variable_name: 'phone',   value: form.phone },
          { display_name: 'Address', variable_name: 'address', value: `${form.address}, ${form.city}, ${form.state}` },
        ],
      },
      callback: function (response) {
        // Paystack rejects async callbacks — call an async handler inside instead
        setLoading(true);
        createOrderAfterPayment({ formData: form, cart, paystackReference: response.reference, total, shipping })
          .then(order => {
            // Save to localStorage so the order shows on the cart page
            const pending = JSON.parse(localStorage.getItem('pendingOrders') || '[]');
            const newOrder = {
              id: order.id,
              confirm_token: order.confirm_token, // <-- Add this line
              order_number: order.order_number,
              total: order.total,
              created_at: order.created_at,
              customer_email: order.customer_email,
              order_status: order.order_status || 'confirmed',
              items: cart.map(i => ({
                name: i.name,
                size: i.size,
                color: i.color,
                quantity: i.quantity,
                price: i.price,
                image: i.image
              })),
            };
            pending.push(newOrder);
            localStorage.setItem('pendingOrders', JSON.stringify(pending));

            // Separate key — survives pendingOrders being cleared
            const guestIds = JSON.parse(localStorage.getItem('guestOrderIds') || '[]');
            if (!guestIds.includes(order.id)) guestIds.push(order.id);
            localStorage.setItem('guestOrderIds', JSON.stringify(guestIds));

            setCart([]);
            setOrderDone(order);
          })
          .catch(() => {
            setError(`Payment received (ref: ${response.reference}) but order failed. Contact us with this reference.`);
          })
          .finally(() => {
            setLoading(false);
          });
      },
      onClose: () => {},
    });
    handler.openIframe();
  };

  // ── Order success ────────────────────────────────────────────────────────
  if (orderDone) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#fff', display: 'flex', flexDirection: 'column' }}>
        <MobileHeader onNavigate={onNavigate} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center', gap: '20px' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '20px', letterSpacing: '0.06em', color: '#000', margin: '0 0 12px' }}>
              ORDER CONFIRMED
            </h1>
            <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '14px', color: '#555', lineHeight: 1.7, margin: 0 }}>
              Thank you! Your order<br />
              <strong style={{ color: '#000', fontSize: '15px' }}>{orderDone.order_number}</strong><br />
              has been placed. We'll message you once it ships.
            </p>
          </div>
          <button onClick={() => onNavigate?.('shop')} style={redBtnFull}>
            CONTINUE SHOPPING
          </button>
        </div>
      </div>
    );
  }

  // ── Empty cart ───────────────────────────────────────────────────────────
  if (cart.length === 0) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#fff', display: 'flex', flexDirection: 'column' }}>
        <MobileHeader onNavigate={onNavigate} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '40px 24px' }}>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '12px', letterSpacing: '0.14em', color: '#bbb', textTransform: 'uppercase' }}>
            Your bag is empty
          </p>
          <button onClick={() => onNavigate?.('shop')} style={blackBtnFull}>SHOP NOW</button>
        </div>
      </div>
    );
  }

  // ── Checkout ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff', display: 'flex', flexDirection: 'column' }}>

      {/* Loading overlay */}
      {loading && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#fff', padding: '28px 40px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '12px', letterSpacing: '0.16em' }}>
            CONFIRMING ORDER...
          </div>
        </div>
      )}

      <MobileHeader onNavigate={onNavigate} />

      {/* Breadcrumb */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button onClick={() => onNavigate?.('cart')} style={{ fontFamily: "'Archivo', sans-serif", fontSize: '11px', letterSpacing: '0.08em', color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          Bag
        </button>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round"/></svg>
        <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: '11px', letterSpacing: '0.08em', color: '#000' }}>Checkout</span>
      </div>

      {/* ── MOBILE: collapsible summary at top ── */}
      {isMobile && (
        <div style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: '#f9f9f9' }}>
          {/* Toggle row */}
          <button
            onClick={() => setSummaryOpen(v => !v)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="#be1826" strokeWidth="1.6" strokeLinejoin="round"/>
                <line x1="3" y1="6" x2="21" y2="6" stroke="#be1826" strokeWidth="1.6"/>
                <path d="M16 10a4 4 0 01-8 0" stroke="#be1826" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '12px', letterSpacing: '0.06em', color: '#be1826' }}>
                {summaryOpen ? 'Hide' : 'Show'} order summary ({itemCount} {itemCount === 1 ? 'item' : 'items'})
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ transform: summaryOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <path d="M6 9l6 6 6-6" stroke="#be1826" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '15px', color: '#000' }}>
              {fmt(total)}
            </span>
          </button>

          {/* Expanded items */}
          {summaryOpen && (
            <div style={{ padding: '0 20px 16px' }}>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '52px 1fr auto', gap: '12px', alignItems: 'center', padding: '10px 0', borderTop: '1px solid #eee' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: 52, height: 62, backgroundColor: '#f0f0f0', backgroundImage: item.image ? `url(${item.image})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }} />
                    {item.quantity > 1 && (
                      <span style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#000', color: '#fff', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {item.quantity}
                      </span>
                    )}
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '12px' }}>{item.name}</div>
                    <div style={{ fontFamily: "'Archivo', sans-serif", fontSize: '11px', color: '#aaa', marginTop: '3px' }}>
                      {[item.size, item.color].filter(Boolean).join(' / ')}
                    </div>
                  </div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '12px' }}>
                    {fmt(item.price * item.quantity)}
                  </div>
                </div>
              ))}

              {/* Totals */}
              <div style={{ paddingTop: '12px', borderTop: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <SummaryLine label="Subtotal" value={fmt(subtotal)} />
                <SummaryLine label="Shipping" value={shipping === 0 ? 'FREE' : fmt(shipping)} valueColor={shipping === 0 ? '#16a34a' : '#000'} />
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #eee' }}>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '13px' }}>Total</span>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '16px' }}>{fmt(total)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main layout */}
      <div style={{
        display: isMobile ? 'block' : 'grid',
        gridTemplateColumns: isMobile ? undefined : 'minmax(0,1fr) 360px',
        flex: 1,
        alignItems: 'start',
        paddingBottom: isMobile ? '120px' : '0', // space for sticky button
      }}>

        {/* ── Delivery form ── */}
        <div style={{ padding: isMobile ? '24px 20px' : '40px', borderRight: isMobile ? 'none' : '1px solid #f0f0f0' }}>
          <h2 style={sectionHead}>Delivery Details</h2>

          {error && (
            <div style={{ padding: '12px 16px', backgroundColor: '#fff5f5', borderLeft: '3px solid #be1826', fontFamily: "'Archivo', sans-serif", fontSize: '13px', color: '#be1826', marginBottom: '20px', lineHeight: 1.5 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Name row — stacks on mobile */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
              <Field label="First Name" name="firstName" value={form.firstName} onChange={set} />
              <Field label="Last Name"  name="lastName"  value={form.lastName}  onChange={set} />
            </div>

            <Field label="Email Address" name="email" type="email" value={form.email} onChange={set} />
            <Field label="Phone Number"  name="phone" type="tel"   value={form.phone} onChange={set} placeholder="08012345678" />
            <Field label="Delivery Address" name="address" value={form.address} onChange={set} placeholder="Street address, house / flat number" />

            {/* City + State — stacks on mobile */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
              <Field label="City / Town" name="city" value={form.city} onChange={set} />
              <div>
                <label style={labelStyle}>State</label>
                <select name="state" value={form.state} onChange={set} style={inputStyle}>
                  <option value="">Select state...</option>
                  {NG_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <Field label="Closest Landmark / Bus Stop (optional)" name="landmark" value={form.landmark} onChange={set} />
          </div>

          {/* Desktop: order summary + pay button inline */}
          {!isMobile && (
            <div style={{ marginTop: '32px' }}>
              <DesktopSummary cart={cart} subtotal={subtotal} shipping={shipping} total={total} />
              <PayButton onPay={handlePay} loading={loading} total={total} />
              <PaystackBadge />
            </div>
          )}
        </div>

        {/* ── Desktop right column: order details ── */}
        {!isMobile && (
          <div style={{ padding: '40px', position: 'sticky', top: 0 }}>
            <h2 style={sectionHead}>Order Summary</h2>
            {cart.map(item => (
              <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '56px 1fr auto', gap: '14px', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f5f5f5' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: 56, height: 66, backgroundColor: '#f5f5f5', backgroundImage: item.image ? `url(${item.image})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }} />
                  {item.quantity > 1 && (
                    <span style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#000', color: '#fff', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.quantity}
                    </span>
                  )}
                </div>
                <div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '13px' }}>{item.name}</div>
                  <div style={{ fontFamily: "'Archivo', sans-serif", fontSize: '11px', color: '#aaa', marginTop: '4px' }}>
                    {[item.size, item.color].filter(Boolean).join(' / ')}
                  </div>
                </div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '13px' }}>
                  {fmt(item.price * item.quantity)}
                </div>
              </div>
            ))}
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <SummaryLine label="Subtotal" value={fmt(subtotal)} />
              <SummaryLine label="Shipping" value={shipping === 0 ? 'FREE' : fmt(shipping)} valueColor={shipping === 0 ? '#16a34a' : '#000'} />
              {shipping > 0 && (
                <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '11px', color: '#aaa', margin: '0', lineHeight: 1.5 }}>
                  Add {fmt(SHIPPING_THRESHOLD - subtotal)} more for <span style={{ color: '#16a34a', fontWeight: 600 }}>free delivery</span>
                </p>
              )}
            </div>
            <div style={{ height: 1, backgroundColor: '#f0f0f0', margin: '16px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '13px', letterSpacing: '0.1em' }}>TOTAL</span>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '22px' }}>{fmt(total)}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile: sticky bottom pay bar ── */}
      {isMobile && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTop: '1px solid #f0f0f0', padding: '12px 20px 20px', zIndex: 100 }}>
          {error && (
            <div style={{ padding: '10px 14px', backgroundColor: '#fff5f5', borderLeft: '3px solid #be1826', fontFamily: "'Archivo', sans-serif", fontSize: '12px', color: '#be1826', marginBottom: '10px', lineHeight: 1.4 }}>
              {error}
            </div>
          )}
          <PayButton onPay={handlePay} loading={loading} total={total} />
          <PaystackBadge />
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MobileHeader({ onNavigate }) {
  return (
    <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <button
        onClick={() => onNavigate?.('home')}
        style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '17px', letterSpacing: '0.08em', color: '#000', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        See.Com
      </button>

      {/* Recycle badge */}
      <img
        src={logoBadge}
        alt="Recycle — SEE.COM"
        style={{
          position: 'absolute',
          right: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '44px',
          height: '44px',
          objectFit: 'cover',
          borderRadius: '4px',
        }}
      />
    </div>
  );
}

function Field({ label, name, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type} name={name} value={value}
        onChange={onChange} placeholder={placeholder}
        style={inputStyle}
        onFocus={e => (e.target.style.borderColor = '#000')}
        onBlur={e  => (e.target.style.borderColor = '#e0e0e0')}
      />
    </div>
  );
}

function SummaryLine({ label, value, valueColor = '#000' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: '12px', letterSpacing: '0.06em', color: '#888', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: '13px', color: valueColor, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function DesktopSummary({ subtotal, shipping, total }) {
  return (
    <div style={{ padding: '16px', backgroundColor: '#f9f9f9', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <SummaryLine label="Subtotal" value={`₦${subtotal.toLocaleString()}`} />
      <SummaryLine label="Shipping" value={shipping === 0 ? 'FREE' : `₦${shipping.toLocaleString()}`} valueColor={shipping === 0 ? '#16a34a' : '#000'} />
      <div style={{ height: 1, backgroundColor: '#e8e8e8', margin: '4px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '12px', letterSpacing: '0.1em' }}>TOTAL</span>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '16px' }}>{`₦${total.toLocaleString()}`}</span>
      </div>
    </div>
  );
}

function PayButton({ onPay, loading, total }) {
  return (
    <button
      onClick={onPay}
      disabled={loading}
      style={{
        width: '100%', padding: '16px',
        background: loading ? '#888' : '#be1826',
        color: '#fff', border: 'none',
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 700, fontSize: '13px', letterSpacing: '0.18em',
        cursor: loading ? 'default' : 'pointer',
        transition: 'background 0.2s',
        minHeight: '52px',
      }}
    >
      {loading ? 'PROCESSING...' : `PAY ₦${total.toLocaleString()}`}
    </button>
  );
}

function PaystackBadge() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '10px' }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" stroke="#ccc" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
      <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: '10px', letterSpacing: '0.06em', color: '#ccc', textTransform: 'uppercase' }}>
        Secured by Paystack
      </span>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const sectionHead  = { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '13px', letterSpacing: '0.12em', color: '#000', margin: '0 0 20px', textTransform: 'uppercase' };
const labelStyle   = { display: 'block', fontFamily: "'Archivo', sans-serif", fontSize: '10px', letterSpacing: '0.1em', color: '#aaa', textTransform: 'uppercase', marginBottom: '7px' };
const inputStyle   = { width: '100%', padding: '13px 14px', border: '1px solid #e0e0e0', fontFamily: "'Archivo', sans-serif", fontSize: '15px', color: '#000', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', borderRadius: 0, backgroundColor: '#fff', WebkitAppearance: 'none', minHeight: '48px' };
const redBtnFull   = { width: '100%', maxWidth: '320px', padding: '15px', background: '#be1826', color: '#fff', border: 'none', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '12px', letterSpacing: '0.16em', cursor: 'pointer', minHeight: '52px' };
const blackBtnFull = { width: '100%', maxWidth: '320px', padding: '15px', background: '#000', color: '#fff', border: 'none', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '12px', letterSpacing: '0.16em', cursor: 'pointer', minHeight: '52px' };
