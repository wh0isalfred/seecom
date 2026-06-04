# SEE.COM — Nigerian Streetwear E-Commerce

> **Limited drops. No restocks. Streetwear from Abuja.**

A full-stack, production-grade e-commerce platform built for a Nigerian streetwear brand. Designed and engineered from the ground up — every pixel, every query, every interaction.

---

## Live

**[seecom.vercel.app](https://seecom.vercel.app)**

---

## Overview

SEE.COM is a premium streetwear brand based in Abuja, Nigeria. This platform handles the full commerce lifecycle — product discovery, cart management, Paystack-powered checkout, order tracking, and an internal admin panel for delivery management.

The product was built with a clear design philosophy: **zero cognitive load**. Every interaction is guided. Every transition is intentional. The site is optimised for mobile-first usage, where the majority of Nigerian consumers shop.

---

## Technical Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 8 (Rolldown) |
| Styling | Inline styles + Tailwind CSS |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth |
| Payments | Paystack |
| 3D Landing | Three.js + GLTFLoader |
| Fonts | Clash Display (self-hosted), Space Grotesk, Archivo |
| Deployment | Vercel |

---

## Features

### Storefront
- Immersive 3D landing page with a custom GLB model, mouse/touch rotation, idle animation, and spatial audio
- Full product catalogue with category filtering (T-Shirts, Chains, Shop All)
- Portrait `3/4` product cards with swipe-to-cycle images, hover scale, and fixed-height info zone (no layout shift)
- Price and name visibility toggle — editorial browsing mode
- Product detail page with size/color accordion, OOS detection per SKU, size guide modal, trust signals (delivery estimates, returns policy, WhatsApp contact)

### Cart & Checkout
- Guest cart persisted via `localStorage` with `guestOrderIds` recovery key
- Logged-in cart synced to Supabase in real-time across all devices with 800ms debounce
- Cart merge on login — local and remote reconciled, higher quantity wins
- Paystack inline checkout with CSP-compliant Vercel headers
- Order creation with inventory reduction, order items, and Paystack reference tracking
- `Promise.race` timeout guard on order creation — no silent infinite hangs

### Auth
- Email/password auth via Supabase
- Instant sign-out — state cleared before network call, `sb-*` localStorage keys hard-cleared
- Admin role via `profiles` table

### Order Tracking
- Full delivery status flow: `Pending → Confirmed → Processing → Shipped → Out for Delivery → Delivered`
- Customer-facing "Confirm Received" and "Report Issue" buttons appear on `Shipped`/`Out for Delivery`
- Issue reporting locks admin from marking `Delivered` directly — must re-ship first
- Auto-close grace window: Abuja 5 days, other states 8 days
- Pending orders loaded live from Supabase for logged-in users — cross-device

### Admin Panel
- Orders tab: live status flow, tracking input, risk indicator (days since shipped vs SLA), delivery progress stepper
- Investigating orders: direct WhatsApp link to customer, blocked from marking delivered
- Inventory tab: per-SKU stock editing, OOS/Low badges, product-grouped
- Products tab: inline edit (name, price, discount, description), new arrival toggle, global discount control

### Performance
- `React.lazy` + `Suspense` for all pages — Three.js only downloads when landing is visited
- Vite `manualChunks` function (Rolldown-compatible) — Three.js, React, Supabase in separate cached chunks
- Supabase connection warmup on mount — eliminates cold-start latency on first query
- Supabase image transforms — WebP, width-capped, quality-controlled per context (thumb/detail/hero)
- `<link rel="preconnect">` to Supabase and Google Fonts in `index.html`
- Clash Display fonts preloaded as `woff2`

---

## Architecture Decisions

### `auth.lock` Override
Supabase's internal `navigator.locks` API hangs indefinitely in Vite's dev server environment, silently preventing all queries from resolving. The `createClient` lock is overridden with `async (_name, _timeout, fn) => await fn()` — bypassing the native lock while preserving async correctness. The `await` is non-negotiable: without it, the lock releases before the query resolves.

### Cart Sync Strategy
Guest cart lives in `localStorage`. On login, remote cart is fetched, merged with local (higher quantity wins), and localStorage is cleared. A `cartReady` ref prevents outbound Supabase writes before the inbound load completes — closing the race condition that would silently delete remote cart data on reload.

### Order Creation
`.single()` is intentionally omitted after INSERT. In Supabase v2, `.single()` on a result with zero rows throws a `PGRST116` error that was being swallowed by the CSP layer on Vercel — causing a silent infinite hang. `.select()` + manual index `[0]` gives predictable, debuggable behaviour.

### CSP on Vercel
Paystack checkout renders as a cross-origin iframe. Vercel's default headers block this. `vercel.json` explicitly allows `frame-src https://*.paystack.co` and sets `Cross-Origin-Opener-Policy: same-origin-allow-popups` so the payment callback can return to the app.

---

## Project Structure

```
src/
├── assets/           # GLB model, images, fonts
├── audio.js          # Audio singleton — MediaSession, stop on navigation
├── components/
│   ├── Landing.jsx   # Three.js scene, touch rotation, music control
│   ├── Sidebar.jsx   # Red strip nav, dark expanded panel, stagger animation
│   ├── ProductCard.jsx
│   ├── AuthModal.jsx
│   └── Footer.jsx
├── contexts/
│   ├── AuthContext.jsx
│   └── DiscountContext.jsx
├── pages/
│   ├── HomePage.jsx
│   ├── ShopPage.jsx
│   ├── TshirtsPage.jsx
│   ├── ChainsPage.jsx
│   ├── ProductDetailPage.jsx
│   ├── CartPage.jsx
│   ├── CheckoutPage.jsx
│   └── AdminPage.jsx
├── services/
│   ├── supabase.js
│   ├── products.js
│   ├── auth.js
│   ├── cartService.js
│   ├── checkoutService.js
│   └── adminService.js
└── utils/
    ├── responsiveGrid.js
    ├── discountUtils.js
    └── imageUtils.js
```

---

## Database Schema (Supabase)

```sql
products          — id, name, category, price, discount_price, sizes[], colors[],
                    image_1..4, is_new_arrival, description

product_inventory — id, product_id, size, color, stock_quantity

orders            — id, order_number, customer_*, shipping_*, total, subtotal,
                    shipping_cost, order_status, payment_status, paystack_reference,
                    shipped_at, out_for_delivery_at, delivered_at,
                    customer_confirmed_at, issue_reported_at, tracking_number, carrier

order_items       — id, order_id, product_id, product_name, size, color,
                    quantity, price_per_item, total_price

cart_items        — id, user_id, product_id, name, price, size, color, quantity

profiles          — id, email, role (admin | customer)

settings          — key, value (JSONB) — global_discount config
```

---

## Local Development

```bash
git clone https://github.com/wh0isalfred/seecom
cd seecom
npm install
```

Create `.env`:
```
VITE_SUPABASE_URL=.....
VITE_SUPABASE_ANON_KEY=....
VITE_PAYSTACK_PUBLIC_KEY=pk_test_...
```

```bash
npm run dev
```

---

## Deployment

```bash
npm run build
```

Deployed via Vercel with environment variables set in the dashboard. `vercel.json` configures CSP headers for Paystack and Supabase.

---

## Design System

| Token | Value |
|---|---|
| Primary Red | `#be1826` |
| Black | `#000000` |
| Dark panel | `#0f0f0f` |
| Background | `#ffffff` |
| Heading font | Clash Display 600 |
| Body font | Archivo 400 |
| UI font | Space Grotesk 700 |

**Red is reserved exclusively for actions and alerts** — add to bag, pay, discounts, out of stock, cart count, report issue. Not decoration.

---

## Engineer

**Alfred Enyinna (ME)**

[GitHub](https://github.com/wh0isalfred) · [LinkedIn](https://linkedin.com/in/yourhandle)

---

*Built in public. Shipped to real customers. Designed to last.*
