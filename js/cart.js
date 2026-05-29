let cart = JSON.parse(localStorage.getItem('sileCart')) || [];

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
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('sileCart', JSON.stringify(cart));
    updateCartUI();
    if (typeof renderCartItems === 'function') renderCartItems();
    if (typeof renderCartPage === 'function') renderCartPage();
}

function updateCartQuantity(productId, change) {
    const itemIndex = cart.findIndex(item => item.id === productId);
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
                    <button onclick="updateCartQuantity(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateCartQuantity(${item.id}, 1)">+</button>
                </div>
            </div>
            <div>
                <strong>KSh ${(item.price * item.quantity).toLocaleString()}</strong>
                <br>
                <button onclick="removeFromCart(${item.id})" style="background:none; border:none; color:#ef4444; cursor:pointer; margin-top:8px; font-size:12px;">Remove</button>
            </div>
        </div>
    `).join('');
    
    if (footer) footer.style.display = 'block';
}

function toggleCart() {
    const modal = document.getElementById('cart-modal');
    if (modal) {
        modal.classList.toggle('active');
        if (modal.classList.contains('active')) {
            renderCartItems();
        }
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
});