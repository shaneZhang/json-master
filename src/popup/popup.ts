import { JSONFormatter } from '../utils/jsonFormatter.js';
import { Converters } from '../utils/converters.js';
import { StorageManager, type Settings, defaultSettings } from '../utils/storage.js';

/// <reference types="chrome" />

class PopupApp {
  private settings: Settings = defaultSettings;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    await this.loadSettings();
    this.setupEventListeners();
    this.setupTabs();
    this.loadSavedContent();
    this.updateStats();
  }

  private async loadSettings(): Promise<void> {
    this.settings = await StorageManager.getSettings();
    this.applySettings();
  }

  private applySettings(): void {
    const indentSelect = document.getElementById('select-indent') as HTMLSelectElement;
    const sortKeysCheckbox = document.getElementById('chk-sort-keys') as HTMLInputElement;

    if (indentSelect) {
      const indentValue = typeof this.settings.indent === 'number' 
        ? String(this.settings.indent) 
        : this.settings.indent;
      indentSelect.value = indentValue === '2' ? '2' : indentValue === '4' ? '4' : 'tab';
    }
    if (sortKeysCheckbox) {
      sortKeysCheckbox.checked = this.settings.sortKeys;
    }
  }

  private setupEventListeners(): void {
    // Format panel
    document.getElementById('btn-format')?.addEventListener('click', () => this.handleFormat());
    document.getElementById('btn-minify')?.addEventListener('click', () => this.handleMinify());
    document.getElementById('btn-paste')?.addEventListener('click', () => this.handlePaste('input-editor'));
    document.getElementById('btn-clear')?.addEventListener('click', () => this.handleClear());
    document.getElementById('btn-sample')?.addEventListener('click', () => this.loadSample());
    document.getElementById('btn-copy')?.addEventListener('click', () => this.handleCopy('output-editor'));
    document.getElementById('btn-download')?.addEventListener('click', () => this.handleDownload('output-editor', 'json'));

    // Validate panel
    document.getElementById('btn-validate')?.addEventListener('click', () => this.handleValidate());
    document.getElementById('btn-validate-paste')?.addEventListener('click', () => this.handlePaste('validate-input'));
    document.getElementById('btn-validate-clear')?.addEventListener('click', () => this.handleClearValidate());

    // Convert panel
    document.getElementById('btn-convert')?.addEventListener('click', () => this.handleConvert());
    document.getElementById('btn-convert-paste')?.addEventListener('click', () => this.handlePaste('convert-input'));
    document.getElementById('btn-convert-clear')?.addEventListener('click', () => this.handleClearConvert());
    document.getElementById('btn-convert-copy')?.addEventListener('click', () => this.handleCopy('convert-output'));
    document.getElementById('btn-convert-download')?.addEventListener('click', () => this.handleConvertDownload());

    // History panel
    document.getElementById('btn-clear-history')?.addEventListener('click', () => this.handleClearHistory());

    // Settings change listeners
    document.getElementById('select-indent')?.addEventListener('change', (e) => this.handleSettingsChange('indent', (e.target as HTMLSelectElement).value));
    document.getElementById('chk-sort-keys')?.addEventListener('change', (e) => this.handleSettingsChange('sortKeys', (e.target as HTMLInputElement).checked));

    // Input change listeners for auto-save
    document.getElementById('input-editor')?.addEventListener('input', () => this.handleInputChange());

    // Settings button
    document.getElementById('btn-settings')?.addEventListener('click', () => this.openOptions());
  }

  private setupTabs(): void {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        if (tab) {
          this.switchTab(tab);
        }
      });
    });
  }

  private switchTab(tab: string): void {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
    });

    // Update panels
    document.querySelectorAll('.panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `panel-${tab}`);
    });

    // Load history if switching to history tab
    if (tab === 'history') {
      this.loadHistory();
    }
  }

  private async loadSavedContent(): Promise<void> {
    const content = await StorageManager.getCurrentContent();
    const inputEditor = document.getElementById('input-editor') as HTMLTextAreaElement;
    if (inputEditor && content) {
      inputEditor.value = content;
      this.updateStats();
    }
  }

  private handleInputChange(): void {
    const inputEditor = document.getElementById('input-editor') as HTMLTextAreaElement;
    if (inputEditor) {
      StorageManager.saveCurrentContent(inputEditor.value);
      this.updateStats();
    }
  }

  private updateStats(): void {
    const inputEditor = document.getElementById('input-editor') as HTMLTextAreaElement;
    if (!inputEditor) return;

    const content = inputEditor.value;
    const stats = JSONFormatter.getStats(content);

    const lengthEl = document.getElementById('stats-length');
    const linesEl = document.getElementById('stats-lines');

    if (lengthEl) lengthEl.textContent = `字符: ${stats.length}`;
    if (linesEl) linesEl.textContent = `行数: ${stats.lines}`;
  }

  private handleFormat(): void {
    const inputEditor = document.getElementById('input-editor') as HTMLTextAreaElement;
    const outputEditor = document.getElementById('output-editor') as HTMLTextAreaElement;

    if (!inputEditor || !outputEditor) return;

    const input = inputEditor.value.trim();
    if (!input) {
      this.showStatus('请输入 JSON 数据', 'error');
      return;
    }

    try {
      const indent = typeof this.settings.indent === 'string' && this.settings.indent === 'tab' 
        ? '\t' 
        : (typeof this.settings.indent === 'number' ? this.settings.indent : 2);
      const result = JSONFormatter.format(input, {
        indent,
        sortKeys: this.settings.sortKeys,
        escapeUnicode: this.settings.escapeUnicode,
      });

      outputEditor.value = result;
      this.showStatus('格式化成功', 'success');

      StorageManager.addHistoryItem({
        content: input,
        type: 'formatted',
      });
    } catch (error) {
      this.showStatus(`格式化失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error');
    }
  }

  private handleMinify(): void {
    const inputEditor = document.getElementById('input-editor') as HTMLTextAreaElement;
    const outputEditor = document.getElementById('output-editor') as HTMLTextAreaElement;

    if (!inputEditor || !outputEditor) return;

    const input = inputEditor.value.trim();
    if (!input) {
      this.showStatus('请输入 JSON 数据', 'error');
      return;
    }

    try {
      const result = JSONFormatter.minify(input);
      outputEditor.value = result;
      this.showStatus('压缩成功', 'success');
    } catch (error) {
      this.showStatus(`压缩失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error');
    }
  }

  private handleValidate(): void {
    const inputEditor = document.getElementById('validate-input') as HTMLTextAreaElement;
    const resultContainer = document.getElementById('validation-result');

    if (!inputEditor || !resultContainer) return;

    const input = inputEditor.value.trim();
    if (!input) {
      resultContainer.innerHTML = '<div class="result-error">请输入 JSON 数据</div>';
      return;
    }

    const validation = JSONFormatter.validate(input);

    if (validation.valid) {
      const stats = JSONFormatter.getStats(input);
      resultContainer.innerHTML = `
        <div class="result-success">
          <div class="result-title">✓ 有效的 JSON</div>
          <div class="result-details">
            <div>字符数: ${stats.length}</div>
            <div>行数: ${stats.lines}</div>
            <div>最大深度: ${stats.depth}</div>
            <div>键数量: ${stats.keys}</div>
            <div>数组数量: ${stats.arrays}</div>
            <div>对象数量: ${stats.objects}</div>
          </div>
        </div>
      `;
    } else {
      let errorLocation = '';
      if (validation.position !== undefined) {
        const location = JSONFormatter.getErrorLocation(input, validation.position);
        errorLocation = ` (第 ${location.line} 行, 第 ${location.column} 列)`;
      }

      resultContainer.innerHTML = `
        <div class="result-error">
          <div class="result-title">✗ JSON 格式错误${errorLocation}</div>
          <div class="result-message">${validation.error || '未知错误'}</div>
        </div>
      `;
    }
  }

  private handleConvert(): void {
    const inputEditor = document.getElementById('convert-input') as HTMLTextAreaElement;
    const outputEditor = document.getElementById('convert-output') as HTMLTextAreaElement;
    const typeSelect = document.getElementById('select-convert-type') as HTMLSelectElement;

    if (!inputEditor || !outputEditor || !typeSelect) return;

    const input = inputEditor.value.trim();
    if (!input) {
      this.showStatus('请输入数据', 'error');
      return;
    }

    const convertType = typeSelect.value;

    try {
      let result = '';
      switch (convertType) {
        case 'json-to-yaml':
          result = Converters.jsonToYaml(input);
          break;
        case 'yaml-to-json':
          result = Converters.yamlToJson(input);
          break;
        case 'json-to-js':
          result = Converters.jsonToJsObject(input);
          break;
        case 'json-to-xml':
          result = Converters.jsonToXml(input);
          break;
        case 'json-to-csv':
          result = Converters.jsonToCsv(input);
          break;
        default:
          throw new Error('未知的转换类型');
      }

      outputEditor.value = result;
      this.showStatus('转换成功', 'success');

      StorageManager.addHistoryItem({
        content: input,
        type: 'converted',
      });
    } catch (error) {
      this.showStatus(`转换失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error');
    }
  }

  private async handlePaste(editorId: string): Promise<void> {
    try {
      const text = await navigator.clipboard.readText();
      const editor = document.getElementById(editorId) as HTMLTextAreaElement;
      if (editor) {
        editor.value = text;
        this.showStatus('粘贴成功', 'success');

        if (editorId === 'input-editor') {
          this.updateStats();
          StorageManager.saveCurrentContent(text);
        }
      }
    } catch {
      this.showStatus('无法访问剪贴板', 'error');
    }
  }

  private async handleCopy(editorId: string): Promise<void> {
    const editor = document.getElementById(editorId) as HTMLTextAreaElement;
    if (!editor || !editor.value) {
      this.showStatus('没有可复制的内容', 'error');
      return;
    }

    const success = await StorageManager.copyToClipboard(editor.value);
    if (success) {
      this.showStatus('已复制到剪贴板', 'success');
    } else {
      this.showStatus('复制失败', 'error');
    }
  }

  private handleClear(): void {
    const inputEditor = document.getElementById('input-editor') as HTMLTextAreaElement;
    const outputEditor = document.getElementById('output-editor') as HTMLTextAreaElement;

    if (inputEditor) inputEditor.value = '';
    if (outputEditor) outputEditor.value = '';

    StorageManager.saveCurrentContent('');
    this.updateStats();
    this.showStatus('已清空', 'success');
  }

  private handleClearValidate(): void {
    const inputEditor = document.getElementById('validate-input') as HTMLTextAreaElement;
    const resultContainer = document.getElementById('validation-result');

    if (inputEditor) inputEditor.value = '';
    if (resultContainer) {
      resultContainer.innerHTML = '<div class="result-placeholder">点击"验证 JSON"按钮开始验证</div>';
    }
  }

  private handleClearConvert(): void {
    const inputEditor = document.getElementById('convert-input') as HTMLTextAreaElement;
    const outputEditor = document.getElementById('convert-output') as HTMLTextAreaElement;

    if (inputEditor) inputEditor.value = '';
    if (outputEditor) outputEditor.value = '';
  }

  private handleDownload(editorId: string, type: string): void {
    const editor = document.getElementById(editorId) as HTMLTextAreaElement;
    if (!editor || !editor.value) {
      this.showStatus('没有可下载的内容', 'error');
      return;
    }

    const extension = type === 'json' ? 'json' : 'txt';
    const mimeType = type === 'json' ? 'application/json' : 'text/plain';
    const filename = `output.${extension}`;

    StorageManager.downloadFile(editor.value, filename, mimeType);
    this.showStatus('下载已开始', 'success');
  }

  private handleConvertDownload(): void {
    const outputEditor = document.getElementById('convert-output') as HTMLTextAreaElement;
    const typeSelect = document.getElementById('select-convert-type') as HTMLSelectElement;

    if (!outputEditor || !outputEditor.value) {
      this.showStatus('没有可下载的内容', 'error');
      return;
    }

    const convertType = typeSelect.value;
    const extensionMap: Record<string, string> = {
      'json-to-yaml': 'yaml',
      'yaml-to-json': 'json',
      'json-to-js': 'js',
      'json-to-xml': 'xml',
      'json-to-csv': 'csv',
    };

    const extension = extensionMap[convertType] || 'txt';
    const filename = `converted.${extension}`;

    StorageManager.downloadFile(outputEditor.value, filename, 'text/plain');
    this.showStatus('下载已开始', 'success');
  }

  private async handleClearHistory(): Promise<void> {
    if (confirm('确定要清空所有历史记录吗？')) {
      await StorageManager.clearHistory();
      this.loadHistory();
      this.showStatus('历史记录已清空', 'success');
    }
  }

  private async loadHistory(): Promise<void> {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;

    const history = await StorageManager.getHistory();

    if (history.length === 0) {
      historyList.innerHTML = '<div class="history-empty">暂无历史记录</div>';
      return;
    }

    historyList.innerHTML = history.map(item => `
      <div class="history-item" data-id="${item.id}">
        <div class="history-content">${this.escapeHtml(item.content.substring(0, 100))}${item.content.length > 100 ? '...' : ''}</div>
        <div class="history-meta">
          <span class="history-type">${item.type === 'formatted' ? '格式化' : '转换'}</span>
          <span class="history-time">${new Date(item.timestamp).toLocaleString()}</span>
          <button class="history-delete" data-id="${item.id}">删除</button>
        </div>
      </div>
    `).join('');

    // Add delete handlers
    historyList.querySelectorAll('.history-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = (e.target as HTMLElement).getAttribute('data-id');
        if (id) this.deleteHistoryItem(id);
      });
    });

    // Add click handlers to load content
    historyList.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-id');
        if (id) this.loadHistoryItem(id);
      });
    });
  }

  private async deleteHistoryItem(id: string): Promise<void> {
    await StorageManager.deleteHistoryItem(id);
    this.loadHistory();
  }

  private async loadHistoryItem(id: string): Promise<void> {
    const history = await StorageManager.getHistory();
    const item = history.find(h => h.id === id);

    if (item) {
      const inputEditor = document.getElementById('input-editor') as HTMLTextAreaElement;
      if (inputEditor) {
        inputEditor.value = item.content;
        StorageManager.saveCurrentContent(item.content);
        this.updateStats();
        this.switchTab('format');
        this.showStatus('已加载历史记录', 'success');
      }
    }
  }

  private handleSettingsChange(key: keyof Settings, value: unknown): void {
    if (key === 'indent') {
      const indentValue = value === 'tab' ? 'tab' : parseInt(value as string, 10);
      this.settings = { ...this.settings, indent: indentValue as number | 'tab' };
    } else if (key === 'sortKeys') {
      this.settings = { ...this.settings, sortKeys: value as boolean };
    }

    StorageManager.saveSettings({ [key]: value });
  }

  private loadSample(): void {
    const sampleData = {
      "name": "JSON Master",
      "version": "1.0.0",
      "description": "专业的 JSON 格式化与处理工具",
      "features": ["格式化", "验证", "转换", "历史记录"],
      "settings": {
        "indent": 2,
        "sortKeys": false,
        "theme": "auto"
      },
      "active": true,
      "count": 42
    };

    const inputEditor = document.getElementById('input-editor') as HTMLTextAreaElement;
    if (inputEditor) {
      inputEditor.value = JSON.stringify(sampleData);
      this.handleInputChange();
      this.showStatus('已加载示例数据', 'success');
    }
  }

  private showStatus(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const statusText = document.getElementById('status-text');
    if (statusText) {
      statusText.textContent = message;
      statusText.className = `status-${type}`;

      setTimeout(() => {
        statusText.className = '';
      }, 3000);
    }
  }

  private openOptions(): void {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupApp();
});
