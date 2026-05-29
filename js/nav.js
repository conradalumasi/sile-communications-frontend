/**
 * nav.js — Sile Communications
 * Shared behaviours injected on every page:
 *   - Auth state → update account button
 *   - Wishlist badge injection into header
 *   - Mobile menu toggle + dropdown
 *   - Cart modal overlay (click-outside-to-close)
 *   - Back-to-top button
 */

document.addEventListener('DOMContentLoaded', function () {
  initAuthButton();
  injectWishlistIcon();
  initMobileMenu();
  initCartOverlay();
  initBackToTop();
  updateCartUI();
});

/* ── Auth: update account button on every page ───────────── */
function initAuthButton() {
  const token = localStorage.getItem('authToken');
  let user = null;
  try {
    const userStr = localStorage.getItem('user');
    if (userStr && userStr !== 'undefined') user = JSON.parse(userStr);
  } catch(e) {}

  // Support both id patterns used across pages
  const accountLink  = document.getElementById('accountLink')  || document.querySelector('.action-btn.account a');
  const userLabel    = document.getElementById('userNameLabel') || document.querySelector('.action-btn.account .action-label');

  if (!accountLink) return;

  if (token && user) {
    accountLink.href = 'account.html';
    const name = user.firstName || user.name || 'Account';
    if (userLabel) userLabel.textContent = name;
    // Also update any icon next to label
    const icon = accountLink.querySelector('i');
    if (icon) { icon.className = 'fas fa-user-circle'; }
  } else {
    accountLink.href = 'login.html';
    if (userLabel) userLabel.textContent = 'Login';
    const icon = accountLink.querySelector('i');
    if (icon) { icon.className = 'fas fa-user'; }
  }
}

/* ── Wishlist: add heart icon to header actions ──────────── */
function injectWishlistIcon() {
  const headerActions = document.querySelector('.header-actions');
  if (!headerActions) return;
  // Don't double-inject
  if (document.querySelector('.action-btn.wishlist')) return;

  const wishlistBtn = document.createElement('div');
  wishlistBtn.className = 'action-btn wishlist';
  wishlistBtn.setAttribute('onclick', "location.href='wishlist.html'");
  wishlistBtn.title = 'My Wishlist';
  wishlistBtn.innerHTML = `
    <div class="action-icon-wrap">
      <i class="far fa-heart" style="font-size:20px; color:var(--dark);"></i>
      <span class="cart-badge wishlist-badge" id="wishlist-count" style="display:none;background:var(--danger);">0</span>
    </div>
    <span class="action-label">Wishlist</span>
  `;

  // Insert before the cart button
  const cartBtn = headerActions.querySelector('.action-btn.cart');
  if (cartBtn) {
    headerActions.insertBefore(wishlistBtn, cartBtn);
  } else {
    headerActions.prepend(wishlistBtn);
  }

  // Update badge after injection
  if (typeof updateWishlistBadge === 'function') updateWishlistBadge();
}

/* ── Mobile menu ─────────────────────────────────────────── */
function initMobileMenu() {
  // Toggle function (called from inline onclick too)
  window.toggleMobileMenu = function () {
    const navLinks = document.getElementById('nav-links');
    const btn      = document.querySelector('.mobile-menu-btn');
    if (!navLinks) return;
    const isOpen = navLinks.classList.toggle('active');
    if (btn) btn.innerHTML = isOpen
      ? '<i class="fas fa-times"></i>'
      : '<i class="fas fa-bars"></i>';
  };

  // Close menu when clicking outside
  document.addEventListener('click', function (e) {
    const nav = document.getElementById('nav-links');
    const btn = document.querySelector('.mobile-menu-btn');
    if (nav && nav.classList.contains('active')) {
      if (!nav.contains(e.target) && btn && !btn.contains(e.target)) {
        nav.classList.remove('active');
        btn.innerHTML = '<i class="fas fa-bars"></i>';
      }
    }
  });

  // Mobile dropdown: tap to toggle
  document.querySelectorAll('.dropdown > a').forEach(link => {
    link.addEventListener('click', function (e) {
      if (window.innerWidth <= 900) {
        e.preventDefault();
        const parent = this.parentElement;
        // Close siblings
        document.querySelectorAll('.dropdown').forEach(d => {
          if (d !== parent) d.classList.remove('active');
        });
        parent.classList.toggle('active');
      }
    });
  });
}

/* ── Cart overlay (click-outside-to-close) ───────────────── */
function initCartOverlay() {
  // Inject overlay if not present
  if (!document.getElementById('cart-overlay')) {
    const overlay = document.createElement('div');
    overlay.id = 'cart-overlay';
    overlay.className = 'cart-overlay';
    overlay.addEventListener('click', function () {
      const modal = document.getElementById('cart-modal');
      if (modal) modal.classList.remove('active');
      overlay.classList.remove('active');
    });
    document.body.appendChild(overlay);
  }

  // Override toggleCart to also toggle overlay
  window.toggleCart = function () {
    const modal   = document.getElementById('cart-modal');
    const overlay = document.getElementById('cart-overlay');
    if (!modal) return;
    const isOpening = !modal.classList.contains('active');
    modal.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active', isOpening);
    if (isOpening && typeof renderCartItems === 'function') renderCartItems();
  };
}

/* ── Back to top ─────────────────────────────────────────── */
function initBackToTop() {
  if (document.getElementById('back-to-top')) return;
  const btn = document.createElement('button');
  btn.id        = 'back-to-top';
  btn.className = 'back-to-top';
  btn.setAttribute('aria-label', 'Back to top');
  btn.innerHTML = '<i class="fas fa-chevron-up"></i>';
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
}
