/// <reference types="chrome" />

// Content script for JSON Master extension
// This script runs on web pages to detect and enhance JSON content

(function() {
  'use strict';

  // Check if the page contains JSON content
  function detectJsonContent(): boolean {
    const contentType = document.contentType || '';
    const bodyText = document.body?.innerText?.trim() || '';
    
    // Check content type
    if (contentType.includes('application/json')) {
      return true;
    }
    
    // Check if body contains only JSON-like content
    if (bodyText) {
      const trimmed = bodyText.trim();
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
          (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
          JSON.parse(trimmed);
          return true;
        } catch {
          return false;
        }
      }
    }
    
    return false;
  }

  // Format JSON content on the page
  function formatPageJson(): void {
    if (!detectJsonContent()) return;

    const bodyText = document.body.innerText.trim();
    
    try {
      const parsed = JSON.parse(bodyText);
      const formatted = JSON.stringify(parsed, null, 2);
      
      // Create a formatted display
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const pre = document.createElement('pre');
      pre.style.cssText = `
        background: ${isDarkMode ? '#1e1e1e' : '#f5f5f5'};
        color: ${isDarkMode ? '#d4d4d4' : '#333'};
        padding: 20px;
        border-radius: 8px;
        overflow: auto;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 14px;
        line-height: 1.5;
        white-space: pre-wrap;
        word-wrap: break-word;
      `;
      pre.textContent = formatted;
      
      // Replace body content with proper styling
      document.body.innerHTML = '';
      document.body.setAttribute('style', '');
      document.body.style.cssText = `
        margin: 0 !important;
        padding: 20px !important;
        min-height: 100vh !important;
        background: ${isDarkMode ? '#1e1e1e' : '#f5f5f5'} !important;
        color: ${isDarkMode ? '#d4d4d4' : '#333'} !important;
      `;
      document.documentElement.style.background = isDarkMode ? '#1e1e1e' : '#f5f5f5';
      document.body.appendChild(pre);
      
      // Add a toolbar
      const toolbar = document.createElement('div');
      toolbar.style.cssText = `
        position: fixed !important;
        top: 10px !important;
        right: 10px !important;
        background: ${isDarkMode ? '#2d2d2d' : 'white'} !important;
        color: ${isDarkMode ? '#e0e0e0' : '#333'} !important;
        padding: 10px !important;
        border-radius: 4px !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
        font-family: system-ui, -apple-system, sans-serif !important;
        font-size: 14px !important;
        z-index: 100000 !important;
      `;
      toolbar.innerHTML = `
        <span style="font-weight: bold !important; margin-right: 10px !important; color: ${isDarkMode ? '#e0e0e0' : '#333'} !important;">JSON Master</span>
        <button id="json-master-copy" style="
          background: #4CAF50 !important;
          color: white !important;
          border: none !important;
          padding: 5px 10px !important;
          border-radius: 4px !important;
          cursor: pointer !important;
          margin-right: 5px !important;
        ">复制</button>
        <button id="json-master-raw" style="
          background: ${isDarkMode ? '#3d3d3d' : '#f0f0f0'} !important;
          color: ${isDarkMode ? '#e0e0e0' : '#333'} !important;
          border: 1px solid ${isDarkMode ? '#555' : '#ccc'} !important;
          padding: 5px 10px !important;
          border-radius: 4px !important;
          cursor: pointer !important;
        ">查看原始</button>
      `;
      
      document.body.appendChild(toolbar);
      
      // Add event listeners
      document.getElementById('json-master-copy')?.addEventListener('click', () => {
        navigator.clipboard.writeText(formatted).then(() => {
          const btn = document.getElementById('json-master-copy');
          if (btn) {
            const originalText = btn.textContent;
            btn.textContent = '已复制!';
            setTimeout(() => {
              btn.textContent = originalText;
            }, 2000);
          }
        });
      });
      
      document.getElementById('json-master-raw')?.addEventListener('click', () => {
        location.reload();
      });
      
    } catch (error) {
      console.error('JSON Master: Failed to format JSON', error);
    }
  }

  // Listen for messages from popup or background
  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    switch (request.action) {
      case 'getSelectedText': {
        const selection = window.getSelection()?.toString() || '';
        sendResponse({ text: selection });
        break;
      }
        
      case 'formatPageJson':
        formatPageJson();
        sendResponse({ success: true });
        break;
        
      case 'getPageUrl':
        sendResponse({ url: location.href });
        break;
        
      default:
        sendResponse({ error: 'Unknown action' });
    }
    
    return true;
  });

  // Auto-format JSON pages - always try to format JSON content
  function initJsonFormatting() {
    if (detectJsonContent()) {
      formatPageJson();
    }
  }

  // Try formatting immediately
  initJsonFormatting();

  // Also check after settings are loaded
  chrome.storage.sync.get('json_master_settings', (result) => {
    const settings = result['json_master_settings'];
    if (settings?.autoFormat !== false && detectJsonContent()) {
      formatPageJson();
    }
  });

  console.log('JSON Master content script loaded');
})();
