# Sile Communications Frontend

Frontend website for Sile Communications, a Kitale-based electronics and Safaricom services shop. The site is built with plain HTML, CSS, and JavaScript and connects to the Sile backend API for products, accounts, carts, checkout, and orders.

## Features

- Responsive storefront pages for phones, laptops, accessories, solar solutions, and Safaricom services.
- Product listings, product details, cart, wishlist, checkout, and order success flows.
- Customer account and login pages.
- Admin pages under `admin/`.
- Mobile-friendly navigation drawer with dropdown categories.
- Local product caching so pages can show recently loaded products faster.

## Project Structure

```text
.
├── admin/                  # Admin dashboard pages
├── css/style.css           # Main stylesheet
├── images/                 # Site images and product assets
├── js/                     # Frontend scripts and API config
├── index.html              # Homepage
├── checkout.html           # Checkout flow
├── order-success.html      # Order confirmation page
├── netlify.toml            # Netlify headers
└── _redirects              # Netlify redirects
```

## Running Locally

This project does not require a build step.

1. Open the folder in VS Code.
2. Start Live Server from `index.html`.
3. Visit `http://127.0.0.1:5500/index.html`.

For full product, account, cart, and checkout functionality, run the backend locally on port `5000`. The frontend automatically uses:

- Local API: `http://localhost:5000/api`
- Production API: `https://sile-backend.onrender.com/api`

The API base URL is configured in `js/config.js`.

## Deployment

The frontend is designed for static hosting, currently configured for Netlify.

- Publish directory: project root
- Build command: none
- Main page: `index.html`

`netlify.toml` sets common security headers, and `_redirects` supports client-side fallback routing.

## Important Files

- `js/config.js` - API base URL, product loading, cached product hydration, shared collections.
- `js/nav.js` - account label, wishlist injection, mobile menu, cart overlay, chat widget, back-to-top button.
- `js/cart.js` - cart state and UI behavior.
- `js/checkout.js` - checkout flow, delivery, payment, and order placement.
- `js/order-success.js` - order success page rendering.
- `css/style.css` - global layout, responsive navigation, cards, forms, checkout, and page styling.

## Notes For Future Work

- Do not commit private credentials or database connection strings.
- Keep API endpoint changes centralized in `js/config.js`.
- Test navigation changes on desktop, tablet, and mobile widths before deploying.
- If product data is missing, confirm the backend API and database are running before changing frontend rendering.
