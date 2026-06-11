/**
 * order-success.js — displays last order from sessionStorage
 * and verifies Paystack payment if reference is present
 */
document.addEventListener('DOMContentLoaded', () => {
  handlePaymentVerification().then(() => {
    renderOrderSuccess();
    if (typeof updateCartUI === 'function') updateCartUI();
  });
});

async function handlePaymentVerification() {
  const urlParams = new URLSearchParams(window.location.search);
  const reference = urlParams.get('reference') || urlParams.get('trxref');
  if (!reference) return;

  try {
    const response = await fetch(`${window.API_BASE}/payments/verify/${encodeURIComponent(reference)}`);
    const data = await response.json();

    // Update the session order with payment verification result
    const storedOrder = JSON.parse(sessionStorage.getItem('sileLastOrder') || 'null');
    if (storedOrder) {
      if (data.verified) {
        storedOrder.status = 'paid';
        storedOrder.paymentVerified = true;
        storedOrder.paymentChannel = data.order?.channel || 'online';
      } else {
        storedOrder.status = data.status || 'payment_failed';
        storedOrder.paymentVerified = false;
      }
      sessionStorage.setItem('sileLastOrder', JSON.stringify(storedOrder));
    }
  } catch (err) {
    console.error('Payment verification error:', err);
    // On network error, we don't assume complete failure, 
    // the backend webhook will catch it.
  }
}

function renderOrderSuccess() {
  const orderData = JSON.parse(sessionStorage.getItem('sileLastOrder') || 'null');
  
  if (!orderData) {
    document.getElementById('orderSuccessRoot').innerHTML = `
      <div class="success-page" style="text-align: center;">
        <div class="message error" style="display:inline-block; margin-bottom:20px;">
          <i class="fas fa-exclamation-circle"></i> No recent order found.
        </div>
        <br>
        <a href="index.html" class="btn-primary">Return to Home</a>
      </div>
    `;
    return;
  }

  const isFailed = orderData.paymentMethod === 'paystack' && orderData.status !== 'paid' && orderData.status !== 'pending_payment';

  if (!isFailed) {
    // Payment successful or pending, clear the cart
    localStorage.removeItem('sileCart');
  }

  if (isFailed) {
    document.getElementById('orderSuccessRoot').innerHTML = `
      <div class="success-header">
        <div class="success-icon" style="background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); box-shadow: 0 8px 24px rgba(239, 68, 68, 0.3);">
          <i class="fas fa-times"></i>
        </div>
        <h1 class="success-title">Payment Failed</h1>
        <p class="success-subtitle">We couldn't process your payment for Order <strong>#${orderData.orderNumber}</strong>.</p>
      </div>
      <div class="status-banner warning" style="background:#fee2e2; color:#991b1b; border-color:#fca5a5;">
        <i class="fas fa-exclamation-triangle" style="font-size:20px;"></i> 
        Reason: ${orderData.status.replace('_', ' ')}. Your cart has been saved so you can try again.
      </div>
      <div class="action-buttons">
        <a href="checkout.html" class="btn-primary"><i class="fas fa-redo"></i> Retry Payment</a>
        <a href="contact.html" class="btn-secondary"><i class="fas fa-headset"></i> Contact Support</a>
      </div>
    `;
    return;
  }

  // Handle Paystack payment status visual feedback
  let paymentStatusHtml = '';
  if (orderData.paymentMethod === 'paystack') {
    if (orderData.paymentVerified || orderData.status === 'paid') {
      paymentStatusHtml = `
        <div class="status-banner success">
          <i class="fas fa-check-circle" style="font-size:20px;"></i> 
          Payment successful via Paystack (${orderData.paymentChannel || 'Online'})
        </div>
      `;
    } else {
      paymentStatusHtml = `
        <div class="status-banner warning">
          <i class="fas fa-clock" style="font-size:20px;"></i> 
          Payment verification pending. We'll confirm your payment shortly.
        </div>
      `;
    }
  } else if (orderData.paymentMethod === 'pay_on_delivery') {
      paymentStatusHtml = `
        <div class="status-banner info">
          <i class="fas fa-info-circle" style="font-size:20px;"></i> 
          You chose to pay on delivery. Please have the amount ready.
        </div>
      `;
  }

  const orderHtml = `
    <div class="success-header">
      <div class="success-icon">
        <i class="fas fa-check"></i>
      </div>
      <h1 class="success-title">Order Received!</h1>
      <p class="success-subtitle">Thank you for shopping with Sile Communications. Order <strong>#${orderData.orderNumber}</strong> has been placed.</p>
    </div>

    ${paymentStatusHtml}
    
    <div class="order-summary-box">
      <h3>Order Summary</h3>
      <div class="order-summary-items">
        ${orderData.items.map(item => `
          <div class="summary-item">
            <span class="summary-item-name">${item.quantity}x ${item.name}</span>
            <span class="summary-item-price">KSh ${(item.price * item.quantity).toLocaleString()}</span>
          </div>
        `).join('')}
      </div>
      
      <div class="summary-totals">
        <div class="summary-row">
          <span>Subtotal</span>
          <span>KSh ${orderData.subtotal.toLocaleString()}</span>
        </div>
        <div class="summary-row">
          <span>Delivery (${orderData.deliveryOption})</span>
          <span>KSh ${orderData.deliveryFee.toLocaleString()}</span>
        </div>
        <div class="summary-row total">
          <span>Total</span>
          <span>KSh ${orderData.total.toLocaleString()}</span>
        </div>
      </div>
    </div>
    
    <div class="order-details-grid">
      <div class="detail-card">
        <h4><i class="fas fa-user"></i> Customer Info</h4>
        <p><strong>${orderData.customer.firstName} ${orderData.customer.lastName}</strong></p>
        <p>${orderData.customer.phone}</p>
        <p>${orderData.customer.email}</p>
      </div>
      
      <div class="detail-card">
        <h4><i class="fas fa-truck"></i> Delivery</h4>
        <p><strong>${orderData.deliveryOption}</strong></p>
        <p>${orderData.customer.area || 'Kitale CBD'}</p>
        ${orderData.notes ? `<p style="margin-top:8px;font-size:13px;color:#64748b;"><em>Note: ${orderData.notes}</em></p>` : ''}
      </div>
      
      <div class="detail-card">
        <h4><i class="fas fa-credit-card"></i> Payment</h4>
        <p><strong>${orderData.paymentLabel}</strong></p>
        <p>Status: <strong style="color:${orderData.status === 'paid' ? '#059669' : '#ca8a04'}; text-transform:uppercase;">${orderData.status.replace('_', ' ')}</strong></p>
      </div>
    </div>

    <div class="action-buttons">
      <a href="index.html" class="btn-primary"><i class="fas fa-shopping-bag"></i> Continue Shopping</a>
      <a href="contact.html" class="btn-secondary"><i class="fas fa-headset"></i> Contact Support</a>
    </div>
  `;

  document.getElementById('orderSuccessRoot').innerHTML = orderHtml;
}
