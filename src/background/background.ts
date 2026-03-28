/// <reference types="chrome" />

import { JSONFormatter } from '../utils/jsonFormatter.js';

chrome.runtime.onInstalled.addListener((details) => {
  console.log('JSON Master installed', details);
  
  if (details.reason === 'install') {
    chrome.storage.sync.set({
      'json_master_settings': {
        indent: 2,
        sortKeys: false,
        escapeUnicode: false,
        theme: 'auto',
        autoFormat: true,
        maxHistoryItems: 20,
      }
    });
  }

  chrome.contextMenus?.create({
    id: 'json-master-format',
    title: '使用 JSON Master 格式化',
    contexts: ['selection'],
    documentUrlPatterns: ['<all_urls>']
  });
});

chrome.contextMenus?.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'json-master-format' && info.selectionText) {
    chrome.storage.local.set({ 
      'json_master_clipboard': info.selectionText 
    });
    
    if (tab?.id) {
      chrome.action.openPopup();
    }
  }
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  (async () => {
    try {
      switch (request.action) {
        case 'formatJson': {
          try {
            const formatted = JSONFormatter.format(request.json, {
              indent: 2,
              sortKeys: false,
            });
            sendResponse({ success: true, result: formatted });
          } catch (error) {
            sendResponse({ 
              success: false, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
          }
          break;
        }
        
        case 'validateJson': {
          try {
            const validation = JSONFormatter.validate(request.json);
            sendResponse({ success: true, valid: validation.valid, error: validation.error });
          } catch (error) {
            sendResponse({ 
              success: false, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
          }
          break;
        }
          
        case 'getSettings': {
          const settings = await chrome.storage.sync.get('json_master_settings');
          sendResponse({ success: true, settings: settings['json_master_settings'] });
          break;
        }
          
        case 'saveSettings':
          await chrome.storage.sync.set({ 'json_master_settings': request.settings });
          sendResponse({ success: true });
          break;
          
        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      sendResponse({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  })();
  
  return true;
});

chrome.commands.onCommand.addListener((command) => {
  if (command === '_execute_action') {
    console.log('JSON Master shortcut triggered');
  }
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (tab.url.includes('.json') || 
        tab.url.includes('api.') ||
        tab.url.includes('/api/')) {
      console.log('Potential JSON page detected:', tab.url);
    }
  }
});

console.log('JSON Master background service worker started');
