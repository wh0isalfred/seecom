import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Runs an async fetcher and tracks loading/error/data state.
 *
 * - fetcher should throw on failure (the retry-wrapped product-service
 *   functions already do — see services/products.js + utils/fetchWithRetry.js).
 * - retry() re-runs the fetch — wire it to a "Try Again" button.
 * - Also retries automatically the moment the browser regains connectivity
 *   while in an error state, so a customer who lost signal mid-load doesn't
 *   have to do anything once it's back — the page keeps trying quietly.
 *
 * deps re-triggers the fetch when they change (e.g. a category param).
 */
export function useAsyncFetch(fetcher, deps = []) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [nonce, setNonce]     = useState(0);
  const fetcherRef = useRef(fetcher);
  useEffect(() => { fetcherRef.current = fetcher; });

  const retry = useCallback(() => setNonce(n => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    // Canonical data-fetching effect (fetch + cancellation flag, per React docs'
    // "Fetching data" example) — the set-state-in-effect rule flags this
    // pattern broadly, but this is the sanctioned shape for it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(false);
    fetcherRef.current()
      .then(result => { if (!cancelled) setData(result); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  useEffect(() => {
    if (!error) return;
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, [error, retry]);

  return { data, loading, error, retry };
}
