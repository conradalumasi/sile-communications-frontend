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

function getMobileMenuButtons() {
  return document.querySelectorAll('.header-bottom .mobile-menu-btn, .main-nav .mobile-menu-btn');
}

function setMobileMenuIcon(open) {
  // Just toggle ARIA states since hamburger handles clicks
  getMobileMenuButtons().forEach((btn) => {
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

function closeMobileMenu() {
  const navLinks = document.getElementById('nav-links');
  if (navLinks) {
      navLinks.classList.remove('active');
      // Collapse all dropdowns on close for neatness
      navLinks.querySelectorAll('.dropdown').forEach(d => d.classList.remove('active'));
  }
  const overlay = document.getElementById('nav-overlay');
  if (overlay) overlay.classList.remove('active');
  setMobileMenuIcon(false);
  document.body.style.overflow = ''; // Restore scroll
}

function initMobileMenu() {
  // Inject overlay if it doesn't exist
  if (!document.getElementById('nav-overlay')) {
    const overlay = document.createElement('div');
    overlay.id = 'nav-overlay';
    overlay.className = 'nav-overlay';
    document.body.appendChild(overlay);
  }

  const navLinks = document.getElementById('nav-links');
  if (navLinks) {
    // Inject Drawer Header
    if (!navLinks.querySelector('.drawer-header')) {
      const header = document.createElement('div');
      header.className = 'drawer-header';
      header.innerHTML = `
        <div class="drawer-logo">
            <img src="images/logo.png" alt="Sile" onerror="this.style.display='none'">
            <div class="drawer-title">Sile <br><span>Communications</span></div>
        </div>
        <button class="mobile-menu-close" aria-label="Close menu">
            <i class="fas fa-times"></i>
        </button>
      `;
      header.querySelector('.mobile-menu-close').addEventListener('click', closeMobileMenu);
      navLinks.prepend(header);
    }
    
    // Inject Drawer Footer
    if (!navLinks.querySelector('.drawer-footer')) {
      const footer = document.createElement('div');
      footer.className = 'drawer-footer';
      footer.innerHTML = `
        <a href="tel:0710102424" class="drawer-contact"><i class="fas fa-phone"></i> 0710 102424</a>
        <a href="mailto:silecommunications.ltd@gmail.com" class="drawer-contact"><i class="fas fa-envelope"></i> silecommunications.ltd@gmail.com</a>
        <div class="social-links" style="margin-top: 10px;">
           <a href="https://wa.me/254710102424" target="_blank" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a>
           <a href="https://www.facebook.com/Silecommunications.ltd" target="_blank" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
           <a href="https://www.instagram.com/silecommunicationsltd/" target="_blank" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
        </div>
      `;
      navLinks.appendChild(footer);
    }
  }

  window.toggleMobileMenu = function (e) {
    if (e && e.stopPropagation) e.stopPropagation();
    const navLinks = document.getElementById('nav-links');
    if (!navLinks) return;
    
    const isOpen = !navLinks.classList.contains('active');
    
    if (isOpen) {
        navLinks.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    } else {
        closeMobileMenu();
        return;
    }
    
    const overlay = document.getElementById('nav-overlay');
    if (overlay) overlay.classList.add('active');
    setMobileMenuIcon(true);
  };

  getMobileMenuButtons().forEach((btn) => {
    btn.removeAttribute('onclick');
    btn.setAttribute('aria-label', 'Toggle navigation menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', window.toggleMobileMenu);
  });

  // Auto-close mobile menu when any non-dropdown nav link is clicked
  document.querySelectorAll('#nav-links a:not(.dropdown > a)').forEach((link) => {
    link.addEventListener('click', () => {
      if (document.getElementById('nav-links')?.classList.contains('active')) {
        closeMobileMenu();
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

  // Close menu when clicking outside the nav on mobile
  document.addEventListener('click', function (e) {
    const navLinks = document.getElementById('nav-links');
    const hamburger = document.querySelector('.mobile-menu-btn');
    if (!navLinks || !navLinks.classList.contains('active')) return;
    if (navLinks.contains(e.target) || hamburger.contains(e.target)) return;
    closeMobileMenu();
  });
}

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

function initChatWidget() {
  window.toggleChat = function () {
    const widget = document.getElementById('chat-widget');
    if (widget) widget.classList.toggle('active');
  };
}

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
