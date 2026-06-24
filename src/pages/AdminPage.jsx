import { useState, useEffect, useCallback } from 'react';
import AdminProductForm from './AdminProductForm';
import { useDiscount } from '../contexts/DiscountContext';
import { updateProductDetails } from '../services/adminService';
import {
  fetchAllOrders, updateOrderStatus, updatePaymentStatus, saveTrackingInfo,
  fetchAllInventory, updateStockQuantity,
  fetchAllProducts, toggleNewArrival, deleteProductById,
} from '../services/adminService';

// ── Status config ─────────────────────────────────────────────────────────────
const ORDER_STATUS = {
  pending:           { label: 'Pending',         bg: '#fef3c7', color: '#92400e' },
  confirmed:         { label: 'Confirmed',        bg: '#dbeafe', color: '#1e40af' },
  processing:        { label: 'Processing',       bg: '#e0f2fe', color: '#0369a1' },
  shipped:           { label: 'Shipped',          bg: '#ede9fe', color: '#5b21b6' },
  out_for_delivery:  { label: 'Out for Delivery', bg: '#fce7f3', color: '#9d174d' },
  delivered:         { label: 'Delivered',        bg: '#dcfce7', color: '#166534' },
  investigating:     { label: 'Investigating',    bg: '#fff7ed', color: '#c2410c' },
  cancelled:         { label: 'Cancelled',        bg: '#fee2e2', color: '#991b1b' },
};

const NEXT_STEPS = {
  pending:          ['confirmed', 'cancelled'],
  confirmed:        ['processing', 'cancelled'],
  processing:       ['shipped'],
  shipped:          ['out_for_delivery'],
  out_for_delivery: [],
  delivered:        [],
  investigating:    ['shipped', 'out_for_delivery', 'cancelled'],
  cancelled:        [],
};

const PAYMENT_STATUS = {
  pending: { label: 'Unpaid', bg: '#fef3c7', color: '#92400e' },
  paid:    { label: 'Paid',   bg: '#dcfce7', color: '#166534' },
  failed:  { label: 'Failed', bg: '#fee2e2', color: '#991b1b' },
};

const fmt     = n => `₦${(n || 0).toLocaleString()}`;
const fmtDate = d => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

// ── Root ──────────────────────────────────────────────────────────────────────
export default function AdminPage({ onNavigate }) {
  const [tab, setTab]         = useState('dashboard');
  const [isMobile, setMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const TABS = ['dashboard', 'orders', 'inventory', 'products'];

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#fafafa', fontFamily: "'Archivo', sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .hide-scroll::-webkit-scrollbar { display: none }
        .hide-scroll { scrollbar-width: none; -ms-overflow-style: none }
      `}</style>

      {/* ── Header ── */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 52 }}>
          <button onClick={() => onNavigate?.('home')} style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 600, fontSize: 16, letterSpacing: '0.22em', background: 'none', border: 'none', cursor: 'pointer', color: '#000', padding: 0 }}>
            See.Com
          </button>
          <span style={{ fontSize: 10, letterSpacing: '0.18em', color: '#ccc', textTransform: 'uppercase' }}>Admin</span>
        </div>
        {/* Tab bar */}
        <div className="hide-scroll" style={{ display: 'flex', overflowX: 'auto', borderTop: '1px solid #f5f5f5' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flexShrink: 0, padding: '12px 20px',
              background: 'none', border: 'none', borderBottom: `2px solid ${tab === t ? '#be1826' : 'transparent'}`,
              fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
              fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
              color: tab === t ? '#be1826' : '#bbb', cursor: 'pointer', transition: 'color 0.15s',
              WebkitTapHighlightColor: 'transparent',
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: isMobile ? '20px 16px' : '32px 40px', maxWidth: 1400, margin: '0 auto' }}>
        {tab === 'dashboard' && <DashboardTab setTab={setTab} isMobile={isMobile} />}
        {tab === 'orders'    && <OrdersTab isMobile={isMobile} />}
        {tab === 'inventory' && <InventoryTab isMobile={isMobile} />}
        {tab === 'products'  && <ProductsTab isMobile={isMobile} />}
      </div>
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function DashboardTab({ setTab, isMobile }) {
  const [orders, setOrders]   = useState([]);
  const [inventory, setInv]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchAllOrders(), fetchAllInventory()])
      .then(([o, i]) => { setOrders(o); setInv(i); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const today      = new Date().toDateString();
  const revenue    = orders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + (o.total || 0), 0);
  const todayCount = orders.filter(o => new Date(o.created_at).toDateString() === today).length;
  const pending    = orders.filter(o => o.order_status === 'pending').length;
  const lowStock   = inventory.filter(i => i.stock_quantity > 0 && i.stock_quantity <= 3);
  const outOfStock = inventory.filter(i => i.stock_quantity === 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 12 }}>
        {[
          { label: 'Revenue',      value: fmt(revenue),                   sub: 'paid orders',    accent: '#16a34a' },
          { label: 'Today',        value: todayCount,                     sub: 'new orders',     accent: '#3b82f6' },
          { label: 'Pending',      value: pending,                        sub: 'need action',    accent: '#f59e0b', action: () => setTab('orders') },
          { label: 'Stock alerts', value: lowStock.length + outOfStock.length, sub: `${outOfStock.length} out of stock`, accent: '#be1826', action: () => setTab('inventory') },
        ].map(({ label, value, sub, accent, action }) => (
          <button key={label} onClick={action} style={{
            background: '#fff', border: '1px solid #f0f0f0',
            borderTop: `3px solid ${accent}`,
            padding: isMobile ? '16px' : '20px 24px',
            textAlign: 'left', cursor: action ? 'pointer' : 'default',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
            onMouseEnter={e => { if (action) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; }}}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 600, fontSize: isMobile ? 22 : 28, color: '#000', marginBottom: 4, letterSpacing: '-0.01em' }}>{value}</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: '0.12em', color: '#000', textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: 11, color: '#bbb', marginTop: 3 }}>{sub}</div>
          </button>
        ))}
      </div>

      {/* Stock alerts */}
      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <Card title="Stock Alerts">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? 320 : 'auto' }}>
              <thead><tr style={{ borderBottom: '1px solid #f5f5f5' }}>
                {['Product', 'Size', 'Color', 'Stock', 'Status'].map(h => <Th key={h}>{h}</Th>)}
              </tr></thead>
              <tbody>
                {[...outOfStock, ...lowStock].slice(0, 8).map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #fafafa' }}>
                    <Td><span style={{ fontWeight: 600, maxWidth: isMobile ? 100 : 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.products?.name || '—'}</span></Td>
                    <Td>{item.size}</Td>
                    <Td>{item.color}</Td>
                    <Td><strong style={{ color: item.stock_quantity === 0 ? '#be1826' : '#f59e0b' }}>{item.stock_quantity}</strong></Td>
                    <Td><Badge label={item.stock_quantity === 0 ? 'Out' : 'Low'} bg={item.stock_quantity === 0 ? '#fee2e2' : '#fef3c7'} color={item.stock_quantity === 0 ? '#991b1b' : '#92400e'} /></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Recent orders */}
      <Card title="Recent Orders">
        {orders.length === 0 ? <Empty message="No orders yet" /> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? 400 : 'auto' }}>
              <thead><tr style={{ borderBottom: '1px solid #f5f5f5' }}>
                {['Order', 'Customer', 'Date', 'Total', 'Status', 'Payment'].map(h => <Th key={h}>{h}</Th>)}
              </tr></thead>
              <tbody>
                {orders.slice(0, 8).map(o => {
                  const sc = ORDER_STATUS[o.order_status] || ORDER_STATUS.pending;
                  const pc = PAYMENT_STATUS[o.payment_status] || PAYMENT_STATUS.pending;
                  return (
                    <tr key={o.id} style={{ borderBottom: '1px solid #fafafa' }}>
                      <Td><span style={{ fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", fontSize: 11 }}>{o.order_number}</span></Td>
                      <Td><span style={{ maxWidth: isMobile ? 80 : 160, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.customer_name || o.customer_email}</span></Td>
                      <Td><span style={{ whiteSpace: 'nowrap' }}>{fmtDate(o.created_at)}</span></Td>
                      <Td><span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{fmt(o.total)}</span></Td>
                      <Td><Badge label={sc.label} bg={sc.bg} color={sc.color} /></Td>
                      <Td><Badge label={pc.label} bg={pc.bg} color={pc.color} /></Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── ORDERS ────────────────────────────────────────────────────────────────────
function OrdersTab({ isMobile = false }) {
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [saving, setSaving]     = useState({});
  const [tracking, setTracking] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchAllOrders();
    setOrders(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatus = async (orderId, status) => {
    setSaving(s => ({ ...s, [orderId]: true }));
    const updates = { order_status: status };
    if (status === 'shipped')          updates.shipped_at = new Date().toISOString();
    if (status === 'out_for_delivery') updates.out_for_delivery_at = new Date().toISOString();
    if (status === 'delivered')        updates.delivered_at = new Date().toISOString();
    try {
      await updateOrderStatus(orderId, status, updates);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o));
    } catch (e) { console.error(e); }
    setSaving(s => ({ ...s, [orderId]: false }));
  };

  const handleTracking = async (orderId) => {
    const t = tracking[orderId] || {};
    if (!t.number) return;
    setSaving(s => ({ ...s, [`track_${orderId}`]: true }));
    const updates = { tracking_number: t.number, carrier: t.carrier || '', order_status: 'shipped', shipped_at: new Date().toISOString() };
    try {
      await saveTrackingInfo(orderId, t.number, t.carrier || '');
      await updateOrderStatus(orderId, 'shipped', updates);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o));
      setTracking(t2 => ({ ...t2, [orderId]: undefined }));
    } catch (e) { console.error(e); }
    setSaving(s => ({ ...s, [`track_${orderId}`]: false }));
  };

  const handlePayment = async (orderId, status) => {
    setSaving(s => ({ ...s, [`pay_${orderId}`]: true }));
    try {
      await updatePaymentStatus(orderId, status);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment_status: status } : o));
    } catch (e) { console.error(e); }
    setSaving(s => ({ ...s, [`pay_${orderId}`]: false }));
  };

  const daysSince = d => d ? Math.floor((Date.now() - new Date(d).getTime()) / 86400000) : null;
  const isAbuja   = o => (o.shipping_state || '').toLowerCase().match(/abuja|fct/);
  const getRisk   = o => {
    if (!['shipped','out_for_delivery'].includes(o.order_status)) return null;
    const d = daysSince(o.shipped_at); if (d === null) return null;
    const max = isAbuja(o) ? 2 : 5;
    return d > max + 2 ? 'high' : d > max ? 'medium' : null;
  };

  const filterKeys = ['all','pending','confirmed','processing','shipped','out_for_delivery','delivered','investigating'];
  const counts = Object.fromEntries(filterKeys.map(k => [k, k === 'all' ? orders.length : orders.filter(o => o.order_status === k).length]));
  const filtered = filter === 'all' ? orders : orders.filter(o => o.order_status === filter);

  if (loading) return <Spinner />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Filter pills */}
      <div className="hide-scroll" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {filterKeys.map(key => {
          const cfg = ORDER_STATUS[key];
          const active = filter === key;
          return (
            <button key={key} onClick={() => setFilter(key)} style={{
              flexShrink: 0, padding: '5px 12px', border: '1px solid',
              borderRadius: 20, fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
              cursor: 'pointer', transition: 'all 0.15s', WebkitTapHighlightColor: 'transparent',
              background: active ? (cfg?.bg || '#000') : '#fff',
              color:      active ? (cfg?.color || '#fff') : '#bbb',
              borderColor: active ? (cfg?.color || '#000') : '#e8e8e8',
            }}>
              {key === 'all' ? 'All' : cfg?.label} ({counts[key]})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? <Empty message="No orders here" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(order => {
            const isExpanded  = expanded === order.id;
            const sc          = ORDER_STATUS[order.order_status] || ORDER_STATUS.pending;
            const pc          = PAYMENT_STATUS[order.payment_status] || PAYMENT_STATUS.pending;
            const risk        = getRisk(order);
            const daysShipped = daysSince(order.shipped_at);
            const nextSteps   = NEXT_STEPS[order.order_status] || [];

            return (
              <div key={order.id} style={{
                backgroundColor: '#fff',
                border: '1px solid',
                borderColor: risk === 'high' ? '#fecaca' : risk === 'medium' ? '#fed7aa' : '#f0f0f0',
                borderLeftWidth: risk ? 3 : 1,
                borderLeftColor: risk === 'high' ? '#be1826' : risk === 'medium' ? '#f59e0b' : '#f0f0f0',
                overflow: 'hidden',
              }}>
                {/* Row */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : order.id)}
                  style={{ width: '100%', background: 'none', border: 'none', padding: '14px 16px', cursor: 'pointer', textAlign: 'left', WebkitTapHighlightColor: 'transparent' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                          {order.order_number}
                        </span>
                        <Badge label={sc.label} bg={sc.bg} color={sc.color} />
                        <Badge label={pc.label} bg={pc.bg} color={pc.color} />
                        {risk && (
                          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 8, letterSpacing: '0.1em', color: risk === 'high' ? '#be1826' : '#f59e0b', textTransform: 'uppercase' }}>
                            {daysShipped}d ⚠
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: '#bbb', marginTop: 3, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{order.customer_name || order.customer_email}</span>
                        <span style={{ whiteSpace: 'nowrap' }}>{fmtDate(order.created_at)}</span>
                        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: '#333', whiteSpace: 'nowrap' }}>{fmt(order.total)}</span>
                      </div>
                    </div>
                    <span style={{ color: '#ccc', fontSize: 16, transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>›</span>
                  </div>
                </button>

                {/* Expanded — smooth slide */}
                <div style={{ overflow: 'hidden', maxHeight: isExpanded ? '1400px' : '0', transition: 'max-height 0.35s ease' }}>
                  <div style={{ borderTop: '1px solid #f5f5f5', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Items */}
                    <div>
                      <Label>Items</Label>
                      {(order.order_items || []).map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #fafafa' }}>
                          <div>
                            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 12 }}>{item.product_name}</div>
                            <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>{item.size} / {item.color} × {item.quantity}</div>
                          </div>
                          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>{fmt(item.total_price)}</div>
                        </div>
                      ))}
                    </div>

                    {/* Customer */}
                    <div>
                      <Label>Customer</Label>
                      <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6 }}>
                        <div style={{ fontWeight: 600 }}>{order.customer_name}</div>
                        <div>{order.customer_email}</div>
                        {order.customer_phone && <div>{order.customer_phone}</div>}
                        {order.shipping_address && <div style={{ color: '#aaa', marginTop: 4 }}>{order.shipping_address}, {order.shipping_city}, {order.shipping_state}</div>}
                      </div>
                    </div>

                    {/* Delivery progress */}
                    <div>
                      <Label>Delivery Progress</Label>
                      <DeliveryProgress status={order.order_status} />
                    </div>

                    {/* Risk warning */}
                    {risk && (
                      <div style={{ padding: '10px 12px', backgroundColor: risk === 'high' ? '#fff5f5' : '#fffbeb', borderLeft: `3px solid ${risk === 'high' ? '#be1826' : '#f59e0b'}` }}>
                        <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', color: risk === 'high' ? '#be1826' : '#92400e', margin: '0 0 2px', textTransform: 'uppercase' }}>
                          {risk === 'high' ? '⚠ Overdue' : '⚡ Running late'}
                        </p>
                        <p style={{ fontSize: 11, color: '#666', margin: 0, lineHeight: 1.5 }}>
                          Shipped {daysShipped} day{daysShipped !== 1 ? 's' : ''} ago · {isAbuja(order) ? 'Abuja (max 2 days)' : 'Outside Abuja (max 5 days)'}
                        </p>
                      </div>
                    )}

                    {/* Tracking */}
                    <div>
                      <Label>Tracking</Label>
                      {order.tracking_number ? (
                        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 12, color: '#16a34a' }}>
                          {order.carrier && `${order.carrier} · `}{order.tracking_number}
                        </span>
                      ) : (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <input
                            placeholder="Tracking number"
                            value={tracking[order.id]?.number || ''}
                            onChange={e => setTracking(t => ({ ...t, [order.id]: { ...t[order.id], number: e.target.value } }))}
                            style={{ ...inputSt, flex: 1, minWidth: 100 }}
                          />
                          <input
                            placeholder="Carrier (optional)"
                            value={tracking[order.id]?.carrier || ''}
                            onChange={e => setTracking(t => ({ ...t, [order.id]: { ...t[order.id], carrier: e.target.value } }))}
                            style={{ ...inputSt, width: 100 }}
                          />
                          <button onClick={() => handleTracking(order.id)} disabled={saving[`track_${order.id}`] || !tracking[order.id]?.number} style={btnSt}>
                            {saving[`track_${order.id}`] ? '...' : 'Save & Ship'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Next steps */}
                    {nextSteps.length > 0 && (
                      <div>
                        <Label>Next Step</Label>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {nextSteps.map(key => {
                            const cfg = ORDER_STATUS[key];
                            const isShip = key === 'shipped';
                            const disabled = saving[order.id] || (isShip && !order.tracking_number);
                            return (
                              <button key={key} onClick={() => handleStatus(order.id, key)} disabled={disabled}
                                title={isShip && !order.tracking_number ? 'Add tracking first' : ''}
                                style={{ padding: '8px 16px', border: `1px solid ${cfg.color}`, background: cfg.bg, color: cfg.color, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, transition: 'opacity 0.15s', WebkitTapHighlightColor: 'transparent' }}>
                                {saving[order.id] ? '...' : `→ ${cfg.label}`}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Awaiting confirmation note */}
                    {['shipped','out_for_delivery'].includes(order.order_status) && (
                      <InfoBox color="#4338ca" bg="#f8faff" border="#e0e7ff">
                        <strong>Awaiting customer confirmation</strong><br/>
                        Customer sees a "Confirm Received" button. Auto-closes after grace period.
                      </InfoBox>
                    )}

                    {/* Investigating note */}
                    {order.order_status === 'investigating' && (
                      <InfoBox color="#c2410c" bg="#fff7ed" border="#fed7aa">
                        <strong>⚠ Customer reported an issue</strong><br/>
                        Resolve with the customer first. Mark as Shipped or Out for Delivery — then the customer can confirm.<br/>
                        <em style={{ fontSize: 10 }}>You cannot mark as Delivered directly.</em>
                        {order.customer_phone && (
                          <a href={`https://wa.me/${order.customer_phone.replace(/\D/g,'').replace(/^0/,'234')}`} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'inline-block', marginTop: 8, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', color: '#16a34a', textDecoration: 'none' }}>
                            WhatsApp Customer →
                          </a>
                        )}
                      </InfoBox>
                    )}

                    {/* Payment */}
                    <div>
                      <Label>Payment</Label>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {Object.entries(PAYMENT_STATUS).map(([key, cfg]) => (
                          <button key={key} onClick={() => handlePayment(order.id, key)} disabled={saving[`pay_${order.id}`] || order.payment_status === key}
                            style={{ padding: '5px 12px', border: '1px solid', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', background: order.payment_status === key ? cfg.bg : '#fff', color: order.payment_status === key ? cfg.color : '#aaa', borderColor: order.payment_status === key ? cfg.color : '#e8e8e8', opacity: saving[`pay_${order.id}`] ? 0.5 : 1, WebkitTapHighlightColor: 'transparent' }}>
                            {cfg.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DeliveryProgress({ status }) {
  const steps   = ['confirmed','processing','shipped','out_for_delivery','delivered'];
  const labels  = { confirmed:'Confirmed', processing:'Processing', shipped:'Shipped', out_for_delivery:'Out for Del.', delivered:'Delivered' };
  const current = steps.indexOf(status);
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginTop: 4 }}>
      {steps.map((step, i) => {
        const done = current >= i;
        const active = current === i;
        const cfg  = ORDER_STATUS[step];
        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: done ? cfg.color : '#e8e8e8', border: active ? `2px solid ${cfg.color}` : '2px solid transparent', boxShadow: active ? `0 0 0 3px ${cfg.bg}` : 'none', transition: 'all 0.3s', flexShrink: 0 }} />
              <span style={{ fontSize: 7, letterSpacing: '0.04em', color: done ? cfg.color : '#ccc', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{labels[step]}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 1, backgroundColor: done && current > i ? cfg.color : '#e8e8e8', margin: '0 3px', marginBottom: 16, transition: 'background-color 0.3s' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── INVENTORY ─────────────────────────────────────────────────────────────────
function InventoryTab({ isMobile = false }) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [edits, setEdits]         = useState({});
  const [saving, setSaving]       = useState({});
  const [saved, setSaved]         = useState({});
  const [search, setSearch]       = useState('');

  useEffect(() => {
    fetchAllInventory().then(data => {
      setInventory(data);
      const init = {};
      data.forEach(i => { init[i.id] = i.stock_quantity; });
      setEdits(init);
      setLoading(false);
    });
  }, []);

  const grouped = inventory.reduce((acc, item) => {
    const pid = item.products?.id || 'unknown';
    if (!acc[pid]) acc[pid] = { product: item.products, items: [] };
    acc[pid].items.push(item);
    return acc;
  }, {});

  const filteredGroups = Object.entries(grouped).filter(([, g]) =>
    !search || g.product?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const saveProduct = async (productId) => {
    const items = grouped[productId]?.items || [];
    setSaving(s => ({ ...s, [productId]: true }));
    try {
      await Promise.all(items.map(item => updateStockQuantity(item.id, edits[item.id] ?? item.stock_quantity)));
      setInventory(prev => prev.map(item => item.products?.id === productId ? { ...item, stock_quantity: edits[item.id] ?? item.stock_quantity } : item));
      setSaved(s => ({ ...s, [productId]: true }));
      setTimeout(() => setSaved(s => ({ ...s, [productId]: false })), 2000);
    } catch (e) { console.error(e); }
    setSaving(s => ({ ...s, [productId]: false }));
  };

  if (loading) return <Spinner />;

  const outCount = inventory.filter(i => i.stock_quantity === 0).length;
  const lowCount = inventory.filter(i => i.stock_quantity > 0 && i.stock_quantity <= 3).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {[
          { label: 'Total SKUs',  value: inventory.length, color: '#000' },
          { label: 'Out of Stock', value: outCount,         color: '#be1826' },
          { label: 'Low Stock',    value: lowCount,         color: '#f59e0b' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ backgroundColor: '#fff', border: '1px solid #f0f0f0', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 600, fontSize: 20, color }}>{value}</span>
            <span style={{ fontSize: 10, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Search */}
      <input placeholder="Search product..." value={search} onChange={e => setSearch(e.target.value)}
        style={{ ...inputSt, maxWidth: 280 }} />

      {filteredGroups.length === 0 ? <Empty message="No inventory" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredGroups.map(([productId, group]) => {
            const total  = group.items.reduce((s, i) => s + (edits[i.id] ?? i.stock_quantity), 0);
            const hasOOS = group.items.some(i => (edits[i.id] ?? i.stock_quantity) === 0);
            const hasLow = group.items.some(i => { const q = edits[i.id] ?? i.stock_quantity; return q > 0 && q <= 3; });

            return (
              <div key={productId} style={{ backgroundColor: '#fff', border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                {/* Product header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #fafafa', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 auto', minWidth: 0 }}>
                    {group.product?.image_1 && (
                      <div style={{ width: 32, height: 32, backgroundImage: `url(${group.product.image_1})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#f5f5f5', flexShrink: 0 }} />
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {group.product?.name || 'Unknown'}
                      </div>
                      <div style={{ fontSize: 10, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>
                        {group.product?.category} · {total} units
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {hasOOS && <Badge label="OOS" bg="#fee2e2" color="#991b1b" />}
                    {hasLow && !hasOOS && <Badge label="Low" bg="#fef3c7" color="#92400e" />}
                    <button onClick={() => saveProduct(productId)} disabled={saving[productId]} style={{ ...btnSt, background: saved[productId] ? '#16a34a' : '#000', minWidth: 60 }}>
                      {saving[productId] ? '...' : saved[productId] ? '✓' : 'Save'}
                    </button>
                  </div>
                </div>

                {/* SKU rows — scrollable on mobile */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? 260 : 'auto' }}>
                    <thead><tr style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <Th>Size</Th><Th>Color</Th><Th>Stock</Th><Th>Status</Th>
                    </tr></thead>
                    <tbody>
                      {group.items.map(item => {
                        const qty = edits[item.id] ?? item.stock_quantity;
                        return (
                          <tr key={item.id} style={{ borderBottom: '1px solid #fafafa' }}>
                            <Td>{item.size || '—'}</Td>
                            <Td>{item.color || '—'}</Td>
                            <Td>
                              <input type="number" min="0" value={edits[item.id] ?? item.stock_quantity}
                                onChange={e => setEdits(prev => ({ ...prev, [item.id]: parseInt(e.target.value) || 0 }))}
                                style={{ width: 60, padding: '4px 6px', border: '1px solid #e8e8e8', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 12, textAlign: 'center' }}
                              />
                            </Td>
                            <Td>
                              {qty === 0 ? <Badge label="Out" bg="#fee2e2" color="#991b1b" />
                               : qty <= 3 ? <Badge label={`Low`} bg="#fef3c7" color="#92400e" />
                               : <Badge label="OK" bg="#dcfce7" color="#166534" />}
                            </Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── PRODUCTS ──────────────────────────────────────────────────────────────────
function ProductsTab({ isMobile = false }) {
  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [toggling, setToggling]     = useState({});
  const [deleting, setDeleting]     = useState({});
  const [confirmDelete, setConfirm] = useState(null);
  const [editing, setEditing]       = useState(null);
  const [editFields, setEditFields] = useState({});
  const [editSaving, setEditSaving] = useState({});
  const [editError, setEditError]   = useState({});

  const { discount, updateDiscount } = useDiscount();
  const [discPct, setDiscPct]   = useState(String(discount.percent));
  const [discOn, setDiscOn]     = useState(discount.active);
  const [discSaving, setDiscSaving] = useState(false);
  const [discSaved, setDiscSaved]   = useState(false);

  useEffect(() => { setDiscPct(String(discount.percent)); setDiscOn(discount.active); }, [discount.percent, discount.active]);

  const load = useCallback(() => {
    setLoading(true);
    fetchAllProducts().then(data => { setProducts(data); setLoading(false); });
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleSaveDiscount = async () => {
    setDiscSaving(true);
    try { await updateDiscount(parseFloat(discPct) || 0, discOn); setDiscSaved(true); setTimeout(() => setDiscSaved(false), 2000); }
    catch (e) { console.error(e); }
    setDiscSaving(false);
  };

  const handleToggleNewArrival = async (id, current) => {
    setToggling(t => ({ ...t, [id]: true }));
    try { await toggleNewArrival(id, !current); setProducts(prev => prev.map(p => p.id === id ? { ...p, is_new_arrival: !current } : p)); }
    catch (e) { console.error(e); }
    setToggling(t => ({ ...t, [id]: false }));
  };

  const handleDelete = async (id) => {
    setDeleting(d => ({ ...d, [id]: true }));
    try { await deleteProductById(id); setProducts(prev => prev.filter(p => p.id !== id)); }
    catch (e) { console.error(e); }
    setDeleting(d => ({ ...d, [id]: false }));
    setConfirm(null);
  };

  const startEdit = p => {
    setEditing(p.id);
    setEditFields({ name: p.name || '', price: String(p.price || ''), discount_price: p.discount_price ? String(p.discount_price) : '', description: p.description || '' });
    setEditError(e => ({ ...e, [p.id]: '' }));
  };

  const handleEditSave = async (id) => {
    setEditSaving(s => ({ ...s, [id]: true }));
    setEditError(e => ({ ...e, [id]: '' }));
    try {
      const updated = await updateProductDetails(id, editFields);
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
      setEditing(null);
    } catch (e) { setEditError(err => ({ ...err, [id]: e.message || 'Save failed' })); }
    setEditSaving(s => ({ ...s, [id]: false }));
  };

  if (loading) return <Spinner />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Global discount */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #f0f0f0' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Global Discount</span>
            <p style={{ fontSize: 11, color: '#bbb', margin: '3px 0 0' }}>Applies to all products. Per-product discounts override.</p>
          </div>
          <button onClick={() => setDiscOn(v => !v)} style={{ padding: '6px 14px', border: '1px solid', borderRadius: 14, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', background: discOn ? '#16a34a' : '#f5f5f5', color: discOn ? '#fff' : '#aaa', borderColor: discOn ? '#16a34a' : '#e8e8e8', transition: 'all 0.15s' }}>
            {discOn ? 'Active' : 'Off'}
          </button>
        </div>
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="number" min="0" max="100" value={discPct} onChange={e => setDiscPct(e.target.value)}
              style={{ width: 64, padding: '7px 8px', border: '1px solid #e8e8e8', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, textAlign: 'center' }} />
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16 }}>%</span>
          </div>
          {discPct > 0 && discOn && <span style={{ fontSize: 12, color: '#be1826' }}>All products showing {discPct}% off</span>}
          <button onClick={handleSaveDiscount} disabled={discSaving} style={{ ...btnSt, background: discSaved ? '#16a34a' : '#000', marginLeft: 'auto', minWidth: 70 }}>
            {discSaving ? '...' : discSaved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </div>

      {/* Add product */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => setShowForm(v => !v)} style={{ padding: '10px 20px', background: showForm ? '#f5f5f5' : '#000', color: showForm ? '#000' : '#fff', border: 'none', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '0.12em', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
          {showForm ? '✕ Cancel' : '+ Add Product'}
        </button>
      </div>

      {showForm && (
        <div style={{ backgroundColor: '#fff', border: '1px solid #f0f0f0' }}>
          <AdminProductForm onProductCreated={() => { setShowForm(false); load(); }} />
        </div>
      )}

      {products.length === 0 ? <Empty message="No products yet" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {products.map(p => (
            <div key={p.id} style={{ backgroundColor: '#fff', border: '1px solid #f0f0f0', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr auto', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                <div style={{ width: 44, height: 52, backgroundImage: p.image_1 ? `url(${p.image_1})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#f5f5f5' }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: '#bbb', marginTop: 3, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>{p.category}</span>
                    <span>{fmt(p.price)}</span>
                    {p.discount_price && <span style={{ color: '#be1826', fontWeight: 600 }}>→ {fmt(p.discount_price)}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => editing === p.id ? setEditing(null) : startEdit(p)} style={{ padding: '4px 10px', border: '1px solid #e8e8e8', background: editing === p.id ? '#f5f5f5' : '#fff', color: '#555', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
                    {editing === p.id ? '✕' : 'Edit'}
                  </button>
                  <button onClick={() => handleToggleNewArrival(p.id, p.is_new_arrival)} disabled={toggling[p.id]} style={{ padding: '4px 8px', border: '1px solid', borderRadius: 12, background: p.is_new_arrival ? '#000' : '#fff', color: p.is_new_arrival ? '#fff' : '#bbb', borderColor: p.is_new_arrival ? '#000' : '#e8e8e8', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 8, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', opacity: toggling[p.id] ? 0.5 : 1, WebkitTapHighlightColor: 'transparent' }}>
                    New
                  </button>
                  {confirmDelete === p.id ? (
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <button onClick={() => handleDelete(p.id)} disabled={deleting[p.id]} style={{ ...btnSt, background: '#be1826', padding: '4px 8px', fontSize: 9 }}>
                        {deleting[p.id] ? '...' : 'Yes'}
                      </button>
                      <button onClick={() => setConfirm(null)} style={{ ...btnSt, background: '#f5f5f5', color: '#000', padding: '4px 8px', fontSize: 9 }}>No</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirm(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ddd', padding: 4, transition: 'color 0.15s', WebkitTapHighlightColor: 'transparent' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#be1826'}
                      onMouseLeave={e => e.currentTarget.style.color = '#ddd'}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Edit form — smooth slide */}
              <div style={{ overflow: 'hidden', maxHeight: editing === p.id ? '500px' : '0', transition: 'max-height 0.28s ease' }}>
                <div style={{ borderTop: '1px solid #f5f5f5', padding: 16, backgroundColor: '#fafafa' }}>
                  {editError[p.id] && <div style={{ padding: '8px 12px', backgroundColor: '#fff5f5', borderLeft: '2px solid #be1826', fontSize: 12, color: '#be1826', marginBottom: 12 }}>{editError[p.id]}</div>}
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                    {[['Product Name', 'name', 'text'], ['Price (₦)', 'price', 'number'], ['Discount Price (₦)', 'discount_price', 'number']].map(([label, key, type]) => (
                      <div key={key}>
                        <label style={lbSt}>{label}</label>
                        <input type={type} value={editFields[key] || ''} onChange={e => setEditFields(f => ({ ...f, [key]: e.target.value }))} placeholder={key === 'discount_price' ? 'None' : ''} style={inputSt} />
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={lbSt}>Description</label>
                    <textarea value={editFields.description || ''} onChange={e => setEditFields(f => ({ ...f, description: e.target.value }))} rows={3} style={{ ...inputSt, resize: 'vertical', width: '100%', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleEditSave(p.id)} disabled={editSaving[p.id]} style={{ ...btnSt, minWidth: 80 }}>{editSaving[p.id] ? '...' : 'Save Changes'}</button>
                    <button onClick={() => setEditing(null)} style={{ ...btnSt, background: '#f5f5f5', color: '#000' }}>Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Shared components ─────────────────────────────────────────────────────────
function Card({ title, children }) {
  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #f0f0f0' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f5f5f5' }}>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: '0.14em', color: '#000', textTransform: 'uppercase' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function Badge({ label, bg, color }) {
  return <span style={{ padding: '2px 7px', backgroundColor: bg, color, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 8, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{label}</span>;
}

function Th({ children }) {
  return <th style={{ padding: '8px 16px', textAlign: 'left', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 8, letterSpacing: '0.12em', color: '#bbb', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{children}</th>;
}

function Td({ children }) {
  return <td style={{ padding: '10px 16px', fontSize: 12, color: '#333' }}>{children}</td>;
}

function Label({ children }) {
  return <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 8, letterSpacing: '0.14em', color: '#bbb', textTransform: 'uppercase', margin: '0 0 6px' }}>{children}</p>;
}

function InfoBox({ color, bg, border, children }) {
  return (
    <div style={{ padding: '10px 12px', backgroundColor: bg, border: `1px solid ${border}`, borderLeft: `3px solid ${color}` }}>
      <div style={{ fontSize: 11, color, lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

function Empty({ message }) {
  return <div style={{ padding: '48px 16px', textAlign: 'center', fontSize: 11, letterSpacing: '0.1em', color: '#ccc', textTransform: 'uppercase' }}>{message}</div>;
}

function Spinner() {
  return (
    <div style={{ padding: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 24, height: 24, border: '2px solid #f0f0f0', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const inputSt = { padding: '8px 10px', border: '1px solid #e8e8e8', fontFamily: "'Archivo', sans-serif", fontSize: 12, color: '#000', outline: 'none', width: '100%', boxSizing: 'border-box', backgroundColor: '#fff', minHeight: 40 };
const btnSt   = { padding: '7px 12px', background: '#000', color: '#fff', border: 'none', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: '0.08em', cursor: 'pointer', WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' };
const lbSt    = { display: 'block', fontFamily: "'Archivo', sans-serif", fontSize: 9, letterSpacing: '0.1em', color: '#bbb', textTransform: 'uppercase', marginBottom: 5 };
