/**
 * order-success.js — displays last order from sessionStorage
 */
document.addEventListener('DOMContentLoaded', () => {
  renderOrderSuccess();
  if (typeof updateCartUI === 'function') updateCartUI();
});

function renderOrderSuccess() {
  const root = document.getElementById('orderSuccessRoot');
  if (!root) return;

  let order = null;
  try {
    order = JSON.parse(sessionStorage.getItem('sileLastOrder') || 'null');
  } catch (e) {}

  const urlParams = new URLSearchParams(window.location.search);
  const orderFromUrl = urlParams.get('order');

  if (!order && orderFromUrl) {
    order = {
      orderNumber: orderFromUrl,
      items: [],
      total: 0,
      customer: {},
    };
  }

  if (!order || !order.items || order.items.length === 0) {
    root.innerHTML = `
      <div class="success-card success-card-wide">
        <div class="success-icon"><i class="fas fa-check-circle"></i></div>
        <h1>Order Successful!</h1>
        <p class="success-lead">Thank you for shopping with Sile Communications.</p>
        ${orderFromUrl ? `<p class="order-ref">Order reference: <strong>${orderFromUrl}</strong></p>` : ''}
        <p class="success-note">We've received your order. You will receive a confirmation call or SMS shortly.</p>
        <div class="success-actions">
          <a href="category.html" class="btn-primary">Continue Shopping</a>
          <a href="account.html" class="btn-outline">View My Orders</a>
        </div>
      </div>`;
    return;
  }

  const itemsHtml = order.items.map((item) => `
    <div class="order-success-item">
      <img src="${item.image || 'images/no-image.png'}" alt="${item.name}" onerror="this.src='images/no-image.png'">
      <div class="order-success-item-info">
        <strong>${item.name}</strong>
        <span>Qty: ${item.quantity}</span>
      </div>
      <div class="order-success-item-price">KSh ${(item.price * item.quantity).toLocaleString()}</div>
    </div>
  `).join('');

  const paymentLabels = {
    mpesa: 'Pay now with M-PESA',
    cod: 'Pay on delivery',
  };
  const paymentLabel = order.paymentLabel || paymentLabels[order.paymentMethod] || order.paymentMethod || '—';
  const customer = order.customer || {};
  const statusLabels = {
    pending_payment: 'Pending M-PESA payment',
    pending: 'Pending confirmation',
    confirmed: 'Confirmed',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  const statusLabel = statusLabels[order.status] || order.status || 'Pending confirmation';

  root.innerHTML = `
    <div class="success-card success-card-wide">
      <div class="success-badge"><i class="fas fa-check-circle"></i> Order received</div>
      <h1>Thank you, ${customer.firstName || 'Customer'}!</h1>
      <p class="success-lead">Your order has been placed successfully.</p>
      <p class="order-ref">Order number: <strong>${order.orderNumber}</strong></p>

      <div class="order-success-grid">
        <div class="order-success-panel">
          <h3><i class="fas fa-box"></i> Order items</h3>
          <div class="order-success-items">${itemsHtml}</div>
          <div class="order-success-totals">
            <div class="row"><span>Subtotal</span><span>KSh ${(order.subtotal || 0).toLocaleString()}</span></div>
            <div class="row"><span>Delivery</span><span>KSh ${(order.deliveryFee || 0).toLocaleString()}</span></div>
            <div class="row total"><span>Total</span><span>KSh ${(order.total || 0).toLocaleString()}</span></div>
          </div>
        </div>
        <div class="order-success-panel">
          <h3><i class="fas fa-truck"></i> Delivery & contact</h3>
          <ul class="order-success-details">
            <li><strong>Name:</strong> ${customer.firstName || ''} ${customer.lastName || ''}</li>
            <li><strong>Phone:</strong> ${customer.phone || '—'}</li>
            <li><strong>Email:</strong> ${customer.email || '—'}</li>
            <li><strong>Town:</strong> ${customer.town || '—'}</li>
            <li><strong>Delivery:</strong> ${order.deliveryOption || '—'}</li>
            <li><strong>Payment:</strong> ${paymentLabel}</li>
            <li><strong>Status:</strong> ${statusLabel}</li>
            ${order.mpesaPhone ? `<li><strong>M-PESA number:</strong> ${order.mpesaPhone}</li>` : ''}
          </ul>
          <div class="order-success-next">
            <h4>What happens next?</h4>
            <ol>
              <li>We confirm your order by phone or SMS</li>
              <li>Your items are prepared for delivery</li>
              <li>You receive updates on delivery status in My Account</li>
            </ol>
          </div>
          <p class="success-help">Questions? Call <a href="tel:0710102424">0710 102424</a> or <a href="https://wa.me/254710102424">WhatsApp us</a>.</p>
        </div>
      </div>

      <div class="success-actions">
        <a href="category.html" class="btn-primary">Continue Shopping</a>
        <a href="account.html" class="btn-outline">View My Orders</a>
      </div>
    </div>
  `;
}
