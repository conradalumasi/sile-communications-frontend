/**
 * wishlist.js — Sile Communications
 * Guests: wishlist lives in localStorage (persists across sessions).
 * Logged-in users: also synced to backend /api/wishlist.
 */

const WISHLIST_KEY = 'sileWishlist';

/* ── Internal helpers ─────────────────────────────────────── */

function _getToken() {
  return localStorage.getItem('authToken');
}

function _getLocalIds() {
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];
  } catch { return []; }
}

function _saveLocalIds(ids) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids));
}

/* ── Badge update ─────────────────────────────────────────── */

function updateWishlistBadge() {
  const count = _getLocalIds().length;
  document.querySelectorAll('.wishlist-badge').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

/* ── Public API ───────────────────────────────────────────── */

function isInWishlist(productId) {
  const id = Number(productId);
  return _getLocalIds().map(Number).includes(id);
}

function getWishlistIds() {
  return _getLocalIds();
}

async function addToWishlist(productId) {
  productId = Number(productId);
  const ids = _getLocalIds();
  if (!ids.includes(productId)) {
    ids.push(productId);
    _saveLocalIds(ids);
  }
  updateWishlistBadge();
  refreshWishlistButtons(productId, true);

  const product = window.PRODUCTS ? window.PRODUCTS.find(p => Number(p.id) === productId) : null;
  showWishlistNotification((product ? product.name : 'Item') + ' added to wishlist', 'add');

  const token = _getToken();
  if (token) {
    try {
      await fetch(`${window.API_BASE}/wishlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId })
      });
    } catch (e) { /* silent — local already saved */ }
  }
}

async function removeFromWishlist(productId) {
  productId = Number(productId);
  const ids = _getLocalIds().filter(id => id !== productId);
  _saveLocalIds(ids);
  updateWishlistBadge();
  refreshWishlistButtons(productId, false);

  const product = window.PRODUCTS ? window.PRODUCTS.find(p => Number(p.id) === productId) : null;
  showWishlistNotification((product ? product.name : 'Item') + ' removed from wishlist', 'remove');

  const token = _getToken();
  if (token) {
    try {
      await fetch(`${window.API_BASE}/wishlist/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) { /* silent */ }
  }
}

function toggleWishlist(productId) {
  productId = Number(productId);
  if (isInWishlist(productId)) {
    removeFromWishlist(productId);
  } else {
    addToWishlist(productId);
  }
}

/* ── UI refresh helpers ───────────────────────────────────── */

function refreshWishlistButtons(productId, inWishlist) {
  document.querySelectorAll(`[data-wishlist-id="${productId}"]`).forEach(btn => {
    const icon = btn.querySelector('i');
    if (inWishlist) {
      btn.classList.add('wishlisted');
      if (icon) { icon.classList.remove('far'); icon.classList.add('fas'); }
      btn.title = 'Remove from wishlist';
    } else {
      btn.classList.remove('wishlisted');
      if (icon) { icon.classList.remove('fas'); icon.classList.add('far'); }
      btn.title = 'Add to wishlist';
    }
  });
}

function refreshAllWishlistButtons() {
  const ids = _getLocalIds().map(Number);
  document.querySelectorAll('[data-wishlist-id]').forEach(btn => {
    const id = Number(btn.dataset.wishlistId);
    refreshWishlistButtons(id, ids.includes(id));
  });
}

/* ── Notification ─────────────────────────────────────────── */

function showWishlistNotification(message, type) {
  const el = document.createElement('div');
  el.className = `sile-toast sile-toast-${type === 'add' ? 'wishlist' : 'remove'}`;
  el.innerHTML = `<i class="fa${type === 'add' ? 's' : 'r'} fa-heart"></i><span>${message}</span>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('sile-toast-show'));
  setTimeout(() => {
    el.classList.remove('sile-toast-show');
    setTimeout(() => el.remove(), 350);
  }, 3000);
}

/* ── Backend sync on login ───────────────────────────────── */

async function syncWishlistFromBackend() {
  const token = _getToken();
  if (!token) return;
  try {
    const res = await fetch(`${window.API_BASE}/wishlist`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return;
    const data = await res.json();
    const ids = data.map(item => Number(item.productId || item.id || item));
    const localIds = _getLocalIds().map(Number);
    const merged = [...new Set([...localIds, ...ids])];
    _saveLocalIds(merged);
    for (const id of localIds) {
      if (!ids.includes(id)) {
        try {
          await fetch(`${window.API_BASE}/wishlist`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ productId: id })
          });
        } catch (e) {}
      }
    }
    updateWishlistBadge();
    refreshAllWishlistButtons();
  } catch (e) { /* backend may not have wishlist endpoint yet */ }
}

/* ── Init ─────────────────────────────────────────────────── */

function initWishlist() {
  updateWishlistBadge();
  syncWishlistFromBackend();
}

document.addEventListener('DOMContentLoaded', initWishlist);
window.addEventListener('productsLoaded', refreshAllWishlistButtons);
