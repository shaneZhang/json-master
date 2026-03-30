/// <reference types="chrome" />

import { StorageManager, defaultSettings, type Settings } from '../utils/storage.js';

class OptionsPage {
  private settings: Settings = defaultSettings;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    await this.loadSettings();
    this.setupEventListeners();
  }

  private async loadSettings(): Promise<void> {
    this.settings = await StorageManager.getSettings();
    this.applySettingsToUI();
  }

  private applySettingsToUI(): void {
    // Format options
    const indentSelect = document.getElementById('indent') as HTMLSelectElement;
    const sortKeysCheckbox = document.getElementById('sortKeys') as HTMLInputElement;
    const escapeUnicodeCheckbox = document.getElementById('escapeUnicode') as HTMLInputElement;

    // UI settings
    const themeSelect = document.getElementById('theme') as HTMLSelectElement;
    const autoFormatCheckbox = document.getElementById('autoFormat') as HTMLInputElement;
    const maxHistoryInput = document.getElementById('maxHistoryItems') as HTMLInputElement;

    if (indentSelect) {
      const indentValue = typeof this.settings.indent === 'number' 
        ? String(this.settings.indent) 
        : 'tab';
      indentSelect.value = indentValue === '2' ? '2' : indentValue === '4' ? '4' : 'tab';
    }

    if (sortKeysCheckbox) sortKeysCheckbox.checked = this.settings.sortKeys;
    if (escapeUnicodeCheckbox) escapeUnicodeCheckbox.checked = this.settings.escapeUnicode;
    if (themeSelect) themeSelect.value = this.settings.theme;
    if (autoFormatCheckbox) autoFormatCheckbox.checked = this.settings.autoFormat;
    if (maxHistoryInput) maxHistoryInput.value = String(this.settings.maxHistoryItems);
  }

  private setupEventListeners(): void {
    // Save button
    document.getElementById('saveSettings')?.addEventListener('click', () => this.saveSettings());
    
    // Reset button
    document.getElementById('resetSettings')?.addEventListener('click', () => this.resetSettings());
    
    // Clear history button
    document.getElementById('clearHistory')?.addEventListener('click', () => this.clearHistory());
  }

  private async saveSettings(): Promise<void> {
    try {
      const indentSelect = document.getElementById('indent') as HTMLSelectElement;
      const sortKeysCheckbox = document.getElementById('sortKeys') as HTMLInputElement;
      const escapeUnicodeCheckbox = document.getElementById('escapeUnicode') as HTMLInputElement;
      const themeSelect = document.getElementById('theme') as HTMLSelectElement;
      const autoFormatCheckbox = document.getElementById('autoFormat') as HTMLInputElement;
      const maxHistoryInput = document.getElementById('maxHistoryItems') as HTMLInputElement;

      const indentValue = indentSelect.value === 'tab' ? '\t' : parseInt(indentSelect.value, 10);

      const newSettings: Partial<Settings> = {
        indent: indentValue,
        sortKeys: sortKeysCheckbox.checked,
        escapeUnicode: escapeUnicodeCheckbox.checked,
        theme: themeSelect.value as 'light' | 'dark' | 'auto',
        autoFormat: autoFormatCheckbox.checked,
        maxHistoryItems: parseInt(maxHistoryInput.value, 10) || 20,
      };

      await StorageManager.saveSettings(newSettings);
      this.settings = { ...this.settings, ...newSettings };
      
      this.showStatus('设置已保存', 'success');
    } catch (error) {
      this.showStatus('保存失败: ' + (error instanceof Error ? error.message : '未知错误'), 'error');
    }
  }

  private async resetSettings(): Promise<void> {
    if (confirm('确定要恢复默认设置吗？')) {
      await StorageManager.saveSettings(defaultSettings);
      this.settings = defaultSettings;
      this.applySettingsToUI();
      this.showStatus('已恢复默认设置', 'success');
    }
  }

  private async clearHistory(): Promise<void> {
    if (confirm('确定要清空所有历史记录吗？此操作不可撤销。')) {
      await StorageManager.clearHistory();
      this.showStatus('历史记录已清空', 'success');
    }
  }

  private showStatus(message: string, type: 'success' | 'error'): void {
    const statusEl = document.getElementById('statusMessage');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = `status-message ${type} show`;
      
      setTimeout(() => {
        statusEl.classList.remove('show');
      }, 3000);
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new OptionsPage();
});
