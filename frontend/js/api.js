const BACKEND_URL = 'https://ecommerce-backend-g1wv.onrender.com';
const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.includes('onrender.com'))
  ? '/api'
  : `${BACKEND_URL}/api`;

const API = {
  resolveImageUrl(path) {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
      return path;
    }
    const useBackendHost = !(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.includes('onrender.com'));
    return useBackendHost ? `${BACKEND_URL}${path}` : path;
  },

  getToken() {
    return localStorage.getItem('token');
  },

  getUser() {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (e) {
      return null;
    }
  },

  setAuth(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  isAdmin() {
    const user = this.getUser();
    return user && user.role === 'admin';
  },

  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    
    // Set headers
    const headers = options.headers || {};
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Do NOT set application/json headers when using FormData (browser sets boundary automatically)
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Automatically clean and redirect on 401 (expired/invalid tokens)
        if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
          this.clearAuth();
          if (window.Toast) {
            window.Toast.error('Session expired or unauthorized. Please log in again.');
          }
          setTimeout(() => {
            window.location.href = '/login.html';
          }, 1500);
        }
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error(`Fetch API Error (${endpoint}):`, error.message);
      throw error;
    }
  },

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  async post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  },

  async put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  },

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};

window.API = API;
