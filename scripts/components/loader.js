/**
 * Component loader utility for loading HTML partials
 */

export async function loadComponent(selector, customPath = null) {
  try {
    const container = document.querySelector(selector);
    if (!container) {
      console.warn(`Container not found: ${selector}`);
      return;
    }

    const filePath = customPath || container.getAttribute('data-source');
    if (!filePath) {
      console.warn(`No data-source attribute found for: ${selector}`);
      return;
    }

    const baseUrl = window.location.origin + '/api/preview-68ced3d42ff1259791369833/';
    const response = await fetch(baseUrl + filePath);
    
    if (!response.ok) {
      throw new Error(`Failed to load component: ${response.status}`);
    }

    const html = await response.text();
    container.innerHTML = html;

    // Execute any scripts in the loaded HTML
    const scripts = container.querySelectorAll('script');
    scripts.forEach(script => {
      const newScript = document.createElement('script');
      newScript.textContent = script.textContent;
      document.head.appendChild(newScript);
    });

  } catch (error) {
    console.error(`Error loading component ${selector}:`, error);
    // Fallback content
    const container = document.querySelector(selector);
    if (container && selector.includes('navbar')) {
      container.innerHTML = `
        <nav class="fixed top-0 left-0 right-0 bg-white shadow-sm z-40" data-id="fallback-navbar">
          <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <a href="index.html" class="text-xl font-bold text-blue-600">AsthmaCare</a>
            <div class="space-x-4">
              <a href="index.html" class="text-gray-700 hover:text-blue-600">Home</a>
              <a href="reports.html" class="text-gray-700 hover:text-blue-600">Reports</a>
              <a href="appointments.html" class="text-gray-700 hover:text-blue-600">Appointments</a>
            </div>
          </div>
        </nav>
      `;
    }
  }
}

// Auto-load components on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const containers = document.querySelectorAll('[data-source]');
  containers.forEach(container => {
    const selector = `#${container.id}`;
    loadComponent(selector);
  });
});