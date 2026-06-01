/**
 * nav.js — Sile Communications
 * Shared behaviours injected on every page:
 *   - Auth state → update account button
 *   - Wishlist badge injection into header
 *   - Mobile menu toggle + dropdown
 *   - Cart modal overlay (click-outside-to-close)
 *   - Back-to-top button
 */

// Fallback for inline onclick before DOM ready
window.toggleMobileMenu = function() {
  const navLinks = document.getElementById('nav-links');
  if (navLinks) navLinks.classList.toggle('active');
};

document.addEventListener('DOMContentLoaded', function () {
  // Run mobile menu first so a failure in any other init can't break the hamburger.
  safeRun(initMobileMenu, 'initMobileMenu');
  safeRun(initAuthButton, 'initAuthButton');
  safeRun(injectWishlistIcon, 'injectWishlistIcon');
  safeRun(initCartOverlay, 'initCartOverlay');
  safeRun(initBackToTop, 'initBackToTop');
  safeRun(initChatWidget, 'initChatWidget');
  safeRun(function () {
    if (typeof updateCartUI === 'function') updateCartUI();
  }, 'updateCartUI');
});

function safeRun(fn, name) {
  try { fn(); } catch (err) {
    console.error('[nav.js] ' + name + ' failed:', err);
  }
}

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

/* ── Mobile menu (hamburger) ─────────────────────────────── */
function initMobileMenu() {
  // Ensure global function works
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
        if (btn) btn.innerHTML = '<i class="fas fa-bars"></i>';
      }
    }
  });

  // Auto-close mobile menu when any nav link is clicked
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      const navLinks = document.getElementById('nav-links');
      const btn = document.querySelector('.mobile-menu-btn');
      if (navLinks && navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
        if (btn) btn.innerHTML = '<i class="fas fa-bars"></i>';
      }
    });
  });

  // Mobile dropdown: tap to toggle (prevent default for parent link)
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
  if (!document.getElementById('cart-overlay')) {
    const overlay = document.createElement('div');
    overlay.id = 'cart-overlay';
    overlay.className = 'cart-overlay';
    overlay.addEventListener('click', function () {
      if (typeof closeCartPanel === 'function') closeCartPanel();
    });
    document.body.appendChild(overlay);
  }

  window.toggleCart = function () {
    const onCartPage = /cart\.html$/i.test(window.location.pathname);
    if (onCartPage) {
      if (typeof closeCartPanel === 'function') closeCartPanel();
      return;
    }
    const modal   = document.getElementById('cart-modal');
    const overlay = document.getElementById('cart-overlay');
    if (!modal) return;
    const isOpening = !modal.classList.contains('active');
    modal.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active', isOpening);
    if (isOpening && typeof renderCartItems === 'function') renderCartItems();
  };

  if (typeof closeCartPanel === 'function') closeCartPanel();

  document.querySelectorAll('.btn-cart-view').forEach(function (link) {
    link.addEventListener('click', function () {
      if (typeof closeCartPanel === 'function') closeCartPanel();
    });
  });
}

/* ── Chat widget ─────────────────────────────────────────── */
function initChatWidget() {
  window.toggleChat = function () {
    const widget = document.getElementById('chat-widget');
    if (widget) widget.classList.toggle('active');
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
