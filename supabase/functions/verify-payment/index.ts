// supabase/functions/verify-payment/index.ts
//
// The checkout page's payment callback runs entirely in the customer's
// browser — it says "the payment succeeded" because that's what the
// provider's client-side widget told it. Nothing stops a manipulated
// browser from faking that callback. This function closes that gap: before
// an order is created, the client calls this function, which independently
// asks Paystack/Flutterwave's server-side API "did this reference actually
// get paid, for this amount, in this currency?" using the account's SECRET
// key (never exposed to the browser). Only a true "yes" from the provider
// itself is trusted.
//
// ── Required secrets (set with `supabase secrets set KEY=value`) ───────────
//   PAYSTACK_SECRET_KEY      — from Paystack dashboard → Settings → API Keys
//   FLUTTERWAVE_SECRET_KEY   — from Flutterwave dashboard → Settings → API

const PAYSTACK_SECRET_KEY    = Deno.env.get('PAYSTACK_SECRET_KEY');
const FLUTTERWAVE_SECRET_KEY = Deno.env.get('FLUTTERWAVE_SECRET_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Amounts are floats from currency conversion — allow a tiny tolerance
// instead of requiring an exact match, which floating point can't guarantee.
const AMOUNT_TOLERANCE = 0.51;

async function verifyPaystack(reference, expectedAmount, expectedCurrency) {
  if (!PAYSTACK_SECRET_KEY) return { verified: false, reason: 'PAYSTACK_SECRET_KEY is not configured' };

  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
  });
  const body = await res.json();

  if (!res.ok || !body?.data) return { verified: false, reason: 'Paystack could not find this transaction' };

  const tx = body.data;
  const paidAmount = tx.amount / 100; // kobo -> naira

  if (tx.status !== 'success') return { verified: false, reason: `Paystack status: ${tx.status}` };
  if (tx.currency !== expectedCurrency) return { verified: false, reason: 'Currency mismatch' };
  if (Math.abs(paidAmount - expectedAmount) > AMOUNT_TOLERANCE) return { verified: false, reason: 'Amount mismatch' };

  return { verified: true, paidAmount, currency: tx.currency };
}

async function verifyFlutterwave(reference, expectedAmount, expectedCurrency) {
  if (!FLUTTERWAVE_SECRET_KEY) return { verified: false, reason: 'FLUTTERWAVE_SECRET_KEY is not configured' };

  const res = await fetch(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}` },
  });
  const body = await res.json();

  if (!res.ok || body?.status !== 'success' || !body?.data) {
    return { verified: false, reason: 'Flutterwave could not find this transaction' };
  }

  const tx = body.data;

  if (tx.status !== 'successful') return { verified: false, reason: `Flutterwave status: ${tx.status}` };
  if (tx.currency !== expectedCurrency) return { verified: false, reason: 'Currency mismatch' };
  if (Math.abs(tx.amount - expectedAmount) > AMOUNT_TOLERANCE) return { verified: false, reason: 'Amount mismatch' };

  return { verified: true, paidAmount: tx.amount, currency: tx.currency };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { provider, reference, expectedAmount, expectedCurrency } = await req.json();

    if (!provider || !reference || expectedAmount == null || !expectedCurrency) {
      return new Response(JSON.stringify({ verified: false, reason: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = provider === 'flutterwave'
      ? await verifyFlutterwave(reference, expectedAmount, expectedCurrency)
      : await verifyPaystack(reference, expectedAmount, expectedCurrency);

    return new Response(JSON.stringify(result), {
      status: result.verified ? 200 : 402,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('verify-payment error:', err);
    return new Response(JSON.stringify({ verified: false, reason: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
