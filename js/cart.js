let cart = JSON.parse(localStorage.getItem('sileCart')) || [];

function reloadCartFromStorage() {
  cart = JSON.parse(localStorage.getItem('sileCart')) || [];
}

function normalizeCartId(id) {
  return Number(id);
}

function updateCartUI() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const countEl = document.getElementById('cart-count');
    const totalModalEl = document.getElementById('cart-total-modal');
    const footerEl = document.getElementById('cart-footer');
    const countTopEl = document.getElementById('cartCountTop');
    
    if (countEl) countEl.textContent = count;
    if (totalModalEl) totalModalEl.textContent = total.toLocaleString();
    if (footerEl) footerEl.style.display = cart.length > 0 ? 'block' : 'none';
    if (countTopEl) countTopEl.textContent = count;
}

function addToCart(productId, quantity = 1) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;
    
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({ 
            id: product.id, 
            name: product.name, 
            price: product.price, 
            image: product.image, 
            quantity: quantity 
        });
    }
    
    localStorage.setItem('sileCart', JSON.stringify(cart));
    updateCartUI();
    showNotification(`${product.name} added to cart!`);
}

function removeFromCart(productId) {
    const id = normalizeCartId(productId);
    cart = cart.filter(item => normalizeCartId(item.id) !== id);
    localStorage.setItem('sileCart', JSON.stringify(cart));
    updateCartUI();
    if (typeof renderCartItems === 'function') renderCartItems();
    if (typeof renderCartPage === 'function') renderCartPage();
}

function updateCartQuantity(productId, change) {
    const id = normalizeCartId(productId);
    const itemIndex = cart.findIndex(item => normalizeCartId(item.id) === id);
    if (itemIndex !== -1) {
        cart[itemIndex].quantity += change;
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1);
        }
        localStorage.setItem('sileCart', JSON.stringify(cart));
        updateCartUI();
        if (typeof renderCartItems === 'function') renderCartItems();
        if (typeof renderCartPage === 'function') renderCartPage();
    }
}

function renderCartItems() {
    reloadCartFromStorage();
    const container = document.getElementById('cart-items');
    const footer = document.getElementById('cart-footer');
    
    if (!container) return;
    
    if (cart.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:50px;"><i class="fas fa-shopping-cart" style="font-size:55px; color:#ccc;"></i><p style="margin-top:15px; color:#6b7280;">Your cart is empty</p></div>';
        if (footer) footer.style.display = 'none';
        return;
    }
    
    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/60x60'">
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <p>KSh ${item.price.toLocaleString()}</p>
                <div class="qty-control">
                    <button type="button" onclick="updateCartQuantity(${item.id}, -1)" aria-label="Decrease quantity">-</button>
                    <span>${item.quantity}</span>
                    <button type="button" onclick="updateCartQuantity(${item.id}, 1)" aria-label="Increase quantity">+</button>
                </div>
            </div>
            <div class="cart-item-actions">
                <strong>KSh ${(item.price * item.quantity).toLocaleString()}</strong>
                <button type="button" class="cart-remove-btn" onclick="removeFromCart(${item.id})" aria-label="Remove ${item.name}">
                    <i class="fas fa-trash-alt"></i> Remove
                </button>
            </div>
        </div>
    `).join('');
    
    if (footer) footer.style.display = 'block';
}

function renderCartPage() {
    reloadCartFromStorage();
    const container = document.getElementById('cart-items-container');
    const checkoutBtn = document.getElementById('checkout-btn');

    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `<div class="cart-empty-state"><i class="fas fa-shopping-cart"></i><h2>Your cart is empty</h2><a href="category.html" class="btn-primary">Continue Shopping</a></div>`;
        if (checkoutBtn) checkoutBtn.style.display = 'none';
        const subtotalEl = document.getElementById('cart-subtotal');
        const totalEl = document.getElementById('cart-total');
        if (subtotalEl) subtotalEl.textContent = 'KSh 0';
        if (totalEl) totalEl.textContent = 'KSh 0';
        return;
    }

    let html = '<div class="cart-table"><div class="cart-table-header"><span>Product</span><span>Price</span><span>Quantity</span><span>Subtotal</span><span></span></div>';
    let subtotal = 0;

    cart.forEach((item) => {
        const itemSubtotal = item.price * item.quantity;
        subtotal += itemSubtotal;
        html += `<div class="cart-table-row">
            <div class="product-info">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/60x60'">
                <span>${item.name}</span>
            </div>
            <div>KSh ${item.price.toLocaleString()}</div>
            <div class="product-qty">
                <button type="button" onclick="updateCartQuantity(${item.id}, -1)" aria-label="Decrease quantity">-</button>
                <span>${item.quantity}</span>
                <button type="button" onclick="updateCartQuantity(${item.id}, 1)" aria-label="Increase quantity">+</button>
            </div>
            <div>KSh ${itemSubtotal.toLocaleString()}</div>
            <div>
                <button type="button" class="cart-remove-btn cart-remove-btn--icon" onclick="removeFromCart(${item.id})" aria-label="Remove ${item.name}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>`;
    });

    html += '</div>';
    container.innerHTML = html;

    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    if (subtotalEl) subtotalEl.textContent = `KSh ${subtotal.toLocaleString()}`;
    if (totalEl) totalEl.textContent = `KSh ${subtotal.toLocaleString()}`;
    if (checkoutBtn) checkoutBtn.style.display = 'block';
}

function closeCartPanel() {
    const modal = document.getElementById('cart-modal');
    const overlay = document.getElementById('cart-overlay');
    if (modal) modal.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
}

function toggleCart() {
    const modal = document.getElementById('cart-modal');
    if (modal) {
        const isOpening = !modal.classList.contains('active');
        modal.classList.toggle('active');
        const overlay = document.getElementById('cart-overlay');
        if (overlay) overlay.classList.toggle('active', isOpening);
        if (isOpening) renderCartItems();
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function viewProductDetail(productId) {
    window.location.href = `product-detail.html?id=${productId}`;
}

document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
    if (document.getElementById('cart-items-container')) {
        renderCartPage();
    }
});