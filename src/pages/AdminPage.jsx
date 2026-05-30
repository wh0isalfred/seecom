import { useState, useEffect, useCallback } from 'react';
import AdminProductForm from './AdminProductForm';
import { useDiscount } from '../contexts/DiscountContext';
import { updateProductDetails } from '../services/adminService';
import {
  fetchAllOrders, updateOrderStatus, updatePaymentStatus, saveTrackingInfo,
  fetchAllInventory, updateStockQuantity,
  fetchAllProducts, toggleNewArrival, deleteProductById,
} from '../services/adminService';

// ── Status config ────────────────────────────────────────────────────────────
const ORDER_STATUS = {
  pending:           { label: 'Pending',           bg: '#fef3c7', color: '#92400e' },
  confirmed:         { label: 'Confirmed',          bg: '#dbeafe', color: '#1e40af' },
  processing:        { label: 'Processing',         bg: '#e0f2fe', color: '#0369a1' },
  shipped:           { label: 'Shipped',            bg: '#ede9fe', color: '#5b21b6' },
  out_for_delivery:  { label: 'Out for Delivery',   bg: '#fce7f3', color: '#9d174d' },
  delivered:         { label: 'Delivered',          bg: '#dcfce7', color: '#166534' },
  investigating:     { label: 'Investigating',      bg: '#fff7ed', color: '#c2410c' },
  cancelled:         { label: 'Cancelled',          bg: '#fee2e2', color: '#991b1b' },
};

// What status the admin can move to from each current status
const NEXT_STEPS = {
  pending:          ['confirmed', 'cancelled'],
  confirmed:        ['processing', 'cancelled'],
  processing:       ['shipped'],
  shipped:          ['out_for_delivery'],
  out_for_delivery: [],
  delivered:        [],
  investigating:    ['shipped', 'out_for_delivery', 'delivered', 'cancelled'],
  cancelled:        [],
};
const PAYMENT_STATUS = {
  pending: { label: 'Unpaid', bg: '#fef3c7', color: '#92400e' },
  paid:    { label: 'Paid',   bg: '#dcfce7', color: '#166534' },
  failed:  { label: 'Failed', bg: '#fee2e2', color: '#991b1b' },
};

const fmt = (n) => `₦${(n || 0).toLocaleString()}`;
const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

// ── Root ─────────────────────────────────────────────────────────────────────
export default function AdminPage({ onNavigate }) {
  const [tab, setTab] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f7f7f7' }}>
      {/* Sticky header */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #ebebeb', padding: '0 40px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '52px' }}>
          <button onClick={() => onNavigate?.('home')} style={logoBtn}>SEE.COM</button>
          <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: '10px', letterSpacing: '0.14em', color: '#ccc', textTransform: 'uppercase' }}>Admin</span>
        </div>
        {/* Tabs — scrollable on mobile */}
        <div style={{ display: 'flex', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {['dashboard', 'orders', 'inventory', 'products'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flexShrink: 0,
              padding: '11px 20px', background: 'none', border: 'none',
              borderBottom: tab === t ? '2px solid #be1826' : '2px solid transparent',
              fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
              fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase',
              color: tab === t ? '#be1826' : '#aaa', cursor: 'pointer', transition: 'color 0.15s',
              WebkitTapHighlightColor: 'transparent',
            }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: isMobile ? '20px 16px' : '32px 40px', maxWidth: '1400px', margin: '0 auto' }}>
        {tab === 'dashboard'  && <DashboardTab setTab={setTab} isMobile={isMobile} />}
        {tab === 'orders'     && <OrdersTab isMobile={isMobile} />}
        {tab === 'inventory'  && <InventoryTab isMobile={isMobile} />}
        {tab === 'products'   && <ProductsTab isMobile={isMobile} />}
      </div>
    </div>
  );
}

// ── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardTab({ setTab, isMobile }) {
  const [orders, setOrders]     = useState([]);
  const [inventory, setInv]     = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([fetchAllOrders(), fetchAllInventory()])
      .then(([o, i]) => { setOrders(o); setInv(i); })
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toDateString();
  const revenue    = orders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + (o.total || 0), 0);
  const todayCount = orders.filter(o => new Date(o.created_at).toDateString() === today).length;
  const pending    = orders.filter(o => o.order_status === 'pending').length;
  const lowStock   = inventory.filter(i => i.stock_quantity > 0 && i.stock_quantity <= 3);
  const outOfStock = inventory.filter(i => i.stock_quantity === 0);

  if (loading) return <LoadingBlock />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '12px' }}>
        <StatCard label="Total Revenue" value={fmt(revenue)} sub="from paid orders" accent="#16a34a" />
        <StatCard label="Orders Today"  value={todayCount}  sub="new orders"        accent="#3b82f6" />
        <StatCard label="Pending"       value={pending}     sub="awaiting action"   accent="#f59e0b"
          onClick={() => setTab('orders')} clickable />
        <StatCard label="Low Stock"     value={lowStock.length + outOfStock.length}
          sub={`${outOfStock.length} out of stock`} accent="#be1826"
          onClick={() => setTab('inventory')} clickable />
      </div>

      {/* Low stock alerts */}
      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <Section title="⚠️ Stock Alerts">
          <table style={tableStyle}>
            <thead><tr style={thRowStyle}>
              <Th>Product</Th><Th>Size</Th><Th>Color</Th><Th>Stock</Th><Th>Status</Th>
            </tr></thead>
            <tbody>
              {[...outOfStock, ...lowStock].slice(0, 10).map(item => (
                <tr key={item.id} style={trStyle}>
                  <Td>{item.products?.name || '—'}</Td>
                  <Td>{item.size}</Td>
                  <Td>{item.color}</Td>
                  <Td><strong>{item.stock_quantity}</strong></Td>
                  <Td>
                    <Badge
                      label={item.stock_quantity === 0 ? 'Out of Stock' : 'Low'}
                      bg={item.stock_quantity === 0 ? '#fee2e2' : '#fef3c7'}
                      color={item.stock_quantity === 0 ? '#991b1b' : '#92400e'}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {/* Recent orders */}
      <Section title="Recent Orders">
        {orders.length === 0 ? (
          <Empty message="No orders yet" />
        ) : (
          <table style={tableStyle}>
            <thead><tr style={thRowStyle}>
              <Th>Order</Th><Th>Customer</Th><Th>Date</Th><Th>Total</Th><Th>Status</Th><Th>Payment</Th>
            </tr></thead>
            <tbody>
              {orders.slice(0, 8).map(o => (
                <tr key={o.id} style={trStyle}>
                  <Td><span style={{ fontWeight: 600 }}>{o.order_number}</span></Td>
                  <Td>{o.customer_name || o.customer_email}</Td>
                  <Td>{fmtDate(o.created_at)}</Td>
                  <Td>{fmt(o.total)}</Td>
                  <Td><Badge {...(ORDER_STATUS[o.order_status] || ORDER_STATUS.pending)} /></Td>
                  <Td><Badge {...(PAYMENT_STATUS[o.payment_status] || PAYMENT_STATUS.pending)} /></Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  );
}

// ── ORDERS ───────────────────────────────────────────────────────────────────
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

  // ── Status update — only allow valid next steps ──
  const handleStatus = async (orderId, status) => {
    setSaving(s => ({ ...s, [orderId]: true }));
    const updates = { order_status: status };
    if (status === 'shipped')           updates.shipped_at = new Date().toISOString();
    if (status === 'out_for_delivery')  updates.out_for_delivery_at = new Date().toISOString();
    if (status === 'delivered')         updates.delivered_at = new Date().toISOString();
    try {
      await updateOrderStatus(orderId, status, updates);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o));
    } catch (e) { console.error(e); }
    setSaving(s => ({ ...s, [orderId]: false }));
  };

  // ── Save tracking + auto-advance to Shipped ──
  const handleTracking = async (orderId) => {
    const t = tracking[orderId] || {};
    if (!t.number) return;
    setSaving(s => ({ ...s, [`track_${orderId}`]: true }));
    const updates = {
      tracking_number: t.number,
      carrier: t.carrier || '',
      order_status: 'shipped',
      shipped_at: new Date().toISOString(),
    };
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

  // ── Days since shipped (for confidence signal) ──
  const daysSince = (dateStr) => {
    if (!dateStr) return null;
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  };

  const isAbuja = (order) => {
    const s = (order.shipping_state || '').toLowerCase();
    return s.includes('abuja') || s.includes('fct');
  };

  const getRisk = (order) => {
    if (!['shipped', 'out_for_delivery'].includes(order.order_status)) return null;
    const days = daysSince(order.shipped_at);
    if (days === null) return null;
    const max = isAbuja(order) ? 2 : 5;
    if (days > max + 2) return 'high';
    if (days > max)     return 'medium';
    return null;
  };

  // Filter counts
  const filterKeys = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'investigating'];
  const filterCounts = Object.fromEntries(
    filterKeys.map(k => [k, k === 'all' ? orders.length : orders.filter(o => o.order_status === k).length])
  );

  const filtered = filter === 'all' ? orders : orders.filter(o => o.order_status === filter);

  if (loading) return <LoadingBlock />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Filter pills — scrollable */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
        {filterKeys.map(key => {
          const count = filterCounts[key];
          const cfg   = ORDER_STATUS[key];
          return (
            <button key={key} onClick={() => setFilter(key)} style={{
              flexShrink: 0,
              padding: '5px 12px', border: '1px solid', borderRadius: '20px',
              fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
              fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase',
              cursor: 'pointer', transition: 'all 0.15s',
              background: filter === key ? (cfg?.bg || '#000') : '#fff',
              color:      filter === key ? (cfg?.color || '#fff') : '#aaa',
              borderColor: filter === key ? (cfg?.color || '#000') : '#e0e0e0',
            }}>
              {key === 'all' ? 'All' : cfg?.label} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? <Empty message="No orders here" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(order => {
            const isExpanded = expanded === order.id;
            const statusCfg  = ORDER_STATUS[order.order_status] || ORDER_STATUS.pending;
            const paymentCfg = PAYMENT_STATUS[order.payment_status] || PAYMENT_STATUS.pending;
            const risk       = getRisk(order);
            const daysShipped = daysSince(order.shipped_at);
            const nextSteps  = NEXT_STEPS[order.order_status] || [];
            const needsTracking = order.order_status === 'processing' || (order.order_status === 'confirmed' && !order.tracking_number);

            return (
              <div key={order.id} style={{
                backgroundColor: '#fff',
                border: `1px solid ${risk === 'high' ? '#fecaca' : risk === 'medium' ? '#fed7aa' : '#ebebeb'}`,
                borderLeft: risk ? `3px solid ${risk === 'high' ? '#be1826' : '#f59e0b'}` : '1px solid #ebebeb',
              }}>
                {/* Summary row */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : order.id)}
                  style={{ width: '100%', background: 'none', border: 'none', padding: '14px 20px', cursor: 'pointer', textAlign: 'left' }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr auto' : '1.4fr 1.8fr 0.8fr 0.9fr 1fr 1fr 20px', alignItems: 'center', gap: '8px' }}>
                    <div>
                      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '12px', letterSpacing: '0.06em', display: 'block' }}>
                        {order.order_number}
                      </span>
                      {isMobile && (
                        <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: '11px', color: '#999' }}>
                          {order.customer_name || order.customer_email}
                        </span>
                      )}
                    </div>
                    {!isMobile && <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: '12px', color: '#666' }}>{order.customer_name || order.customer_email}</span>}
                    {!isMobile && <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: '11px', color: '#999' }}>{fmtDate(order.created_at)}</span>}
                    {!isMobile && <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '12px' }}>{fmt(order.total)}</span>}
                    {!isMobile && <Badge label={statusCfg.label} bg={statusCfg.bg} color={statusCfg.color} />}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isMobile && <Badge label={statusCfg.label} bg={statusCfg.bg} color={statusCfg.color} />}
                      {/* Risk indicator */}
                      {risk && (
                        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '8px', letterSpacing: '0.1em', color: risk === 'high' ? '#be1826' : '#f59e0b', textTransform: 'uppercase' }}>
                          {daysShipped}d
                        </span>
                      )}
                    </div>
                    <span style={{ color: '#aaa', fontSize: '14px', transition: 'transform 0.2s', display: 'inline-block', transform: isExpanded ? 'rotate(90deg)' : 'none', textAlign: 'right' }}>›</span>
                  </div>
                </button>

                {/* Expanded */}
                <div style={{
                  overflow: 'hidden',
                  maxHeight: isExpanded ? '1200px' : '0',
                  transition: 'max-height 0.35s ease',
                }}>
                  <div style={{ borderTop: '1px solid #f0f0f0', padding: '20px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '24px' }}>

                    {/* Left: items */}
                    <div>
                      <p style={sectionLabel}>Items</p>
                      {(order.order_items || []).map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                          <div>
                            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '12px' }}>{item.product_name}</div>
                            <div style={{ fontFamily: "'Archivo', sans-serif", fontSize: '11px', color: '#999', marginTop: 2 }}>
                              {item.size} / {item.color} × {item.quantity}
                            </div>
                          </div>
                          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '12px' }}>{fmt(item.total_price)}</div>
                        </div>
                      ))}

                      {/* Customer info */}
                      <div style={{ marginTop: 16 }}>
                        <p style={sectionLabel}>Customer</p>
                        <p style={infoText}>{order.customer_name}</p>
                        <p style={infoText}>{order.customer_email}</p>
                        {order.customer_phone && <p style={infoText}>{order.customer_phone}</p>}
                        {order.shipping_address && (
                          <p style={{ ...infoText, marginTop: 6, color: '#888', lineHeight: 1.5 }}>
                            {order.shipping_address}, {order.shipping_city}, {order.shipping_state}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                      {/* Risk warning */}
                      {risk && (
                        <div style={{ padding: '10px 12px', backgroundColor: risk === 'high' ? '#fff5f5' : '#fffbeb', borderLeft: `3px solid ${risk === 'high' ? '#be1826' : '#f59e0b'}` }}>
                          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', color: risk === 'high' ? '#be1826' : '#92400e', margin: '0 0 2px', textTransform: 'uppercase' }}>
                            {risk === 'high' ? '⚠ Overdue' : '⚡ Running late'}
                          </p>
                          <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '11px', color: '#666', margin: 0, lineHeight: 1.5 }}>
                            Shipped {daysShipped} day{daysShipped !== 1 ? 's' : ''} ago · {isAbuja(order) ? 'Abuja (max 2 days)' : 'Outside Abuja (max 5 days)'}
                          </p>
                        </div>
                      )}

                      {/* Delivery progress */}
                      <div>
                        <p style={sectionLabel}>Delivery Progress</p>
                        <DeliveryProgress status={order.order_status} />
                      </div>

                      {/* Tracking */}
                      <div>
                        <p style={sectionLabel}>Tracking</p>
                        {order.tracking_number ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '12px', color: '#16a34a' }}>
                              {order.carrier && `${order.carrier} · `}{order.tracking_number}
                            </span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <input
                              placeholder="Tracking number"
                              value={tracking[order.id]?.number || ''}
                              onChange={e => setTracking(t => ({ ...t, [order.id]: { ...t[order.id], number: e.target.value } }))}
                              style={{ ...inputStyle, flex: 1, minWidth: '120px' }}
                            />
                            <input
                              placeholder="Carrier (optional)"
                              value={tracking[order.id]?.carrier || ''}
                              onChange={e => setTracking(t => ({ ...t, [order.id]: { ...t[order.id], carrier: e.target.value } }))}
                              style={{ ...inputStyle, width: '110px' }}
                            />
                            <button onClick={() => handleTracking(order.id)} disabled={saving[`track_${order.id}`] || !tracking[order.id]?.number} style={smallBtn}>
                              {saving[`track_${order.id}`] ? '...' : 'Save & Ship'}
                            </button>
                          </div>
                        )}
                        {needsTracking && !order.tracking_number && (
                          <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '10px', color: '#f59e0b', margin: '6px 0 0', letterSpacing: '0.04em' }}>
                            Add tracking to mark as Shipped
                          </p>
                        )}
                      </div>

                      {/* Next steps — only valid transitions */}
                      {nextSteps.length > 0 && (
                        <div>
                          <p style={sectionLabel}>Next Step</p>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {nextSteps.map(key => {
                              const cfg = ORDER_STATUS[key];
                              const isShip = key === 'shipped';
                              // Disable ship button if no tracking
                              const disabled = saving[order.id] || (isShip && !order.tracking_number);
                              return (
                                <button
                                  key={key}
                                  onClick={() => handleStatus(order.id, key)}
                                  disabled={disabled}
                                  title={isShip && !order.tracking_number ? 'Add tracking number first' : ''}
                                  style={{
                                    padding: '8px 16px', border: '1px solid',
                                    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
                                    fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase',
                                    cursor: disabled ? 'not-allowed' : 'pointer',
                                    background: cfg.bg, color: cfg.color, borderColor: cfg.color,
                                    opacity: disabled ? 0.5 : 1, transition: 'opacity 0.15s',
                                  }}
                                >
                                  {saving[order.id] ? '...' : `→ ${cfg.label}`}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Customer confirmation status */}
                      {['shipped', 'out_for_delivery'].includes(order.order_status) && (
                        <div style={{ padding: '10px 12px', backgroundColor: '#f8faff', border: '1px solid #e0e7ff' }}>
                          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '9px', letterSpacing: '0.12em', color: '#4338ca', margin: '0 0 3px', textTransform: 'uppercase' }}>
                            Awaiting customer confirmation
                          </p>
                          <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '11px', color: '#666', margin: 0, lineHeight: 1.5 }}>
                            Customer will see a "Confirm Received" button. Auto-closes after grace period.
                          </p>
                        </div>
                      )}

                      {/* Investigating — show issue report */}
                      {order.order_status === 'investigating' && (
                        <div style={{ padding: '10px 12px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}>
                          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '9px', letterSpacing: '0.12em', color: '#c2410c', margin: '0 0 3px', textTransform: 'uppercase' }}>
                            ⚠ Customer reported an issue
                          </p>
                          <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '11px', color: '#666', margin: 0, lineHeight: 1.5 }}>
                            Contact the customer and resolve before marking delivered.
                          </p>
                          {order.customer_phone && (
                            <a
                              href={`https://wa.me/${order.customer_phone.replace(/\D/g,'').replace(/^0/, '234')}`}
                              target="_blank" rel="noopener noreferrer"
                              style={{ display: 'inline-block', marginTop: 8, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', color: '#16a34a', textDecoration: 'none' }}
                            >
                              WhatsApp Customer →
                            </a>
                          )}
                        </div>
                      )}

                      {/* Payment status */}
                      <div>
                        <p style={sectionLabel}>Payment</p>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {Object.entries(PAYMENT_STATUS).map(([key, cfg]) => (
                            <button
                              key={key}
                              onClick={() => handlePayment(order.id, key)}
                              disabled={saving[`pay_${order.id}`] || order.payment_status === key}
                              style={{
                                padding: '5px 10px', border: '1px solid',
                                fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
                                fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase',
                                cursor: 'pointer',
                                background: order.payment_status === key ? cfg.bg : '#fff',
                                color: order.payment_status === key ? cfg.color : '#888',
                                borderColor: order.payment_status === key ? cfg.color : '#e0e0e0',
                                opacity: saving[`pay_${order.id}`] ? 0.5 : 1,
                              }}
                            >
                              {cfg.label}
                            </button>
                          ))}
                        </div>
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

// Delivery progress stepper
function DeliveryProgress({ status }) {
  const steps = ['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];
  const labels = { confirmed: 'Confirmed', processing: 'Processing', shipped: 'Shipped', out_for_delivery: 'Out for Delivery', delivered: 'Delivered' };
  const currentIdx = steps.indexOf(status);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {steps.map((step, i) => {
        const done    = currentIdx >= i;
        const current = currentIdx === i;
        const cfg     = ORDER_STATUS[step];
        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                backgroundColor: done ? cfg.color : '#e0e0e0',
                border: current ? `2px solid ${cfg.color}` : '2px solid transparent',
                boxShadow: current ? `0 0 0 3px ${cfg.bg}` : 'none',
                transition: 'all 0.3s',
                flexShrink: 0,
              }} />
              <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: '8px', letterSpacing: '0.06em', color: done ? cfg.color : '#ccc', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                {labels[step]}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 1, backgroundColor: done && currentIdx > i ? cfg.color : '#e8e8e8', margin: '0 4px', marginBottom: 16, transition: 'background-color 0.3s' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}


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
      const initial = {};
      data.forEach(item => { initial[item.id] = item.stock_quantity; });
      setEdits(initial);
      setLoading(false);
    });
  }, []);

  // Group by product
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
      await Promise.all(items.map(item =>
        updateStockQuantity(item.id, edits[item.id] ?? item.stock_quantity)
      ));
      setInventory(prev => prev.map(item =>
        item.products?.id === productId
          ? { ...item, stock_quantity: edits[item.id] ?? item.stock_quantity }
          : item
      ));
      setSaved(s => ({ ...s, [productId]: true }));
      setTimeout(() => setSaved(s => ({ ...s, [productId]: false })), 2000);
    } catch (e) { console.error(e); }
    setSaving(s => ({ ...s, [productId]: false }));
  };

  if (loading) return <LoadingBlock />;

  const totalItems    = inventory.length;
  const outCount      = inventory.filter(i => i.stock_quantity === 0).length;
  const lowCount      = inventory.filter(i => i.stock_quantity > 0 && i.stock_quantity <= 3).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Summary bar */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <MiniStat label="Total SKUs" value={totalItems} />
        <MiniStat label="Out of Stock" value={outCount} color="#be1826" />
        <MiniStat label="Low Stock (≤3)" value={lowCount} color="#f59e0b" />
      </div>

      {/* Search */}
      <input
        placeholder="Search product..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ ...inputStyle, maxWidth: '300px' }}
      />

      {filteredGroups.length === 0 ? <Empty message="No inventory data" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredGroups.map(([productId, group]) => {
            const total = group.items.reduce((s, i) => s + (edits[i.id] ?? i.stock_quantity), 0);
            const hasOOS = group.items.some(i => (edits[i.id] ?? i.stock_quantity) === 0);
            const hasLow = group.items.some(i => { const q = edits[i.id] ?? i.stock_quantity; return q > 0 && q <= 3; });

            return (
              <div key={productId} style={{ backgroundColor: '#fff', border: '1px solid #ebebeb' }}>
                {/* Product header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #f5f5f5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {group.product?.image_1 && (
                      <div style={{ width: '36px', height: '36px', backgroundImage: `url(${group.product.image_1})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#f5f5f5', flexShrink: 0 }} />
                    )}
                    <div>
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '12px', letterSpacing: '0.04em' }}>
                        {group.product?.name || 'Unknown'}
                      </div>
                      <div style={{ fontFamily: "'Archivo', sans-serif", fontSize: '10px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '2px' }}>
                        {group.product?.category}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {hasOOS && <Badge label="Out of Stock" bg="#fee2e2" color="#991b1b" />}
                    {hasLow && !hasOOS && <Badge label="Low Stock" bg="#fef3c7" color="#92400e" />}
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '11px', color: '#666' }}>
                      {total} units
                    </span>
                    <button
                      onClick={() => saveProduct(productId)}
                      disabled={saving[productId]}
                      style={{
                        ...smallBtn,
                        background: saved[productId] ? '#16a34a' : '#000',
                        minWidth: '60px',
                      }}
                    >
                      {saving[productId] ? '...' : saved[productId] ? '✓ Saved' : 'Save'}
                    </button>
                  </div>
                </div>

                {/* SKU rows */}
                <table style={{ ...tableStyle, margin: 0 }}>
                  <thead><tr style={thRowStyle}>
                    <Th>Size</Th><Th>Color</Th><Th>Stock</Th><Th>Status</Th>
                  </tr></thead>
                  <tbody>
                    {group.items.map(item => {
                      const qty = edits[item.id] ?? item.stock_quantity;
                      return (
                        <tr key={item.id} style={trStyle}>
                          <Td>{item.size || '—'}</Td>
                          <Td>{item.color || '—'}</Td>
                          <Td>
                            <input
                              type="number" min="0"
                              value={edits[item.id] ?? item.stock_quantity}
                              onChange={e => setEdits(prev => ({ ...prev, [item.id]: parseInt(e.target.value) || 0 }))}
                              style={{ width: '64px', padding: '5px 8px', border: '1px solid #e0e0e0', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '12px', textAlign: 'center' }}
                            />
                          </Td>
                          <Td>
                            {qty === 0
                              ? <Badge label="Out of Stock" bg="#fee2e2" color="#991b1b" />
                              : qty <= 3
                              ? <Badge label={`Low (${qty})`} bg="#fef3c7" color="#92400e" />
                              : <Badge label="In Stock" bg="#dcfce7" color="#166534" />}
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── PRODUCTS ─────────────────────────────────────────────────────────────────
function ProductsTab({ isMobile = false }) {
  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [toggling, setToggling]     = useState({});
  const [deleting, setDeleting]     = useState({});
  const [confirmDelete, setConfirm] = useState(null);
  const [editing, setEditing]       = useState(null); // product id being edited
  const [editFields, setEditFields] = useState({});
  const [editSaving, setEditSaving] = useState({});
  const [editError, setEditError]   = useState({});

  // Global discount
  const { discount, updateDiscount } = useDiscount();
  const [discPct, setDiscPct]   = useState(String(discount.percent));
  const [discOn, setDiscOn]     = useState(discount.active);
  const [discSaving, setDiscSaving] = useState(false);
  const [discSaved, setDiscSaved]   = useState(false);

  // Sync when discount loads
  useEffect(() => {
    setDiscPct(String(discount.percent));
    setDiscOn(discount.active);
  }, [discount.percent, discount.active]);

  const load = useCallback(() => {
    setLoading(true);
    fetchAllProducts().then(data => { setProducts(data); setLoading(false); });
  }, []);
  useEffect(() => { load(); }, [load]);

  // ── Global discount save ──
  const handleSaveDiscount = async () => {
    setDiscSaving(true);
    try {
      await updateDiscount(parseFloat(discPct) || 0, discOn);
      setDiscSaved(true);
      setTimeout(() => setDiscSaved(false), 2000);
    } catch (e) { console.error(e); }
    setDiscSaving(false);
  };

  // ── Toggle new arrival ──
  const handleToggleNewArrival = async (id, current) => {
    setToggling(t => ({ ...t, [id]: true }));
    try {
      await toggleNewArrival(id, !current);
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_new_arrival: !current } : p));
    } catch (e) { console.error(e); }
    setToggling(t => ({ ...t, [id]: false }));
  };

  // ── Delete ──
  const handleDelete = async (id) => {
    setDeleting(d => ({ ...d, [id]: true }));
    try {
      await deleteProductById(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (e) { console.error(e); }
    setDeleting(d => ({ ...d, [id]: false }));
    setConfirm(null);
  };

  // ── Edit ──
  const startEdit = (p) => {
    setEditing(p.id);
    setEditFields({
      name: p.name || '',
      price: String(p.price || ''),
      discount_price: p.discount_price ? String(p.discount_price) : '',
      description: p.description || '',
    });
    setEditError(e => ({ ...e, [p.id]: '' }));
  };

  const handleEditSave = async (id) => {
    setEditSaving(s => ({ ...s, [id]: true }));
    setEditError(e => ({ ...e, [id]: '' }));
    try {
      const updated = await updateProductDetails(id, editFields);
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
      setEditing(null);
    } catch (e) {
      setEditError(err => ({ ...err, [id]: e.message || 'Save failed' }));
    }
    setEditSaving(s => ({ ...s, [id]: false }));
  };

  if (loading) return <LoadingBlock />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Global discount card ── */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #ebebeb' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Global Discount
            </span>
            <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: '11px', color: '#aaa', margin: '3px 0 0', letterSpacing: '0.02em' }}>
              Applies to all products. Per-product discounts take priority.
            </p>
          </div>
          {/* Active toggle */}
          <button
            onClick={() => setDiscOn(v => !v)}
            style={{
              padding: '6px 14px', border: '1px solid', borderRadius: '14px',
              fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '10px',
              letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
              background: discOn ? '#16a34a' : '#f0f0f0',
              color: discOn ? '#fff' : '#888',
              borderColor: discOn ? '#16a34a' : '#e0e0e0',
              transition: 'all 0.15s',
            }}
          >
            {discOn ? 'Active' : 'Off'}
          </button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="number" min="0" max="100"
              value={discPct}
              onChange={e => setDiscPct(e.target.value)}
              style={{ width: '72px', padding: '8px 10px', border: '1px solid #e0e0e0', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '16px', textAlign: 'center' }}
            />
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '16px', color: '#000' }}>%</span>
          </div>

          {discPct > 0 && discOn && (
            <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: '12px', color: '#be1826', letterSpacing: '0.02em' }}>
              All products showing {discPct}% off
            </span>
          )}

          <button
            onClick={handleSaveDiscount}
            disabled={discSaving}
            style={{ ...smallBtn, background: discSaved ? '#16a34a' : '#000', marginLeft: 'auto', minWidth: '80px' }}
          >
            {discSaving ? '...' : discSaved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </div>

      {/* ── Add product toggle ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{ padding: '10px 20px', background: showForm ? '#f0f0f0' : '#000', color: showForm ? '#000' : '#fff', border: 'none', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', cursor: 'pointer' }}
        >
          {showForm ? '✕ CANCEL' : '+ ADD PRODUCT'}
        </button>
      </div>

      {showForm && (
        <div style={{ backgroundColor: '#fff', border: '1px solid #ebebeb' }}>
          <AdminProductForm onProductCreated={() => { setShowForm(false); load(); }} />
        </div>
      )}

      {/* ── Products list ── */}
      {products.length === 0 ? <Empty message="No products yet" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {products.map(p => (
            <div key={p.id} style={{ backgroundColor: '#fff', border: '1px solid #ebebeb' }}>
              {/* Product row */}
              <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr auto', alignItems: 'center', gap: '16px', padding: '12px 20px' }}>
                <div style={{ width: '48px', height: '48px', backgroundImage: p.image_1 ? `url(${p.image_1})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#f5f5f5', flexShrink: 0 }} />

                <div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '13px', letterSpacing: '0.04em' }}>{p.name}</div>
                  <div style={{ fontFamily: "'Archivo', sans-serif", fontSize: '11px', color: '#999', marginTop: '3px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>{p.category}</span>
                    <span>{fmt(p.price)}</span>
                    {p.discount_price && (
                      <span style={{ color: '#be1826', fontWeight: 600 }}>→ {fmt(p.discount_price)}</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {/* Edit */}
                  <button
                    onClick={() => editing === p.id ? setEditing(null) : startEdit(p)}
                    style={{
                      padding: '5px 12px', border: '1px solid', borderRadius: '2px',
                      fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '9px',
                      letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
                      background: editing === p.id ? '#f0f0f0' : '#fff',
                      color: editing === p.id ? '#000' : '#555',
                      borderColor: '#e0e0e0', transition: 'all 0.15s',
                    }}
                  >
                    {editing === p.id ? '✕ Cancel' : 'Edit'}
                  </button>

                  {/* New arrival */}
                  <button
                    onClick={() => handleToggleNewArrival(p.id, p.is_new_arrival)}
                    disabled={toggling[p.id]}
                    style={{
                      padding: '5px 10px', border: '1px solid', borderRadius: '12px',
                      fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '9px',
                      letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
                      background: p.is_new_arrival ? '#000' : '#fff',
                      color: p.is_new_arrival ? '#fff' : '#aaa',
                      borderColor: p.is_new_arrival ? '#000' : '#e0e0e0',
                      opacity: toggling[p.id] ? 0.5 : 1, transition: 'all 0.15s',
                    }}
                  >
                    New Arrival
                  </button>

                  {/* Delete */}
                  {confirmDelete === p.id ? (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: '11px', color: '#be1826' }}>Delete?</span>
                      <button onClick={() => handleDelete(p.id)} disabled={deleting[p.id]} style={{ ...smallBtn, background: '#be1826' }}>
                        {deleting[p.id] ? '...' : 'Yes'}
                      </button>
                      <button onClick={() => setConfirm(null)} style={{ ...smallBtn, background: '#f0f0f0', color: '#000' }}>No</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirm(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ddd', padding: '4px', transition: 'color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#be1826'}
                      onMouseLeave={e => e.currentTarget.style.color = '#ddd'}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* ── Inline edit form ── */}
              {editing === p.id && (
                <div style={{ borderTop: '1px solid #f5f5f5', padding: '20px', backgroundColor: '#fafafa' }}>
                  {editError[p.id] && (
                    <div style={{ padding: '8px 12px', backgroundColor: '#fff5f5', borderLeft: '3px solid #be1826', fontFamily: "'Archivo', sans-serif", fontSize: '12px', color: '#be1826', marginBottom: '14px' }}>
                      {editError[p.id]}
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={editLabel}>Product Name</label>
                      <input
                        value={editFields.name}
                        onChange={e => setEditFields(f => ({ ...f, name: e.target.value }))}
                        style={editInput}
                      />
                    </div>
                    <div>
                      <label style={editLabel}>Price (₦)</label>
                      <input
                        type="number"
                        value={editFields.price}
                        onChange={e => setEditFields(f => ({ ...f, price: e.target.value }))}
                        style={editInput}
                      />
                    </div>
                    <div>
                      <label style={editLabel}>Discount Price (₦) — leave blank to remove</label>
                      <input
                        type="number"
                        value={editFields.discount_price}
                        placeholder="None"
                        onChange={e => setEditFields(f => ({ ...f, discount_price: e.target.value }))}
                        style={editInput}
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={editLabel}>Description</label>
                    <textarea
                      value={editFields.description}
                      onChange={e => setEditFields(f => ({ ...f, description: e.target.value }))}
                      rows={3}
                      style={{ ...editInput, resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleEditSave(p.id)}
                      disabled={editSaving[p.id]}
                      style={{ ...smallBtn, minWidth: '80px' }}
                    >
                      {editSaving[p.id] ? '...' : 'Save Changes'}
                    </button>
                    <button onClick={() => setEditing(null)} style={{ ...smallBtn, background: '#f0f0f0', color: '#000' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const editLabel = { display: 'block', fontFamily: "'Archivo', sans-serif", fontSize: '10px', letterSpacing: '0.08em', color: '#aaa', textTransform: 'uppercase', marginBottom: '6px' };
const editInput = { padding: '8px 10px', border: '1px solid #e0e0e0', fontFamily: "'Archivo', sans-serif", fontSize: '13px', color: '#000', outline: 'none', width: '100%', boxSizing: 'border-box', backgroundColor: '#fff' };

// ── Shared UI pieces ─────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent, onClick, clickable }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: '#fff', border: '1px solid #ebebeb', padding: '20px 24px',
        textAlign: 'left', cursor: clickable ? 'pointer' : 'default',
        transition: clickable ? 'border-color 0.15s' : 'none',
        borderLeft: `3px solid ${accent}`,
      }}
      onMouseEnter={e => { if (clickable) e.currentTarget.style.borderColor = accent; }}
      onMouseLeave={e => { if (clickable) e.currentTarget.style.borderColor = '#ebebeb'; e.currentTarget.style.borderLeftColor = accent; }}
    >
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '24px', color: '#000', marginBottom: '4px' }}>{value}</div>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '10px', letterSpacing: '0.12em', color: '#000', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: "'Archivo', sans-serif", fontSize: '11px', color: '#aaa', marginTop: '4px' }}>{sub}</div>
    </button>
  );
}

function MiniStat({ label, value, color = '#000' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fff', border: '1px solid #ebebeb', padding: '10px 16px' }}>
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '18px', color }}>{value}</span>
      <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: '11px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #ebebeb' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0' }}>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', color: '#000', textTransform: 'uppercase' }}>{title}</span>
      </div>
      <div style={{ padding: '0' }}>{children}</div>
    </div>
  );
}

function Badge({ label, bg, color }) {
  return (
    <span style={{ padding: '3px 8px', backgroundColor: bg, color, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

function Th({ children }) {
  return <th style={{ padding: '8px 20px', textAlign: 'left', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '9px', letterSpacing: '0.1em', color: '#aaa', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{children}</th>;
}
function Td({ children }) {
  return <td style={{ padding: '10px 20px', fontFamily: "'Archivo', sans-serif", fontSize: '12px', color: '#333' }}>{children}</td>;
}
function Empty({ message }) {
  return <div style={{ padding: '48px', textAlign: 'center', fontFamily: "'Archivo', sans-serif", fontSize: '12px', letterSpacing: '0.08em', color: '#ccc', textTransform: 'uppercase' }}>{message}</div>;
}
function LoadingBlock() {
  return <div style={{ padding: '80px', textAlign: 'center', fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px', letterSpacing: '0.2em', color: '#ccc' }}>LOADING...</div>;
}

// ── Styles ───────────────────────────────────────────────────────────────────
const logoBtn  = { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '15px', letterSpacing: '0.1em', background: 'none', border: 'none', cursor: 'pointer', color: '#000', padding: 0 };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thRowStyle = { borderBottom: '1px solid #f5f5f5' };
const trStyle  = { borderBottom: '1px solid #f9f9f9', transition: 'background 0.1s' };
const sectionLabel = { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '9px', letterSpacing: '0.12em', color: '#aaa', textTransform: 'uppercase', margin: '0 0 8px' };
const infoText = { fontFamily: "'Archivo', sans-serif", fontSize: '12px', color: '#555', margin: '2px 0' };
const inputStyle = { padding: '7px 10px', border: '1px solid #e0e0e0', fontFamily: "'Archivo', sans-serif", fontSize: '12px', outline: 'none', width: '100%', boxSizing: 'border-box' };
const smallBtn = { padding: '6px 12px', background: '#000', color: '#fff', border: 'none', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '10px', letterSpacing: '0.08em', cursor: 'pointer' };
