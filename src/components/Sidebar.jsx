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
  const [openIndex, setOpenIndex] = useState(null);
  const [stripHeight, setStripHeight] = useState("85dvh");
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const menuItems = isAdmin
    ? [...BASE_MENU_ITEMS, ADMIN_MENU_ITEM]
    : BASE_MENU_ITEMS;

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const heroHeight = window.innerHeight * 0.9;
      const halfHeroHeight = heroHeight * 0.5;

      if (scrollY < halfHeroHeight) {
        setStripHeight("85dvh");
      } else if (scrollY >= heroHeight) {
        setStripHeight("100dvh");
      } else {
        const scrollRange = heroHeight - halfHeroHeight;
        const scrollProgress = (scrollY - halfHeroHeight) / scrollRange;
        const heightValue = 85 + scrollProgress * 10;
        setStripHeight(`${heightValue}dvh`);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleToggle = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <>
      {/* Collapsed Red Strip */}
      {!isOpen && (
        <div
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            width: "40px",
            height: stripHeight,
            backgroundColor: "#be1826",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: "16px",
            paddingBottom: "16px",
            zIndex: 9999,
            overflow: "hidden",
            transition: "height 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* Cart icon */}
          <button
            onClick={() => onNavigate?.("cart")}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <BagIcon count={cartCount} />
          </button>

          {/* Plus icon - open sidebar */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <button
              onClick={() => onClose?.(true)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#000" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Overlay */}
      <div
        onClick={() => onClose?.(false)}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.3)",
          zIndex: 99998,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.4s ease",
        }}
      />

      {/* Expanded Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "min(480px, 90vw)",
          height: "100dvh",
          backgroundColor: "#be1826",
          zIndex: 99999,
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.45s cubic-bezier(0.35, 0, 0.15, 1)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          overflowX: "hidden",
          boxSizing: "border-box",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 28px",
          }}
        >
          {/* Logo */}
          <button
            onClick={() => { onNavigate?.("home"); onClose?.(false); }}
            style={{
              fontFamily: "'Clash Display', sans-serif",
              fontWeight: 600,
              fontSize: "18px",
              color: "#000",
              letterSpacing: "0.22em",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            SEE.COM
          </button>

          {/* Icons right */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", position: "relative" }}>
            {/* Account icon */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => {
                  if (user) {
                    setShowAccountMenu((v) => !v);
                  } else {
                    onClose?.(false);
                    onOpenAuth?.();
                  }
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "2px",
                  display: "flex",
                  alignItems: "center",
                  position: "relative",
                }}
                title={user ? user.email : "Log in"}
              >
                <UserIcon filled={!!user} />
                {/* Green dot if logged in */}
                {user && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: 2,
                      right: 2,
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      backgroundColor: "#16a34a",
                      border: "1.5px solid #be1826",
                    }}
                  />
                )}
              </button>

              {/* Account dropdown */}
              {showAccountMenu && user && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 10px)",
                    right: 0,
                    minWidth: "180px",
                    backgroundColor: "#fff",
                    border: "1px solid rgba(0,0,0,0.1)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                    zIndex: 100001,
                    padding: "8px 0",
                  }}
                >
                  <div
                    style={{
                      padding: "10px 16px 8px",
                      fontFamily: "'Archivo', Helvetica, Arial, sans-serif",
                      fontSize: "11px",
                      color: "#666",
                      letterSpacing: "0.04em",
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    {user.email}
                    {isAdmin && (
                      <span
                        style={{
                          display: "block",
                          marginTop: "3px",
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontWeight: 700,
                          fontSize: "9px",
                          letterSpacing: "0.1em",
                          color: "#be1826",
                        }}
                      >
                        ADMIN
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setShowAccountMenu(false);
                      onSignOut?.();
                      onClose?.(false);
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "10px 16px",
                      fontFamily: "'Archivo', Helvetica, Arial, sans-serif",
                      fontSize: "12px",
                      letterSpacing: "0.06em",
                      color: "#000",
                      background: "none",
                      border: "none",
                      textAlign: "left",
                      cursor: "pointer",
                      textTransform: "uppercase",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>

            {/* Cart icon */}
            <button
              onClick={() => { onNavigate?.("cart"); onClose?.(false); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center" }}
            >
              <BagIcon count={cartCount} />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "rgba(0,0,0,0.12)", margin: "0 28px" }} />

        {/* Nav items */}
        <nav style={{ padding: "8px 28px 0", flex: 1 }}>
          {menuItems.map((item, idx) => (
            <AccordionItem
              key={item.label}
              item={item}
              isOpen={openIndex === idx}
              onToggle={() => handleToggle(idx)}
              onNavigate={(category) => {
                onNavigate?.(category);
                onClose?.(false);
              }}
            />
          ))}
        </nav>

        {/* Footer links */}
        <div
          style={{
            padding: "24px 28px 32px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "6px 16px",
            borderTop: "1px solid rgba(0,0,0,0.12)",
            marginTop: "auto",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {footerLinks.left.map((link) => (
              <a
                key={link}
                href="#"
                onClick={(e) => e.preventDefault()}
                style={{
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  fontWeight: "700",
                  fontSize: "11px",
                  letterSpacing: "0.06em",
                  color: "#000",
                  textDecoration: "none",
                  lineHeight: 1.6,
                  cursor: "pointer",
                }}
              >
                {link}
              </a>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {footerLinks.right.map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                target={link.href.startsWith("tel:") ? undefined : "_blank"}
                rel={link.href.startsWith("tel:") ? undefined : "noopener noreferrer"}
                style={{
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  fontWeight: link.isBold ? "700" : "400",
                  fontSize: "11px",
                  letterSpacing: link.isBold ? "0.06em" : "0.02em",
                  color: "#000",
                  textDecoration: "none",
                  lineHeight: 1.6,
                  cursor: "pointer",
                }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={() => onClose?.(false)}
          style={{
            position: "absolute",
            top: "50%",
            right: "-20px",
            transform: "translateY(-50%)",
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: "rgba(0, 0, 0, 0.15)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.2s ease",
            zIndex: 100000,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0, 0, 0, 0.25)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0, 0, 0, 0.15)"; }}
        >
          <CloseIcon />
        </button>
      </div>
    </>
  );
}
