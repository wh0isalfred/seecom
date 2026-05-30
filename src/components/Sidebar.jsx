import { useState, useEffect } from "react";

const BASE_MENU_ITEMS = [
  { label: "Shop All",   route: "all",         children: [] },
  { label: "T-Shirts",   route: "tshirts",     children: [] },
  { label: "Chains",     route: "chains",      children: [] },
];

const ADMIN_MENU_ITEM = { label: "Admin", route: "admin", children: [] };

const categoryMap = {
  "all":        "all",
  "tshirts":    "tshirts",
  "chains":     "chains",
  "admin":      "admin",
};

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
  const [stripHeight, setStripHeight] = useState("80dvh");
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  const menuItems = isAdmin
    ? [...BASE_MENU_ITEMS, ADMIN_MENU_ITEM]
    : BASE_MENU_ITEMS;

  // Dynamic strip height on scroll
  useEffect(() => {
    const onScroll = () => {
      const scrollY   = window.scrollY;
      const heroH     = window.innerHeight * 0.9;
      const halfHeroH = heroH * 0.5;
      if      (scrollY < halfHeroH) setStripHeight("85dvh");
      else if (scrollY >= heroH)    setStripHeight("100dvh");
      else {
        const p = (scrollY - halfHeroH) / (heroH - halfHeroH);
        setStripHeight(`${85 + p * 15}dvh`);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close account menu when sidebar closes
  useEffect(() => {
    if (!isOpen) setShowAccountMenu(false);
  }, [isOpen]);

  const navigate = (route) => {
    onNavigate?.(route);
    onClose?.(false);
  };

  return (
    <>
      <style>{`
        @keyframes stripItemIn { from { opacity:0; transform:translateX(-8px) } to { opacity:1; transform:translateX(0) } }
      `}</style>

      {/* ── COLLAPSED RED STRIP ── */}
      {!isOpen && (
        <div style={{
          position: "fixed", left: 0, top: 0,
          width: "40px", height: stripHeight,
          backgroundColor: "#be1826",
          display: "flex", flexDirection: "column",
          alignItems: "center",
          paddingTop: "14px", paddingBottom: "14px",
          zIndex: 9999, overflow: "hidden",
          transition: "height 0.4s cubic-bezier(0.4,0,0.2,1)",
        }}>
          {/* Bag */}
          <button
            onClick={() => onNavigate?.("cart")}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", color: "#000", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, WebkitTapHighlightColor: "transparent" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
              <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="1.6"/>
              <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            {cartCount > 0 && (
              <span style={{ fontSize: "9px", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: "#000", lineHeight: 1 }}>
                {cartCount}
              </span>
            )}
          </button>

          {/* Open trigger — centered */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <button
              onClick={() => onClose?.(true)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "8px", color: "#000", display: "flex", WebkitTapHighlightColor: "transparent" }}
            >
              <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                <line x1="0" y1="1" x2="16" y2="1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="0" y1="5" x2="10" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="0" y1="9" x2="16" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── OVERLAY ── */}
      <div
        onClick={() => onClose?.(false)}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: isOpen ? "blur(4px)" : "none",
          WebkitBackdropFilter: isOpen ? "blur(4px)" : "none",
          zIndex: 99998,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.4s ease",
        }}
      />

      {/* ── EXPANDED PANEL ── */}
      <div style={{
        position: "fixed", top: 0, left: 0,
        width: "min(420px, 88vw)", height: "100dvh",
        backgroundColor: "#0f0f0f",
        zIndex: 99999,
        transform: isOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.5s cubic-bezier(0.76,0,0.24,1)",
        display: "flex", flexDirection: "column",
        overflowY: "auto", overflowX: "hidden",
        boxSizing: "border-box",
      }}>

        {/* ── HEADER ── */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          padding: "24px 32px 20px",
          flexShrink: 0,
        }}>
          {/* Logo */}
          <button
            onClick={() => navigate("home")}
            style={{
              fontFamily: "'Clash Display', sans-serif",
              fontWeight: 600, fontSize: "17px",
              letterSpacing: "0.22em", color: "#fff",
              background: "none", border: "none",
              cursor: "pointer", padding: 0,
              WebkitTapHighlightColor: "transparent",
              opacity: isOpen ? 1 : 0,
              transform: isOpen ? "translateY(0)" : "translateY(-8px)",
              transition: "opacity 0.5s 0.15s ease, transform 0.5s 0.15s ease",
            }}
          >
            SEE.COM
          </button>

          {/* Right icons */}
          <div style={{ display: "flex", alignItems: "center", gap: 20,
            opacity: isOpen ? 1 : 0,
            transition: "opacity 0.5s 0.2s ease",
          }}>
            {/* Account */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => user ? setShowAccountMenu(v => !v) : (onClose?.(false), onOpenAuth?.())}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, position: "relative", WebkitTapHighlightColor: "transparent" }}
                title={user ? user.email : "Log in"}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" stroke={user ? "#fff" : "rgba(255,255,255,0.5)"} strokeWidth="1.5" fill={user ? "rgba(255,255,255,0.15)" : "none"}/>
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={user ? "#fff" : "rgba(255,255,255,0.5)"} strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {user && (
                  <span style={{ position: "absolute", top: -1, right: -1, width: 6, height: 6, borderRadius: "50%", backgroundColor: "#16a34a", border: "1px solid #0f0f0f" }} />
                )}
              </button>

              {/* Account dropdown */}
              {showAccountMenu && user && (
                <div style={{
                  position: "absolute", top: "calc(100% + 12px)", right: 0,
                  minWidth: "200px", backgroundColor: "#1a1a1a",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                  zIndex: 100001, padding: "8px 0",
                  animation: "stripItemIn 0.2s ease both",
                }}>
                  <div style={{ padding: "10px 16px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.04em", margin: 0 }}>
                      {user.email}
                    </p>
                    {isAdmin && (
                      <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "9px", letterSpacing: "0.12em", color: "#be1826", margin: "4px 0 0", textTransform: "uppercase" }}>
                        Admin
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => { setShowAccountMenu(false); onSignOut?.(); onClose?.(false); }}
                    style={{
                      display: "block", width: "100%", padding: "10px 16px",
                      fontFamily: "'Archivo', sans-serif", fontSize: "12px",
                      letterSpacing: "0.06em", color: "rgba(255,255,255,0.6)",
                      background: "none", border: "none", textAlign: "left",
                      cursor: "pointer", textTransform: "uppercase",
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                    onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>

            {/* Bag */}
            <button
              onClick={() => navigate("cart")}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, position: "relative", WebkitTapHighlightColor: "transparent" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinejoin="round"/>
                <line x1="3" y1="6" x2="21" y2="6" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"/>
                <path d="M16 10a4 4 0 01-8 0" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {cartCount > 0 && (
                <span style={{
                  position: "absolute", top: -6, right: -6,
                  width: 16, height: 16, borderRadius: "50%",
                  backgroundColor: "#be1826", color: "#fff",
                  fontSize: "9px", fontWeight: 700,
                  fontFamily: "'Space Grotesk', sans-serif",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {cartCount}
                </span>
              )}
            </button>

            {/* Close */}
            <button
              onClick={() => onClose?.(false)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "rgba(255,255,255,0.5)", transition: "color 0.15s", WebkitTapHighlightColor: "transparent" }}
              onMouseEnter={e => e.currentTarget.style.color = "#fff"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="20" y1="4" x2="4" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── THIN RED LINE ── */}
        <div style={{
          height: "1px",
          backgroundColor: "#be1826",
          margin: "0 32px",
          transform: isOpen ? "scaleX(1)" : "scaleX(0)",
          transformOrigin: "left",
          transition: "transform 0.6s 0.2s cubic-bezier(0.16,1,0.3,1)",
        }} />

        {/* ── NAV ── */}
        <nav style={{ padding: "40px 32px 0", flex: 1 }}>
          {menuItems.map((item, i) => (
            <div
              key={item.label}
              style={{
                opacity: isOpen ? 1 : 0,
                transform: isOpen ? "translateX(0)" : "translateX(-24px)",
                transition: `opacity 0.5s ${0.25 + i * 0.07}s ease, transform 0.5s ${0.25 + i * 0.07}s cubic-bezier(0.16,1,0.3,1)`,
                marginBottom: "4px",
              }}
            >
              <button
                onClick={() => navigate(item.route)}
                onMouseEnter={() => setHoveredItem(item.label)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  display: "flex", alignItems: "center",
                  width: "100%", background: "none", border: "none",
                  padding: "14px 0", cursor: "pointer", textAlign: "left",
                  WebkitTapHighlightColor: "transparent",
                  gap: 12,
                }}
              >
                {/* Red dot indicator on hover */}
                <div style={{
                  width: 5, height: 5, borderRadius: "50%",
                  backgroundColor: "#be1826",
                  flexShrink: 0,
                  opacity: hoveredItem === item.label ? 1 : 0,
                  transform: hoveredItem === item.label ? "scale(1)" : "scale(0)",
                  transition: "opacity 0.2s ease, transform 0.2s ease",
                }} />
                <span style={{
                  fontFamily: "'Clash Display', sans-serif",
                  fontWeight: 600,
                  fontSize: "clamp(26px, 5vw, 36px)",
                  letterSpacing: "-0.01em",
                  color: hoveredItem === item.label ? "#fff" : "rgba(255,255,255,0.55)",
                  transition: "color 0.2s ease",
                  lineHeight: 1,
                }}>
                  {item.label}
                </span>
              </button>
            </div>
          ))}
        </nav>

        {/* ── FOOTER ── */}
        <div style={{
          padding: "32px 32px 36px",
          flexShrink: 0,
          opacity: isOpen ? 1 : 0,
          transition: "opacity 0.5s 0.5s ease",
        }}>
          {/* Thin line */}
          <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.07)", marginBottom: "20px" }} />

          {/* Links — single row */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 20px", marginBottom: "20px" }}>
            {["Terms", "Privacy", "Returns"].map(label => (
              <a key={label} href="#" onClick={e => e.preventDefault()} style={{
                fontFamily: "'Archivo', sans-serif",
                fontSize: "10px", letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.3)", textDecoration: "none",
                textTransform: "uppercase", transition: "color 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
              >{label}</a>
            ))}
          </div>

          {/* Contact */}
          <a href="tel:+2347065772394" style={{
            fontFamily: "'Archivo', sans-serif",
            fontSize: "11px", letterSpacing: "0.06em",
            color: "rgba(255,255,255,0.25)", textDecoration: "none",
            display: "block", transition: "color 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.25)"}
          >
            +234 706 577 2394
          </a>
        </div>
      </div>
    </>
  );
}
