/// <reference types="chrome" />

export interface HistoryItem {
  id: string;
  content: string;
  timestamp: number;
  type: 'formatted' | 'converted';
}

export interface Settings {
  indent: number | 'tab';
  sortKeys: boolean;
  escapeUnicode: boolean;
  theme: 'light' | 'dark' | 'auto';
  autoFormat: boolean;
  maxHistoryItems: number;
}

export const defaultSettings: Settings = {
  indent: 2,
  sortKeys: false,
  escapeUnicode: false,
  theme: 'auto',
  autoFormat: true,
  maxHistoryItems: 20,
};

export class StorageManager {
  private static readonly HISTORY_KEY = 'json_master_history';
  private static readonly SETTINGS_KEY = 'json_master_settings';
  private static readonly CURRENT_CONTENT_KEY = 'json_master_current_content';

  static async getHistory(): Promise<HistoryItem[]> {
    try {
      const result = await chrome.storage.local.get(this.HISTORY_KEY);
      return result[this.HISTORY_KEY] || [];
    } catch {
      return [];
    }
  }

  static async addHistoryItem(item: Omit<HistoryItem, 'id' | 'timestamp'>): Promise<void> {
    try {
      const history = await this.getHistory();
      const settings = await this.getSettings();
      
      const newItem: HistoryItem = {
        ...item,
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        timestamp: Date.now(),
      };
      
      const updatedHistory = [newItem, ...history].slice(0, settings.maxHistoryItems);
      await chrome.storage.local.set({ [this.HISTORY_KEY]: updatedHistory });
    } catch (error) {
      console.error('Failed to add history item:', error);
    }
  }

  static async clearHistory(): Promise<void> {
    try {
      await chrome.storage.local.remove(this.HISTORY_KEY);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  }

  static async deleteHistoryItem(id: string): Promise<void> {
    try {
      const history = await this.getHistory();
      const updatedHistory = history.filter(item => item.id !== id);
      await chrome.storage.local.set({ [this.HISTORY_KEY]: updatedHistory });
    } catch (error) {
      console.error('Failed to delete history item:', error);
    }
  }

  static async getSettings(): Promise<Settings> {
    try {
      const result = await chrome.storage.sync.get(this.SETTINGS_KEY);
      return { ...defaultSettings, ...result[this.SETTINGS_KEY] };
    } catch {
      return defaultSettings;
    }
  }

  static async saveSettings(settings: Partial<Settings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const newSettings = { ...currentSettings, ...settings };
      await chrome.storage.sync.set({ [this.SETTINGS_KEY]: newSettings });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  static async getCurrentContent(): Promise<string> {
    try {
      const result = await chrome.storage.local.get(this.CURRENT_CONTENT_KEY);
      return result[this.CURRENT_CONTENT_KEY] || '';
    } catch {
      return '';
    }
  }

  static async saveCurrentContent(content: string): Promise<void> {
    try {
      await chrome.storage.local.set({ [this.CURRENT_CONTENT_KEY]: content });
    } catch (error) {
      console.error('Failed to save current content:', error);
    }
  }

  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  static async downloadFile(content: string, filename: string, type: string = 'application/json'): Promise<void> {
    try {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
      throw error;
    }
  }
}
