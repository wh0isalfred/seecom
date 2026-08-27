/**
 * Retry an async function with exponential backoff.
 *
 * Built for Supabase reads that gate what a customer can see (products,
 * product detail, inventory) — on shaky mobile connections a single failed
 * request shouldn't be the difference between "showing the shop" and
 * "showing nothing." This keeps trying quietly before giving up.
 *
 * @param {() => Promise<T>} fn      - the thing to retry; should throw on failure
 * @param {number} retries           - additional attempts after the first (default 3 → 4 total tries)
 * @param {number} baseDelayMs       - delay before the 2nd attempt; doubles each retry
 */
export async function withRetry(fn, { retries = 3, baseDelayMs = 600 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, baseDelayMs * 2 ** attempt));
      }
    }
  }
  throw lastErr;
}
