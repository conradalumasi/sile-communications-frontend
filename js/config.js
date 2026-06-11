// config.js - shared configuration
const API_BASE = (() => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  return 'https://sile-backend.onrender.com/api';
})();

window.API_BASE = API_BASE;
window.PAYSTACK_PUBLIC_KEY = 'pk_live_885cffc8db2c2d4336b0c7b5dc4f17261229cc900';

let PRODUCTS = [];
let FEATURED_PRODUCTS = [];
let BEST_SELLING_PHONES = [];
let TOP_LAPTOPS = [];
let OFFER_PRODUCTS = [];
let LIPA_POLE_POLE_PRODUCTS = [];

/* ── Skeleton cards shown while backend wakes up ─────────── */
function showSkeletons(containerId, count = 5) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = Array(count).fill(`
    <div class="skeleton-card">
      <div class="skeleton-img"></div>
      <div class="skeleton-body">
        <div class="skeleton-line w-60"></div>
        <div class="skeleton-line w-90"></div>
        <div class="skeleton-line w-40"></div>
        <div class="skeleton-line w-100 skeleton-btn"></div>
      </div>
    </div>
  `).join('');
}

function showAllSkeletons() {
  showSkeletons('featured-products', 5);
  showSkeletons('best-selling-phones', 5);
  showSkeletons('top-laptops', 4);
  showSkeletons('category-products', 10);
  showSkeletons('related-products', 4);
}

/* ── Error banner ─────────────────────────────────────────── */
function showProductError(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `
    <div class="product-error-banner">
      <i class="fas fa-exclamation-circle"></i>
      <div>
        <strong>Could not load products</strong>
        <p>Please check your connection and try again.</p>
      </div>
      <button onclick="location.reload()" class="btn-retry">
        <i class="fas fa-redo"></i> Retry
      </button>
    </div>
  `;
}

function showAllErrors() {
  ['featured-products','best-selling-phones','top-laptops','category-products'].forEach(id => {
    showProductError(id);
  });
}

/** Normalize API product fields for storefront + admin compatibility */
function normalizeProduct(p) {
  if (!p) return p;
  return {
    ...p,
    id: Number(p.id),
    name: p.name || '',
    brand: p.brand || '',
    price: Number(p.price) || 0,
    old_price: p.old_price != null ? Number(p.old_price) : (p.oldPrice != null ? Number(p.oldPrice) : null),
    category: p.category || '',
    brand_cat: p.brand_cat || p.brandCat || '',
    image: p.image || 'images/no-image.png',
    is_hot: !!(p.is_hot ?? p.isHot),
    is_offer: !!(p.is_offer ?? p.isOffer),
    desc: p.desc || p.description || '',
    specs: p.specs || '',
  };
}

window.normalizeProduct = normalizeProduct;

function buildProductCollections() {
  FEATURED_PRODUCTS = PRODUCTS.filter(p => p.is_hot).slice(0, 10);
  BEST_SELLING_PHONES = PRODUCTS.filter(p => p.category === 'smartphones').slice(0, 10);
  TOP_LAPTOPS = PRODUCTS.filter(p => p.category === 'laptops').slice(0, 8);
  OFFER_PRODUCTS = PRODUCTS.filter(p => p.is_offer).slice(0, 10);
  LIPA_POLE_POLE_PRODUCTS = PRODUCTS.filter(p => p.is_offer && p.category === 'smartphones').slice(0, 12);
}

function hydrateProductsFromCache() {
  try {
    const stored = localStorage.getItem('sile_products');
    if (!stored) return;
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || !parsed.length) return;
    PRODUCTS = parsed.map(normalizeProduct);
    window.PRODUCTS = PRODUCTS;
    buildProductCollections();
  } catch (e) {
    /* ignore corrupt cache */
  }
}

/* ── Fetch products ───────────────────────────────────────── */
async function fetchProducts() {
  // Show skeletons immediately
  showAllSkeletons();

  try {
    const response = await fetch(`${API_BASE}/products`);
    if (!response.ok) throw new Error('Failed to fetch products');
    const products = await response.json();
    PRODUCTS = (Array.isArray(products) ? products : []).map(normalizeProduct);
    window.PRODUCTS = PRODUCTS;
    try {
      localStorage.setItem('sile_products', JSON.stringify(PRODUCTS));
    } catch (e) {
      /* storage full or private mode */
    }

    buildProductCollections();

    window.dispatchEvent(new Event('productsLoaded'));
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    showAllErrors();
    return [];
  }
}

/* ── Safaricom services (static) ──────────────────────────── */
const SAFARICOM_SERVICES = [
  { id: 1, name: 'M-PESA Registration',       description: 'New M-PESA account setup with full KYC verification', price: 0,    image: 'images/service-mpesa.jpg' },
  { id: 2, name: 'M-PESA Agent Registration', description: 'Become an authorized M-PESA agent — complete training included', price: 0, image: 'images/service-agent.jpg' },
  { id: 3, name: 'SIM Card Replacement',      description: 'Replace lost or damaged SIM card — instant service', price: 100,  image: 'images/service-sim.jpg' },
  { id: 4, name: 'ID Number Change',          description: 'Update your M-PESA ID number after ID change', price: 0,    image: 'images/service-id.jpg' },
  { id: 5, name: 'Home Fiber Installation',   description: 'Safaricom Home Fiber installation and setup — same day service', price: 3000, image: 'images/service-fiber.jpg' },
  { id: 6, name: 'Bundles Purchase',          description: 'Data, voice, and SMS bundles at discounted rates', price: 0,    image: 'images/service-bundles.jpg' },
];

const CATEGORIES = [
  { id: 1, name: 'Smartphones',         slug: 'smartphones',    icon: 'fa-mobile-alt' },
  { id: 2, name: 'Kabambe',             slug: 'kabambe',        icon: 'fa-mobile' },
  { id: 3, name: 'Laptops',             slug: 'laptops',        icon: 'fa-laptop' },
  { id: 4, name: 'Accessories',         slug: 'accessories',    icon: 'fa-headphones' },
  { id: 5, name: 'Content Creator Kits',slug: 'content-creator',icon: 'fa-video' },
  { id: 6, name: 'Solar Solutions',     slug: 'solar',          icon: 'fa-solar-panel' },
];

// Hydrate from cache for instant cart/checkout totals, then refresh from API
hydrateProductsFromCache();
fetchProducts();
