// supabase/functions/unsubscribe/index.ts
//
// One-click unsubscribe target for the "Unsubscribe" link in the new-drop
// email (see supabase/functions/notify-new-arrival/). Returns a plain HTML
// page directly — this is a standalone link, not part of the SPA, so it
// works even with JavaScript disabled and doesn't depend on the app's
// client-side routing.
//
// Link shape: https://<project-ref>.supabase.co/functions/v1/unsubscribe?token=<uuid>
//
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are auto-injected by Supabase.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
);

function page(message) {
  return `
  <html>
    <head><meta charset="utf-8" /><title>SEE.COM</title></head>
    <body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Helvetica,Arial,sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:60px 20px;">
        <tr><td align="center">
          <table role="presentation" width="420" cellpadding="0" cellspacing="0" style="background:#fff;max-width:420px;width:100%;text-align:center;">
            <tr><td style="background:#000;padding:18px 0;">
              <span style="color:#fff;font-size:15px;font-weight:700;letter-spacing:4px;">SEE.COM</span>
            </td></tr>
            <tr><td style="padding:32px 24px;">
              <p style="font-size:14px;color:#333;line-height:1.6;margin:0;">${message}</p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body>
  </html>`;
}

const html = (body, status = 200) =>
  new Response(page(body), { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });

Deno.serve(async (req) => {
  const token = new URL(req.url).searchParams.get('token');
  if (!token) return html("Missing unsubscribe link. Contact SEE.COM if you keep receiving emails you didn't ask for.", 400);

  const { error } = await supabaseAdmin
    .from('subscribers')
    .update({ is_active: false })
    .eq('unsubscribe_token', token);

  // Deliberately return the same success message whether or not a row matched —
  // don't reveal whether a given token/subscription exists.
  if (error) console.error('unsubscribe error:', error);

  return html("You've been unsubscribed from SEE.COM new-drop emails. You won't hear from us again unless you sign up again.");
});
