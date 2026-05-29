# SEE.COM

E-commerce storefront for SEE.COM — a Nigerian streetwear and accessories brand. Built with React, Vite, and Supabase.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite |
| Database & Auth | Supabase (PostgreSQL + RLS) |
| Payments | Paystack |
| 3D Landing | Three.js (GLB model) |
| Styling | Inline styles, Space Grotesk + Archivo |
| State | React Context (Auth, Discount) |

---

## Features

**Storefront**
- 3D interactive landing page with ambient music autoplay
- Product grid with infinite scroll, hover image cycling, and swipe support on mobile
- Category pages (T-Shirts, Chains) with gender filters
- Product detail with size/color selection, OOS detection, and red-slash indicators
- Cart with quantity management and free shipping threshold logic
- Mobile-first checkout with Paystack inline payment

**Admin Panel** *(role-gated)*
- Dashboard with revenue stats, order feed, and low-stock alerts
- Order management — status updates, payment confirmation, tracking
- Inventory editor — per-SKU stock control with inline editing
- Product management — create, edit name/price/description, toggle discounts, delete
- Global discount system with per-product override

**Auth**
- Email/password authentication via Supabase Auth
- Role-based access (`user` / `admin`) via `profiles` table
- Auth modal — no dedicated page, drops over any view

---

## Project Structure

```
src/
├── assets/              # GLB model, music, logo
├── components/          # ProductCard, Sidebar, Footer, AuthModal
├── contexts/            # AuthContext, DiscountContext
├── pages/               # Landing, Home, Shop, Cart, Checkout, Admin, Product detail
├── services/            # supabase.js, products.js, auth.js, adminService.js, checkoutService.js
└── utils/               # responsiveGrid.js, discountUtils.js
```

---

## Getting Started

**Prerequisites:** Node 18+, a Supabase project, a Paystack account.

```bash
git clone https://github.com/wh0isalfred/seecom.git
cd seecom
npm install
```

Create `.env` in the project root:

```env
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_PAYSTACK_PUBLIC_KEY=pk_live_...
```

```bash
npm run dev
```

---

## Database Setup

Run the SQL files in order via the Supabase SQL editor:

1. `products` + `product_inventory` tables with RLS
2. `profiles` table (role-based access)
3. `orders` + `order_items` tables
4. `settings` table (global discount)

Full schema is documented in `src/services/adminService.js`.

To grant admin access to an account:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

---
## Payments

Paystack handles all transactions. On payment success, the app:
1. Creates the order in Supabase
2. Reduces inventory per SKU
3. Marks the order as confirmed and paid

---
## Deployment

The app is being hosted on vercel. The url is:-
https://seecom.vercel.app/

```bash
npm run build
```

Set the same environment variables on your hosting platform.

---

## License

Private. All rights reserved — SEE.COM.
