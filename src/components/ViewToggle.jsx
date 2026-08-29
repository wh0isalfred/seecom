import { useState, useRef, useEffect } from 'react';
import { useCurrency, CURRENCY_SYMBOLS } from '../contexts/CurrencyContext';

const SHIRT_PATH = "M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z";
const CURRENCIES = ['NGN', 'USD', 'GBP'];

/**
 * The shirt/currency price toggle shown on every product-listing page.
 * Hovering (or tapping, on touch) the currency side reveals a small glassy
 * bubble cluster to pick NGN/USD/GBP directly, instead of only reaching the
 * switcher buried in the sidebar.
 */
export default function ViewToggle({ showPrice, setShowPrice, size = 'md', dark = false }) {
  const { currency, setCurrency } = useCurrency();
  const [bubbleOpen, setBubbleOpen] = useState(false);
  const closeTimer = useRef(null);
  const wrapRef = useRef(null);

  const dim      = size === 'md' ? 32 : 28;
  const shirtIco = size === 'md' ? 16 : 14;
  const moneyIco = size === 'md' ? 14 : 12;

  const borderColor = dark ? 'rgba(255,255,255,0.4)' : '#000';
  const shirtActiveBg   = dark ? 'rgba(255,255,255,0.9)' : '#000';
  const shirtActiveFg   = dark ? '#000' : '#fff';
  const shirtInactiveFg = dark ? 'rgba(255,255,255,0.6)' : '#000';

  const openBubble  = () => { clearTimeout(closeTimer.current); setBubbleOpen(true); };
  const closeBubble = () => { closeTimer.current = setTimeout(() => setBubbleOpen(false), 160); };

  // Close on outside click (covers touch devices, where there's no hover-out)
  useEffect(() => {
    if (!bubbleOpen) return;
    const onClick = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setBubbleOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [bubbleOpen]);

  return (
    <div style={{ display: 'inline-flex', border: `1px solid ${borderColor}`, borderRadius: 24, padding: 4 }}>
      <button onClick={() => setShowPrice(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: dim, height: dim, borderRadius: 20, border: 'none', background: showPrice ? 'transparent' : shirtActiveBg, cursor: 'pointer', color: showPrice ? (dark ? shirtInactiveFg : '#000') : shirtActiveFg, transition: 'all 0.2s' }}>
        <svg width={shirtIco} height={shirtIco} viewBox="0 0 24 24" fill="none"><path d={SHIRT_PATH} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>

      <div
        ref={wrapRef}
        style={{ position: 'relative' }}
        onMouseEnter={openBubble}
        onMouseLeave={closeBubble}
      >
        <button
          onClick={() => { setShowPrice(true); setBubbleOpen(o => !o); }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: dim, height: dim, borderRadius: 20, border: 'none', background: showPrice ? shirtActiveBg : 'transparent', cursor: 'pointer', color: showPrice ? shirtActiveFg : shirtInactiveFg, transition: 'all 0.2s' }}
        >
          <svg width={moneyIco} height={moneyIco} viewBox="0 0 24 24"><text x="12" y="17" textAnchor="middle" fontSize="13" fontWeight="700" fill="currentColor" fontFamily="Arial, Helvetica, sans-serif">{CURRENCY_SYMBOLS[currency]}</text></svg>
        </button>

        {/* Glassy currency bubble cluster */}
        <div style={{
          position: 'absolute', bottom: '120%', left: '50%', transform: `translateX(-50%) translateY(${bubbleOpen ? '0' : '6px'}) scale(${bubbleOpen ? 1 : 0.85})`,
          display: 'flex', gap: 6, padding: 6,
          background: 'rgba(255,255,255,0.35)',
          backdropFilter: 'blur(14px) saturate(180%)',
          WebkitBackdropFilter: 'blur(14px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.55)',
          borderRadius: 24,
          boxShadow: '0 10px 30px rgba(0,0,0,0.15), inset 0 1px 1px rgba(255,255,255,0.7)',
          opacity: bubbleOpen ? 1 : 0,
          pointerEvents: bubbleOpen ? 'auto' : 'none',
          transition: 'opacity 0.18s ease, transform 0.18s ease',
          zIndex: 20,
        }}>
          {CURRENCIES.map(code => (
            <button
              key={code}
              onClick={() => { setCurrency(code); setShowPrice(true); setBubbleOpen(false); }}
              style={{
                width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: currency === code ? 'rgba(0,0,0,0.82)' : 'rgba(255,255,255,0.55)',
                color: currency === code ? '#fff' : '#000',
                boxShadow: currency === code
                  ? 'inset 0 1px 2px rgba(255,255,255,0.3)'
                  : '0 1px 4px rgba(0,0,0,0.08), inset 0 1px 1px rgba(255,255,255,0.8)',
                fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 700, fontSize: 13,
                transition: 'background 0.15s, transform 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {CURRENCY_SYMBOLS[code]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
