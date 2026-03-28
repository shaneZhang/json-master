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
      const pre = document.createElement('pre');
      pre.style.cssText = `
        background: #f5f5f5;
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
      
      // Replace body content
      document.body.innerHTML = '';
      document.body.appendChild(pre);
      
      // Add a toolbar
      const toolbar = document.createElement('div');
      toolbar.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: white;
        padding: 10px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        z-index: 10000;
      `;
      toolbar.innerHTML = `
        <span style="font-weight: bold; margin-right: 10px;">JSON Master</span>
        <button id="json-master-copy" style="
          background: #4CAF50;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
          margin-right: 5px;
        ">复制</button>
        <button id="json-master-raw" style="
          background: #f0f0f0;
          border: 1px solid #ccc;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
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

  // Auto-format JSON pages if enabled
  chrome.storage.sync.get('json_master_settings', (result) => {
    const settings = result['json_master_settings'];
    if (settings?.autoFormat && detectJsonContent()) {
      formatPageJson();
    }
  });

  console.log('JSON Master content script loaded');
})();
