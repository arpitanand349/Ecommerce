document.addEventListener('DOMContentLoaded', async () => {
  // Enforce admin permission restrictions
  if (!window.API.isAuthenticated()) {
    window.location.href = '/login.html';
    return;
  }
  if (!window.API.isAdmin()) {
    if (window.Toast) {
      window.Toast.error('Access denied. Administrator privileges required.');
    }
    setTimeout(() => {
      window.location.href = '/index.html';
    }, 1500);
    return;
  }

  const spinner = document.getElementById('loading-spinner');
  const productsTab = document.getElementById('products-tab-content');
  const ordersTab = document.getElementById('orders-tab-content');
  const tabBtnProd = document.getElementById('tab-btn-products');
  const tabBtnOrd = document.getElementById('tab-btn-orders');

  const productsBody = document.getElementById('products-table-body');
  const ordersBody = document.getElementById('orders-table-body');

  const modal = document.getElementById('product-modal');
  const modalTitle = document.getElementById('modal-title');
  const productForm = document.getElementById('product-form');
  const closeBtn = document.getElementById('close-modal-btn');
  const openAddBtn = document.getElementById('open-add-product-btn');
  const imageHelp = document.getElementById('image-upload-help');

  let currentTab = 'products';
  let productsList = [];

  initDashboard();

  function initDashboard() {
    setupTabs();
    setupModalEvents();
    loadTabContent();
  }

  function setupTabs() {
    tabBtnProd.addEventListener('click', () => {
      if (currentTab === 'products') return;
      currentTab = 'products';
      tabBtnProd.classList.add('active');
      tabBtnOrd.classList.remove('active');
      loadTabContent();
    });

    tabBtnOrd.addEventListener('click', () => {
      if (currentTab === 'orders') return;
      currentTab = 'orders';
      tabBtnOrd.classList.add('active');
      tabBtnProd.classList.remove('active');
      loadTabContent();
    });
  }

  function loadTabContent() {
    if (currentTab === 'products') {
      productsTab.style.display = 'block';
      ordersTab.style.display = 'none';
      fetchProducts();
    } else {
      ordersTab.style.display = 'block';
      productsTab.style.display = 'none';
      fetchOrders();
    }
  }

  // --- PRODUCTS INVENTORY ACTIONS ---

  async function fetchProducts() {
    showLoading(true);
    try {
      const data = await window.API.get('/products');
      if (data && data.success) {
        productsList = data.products;
        renderProductsTable();
      }
    } catch (error) {
      if (window.Toast) {
        window.Toast.error(error.message || 'Failed to load products inventory catalog.');
      }
    } finally {
      showLoading(false);
    }
  }

  function renderProductsTable() {
    productsBody.innerHTML = '';

    if (productsList.length === 0) {
      productsBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No products registered yet.</td></tr>';
      return;
    }

    productsList.forEach(prod => {
      const tr = document.createElement('tr');
      
      tr.innerHTML = `
        <td>
          <img src="${prod.image}" alt="${prod.title}" class="table-img" onerror="this.src='https://placehold.co/60x60/1b4332/ffffff?text=${encodeURIComponent(prod.title)}'">
        </td>
        <td><strong>${prod.title}</strong></td>
        <td><span class="product-badge">${prod.category}</span></td>
        <td><strong>₹${prod.price.toFixed(2)}</strong></td>
        <td>${prod.stock} items</td>
        <td>
          <div class="table-actions">
            <button class="btn-icon btn-icon-edit edit-btn" data-id="${prod._id}" title="Edit Product">✏️</button>
            <button class="btn-icon btn-icon-delete delete-btn" data-id="${prod._id}" title="Delete Product">🗑️</button>
          </div>
        </td>
      `;

      productsBody.appendChild(tr);
    });

    bindTableActionEvents();
  }

  function bindTableActionEvents() {
    // Edit action click
    productsBody.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openEditProductModal(id);
      });
    });

    // Delete action click
    productsBody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this product? This will permanently delete product information.')) {
          deleteProduct(id);
        }
      });
    });
  }

  async function deleteProduct(id) {
    try {
      const data = await window.API.delete(`/products/${id}`);
      if (data && data.success) {
        if (window.Toast) {
          window.Toast.success('Product deleted successfully!');
        }
        fetchProducts();
      }
    } catch (error) {
      if (window.Toast) {
        window.Toast.error(error.message || 'Failed to remove product.');
      }
    }
  }

  // --- MODAL POPUP & INVENTORY FORMS ---

  function setupModalEvents() {
    openAddBtn.addEventListener('click', openAddProductModal);

    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });

    productForm.addEventListener('submit', handleProductFormSubmit);
  }

  function openAddProductModal() {
    modalTitle.textContent = 'Add New Product';
    document.getElementById('product-id').value = '';
    document.getElementById('prod-title').value = '';
    document.getElementById('prod-price').value = '';
    document.getElementById('prod-stock').value = '';
    document.getElementById('prod-category').value = '';
    document.getElementById('prod-desc').value = '';
    
    const fileInput = document.getElementById('prod-image');
    fileInput.value = '';
    fileInput.required = true;
    imageHelp.textContent = 'Please upload a product image. Required.';
    
    modal.style.display = 'flex';
  }

  function openEditProductModal(id) {
    const prod = productsList.find(p => p._id === id);
    if (!prod) return;

    modalTitle.textContent = 'Edit Product';
    document.getElementById('product-id').value = prod._id;
    document.getElementById('prod-title').value = prod.title;
    document.getElementById('prod-price').value = prod.price;
    document.getElementById('prod-stock').value = prod.stock;
    document.getElementById('prod-category').value = prod.category;
    document.getElementById('prod-desc').value = prod.description;
    
    const fileInput = document.getElementById('prod-image');
    fileInput.value = '';
    fileInput.required = false; // Optional on edit
    imageHelp.textContent = 'Leave empty to preserve existing image.';

    modal.style.display = 'flex';
  }

  async function handleProductFormSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('product-id').value;
    const title = document.getElementById('prod-title').value.trim();
    const price = document.getElementById('prod-price').value;
    const stock = document.getElementById('prod-stock').value;
    const category = document.getElementById('prod-category').value.trim();
    const description = document.getElementById('prod-desc').value.trim();
    const imageFile = document.getElementById('prod-image').files[0];

    const formData = new FormData();
    formData.append('title', title);
    formData.append('price', price);
    formData.append('stock', stock);
    formData.append('category', category);
    formData.append('description', description);
    
    if (imageFile) {
      formData.append('image', imageFile);
    }

    const saveBtn = document.getElementById('save-product-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving Product...';

    try {
      let result;
      if (id) {
        result = await window.API.put(`/products/${id}`, formData);
      } else {
        result = await window.API.post('/products', formData);
      }

      if (result && result.success) {
        if (window.Toast) {
          window.Toast.success(id ? 'Product updated successfully!' : 'Product created successfully!');
        }
        modal.style.display = 'none';
        fetchProducts();
      }
    } catch (error) {
      if (window.Toast) {
        window.Toast.error(error.message || 'Failed to save product details.');
      }
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Product';
    }
  }

  // --- ORDERS MANAGEMENT ACTIONS ---

  async function fetchOrders() {
    showLoading(true);
    try {
      const data = await window.API.get('/orders');
      if (data && data.success) {
        renderOrdersTable(data.orders);
      }
    } catch (error) {
      if (window.Toast) {
        window.Toast.error(error.message || 'Failed to load purchase orders list.');
      }
    } finally {
      showLoading(false);
    }
  }

  function renderOrdersTable(orders) {
    ordersBody.innerHTML = '';

    if (orders.length === 0) {
      ordersBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No orders placed in the system yet.</td></tr>';
      return;
    }

    orders.forEach(order => {
      const tr = document.createElement('tr');
      const customer = order.user ? `<strong>${order.user.name}</strong><br><span style="font-size:0.8rem; color:var(--text-muted);">${order.user.email}</span>` : 'Deleted Account';
      const dateStr = new Date(order.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      // Status selector
      const statuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
      let selectHtml = `<select class="admin-status-select" data-id="${order._id}">`;
      statuses.forEach(status => {
        selectHtml += `<option value="${status}" ${order.status === status ? 'selected' : ''}>${status}</option>`;
      });
      selectHtml += '</select>';

      // Items lists representation
      let itemsListHtml = '<ul style="padding-left: 12px; margin: 0; font-size: 0.85rem;">';
      order.products.forEach(p => {
        itemsListHtml += `<li>${p.title} <strong>x${p.quantity}</strong></li>`;
      });
      itemsListHtml += '</ul>';

      tr.innerHTML = `
        <td><span style="font-family: monospace; font-size: 0.8rem;">#${order._id}</span></td>
        <td>${customer}</td>
        <td>${dateStr}</td>
        <td><strong style="color: var(--primary-accent);">₹${order.totalPrice.toFixed(2)}</strong></td>
        <td>${selectHtml}</td>
        <td style="font-size: 0.85rem; max-width: 250px; overflow: hidden; text-overflow: ellipsis;">
          <strong>Items:</strong> ${itemsListHtml}<br>
          <strong>Address:</strong> ${order.shippingAddress}<br>
          <strong>Phone:</strong> ${order.phone}
        </td>
      `;

      ordersBody.appendChild(tr);
    });

    // Add change listeners for status dropdown selectors
    ordersBody.querySelectorAll('.admin-status-select').forEach(select => {
      select.addEventListener('change', async () => {
        const orderId = select.getAttribute('data-id');
        const nextStatus = select.value;
        await updateOrderStatus(orderId, nextStatus);
      });
    });
  }

  async function updateOrderStatus(orderId, status) {
    try {
      const data = await window.API.put(`/orders/${orderId}`, { status });
      if (data && data.success) {
        if (window.Toast) {
          window.Toast.success('Order status updated successfully.');
        }
        fetchOrders();
      }
    } catch (error) {
      if (window.Toast) {
        window.Toast.error(error.message || 'Failed to update order status.');
      }
      fetchOrders(); // Reset view to database state
    }
  }

  function showLoading(isLoading) {
    if (!spinner) return;
    if (isLoading) {
      spinner.style.display = 'flex';
      productsTab.style.display = 'none';
      ordersTab.style.display = 'none';
    } else {
      spinner.style.display = 'none';
    }
  }
});
