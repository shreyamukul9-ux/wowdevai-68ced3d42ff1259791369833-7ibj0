/**
 * Enhanced login functionality with Supabase integration
 */

import { auth } from '../../config/supabase.js';

let isLoading = false;

export function initLogin() {
  const loginForm = document.getElementById('login-form');
  const togglePassword = document.getElementById('toggle-password');
  const passwordInput = document.getElementById('password');

  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      
      const icon = togglePassword.querySelector('i');
      if (icon) {
        icon.setAttribute('data-lucide', type === 'password' ? 'eye' : 'eye-off');
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      }
    });
  }

  // Check if user is already logged in
  checkAuthState();
}

async function checkAuthState() {
  const result = await auth.getCurrentUser();
  if (result.success && result.user) {
    // User is already logged in, redirect to dashboard
    window.location.href = 'index.html';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  
  if (isLoading) return;

  const formData = new FormData(e.target);
  const email = formData.get('email');
  const password = formData.get('password');
  const rememberMe = formData.get('remember');

  // Validate inputs
  if (!email || !password) {
    showError('Please fill in all fields');
    return;
  }

  if (!isValidEmail(email)) {
    showError('Please enter a valid email address');
    return;
  }

  setLoading(true);

  try {
    const result = await auth.signIn(email, password);
    
    if (result.success) {
      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem('remember_user', 'true');
      }
      
      showSuccess('Login successful! Redirecting...');
      
      // Redirect after short delay
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);
    } else {
      showError(result.error || 'Login failed. Please check your credentials.');
    }
  } catch (error) {
    console.error('Login error:', error);
    showError('An unexpected error occurred. Please try again.');
  } finally {
    setLoading(false);
  }
}

function setLoading(loading) {
  isLoading = loading;
  const submitButton = document.querySelector('[data-id="submit-button"]');
  const buttonText = document.querySelector('[data-id="button-text"]');
  const loadingSpinner = document.querySelector('[data-id="loading-spinner"]');

  if (submitButton) {
    submitButton.disabled = loading;
    submitButton.classList.toggle('cursor-not-allowed', loading);
    submitButton.classList.toggle('opacity-50', loading);
  }

  if (buttonText) {
    buttonText.textContent = loading ? 'Signing In...' : 'Sign In';
  }

  if (loadingSpinner) {
    loadingSpinner.classList.toggle('hidden', !loading);
  }
}

function showError(message) {
  showNotification(message, 'error');
}

function showSuccess(message) {
  showNotification(message, 'success');
}

function showNotification(message, type) {
  // Remove existing notification
  const existing = document.getElementById('notification');
  if (existing) {
    existing.remove();
  }

  const isError = type === 'error';
  const notification = document.createElement('div');
  notification.id = 'notification';
  notification.setAttribute('data-id', 'login-notification');
  notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full ${
    isError 
      ? 'bg-red-50 border border-red-200 text-red-800' 
      : 'bg-green-50 border border-green-200 text-green-800'
  }`;

  notification.innerHTML = `
    <div class="flex items-center space-x-3" data-id="notification-content">
      <div class="flex-shrink-0" data-id="notification-icon">
        <i data-lucide="${isError ? 'alert-circle' : 'check-circle'}" class="w-5 h-5" data-id="status-icon"></i>
      </div>
      <p class="text-sm font-medium" data-id="notification-message">${message}</p>
      <button class="flex-shrink-0 text-current opacity-70 hover:opacity-100" data-id="close-notification" onclick="this.parentElement.parentElement.remove()">
        <i data-lucide="x" class="w-4 h-4" data-id="close-icon"></i>
      </button>
    </div>
  `;

  document.body.appendChild(notification);

  // Initialize icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Animate in
  setTimeout(() => {
    notification.classList.remove('translate-x-full');
  }, 100);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.classList.add('translate-x-full');
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLogin);
} else {
  initLogin();
}