import { JSONFormatter } from '../utils/jsonFormatter.js';
import { Converters } from '../utils/converters.js';
import { StorageManager, type Settings, defaultSettings } from '../utils/storage.js';
import { CodeMirrorEditor } from '../utils/CodeMirrorEditor.js';
import { JSONTreeView, type TreeNode } from '../utils/JSONTreeView.js';
import { ErrorMarker, type ErrorInfo } from '../utils/ErrorMarker.js';

/// <reference types="chrome" />

class PopupApp {
  private settings: Settings = defaultSettings;
  private inputEditor!: CodeMirrorEditor;
  private outputEditor!: CodeMirrorEditor;
  private validateEditor!: CodeMirrorEditor;
  private convertInputEditor!: CodeMirrorEditor;
  private convertOutputEditor!: CodeMirrorEditor;
  private treeView!: JSONTreeView;
  private errorMarker!: ErrorMarker;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    await this.loadSettings();
    this.setupEditors();
    this.setupTreeView();
    this.setupErrorMarker();
    this.setupEventListeners();
    this.setupTabs();
    this.loadSavedContent();
    this.updateStats();
  }

  private setupErrorMarker(): void {
    const errorContainer = document.getElementById('error-container') as HTMLElement;
    this.errorMarker = new ErrorMarker(errorContainer, (error: ErrorInfo) => {
      this.handleErrorClick(error);
    });
  }

  private setupTreeView(): void {
    const treeContainer = document.getElementById('tree-container') as HTMLElement;
    this.treeView = new JSONTreeView(treeContainer, (node: TreeNode) => {
      this.handleTreeNodeClick(node);
    });
  }

  private setupEditors(): void {
    // Replace input textarea with CodeMirror editor
    const inputTextarea = document.getElementById('input-editor') as HTMLTextAreaElement;
    const inputWrapper = inputTextarea.parentElement as HTMLElement;
    inputTextarea.style.display = 'none';
    
    const inputEditorContainer = document.createElement('div');
    inputEditorContainer.style.cssText = 'flex: 1; width: 100%; height: 100%; min-height: 200px;';
    inputWrapper.appendChild(inputEditorContainer);
    
    this.inputEditor = new CodeMirrorEditor(inputEditorContainer, {
      placeholder: '在此粘贴 JSON 数据...',
      onChange: () => this.handleInputChange(),
    });

    // Replace output textarea with CodeMirror editor
    const outputTextarea = document.getElementById('output-editor') as HTMLTextAreaElement;
    const outputWrapper = outputTextarea.parentElement as HTMLElement;
    outputTextarea.style.display = 'none';
    
    const outputEditorContainer = document.createElement('div');
    outputEditorContainer.style.cssText = 'flex: 1; width: 100%; height: 100%; min-height: 200px;';
    outputWrapper.appendChild(outputEditorContainer);
    
    this.outputEditor = new CodeMirrorEditor(outputEditorContainer, {
      readonly: true,
      placeholder: '格式化后的结果将显示在这里...',
    });

    // Replace validate textarea with CodeMirror editor
    const validateTextarea = document.getElementById('validate-input') as HTMLTextAreaElement;
    const validateWrapper = validateTextarea.parentElement as HTMLElement;
    validateTextarea.style.display = 'none';
    
    const validateEditorContainer = document.createElement('div');
    validateEditorContainer.style.cssText = 'flex: 1; width: 100%; height: 100%; min-height: 200px;';
    validateWrapper.appendChild(validateEditorContainer);
    
    this.validateEditor = new CodeMirrorEditor(validateEditorContainer, {
      placeholder: '在此粘贴要验证的 JSON 数据...',
    });

    // Replace convert input textarea with CodeMirror editor
    const convertInputTextarea = document.getElementById('convert-input') as HTMLTextAreaElement;
    const convertInputWrapper = convertInputTextarea.parentElement as HTMLElement;
    convertInputTextarea.style.display = 'none';
    
    const convertInputEditorContainer = document.createElement('div');
    convertInputEditorContainer.style.cssText = 'flex: 1; width: 100%; height: 100%; min-height: 200px;';
    convertInputWrapper.appendChild(convertInputEditorContainer);
    
    this.convertInputEditor = new CodeMirrorEditor(convertInputEditorContainer, {
      placeholder: '在此粘贴数据...',
    });

    // Replace convert output textarea with CodeMirror editor
    const convertOutputTextarea = document.getElementById('convert-output') as HTMLTextAreaElement;
    const convertOutputWrapper = convertOutputTextarea.parentElement as HTMLElement;
    convertOutputTextarea.style.display = 'none';
    
    const convertOutputEditorContainer = document.createElement('div');
    convertOutputEditorContainer.style.cssText = 'flex: 1; width: 100%; height: 100%; min-height: 200px;';
    convertOutputWrapper.appendChild(convertOutputEditorContainer);
    
    this.convertOutputEditor = new CodeMirrorEditor(convertOutputEditorContainer, {
      readonly: true,
      placeholder: '转换后的结果将显示在这里...',
    });
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

    // Tree view
    document.getElementById('tree-search')?.addEventListener('input', (e) => {
      const query = (e.target as HTMLInputElement).value;
      this.treeView.setSearchQuery(query);
    });
    document.getElementById('btn-expand-all')?.addEventListener('click', () => {
      this.treeView.expandAll();
    });
    document.getElementById('btn-collapse-all')?.addEventListener('click', () => {
      this.treeView.collapseAll();
    });

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
    if (content) {
      this.inputEditor.setValue(content);
      this.updateStats();
    }
  }

  private handleInputChange(): void {
    const content = this.inputEditor.getValue();
    StorageManager.saveCurrentContent(content);
    this.updateStats();
    this.updateTreeView();
  }

  private updateTreeView(): void {
    const content = this.inputEditor.getValue().trim();
    if (!content) {
      this.treeView.clear();
      return;
    }

    try {
      const parsed = JSON.parse(content);
      this.treeView.setData(parsed);
    } catch {
      this.treeView.clear();
    }
  }

  private handleTreeNodeClick(node: TreeNode): void {
    const content = this.inputEditor.getValue();
    const pathParts = this.parseJSONPath(node.path);
    const position = this.findPositionInJSON(content, pathParts);
    
    if (position) {
      this.inputEditor.scrollToLine(position.line);
    }
  }

  private handleErrorClick(error: ErrorInfo): void {
    this.validateEditor.scrollToLine(error.line);
  }

  private parseJSONPath(path: string): (string | number)[] {
    const parts: (string | number)[] = [];
    const regex = /\.([^.[\]]+)|\[(\d+)\]/g;
    let match;

    while ((match = regex.exec(path)) !== null) {
      if (match[1]) {
        parts.push(match[1]);
      } else if (match[2]) {
        parts.push(parseInt(match[2], 10));
      }
    }

    return parts;
  }

  private findPositionInJSON(json: string, path: (string | number)[]): { line: number; column: number } | null {
    try {
      const parsed = JSON.parse(json);
      let current: unknown = parsed;
      let searchKey = '';

      for (const part of path) {
        if (current !== null && typeof current === 'object') {
          if (Array.isArray(current) && typeof part === 'number') {
            current = current[part];
            searchKey = String(part);
          } else if (!Array.isArray(current) && typeof part === 'string') {
            current = (current as Record<string, unknown>)[part];
            searchKey = part;
          }
        }
      }

      const lines = json.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const keyMatch = line.indexOf(`"${searchKey}"`);
        if (keyMatch !== -1) {
          return { line: i + 1, column: keyMatch + 1 };
        }
      }

      return { line: 1, column: 1 };
    } catch {
      return null;
    }
  }

  private updateStats(): void {
    const content = this.inputEditor.getValue();
    const stats = JSONFormatter.getStats(content);

    const lengthEl = document.getElementById('stats-length');
    const linesEl = document.getElementById('stats-lines');

    if (lengthEl) lengthEl.textContent = `字符: ${stats.length}`;
    if (linesEl) linesEl.textContent = `行数: ${stats.lines}`;
  }

  private handleFormat(): void {
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
    const resultContainer = document.getElementById('validation-result');
    const errorPanel = document.getElementById('error-panel');
    const errorCount = document.getElementById('error-count');
    
    if (!resultContainer || !errorPanel || !errorCount) return;

    const input = this.validateEditor.getValue().trim();
    if (!input) {
      resultContainer.innerHTML = '<div class="result-error">请输入 JSON 数据</div>';
      errorPanel.style.display = 'none';
      this.validateEditor.clearErrorLines();
      this.errorMarker.clear();
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
      errorPanel.style.display = 'none';
      this.validateEditor.clearErrorLines();
      this.errorMarker.clear();
    } else {
      let errorLocation = '';
      const errors: ErrorInfo[] = [];
      
      if (validation.position !== undefined) {
        const location = JSONFormatter.getErrorLocation(input, validation.position);
        errorLocation = ` (第 ${location.line} 行, 第 ${location.column} 列)`;
        this.validateEditor.setErrorLine(location.line);
        this.validateEditor.scrollToLine(location.line);
        
        errors.push({
          line: location.line,
          column: location.column,
          message: validation.error || 'JSON 格式错误',
          severity: 'error',
        });
      }

      resultContainer.innerHTML = `
        <div class="result-error">
          <div class="result-title">✗ JSON 格式错误${errorLocation}</div>
          <div class="result-message">${validation.error || '未知错误'}</div>
        </div>
      `;
      
      errorPanel.style.display = 'block';
      errorCount.textContent = String(errors.length);
      this.errorMarker.setErrors(errors.map(err => ({
        from: { line: err.line, column: err.column },
        to: { line: err.line, column: err.column + 1 },
        message: err.message,
        severity: err.severity,
      })));
    }
  }

  private handleConvert(): void {
    const typeSelect = document.getElementById('select-convert-type') as HTMLSelectElement;
    if (!typeSelect) return;

    const input = this.convertInputEditor.getValue().trim();
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

  private async handlePaste(editorId: string): Promise<void> {
    try {
      const text = await navigator.clipboard.readText();
      let editor: CodeMirrorEditor | undefined;

      switch (editorId) {
        case 'input-editor':
          editor = this.inputEditor;
          break;
        case 'validate-input':
          editor = this.validateEditor;
          break;
        case 'convert-input':
          editor = this.convertInputEditor;
          break;
      }

      if (editor) {
        editor.setValue(text);
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
    let content = '';

    switch (editorId) {
      case 'output-editor':
        content = this.outputEditor.getValue();
        break;
      case 'convert-output':
        content = this.convertOutputEditor.getValue();
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
    this.inputEditor.clear();
    this.outputEditor.clear();
    StorageManager.saveCurrentContent('');
    this.updateStats();
    this.showStatus('已清空', 'success');
  }

  private handleClearValidate(): void {
    this.validateEditor.clear();
    this.validateEditor.clearErrorLines();
    const resultContainer = document.getElementById('validation-result');
    if (resultContainer) {
      resultContainer.innerHTML = '<div class="result-placeholder">点击"验证 JSON"按钮开始验证</div>';
    }
  }

  private handleClearConvert(): void {
    this.convertInputEditor.clear();
    this.convertOutputEditor.clear();
  }

  private handleDownload(editorId: string, type: string): void {
    let content = '';

    switch (editorId) {
      case 'output-editor':
        content = this.outputEditor.getValue();
        break;
      case 'convert-output':
        content = this.convertOutputEditor.getValue();
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
    const typeSelect = document.getElementById('select-convert-type') as HTMLSelectElement;
    const content = this.convertOutputEditor.getValue();

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
      this.inputEditor.setValue(item.content);
      StorageManager.saveCurrentContent(item.content);
      this.updateStats();
      this.updateTreeView();
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
      "features": ["格式化", "验证", "转换", "历史记录"],
      "settings": {
        "indent": 2,
        "sortKeys": false,
        "theme": "auto"
      },
      "active": true,
      "count": 42
    };

    this.inputEditor.setValue(JSON.stringify(sampleData, null, 2));
    this.handleInputChange();
    this.showStatus('已加载示例数据', 'success');
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
