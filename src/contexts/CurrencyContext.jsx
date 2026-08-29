import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabase';

const SYMBOLS = { NGN: '₦', USD: '$', GBP: '£' };
const STORAGE_KEY = 'see_currency';

// Only used on a visitor's very first load, before they've ever picked a
// currency themselves — a manual choice (stored under STORAGE_KEY) always wins.
const COUNTRY_TO_CURRENCY = { NG: 'NGN', US: 'USD', GB: 'GBP' };

const CurrencyContext = createContext({
  currency: 'NGN',
  setCurrency: () => {},
  rates: {},
  ratesLoaded: false,
  convert: (ngn) => ngn,
  formatPrice: (ngn) => `₦${Math.round(ngn).toLocaleString()}`,
});

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved && SYMBOLS[saved] ? saved : 'NGN';
    } catch {
      return 'NGN';
    }
  });
  const [rates, setRates] = useState({});
  const [ratesLoaded, setRatesLoaded] = useState(false);

  useEffect(() => {
    supabase
      .from('exchange_rates')
      .select('target_currency, rate')
      .then(({ data }) => {
        const map = {};
        (data || []).forEach(r => { map[r.target_currency] = Number(r.rate); });
        setRates(map);
        setRatesLoaded(true);
      })
      .catch(() => setRatesLoaded(true));
  }, []);

  // Auto-detect a sensible default currency by IP on first-ever visit only —
  // never runs if the visitor already has a saved preference (a manual pick
  // always wins over a guess, including a later visit after this ran once).
  useEffect(() => {
    let saved;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch { /* ignore */ }
    if (saved) return;

    fetch('https://ipwho.is/')
      .then(res => res.json())
      .then(data => {
        const detected = data?.success !== false ? COUNTRY_TO_CURRENCY[data?.country_code] : null;
        if (detected) {
          setCurrencyState(detected);
          try { localStorage.setItem(STORAGE_KEY, detected); } catch { /* ignore */ }
        }
      })
      .catch(() => { /* silent — falls back to the NGN default already set */ });
  }, []);

  const setCurrency = useCallback((code) => {
    setCurrencyState(code);
    try { localStorage.setItem(STORAGE_KEY, code); } catch { /* ignore */ }
  }, []);

  // rate = NGN per 1 unit of target currency. Convert: foreign = ngn / rate.
  const convert = useCallback((ngnAmount) => {
    if (currency === 'NGN') return ngnAmount;
    const rate = rates[currency];
    if (!rate) return ngnAmount; // rates not loaded yet — fall back to NGN amount
    return ngnAmount / rate;
  }, [currency, rates]);

  const formatPrice = useCallback((ngnAmount) => {
    if (currency === 'NGN' || !rates[currency]) {
      return `₦${Math.round(ngnAmount).toLocaleString()}`;
    }
    const converted = convert(ngnAmount);
    return `${SYMBOLS[currency]}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [currency, rates, convert]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rates, ratesLoaded, convert, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
export const CURRENCY_SYMBOLS = SYMBOLS;
