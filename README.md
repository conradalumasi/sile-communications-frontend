# Sile Communications — Frontend

A small, static storefront website for Sile Communications (Kitale) that sells electronics and provides Safaricom services. The app is a plain HTML/CSS/JavaScript static site that talks to a separate backend API for products, accounts, cart/checkout, and orders. It's designed to be hosted on any static host (Netlify is configured) and to work without a build step.

Table of contents
- [Features](#features)
- [Stack](#stack)
- [Repository structure](#repository-structure)
- [How it works (runtime overview)](#how-it-works-runtime-overview)
- [Run locally](#run-locally)
- [Configuration](#configuration)
- [Important files and responsibilities](#important-files-and-responsibilities)
- [Admin area](#admin-area)
- [Storage & client-side data](#storage--client-side-data)
- [Deployment (Netlify)](#deployment-netlify)
- [Troubleshooting & common issues](#troubleshooting--common-issues)
- [Development notes & guidelines](#development-notes--guidelines)
- [Security & secrets](#security--secrets)
- [License & acknowledgements](#license--acknowledgements)

## Features
- Responsive storefront with product grids and categories (smartphones, laptops, accessories, solar, content-creator kits, Kabambe/feature phones).
- Product listing, product detail, cart, wishlist, checkout, and order-success flows.
- Customer account / login pages and light account UI in header.
- Admin HTML pages (simple dashboard + login) in the `admin/` folder.
- Mobile-first navigation drawer with dropdowns.
- Client-side product caching (localStorage) for faster page loads.
- Safaricom services section and Lipa Mdogo Mdogo (installment) marketing flows.
- Cart modal overlay, cart page, and checkout page with Paystack integration (public key injected client-side).
- Netlify-friendly routing (_redirects) and security headers (netlify.toml).

## Stack
- Languages: HTML, CSS, vanilla JavaScript
- Runtime: Static site (no build tooling required)
- Notable third-party services:
  - Paystack (public key used in client JS for payments)
  - Hosted backend API (production base URL referenced in `js/config.js`)
  - Netlify (deployment configuration included)

## Repository structure (top-level)
```
.
├── admin/                  # Admin HTML pages: dashboard.html, login.html
├── css/                    # Styles (main stylesheet: css/style.css)
├── images/                 # All site images and product assets
├── js/                     # Frontend scripts (config, cart, nav, products, etc.)
├── index.html              # Homepage
├── about.html, contact.html, product.html, product-detail.html, category.html, cart.html, checkout.html, order-success.html, login.html, account.html, wishlist.html, ...  # pages
├── netlify.toml            # Security headers / Netlify config
├── _redirects              # Client-side fallback for SPA navigation
├── .gitignore
└── small scripts (.py)     # helper scripts used during development (not part of runtime)
```

How it fits together
- index.html + other HTML files render the UI and include the shared JS bundle from `js/`.
- `js/config.js` sets runtime configuration (API base URL, Paystack public key), hydrates cached products from localStorage, and triggers a fetch to `/api/products`.
- UI scripts (`js/products.js`, `js/cart.js`, `js/nav.js`, `js/checkout.js` etc.) read and modify client-side state (product lists, wishlist, cart) and call the backend API for account and order operations.
- The site is static: it fetches dynamic data from a separate backend API at runtime.

## How it works (runtime overview)
- When a page loads the shared config script (`js/config.js`) runs:
  - It chooses API base URL automatically:
    - if hostname is `localhost` or `127.0.0.1` → `http://localhost:5000/api`
    - otherwise → `https://sile-backend.onrender.com/api`
  - It hydrates product data from localStorage (key: `sile_products`) for instant rendering and then fetches fresh products from `${API_BASE}/products`.
  - It exposes global helpers and collections (e.g., `window.PRODUCTS`, `FEATURED_PRODUCTS`).
  - It dispatches an event `productsLoaded` once products are available.
- Cart is persisted to localStorage under `sileCart`. Cart UI and totals are calculated client-side.
- The header displays account status by reading `authToken` and `user` from localStorage; navigation and wishlist icons are injected by `js/nav.js`.
- Checkout uses Paystack public key injected as `window.PAYSTACK_PUBLIC_KEY` in `js/config.js`.

## Run locally
This repo is static and does not require a build step.

Quick options:
- Using VS Code + Live Server:
  1. Open project in VS Code.
  2. Start Live Server on `index.html`.
  3. Visit: http://127.0.0.1:5500/index.html

- Using a simple static server (Python):
```
# from repo root
python3 -m http.server 5500
# then visit:
http://127.0.0.1:5500/index.html
```

To enable full product/account/cart/checkout functionality, run the backend locally and ensure it listens on port 5000 (so the frontend `js/config.js` will automatically point at `http://localhost:5000/api`).

## Configuration
- Main runtime configuration: `js/config.js`
  - API base URL auto-switches between local and production.
  - Public Paystack key available as `window.PAYSTACK_PUBLIC_KEY`.
  - Product collections and helper functions are defined here (skeleton loaders, normalizeProduct, fetchProducts, hydrateProductsFromCache, etc.).

Client-side storage keys used by the app:
- `sile_products` — cached product array (JSON)
- `sileCart` — cart contents (JSON)
- `authToken` — authentication token (string)
- `user` — authenticated user object (JSON)
- `wishlist` or app-specific wishlist storage is handled by `js/wishlist.js` (see file for exact key)

Events:
- `productsLoaded` — dispatched after products are fetched and normalized.

## Important files (what to edit for each concern)
- `index.html` — homepage and hero/featured product placeholders.
- `css/style.css` — global styling and responsive layout.
- `js/config.js` — API base URL, product hydration, product normalization, Paystack public key.
- `js/main.js` — homepage/product rendering glue (slider, slider dots, DOM helpers).
- `js/products.js` — product listing rendering and product utilities.
- `js/cart.js` — cart state, localStorage, UI rendering for modal and cart page.
- `js/checkout.js` — checkout page logic, payment integration and order placement.
- `js/order-success.js` — order success rendering.
- `js/nav.js` — header/account/wishlist/cart UI, mobile menu and overlay logic.
- `js/wishlist.js` — wishlist UI + storage.
- `admin/dashboard.html`, `admin/login.html` — admin area pages (static HTML admin UI).
- `netlify.toml` and `_redirects` — Netlify configuration for headers and client-side routing.

## Admin area
- Static admin pages live in `admin/`:
  - `admin/login.html`
  - `admin/dashboard.html`
- Those pages are client-side HTML that expect the backend to provide admin endpoints (authentication, product/order management). They are simple HTML UIs and will need backend support to be functional.

## Storage & client-side data
- Product cache: `js/config.js` writes product data to `localStorage` to speed up subsequent page loads and to allow basic offline display.
- Cart: fully managed client-side in `js/cart.js` and persisted to `localStorage` as `sileCart`.
- Auth: login sets `authToken` and `user` in localStorage; the UI reads these to show account state.

## Deployment (Netlify)
- The site is static: publish directory = project root, build command = none, main page = `index.html`.
- `netlify.toml` sets security headers; `_redirects` provides client-side fallback routing.
- Ensure the backend API is reachable from the deployed site and CORS is configured on the backend to allow the frontend origin.

## Troubleshooting & common issues
- Products not appearing
  - Confirm the backend API is reachable at the URL `js/config.js` resolves (`http://localhost:5000/api` for local or `https://sile-backend.onrender.com/api` in production).
  - Check browser console for network errors / CORS blocked requests.
  - If localStorage contains corrupted data, clear `sile_products` and reload.
- Paystack payment failures
  - Verify `window.PAYSTACK_PUBLIC_KEY` is the correct environment value and use the sandbox/test key for development.
  - Check network requests to Paystack and any backend payment verification endpoints.
- Cart totals incorrect
  - Inspect `sileCart` in localStorage; cart UI reads price/quantity from that object.
  - Ensure product ids and price normalization are consistent with backend types (IDs as integers, price numeric).
- Mobile navigation issues
  - `js/nav.js` contains the mobile drawer logic and auto-injected drawer header/footer. Confirm the `.mobile-menu-btn` button exists and scripts load in the correct order.
- 404s on refresh (client-side routes)
  - Ensure `_redirects` contains a fallback to `index.html` when deploying on Netlify.

## Development notes & guidelines
- No build / bundler: modify HTML/CSS/JS directly and refresh the browser.
- Local dev server or Live Server extension recommended to avoid file:// restrictions.
- Keep API URL changes centralized in `js/config.js`.
- When editing layout or navigation, test on desktop/tablet/mobile breakpoints.
- Accessibility: header buttons include aria labels in many places (mobile menu, back-to-top, cart actions). Continue to add aria attributes for interactive elements.
- When adding images: put them in `images/` and reference with relative paths (e.g., `images/your-image.jpg`).
- For large images, optimize (resize and compress) to improve mobile performance.

## Security & secrets
- This repository is a static client. Never commit private credentials, secret keys, or database connection strings.
- The Paystack value present in `js/config.js` is a public key (used client-side). Do not add private/secret keys to the repo.
- Backend secrets and webhooks (verification keys, server-side Paystack secret) must remain on the server and never appear in client code or the repository.

## Known gaps & TODOs
- No LICENSE file was detected. Add a license if you plan to open-source or distribute.
- Tests: no automated tests are present. Consider adding automated checks for HTML/CSS/JS or small integration tests for the backend API.
- Accessibility audit and keyboard navigation improvements could be considered.
- Admin area is static: wiring to backend admin endpoints may be necessary for a production admin flow.

## Contact
- The site UI contains contact info for Sile Communications (phone and email). For repository-specific questions, open an issue in this repo.

---
