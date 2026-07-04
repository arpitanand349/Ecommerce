document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  const spinner = document.getElementById('loading-spinner');
  const detailsContainer = document.getElementById('details-container');
  const errorState = document.getElementById('error-state');

  if (!productId) {
    showError();
    return;
  }

  let product = null;
  let selectedQty = 1;

  try {
    const data = await window.API.get(`/products/${productId}`);
    if (data && data.success) {
      product = data.product;
      renderProductDetails(product);
    } else {
      showError();
    }
  } catch (error) {
    console.error('Error fetching product details:', error);
    showError();
  }

  function renderProductDetails(prod) {
    if (spinner) spinner.style.display = 'none';
    if (detailsContainer) detailsContainer.style.display = 'grid';

    document.title = `SimpleStore - ${prod.title}`;

    const img = document.getElementById('product-img');
    const title = document.getElementById('product-title');
    const category = document.getElementById('product-category');
    const price = document.getElementById('product-price');
    const desc = document.getElementById('product-desc');
    const stockBadge = document.getElementById('stock-badge');
    const addBtn = document.getElementById('add-to-cart-btn');

    img.src = prod.image;
    img.alt = prod.title;
    img.onerror = () => {
      img.src = `https://placehold.co/500x500/1b4332/ffffff?text=${encodeURIComponent(prod.title)}`;
    };

    title.textContent = prod.title;
    category.textContent = prod.category;
    price.textContent = `₹${prod.price.toFixed(2)}`;
    desc.textContent = prod.description;

    const isOutOfStock = prod.stock <= 0;
    if (isOutOfStock) {
      stockBadge.textContent = 'Out of Stock';
      stockBadge.className = 'stock-status stock-out';
      addBtn.disabled = true;
      addBtn.textContent = 'Out of Stock';
      
      document.getElementById('qty-selector-container').style.opacity = '0.5';
      document.getElementById('qty-minus').disabled = true;
      document.getElementById('qty-plus').disabled = true;
    } else {
      stockBadge.textContent = `In Stock (${prod.stock} items left)`;
      stockBadge.className = 'stock-status stock-in';
      
      setupQuantitySelector(prod.stock);
      
      addBtn.addEventListener('click', () => {
        addProductToCart(prod._id, selectedQty);
      });
    }
  }

  function setupQuantitySelector(maxStock) {
    const minusBtn = document.getElementById('qty-minus');
    const plusBtn = document.getElementById('qty-plus');
    const valDisplay = document.getElementById('qty-value');

    minusBtn.addEventListener('click', () => {
      if (selectedQty > 1) {
        selectedQty--;
        valDisplay.textContent = selectedQty;
      }
    });

    plusBtn.addEventListener('click', () => {
      if (selectedQty < maxStock) {
        selectedQty++;
        valDisplay.textContent = selectedQty;
      } else {
        if (window.Toast) {
          window.Toast.warning(`Only ${maxStock} units currently available.`);
        }
      }
    });
  }

  async function addProductToCart(productId, quantity) {
    if (!window.API.isAuthenticated()) {
      if (window.Toast) {
        window.Toast.error('Please log in to add products to your cart.');
      }
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 1500);
      return;
    }

    try {
      const data = await window.API.post('/cart/add', { productId, quantity });
      if (data && data.success) {
        if (window.Toast) {
          window.Toast.success('Cart updated successfully!');
        }
        if (window.Layout) {
          window.Layout.updateCartBadge();
        }
      }
    } catch (error) {
      if (window.Toast) {
        window.Toast.error(error.message || 'Failed to add item to cart');
      }
    }
  }

  function showError() {
    if (spinner) spinner.style.display = 'none';
    if (detailsContainer) detailsContainer.style.display = 'none';
    if (errorState) errorState.style.display = 'block';
  }
});
