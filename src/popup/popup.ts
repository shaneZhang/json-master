import { JSONFormatter } from '../utils/jsonFormatter.js';
import { Converters } from '../utils/converters.js';
import { StorageManager, type Settings, defaultSettings } from '../utils/storage.js';
import { MonacoEditor } from '../components/MonacoEditor.js';
import { JSONTreeNavigator } from '../components/JSONTreeNavigator.js';
import { ErrorPanel } from '../components/ErrorPanel.js';
import { JSONValidator } from '../utils/jsonValidator.js';
import type { ValidationError } from '../components/MonacoEditor.js';
import type { JSONError } from '../components/ErrorPanel.js';

/// <reference types="chrome" />

class PopupApp {
  private settings: Settings = defaultSettings;
  private inputEditor: MonacoEditor | null = null;
  private outputEditor: MonacoEditor | null = null;
  private validateEditor: MonacoEditor | null = null;
  private convertInputEditor: MonacoEditor | null = null;
  private convertOutputEditor: MonacoEditor | null = null;
  private jsonTreeNavigator: JSONTreeNavigator | null = null;
  private errorPanel: ErrorPanel | null = null;
  private errorPanelContainer: HTMLElement | null = null;
  private isErrorPanelCollapsed = true;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    MonacoEditor.defineThemes();
    MonacoEditor.configureJSONLanguage();
    
    await this.loadSettings();
    this.initEditors();
    this.initTreeNavigator();
    this.initErrorPanel();
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

  private initEditors(): void {
    const inputContainer = document.getElementById('input-editor');
    const outputContainer = document.getElementById('output-editor');
    const validateContainer = document.getElementById('validate-input');
    const convertInputContainer = document.getElementById('convert-input');
    const convertOutputContainer = document.getElementById('convert-output');

    if (inputContainer) {
      this.inputEditor = new MonacoEditor(inputContainer, {
        language: 'json',
        theme: 'jsonMasterTheme',
        automaticLayout: true,
        minimap: false,
        lineNumbers: 'on',
        folding: true,
      });

      this.inputEditor.onChange(() => {
        this.updateStats();
        this.updateTreeNavigator();
        this.validateAndShowErrors();
        StorageManager.saveCurrentContent(this.inputEditor?.getValue() || '');
      });

      this.inputEditor.onCursorPositionChange((position) => {
        this.updatePosition(position.lineNumber, position.column);
      });
    }

    if (outputContainer) {
      this.outputEditor = new MonacoEditor(outputContainer, {
        language: 'json',
        theme: 'jsonMasterTheme',
        readOnly: true,
        automaticLayout: true,
        minimap: false,
        lineNumbers: 'on',
        folding: true,
      });
    }

    if (validateContainer) {
      this.validateEditor = new MonacoEditor(validateContainer, {
        language: 'json',
        theme: 'jsonMasterTheme',
        automaticLayout: true,
        minimap: false,
        lineNumbers: 'on',
        folding: true,
      });
    }

    if (convertInputContainer) {
      this.convertInputEditor = new MonacoEditor(convertInputContainer, {
        language: 'json',
        theme: 'jsonMasterTheme',
        automaticLayout: true,
        minimap: false,
        lineNumbers: 'on',
        folding: true,
      });
    }

    if (convertOutputContainer) {
      this.convertOutputEditor = new MonacoEditor(convertOutputContainer, {
        language: 'json',
        theme: 'jsonMasterTheme',
        readOnly: true,
        automaticLayout: true,
        minimap: false,
        lineNumbers: 'on',
        folding: true,
      });
    }
  }

  private initTreeNavigator(): void {
    const treeContainer = document.getElementById('json-tree');
    if (!treeContainer) return;

    this.jsonTreeNavigator = new JSONTreeNavigator(treeContainer, {
      onNodeClick: (node) => {
        if (node.line && this.inputEditor) {
          this.inputEditor.gotoLine(node.line, node.column || 1);
          this.inputEditor.focus();
        }
      },
      onNodeHover: () => {
        // 可以在这里添加 tooltip 显示
      },
    });
  }

  private initErrorPanel(): void {
    const errorPanelContainer = document.getElementById('error-panel');
    this.errorPanelContainer = document.getElementById('error-panel-container');
    
    if (!errorPanelContainer) return;

    this.errorPanel = new ErrorPanel(errorPanelContainer, {
      onErrorClick: (error) => {
        if (this.inputEditor) {
          this.inputEditor.gotoLine(error.line, error.column);
          this.inputEditor.focus();
          this.inputEditor.highlightLine(error.line, 'line-highlight');
        }
      },
    });

    const toggleBtn = document.getElementById('btn-toggle-errors');
    toggleBtn?.addEventListener('click', () => {
      this.toggleErrorPanel();
    });

    const header = document.querySelector('.error-panel-header');
    header?.addEventListener('click', (e) => {
      if (e.target !== toggleBtn) {
        this.toggleErrorPanel();
      }
    });
  }

  private toggleErrorPanel(): void {
    this.isErrorPanelCollapsed = !this.isErrorPanelCollapsed;
    this.errorPanelContainer?.classList.toggle('collapsed', this.isErrorPanelCollapsed);
    
    const toggleBtn = document.getElementById('btn-toggle-errors');
    if (toggleBtn) {
      toggleBtn.textContent = this.isErrorPanelCollapsed ? '▲' : '▼';
    }
  }

  private setupEventListeners(): void {
    // Format panel
    document.getElementById('btn-format')?.addEventListener('click', () => this.handleFormat());
    document.getElementById('btn-minify')?.addEventListener('click', () => this.handleMinify());
    document.getElementById('btn-fold-all')?.addEventListener('click', () => this.handleFoldAll());
    document.getElementById('btn-unfold-all')?.addEventListener('click', () => this.handleUnfoldAll());
    document.getElementById('btn-paste')?.addEventListener('click', () => this.handlePaste('input'));
    document.getElementById('btn-clear')?.addEventListener('click', () => this.handleClear());
    document.getElementById('btn-sample')?.addEventListener('click', () => this.loadSample());
    document.getElementById('btn-copy')?.addEventListener('click', () => this.handleCopy('output'));
    document.getElementById('btn-download')?.addEventListener('click', () => this.handleDownload('output', 'json'));

    // Tree navigator
    document.getElementById('btn-expand-tree')?.addEventListener('click', () => {
      this.jsonTreeNavigator?.expandAll();
    });
    document.getElementById('btn-collapse-tree')?.addEventListener('click', () => {
      this.jsonTreeNavigator?.collapseAll();
    });

    const filterInput = document.getElementById('tree-filter-input') as HTMLInputElement;
    filterInput?.addEventListener('input', (e) => {
      const text = (e.target as HTMLInputElement).value;
      this.jsonTreeNavigator?.setFilter(text);
    });

    // Validate panel
    document.getElementById('btn-validate')?.addEventListener('click', () => this.handleValidate());
    document.getElementById('btn-validate-paste')?.addEventListener('click', () => this.handlePaste('validate'));
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
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
    });

    document.querySelectorAll('.panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `panel-${tab}`);
    });

    if (tab === 'history') {
      this.loadHistory();
    }

    // Resize editors when switching tabs
    setTimeout(() => {
      this.inputEditor?.layout();
      this.outputEditor?.layout();
      this.validateEditor?.layout();
      this.convertInputEditor?.layout();
      this.convertOutputEditor?.layout();
    }, 0);
  }

  private async loadSavedContent(): Promise<void> {
    const content = await StorageManager.getCurrentContent();
    if (content && this.inputEditor) {
      this.inputEditor.setValue(content);
      this.updateStats();
      this.updateTreeNavigator();
    }
  }

  private updateStats(): void {
    const content = this.inputEditor?.getValue() || '';
    const stats = JSONFormatter.getStats(content);

    const lengthEl = document.getElementById('stats-length');
    const linesEl = document.getElementById('stats-lines');

    if (lengthEl) lengthEl.textContent = `字符: ${stats.length}`;
    if (linesEl) linesEl.textContent = `行数: ${stats.lines}`;
  }

  private updatePosition(line: number, column: number): void {
    const positionEl = document.getElementById('stats-position');
    if (positionEl) {
      positionEl.textContent = `位置: ${line}:${column}`;
    }
  }

  private updateTreeNavigator(): void {
    const content = this.inputEditor?.getValue() || '';
    if (content.trim()) {
      this.jsonTreeNavigator?.setJSON(content);
    } else {
      const treeContainer = document.getElementById('json-tree');
      if (treeContainer) {
        treeContainer.innerHTML = '<div class="tree-empty">暂无数据</div>';
      }
    }
  }

  private validateAndShowErrors(): void {
    const content = this.inputEditor?.getValue() || '';
    if (!content.trim()) {
      this.inputEditor?.clearValidationErrors();
      this.errorPanel?.clearErrors();
      return;
    }

    const result = JSONValidator.validate(content);
    
    const validationErrors: ValidationError[] = result.errors.map(e => ({
      line: e.line,
      column: e.column,
      message: e.message,
      severity: e.severity,
    }));

    this.inputEditor?.setValidationErrors(validationErrors);
    
    const jsonErrors: JSONError[] = result.errors.map(e => ({
      line: e.line,
      column: e.column,
      message: e.message,
      severity: e.severity,
    }));
    
    this.errorPanel?.setErrors(jsonErrors);

    // Auto-expand error panel if there are errors
    if (result.errors.length > 0 && this.isErrorPanelCollapsed) {
      this.toggleErrorPanel();
    }
  }

  private handleFormat(): void {
    const input = this.inputEditor?.getValue().trim() || '';
    if (!input) {
      this.showStatus('请输入 JSON 数据', 'error');
      return;
    }

    try {
      const indent = typeof this.settings.indent === 'string' 
        ? '\t' 
        : (typeof this.settings.indent === 'number' ? this.settings.indent : 2);
      
      const result = JSONFormatter.format(input, {
        indent,
        sortKeys: this.settings.sortKeys,
        escapeUnicode: this.settings.escapeUnicode,
      });

      this.outputEditor?.setValue(result);
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
    const input = this.inputEditor?.getValue().trim() || '';
    if (!input) {
      this.showStatus('请输入 JSON 数据', 'error');
      return;
    }

    try {
      const result = JSONFormatter.minify(input);
      this.outputEditor?.setValue(result);
      this.showStatus('压缩成功', 'success');
    } catch (error) {
      this.showStatus(`压缩失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error');
    }
  }

  private handleFoldAll(): void {
    this.inputEditor?.foldAll();
    this.outputEditor?.foldAll();
  }

  private handleUnfoldAll(): void {
    this.inputEditor?.unfoldAll();
    this.outputEditor?.unfoldAll();
  }

  private handleValidate(): void {
    const input = this.validateEditor?.getValue().trim() || '';
    const resultContainer = document.getElementById('validation-result');

    if (!resultContainer) return;

    if (!input) {
      resultContainer.innerHTML = '<div class="result-error">请输入 JSON 数据</div>';
      return;
    }

    const validation = JSONValidator.validate(input);

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
      const error = validation.errors[0];
      const location = error ? ` (第 ${error.line} 行, 第 ${error.column} 列)` : '';

      resultContainer.innerHTML = `
        <div class="result-error">
          <div class="result-title">✗ JSON 格式错误${location}</div>
          <div class="result-message">${error?.message || '未知错误'}</div>
        </div>
      `;

      // Highlight error in editor
      if (error) {
        this.validateEditor?.setValidationErrors([{
          line: error.line,
          column: error.column,
          message: error.message,
          severity: error.severity,
        }]);
      }
    }
  }

  private handleConvert(): void {
    const input = this.convertInputEditor?.getValue().trim() || '';
    const typeSelect = document.getElementById('select-convert-type') as HTMLSelectElement;

    if (!input) {
      this.showStatus('请输入数据', 'error');
      return;
    }

    const convertType = typeSelect?.value;

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

      this.convertOutputEditor?.setValue(result);
      this.showStatus('转换成功', 'success');

      StorageManager.addHistoryItem({
        content: input,
        type: 'converted',
      });
    } catch (error) {
      this.showStatus(`转换失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error');
    }
  }

  private async handlePaste(target: string): Promise<void> {
    try {
      const text = await navigator.clipboard.readText();
      
      switch (target) {
        case 'input':
          this.inputEditor?.setValue(text);
          this.updateStats();
          this.updateTreeNavigator();
          StorageManager.saveCurrentContent(text);
          break;
        case 'validate':
          this.validateEditor?.setValue(text);
          break;
        case 'convert-input':
          this.convertInputEditor?.setValue(text);
          break;
      }
      
      this.showStatus('粘贴成功', 'success');
    } catch {
      this.showStatus('无法访问剪贴板', 'error');
    }
  }

  private async handleCopy(target: string): Promise<void> {
    let value = '';
    
    switch (target) {
      case 'output':
        value = this.outputEditor?.getValue() || '';
        break;
      case 'convert-output':
        value = this.convertOutputEditor?.getValue() || '';
        break;
    }

    if (!value) {
      this.showStatus('没有可复制的内容', 'error');
      return;
    }

    const success = await StorageManager.copyToClipboard(value);
    if (success) {
      this.showStatus('已复制到剪贴板', 'success');
    } else {
      this.showStatus('复制失败', 'error');
    }
  }

  private handleClear(): void {
    this.inputEditor?.setValue('');
    this.outputEditor?.setValue('');
    StorageManager.saveCurrentContent('');
    this.updateStats();
    this.updateTreeNavigator();
    this.errorPanel?.clearErrors();
    this.showStatus('已清空', 'success');
  }

  private handleClearValidate(): void {
    this.validateEditor?.setValue('');
    const resultContainer = document.getElementById('validation-result');
    if (resultContainer) {
      resultContainer.innerHTML = '<div class="result-placeholder">点击"验证 JSON"按钮开始验证</div>';
    }
  }

  private handleClearConvert(): void {
    this.convertInputEditor?.setValue('');
    this.convertOutputEditor?.setValue('');
  }

  private handleDownload(target: string, type: string): void {
    let value = '';
    
    switch (target) {
      case 'output':
        value = this.outputEditor?.getValue() || '';
        break;
    }

    if (!value) {
      this.showStatus('没有可下载的内容', 'error');
      return;
    }

    const extension = type === 'json' ? 'json' : 'txt';
    const mimeType = type === 'json' ? 'application/json' : 'text/plain';
    const filename = `output.${extension}`;

    StorageManager.downloadFile(value, filename, mimeType);
    this.showStatus('下载已开始', 'success');
  }

  private handleConvertDownload(): void {
    const value = this.convertOutputEditor?.getValue() || '';
    const typeSelect = document.getElementById('select-convert-type') as HTMLSelectElement;

    if (!value) {
      this.showStatus('没有可下载的内容', 'error');
      return;
    }

    const convertType = typeSelect?.value;
    const extensionMap: Record<string, string> = {
      'json-to-yaml': 'yaml',
      'yaml-to-json': 'json',
      'json-to-js': 'js',
      'json-to-xml': 'xml',
      'json-to-csv': 'csv',
    };

    const extension = extensionMap[convertType] || 'txt';
    const filename = `converted.${extension}`;

    StorageManager.downloadFile(value, filename, 'text/plain');
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

    historyList.innerHTML = history
      .slice()
      .reverse()
      .map((item, index) => {
        const preview = item.content.substring(0, 200);
        const time = new Date(item.timestamp).toLocaleString('zh-CN');
        const typeLabel = item.type === 'formatted' ? '格式化' : '转换';
        
        return `
          <div class="history-item" data-index="${history.length - 1 - index}">
            <div class="history-content">${this.escapeHtml(preview)}${item.content.length > 200 ? '...' : ''}</div>
            <div class="history-meta">
              <span class="history-type">${typeLabel}</span>
              <span class="history-time">${time}</span>
            </div>
          </div>
        `;
      })
      .join('');

    historyList.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt(item.getAttribute('data-index') || '0', 10);
        const historyItem = history[index];
        if (historyItem && this.inputEditor) {
          this.inputEditor.setValue(historyItem.content);
          this.updateStats();
          this.updateTreeNavigator();
          this.switchTab('format');
        }
      });
    });
  }

  private handleSettingsChange(key: keyof Settings, value: unknown): void {
    if (key === 'indent') {
      this.settings.indent = value === 'tab' ? '\t' : parseInt(value as string, 10);
    } else if (key === 'sortKeys') {
      this.settings.sortKeys = value as boolean;
    }
    StorageManager.saveSettings(this.settings);
  }

  private loadSample(): void {
    const sample = {
      name: 'JSON Master',
      version: '1.0.0',
      description: '专业的 JSON 格式化与处理工具',
      features: [
        '格式化',
        '压缩',
        '验证',
        '转换'
      ],
      settings: {
        theme: 'light',
        autoFormat: true,
        indentSize: 2
      },
      author: {
        name: 'Developer',
        email: 'dev@example.com'
      },
      isActive: true,
      downloadCount: 12345,
      license: null
    };

    const sampleJson = JSON.stringify(sample, null, 2);
    this.inputEditor?.setValue(sampleJson);
    this.updateStats();
    this.updateTreeNavigator();
    StorageManager.saveCurrentContent(sampleJson);
    this.showStatus('已加载示例数据', 'success');
  }

  private showStatus(message: string, type: 'success' | 'error' = 'success'): void {
    const statusEl = document.getElementById('status-text');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = type === 'success' ? 'status-success' : 'status-error';
      
      setTimeout(() => {
        statusEl.textContent = '就绪';
        statusEl.className = '';
      }, 3000);
    }
  }

  private openOptions(): void {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.openOptionsPage?.();
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  new PopupApp();
});
