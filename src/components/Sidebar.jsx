import { useState, useEffect } from "react";

// ADMIN item is injected dynamically only when isAdmin === true
const BASE_MENU_ITEMS = [
  {
    label: "SHOP ALL",
    children: [],
  },
  {
    label: "TOPS",
    children: ["T-Shirts"],
  },
  // {
  //   label: "BOTTOMS",
  //   children: ["Trousers", "Joggers", "Shorts", "Skirts"],
  // },
  // {
  //   label: "OUTERWEAR",
  //   children: ["Coats", "Bombers", "Puffer Jackets"],
  // },
  // {
  //   label: "FOOTWEAR",
  //   children: ["Trainers", "Boots", "Sandals"],
  // },
  {
    label: "ACCESSORIES",
    children: ["Chains"],
  },
  // {
  //   label: "ARCHIVE SALE",
  //   children: [],
  // },
];

const ADMIN_MENU_ITEM = {
  label: "ADMIN",
  children: ["Add Product"],
};

const footerLinks = {
  left: ["INFORMATION", "TERMS & CONDITIONS", "PRIVACY POLICY", "RETURNS"],
  right: [
    { label: "CONTACT", href: "#", isBold: true },
    { label: "+234 706 577 2394", href: "tel:+2347065772394", isBold: false },
    { label: "+234 706 577 2394", href: "tel:+2347065772394", isBold: false },
  ],
};

function ChevronIcon({ open }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        transition: "transform 0.25s ease",
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        flexShrink: 0,
      }}
    >
      <path
        d="M2 5L7 10L12 5"
        stroke="black"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <line x1="2" y1="2" x2="18" y2="18" stroke="black" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="18" y1="2" x2="2" y2="18" stroke="black" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function UserIcon({ filled = false }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle
        cx="11" cy="8" r="3.5"
        stroke="black"
        strokeWidth="1.5"
        fill={filled ? "black" : "none"}
      />
      <path
        d="M3 19c0-4 3.6-7 8-7s8 3 8 7"
        stroke="black"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BagIcon({ count = 0 }) {
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="32" height="34" viewBox="0 0 32 34" fill="none">
        <path d="M11 13V6.5a5 5 0 0 1 10 0V13" stroke="black" strokeWidth="1.75" strokeLinecap="round" />
        <path d="M7.5 13H24.5L26.5 30H5.5L7.5 13Z" stroke="black" strokeWidth="1.75" strokeLinejoin="round" />
      </svg>
      {count >= 0 && (
        <span
          style={{
            position: "absolute",
            top: "21px",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "black",
            fontSize: "12px",
            fontWeight: "bold",
            lineHeight: 1,
            pointerEvents: "none",
          }}
        >
          {count}
        </span>
      )}
    </div>
  );
}

// Fixed categoryMap — "Add Product" (was "Add " with trailing space/missing word)
const categoryMap = {
  "SHOP ALL":    "all",
  "TOPS":        "tops",
  "T-Shirts":    "tshirts",
  "BOTTOMS":     "bottoms",
  "OUTERWEAR":   "outerwear",
  "FOOTWEAR":    "footwear",
  "ACCESSORIES": "accessories",
  "Chains":      "chains",
  "ARCHIVE SALE":"archive",
  "Add Product": "admin",   // ← was "Add " — this was the bug
};

function AccordionItem({ item, isOpen, onToggle, onNavigate }) {
  const hasChildren = item.children && item.children.length > 0;

  const handleCategoryClick = () => {
    if (!hasChildren) {
      const category = categoryMap[item.label] || item.label.toLowerCase();
      onNavigate?.(category);
    }
  };

  return (
    <div style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
      <button
        onClick={hasChildren ? onToggle : handleCategoryClick}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          background: "none",
          border: "none",
          padding: "16px 0",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: "700",
            fontSize: "14px",
            letterSpacing: "0.06em",
            color: "#000",
          }}
        >
          {item.label}
        </span>
        {hasChildren && <ChevronIcon open={isOpen} />}
      </button>

      {hasChildren && (
        <div
          style={{
            overflow: "hidden",
            maxHeight: isOpen ? `${item.children.length * 40}px` : "0px",
            transition: "max-height 0.3s ease",
          }}
        >
          {item.children.map((child) => (
            <button
              key={child}
              onClick={() => {
                const category = categoryMap[child] || child.toLowerCase();
                onNavigate?.(category);
              }}
              style={{
                display: "block",
                width: "100%",
                padding: "8px 0 8px 12px",
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontWeight: "400",
                fontSize: "13px",
                letterSpacing: "0.04em",
                color: "#000",
                transition: "color 0.15s",
                background: "none",
                border: "none",
                borderLeft: "2px solid transparent",
                textAlign: "left",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderLeftColor = "#000"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderLeftColor = "transparent"; }}
            >
              {child}
            </button>
          ))}
          <div style={{ height: "8px" }} />
        </div>
      )}
    </div>
  );
}

export default function Sidebar({
  isOpen,
  onClose,
  cartCount = 0,
  onNavigate,
  isAdmin = false,
  user = null,
  onSignOut,
  onOpenAuth,
}) {
  const [openIndex, setOpenIndex]       = useState(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [stripHeight, setStripHeight]   = useState('80dvh');

  const menuItems = isAdmin
    ? [...BASE_MENU_ITEMS, ADMIN_MENU_ITEM]
    : BASE_MENU_ITEMS;

  const handleToggle = (idx) => setOpenIndex(openIndex === idx ? null : idx);

  useEffect(() => { if (!isOpen) setShowAccountMenu(false); }, [isOpen]);

  useEffect(() => {
    const onScroll = () => {
      const y    = window.scrollY;
      const hero = window.innerHeight * 0.9;
      const half = hero * 0.5;
      if      (y < half)  setStripHeight('80dvh');
      else if (y >= hero) setStripHeight('100dvh');
      else {
        const p = (y - half) / (hero - half);
        setStripHeight(`${80 + p * 20}dvh`);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navigate = (route) => { onNavigate?.(route); onClose?.(false); };

  return (
    <>
      {/* ── Red strip ── */}
      {!isOpen && (
        <div style={{
          position: 'fixed', left: 0, top: 0,
          width: 44,
          height: stripHeight,
          backgroundColor: '#be1826',
          zIndex: 9999,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 14,
          transition: 'height 0.4s cubic-bezier(0.4,0,0.2,1)',
        }}>
          {/* Bag */}
          <button
            onClick={() => onNavigate?.('cart')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, width: '100%', WebkitTapHighlightColor: 'transparent' }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="#000" strokeWidth="1.5" strokeLinejoin="round"/>
              <line x1="3" y1="6" x2="21" y2="6" stroke="#000" strokeWidth="1.5"/>
              <path d="M16 10a4 4 0 01-8 0" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {cartCount > 0 && (
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 9, color: '#000', lineHeight: 1 }}>{cartCount}</span>
            )}
          </button>

          {/* Divider */}
          <div style={{ width: 20, height: 1, backgroundColor: 'rgba(0,0,0,0.2)', marginTop: 6 }} />

          {/* Hamburger — just below the bag */}
          <button
            onClick={() => onClose?.(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '10px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: '100%', WebkitTapHighlightColor: 'transparent' }}
          >
            <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
              <line x1="0" y1="1" x2="16" y2="1" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="2" y1="5" x2="16" y2="5" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="0" y1="9" x2="16" y2="9" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* ── Overlay ── */}
      <div
        onClick={() => onClose?.(false)}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: isOpen ? 'blur(4px)' : 'none',
          WebkitBackdropFilter: isOpen ? 'blur(4px)' : 'none',
          zIndex: 99998,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.4s ease',
        }}
      />

      {/* ── Expanded panel ── */}
      <div style={{
        position: 'fixed', top: 0, left: 0,
        width: 'min(420px, 88vw)', height: '100dvh',
        backgroundColor: '#0f0f0f',
        zIndex: 99999,
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.5s cubic-bezier(0.76,0,0.24,1)',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto', overflowX: 'hidden',
        boxSizing: 'border-box',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px 20px', flexShrink: 0 }}>
          <button
            onClick={() => navigate('home')}
            style={{
              fontFamily: "'Clash Display', sans-serif", fontWeight: 600, fontSize: 17,
              letterSpacing: '0.22em', color: '#fff',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              opacity: isOpen ? 1 : 0,
              transform: isOpen ? 'translateY(0)' : 'translateY(-8px)',
              transition: 'opacity 0.5s 0.15s ease, transform 0.5s 0.15s ease',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            SEE.COM
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, opacity: isOpen ? 1 : 0, transition: 'opacity 0.5s 0.2s ease' }}>
            {/* Account */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => user ? setShowAccountMenu(v => !v) : (onClose?.(false), onOpenAuth?.())}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, position: 'relative', WebkitTapHighlightColor: 'transparent' }}
                title={user ? user.email : 'Log in'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" stroke={user ? '#fff' : 'rgba(255,255,255,0.5)'} strokeWidth="1.5" fill={user ? 'rgba(255,255,255,0.15)' : 'none'}/>
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={user ? '#fff' : 'rgba(255,255,255,0.5)'} strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {user && <span style={{ position: 'absolute', top: -1, right: -1, width: 6, height: 6, borderRadius: '50%', backgroundColor: '#16a34a', border: '1px solid #0f0f0f' }} />}
              </button>

              {showAccountMenu && user && (
                <div style={{ position: 'absolute', top: 'calc(100% + 12px)', right: 0, minWidth: 200, backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 100001, padding: '8px 0', animation: 'stripItemIn 0.2s ease both' }}>
                  <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.04em', margin: 0 }}>{user.email}</p>
                    {isAdmin && <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: '0.12em', color: '#be1826', margin: '4px 0 0', textTransform: 'uppercase' }}>Admin</p>}
                  </div>
                  <button
                    onClick={() => { setShowAccountMenu(false); onSignOut?.(); onClose?.(false); }}
                    style={{ display: 'block', width: '100%', padding: '10px 16px', fontFamily: "'Archivo', sans-serif", fontSize: 12, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', textTransform: 'uppercase', transition: 'color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>

            {/* Bag */}
            <button onClick={() => navigate('cart')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, position: 'relative', WebkitTapHighlightColor: 'transparent' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinejoin="round"/>
                <line x1="3" y1="6" x2="21" y2="6" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"/>
                <path d="M16 10a4 4 0 01-8 0" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {cartCount > 0 && (
                <span style={{ position: 'absolute', top: -6, right: -6, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#be1826', color: '#fff', fontSize: 9, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cartCount}</span>
              )}
            </button>

            {/* Close */}
            <button onClick={() => onClose?.(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(255,255,255,0.5)', transition: 'color 0.15s', WebkitTapHighlightColor: 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="20" y1="4" x2="4" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          </div>
        </div>

        {/* Red accent line */}
        <div style={{ height: 1, backgroundColor: '#be1826', margin: '0 32px', transform: isOpen ? 'scaleX(1)' : 'scaleX(0)', transformOrigin: 'left', transition: 'transform 0.6s 0.2s cubic-bezier(0.16,1,0.3,1)' }} />

        {/* Nav */}
        <nav style={{ padding: '40px 32px 0', flex: 1 }}>
          {menuItems.map((item, i) => (
            <div key={item.label} style={{ opacity: isOpen ? 1 : 0, transform: isOpen ? 'translateX(0)' : 'translateX(-24px)', transition: `opacity 0.5s ${0.25 + i * 0.07}s ease, transform 0.5s ${0.25 + i * 0.07}s cubic-bezier(0.16,1,0.3,1)`, marginBottom: 4 }}>
              <button
                onClick={() => navigate(item.route)}
                style={{
                  display: 'flex', alignItems: 'center', width: '100%',
                  background: 'none', border: 'none', padding: '14px 0',
                  cursor: 'pointer', textAlign: 'left', gap: 12,
                  WebkitTapHighlightColor: 'transparent',
                }}
                onMouseEnter={e => {
                  e.currentTarget.querySelector('.nav-dot').style.opacity = '1';
                  e.currentTarget.querySelector('.nav-dot').style.transform = 'scale(1)';
                  e.currentTarget.querySelector('.nav-label').style.color = '#fff';
                }}
                onMouseLeave={e => {
                  e.currentTarget.querySelector('.nav-dot').style.opacity = '0';
                  e.currentTarget.querySelector('.nav-dot').style.transform = 'scale(0)';
                  e.currentTarget.querySelector('.nav-label').style.color = 'rgba(255,255,255,0.55)';
                }}
              >
                <div className="nav-dot" style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#be1826', flexShrink: 0, opacity: 0, transform: 'scale(0)', transition: 'opacity 0.2s, transform 0.2s' }} />
                <span className="nav-label" style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 600, fontSize: 'clamp(26px, 5vw, 36px)', letterSpacing: '-0.01em', color: 'rgba(255,255,255,0.55)', transition: 'color 0.2s', lineHeight: 1 }}>
                  {item.label}
                </span>
              </button>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '32px 32px 36px', flexShrink: 0, opacity: isOpen ? 1 : 0, transition: 'opacity 0.5s 0.5s ease' }}>
          <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginBottom: 20 }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 20px', marginBottom: 20 }}>
            {['Terms', 'Privacy', 'Returns'].map(label => (
              <a key={label} href="#" onClick={e => e.preventDefault()} style={{ fontFamily: "'Archivo', sans-serif", fontSize: 10, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', textTransform: 'uppercase', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
              >{label}</a>
            ))}
          </div>
          <a href="tel:+2347065772394" style={{ fontFamily: "'Archivo', sans-serif", fontSize: 11, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.25)', textDecoration: 'none', display: 'block', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
          >
            +234 706 577 2394
          </a>
        </div>
      </div>

      <style>{`@keyframes stripItemIn { from { opacity:0; transform:translateY(-4px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </>
  );
}
