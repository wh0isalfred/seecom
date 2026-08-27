// supabase/functions/notify-new-arrival/index.ts
//
// Triggered from the client (see src/services/adminService.js -> notifyNewArrival)
// whenever a product is flagged as a new arrival — either via the "New Arrival"
// toggle in the admin panel, or on initial product creation.
//
// Fetches the product + the active subscriber list, then sends a branded
// "new drop" email to every subscriber via Resend.
//
// ── Required secrets (set with `supabase secrets set KEY=value`) ───────────
//   RESEND_API_KEY   — API key from https://resend.com
//   RESEND_FROM       — verified sender, e.g. "SEE.COM <drops@yourdomain.com>"
//   SITE_URL          — e.g. https://seecom.vercel.app (defaults to that if unset)
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected by Supabase —
// no need to set those yourself. The service role key is required here
// specifically so this function can read the subscribers table, which is
// locked down from the client (INSERT-only) by RLS.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_FROM    = Deno.env.get('RESEND_FROM') || 'SEE.COM <drops@see.com>';
const SITE_URL       = Deno.env.get('SITE_URL') || 'https://seecom.vercel.app';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const fmtNaira = (n) => `₦${Number(n).toLocaleString('en-NG')}`;

function buildEmailHtml(product) {
  const price = product.discount_price
    ? `<span style="text-decoration:line-through;color:#999;margin-right:8px;">${fmtNaira(product.price)}</span><span style="color:#be1826;font-weight:700;">${fmtNaira(product.discount_price)}</span>`
    : `<span style="font-weight:700;">${fmtNaira(product.price)}</span>`;

  return `
  <html>
    <body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Helvetica,Arial,sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:32px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;max-width:480px;width:100%;">

              <!-- Header -->
              <tr>
                <td style="background-color:#000000;padding:20px 0;text-align:center;">
                  <span style="color:#ffffff;font-size:16px;font-weight:700;letter-spacing:4px;">SEE.COM</span>
                </td>
              </tr>

              <!-- Badge -->
              <tr>
                <td style="padding:24px 24px 0;text-align:center;">
                  <span style="background-color:#be1826;color:#ffffff;font-size:10px;font-weight:700;letter-spacing:2px;padding:6px 12px;display:inline-block;">NEW DROP</span>
                </td>
              </tr>

              <!-- Product image -->
              ${product.image_1 ? `
              <tr>
                <td style="padding:20px 24px 0;">
                  <img src="${product.image_1}" alt="${product.name}" width="432" style="width:100%;height:auto;display:block;border:1px solid #f0f0f0;" />
                </td>
              </tr>` : ''}

              <!-- Product info -->
              <tr>
                <td style="padding:20px 24px 8px;text-align:center;">
                  <div style="font-size:20px;font-weight:600;color:#000000;letter-spacing:0.5px;margin-bottom:8px;">
                    ${product.name}
                  </div>
                  <div style="font-size:14px;">${price}</div>
                </td>
              </tr>

              <!-- CTA -->
              <tr>
                <td style="padding:16px 24px 32px;text-align:center;">
                  <a href="${SITE_URL}" style="display:inline-block;background-color:#000000;color:#ffffff;text-decoration:none;font-size:11px;font-weight:700;letter-spacing:2px;padding:14px 32px;">
                    SHOP NOW
                  </a>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="border-top:1px solid #f0f0f0;padding:20px 24px;text-align:center;">
                  <div style="font-size:10px;color:#999999;letter-spacing:0.5px;">
                    Limited drops. No restocks.<br/>
                    SEE.COM · Abuja, Nigeria
                  </div>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
}

async function sendEmail(to, html, subject) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: RESEND_FROM, to, subject, html }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error (${res.status}): ${body}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY is not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { productId } = await req.json();
    if (!productId) throw new Error('productId is required');

    const { data: product, error: productErr } = await supabaseAdmin
      .from('products')
      .select('id, name, price, discount_price, image_1')
      .eq('id', productId)
      .single();
    if (productErr) throw productErr;

    const { data: subscribers, error: subErr } = await supabaseAdmin
      .from('subscribers')
      .select('email')
      .eq('is_active', true);
    if (subErr) throw subErr;

    if (!subscribers?.length) {
      return new Response(JSON.stringify({ sent: 0, message: 'No active subscribers' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const html    = buildEmailHtml(product);
    const subject = `New drop: ${product.name}`;

    // Send in small batches so one bad address doesn't block the rest
    const BATCH_SIZE = 40;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((s) => sendEmail(s.email, html, subject))
      );
      results.forEach((r) => (r.status === 'fulfilled' ? sent++ : failed++));
    }

    return new Response(JSON.stringify({ sent, failed, total: subscribers.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('notify-new-arrival error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
