document.addEventListener('DOMContentLoaded', async () => {
  // Enforce authentication check
  if (!window.API.isAuthenticated()) {
    window.location.href = '/login.html';
    return;
  }

  const spinner = document.getElementById('loading-spinner');
  const ordersList = document.getElementById('orders-list');
  const emptyState = document.getElementById('empty-orders-state');

  try {
    await fetchOrders();
  } catch (error) {
    console.error('Error in fetching orders list:', error);
  }

  async function fetchOrders() {
    if (spinner) spinner.style.display = 'flex';
    try {
      const data = await window.API.get('/orders/myorders');
      if (data && data.success) {
        renderOrders(data.orders);
      }
    } catch (error) {
      if (window.Toast) {
        window.Toast.error(error.message || 'Failed to load order history');
      }
    } finally {
      if (spinner) spinner.style.display = 'none';
    }
  }

  function renderOrders(orders) {
    if (!orders || orders.length === 0) {
      if (ordersList) ordersList.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (ordersList) ordersList.style.display = 'flex';

    ordersList.innerHTML = '';

    orders.forEach(order => {
      const card = document.createElement('div');
      card.className = 'order-card';

      const dateStr = new Date(order.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Map status names to class styles
      let statusClass = 'status-pending';
      if (order.status === 'Processing') statusClass = 'status-processing';
      else if (order.status === 'Shipped') statusClass = 'status-shipped';
      else if (order.status === 'Delivered') statusClass = 'status-delivered';
      else if (order.status === 'Cancelled') statusClass = 'status-cancelled';

      // Assemble bought products html
      let productsHtml = '';
      order.products.forEach(item => {
        productsHtml += `
          <div class="order-product-item">
            <span class="order-product-name">${item.title}</span>
            <span class="order-product-qty-price">${item.quantity} x ₹${item.price.toFixed(2)}</span>
          </div>
        `;
      });

      card.innerHTML = `
        <div class="order-header-info">
          <div class="order-meta-item">
            <span class="order-meta-label">Order ID</span>
            <span class="order-meta-value" style="font-family: monospace; font-size: 0.85rem;">#${order._id}</span>
          </div>
          <div class="order-meta-item">
            <span class="order-meta-label">Date Placed</span>
            <span class="order-meta-value">${dateStr}</span>
          </div>
          <div class="order-meta-item">
            <span class="order-meta-label">Total Amount</span>
            <span class="order-meta-value" style="color: var(--primary-accent);">₹${order.totalPrice.toFixed(2)}</span>
          </div>
          <div class="order-meta-item" style="justify-content: center; align-items: center; display: flex;">
            <span class="status-badge ${statusClass}">${order.status}</span>
          </div>
        </div>
        <div class="order-body">
          <div class="order-products-list">
            ${productsHtml}
          </div>
          <div class="order-address-phone">
            <div>
              <strong>Shipping Address:</strong><br>
              ${order.shippingAddress}
            </div>
            <div>
              <strong>Contact Phone:</strong><br>
              ${order.phone}
            </div>
          </div>
        </div>
      `;

      ordersList.appendChild(card);
    });
  }
});
