document.addEventListener('DOMContentLoaded', () => {
  // Redirect if already logged in
  if (window.API.isAuthenticated()) {
    window.location.href = '/index.html';
    return;
  }

  const loginForm = document.getElementById('login-form');
  const submitBtn = document.getElementById('submit-btn');

  if (!loginForm) return;

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      if (window.Toast) {
        window.Toast.error('Please fill in all fields');
      }
      return;
    }

    // Toggle button state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing In...';

    try {
      const data = await window.API.post('/auth/login', { email, password });
      
      if (data && data.success) {
        // Save auth data
        window.API.setAuth(data.token, {
          _id: data._id,
          name: data.name,
          email: data.email,
          role: data.role
        });

        if (window.Toast) {
          window.Toast.success('Signed in successfully!');
        }

        // Direct to dashboards/index based on user permissions
        setTimeout(() => {
          if (data.role === 'admin') {
            window.location.href = '/admin.html';
          } else {
            window.location.href = '/index.html';
          }
        }, 1000);
      }
    } catch (error) {
      if (window.Toast) {
        window.Toast.error(error.message || 'Login failed. Please verify credentials.');
      }
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
    }
  });
});
