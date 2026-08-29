import { useState, useEffect } from 'react';

/**
 * True only on devices with real mouse hover (not touch-only, not touch
 * laptops without a mouse attached). Use this to gate hover-only UI so touch
 * users get an always-visible or tap-based equivalent instead of nothing.
 */
export function useHasHover() {
  const [hasHover, setHasHover] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(hover: hover) and (pointer: fine)').matches
      : true
  );

  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const handler = () => setHasHover(mq.matches);
    if (mq.addEventListener) mq.addEventListener('change', handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handler);
      else mq.removeListener(handler);
    };
  }, []);

  return hasHover;
}
