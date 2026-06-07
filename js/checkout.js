/**
 * checkout.js - Sile Communications checkout page
 */
(function () {
  const authToken = localStorage.getItem('authToken') || localStorage.getItem('token');
  let cartItems = [];
  let deliveryEstimate = {
    option: 'kitale_cbd',
    label: 'Kitale CBD delivery',
    area: 'Kitale CBD',
    fee: 0,
  };
  let isCalculatingDelivery = false;

  function getProductCatalog() {
    if (window.PRODUCTS?.length) return window.PRODUCTS;
    if (typeof PRODUCTS !== 'undefined' && PRODUCTS.length) return PRODUCTS;
    return [];
  }

  function normalizeItem(raw) {
    const id = Number(raw.id || raw.productId);
    let price = Number(raw.price ?? raw.product_price ?? 0);
    let name = raw.name || raw.product_name || 'Product';
    let image = raw.image || raw.img || 'images/no-image.png';

    const catalog = getProductCatalog();
    if (catalog.length && id) {
      const product = catalog.find((x) => Number(x.id) === id);
      if (product) {
        if (!price || price <= 0) price = Number(product.price) || 0;
        if (!name || name === 'Product') name = product.name || name;
        if (!image || image === 'images/no-image.png') image = product.image || image;
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
    cartItems = raw.map(normalizeItem).filter((item) => item.id && item.quantity > 0);
    if (cartItems.length === 0) {
      window.location.href = 'cart.html';
      return false;
    }
    localStorage.setItem('sileCart', JSON.stringify(cartItems));
    return true;
  }

  function getSubtotal() {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  function getPaymentMethod() {
    return document.querySelector('.pay-method-card.active[data-payment]')?.dataset.payment || 'mpesa';
  }

  function getDeliveryMethod() {
    return document.querySelector('.pay-method-card.active[data-delivery]')?.dataset.delivery || 'kitale_cbd';
  }

  function getDeliveryFee() {
    return Number(deliveryEstimate.fee) || 0;
  }

  function getDeliveryArea() {
    return getDeliveryMethod() === 'kitale_cbd'
      ? 'Kitale CBD'
      : document.getElementById('town')?.value.trim();
  }

  function getDeliveryLabel() {
    if (getDeliveryMethod() === 'kitale_cbd') return 'Kitale CBD - Free';
    return `${deliveryEstimate.label || 'Outside Kitale delivery'} - ${formatMoney(getDeliveryFee())}`;
  }

  function formatMoney(amount) {
    return `KSh ${Number(amount || 0).toLocaleString()}`;
  }

  function renderOrderSummary() {
    const container = document.getElementById('orderItemsList');
    if (!container) return;

    container.innerHTML = cartItems
      .map(
        (item) => `
      <div class="checkout-order-item">
        <img src="${item.image}" alt="" onerror="this.src='images/no-image.png'">
        <div class="checkout-order-item-info">
          <strong>${item.name}</strong>
          <span>Qty ${item.quantity} x ${formatMoney(item.price)}</span>
        </div>
        <div class="checkout-order-item-price">${formatMoney(item.price * item.quantity)}</div>
      </div>`,
      )
      .join('');

    document.getElementById('checkoutSubtotal').textContent = formatMoney(getSubtotal());
    document.getElementById('summaryItemCount').textContent =
      `${cartItems.reduce((sum, item) => sum + item.quantity, 0)} item(s)`;
    updateTotals();
  }

  function updateTotals() {
    const subtotal = getSubtotal();
    const deliveryFee = getDeliveryFee();
    const deliveryEl = document.getElementById('checkoutDelivery');
    const totalEl = document.getElementById('checkoutTotal');
    const modalAmount = document.getElementById('mpesaModalAmount');

    if (deliveryEl) deliveryEl.textContent = deliveryFee === 0 ? 'Free' : formatMoney(deliveryFee);
    if (totalEl) totalEl.textContent = formatMoney(subtotal + deliveryFee);
    if (modalAmount) modalAmount.textContent = formatMoney(subtotal + deliveryFee);

    const placeOrderBtn = document.getElementById('placeOrderBtn');
    if (placeOrderBtn) placeOrderBtn.disabled = isCalculatingDelivery;
  }

  function setDeliveryMessage(message, type = '') {
    const el = document.getElementById('deliveryEstimateMessage');
    if (!el) return;
    el.textContent = message;
    el.className = `delivery-estimate-message${type ? ` ${type}` : ''}`;
  }

  function setCheckoutMessage(message, type) {
    const msgDiv = document.getElementById('checkoutMessage');
    msgDiv.textContent = message;
    msgDiv.className = `message ${type}`;
    msgDiv.style.display = 'block';
  }

  async function calculateDeliveryFee() {
    const method = getDeliveryMethod();

    if (method === 'kitale_cbd') {
      deliveryEstimate = {
        option: 'kitale_cbd',
        label: 'Kitale CBD delivery',
        area: 'Kitale CBD',
        fee: 0,
      };
      document.getElementById('outsideDeliveryText').textContent = 'Calculated by area';
      setDeliveryMessage('Kitale CBD delivery is free.', 'success');
      updateTotals();
      return true;
    }

    const area = getDeliveryArea();
    if (!area) {
      deliveryEstimate = {
        option: 'outside_kitale',
        label: 'Outside Kitale delivery',
        area: '',
        fee: 0,
      };
      document.getElementById('outsideDeliveryText').textContent = 'Calculated by area';
      setDeliveryMessage('Enter the customer area to calculate shipping.', 'error');
      updateTotals();
      return false;
    }

    isCalculatingDelivery = true;
    const calculateBtn = document.getElementById('calculateDeliveryBtn');
    const originalHtml = calculateBtn?.innerHTML;
    if (calculateBtn) {
      calculateBtn.disabled = true;
      calculateBtn.innerHTML = '<span class="spinner"></span> Checking';
    }
    setDeliveryMessage('Checking delivery charge...', '');
    updateTotals();

    try {
      const response = await fetch(`${window.API_BASE}/orders/delivery-estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option: method, area }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not calculate delivery fee.');

      deliveryEstimate = data;
      document.getElementById('outsideDeliveryText').textContent = formatMoney(data.fee);
      setDeliveryMessage(`Shipping fee: ${formatMoney(data.fee)}`, 'success');
      updateTotals();
      return true;
    } catch (error) {
      deliveryEstimate = {
        option: 'outside_kitale',
        label: 'Outside Kitale delivery',
        area,
        fee: 0,
      };
      document.getElementById('outsideDeliveryText').textContent = 'Calculated by area';
      setDeliveryMessage(error.message, 'error');
      updateTotals();
      return false;
    } finally {
      isCalculatingDelivery = false;
      if (calculateBtn) {
        calculateBtn.disabled = false;
        calculateBtn.innerHTML = originalHtml;
      }
      updateTotals();
    }
  }

  function syncPaymentCards() {
    const payment = getPaymentMethod();
    document.querySelectorAll('.pay-method-card[data-payment]').forEach((card) => {
      card.classList.toggle('active', card.dataset.payment === payment);
    });
    document.getElementById('mpesaPayHint')?.classList.toggle('visible', payment === 'mpesa');
  }

  function selectPayment(method) {
    document.querySelectorAll('.pay-method-card[data-payment]').forEach((card) => {
      card.classList.toggle('active', card.dataset.payment === method);
    });
    syncPaymentCards();
    updateTotals();
  }

  function syncDeliveryCards() {
    const delivery = getDeliveryMethod();
    document.querySelectorAll('.pay-method-card[data-delivery]').forEach((card) => {
      card.classList.toggle('active', card.dataset.delivery === delivery);
    });
    document.getElementById('deliveryZoneWrap')?.classList.toggle('visible', delivery === 'outside_kitale');
  }

  function selectDelivery(method) {
    document.querySelectorAll('.pay-method-card[data-delivery]').forEach((card) => {
      card.classList.toggle('active', card.dataset.delivery === method);
    });
    syncDeliveryCards();
    calculateDeliveryFee();
  }

  function normalizeMpesaPhone(raw) {
    let phone = String(raw).replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '254' + phone.slice(1);
    if (phone.length === 9) phone = '254' + phone;
    return phone;
  }

  function validateMpesaPhone(raw) {
    return /^2547\d{8}$/.test(normalizeMpesaPhone(raw));
  }

  function paymentLabel(method) {
    return method === 'mpesa' ? 'Pay now with M-PESA' : 'Pay on delivery';
  }

  function buildSessionOrder(data, orderData) {
    const serverOrder = data.order || {};
    return {
      orderNumber: data.orderNumber || serverOrder.orderNumber,
      items: cartItems,
      subtotal: getSubtotal(),
      deliveryFee: serverOrder.delivery?.fee ?? getDeliveryFee(),
      total: serverOrder.total ?? getSubtotal() + getDeliveryFee(),
      customer: orderData.customer,
      fulfillment: 'delivery',
      deliveryOption: getDeliveryLabel(),
      paymentMethod: orderData.paymentMethod,
      paymentLabel: paymentLabel(orderData.paymentMethod),
      mpesaPhone: orderData.paymentMethod === 'mpesa' ? normalizeMpesaPhone(orderData.customer.phone) : null,
      status: serverOrder.status || (orderData.paymentMethod === 'mpesa' ? 'pending_payment' : 'pending'),
      notes: orderData.notes,
      date: new Date().toISOString(),
    };
  }

  async function postOrder(orderData, includeToken = true) {
    const headers = { 'Content-Type': 'application/json' };
    if (includeToken && authToken) headers.Authorization = `Bearer ${authToken}`;

    const response = await fetch(`${window.API_BASE}/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(orderData),
    });
    const data = await response.json();
    return { response, data };
  }

  async function placeOrder(e) {
    e.preventDefault();
    const msgDiv = document.getElementById('checkoutMessage');
    msgDiv.className = 'message';
    msgDiv.style.display = 'none';

    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    const deliveryMethod = getDeliveryMethod();
    const town = getDeliveryArea();
    const paymentMethod = getPaymentMethod();
    const notes = document.getElementById('notes').value;
    const termsChecked = document.getElementById('termsCheckbox').checked;

    if (!firstName || !lastName || !phone || !email) {
      setCheckoutMessage('Please fill all customer details.', 'error');
      return;
    }

    if (paymentMethod === 'mpesa' && !validateMpesaPhone(phone)) {
      setCheckoutMessage('Enter a valid Safaricom number for M-PESA payment.', 'error');
      return;
    }

    if (!termsChecked) {
      setCheckoutMessage('You must agree to the terms and conditions.', 'error');
      return;
    }

    const deliveryReady = await calculateDeliveryFee();
    if (!deliveryReady) return;

    const subtotal = getSubtotal();
    if (subtotal <= 0) {
      setCheckoutMessage('Your cart total is invalid. Please return to cart and try again.', 'error');
      return;
    }

    const orderData = {
      customer: { firstName, lastName, phone, email, town, area: town },
      delivery: { option: deliveryMethod, area: town },
      paymentMethod,
      paymentLabel: paymentLabel(paymentMethod),
      notes,
      items: cartItems.map((item) => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
      })),
      total: subtotal + getDeliveryFee(),
    };

    const btn = document.getElementById('placeOrderBtn');
    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Processing order';

    try {
      let { response, data } = await postOrder(orderData, true);
      if (!response.ok && authToken && response.status === 403) {
        ({ response, data } = await postOrder(orderData, false));
      }

      if (response.ok) {
        const sessionOrder = buildSessionOrder(data, orderData);
        sessionStorage.setItem('sileLastOrder', JSON.stringify(sessionOrder));
        localStorage.removeItem('sileCart');
        window.location.href = `order-success.html?order=${encodeURIComponent(sessionOrder.orderNumber)}`;
      } else {
        setCheckoutMessage(data.error || 'Order failed. Please try again.', 'error');
        btn.disabled = false;
        btn.innerHTML = originalHtml;
      }
    } catch (err) {
      console.error(err);
      setCheckoutMessage('Server error. Please ensure the backend is running.', 'error');
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

  function debounce(fn, delay) {
    let timer;
    return function (...args) {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function bindEvents() {
    document.querySelectorAll('.pay-method-card[data-payment]').forEach((card) => {
      card.addEventListener('click', () => selectPayment(card.dataset.payment));
    });

    document.querySelectorAll('.pay-method-card[data-delivery]').forEach((card) => {
      card.addEventListener('click', () => selectDelivery(card.dataset.delivery));
    });

    document.getElementById('calculateDeliveryBtn')?.addEventListener('click', calculateDeliveryFee);
    document.getElementById('town')?.addEventListener('input', debounce(() => {
      if (getDeliveryMethod() === 'outside_kitale') calculateDeliveryFee();
    }, 700));
    document.getElementById('placeOrderBtn')?.addEventListener('click', placeOrder);
  }

  function init() {
    if (!loadCartItems()) return;
    renderOrderSummary();
    syncPaymentCards();
    syncDeliveryCards();
    calculateDeliveryFee();
    prefillUser();
    bindEvents();
    if (typeof updateCartUI === 'function') updateCartUI();
  }

  function refreshCartFromCatalog() {
    const raw = JSON.parse(localStorage.getItem('sileCart') || '[]');
    cartItems = raw.map(normalizeItem).filter((item) => item.id && item.quantity > 0);
    if (cartItems.length) {
      localStorage.setItem('sileCart', JSON.stringify(cartItems));
      renderOrderSummary();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('productsLoaded', refreshCartFromCatalog);
})();
