document.addEventListener('DOMContentLoaded', async () => {
  // Enforce authentication check
  if (!window.API.isAuthenticated()) {
    window.location.href = '/login.html';
    return;
  }

  const spinner = document.getElementById('loading-spinner');
  const checkoutGrid = document.getElementById('checkout-grid');
  const emptyState = document.getElementById('empty-checkout-state');
  const itemsSummary = document.getElementById('checkout-items-summary');
  const checkoutForm = document.getElementById('checkout-form');
  const placeOrderBtn = document.getElementById('place-order-btn');

  let cart = null;

  try {
    await fetchCheckoutDetails();
  } catch (error) {
    console.error('Checkout fetch details error:', error);
  }

  async function fetchCheckoutDetails() {
    if (spinner) spinner.style.display = 'flex';
    try {
      const data = await window.API.get('/cart');
      if (data && data.success) {
        cart = data.cart;
        renderCheckout();
      }
    } catch (error) {
      if (window.Toast) {
        window.Toast.error(error.message || 'Failed to retrieve shopping cart items');
      }
    } finally {
      if (spinner) spinner.style.display = 'none';
    }
  }

  function renderCheckout() {
    if (!cart || cart.products.length === 0) {
      if (checkoutGrid) checkoutGrid.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (checkoutGrid) checkoutGrid.style.display = 'grid';

    itemsSummary.innerHTML = '';

    cart.products.forEach(item => {
      const product = item.product;
      if (!product) return;

      const itemRow = document.createElement('div');
      itemRow.style.display = 'flex';
      itemRow.style.justifyContent = 'space-between';
      itemRow.style.fontSize = '0.9rem';
      itemRow.style.color = 'var(--text-muted)';
      
      itemRow.innerHTML = `
        <span style="max-width: 70%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${product.title} <strong>x ${item.quantity}</strong>
        </span>
        <span style="font-weight: 600; color: var(--text-main);">₹${(product.price * item.quantity).toFixed(2)}</span>
      `;
      itemsSummary.appendChild(itemRow);
    });

    document.getElementById('checkout-subtotal').textContent = `₹${cart.totalPrice.toFixed(2)}`;
    document.getElementById('checkout-total').textContent = `₹${cart.totalPrice.toFixed(2)}`;

    checkoutForm.addEventListener('submit', handlePlaceOrder);
  }

  async function handlePlaceOrder(e) {
    e.preventDefault();

    const address = document.getElementById('address').value.trim();
    const phone = document.getElementById('phone').value.trim();

    if (!address || !phone) {
      if (window.Toast) {
        window.Toast.error('Please enter a shipping address and phone number.');
      }
      return;
    }

    // Validate Indian (+91) phone format
    const cleanPhone = phone.replace(/[\s\-()]+/g, '');
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      if (window.Toast) {
        window.Toast.error('Please enter a valid Indian phone number starting with +91 (e.g., +91 98765 43210).');
      }
      return;
    }

    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = 'Processing Order...';

    try {
      const data = await window.API.post('/orders', {
        shippingAddress: address,
        phone,
        paymentMethod: 'Cash on Delivery'
      });

      if (data && data.success) {
        if (window.Toast) {
          window.Toast.success('Order placed successfully! Thank you for purchasing.');
        }
        if (window.Layout) {
          window.Layout.updateCartBadge();
        }
        
        setTimeout(() => {
          window.location.href = '/orders.html';
        }, 1500);
      }
    } catch (error) {
      if (window.Toast) {
        window.Toast.error(error.message || 'Failed to complete order. Please try again.');
      }
      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = 'Place Order (Cash on Delivery)';
    }
  }
});
