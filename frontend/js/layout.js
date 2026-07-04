const Layout = {
  renderNavbar() {
    const navContainer = document.querySelector('header');
    if (!navContainer) return;

    const user = window.API ? window.API.getUser() : null;
    const isAuthenticated = window.API ? window.API.isAuthenticated() : false;
    const isAdmin = window.API ? window.API.isAdmin() : false;

    let linksHtml = `
      <li><a href="/index.html" class="nav-link" id="nav-home">Home</a></li>
    `;

    if (isAuthenticated) {
      linksHtml += `
        <li>
          <a href="/cart.html" class="nav-link" id="nav-cart">
            <span class="cart-icon-wrapper">
              🛒 Cart
              <span class="cart-badge" id="cart-badge-count" style="display:none;">0</span>
            </span>
          </a>
        </li>
        <li><a href="/orders.html" class="nav-link" id="nav-orders">My Orders</a></li>
      `;

      if (isAdmin) {
        linksHtml += `<li><a href="/admin.html" class="nav-link" id="nav-admin">Admin Panel</a></li>`;
      }

      linksHtml += `
        <li><span class="nav-link" style="color:var(--text-muted); cursor:default; font-weight: 500;">Hi, ${user.name}</span></li>
        <li><a href="#" class="nav-link" id="logout-btn" style="color:var(--error); font-weight: 700;">Logout</a></li>
      `;
    } else {
      linksHtml += `
        <li><a href="/login.html" class="nav-link" id="nav-login">Login</a></li>
        <li><a href="/register.html" class="nav-link" id="nav-register">Register</a></li>
      `;
    }

    navContainer.innerHTML = `
      <nav class="navbar">
        <a href="/index.html" class="nav-brand">
          SimpleStore<span>.</span>
        </a>
        <button class="mobile-menu-toggle" id="mobile-toggle" aria-label="Toggle Navigation">☰</button>
        <ul class="nav-links" id="nav-menu">
          ${linksHtml}
        </ul>
      </nav>
    `;

    this.highlightActiveLink();

    // Event listener for Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.API.clearAuth();
        if (window.Toast) {
          window.Toast.success('Logged out successfully.');
        }
        setTimeout(() => {
          window.location.href = '/index.html';
        }, 1000);
      });
    }

    // Toggle menu in mobile viewports
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    if (mobileToggle && navMenu) {
      mobileToggle.addEventListener('click', () => {
        if (navMenu.classList.contains('mobile-active')) {
          navMenu.classList.remove('mobile-active');
          navMenu.style.display = '';
        } else {
          navMenu.classList.add('mobile-active');
          navMenu.style.display = 'flex';
          navMenu.style.flexDirection = 'column';
          navMenu.style.position = 'absolute';
          navMenu.style.top = '100%';
          navMenu.style.left = '0';
          navMenu.style.width = '100%';
          navMenu.style.backgroundColor = 'white';
          navMenu.style.boxShadow = 'var(--shadow-md)';
          navMenu.style.padding = '1.5rem';
          navMenu.style.gap = '1rem';
        }
      });
    }

    // Sync current cart quantities
    if (isAuthenticated) {
      this.updateCartBadge();
    }
  },

  async updateCartBadge() {
    try {
      const data = await window.API.get('/cart');
      const badge = document.getElementById('cart-badge-count');
      if (badge && data && data.cart) {
        const totalItems = data.cart.products.reduce((acc, curr) => acc + curr.quantity, 0);
        if (totalItems > 0) {
          badge.textContent = totalItems;
          badge.style.display = 'inline-block';
        } else {
          badge.style.display = 'none';
        }
      }
    } catch (err) {
      console.error('Failed to sync cart counts:', err.message);
    }
  },

  renderFooter() {
    const footerContainer = document.querySelector('footer');
    if (!footerContainer) return;

    footerContainer.className = 'footer';
    footerContainer.innerHTML = `
      <div class="footer-grid">
        <div class="footer-col-brand">
          <h3>SimpleStore<span>.</span></h3>
          <p>Your one-stop boutique store for everyday household items, gadgets, apparel, and reading material.</p>
        </div>
        <div class="footer-col">
          <h4>Explore</h4>
          <ul class="footer-links">
            <li><a href="/index.html">Products Catalog</a></li>
            <li><a href="/cart.html">My Shopping Cart</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Customer Care</h4>
          <ul class="footer-links">
            <li><a href="/login.html">Sign In</a></li>
            <li><a href="/register.html">Sign Up</a></li>
            <li><a href="/orders.html">Track Orders</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        &copy; ${new Date().getFullYear()} SimpleStore.
      </div>
    `;
  },

  highlightActiveLink() {
    const path = window.location.pathname;
    let activeId = 'nav-home';
    if (path.includes('cart.html')) activeId = 'nav-cart';
    else if (path.includes('orders.html')) activeId = 'nav-orders';
    else if (path.includes('admin.html')) activeId = 'nav-admin';
    else if (path.includes('login.html')) activeId = 'nav-login';
    else if (path.includes('register.html')) activeId = 'nav-register';

    const activeLink = document.getElementById(activeId);
    if (activeLink) activeLink.classList.add('active');
  },

  init() {
    this.renderNavbar();
    this.renderFooter();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Layout.init();
});

// Expose updateCartBadge so pages can trigger badge refreshes
window.Layout = Layout;
