// main.js — Sile Communications
document.addEventListener('DOMContentLoaded', () => {
  if (window.PRODUCTS && window.PRODUCTS.length > 0) {
    loadAllSections();
  } else {
    window.addEventListener('productsLoaded', loadAllSections);
  }
  updateCartUI();
});

function loadAllSections() {
  loadFeaturedProducts();
  loadBestSellingPhones();
  loadTopLaptops();
  loadSafaricomServices();
}

function loadFeaturedProducts() {
  const container = document.getElementById('featured-products');
  if (!container) return;
  container.innerHTML = FEATURED_PRODUCTS.slice(0, 10).map(p => createProductCard(p)).join('');
  if (typeof refreshAllWishlistButtons === 'function') refreshAllWishlistButtons();
}

function loadBestSellingPhones() {
  const container = document.getElementById('best-selling-phones');
  if (!container) return;
  container.innerHTML = BEST_SELLING_PHONES.slice(0, 10).map(p => createProductCard(p)).join('');
  if (typeof refreshAllWishlistButtons === 'function') refreshAllWishlistButtons();
}

function loadTopLaptops() {
  const container = document.getElementById('top-laptops');
  if (!container) return;
  container.innerHTML = TOP_LAPTOPS.slice(0, 8).map(p => createProductCard(p)).join('');
  if (typeof refreshAllWishlistButtons === 'function') refreshAllWishlistButtons();
}

function loadSafaricomServices() {
  const container = document.getElementById('safaricom-services');
  if (!container) return;
  container.innerHTML = SAFARICOM_SERVICES.map(service => `
    <div class="safaricom-item">
      <img src="${service.image}" alt="${service.name}" loading="lazy" />
      <div class="safaricom-item-body">
        <h3>${service.name}</h3>
        <p>${service.description}</p>
        ${service.price > 0
          ? `<span class="price-badge">KSh ${service.price.toLocaleString()}</span>`
          : '<span class="free-badge">Free Service</span>'}
      </div>
    </div>
  `).join('');
}

/* ── Product Card ──────────────────────────────────────────── */
function createProductCard(product, options = {}) {
  const { showWishlist = false, removeFromWishlist = false } = options;
  let badges = '';
  if (product.is_hot)   badges += '<span class="product-badge badge-hot">HOT</span>';
  if (product.is_offer) badges += '<span class="product-badge badge-offer">OFFER</span>';

  // Savings badge
  let savingsHtml = '';
  if (product.old_price && product.old_price > product.price) {
    const saving = product.old_price - product.price;
    savingsHtml = `<div class="product-savings">You save KSh ${saving.toLocaleString()}</div>`;
  }

  const oldPriceHtml = product.old_price
    ? `<span class="product-old-price">KSh ${product.old_price.toLocaleString()}</span>`
    : '';

  const inWishlist = showWishlist && typeof isInWishlist === 'function' && isInWishlist(product.id);
  const wishlistBtn = showWishlist && !removeFromWishlist ? `
      <button class="wishlist-btn ${inWishlist ? 'wishlisted' : ''}"
              data-wishlist-id="${product.id}"
              onclick="event.stopPropagation(); toggleWishlist(${product.id})"
              title="${inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}"
              aria-label="${inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}">
        <i class="${inWishlist ? 'fas' : 'far'} fa-heart"></i>
      </button>` : '';

  const removeWishlistBtn = removeFromWishlist ? `
          <button class="btn-remove-wishlist"
                  data-wishlist-id="${product.id}"
                  onclick="event.stopPropagation(); removeFromWishlist(${product.id}); if (typeof loadWishlistPage === 'function') setTimeout(loadWishlistPage, 80);"
                  aria-label="Remove ${product.name} from wishlist">
            <i class="fas fa-trash-alt"></i> Remove
          </button>` : '';

  return `
    <div class="product-card" onclick="location.href='product-detail.html?id=${product.id}'">
      ${badges}
      ${wishlistBtn}
      <div class="product-image">
        <img src="${product.image}"
             alt="${product.name}"
             loading="lazy"
             onerror="this.src='images/no-image.png'">
      </div>
      <div class="product-details">
        <div class="product-category">${product.brand}</div>
        <div class="product-name">${product.name}</div>
        <div class="product-price">KSh ${product.price.toLocaleString()}${oldPriceHtml}</div>
        ${savingsHtml}
        <div class="product-actions">
          <button class="btn-add-cart"
                  onclick="event.stopPropagation(); addToCart(${product.id})"
                  aria-label="Add ${product.name} to cart">
            <i class="fas fa-shopping-cart"></i> Add to Cart
          </button>
          <button class="btn-view"
                  onclick="event.stopPropagation(); viewProductDetail(${product.id})"
                  aria-label="View ${product.name}">
            View
          </button>
          ${removeWishlistBtn}
        </div>
      </div>
    </div>
  `;
}

function viewProductDetail(productId) {
  window.location.href = `product-detail.html?id=${productId}`;
}