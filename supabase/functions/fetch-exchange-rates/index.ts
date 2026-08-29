// supabase/functions/fetch-exchange-rates/index.ts
//
// Refreshes the exchange_rates table from a free, keyless FX API
// (open.er-api.com — no API key required, updates ~daily on their end).
//
// Run this on a schedule (Supabase Dashboard → Database → Cron Jobs →
// schedule this function, e.g. once a day) so rates stay current without
// anyone having to remember to update them by hand.
//
// Rows with is_manual_override = true are left untouched — if you've set a
// deliberate rate (e.g. to buffer against Naira volatility), this function
// won't overwrite it.
//
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are auto-injected by Supabase.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!res.ok) throw new Error(`FX API error: ${res.status}`);
    const data = await res.json();
    if (data.result !== 'success') throw new Error('FX API returned an unsuccessful result');

    const usdToNgn = data.rates.NGN; // 1 USD = X NGN
    const usdToGbp = data.rates.GBP; // 1 USD = X GBP

    // Convert to "NGN per 1 unit of target currency" — our storage convention
    const rates = {
      USD: usdToNgn,
      GBP: usdToNgn / usdToGbp,
    };

    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('exchange_rates')
      .select('target_currency, is_manual_override');
    if (fetchErr) throw fetchErr;

    const overridden = new Set((existing || []).filter(r => r.is_manual_override).map(r => r.target_currency));

    const updates = [];
    for (const [currency, rate] of Object.entries(rates)) {
      if (overridden.has(currency)) continue; // respect manual overrides
      const { error } = await supabaseAdmin
        .from('exchange_rates')
        .update({ rate: Math.round(rate * 100) / 100, updated_at: new Date().toISOString() })
        .eq('target_currency', currency);
      if (error) throw error;
      updates.push({ currency, rate });
    }

    return new Response(JSON.stringify({ updated: updates, skipped_overrides: [...overridden] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('fetch-exchange-rates error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
