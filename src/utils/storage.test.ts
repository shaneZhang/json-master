import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageManager, defaultSettings } from './storage';

vi.mock('chrome', () => ({
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
    },
    sync: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
    },
  },
  runtime: {
    openOptionsPage: vi.fn(),
  },
}));

describe('StorageManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('defaultSettings', () => {
    it('should have correct default values', () => {
      expect(defaultSettings.indent).toBe(2);
      expect(defaultSettings.sortKeys).toBe(false);
      expect(defaultSettings.escapeUnicode).toBe(false);
      expect(defaultSettings.theme).toBe('auto');
      expect(defaultSettings.autoFormat).toBe(true);
      expect(defaultSettings.maxHistoryItems).toBe(20);
    });
  });

  describe('getHistory', () => {
    it('should return empty array when no history', async () => {
      const history = await StorageManager.getHistory();
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('addHistoryItem', () => {
    it('should add item to history', async () => {
      await StorageManager.addHistoryItem({
        content: 'test content',
        type: 'formatted',
      });
    });
  });

  describe('clearHistory', () => {
    it('should clear history', async () => {
      await StorageManager.clearHistory();
    });
  });

  describe('deleteHistoryItem', () => {
    it('should delete history item', async () => {
      await StorageManager.deleteHistoryItem('test-id');
    });
  });

  describe('getSettings', () => {
    it('should return default settings when no settings stored', async () => {
      const settings = await StorageManager.getSettings();
      expect(settings).toEqual(defaultSettings);
    });
  });

  describe('saveSettings', () => {
    it('should save settings', async () => {
      await StorageManager.saveSettings({ indent: 4 });
    });
  });

  describe('getCurrentContent', () => {
    it('should return empty string when no content stored', async () => {
      const content = await StorageManager.getCurrentContent();
      expect(content).toBe('');
    });
  });

  describe('saveCurrentContent', () => {
    it('should save current content', async () => {
      await StorageManager.saveCurrentContent('test content');
    });
  });

  describe('copyToClipboard', () => {
    it('should copy text to clipboard', async () => {
      const result = await StorageManager.copyToClipboard('test');
      expect(result).toBe(true);
    });
  });

  describe('downloadFile', () => {
    it('should create download link', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      StorageManager.downloadFile('content', 'test.json', 'application/json');
      expect(createElementSpy).toHaveBeenCalledWith('a');
    });
  });
});
