import { useState, useEffect } from 'react';
import { createOrderAfterPayment } from '../services/checkoutService';
import logoBadge from '../assets/logo.webp';

const SHIPPING_THRESHOLD = 40000;
const FLAT_SHIPPING      = 3500;
const fmt = n => `₦${(n || 0).toLocaleString()}`;

const NG_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT (Abuja)','Gombe',
  'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos',
  'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers',
  'Sokoto','Taraba','Yobe','Zamfara',
];

export default function CheckoutPage({ cart = [], setCart, onNavigate }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', address: '', city: '', state: '', landmark: '' });
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [scriptReady, setReady]       = useState(false);
  const [orderDone, setOrderDone]     = useState(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [isMobile, setIsMobile]       = useState(window.innerWidth < 768);
  const [ready, setReadyAnim]         = useState(false);

  const subtotal  = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping  = subtotal >= SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
  const total     = subtotal + shipping;
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    setTimeout(() => setReadyAnim(true), 60);
    return () => window.removeEventListener('resize', h);
  }, []);

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

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    for (const [k, l] of [['firstName','First name'],['lastName','Last name'],['email','Email'],['phone','Phone'],['address','Address'],['city','City'],['state','State']]) {
      if (!form[k].trim()) { setError(`${l} is required.`); return false; }
    }
    if (!form.email.includes('@')) { setError('Enter a valid email.'); return false; }
    setError(''); return true;
  };

  const handlePay = () => {
    if (!validate()) return;
    if (!scriptReady || !window.PaystackPop) { setError('Payment loading — please wait.'); return; }
    const ref = `SEE-${Date.now()}-${Math.random().toString(36).substr(2,5).toUpperCase()}`;

    const timeout = setTimeout(() => {
      setLoading(false);
      setError(`Payment received (ref: ${ref}). Contact us if you don't receive confirmation.`);
    }, 12000);

    const handler = window.PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email: form.email, amount: total * 100, currency: 'NGN', ref,
      metadata: { custom_fields: [
        { display_name: 'Name',    variable_name: 'name',    value: `${form.firstName} ${form.lastName}` },
        { display_name: 'Phone',   variable_name: 'phone',   value: form.phone },
        { display_name: 'Address', variable_name: 'address', value: `${form.address}, ${form.city}, ${form.state}` },
      ]},
      callback: response => {
        setLoading(true);
        createOrderAfterPayment({ formData: form, cart, paystackReference: response.reference, total, shipping })
          .then(order => {
            clearTimeout(timeout);
            const pending = JSON.parse(localStorage.getItem('pendingOrders') || '[]');
            const newOrder = { id: order.id, order_number: order.order_number, total: order.total, created_at: order.created_at, customer_email: order.customer_email, order_status: 'confirmed', items: cart.map(i => ({ name: i.name, size: i.size, color: i.color, quantity: i.quantity, price: i.price, image: i.image })) };
            pending.push(newOrder);
            localStorage.setItem('pendingOrders', JSON.stringify(pending));
            // Also store order IDs separately — survives pendingOrders key being cleared
            const guestRefs = JSON.parse(localStorage.getItem('guestOrderIds') || '[]');
            if (!guestRefs.includes(order.id)) guestRefs.push(order.id);
            localStorage.setItem('guestOrderIds', JSON.stringify(guestRefs));
            setCart([]);
            setOrderDone(order);
          })
          .catch((err) => {
            clearTimeout(timeout);
            console.error('Order creation error:', err);
            setError(`Payment received (ref: ${response.reference}) but order failed. Contact us. Error: ${err?.message || JSON.stringify(err)}`);
          })
          .finally(() => { clearTimeout(timeout); setLoading(false); });
      },
      onClose: () => {},
    });
    handler.openIframe();
  };

  // Success
  if (orderDone) return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#fff', display: 'flex', flexDirection: 'column' }}>
      <PageHeader onNavigate={onNavigate} isMobile={isMobile} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center', gap: 24, animation: 'fadeUp 0.6s ease both' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div>
          <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 600, fontSize: '22px', letterSpacing: '0.04em', color: '#000', margin: '0 0 12px' }}>Order Confirmed</h1>
          <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '14px', color: '#888', lineHeight: 1.7, margin: 0 }}>
            Thank you. Your order <strong style={{ color: '#000' }}>{orderDone.order_number}</strong> has been placed.<br/>We'll message you once it ships.
          </p>
        </div>
        <button onClick={() => onNavigate?.('shop')} style={{ padding: '13px 32px', background: '#be1826', color: '#fff', border: 'none', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '10px', letterSpacing: '0.18em', cursor: 'pointer', textTransform: 'uppercase' }}>
          Continue Shopping
        </button>
      </div>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  );

  // Empty
  if (cart.length === 0) return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#fff', display: 'flex', flexDirection: 'column' }}>
      <PageHeader onNavigate={onNavigate} isMobile={isMobile} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '40px 24px' }}>
        <p style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 600, fontSize: '16px', letterSpacing: '0.04em', color: '#ccc' }}>Your bag is empty</p>
        <button onClick={() => onNavigate?.('shop')} style={{ padding: '12px 28px', background: '#000', color: '#fff', border: 'none', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '10px', letterSpacing: '0.18em', cursor: 'pointer' }}>Shop Now</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#fff', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes fadeDown { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeUp   { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

      {/* Loading overlay */}
      {loading && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#fff', padding: '28px 40px' }}>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '11px', letterSpacing: '0.2em', margin: 0, color: '#000' }}>CONFIRMING ORDER...</p>
          </div>
        </div>
      )}

      <PageHeader onNavigate={onNavigate} isMobile={isMobile} />

      {/* Breadcrumb */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 8, animation: ready ? 'fadeDown 0.4s ease both' : 'none' }}>
        <button onClick={() => onNavigate?.('cart')} style={{ fontFamily: "'Archivo', sans-serif", fontSize: '10px', letterSpacing: '0.1em', color: '#bbb', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textTransform: 'uppercase' }}>Bag</button>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="#ddd" strokeWidth="1.5" strokeLinecap="round"/></svg>
        <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: '10px', letterSpacing: '0.1em', color: '#000', textTransform: 'uppercase' }}>Checkout</span>
      </div>

      {/* Mobile order summary toggle */}
      {isMobile && (
        <div style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: '#fafafa' }}>
          <button onClick={() => setSummaryOpen(v => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 20px', background: 'none', border: 'none', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="#be1826" strokeWidth="1.5" strokeLinejoin="round"/><line x1="3" y1="6" x2="21" y2="6" stroke="#be1826" strokeWidth="1.5"/><path d="M16 10a4 4 0 01-8 0" stroke="#be1826" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: '11px', letterSpacing: '0.06em', color: '#be1826' }}>
                {summaryOpen ? 'Hide' : 'Show'} summary ({itemCount} {itemCount === 1 ? 'item' : 'items'})
              </span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" style={{ transform: summaryOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><path d="M6 9l6 6 6-6" stroke="#be1826" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <span style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 600, fontSize: '16px', color: '#000' }}>{fmt(total)}</span>
          </button>
          {summaryOpen && (
            <div style={{ padding: '0 20px 16px' }}>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '48px 1fr auto', gap: 10, alignItems: 'center', padding: '10px 0', borderTop: '1px solid #f0f0f0' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: 48, height: 58, backgroundColor: '#f5f5f5', backgroundImage: item.image ? `url(${item.image})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }} />
                    {item.quantity > 1 && <span style={{ position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#000', color: '#fff', fontSize: '9px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.quantity}</span>}
                  </div>
                  <div>
                    <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '12px', color: '#000', margin: 0 }}>{item.name}</p>
                    <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '10px', color: '#bbb', margin: '3px 0 0' }}>{[item.size, item.color].filter(Boolean).join(' / ')}</p>
                  </div>
                  <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '12px', color: '#000', margin: 0 }}>{fmt(item.price * item.quantity)}</p>
                </div>
              ))}
              <div style={{ paddingTop: 12, borderTop: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <SummaryRow label="Subtotal" value={fmt(subtotal)} />
                <SummaryRow label="Shipping" value={shipping === 0 ? 'FREE' : fmt(shipping)} accent={shipping === 0} />
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
                  <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: '10px', letterSpacing: '0.1em', color: '#bbb', textTransform: 'uppercase' }}>Total</span>
                  <span style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 600, fontSize: '18px', color: '#000' }}>{fmt(total)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main */}
      <div style={{
        display: isMobile ? 'block' : 'grid',
        gridTemplateColumns: isMobile ? undefined : 'minmax(0,1fr) 340px',
        flex: 1, alignItems: 'start',
        paddingBottom: isMobile ? '120px' : 0,
        animation: ready ? 'fadeUp 0.6s 0.1s ease both' : 'none',
      }}>
        {/* Form */}
        <div style={{ padding: isMobile ? '28px 20px' : '48px 52px', borderRight: isMobile ? 'none' : '1px solid #f0f0f0' }}>
          <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '9px', letterSpacing: '0.24em', color: '#bbb', textTransform: 'uppercase', margin: '0 0 24px' }}>Delivery Details</p>

          {error && (
            <div style={{ padding: '11px 14px', backgroundColor: '#fff8f8', borderLeft: '2px solid #be1826', fontFamily: "'Archivo', sans-serif", fontSize: '13px', color: '#be1826', marginBottom: 20, lineHeight: 1.5 }}>{error}</div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
              <Field label="First Name" name="firstName" value={form.firstName} onChange={set} />
              <Field label="Last Name"  name="lastName"  value={form.lastName}  onChange={set} />
            </div>
            <Field label="Email Address" name="email" type="email" value={form.email} onChange={set} />
            <Field label="Phone Number"  name="phone" type="tel"   value={form.phone} onChange={set} placeholder="08012345678" />
            <Field label="Delivery Address" name="address" value={form.address} onChange={set} placeholder="Street address, house / flat number" />
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
              <Field label="City / Town" name="city" value={form.city} onChange={set} />
              <div>
                <label style={labelStyle}>State</label>
                <select name="state" value={form.state} onChange={set} style={inputStyle}>
                  <option value="">Select state...</option>
                  {NG_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <Field label="Closest Landmark (optional)" name="landmark" value={form.landmark} onChange={set} />
          </div>

          {!isMobile && (
            <div style={{ marginTop: 36 }}>
              <DesktopSummary subtotal={subtotal} shipping={shipping} total={total} />
              <PayButton onPay={handlePay} loading={loading} total={total} />
              <PaystackBadge />
            </div>
          )}
        </div>

        {/* Desktop right column */}
        {!isMobile && (
          <div style={{ padding: '48px 40px', position: 'sticky', top: 0 }}>
            <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '9px', letterSpacing: '0.24em', color: '#bbb', textTransform: 'uppercase', margin: '0 0 20px' }}>Order Summary</p>
            {cart.map(item => (
              <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '52px 1fr auto', gap: 12, alignItems: 'center', padding: '11px 0', borderBottom: '1px solid #f5f5f5' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: 52, height: 62, backgroundColor: '#f5f5f5', backgroundImage: item.image ? `url(${item.image})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }} />
                  {item.quantity > 1 && <span style={{ position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#000', color: '#fff', fontSize: '9px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.quantity}</span>}
                </div>
                <div>
                  <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '12px', color: '#000', margin: 0 }}>{item.name}</p>
                  <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '10px', color: '#bbb', margin: '3px 0 0' }}>{[item.size, item.color].filter(Boolean).join(' / ')}</p>
                </div>
                <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '12px', color: '#000', margin: 0 }}>{fmt(item.price * item.quantity)}</p>
              </div>
            ))}
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SummaryRow label="Subtotal" value={fmt(subtotal)} />
              <SummaryRow label="Shipping" value={shipping === 0 ? 'FREE' : fmt(shipping)} accent={shipping === 0} />
              {shipping > 0 && <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '11px', color: '#bbb', margin: 0, lineHeight: 1.5 }}>Add {fmt(SHIPPING_THRESHOLD - subtotal)} for <span style={{ color: '#16a34a', fontWeight: 600 }}>free delivery</span></p>}
            </div>
            <div style={{ height: 1, backgroundColor: '#f0f0f0', margin: '16px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: '10px', letterSpacing: '0.14em', color: '#bbb', textTransform: 'uppercase' }}>Total</span>
              <span style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 600, fontSize: '24px', color: '#000' }}>{fmt(total)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Mobile sticky pay bar */}
      {isMobile && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTop: '1px solid #f0f0f0', padding: '12px 20px 20px', zIndex: 100 }}>
          {error && <div style={{ padding: '9px 12px', backgroundColor: '#fff8f8', borderLeft: '2px solid #be1826', fontFamily: "'Archivo', sans-serif", fontSize: '12px', color: '#be1826', marginBottom: 10, lineHeight: 1.4 }}>{error}</div>}
          <PayButton onPay={handlePay} loading={loading} total={total} />
          <PaystackBadge />
        </div>
      )}
    </div>
  );
}

function PageHeader({ onNavigate, isMobile }) {
  return (
    <header style={{ padding: isMobile ? '14px 20px' : '16px 40px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', animation: 'fadeDown 0.5s ease both' }}>
      <button onClick={() => onNavigate?.('home')} style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 600, fontSize: isMobile ? '15px' : '18px', letterSpacing: '0.22em', color: '#000', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>SEE.COM</button>
      <img src={logoBadge} alt="SEE.COM" onClick={() => onNavigate?.('landing')} style={{ position: 'absolute', right: isMobile ? '20px' : '40px', top: '50%', transform: 'translateY(-50%)', width: isMobile ? '34px' : '40px', height: isMobile ? '34px' : '40px', objectFit: 'cover', cursor: 'pointer' }} />
    </header>
  );
}

function Field({ label, name, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} style={inputStyle}
        onFocus={e => e.target.style.borderColor = '#000'}
        onBlur={e  => e.target.style.borderColor = '#e8e8e8'}
      />
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

function DesktopSummary({ subtotal, shipping, total }) {
  return (
    <div style={{ padding: '14px 16px', backgroundColor: '#f9f9f9', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <SummaryRow label="Subtotal" value={fmt(subtotal)} />
      <SummaryRow label="Shipping" value={shipping === 0 ? 'FREE' : fmt(shipping)} accent={shipping === 0} />
      <div style={{ height: 1, backgroundColor: '#ebebeb', margin: '2px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: '10px', letterSpacing: '0.12em', color: '#bbb', textTransform: 'uppercase' }}>Total</span>
        <span style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 600, fontSize: '18px', color: '#000' }}>{fmt(total)}</span>
      </div>
    </div>
  );
}

function PayButton({ onPay, loading, total }) {
  return (
    <button onClick={onPay} disabled={loading} style={{ width: '100%', padding: '15px', background: loading ? '#ccc' : '#be1826', color: '#fff', border: 'none', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '11px', letterSpacing: '0.2em', cursor: loading ? 'default' : 'pointer', transition: 'background 0.2s', minHeight: '52px', textTransform: 'uppercase' }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#a3111f'; }}
      onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#be1826'; }}
    >
      {loading ? 'Processing...' : `Pay ${fmt(total)}`}
    </button>
  );
}

function PaystackBadge() {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 14 }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" stroke="#ccc" strokeWidth="1.5" strokeLinejoin="round"/></svg>
        <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: '9px', letterSpacing: '0.1em', color: '#ccc', textTransform: 'uppercase' }}>Secured by Paystack</span>
      </div>
      <div style={{ borderTop: '1px solid #f5f5f5', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '10px', color: '#bbb', margin: 0, lineHeight: 1.5 }}>
          🚚 Abuja: up to 2 days · Other states: up to 5 days
        </p>
        <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '10px', color: '#bbb', margin: 0, lineHeight: 1.5 }}>
          ↩ 1-day returns · Tags must be on ·{' '}
          <a href="https://wa.me/2347065772394" target="_blank" rel="noopener noreferrer" style={{ color: '#bbb', textDecoration: 'underline', textUnderlineOffset: '2px' }}>WhatsApp us</a>
        </p>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontFamily: "'Archivo', sans-serif", fontSize: '9px', letterSpacing: '0.16em', color: '#bbb', textTransform: 'uppercase', marginBottom: 7 };
const inputStyle = { width: '100%', padding: '12px 14px', border: '1px solid #e8e8e8', fontFamily: "'Archivo', sans-serif", fontSize: '14px', color: '#000', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', borderRadius: 0, backgroundColor: '#fff', WebkitAppearance: 'none', minHeight: '48px' };
