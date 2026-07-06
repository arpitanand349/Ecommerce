document.addEventListener('DOMContentLoaded', () => {
  // Redirect if already logged in
  if (window.API.isAuthenticated()) {
    window.location.href = '/index.html';
    return;
  }

  const loginForm = document.getElementById('login-form');
  const submitBtn = document.getElementById('submit-btn');

  const loginView = document.getElementById('login-view');
  const forgotView = document.getElementById('forgot-view');
  const resetView = document.getElementById('reset-view');

  const showView = (view) => {
    if (loginView) loginView.style.display = view === 'login' ? 'block' : 'none';
    if (forgotView) forgotView.style.display = view === 'forgot' ? 'block' : 'none';
    if (resetView) resetView.style.display = view === 'reset' ? 'block' : 'none';
  };

  // View transitions
  const forgotPasswordLink = document.getElementById('forgot-password-link');
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      showView('forgot');
    });
  }

  const backToLoginLinks = document.querySelectorAll('.back-to-login');
  backToLoginLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      showView('login');
    });
  });

  const backToForgotLink = document.getElementById('back-to-forgot-link');
  if (backToForgotLink) {
    backToForgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      showView('forgot');
    });
  }

  // Handle Login submission
  if (loginForm) {
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
  }

  // Handle Forgot Password submission
  const forgotForm = document.getElementById('forgot-form');
  const forgotSubmitBtn = document.getElementById('forgot-submit-btn');

  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('forgot-email').value.trim();

      if (!email) {
        if (window.Toast) window.Toast.error('Please enter your email');
        return;
      }

      forgotSubmitBtn.disabled = true;
      forgotSubmitBtn.textContent = 'Sending...';

      try {
        const data = await window.API.post('/auth/forgotpassword', { email });

        if (data && data.success) {
          if (window.Toast) {
            window.Toast.success(data.message + (data.resetCode ? ` (Testing Code: ${data.resetCode})` : ''));
          }

          // Populate email in reset form and switch to reset view
          const resetEmailField = document.getElementById('reset-email');
          if (resetEmailField) {
            resetEmailField.value = email;
          }
          showView('reset');
        }
      } catch (error) {
        if (window.Toast) {
          window.Toast.error(error.message || 'Failed to request reset code');
        }
      } finally {
        forgotSubmitBtn.disabled = false;
        forgotSubmitBtn.textContent = 'Send Reset Code';
      }
    });
  }

  // Handle Reset Password submission
  const resetForm = document.getElementById('reset-form');
  const resetSubmitBtn = document.getElementById('reset-submit-btn');

  if (resetForm) {
    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('reset-email').value.trim();
      const code = document.getElementById('reset-code').value.trim();
      const newPassword = document.getElementById('new-password').value;

      if (!email || !code || !newPassword) {
        if (window.Toast) window.Toast.error('Please fill in all fields');
        return;
      }

      if (newPassword.length < 6) {
        if (window.Toast) window.Toast.error('Password must be at least 6 characters');
        return;
      }

      resetSubmitBtn.disabled = true;
      resetSubmitBtn.textContent = 'Resetting...';

      try {
        const data = await window.API.post('/auth/resetpassword', { email, code, newPassword });

        if (data && data.success) {
          if (window.Toast) {
            window.Toast.success(data.message || 'Password reset successfully!');
          }
          
          // Clear inputs
          document.getElementById('reset-code').value = '';
          document.getElementById('new-password').value = '';

          // Transition back to login view
          setTimeout(() => {
            showView('login');
          }, 1500);
        }
      } catch (error) {
        if (window.Toast) {
          window.Toast.error(error.message || 'Reset password failed');
        }
      } finally {
        resetSubmitBtn.disabled = false;
        resetSubmitBtn.textContent = 'Reset Password';
      }
    });
  }
});
