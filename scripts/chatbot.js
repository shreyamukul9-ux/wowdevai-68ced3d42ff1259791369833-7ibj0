/**
 * AI-powered asthma chatbot with Supabase integration
 */

import { supabase, auth, database, aiAnalysis } from '../config/supabase.js';

let currentUser = null;
let chatHistory = [];

export function initChatbot() {
  createChatbotButton();
  initAuthStateListener();
}

function initAuthStateListener() {
  // Listen for auth state changes
  auth.onAuthStateChange((event, session) => {
    if (session) {
      currentUser = session.user;
      loadChatHistory();
    } else {
      currentUser = null;
      chatHistory = [];
    }
  });

  // Check current user on load
  auth.getCurrentUser().then(result => {
    if (result.success && result.user) {
      currentUser = result.user;
      loadChatHistory();
    }
  });
}

async function loadChatHistory() {
  if (!currentUser) return;

  const result = await database.getChatHistory(currentUser.id);
  if (result.success) {
    chatHistory = result.data || [];
  }
}

function createChatbotButton() {
  const chatbotHTML = `
    <div id="chatbot-container" data-id="chatbot-container" class="fixed bottom-6 right-6 z-50">
      <!-- Chat Toggle Button -->
      <button 
        id="chat-toggle" 
        data-id="chat-toggle-btn"
        class="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
        aria-label="Open AI Assistant"
      >
        <i data-lucide="message-circle" class="w-6 h-6" data-id="chat-icon"></i>
        <div class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold" data-id="notification-badge" style="display: none;">
          1
        </div>
      </button>

      <!-- Chat Window -->
      <div 
        id="chat-window" 
        data-id="chat-window"
        class="hidden absolute bottom-16 right-0 w-96 h-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
        style="max-width: calc(100vw - 2rem);"
      >
        <!-- Chat Header -->
        <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between" data-id="chat-header">
          <div class="flex items-center space-x-3" data-id="chat-header-info">
            <div class="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center" data-id="ai-avatar">
              <i data-lucide="bot" class="w-5 h-5" data-id="bot-icon"></i>
            </div>
            <div data-id="ai-info">
              <h3 class="font-semibold text-sm" data-id="ai-name">Asthmacare AI Assistant</h3>
              <p class="text-xs text-blue-100" data-id="ai-status">
                <span class="inline-block w-2 h-2 bg-green-400 rounded-full mr-1" data-id="status-indicator"></span>
                Online - Ask me about asthma!
              </p>
            </div>
          </div>
          <button 
            id="chat-close" 
            data-id="chat-close-btn"
            class="text-blue-100 hover:text-white transition-colors"
            aria-label="Close chat"
          >
            <i data-lucide="x" class="w-5 h-5" data-id="close-icon"></i>
          </button>
        </div>

        <!-- Chat Messages -->
        <div 
          id="chat-messages" 
          data-id="chat-messages"
          class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
        >
          <!-- Welcome Message -->
          <div class="flex items-start space-x-3" data-id="welcome-message">
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0" data-id="ai-avatar-small">
              <i data-lucide="bot" class="w-4 h-4 text-blue-600" data-id="bot-icon-small"></i>
            </div>
            <div class="bg-white rounded-2xl rounded-tl-md p-3 shadow-sm max-w-xs" data-id="welcome-bubble">
              <p class="text-sm text-gray-800" data-id="welcome-text">
                👋 Hi! I'm your Asthmacare AI assistant. I can help you with:
                <br><br>
                • Asthma symptoms & triggers
                <br>
                • Medication guidance
                <br>
                • Air quality advice
                <br>
                • Emergency care info
                <br><br>
                What would you like to know?
              </p>
            </div>
          </div>
        </div>

        <!-- Chat Input -->
        <div class="border-t border-gray-200 p-4" data-id="chat-input-container">
          <div class="flex space-x-2" data-id="input-form">
            <input
              type="text"
              id="chat-input"
              data-id="chat-input-field"
              placeholder="Ask about asthma symptoms, triggers, medications..."
              class="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxlength="500"
            />
            <button
              id="chat-send"
              data-id="chat-send-btn"
              class="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <i data-lucide="send" class="w-4 h-4" data-id="send-icon"></i>
            </button>
          </div>
          
          <!-- Quick Actions -->
          <div class="mt-3 flex flex-wrap gap-2" data-id="quick-actions">
            <button class="quick-action-btn" data-action="symptoms" data-id="symptoms-btn">😷 Symptoms</button>
            <button class="quick-action-btn" data-action="triggers" data-id="triggers-btn">⚠️ Triggers</button>
            <button class="quick-action-btn" data-action="emergency" data-id="emergency-btn">🚨 Emergency</button>
            <button class="quick-action-btn" data-action="airquality" data-id="airquality-btn">🌬️ Air Quality</button>
          </div>
        </div>
      </div>
    </div>

    <style>
      .quick-action-btn {
        background: #f3f4f6;
        border: 1px solid #e5e7eb;
        border-radius: 1rem;
        padding: 0.25rem 0.75rem;
        font-size: 0.75rem;
        color: #4b5563;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .quick-action-btn:hover {
        background: #e5e7eb;
        border-color: #d1d5db;
      }
      
      .quick-action-btn:active {
        background: #2563eb;
        color: white;
        border-color: #2563eb;
      }
    </style>
  `;

  // Insert chatbot into page
  document.body.insertAdjacentHTML('beforeend', chatbotHTML);
  
  // Initialize chatbot events
  initChatbotEvents();
  
  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function initChatbotEvents() {
  const chatToggle = document.getElementById('chat-toggle');
  const chatClose = document.getElementById('chat-close');
  const chatWindow = document.getElementById('chat-window');
  const chatInput = document.getElementById('chat-input');
  const chatSend = document.getElementById('chat-send');
  const quickActionButtons = document.querySelectorAll('.quick-action-btn');

  // Toggle chat window
  chatToggle?.addEventListener('click', () => {
    chatWindow.classList.toggle('hidden');
    if (!chatWindow.classList.contains('hidden')) {
      chatInput?.focus();
      hideNotificationBadge();
    }
  });

  // Close chat window
  chatClose?.addEventListener('click', () => {
    chatWindow.classList.add('hidden');
  });

  // Send message on Enter key
  chatInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Send message on button click
  chatSend?.addEventListener('click', sendMessage);

  // Quick action buttons
  quickActionButtons.forEach(button => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;
      const quickMessages = {
        symptoms: "What are the common symptoms of asthma?",
        triggers: "What are common asthma triggers I should avoid?",
        emergency: "What should I do during an asthma attack?",
        airquality: "How does air quality affect my asthma?"
      };
      
      const message = quickMessages[action];
      if (message) {
        chatInput.value = message;
        sendMessage();
      }
    });
  });
}

async function sendMessage() {
  const chatInput = document.getElementById('chat-input');
  const message = chatInput?.value.trim();
  
  if (!message) return;

  // Clear input
  chatInput.value = '';
  
  // Disable send button temporarily
  const sendBtn = document.getElementById('chat-send');
  if (sendBtn) {
    sendBtn.disabled = true;
  }

  // Add user message to chat
  addMessageToChat(message, 'user');

  try {
    // Get AI response
    const result = await aiAnalysis.getChatbotResponse(message, chatHistory);
    
    if (result.success) {
      // Add AI response to chat
      addMessageToChat(result.response, 'ai');
      
      // Save chat to database if user is logged in
      if (currentUser) {
        await database.saveChatMessage(currentUser.id, message, result.response);
        chatHistory.push({
          message,
          response: result.response,
          created_at: new Date().toISOString()
        });
      }
    } else {
      addMessageToChat("Sorry, I'm having trouble processing your request. Please try again.", 'ai', true);
    }
  } catch (error) {
    console.error('Chatbot error:', error);
    addMessageToChat("I'm experiencing technical difficulties. Please try again later.", 'ai', true);
  } finally {
    // Re-enable send button
    if (sendBtn) {
      sendBtn.disabled = false;
    }
  }
}

function addMessageToChat(message, sender, isError = false) {
  const chatMessages = document.getElementById('chat-messages');
  if (!chatMessages) return;

  const messageId = `message-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const isUser = sender === 'user';
  
  const messageHTML = `
    <div class="flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}" data-id="${messageId}">
      ${!isUser ? `
        <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0" data-id="ai-avatar-${messageId}">
          <i data-lucide="bot" class="w-4 h-4 text-blue-600" data-id="bot-icon-${messageId}"></i>
        </div>
      ` : ''}
      <div class="${isUser 
        ? 'bg-blue-600 text-white rounded-2xl rounded-tr-md' 
        : isError 
          ? 'bg-red-50 border border-red-200 rounded-2xl rounded-tl-md' 
          : 'bg-white rounded-2xl rounded-tl-md shadow-sm'
        } p-3 max-w-xs" data-id="message-bubble-${messageId}">
        <p class="text-sm ${isUser ? 'text-white' : isError ? 'text-red-800' : 'text-gray-800'}" data-id="message-text-${messageId}">
          ${message}
        </p>
        <p class="text-xs ${isUser ? 'text-blue-100' : 'text-gray-500'} mt-1" data-id="message-time-${messageId}">
          ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  `;

  chatMessages.insertAdjacentHTML('beforeend', messageHTML);

  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Re-initialize Lucide icons for new message
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function showNotificationBadge() {
  const badge = document.querySelector('[data-id="notification-badge"]');
  if (badge) {
    badge.style.display = 'flex';
  }
}

function hideNotificationBadge() {
  const badge = document.querySelector('[data-id="notification-badge"]');
  if (badge) {
    badge.style.display = 'none';
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChatbot);
} else {
  initChatbot();
}