/**
 * Enhanced signup functionality with Supabase integration
 */

import { auth } from '../../config/supabase.js';

let isLoading = false;

export function initSignup() {
  const signupForm = document.getElementById('signup-form');
  const togglePassword = document.getElementById('toggle-password');
  const toggleConfirmPassword = document.getElementById('toggle-confirm-password');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirm-password');

  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
  }

  // Password visibility toggles
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', () => togglePasswordVisibility(passwordInput, togglePassword));
  }

  if (toggleConfirmPassword && confirmPasswordInput) {
    toggleConfirmPassword.addEventListener('click', () => togglePasswordVisibility(confirmPasswordInput, toggleConfirmPassword));
  }

  // Real-time validation
  if (passwordInput) {
    passwordInput.addEventListener('input', validatePassword);
  }

  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener('input', validatePasswordMatch);
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

function togglePasswordVisibility(input, toggle) {
  const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
  input.setAttribute('type', type);
  
  const icon = toggle.querySelector('i');
  if (icon) {
    icon.setAttribute('data-lucide', type === 'password' ? 'eye' : 'eye-off');
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

function validatePassword() {
  const password = document.getElementById('password')?.value || '';
  const requirements = {
    length: password.length >= 8,
    number: /\d/.test(password),
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password)
  };

  // Update requirement indicators
  Object.keys(requirements).forEach(req => {
    const indicator = document.querySelector(`[data-id="${req}-requirement"]`);
    if (indicator) {
      const icon = indicator.querySelector('i');
      if (requirements[req]) {
        indicator.classList.remove('text-gray-400');
        indicator.classList.add('text-green-600');
        if (icon) {
          icon.setAttribute('data-lucide', 'check');
        }
      } else {
        indicator.classList.remove('text-green-600');
        indicator.classList.add('text-gray-400');
        if (icon) {
          icon.setAttribute('data-lucide', 'x');
        }
      }
    }
  });

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  return Object.values(requirements).every(Boolean);
}

function validatePasswordMatch() {
  const password = document.getElementById('password')?.value || '';
  const confirmPassword = document.getElementById('confirm-password')?.value || '';
  const matchIndicator = document.querySelector('[data-id="password-match-indicator"]');
  
  if (confirmPassword && matchIndicator) {
    const matches = password === confirmPassword;
    const icon = matchIndicator.querySelector('i');
    
    if (matches) {
      matchIndicator.classList.remove('text-red-500');
      matchIndicator.classList.add('text-green-600');
      matchIndicator.textContent = '✓ Passwords match';
    } else {
      matchIndicator.classList.remove('text-green-600');
      matchIndicator.classList.add('text-red-500');
      matchIndicator.textContent = '✗ Passwords do not match';
    }
  }

  return password === confirmPassword;
}

async function handleSignup(e) {
  e.preventDefault();
  
  if (isLoading) return;

  const formData = new FormData(e.target);
  const fullName = formData.get('fullName');
  const email = formData.get('email');
  const password = formData.get('password');
  const confirmPassword = formData.get('confirmPassword');
  const agreeTerms = formData.get('agreeTerms');

  // Validate inputs
  if (!fullName || !email || !password || !confirmPassword) {
    showError('Please fill in all fields');
    return;
  }

  if (!isValidEmail(email)) {
    showError('Please enter a valid email address');
    return;
  }

  if (!validatePassword()) {
    showError('Password does not meet requirements');
    return;
  }

  if (password !== confirmPassword) {
    showError('Passwords do not match');
    return;
  }

  if (!agreeTerms) {
    showError('Please agree to the Terms of Service and Privacy Policy');
    return;
  }

  setLoading(true);

  try {
    const result = await auth.signUp(email, password, fullName);
    
    if (result.success) {
      showSuccess('Account created successfully! Please check your email to verify your account.');
      
      // Redirect to login page after delay
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 3000);
    } else {
      showError(result.error || 'Failed to create account. Please try again.');
    }
  } catch (error) {
    console.error('Signup error:', error);
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
    buttonText.textContent = loading ? 'Creating Account...' : 'Create Account';
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
  notification.setAttribute('data-id', 'signup-notification');
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
  document.addEventListener('DOMContentLoaded', initSignup);
} else {
  initSignup();
}