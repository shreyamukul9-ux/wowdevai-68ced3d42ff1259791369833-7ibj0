/**
 * Enhanced reports management with Supabase integration and AI analysis
 */

import { supabase, auth, database, storage, aiAnalysis } from '../config/supabase.js';

let uploadedFiles = [];
let currentUser = null;

export function initReports() {
  initAuthState();
  initFileUpload();
  initReportActions();
  loadUserReports();
}

async function initAuthState() {
  // Check current user
  const result = await auth.getCurrentUser();
  if (result.success && result.user) {
    currentUser = result.user;
  } else {
    // Redirect to login if not authenticated
    window.location.href = 'login.html';
    return;
  }

  // Listen for auth state changes
  auth.onAuthStateChange((event, session) => {
    if (session) {
      currentUser = session.user;
      loadUserReports();
    } else {
      currentUser = null;
      window.location.href = 'login.html';
    }
  });
}

async function loadUserReports() {
  if (!currentUser) return;

  try {
    const result = await database.getUserReports(currentUser.id);
    if (result.success) {
      uploadedFiles = result.data || [];
      displayReports();
    }
  } catch (error) {
    console.error('Error loading reports:', error);
    showError('Failed to load your reports');
  }
}

function displayReports() {
  const reportsGrid = document.getElementById('reports-grid');
  const emptyState = document.getElementById('empty-state');

  if (!reportsGrid) return;

  // Clear existing reports
  reportsGrid.innerHTML = '';

  if (uploadedFiles.length === 0) {
    if (emptyState) {
      emptyState.classList.remove('hidden');
    }
    return;
  }

  if (emptyState) {
    emptyState.classList.add('hidden');
  }

  uploadedFiles.forEach(report => {
    addReportToGrid(report);
  });
}

function initFileUpload() {
  const dropzone = document.getElementById('upload-dropzone');
  const fileInput = document.getElementById('file-input');
  const browseBtn = document.getElementById('browse-btn');

  if (!dropzone || !fileInput || !browseBtn) return;

  // Browse button click
  browseBtn.addEventListener('click', () => {
    fileInput.click();
  });

  // Dropzone click
  dropzone.addEventListener('click', (e) => {
    if (e.target === dropzone || e.target.closest('[data-id="upload-content"]')) {
      fileInput.click();
    }
  });

  // File input change
  fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
  });

  // Drag and drop functionality
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('border-blue-400', 'bg-blue-50');
  });

  dropzone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    if (!dropzone.contains(e.relatedTarget)) {
      dropzone.classList.remove('border-blue-400', 'bg-blue-50');
    }
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('border-blue-400', 'bg-blue-50');
    handleFiles(e.dataTransfer.files);
  });
}

function handleFiles(files) {
  if (!currentUser) {
    showError('Please log in to upload reports');
    return;
  }

  const validFiles = [];
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

  Array.from(files).forEach(file => {
    if (file.size > maxSize) {
      showError(`File "${file.name}" is too large. Maximum size is 10MB.`);
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      showError(`File "${file.name}" is not a supported format. Please use PDF, JPG, or PNG.`);
      return;
    }

    validFiles.push(file);
  });

  if (validFiles.length > 0) {
    uploadFiles(validFiles);
  }
}

async function uploadFiles(files) {
  const progressContainer = document.getElementById('upload-progress');
  const progressBar = document.querySelector('[data-id="progress-bar-fill"]');
  const progressText = document.querySelector('[data-id="progress-text"]');

  if (!progressContainer || !progressBar || !progressText) return;

  progressContainer.classList.remove('hidden');
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const progress = Math.round(((i + 1) / files.length) * 100);
    
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `Uploading ${file.name}... ${progress}%`;

    try {
      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `reports/${currentUser.id}/${fileName}`;

      // Upload file to Supabase storage
      const uploadResult = await storage.uploadFile('reports', filePath, file);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      // Get public URL
      const fileUrl = storage.getPublicUrl('reports', filePath);

      // Extract text from file for AI analysis
      let reportText = '';
      if (file.type === 'application/pdf') {
        reportText = 'Medical report uploaded - PDF analysis pending';
      } else {
        reportText = 'Medical image uploaded - Image analysis pending';
      }

      // Save report to database
      const reportData = {
        file_name: file.name,
        file_url: fileUrl,
        analysis_result: null
      };

      const saveResult = await database.saveReport(currentUser.id, file.name, fileUrl);
      
      if (!saveResult.success) {
        throw new Error(saveResult.error);
      }

      const dbReport = saveResult.data[0];

      // Add to local array
      const reportObj = {
        id: dbReport.id,
        file_name: file.name,
        file_url: fileUrl,
        analysis_result: null,
        upload_date: dbReport.upload_date,
        status: 'analyzing'
      };

      uploadedFiles.unshift(reportObj);
      addReportToGrid(reportObj);

      // Start AI analysis in background
      analyzeReportInBackground(reportObj, reportText);

    } catch (error) {
      console.error('Upload error:', error);
      showError(`Failed to upload ${file.name}: ${error.message}`);
    }
  }

  // Complete upload
  progressText.textContent = `Upload complete! ${files.length} file(s) uploaded.`;
  setTimeout(() => {
    progressContainer.classList.add('hidden');
    progressBar.style.width = '0%';
    showSuccess(`Successfully uploaded ${files.length} file(s). AI analysis in progress.`);
  }, 1000);

  // Hide empty state if visible
  const emptyState = document.getElementById('empty-state');
  if (emptyState && !emptyState.classList.contains('hidden')) {
    emptyState.classList.add('hidden');
  }
}

async function analyzeReportInBackground(reportObj, reportText) {
  try {
    // Get AI analysis
    const analysisResult = await aiAnalysis.analyzeReport(reportText);
    
    if (analysisResult.success) {
      // Update database with analysis
      await database.updateReportAnalysis(reportObj.id, analysisResult.analysis);
      
      // Update local object
      reportObj.analysis_result = analysisResult.analysis;
      reportObj.status = 'completed';
      
      // Update UI
      updateReportCard(reportObj);
      
      showSuccess(`Analysis completed for ${reportObj.file_name}`);
    }
  } catch (error) {
    console.error('Analysis error:', error);
    reportObj.status = 'error';
    updateReportCard(reportObj);
  }
}

function addReportToGrid(reportData) {
  const reportsGrid = document.getElementById('reports-grid');
  if (!reportsGrid) return;

  const reportCard = document.createElement('div');
  reportCard.className = 'bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow';
  reportCard.setAttribute('data-id', `report-${reportData.id}`);
  reportCard.setAttribute('data-report-id', reportData.id);

  const iconClass = getIconForFileType(reportData.file_name);
  const iconColor = getColorForFileType(reportData.file_name);
  const uploadDate = new Date(reportData.upload_date).toLocaleDateString();

  reportCard.innerHTML = `
    <div class="flex items-center justify-between mb-4" data-id="report-header-${reportData.id}">
      <div class="flex items-center space-x-3" data-id="report-info-${reportData.id}">
        <div class="w-10 h-10 ${iconColor} rounded-lg flex items-center justify-center" data-id="report-icon-${reportData.id}">
          <i data-lucide="${iconClass}" class="w-5 h-5 text-gray-600" data-id="file-icon-${reportData.id}"></i>
        </div>
        <div data-id="report-details-${reportData.id}">
          <h3 class="font-semibold text-gray-800" data-id="report-name-${reportData.id}">${reportData.file_name}</h3>
          <p class="text-sm text-gray-500" data-id="report-date-${reportData.id}">${uploadDate}</p>
        </div>
      </div>
      <button class="text-gray-400 hover:text-gray-600 report-menu-btn" data-id="report-menu-${reportData.id}" data-report-id="${reportData.id}">
        <i data-lucide="more-vertical" class="w-5 h-5" data-id="menu-icon-${reportData.id}"></i>
      </button>
    </div>
    
    <div class="mb-4" data-id="report-status-${reportData.id}">
      ${getStatusBadge(reportData.status)}
    </div>
    
    <div class="mb-4" data-id="report-summary-${reportData.id}">
      ${getSummaryContent(reportData)}
    </div>
    
    ```javascript
    <div class="flex space-x-2" data-id="report-actions-${reportData.id}">
      ${getActionButtons(reportData)}
    </div>
  `;

  reportsGrid.appendChild(reportCard);
  
  // Add event listeners
  addReportEventListeners(reportCard, reportData);
  
  // Re-initialize icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function addReportEventListeners(reportCard, reportData) {
  // View button
  const viewBtn = reportCard.querySelector(`[data-id="view-btn-${reportData.id}"]`);
  if (viewBtn && !viewBtn.disabled) {
    viewBtn.addEventListener('click', () => {
      showReportAnalysis(reportData);
    });
  }

  // Download button
  const downloadBtn = reportCard.querySelector(`[data-id="download-btn-${reportData.id}"]`);
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      downloadReport(reportData);
    });
  }

  // Menu button
  const menuBtn = reportCard.querySelector(`[data-id="report-menu-${reportData.id}"]`);
  if (menuBtn) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showReportMenu(reportData, menuBtn);
    });
  }
}

function getStatusBadge(status) {
  switch (status) {
    case 'analyzing':
      return '<span class="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">⏳ Analysis in Progress</span>';
    case 'completed':
      return '<span class="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">✓ Analysis Complete</span>';
    case 'error':
      return '<span class="inline-block px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">⚠️ Analysis Failed</span>';
    default:
      return '<span class="inline-block px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">📄 Uploaded</span>';
  }
}

function getSummaryContent(reportData) {
  if (reportData.analysis_result && reportData.status === 'completed') {
    const analysis = reportData.analysis_result;
    return `
      <p class="text-gray-600 text-sm mb-2">${analysis.summary}</p>
      <div class="text-xs text-gray-500">
        <span class="font-medium">Risk Level:</span> 
        <span class="px-2 py-1 rounded-full ${getRiskLevelColor(analysis.riskLevel)} capitalize">
          ${analysis.riskLevel}
        </span>
      </div>
    `;
  } else if (reportData.status === 'analyzing') {
    return '<p class="text-gray-600 text-sm">Our AI is analyzing your report for medical insights and personalized recommendations...</p>';
  } else if (reportData.status === 'error') {
    return '<p class="text-red-600 text-sm">Analysis failed. Please try uploading the report again or contact support.</p>';
  } else {
    return '<p class="text-gray-600 text-sm">Report uploaded successfully. Analysis will begin shortly.</p>';
  }
}

function getRiskLevelColor(riskLevel) {
  switch (riskLevel) {
    case 'low':
      return 'bg-green-100 text-green-800';
    case 'moderate':
      return 'bg-yellow-100 text-yellow-800';
    case 'high':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getActionButtons(reportData) {
  if (reportData.status === 'completed' && reportData.analysis_result) {
    return `
      <button class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors" data-id="view-btn-${reportData.id}">
        View Analysis
      </button>
      <button class="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-semibold transition-colors" data-id="download-btn-${reportData.id}">
        <i data-lucide="download" class="w-4 h-4" data-id="download-icon-${reportData.id}"></i>
      </button>
    `;
  } else if (reportData.status === 'analyzing') {
    return `
      <button class="flex-1 bg-gray-100 text-gray-500 py-2 px-4 rounded-lg text-sm font-semibold cursor-not-allowed" data-id="view-btn-${reportData.id}" disabled>
        Analysis Pending
      </button>
      <button class="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-semibold transition-colors" data-id="download-btn-${reportData.id}">
        <i data-lucide="download" class="w-4 h-4" data-id="download-icon-${reportData.id}"></i>
      </button>
    `;
  } else {
    return `
      <button class="flex-1 bg-gray-100 text-gray-500 py-2 px-4 rounded-lg text-sm font-semibold cursor-not-allowed" data-id="view-btn-${reportData.id}" disabled>
        Analysis Failed
      </button>
      <button class="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-semibold transition-colors" data-id="download-btn-${reportData.id}">
        <i data-lucide="download" class="w-4 h-4" data-id="download-icon-${reportData.id}"></i>
      </button>
    `;
  }
}

function updateReportCard(reportData) {
  const statusElement = document.querySelector(`[data-id="status-badge-${reportData.id}"]`);
  const summaryElement = document.querySelector(`[data-id="report-summary-${reportData.id}"]`);
  const actionsElement = document.querySelector(`[data-id="report-actions-${reportData.id}"]`);

  if (statusElement) {
    statusElement.innerHTML = getStatusBadge(reportData.status);
  }

  if (summaryElement) {
    summaryElement.innerHTML = getSummaryContent(reportData);
  }

  if (actionsElement) {
    actionsElement.innerHTML = getActionButtons(reportData);
    
    // Re-add event listeners
    const reportCard = document.querySelector(`[data-report-id="${reportData.id}"]`);
    if (reportCard) {
      addReportEventListeners(reportCard, reportData);
    }
  }

  // Re-initialize icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function showReportAnalysis(reportData) {
  if (!reportData.analysis_result) return;

  const analysis = reportData.analysis_result;
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-50 overflow-y-auto';
  modal.setAttribute('data-id', `analysis-modal-${reportData.id}`);
  
  modal.innerHTML = `
    <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0" data-id="modal-container">
      <div class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" data-id="modal-backdrop"></div>
      
      <div class="inline-block w-full max-w-4xl px-6 py-8 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl" data-id="modal-content">
        <div class="flex items-center justify-between mb-6" data-id="modal-header">
          <h3 class="text-2xl font-bold text-gray-900" data-id="modal-title">Medical Report Analysis</h3>
          <button class="text-gray-400 hover:text-gray-600 close-modal" data-id="close-modal-btn">
            <i data-lucide="x" class="w-6 h-6" data-id="close-icon"></i>
          </button>
        </div>

        <div class="space-y-6" data-id="analysis-content">
          <!-- Report Info -->
          <div class="bg-gray-50 rounded-lg p-4" data-id="report-info-section">
            <h4 class="font-semibold text-gray-900 mb-2" data-id="report-info-title">Report Information</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm" data-id="report-info-grid">
              <div data-id="file-name-info">
                <span class="font-medium text-gray-700">File:</span>
                <span class="text-gray-600">${reportData.file_name}</span>
              </div>
              <div data-id="upload-date-info">
                <span class="font-medium text-gray-700">Upload Date:</span>
                <span class="text-gray-600">${new Date(reportData.upload_date).toLocaleDateString()}</span>
              </div>
              <div data-id="risk-level-info">
                <span class="font-medium text-gray-700">Risk Level:</span>
                <span class="px-2 py-1 rounded-full text-xs ${getRiskLevelColor(analysis.riskLevel)} capitalize">${analysis.riskLevel}</span>
              </div>
              <div data-id="confidence-info">
                <span class="font-medium text-gray-700">Confidence:</span>
                <span class="text-gray-600">${Math.round(analysis.confidence * 100)}%</span>
              </div>
            </div>
          </div>

          <!-- Summary -->
          <div data-id="summary-section">
            <h4 class="font-semibold text-gray-900 mb-3" data-id="summary-title">Summary</h4>
            <p class="text-gray-700 leading-relaxed" data-id="summary-text">${analysis.summary}</p>
          </div>

          <!-- Findings -->
          ${analysis.findings && analysis.findings.length > 0 ? `
          <div data-id="findings-section">
            <h4 class="font-semibold text-gray-900 mb-3" data-id="findings-title">Key Findings</h4>
            <ul class="space-y-2" data-id="findings-list">
              ${analysis.findings.map((finding, index) => `
                <li class="flex items-start space-x-3" data-id="finding-${index}">
                  <div class="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" data-id="finding-bullet-${index}"></div>
                  <span class="text-gray-700" data-id="finding-text-${index}">${finding}</span>
                </li>
              `).join('')}
            </ul>
          </div>
          ` : ''}

          <!-- Recommendations -->
          ${analysis.recommendations && analysis.recommendations.length > 0 ? `
          <div data-id="recommendations-section">
            <h4 class="font-semibold text-gray-900 mb-3" data-id="recommendations-title">Recommendations</h4>
            <div class="space-y-3" data-id="recommendations-list">
              ${analysis.recommendations.map((rec, index) => `
                <div class="bg-blue-50 border-l-4 border-blue-400 p-4 rounded" data-id="recommendation-${index}">
                  <div class="flex items-start" data-id="recommendation-content-${index}">
                    <i data-lucide="lightbulb" class="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" data-id="rec-icon-${index}"></i>
                    <span class="text-gray-800" data-id="rec-text-${index}">${rec}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Disclaimer -->
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4" data-id="disclaimer-section">
            <div class="flex items-start" data-id="disclaimer-content">
              <i data-lucide="alert-triangle" class="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" data-id="warning-icon"></i>
              <div data-id="disclaimer-text">
                <h5 class="font-semibold text-yellow-800 mb-1" data-id="disclaimer-title">Medical Disclaimer</h5>
                <p class="text-sm text-yellow-700" data-id="disclaimer-body">
                  This analysis is generated by AI and should not be considered as professional medical advice. 
                  Always consult with qualified healthcare professionals for accurate diagnosis and treatment recommendations.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end space-x-3 mt-8" data-id="modal-actions">
          <button class="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-semibold transition-colors close-modal" data-id="cancel-btn">
            Close
          </button>
          <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors" data-id="download-analysis-btn">
            <i data-lucide="download" class="w-4 h-4 mr-2 inline" data-id="download-analysis-icon"></i>
            Download Analysis
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Add event listeners
  modal.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      modal.remove();
    });
  });

  modal.querySelector('[data-id="modal-backdrop"]')?.addEventListener('click', () => {
    modal.remove();
  });

  modal.querySelector('[data-id="download-analysis-btn"]')?.addEventListener('click', () => {
    downloadAnalysis(reportData);
  });

  // Initialize icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function downloadReport(reportData) {
  if (reportData.file_url) {
    const link = document.createElement('a');
    link.href = reportData.file_url;
    link.download = reportData.file_name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

function downloadAnalysis(reportData) {
  if (!reportData.analysis_result) return;

  const analysis = reportData.analysis_result;
  const content = `
Medical Report Analysis
File: ${reportData.file_name}
Date: ${new Date(reportData.upload_date).toLocaleDateString()}
Risk Level: ${analysis.riskLevel}
Confidence: ${Math.round(analysis.confidence * 100)}%

SUMMARY:
${analysis.summary}

KEY FINDINGS:
${analysis.findings ? analysis.findings.map(f => `• ${f}`).join('\n') : 'None'}

RECOMMENDATIONS:
${analysis.recommendations ? analysis.recommendations.map(r => `• ${r}`).join('\n') : 'None'}

DISCLAIMER:
This analysis is generated by AI and should not be considered as professional medical advice. Always consult with qualified healthcare professionals for accurate diagnosis and treatment recommendations.

Generated by AsthmaCare AI Assistant
${new Date().toLocaleString()}
  `;

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${reportData.file_name}_analysis.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function showReportMenu(reportData, button) {
  // Remove existing menus
  document.querySelectorAll('.report-context-menu').forEach(menu => menu.remove());

  const menu = document.createElement('div');
  menu.className = 'report-context-menu absolute bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-48';
  menu.setAttribute('data-id', `context-menu-${reportData.id}`);

  const buttonRect = button.getBoundingClientRect();
  menu.style.top = `${buttonRect.bottom + window.scrollY + 5}px`;
  menu.style.left = `${buttonRect.left + window.scrollX - 150}px`;

  menu.innerHTML = `
    <button class="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 flex items-center space-x-3" data-action="view" data-id="menu-view-${reportData.id}">
      <i data-lucide="eye" class="w-4 h-4" data-id="menu-view-icon-${reportData.id}"></i>
      <span>View Analysis</span>
    </button>
    <button class="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 flex items-center space-x-3" data-action="download" data-id="menu-download-${reportData.id}">
      <i data-lucide="download" class="w-4 h-4" data-id="menu-download-icon-${reportData.id}"></i>
      <span>Download Report</span>
    </button>
    <button class="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 flex items-center space-x-3" data-action="reanalyze" data-id="menu-reanalyze-${reportData.id}">
      <i data-lucide="refresh-cw" class="w-4 h-4" data-id="menu-reanalyze-icon-${reportData.id}"></i>
      <span>Re-analyze</span>
    </button>
    <div class="border-t border-gray-100 my-1"></div>
    <button class="w-full text-left px-4 py-2 hover:bg-red-50 text-sm text-red-600 flex items-center space-x-3" data-action="delete" data-id="menu-delete-${reportData.id}">
      <i data-lucide="trash-2" class="w-4 h-4" data-id="menu-delete-icon-${reportData.id}"></i>
      <span>Delete Report</span>
    </button>
  `;

  document.body.appendChild(menu);

  // Add event listeners
  menu.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const action = e.currentTarget.dataset.action;
      handleMenuAction(action, reportData);
      menu.remove();
    });
  });

  // Close menu when clicking outside
  setTimeout(() => {
    document.addEventListener('click', function closeMenu(e) {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    });
  }, 100);

  // Initialize icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function handleMenuAction(action, reportData) {
  switch (action) {
    case 'view':
      if (reportData.status === 'completed') {
        showReportAnalysis(reportData);
      } else {
        showError('Analysis is not yet complete');
      }
      break;
    case 'download':
      downloadReport(reportData);
      break;
    case 'reanalyze':
      reanalyzeReport(reportData);
      break;
    case 'delete':
      confirmDeleteReport(reportData);
      break;
  }
}

async function reanalyzeReport(reportData) {
  try {
    reportData.status = 'analyzing';
    updateReportCard(reportData);
    
    showSuccess('Re-analysis started...');
    
    // Simulate re-analysis (in real app, this would trigger the AI service)
    setTimeout(() => {
      analyzeReportInBackground(reportData, 'Medical report re-analysis requested');
    }, 1000);
    
  } catch (error) {
    console.error('Re-analysis error:', error);
    showError('Failed to start re-analysis');
  }
}

function confirmDeleteReport(reportData) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-50 overflow-y-auto';
  modal.setAttribute('data-id', `delete-modal-${reportData.id}`);
  
  modal.innerHTML = `
    <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0" data-id="delete-modal-container">
      <div class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" data-id="delete-modal-backdrop"></div>
      
      <div class="inline-block w-full max-w-md px-6 py-8 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl" data-id="delete-modal-content">
        <div class="flex items-center space-x-3 mb-4" data-id="delete-modal-header">
          <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center" data-id="delete-warning-icon">
            <i data-lucide="alert-triangle" class="w-5 h-5 text-red-600" data-id="warning-icon"></i>
          </div>
          <h3 class="text-lg font-semibold text-gray-900" data-id="delete-modal-title">Delete Report</h3>
        </div>

        <p class="text-gray-600 mb-6" data-id="delete-modal-message">
          Are you sure you want to delete "${reportData.file_name}"? This action cannot be undone and all analysis data will be permanently removed.
        </p>

        <div class="flex justify-end space-x-3" data-id="delete-modal-actions">
          <button class="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-semibold transition-colors cancel-delete" data-id="cancel-delete-btn">
            Cancel
          </button>
          <button class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors confirm-delete" data-id="confirm-delete-btn">
            Delete Report
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Add event listeners
  modal.querySelector('.cancel-delete')?.addEventListener('click', () => {
    modal.remove();
  });

  modal.querySelector('[data-id="delete-modal-backdrop"]')?.addEventListener('click', () => {
    modal.remove();
  });

  modal.querySelector('.confirm-delete')?.addEventListener('click', async () => {
    await deleteReport(reportData);
    modal.remove();
  });

  // Initialize icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

async function deleteReport(reportData) {
  try {
    // Delete from storage
    const filePath = reportData.file_url.split('/').pop();
    await storage.deleteFile('reports', `reports/${currentUser.id}/${filePath}`);
    
    // Delete from database
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportData.id);
    
    if (error) throw error;
    
    // Remove from local array
    uploadedFiles = uploadedFiles.filter(report => report.id !== reportData.id);
    
    // Remove from UI
    const reportCard = document.querySelector(`[data-report-id="${reportData.id}"]`);
    if (reportCard) {
      reportCard.remove();
    }
    
    // Show empty state if no reports left
    if (uploadedFiles.length === 0) {
      const emptyState = document.getElementById('empty-state');
      if (emptyState) {
        emptyState.classList.remove('hidden');
      }
    }
    
    showSuccess('Report deleted successfully');
    
  } catch (error) {
    console.error('Delete error:', error);
    showError('Failed to delete report');
  }
}

function initReportActions() {
  // Additional report actions can be initialized here
}

function getIconForFileType(fileName) {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf':
      return 'file-text';
    case 'jpg':
    case 'jpeg':
    case 'png':
      return 'image';
    default:
      return 'file';
  }
}

function getColorForFileType(fileName) {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf':
      return 'bg-red-100';
    case 'jpg':
    case 'jpeg':
    case 'png':
      return 'bg-blue-100';
    default:
      return 'bg-gray-100';
  }
}

function showError(message) {
  showNotification(message, 'error');
}

function showSuccess(message) {
  showNotification(message, 'success');
}

function showNotification(message, type) {
  const existing = document.getElementById('notification');
  if (existing) {
    existing.remove();
  }

  const isError = type === 'error';
  const notification = document.createElement('div');
  notification.id = 'notification';
  notification.setAttribute('data-id', 'reports-notification');
  notification.className = `fixed top```javascript
-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full ${
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

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  setTimeout(() => {
    notification.classList.remove('translate-x-full');
  }, 100);

  setTimeout(() => {
    if (notification.parentElement) {
      notification.classList.add('translate-x-full');
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initReports);
} else {
  initReports();
}