document.addEventListener('DOMContentLoaded', () => {
  // Redirect if user is already authenticated
  if (window.API.isAuthenticated()) {
    window.location.href = '/index.html';
    return;
  }

  const registerForm = document.getElementById('register-form');
  const submitBtn = document.getElementById('submit-btn');

  if (!registerForm) return;

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Field validations
    if (!name || !email || !password || !confirmPassword) {
      if (window.Toast) {
        window.Toast.error('Please fill in all fields');
      }
      return;
    }

    if (password.length < 6) {
      if (window.Toast) {
        window.Toast.error('Password must be at least 6 characters long');
      }
      return;
    }

    if (password !== confirmPassword) {
      if (window.Toast) {
        window.Toast.error('Passwords do not match');
      }
      return;
    }

    // Toggle button state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';

    try {
      const data = await window.API.post('/auth/register', { name, email, password });
      
      if (data && data.success) {
        // Auto-login on success
        window.API.setAuth(data.token, {
          _id: data._id,
          name: data.name,
          email: data.email,
          role: data.role
        });

        if (window.Toast) {
          window.Toast.success('Account created successfully! Logging you in...');
        }

        setTimeout(() => {
          window.location.href = '/index.html';
        }, 1200);
      }
    } catch (error) {
      if (window.Toast) {
        window.Toast.error(error.message || 'Registration failed. Please try again.');
      }
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign Up';
    }
  });
});
