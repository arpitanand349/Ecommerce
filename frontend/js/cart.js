document.addEventListener('DOMContentLoaded', async () => {
  // Enforce authentication check
  if (!window.API.isAuthenticated()) {
    window.location.href = '/login.html';
    return;
  }

  const spinner = document.getElementById('loading-spinner');
  const cartGrid = document.getElementById('cart-grid');
  const emptyState = document.getElementById('empty-cart-state');
  const itemsList = document.getElementById('cart-items-list');

  let cart = null;

  try {
    await fetchCart();
  } catch (error) {
    console.error('Failed to load cart view:', error);
  }

  async function fetchCart() {
    showLoading(true);
    try {
      const data = await window.API.get('/cart');
      if (data && data.success) {
        cart = data.cart;
        renderCart();
      }
    } catch (error) {
      if (window.Toast) {
        window.Toast.error(error.message || 'Failed to retrieve cart items');
      }
    } finally {
      showLoading(false);
    }
  }

  function renderCart() {
    if (!cart || cart.products.length === 0) {
      if (cartGrid) cartGrid.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (cartGrid) cartGrid.style.display = 'grid';

    // Show distinct items count
    const distinctCount = cart.products.length;
    document.getElementById('cart-items-count').textContent = `${distinctCount} Product${distinctCount > 1 ? 's' : ''}`;

    itemsList.innerHTML = '';

    cart.products.forEach(item => {
      const product = item.product;
      if (!product) return;

      const itemDiv = document.createElement('div');
      itemDiv.className = 'cart-item';
      
      itemDiv.innerHTML = `
        <img src="${window.API.resolveImageUrl(product.image)}" alt="${product.title}" class="cart-item-img" onerror="this.src='https://placehold.co/150x150/1b4332/ffffff?text=${encodeURIComponent(product.title)}'">
        <div class="cart-item-details">
          <span class="cart-item-category">${product.category}</span>
          <h3 class="cart-item-title"><a href="/product.html?id=${product._id}">${product.title}</a></h3>
          <span class="cart-item-price">₹${product.price.toFixed(2)}</span>
        </div>
        <div class="cart-item-qty">
          <button class="cart-qty-btn qty-minus" data-id="${product._id}">−</button>
          <span class="cart-qty-val">${item.quantity}</span>
          <button class="cart-qty-btn qty-plus" data-id="${product._id}" data-stock="${product.stock}">+</button>
        </div>
        <div style="font-weight: 700; min-width: 80px; text-align: right; color: var(--primary-accent);">
          ₹${(product.price * item.quantity).toFixed(2)}
        </div>
        <button class="cart-item-remove" data-id="${product._id}">Remove</button>
      `;

      itemsList.appendChild(itemDiv);
    });

    // Update estimated prices
    document.getElementById('summary-subtotal').textContent = `₹${cart.totalPrice.toFixed(2)}`;
    document.getElementById('summary-total').textContent = `₹${cart.totalPrice.toFixed(2)}`;

    bindControls();
  }

  function bindControls() {
    // Quantity subtraction
    itemsList.querySelectorAll('.qty-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        const productId = btn.getAttribute('data-id');
        const valSpan = btn.nextElementSibling;
        const currentVal = parseInt(valSpan.textContent);
        if (currentVal > 1) {
          updateQuantity(productId, currentVal - 1);
        }
      });
    });

    // Quantity addition (with stock bound check)
    itemsList.querySelectorAll('.qty-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const productId = btn.getAttribute('data-id');
        const maxStock = parseInt(btn.getAttribute('data-stock'));
        const valSpan = btn.previousElementSibling;
        const currentVal = parseInt(valSpan.textContent);
        if (currentVal < maxStock) {
          updateQuantity(productId, currentVal + 1);
        } else {
          if (window.Toast) {
            window.Toast.warning(`Only ${maxStock} units currently available in stock.`);
          }
        }
      });
    });

    // Remove buttons
    itemsList.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const productId = btn.getAttribute('data-id');
        removeItem(productId);
      });
    });

    // Checkout button redirect
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.onclick = () => {
        window.location.href = '/checkout.html';
      };
    }
  }

  async function updateQuantity(productId, quantity) {
    try {
      const data = await window.API.put('/cart/update', { productId, quantity });
      if (data && data.success) {
        cart = data.cart;
        renderCart();
        if (window.Layout) {
          window.Layout.updateCartBadge();
        }
      }
    } catch (error) {
      if (window.Toast) {
        window.Toast.error(error.message || 'Failed to update quantity');
      }
    }
  }

  async function removeItem(productId) {
    try {
      const data = await window.API.delete(`/cart/remove/${productId}`);
      if (data && data.success) {
        cart = data.cart;
        renderCart();
        if (window.Toast) {
          window.Toast.success('Product removed from cart');
        }
        if (window.Layout) {
          window.Layout.updateCartBadge();
        }
      }
    } catch (error) {
      if (window.Toast) {
        window.Toast.error(error.message || 'Failed to remove item');
      }
    }
  }

  function showLoading(isLoading) {
    if (!spinner) return;
    if (isLoading) {
      spinner.style.display = 'flex';
      if (cartGrid) cartGrid.style.display = 'none';
      if (emptyState) emptyState.style.display = 'none';
    } else {
      spinner.style.display = 'none';
    }
  }
});
