/**
 * wishlist.js — Sile Communications
 * Guests: wishlist in localStorage.
 * Logged-in: synced with backend (GET /wishlist, POST, DELETE, POST /wishlist/sync).
 *
 * Backend table: wishlist(user_id, product_id) — unique pair per user.
 */

const WISHLIST_KEY = 'sileWishlist';

function _getToken() {
  return localStorage.getItem('authToken');
}

function _getLocalIds() {
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];
  } catch {
    return [];
  }
}

function _saveLocalIds(ids) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify([...new Set(ids.map(Number))]));
}

function _parseWishlistResponse(data) {
  if (!data) return [];
  if (Array.isArray(data)) {
    return data.map((row) =>
      Number(row.product_id ?? row.productId ?? row.id ?? row),
    );
  }
  const list = data.productIds ?? data.ids ?? data.items ?? [];
  return list.map((row) =>
    typeof row === 'object'
      ? Number(row.product_id ?? row.productId ?? row.id)
      : Number(row),
  );
}

function updateWishlistBadge() {
  const count = _getLocalIds().length;
  document.querySelectorAll('.wishlist-badge').forEach((el) => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

function isInWishlist(productId) {
  return _getLocalIds().map(Number).includes(Number(productId));
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

  const product = window.PRODUCTS
    ? window.PRODUCTS.find((p) => Number(p.id) === productId)
    : null;
  showWishlistNotification(
    (product ? product.name : 'Item') + ' added to wishlist',
    'add',
  );

  const token = _getToken();
  if (!token) return;

  try {
    const res = await fetch(`${window.API_BASE}/wishlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ productId }),
    });
    if (!res.ok) console.warn('Wishlist add API:', res.status);
  } catch (e) {
    console.warn('Wishlist add failed (saved locally):', e);
  }
}

async function removeFromWishlist(productId) {
  productId = Number(productId);
  _saveLocalIds(_getLocalIds().filter((id) => id !== productId));
  updateWishlistBadge();
  refreshWishlistButtons(productId, false);

  const product = window.PRODUCTS
    ? window.PRODUCTS.find((p) => Number(p.id) === productId)
    : null;
  showWishlistNotification(
    (product ? product.name : 'Item') + ' removed from wishlist',
    'remove',
  );

  const token = _getToken();
  if (!token) return;

  try {
    const res = await fetch(`${window.API_BASE}/wishlist/${productId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) console.warn('Wishlist remove API:', res.status);
  } catch (e) {
    console.warn('Wishlist remove failed (removed locally):', e);
  }
}

function toggleWishlist(productId) {
  productId = Number(productId);
  if (isInWishlist(productId)) removeFromWishlist(productId);
  else addToWishlist(productId);
}

function refreshWishlistButtons(productId, inWishlist) {
  document.querySelectorAll(`[data-wishlist-id="${productId}"]`).forEach((btn) => {
    const icon = btn.querySelector('i');
    if (inWishlist) {
      btn.classList.add('wishlisted');
      if (icon) {
        icon.classList.remove('far');
        icon.classList.add('fas');
      }
      btn.title = 'Remove from wishlist';
    } else {
      btn.classList.remove('wishlisted');
      if (icon) {
        icon.classList.remove('fas');
        icon.classList.add('far');
      }
      btn.title = 'Add to wishlist';
    }
  });
}

function refreshAllWishlistButtons() {
  const ids = _getLocalIds().map(Number);
  document.querySelectorAll('[data-wishlist-id]').forEach((btn) => {
    const id = Number(btn.dataset.wishlistId);
    refreshWishlistButtons(id, ids.includes(id));
  });
}

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

/** Merge local guest wishlist with server (login / page load). */
async function syncWishlistFromBackend() {
  const token = _getToken();
  if (!token) return;

  try {
    const getRes = await fetch(`${window.API_BASE}/wishlist`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (getRes.ok) {
      const data = await getRes.json();
      const serverIds = _parseWishlistResponse(data).filter(Boolean);
      const localIds = _getLocalIds().map(Number);
      const merged = [...new Set([...serverIds, ...localIds])];

      if (localIds.length && merged.length > serverIds.length) {
        const syncRes = await fetch(`${window.API_BASE}/wishlist/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productIds: merged }),
        });
        if (syncRes.ok) {
          const synced = await syncRes.json();
          _saveLocalIds(_parseWishlistResponse(synced).length ? _parseWishlistResponse(synced) : merged);
        } else {
          _saveLocalIds(merged);
        }
      } else {
        _saveLocalIds(serverIds.length ? serverIds : merged);
      }

      updateWishlistBadge();
      refreshAllWishlistButtons();
      window.dispatchEvent(new Event('wishlistSynced'));
      return;
    }
  } catch (e) {
    console.warn('GET /wishlist failed, trying sync merge:', e);
  }

  try {
    const localIds = _getLocalIds().map(Number);
    const res = await fetch(`${window.API_BASE}/wishlist/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ productIds: localIds }),
    });
    if (!res.ok) return;
    const data = await res.json();
    const ids = _parseWishlistResponse(data);
    if (ids.length) _saveLocalIds(ids);
    updateWishlistBadge();
    refreshAllWishlistButtons();
    window.dispatchEvent(new Event('wishlistSynced'));
  } catch (e) {
    console.error('Wishlist sync failed:', e);
  }
}

function initWishlist() {
  updateWishlistBadge();
  syncWishlistFromBackend();
}

window.syncWishlistFromBackend = syncWishlistFromBackend;
window.addToWishlist = addToWishlist;
window.removeFromWishlist = removeFromWishlist;
window.toggleWishlist = toggleWishlist;
window.isInWishlist = isInWishlist;
window.getWishlistIds = getWishlistIds;
window.refreshAllWishlistButtons = refreshAllWishlistButtons;

document.addEventListener('DOMContentLoaded', initWishlist);
window.addEventListener('productsLoaded', refreshAllWishlistButtons);
window.addEventListener('wishlistSynced', refreshAllWishlistButtons);
