/**
 * checkout.js — Sile Communications checkout page
 */
(function () {
  const authToken = localStorage.getItem('authToken');
  let cartItems = [];

  function getProductCatalog() {
    if (window.PRODUCTS?.length) return window.PRODUCTS;
    if (typeof PRODUCTS !== 'undefined' && PRODUCTS.length) return PRODUCTS;
    return [];
  }

  function normalizeItem(raw) {
    const id = Number(raw.id);
    let price = Number(raw.price ?? raw.product_price ?? 0);
    let name = raw.name || raw.product_name || 'Product';
    let image = raw.image || raw.img || 'images/no-image.png';

    const catalog = getProductCatalog();
    if (catalog.length && id) {
      const p = catalog.find((x) => Number(x.id) === id);
      if (p) {
        if (!price || price <= 0) price = Number(p.price) || 0;
        if (!name || name === 'Product') name = p.name || name;
        if (!image || image === 'images/no-image.png') image = p.image || image;
      }
    }

    return {
      id,
      name,
      price,
      image,
      quantity: Math.max(1, Number(raw.quantity) || 1),
    };
  }

  function loadCartItems() {
    const raw = JSON.parse(localStorage.getItem('sileCart') || '[]');
    cartItems = raw.map(normalizeItem).filter((i) => i.id && i.quantity > 0);
    if (cartItems.length === 0) {
      window.location.href = 'cart.html';
      return false;
    }
    localStorage.setItem('sileCart', JSON.stringify(cartItems));
    return true;
  }

  function getSubtotal() {
    return cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }

  function getPaymentMethod() {
    return document.querySelector('.pay-method-card.active')?.dataset.payment || 'mpesa';
  }

  function getDeliveryFee() {
    const payment = getPaymentMethod();
    if (payment === 'pickup') return 0;
    const zone = document.getElementById('deliveryZone');
    const opt = zone?.options[zone.selectedIndex];
    return parseInt(opt?.getAttribute('data-fee') || '0', 10);
  }

  function getDeliveryLabel() {
    if (getPaymentMethod() === 'pickup') {
      return 'Shop pickup — Sky Plaza, Kenyatta Street, Kitale (Free)';
    }
    const zone = document.getElementById('deliveryZone');
    return zone?.options[zone.selectedIndex]?.text || 'Delivery';
  }

  function formatMoney(amount) {
    return `KSh ${Number(amount || 0).toLocaleString()}`;
  }

  function renderOrderSummary() {
    const container = document.getElementById('orderItemsList');
    if (!container) return;

    const subtotal = getSubtotal();
    container.innerHTML = cartItems
      .map(
        (item) => `
      <div class="checkout-order-item">
        <img src="${item.image}" alt="" onerror="this.src='images/no-image.png'">
        <div class="checkout-order-item-info">
          <strong>${item.name}</strong>
          <span>Qty ${item.quantity} × ${formatMoney(item.price)}</span>
        </div>
        <div class="checkout-order-item-price">${formatMoney(item.price * item.quantity)}</div>
      </div>`,
      )
      .join('');

    document.getElementById('checkoutSubtotal').textContent = formatMoney(subtotal);
    updateTotals();
    document.getElementById('summaryItemCount').textContent =
      `${cartItems.reduce((s, i) => s + i.quantity, 0)} item(s)`;
  }

  function updateTotals() {
    const subtotal = getSubtotal();
    const deliveryFee = getDeliveryFee();
    const deliveryEl = document.getElementById('checkoutDelivery');
    const totalEl = document.getElementById('checkoutTotal');

    if (deliveryEl) {
      deliveryEl.textContent = deliveryFee === 0 ? 'Free' : formatMoney(deliveryFee);
    }
    if (totalEl) {
      totalEl.textContent = formatMoney(subtotal + deliveryFee);
    }
    const modalAmount = document.getElementById('mpesaModalAmount');
    if (modalAmount) modalAmount.textContent = formatMoney(subtotal + deliveryFee);
  }

  function syncPaymentCards() {
    const payment = getPaymentMethod();
    document.querySelectorAll('.pay-method-card').forEach((card) => {
      card.classList.toggle('active', card.dataset.payment === payment);
    });
    document.getElementById('deliveryZoneWrap')?.classList.toggle(
      'visible',
      payment === 'mpesa' || payment === 'cod',
    );
    document.getElementById('mpesaPayHint')?.classList.toggle('visible', payment === 'mpesa');
  }

  function selectPayment(method) {
    document.querySelectorAll('.pay-method-card').forEach((card) => {
      card.classList.toggle('active', card.dataset.payment === method);
    });
    syncPaymentCards();
    updateTotals();
    if (method === 'mpesa') openMpesaModal();
  }

  function openMpesaModal() {
    const subtotal = getSubtotal();
    if (subtotal <= 0) return;
    const phone = document.getElementById('phone')?.value.trim();
    const mpesaInput = document.getElementById('mpesaPhone');
    if (mpesaInput && !mpesaInput.value.trim() && phone) mpesaInput.value = phone;
    document.getElementById('mpesaModal')?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMpesaModal() {
    document.getElementById('mpesaModal')?.classList.remove('active');
    document.body.style.overflow = '';
  }

  function normalizeMpesaPhone(raw) {
    let p = String(raw).replace(/\D/g, '');
    if (p.startsWith('0')) p = '254' + p.slice(1);
    if (p.length === 9) p = '254' + p;
    return p;
  }

  function validateMpesaPhone(raw) {
    return /^2547\d{8}$/.test(normalizeMpesaPhone(raw));
  }

  async function initiateMpesaPayment() {
    const statusEl = document.getElementById('mpesaStatus');
    const phoneRaw = document.getElementById('mpesaPhone')?.value.trim();
    const btn = document.getElementById('initiateMpesaBtn');

    if (!phoneRaw) {
      statusEl.textContent = 'Please enter your M-PESA phone number.';
      statusEl.className = 'mpesa-status error';
      return;
    }
    if (!validateMpesaPhone(phoneRaw)) {
      statusEl.textContent = 'Enter a valid Safaricom number (07XX XXX XXX).';
      statusEl.className = 'mpesa-status error';
      return;
    }

    const amount = getSubtotal() + getDeliveryFee();
    const phone = normalizeMpesaPhone(phoneRaw);
    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Sending…';

    try {
      const res = await fetch(`${window.API_BASE}/payments/mpesa/stk-push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          phone,
          amount,
          accountReference: 'SILE-CHECKOUT',
          transactionDesc: 'Sile Communications order payment',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        statusEl.textContent =
          data.message || 'STK push sent. Enter your M-PESA PIN on your phone.';
        statusEl.className = 'mpesa-status success';
        sessionStorage.setItem('sileMpesaPending', JSON.stringify({ phone, amount }));
      } else {
        const data = await res.json().catch(() => ({}));
        statusEl.textContent = data.error || 'Could not start payment. Try again.';
        statusEl.className = 'mpesa-status error';
      }
    } catch (e) {
      statusEl.textContent =
        'M-PESA will connect when the backend is ready. You can still place your order.';
      statusEl.className = 'mpesa-status info';
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  }

  async function placeOrder(e) {
    e.preventDefault();
    const msgDiv = document.getElementById('checkoutMessage');
    msgDiv.className = 'message';
    msgDiv.style.display = 'none';

    if (!authToken) {
      msgDiv.textContent = 'Please log in to place an order. Redirecting…';
      msgDiv.className = 'message error';
      msgDiv.style.display = 'block';
      setTimeout(() => (window.location.href = 'login.html'), 2000);
      return;
    }

    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    const town = document.getElementById('town').value.trim();
    const paymentMethod = getPaymentMethod();
    const mpesaPhone = document.getElementById('mpesaPhone')?.value.trim();
    const notes = document.getElementById('notes').value;
    const termsChecked = document.getElementById('termsCheckbox').checked;

    if (!firstName || !lastName || !phone || !email || !town) {
      msgDiv.textContent = 'Please fill all required fields.';
      msgDiv.className = 'message error';
      msgDiv.style.display = 'block';
      return;
    }

    const subtotal = getSubtotal();
    if (subtotal <= 0) {
      msgDiv.textContent = 'Your cart total is invalid. Please return to cart and try again.';
      msgDiv.className = 'message error';
      msgDiv.style.display = 'block';
      return;
    }

    if (paymentMethod === 'mpesa' && mpesaPhone && !validateMpesaPhone(mpesaPhone)) {
      msgDiv.textContent = 'Please enter a valid M-PESA phone number.';
      msgDiv.className = 'message error';
      msgDiv.style.display = 'block';
      return;
    }

    if (!termsChecked) {
      msgDiv.textContent = 'You must agree to the terms and conditions.';
      msgDiv.className = 'message error';
      msgDiv.style.display = 'block';
      return;
    }

    const deliveryFee = getDeliveryFee();
    const total = subtotal + deliveryFee;
    const fulfillment = paymentMethod === 'pickup' ? 'pickup' : 'delivery';
    const paymentLabels = {
      cod: 'Cash on Delivery',
      mpesa: 'M-PESA',
      pickup: 'Pay at Shop (Pickup)',
    };

    const orderData = {
      customer: { firstName, lastName, phone, email, town },
      fulfillment,
      delivery: { option: getDeliveryLabel(), fee: deliveryFee },
      paymentMethod,
      paymentLabel: paymentLabels[paymentMethod],
      mpesaPhone: paymentMethod === 'mpesa' ? normalizeMpesaPhone(mpesaPhone || phone) : null,
      notes,
      items: cartItems.map((i) => ({
        productId: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        subtotal: i.price * i.quantity,
      })),
      total,
    };

    const btn = document.getElementById('placeOrderBtn');
    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Processing…';

    try {
      const res = await fetch(`${window.API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(orderData),
      });
      const data = await res.json();

      if (res.ok) {
        const orderNumber = data.orderNumber;
        sessionStorage.setItem(
          'sileLastOrder',
          JSON.stringify({
            orderNumber,
            items: cartItems,
            subtotal,
            deliveryFee,
            total,
            customer: orderData.customer,
            fulfillment,
            deliveryOption: getDeliveryLabel(),
            paymentMethod,
            paymentLabel: paymentLabels[paymentMethod],
            mpesaPhone: orderData.mpesaPhone,
            notes,
            date: new Date().toISOString(),
          }),
        );
        localStorage.removeItem('sileCart');
        window.location.href = `order-success.html?order=${orderNumber}`;
      } else {
        msgDiv.textContent = data.error || 'Order failed. Please try again.';
        msgDiv.className = 'message error';
        msgDiv.style.display = 'block';
        btn.disabled = false;
        btn.innerHTML = originalHtml;
      }
    } catch (err) {
      console.error(err);
      msgDiv.textContent = 'Server error. Please ensure the backend is running.';
      msgDiv.className = 'message error';
      msgDiv.style.display = 'block';
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  }

  function prefillUser() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) return;
    if (user.firstName) document.getElementById('firstName').value = user.firstName;
    if (user.lastName) document.getElementById('lastName').value = user.lastName;
    if (user.phone) document.getElementById('phone').value = user.phone;
    if (user.email) document.getElementById('email').value = user.email;
  }

  function bindEvents() {
    document.querySelectorAll('.pay-method-card').forEach((card) => {
      card.addEventListener('click', () => selectPayment(card.dataset.payment));
    });

    document.getElementById('deliveryZone')?.addEventListener('change', updateTotals);
    document.getElementById('openMpesaBtn')?.addEventListener('click', openMpesaModal);
    document.getElementById('initiateMpesaBtn')?.addEventListener('click', initiateMpesaPayment);
    document.getElementById('placeOrderBtn')?.addEventListener('click', placeOrder);

    document.getElementById('closeMpesaModal')?.addEventListener('click', closeMpesaModal);
    document.getElementById('mpesaModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'mpesaModal') closeMpesaModal();
    });

    document.getElementById('phone')?.addEventListener('blur', () => {
      const mpesaEl = document.getElementById('mpesaPhone');
      const phoneEl = document.getElementById('phone');
      if (mpesaEl && phoneEl && !mpesaEl.value.trim()) mpesaEl.value = phoneEl.value;
    });
  }

  function init() {
    if (!loadCartItems()) return;
    renderOrderSummary();
    syncPaymentCards();
    prefillUser();
    bindEvents();
    if (typeof updateCartUI === 'function') updateCartUI();
  }

  function refreshCartFromCatalog() {
    const raw = JSON.parse(localStorage.getItem('sileCart') || '[]');
    cartItems = raw.map(normalizeItem).filter((i) => i.id && i.quantity > 0);
    if (cartItems.length) {
      localStorage.setItem('sileCart', JSON.stringify(cartItems));
      renderOrderSummary();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('productsLoaded', refreshCartFromCatalog);
})();
