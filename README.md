# Sile Communications — Frontend (Comprehensive Documentation)

Maintainer: conradalumasi  
Last updated: 2026-09-06

Summary
-------
This repository contains the static frontend for Sile Communications — a responsive storefront and light admin UI used by the Kitale electronics shop. The site is a mobile-first, plain HTML/CSS/vanilla-JavaScript app that talks to a separate backend API for data (products, accounts, orders, payments). The frontend focuses on fast client rendering, offline-friendly product caching, and a simple checkout flow that delegates payments and order processing to the backend.

Quick links
----------
- Live/production API base referenced in code: https://sile-backend.onrender.com/api
- Runtime public Paystack key (in repo, client-side): window.PAYSTACK_PUBLIC_KEY (see `js/config.js`).

Contents
--------
- Features (core user-facing & admin)
- Architecture & runtime diagram
- Tech stack and key libraries
- How it is organized (repo layout)
- Client runtime: data flow, storage keys, events
- API surface (endpoints used by frontend, expected payloads & responses)
- Database schema (recommended/observed tables)
- External services & integrations
- Run locally / deployment notes / Netlify
- Security, secrets, and recommended hardening
- Troubleshooting & TODOs

Features (core)
---------------
- Responsive storefront and product catalog (categories, brand filters).
- Product detail pages, product lists, related items, search.
- Cart (modal + page), cart persistence to localStorage, quantity updates.
- Checkout page with delivery estimate, order placement, Paystack payment initialization.
- Customer account area: profile, orders, wishlist UI, profile picture upload (client-side).
- Wishlist persisted in client.
- Light-weight static admin pages (admin/login.html, admin/dashboard.html) that expect backend admin endpoints.
- Client-side product caching (localStorage key `sile_products`) for fast startup and offline display.
- Mobile-first navigation drawer, accessible controls (aria attributes included where present).
- Netlify-ready routing and security headers (netlify.toml and _redirects included).

Architecture & runtime diagram
------------------------------
High-level: static frontend (Netlify / any static host) <--> backend API (HTTPS) <--> external services (payments, email, M-PESA)

ASCII diagram:

Browser / Client
  - Static assets (index.html, pages, css/, js/, images/)
  - Local state: localStorage (sile_products, sileCart, authToken, user, wishlist)
  - Modules: js/config.js, js/products.js, js/cart.js, js/checkout.js, js/account.js, js/nav.js
      |
      |  HTTPS requests (fetch)
      V
Backend API (example base: https://sile-backend.onrender.com/api)
  - /products
  - /auth/*
  - /orders
  - /orders/delivery-estimate
  - /payments/initialize
      |
      | Integrations
      V
External services
  - Paystack (online card payments)
  - M-PESA (via backend for payment verification / settlement)
  - Netlify (hosting + redirects + headers) or other static host

How it fits together (runtime)
-----------------------------
- `js/config.js` runs early on load:
  - Chooses API base (local vs production).
  - Hydrates product cache from localStorage (`sile_products`) to render instantly.
  - Fetches fresh products from `${API_BASE}/products`, normalizes them, stores them to localStorage.
  - Exposes global collections: `window.PRODUCTS`, `FEATURED_PRODUCTS`, `BEST_SELLING_PHONES`, `TOP_LAPTOPS`.
  - Dispatches `productsLoaded` event after fetch/normalize.

- UI modules read from `window.PRODUCTS` and client storage:
  - `js/products.js` renders category and search pages.
  - `js/cart.js` manages cart UI and `sileCart` localStorage.
  - `js/checkout.js` prepares order payloads and calls backend order endpoints; initializes Paystack flow by redirect authorization URL returned by backend.
  - `js/account.js` handles profile and orders (uses `authToken` & `user` in localStorage).
  - `admin/*.html` pages perform admin login flows and expect admin token storage (`adminToken`, `adminUser`).

Repository structure (top-level)
-------------------------------
```
README.md
index.html
about.html, contact.html, category.html, product.html, product-detail.html, cart.html, checkout.html, order-success.html, login.html, account.html, wishlist.html, ...
admin/                       # static admin pages (login, dashboard)
css/                         # styles (css/style.css main)
images/                      # product images, logos
js/                          # frontend scripts (config.js, products.js, cart.js, checkout.js, account.js, nav.js, etc.)
netlify.toml                 # Netlify headers & config
_redirects                   # SPA fallback (Netlify)
.gitignore
small helper scripts (*.py)  # development helpers (not runtime)
```

Stack
-----
- Languages: HTML, CSS, vanilla JavaScript (ES6+)
- Runtime: Static site served from a static host (Netlify recommended)
- Notable libraries / third-party assets:
  - Font Awesome (icons)
  - Google Fonts
  - Paystack (payments; backend + frontend usage)
- No build step — files are served directly.

Client-side storage & events
----------------------------
Persistent keys (localStorage):
- `sile_products` — cached normalized product array (JSON)
- `sileCart` — cart contents array (JSON)
- `authToken` or `token` — Bearer token for user-authenticated API calls
- `user` — authenticated user object (JSON)
- `wishlist` — ids for wishlist (handled by js/wishlist.js)
- `adminToken`, `adminUser`, `adminLoggedIn` — admin session store (admin area)
Ephemeral:
- `sileLastOrder` (sessionStorage) — last placed order session summary
- `silePaymentRef` (sessionStorage) — payment reference used during redirect to Paystack
Event:
- `productsLoaded` — dispatched after fetchProducts finishes and populates `PRODUCTS`.

API surface (frontend-visible)
------------------------------
Base: `${API_BASE}` where `API_BASE` is chosen in `js/config.js`:
- Local development: http://localhost:5000/api
- Production: https://sile-backend.onrender.com/api

Endpoints the frontend calls (inferred from code):

1) GET /products
- Purpose: fetch list of products for catalog & caches
- Request: GET
- Response: JSON array of product objects
- Example product fields (frontend expects / normalizes):
  - id, name, brand, price, old_price (or oldPrice), category (slug), brand_cat, image, is_hot, is_offer, desc/description, specs, slug, categoryId, image1 (variants seen in rendering code)

2) POST /auth/login
- Purpose: user or admin login
- Request body: { email, password }
- Response: { token, user } on success
- Admin login uses same endpoint in admin/login.html; `data.user.role` expected to include `"admin"`.

3) GET /auth/me
- Purpose: fetch details of currently-authenticated user
- Headers: Authorization: Bearer <token>
- Response: user object

4) PUT /auth/profile
- Purpose: update user profile (profile details)
- Request body: { firstName, lastName, phone, ... }
- Headers: Authorization: Bearer <token>
- Response: updated user object (or minimal success result)

5) PUT /auth/password
- Purpose: change password
- Request body: { currentPassword, newPassword }
- Headers: Authorization: Bearer <token>

6) GET /orders
- Purpose: fetch orders for current user (used by account.js)
- Headers: Authorization: Bearer <token>
- Response: array of order objects with fields: order_number, created_at, status, total, items[], delivery_option, payment_method

7) POST /orders
- Purpose: create a new order (checkout)
- Request body example (from checkout.js):
{
  customer: { firstName, lastName, phone, email, town, area },
  delivery: { option: 'kitale_cbd' | 'outside_kitale', area },
  paymentMethod: 'paystack' | 'cod' | 'mpesa' (frontend primarily expects 'paystack' or pay on delivery),
  paymentLabel: string,
  notes: string,
  items: [{ productId, name, price, quantity, subtotal }, ...],
  total: numeric
}
- Response: 200 OK with created order details OR 201 with order + metadata used by checkout flow (orderNumber, order, possibly payment instructions)

8) POST /orders/delivery-estimate
- Purpose: calculate shipping fee based on area/option
- Request body: { option: 'kitale_cbd' | 'outside_kitale', area: '...' }
- Response: { option, label, area, fee } (checkout.js expects fee and label)

9) POST /payments/initialize
- Purpose: initialize Paystack payment and receive authorization URL
- Request body: { orderNumber: string } (checkout.js sends orderNumber)
- Response: { authorization_url, reference } where authorization_url is used to redirect the user to Paystack

Notes:
- The frontend code falls back to local-only behavior if backend endpoints are unreachable (optimistic UI & local storage updates).
- Some endpoints may require different auth headers or admin tokens for admin pages; admin login stores adminToken / adminUser in localStorage.

Backend contract examples (response shapes)
------------------------------------------
- Product item (normalized):
{
  id: 123,
  name: "Product name",
  brand: "Brand",
  price: 25999,
  old_price: 29999,
  category: "smartphones",
  brand_cat: "brand_category",
  image: "images/phone.jpg",
  is_hot: true,
  is_offer: false,
  desc: "Product description",
  specs: "Technical specs"
}

- Order (created):
{
  orderNumber: "SILE-20260906-0001",
  order: {
    status: "pending", // or pending_payment, completed, cancelled, ...
    delivery: { fee: 200, option: "outside_kitale", area: "Nairobi" },
    total: 35000,
    items: [ ... ],
    created_at: "2026-09-06T12:34:56Z"
  }
}

Database schema (recommended / inferred)
----------------------------------------
Below are schema definitions matching the fields the frontend expects and common ecommerce semantics. Use as a starting point for the backend database.

SQL (Postgres-style):

-- products
CREATE TABLE products (
  id             SERIAL PRIMARY KEY,
  name           TEXT NOT NULL,
  slug           TEXT UNIQUE,
  brand          TEXT,
  brand_cat      TEXT,
  category       TEXT,
  category_id    INTEGER,
  price          NUMERIC(12,2) NOT NULL DEFAULT 0,
  old_price      NUMERIC(12,2),
  is_hot         BOOLEAN DEFAULT FALSE,
  is_offer       BOOLEAN DEFAULT FALSE,
  image          TEXT,
  images         JSONB,           -- optional extra images
  description    TEXT,
  specs          JSONB,
  stock_qty      INTEGER DEFAULT 0,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- users
CREATE TABLE users (
  id                 SERIAL PRIMARY KEY,
  email              TEXT UNIQUE NOT NULL,
  password_hash      TEXT,
  first_name         TEXT,
  last_name          TEXT,
  phone              TEXT,
  role               TEXT DEFAULT 'customer', -- 'customer' | 'admin'
  profile_image      TEXT,
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications   BOOLEAN DEFAULT TRUE,
  created_at         TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at         TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- orders
CREATE TABLE orders (
  id             SERIAL PRIMARY KEY,
  order_number   TEXT UNIQUE NOT NULL,
  user_id        INTEGER REFERENCES users(id) NULL,
  customer_json  JSONB NOT NULL, -- stores customer snapshot {firstName,lastName,email,phone,town,area}
  delivery_json  JSONB,          -- { option, area, fee, label }
  payment_method TEXT,
  payment_ref    TEXT,
  status         TEXT DEFAULT 'pending', -- pending, pending_payment, paid, fulfilled, cancelled
  subtotal       NUMERIC(12,2) NOT NULL DEFAULT 0,
  delivery_fee   NUMERIC(12,2) DEFAULT 0,
  total          NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes          TEXT,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- order_items
CREATE TABLE order_items (
  id         SERIAL PRIMARY KEY,
  order_id   INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  product_name TEXT,
  price      NUMERIC(12,2),
  quantity   INTEGER,
  subtotal   NUMERIC(12,2)
);

-- wishlist (optional)
CREATE TABLE wishlists (
  id      SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  product_id INTEGER REFERENCES products(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

External services & integrations
--------------------------------
- Paystack: used for card payments. Frontend only handles initialization redirect; server must use Paystack secret key to create charges, verify webhooks and finalize payment status. The public key in `js/config.js` is safe to expose (client-side).
- M-PESA / Safaricom services: shown in UI under Safaricom Services. Any M-PESA interactions must be implemented securely on the backend (e.g., STK push, webhook verification).
- Netlify (or other static hosting) for site hosting. `_redirects` provides SPA fallback to avoid 404s on refresh.
- CORS: the backend must allow the frontend origin and permit required headers (Authorization).
- Optional: Databases (Postgres), Object storage for images (S3/MinIO), email provider (SendGrid/SparkPost) for order confirmations.

Admin area
----------
- The admin UI is static under `admin/` and performs login via `/auth/login` then redirects to `dashboard.html`. The admin pages store `adminToken` and `adminUser` in localStorage and expect the backend to enforce role-based access control.
- Admin endpoints and functionality (product management, order management) are backend responsibilities. The frontend admin pages are simple HTML clients and require secure authentication.

Run locally
-----------
No build step — files are static.

Quick local preview:
- Using Python simple server (from repo root):
  - python3 -m http.server 5500
  - Open http://127.0.0.1:5500/index.html

- Using VS Code + Live Server extension:
  - Open folder in VS Code -> Start Live Server on index.html -> Visit: http://127.0.0.1:5500

To enable full functionality (products, auth, orders, payments):
- Run the backend locally and ensure it listens on port 5000 so the frontend auto-picks: `http://localhost:5000/api`.

Deployment (Netlify)
-------------------
- Publish directory: project root
- Build command: none
- Main page: index.html
- Ensure netlify.toml and _redirects are deployed as-is. Confirm backend CORS allows origin of the deployed site.

Security & secrets
------------------
- Never commit private credentials or backend secrets.
- The Paystack public key in `js/config.js` is a public key; keep Paystack secret key only on backend and never in the repo.
- Backend must:
  - Validate and sanitize all incoming order and user data.
  - Verify payment statuses server-side and guard against replay attacks (use payment reference verification).
  - Implement RBAC for admin routes; check admin token on every protected endpoint.
  - Configure CORS to only allow trusted origins.
- Recommended hardening:
  - HSTS header, Content-Security-Policy, X-Frame-Options and other security headers (netlify.toml includes some).
  - Rate limiting on auth and payments endpoints.

Troubleshooting & common issues
-------------------------------
- Products missing:
  - Check network console for fetch to `${API_BASE}/products`.
  - If backend offline, clear `sile_products` in localStorage.
- Payment issues:
  - Ensure backend handles Paystack initialization and returns `authorization_url` and `reference`.
  - Use sandbox Paystack keys for local testing.
- Cart totals wrong:
  - Inspect `sileCart` in localStorage and ensure price fields are numeric.
- 404 on refresh (client-side routes):
  - Ensure `_redirects` fallback to index.html is present on Netlify.

Developer notes & guidelines
----------------------------
- No bundler — edit HTML/CSS/JS directly.
- Keep environment-specific configuration centralized in `js/config.js`.
- When adding images, put them in `images/` and reference via relative paths.
- Events & global variables:
  - `productsLoaded` event is dispatched after product fetch & normalization.
  - Global variables exposed: `window.PRODUCTS`, `window.PAYSTACK_PUBLIC_KEY`, `window.API_BASE`.
- Accessibility:
  - Continue to add ARIA attributes for interactive elements and test keyboard navigation.

Suggested backend responsibilities (not in this repo)
-----------------------------------------------------
- Full API implementation for endpoints listed in "API surface".
- Payment verification, webhook handling for Paystack & M-PESA.
- Admin APIs: product create/update/delete, order management.
- Image storage / CDN and product image URLs.
- Persistent DB with the schema above and background workers for heavy tasks.

Open items / TODOs
------------------
- Add LICENSE (none detected).
- Add automated tests (frontend integration tests or backend API contract tests).
- Accessibility audit and keyboard navigation coverage.
- Wire admin pages to a full-featured admin backend (currently static UI).
- Consider using a small bundler/process to allow modular JS and easier code reuse.

Appendix: Example requests & small usage notes
---------------------------------------------
- Fetch products (client):
  - GET `${API_BASE}/products`
- Admin login (admin page):
  - POST `${API_BASE}/auth/login` { email, password } -> returns token & user
- Place order (frontend checkout):
  - POST `${API_BASE}/orders` with order JSON (see checkout.js for shape)
- Initialize payment:
  - POST `${API_BASE}/payments/initialize` { orderNumber } -> returns { authorization_url, reference }

Contact
-------
For repo-specific questions, open an issue in this repository or contact the owner listed in the site UI (Sile Communications contact details are in the footer).

License
-------
Add appropriate LICENSE file if you plan to open-source the project.

---
