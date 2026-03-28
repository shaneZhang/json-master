import { JSONFormatter } from '../utils/jsonFormatter.js';
import { Converters } from '../utils/converters.js';
import { StorageManager, type Settings, defaultSettings } from '../utils/storage.js';
import { JSONEditor, JSONPathNavigator, ErrorListPanel, type ParseError, type TreeNode } from '../editor/index.js';

/// <reference types="chrome" />

class PopupApp {
  private settings: Settings = defaultSettings;
  private inputEditor: JSONEditor | null = null;
  private outputEditor: JSONEditor | null = null;
  private validateEditor: JSONEditor | null = null;
  private convertInputEditor: JSONEditor | null = null;
  private convertOutputEditor: JSONEditor | null = null;
  private pathNavigator: JSONPathNavigator | null = null;
  private errorListPanel: ErrorListPanel | null = null;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    await this.loadSettings();
    this.setupEventListeners();
    this.setupTabs();
    this.initEditors();
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
    const inputContainer = document.getElementById('input-editor-container');
    const outputContainer = document.getElementById('output-editor-container');
    const validateContainer = document.getElementById('validate-editor-container');
    const convertInputContainer = document.getElementById('convert-input-container');
    const convertOutputContainer = document.getElementById('convert-output-container');
    const pathNavContainer = document.getElementById('json-path-nav');
    const errorListContainer = document.getElementById('error-list');

    if (inputContainer) {
      this.inputEditor = new JSONEditor(inputContainer, {
        onChange: (value) => {
          StorageManager.saveCurrentContent(value);
          this.updateStats();
          this.updatePathNavigator(value);
        },
        onErrorChange: (errors) => {
          this.updateErrorList(errors);
        },
      });
    }

    if (outputContainer) {
      this.outputEditor = new JSONEditor(outputContainer, {
        readonly: true,
      });
    }

    if (validateContainer) {
      this.validateEditor = new JSONEditor(validateContainer, {
        onChange: () => {
          this.clearValidationResult();
        },
      });
    }

    if (convertInputContainer) {
      this.convertInputEditor = new JSONEditor(convertInputContainer, {});
    }

    if (convertOutputContainer) {
      this.convertOutputEditor = new JSONEditor(convertOutputContainer, {
        readonly: true,
      });
    }

    if (pathNavContainer) {
      this.pathNavigator = new JSONPathNavigator(pathNavContainer, {
        onNodeClick: (node) => this.handleNodeClick(node),
        onNodeHover: (node) => this.handleNodeHover(node),
      });
    }

    if (errorListContainer) {
      this.errorListPanel = new ErrorListPanel(errorListContainer, {
        onErrorClick: (error) => this.handleErrorClick(error),
      });
    }
  }

  private updatePathNavigator(json: string): void {
    if (this.pathNavigator) {
      this.pathNavigator.parseJSON(json);
    }
  }

  private updateErrorList(errors: ParseError[]): void {
    if (this.errorListPanel) {
      this.errorListPanel.setErrors(errors);
    }
  }

  private handleNodeClick(node: TreeNode): void {
    if (this.inputEditor) {
      this.inputEditor.goToLine(node.position.line);
    }
  }

  private handleNodeHover(node: TreeNode | null): void {
    if (node && this.inputEditor) {
      const pos = this.inputEditor.getLinePosition(node.position.line);
      if (pos) {
        this.inputEditor.setSelection(pos.from, pos.to);
      }
    }
  }

  private handleErrorClick(error: ParseError): void {
    if (this.inputEditor) {
      this.inputEditor.goToLine(error.line);
    }
  }

  private setupEventListeners(): void {
    document.getElementById('btn-format')?.addEventListener('click', () => this.handleFormat());
    document.getElementById('btn-minify')?.addEventListener('click', () => this.handleMinify());
    document.getElementById('btn-paste')?.addEventListener('click', () => this.handlePaste('input'));
    document.getElementById('btn-clear')?.addEventListener('click', () => this.handleClear());
    document.getElementById('btn-sample')?.addEventListener('click', () => this.loadSample());
    document.getElementById('btn-copy')?.addEventListener('click', () => this.handleCopy('output'));
    document.getElementById('btn-download')?.addEventListener('click', () => this.handleDownload('output', 'json'));

    document.getElementById('btn-validate')?.addEventListener('click', () => this.handleValidate());
    document.getElementById('btn-validate-paste')?.addEventListener('click', () => this.handlePaste('validate'));
    document.getElementById('btn-validate-clear')?.addEventListener('click', () => this.handleClearValidate());

    document.getElementById('btn-convert')?.addEventListener('click', () => this.handleConvert());
    document.getElementById('btn-convert-paste')?.addEventListener('click', () => this.handlePaste('convert-input'));
    document.getElementById('btn-convert-clear')?.addEventListener('click', () => this.handleClearConvert());
    document.getElementById('btn-convert-copy')?.addEventListener('click', () => this.handleCopy('convert-output'));
    document.getElementById('btn-convert-download')?.addEventListener('click', () => this.handleConvertDownload());

    document.getElementById('btn-clear-history')?.addEventListener('click', () => this.handleClearHistory());

    document.getElementById('btn-fold-all')?.addEventListener('click', () => this.handleFoldAll());
    document.getElementById('btn-unfold-all')?.addEventListener('click', () => this.handleUnfoldAll());
    document.getElementById('btn-expand-nav')?.addEventListener('click', () => this.handleExpandNav());
    document.getElementById('btn-collapse-nav')?.addEventListener('click', () => this.handleCollapseNav());

    document.getElementById('select-indent')?.addEventListener('change', (e) => this.handleSettingsChange('indent', (e.target as HTMLSelectElement).value));
    document.getElementById('chk-sort-keys')?.addEventListener('change', (e) => this.handleSettingsChange('sortKeys', (e.target as HTMLInputElement).checked));

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

    setTimeout(() => {
      this.refreshEditors();
    }, 50);
  }

  private refreshEditors(): void {
    this.inputEditor?.focus();
  }

  private async loadSavedContent(): Promise<void> {
    const content = await StorageManager.getCurrentContent();
    if (this.inputEditor && content) {
      this.inputEditor.setValue(content);
      this.updateStats();
      this.updatePathNavigator(content);
    }
  }

  private updateStats(): void {
    if (!this.inputEditor) return;

    const content = this.inputEditor.getValue();
    const stats = JSONFormatter.getStats(content);

    const lengthEl = document.getElementById('stats-length');
    const linesEl = document.getElementById('stats-lines');

    if (lengthEl) lengthEl.textContent = `字符: ${stats.length}`;
    if (linesEl) linesEl.textContent = `行数: ${stats.lines}`;
  }

  private handleFormat(): void {
    if (!this.inputEditor || !this.outputEditor) return;

    const input = this.inputEditor.getValue().trim();
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

      this.outputEditor.setValue(result);
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
    if (!this.inputEditor || !this.outputEditor) return;

    const input = this.inputEditor.getValue().trim();
    if (!input) {
      this.showStatus('请输入 JSON 数据', 'error');
      return;
    }

    try {
      const result = JSONFormatter.minify(input);
      this.outputEditor.setValue(result);
      this.showStatus('压缩成功', 'success');
    } catch (error) {
      this.showStatus(`压缩失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error');
    }
  }

  private handleValidate(): void {
    if (!this.validateEditor) return;

    const input = this.validateEditor.getValue().trim();
    const resultContainer = document.getElementById('validation-result');

    if (!resultContainer) return;

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

  private clearValidationResult(): void {
    const resultContainer = document.getElementById('validation-result');
    if (resultContainer) {
      resultContainer.innerHTML = '<div class="result-placeholder">点击"验证 JSON"按钮开始验证</div>';
    }
  }

  private handleConvert(): void {
    if (!this.convertInputEditor || !this.convertOutputEditor) return;

    const input = this.convertInputEditor.getValue().trim();
    const typeSelect = document.getElementById('select-convert-type') as HTMLSelectElement;

    if (!typeSelect) return;

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

      this.convertOutputEditor.setValue(result);
      this.showStatus('转换成功', 'success');

      StorageManager.addHistoryItem({
        content: input,
        type: 'converted',
      });
    } catch (error) {
      this.showStatus(`转换失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error');
    }
  }

  private async handlePaste(editorType: string): Promise<void> {
    try {
      const text = await navigator.clipboard.readText();
      
      switch (editorType) {
        case 'input':
          if (this.inputEditor) {
            this.inputEditor.setValue(text);
            this.showStatus('粘贴成功', 'success');
            this.updateStats();
            this.updatePathNavigator(text);
            StorageManager.saveCurrentContent(text);
          }
          break;
        case 'validate':
          if (this.validateEditor) {
            this.validateEditor.setValue(text);
            this.showStatus('粘贴成功', 'success');
          }
          break;
        case 'convert-input':
          if (this.convertInputEditor) {
            this.convertInputEditor.setValue(text);
            this.showStatus('粘贴成功', 'success');
          }
          break;
      }
    } catch {
      this.showStatus('无法访问剪贴板', 'error');
    }
  }

  private async handleCopy(editorType: string): Promise<void> {
    let content = '';
    
    switch (editorType) {
      case 'output':
        content = this.outputEditor?.getValue() || '';
        break;
      case 'convert-output':
        content = this.convertOutputEditor?.getValue() || '';
        break;
    }

    if (!content) {
      this.showStatus('没有可复制的内容', 'error');
      return;
    }

    const success = await StorageManager.copyToClipboard(content);
    if (success) {
      this.showStatus('已复制到剪贴板', 'success');
    } else {
      this.showStatus('复制失败', 'error');
    }
  }

  private handleClear(): void {
    if (this.inputEditor) {
      this.inputEditor.setValue('');
    }
    if (this.outputEditor) {
      this.outputEditor.setValue('');
    }

    StorageManager.saveCurrentContent('');
    this.updateStats();
    this.updatePathNavigator('');
    this.updateErrorList([]);
    this.showStatus('已清空', 'success');
  }

  private handleClearValidate(): void {
    if (this.validateEditor) {
      this.validateEditor.setValue('');
    }
    this.clearValidationResult();
  }

  private handleClearConvert(): void {
    if (this.convertInputEditor) {
      this.convertInputEditor.setValue('');
    }
    if (this.convertOutputEditor) {
      this.convertOutputEditor.setValue('');
    }
  }

  private handleDownload(editorType: string, type: string): void {
    let content = '';
    
    switch (editorType) {
      case 'output':
        content = this.outputEditor?.getValue() || '';
        break;
      case 'convert-output':
        content = this.convertOutputEditor?.getValue() || '';
        break;
    }

    if (!content) {
      this.showStatus('没有可下载的内容', 'error');
      return;
    }

    const extension = type === 'json' ? 'json' : 'txt';
    const mimeType = type === 'json' ? 'application/json' : 'text/plain';
    const filename = `output.${extension}`;

    StorageManager.downloadFile(content, filename, mimeType);
    this.showStatus('下载已开始', 'success');
  }

  private handleConvertDownload(): void {
    if (!this.convertOutputEditor) return;

    const content = this.convertOutputEditor.getValue();
    const typeSelect = document.getElementById('select-convert-type') as HTMLSelectElement;

    if (!content) {
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

    StorageManager.downloadFile(content, filename, 'text/plain');
    this.showStatus('下载已开始', 'success');
  }

  private async handleClearHistory(): Promise<void> {
    if (confirm('确定要清空所有历史记录吗？')) {
      await StorageManager.clearHistory();
      this.loadHistory();
      this.showStatus('历史记录已清空', 'success');
    }
  }

  private handleFoldAll(): void {
    if (this.inputEditor) {
      this.inputEditor.foldAll();
      this.showStatus('已折叠所有区域', 'success');
    }
  }

  private handleUnfoldAll(): void {
    if (this.inputEditor) {
      this.inputEditor.unfoldAll();
      this.showStatus('已展开所有区域', 'success');
    }
  }

  private handleExpandNav(): void {
    if (this.pathNavigator) {
      this.pathNavigator.expandAll();
    }
  }

  private handleCollapseNav(): void {
    if (this.pathNavigator) {
      this.pathNavigator.collapseAll();
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

    historyList.querySelectorAll('.history-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = (e.target as HTMLElement).getAttribute('data-id');
        if (id) this.deleteHistoryItem(id);
      });
    });

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

    if (item && this.inputEditor) {
      this.inputEditor.setValue(item.content);
      StorageManager.saveCurrentContent(item.content);
      this.updateStats();
      this.updatePathNavigator(item.content);
      this.switchTab('format');
      this.showStatus('已加载历史记录', 'success');
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
      "features": ["格式化", "验证", "转换", "历史记录", "语法高亮", "代码折叠", "路径导航"],
      "settings": {
        "indent": 2,
        "sortKeys": false,
        "theme": "auto"
      },
      "active": true,
      "count": 42,
      "nested": {
        "level1": {
          "level2": {
            "level3": "deep value"
          }
        }
      },
      "nullValue": null
    };

    if (this.inputEditor) {
      this.inputEditor.setValue(JSON.stringify(sampleData));
      this.updateStats();
      this.updatePathNavigator(JSON.stringify(sampleData));
      StorageManager.saveCurrentContent(JSON.stringify(sampleData));
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

document.addEventListener('DOMContentLoaded', () => {
  new PopupApp();
});
