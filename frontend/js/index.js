const ProductCatalog = {
  products: [],
  selectedCategory: 'All',
  searchQuery: '',

  async fetchProducts() {
    this.showLoading(true);
    try {
      let endpoint = `/products?search=${encodeURIComponent(this.searchQuery)}`;
      if (this.selectedCategory && this.selectedCategory !== 'All') {
        endpoint += `&category=${encodeURIComponent(this.selectedCategory)}`;
      }

      const data = await window.API.get(endpoint);
      if (data && data.success) {
        this.products = data.products;
        this.renderProducts();
        
        // Render category chips once based on initially loaded product list
        const container = document.getElementById('categories-container');
        // Only rebuild chips if we have chips besides the default 'All'
        if (container && container.children.length <= 1) {
          this.renderCategoryChips();
        }
      }
    } catch (error) {
      if (window.Toast) {
        window.Toast.error(error.message || 'Failed to load products');
      }
    } finally {
      this.showLoading(false);
    }
  },

  renderProducts() {
    const grid = document.getElementById('products-grid');
    const emptyState = document.getElementById('empty-state');

    if (!grid) return;

    grid.innerHTML = '';

    if (this.products.length === 0) {
      grid.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    grid.style.display = 'grid';

    this.products.forEach(product => {
      const card = document.createElement('div');
      card.className = 'product-card';
      
      const isOutOfStock = product.stock <= 0;
      
      card.innerHTML = `
        <div class="product-image-wrapper">
          <a href="/product.html?id=${product._id}">
            <img src="${window.API.resolveImageUrl(product.image)}" alt="${product.title}" class="product-card-img" onerror="this.src='https://placehold.co/300x300/1b4332/ffffff?text=${encodeURIComponent(product.title)}'">
          </a>
          <span class="product-badge">${product.category}</span>
        </div>
        <div class="product-card-body">
          <span class="product-card-category">${product.category}</span>
          <a href="/product.html?id=${product._id}">
            <h3 class="product-card-title">${product.title}</h3>
          </a>
          <div class="product-card-bottom">
            <span class="product-card-price">₹${product.price.toFixed(2)}</span>
            ${isOutOfStock 
              ? `<span class="product-card-out-of-stock">Out of Stock</span>` 
              : `<button class="add-to-cart-btn" data-id="${product._id}" title="Add to Cart">🛒</button>`
            }
          </div>
        </div>
      `;

      grid.appendChild(card);
    });

    // Bind Add to Cart listeners
    const buttons = grid.querySelectorAll('.add-to-cart-btn');
    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const productId = button.getAttribute('data-id');
        this.addProductToCart(productId);
      });
    });
  },

  async addProductToCart(productId) {
    if (!window.API.isAuthenticated()) {
      if (window.Toast) {
        window.Toast.error('Please login to add items to your cart.');
      }
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 1500);
      return;
    }

    try {
      const data = await window.API.post('/cart/add', { productId, quantity: 1 });
      if (data && data.success) {
        if (window.Toast) {
          window.Toast.success('Product added to cart!');
        }
        if (window.Layout) {
          window.Layout.updateCartBadge();
        }
      }
    } catch (error) {
      if (window.Toast) {
        window.Toast.error(error.message || 'Could not add product to cart');
      }
    }
  },

  renderCategoryChips() {
    const container = document.getElementById('categories-container');
    if (!container) return;

    // Reset except for "All Categories"
    container.innerHTML = `<button class="category-chip ${this.selectedCategory === 'All' ? 'active' : ''}" data-category="All">All Categories</button>`;

    // Retrieve list of unique categories
    const categories = [...new Set(this.products.map(p => p.category))];

    categories.forEach(category => {
      const chip = document.createElement('button');
      chip.className = `category-chip ${this.selectedCategory === category ? 'active' : ''}`;
      chip.setAttribute('data-category', category);
      chip.textContent = category;
      container.appendChild(chip);
    });

    // Attach click events
    container.querySelectorAll('.category-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        container.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.selectedCategory = chip.getAttribute('data-category');
        this.fetchProducts();
      });
    });
  },

  showLoading(isLoading) {
    const spinner = document.getElementById('loading-spinner');
    const grid = document.getElementById('products-grid');
    if (!spinner) return;

    if (isLoading) {
      spinner.style.display = 'flex';
      if (grid) grid.style.display = 'none';
    } else {
      spinner.style.display = 'none';
      if (grid && this.products.length > 0) grid.style.display = 'grid';
    }
  },

  setupSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      this.searchQuery = e.target.value;
      debounceTimer = setTimeout(() => {
        this.fetchProducts();
      }, 300);
    });
  },

  init() {
    this.fetchProducts();
    this.setupSearch();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ProductCatalog.init();
});
