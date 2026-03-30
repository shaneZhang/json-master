export interface JSONError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
  code?: string;
}

export interface ErrorPanelOptions {
  onErrorClick?: (error: JSONError) => void;
  onErrorHover?: (error: JSONError, event: MouseEvent) => void;
}

export class ErrorPanel {
  private container: HTMLElement;
  private errors: JSONError[] = [];
  private options: ErrorPanelOptions;

  constructor(container: HTMLElement, options: ErrorPanelOptions = {}) {
    this.container = container;
    this.options = options;
    this.init();
  }

  private init(): void {
    this.container.className = 'error-panel';
    this.container.innerHTML = '';
  }

  setErrors(errors: JSONError[]): void {
    this.errors = errors;
    this.render();
  }

  addError(error: JSONError): void {
    this.errors.push(error);
    this.render();
  }

  clearErrors(): void {
    this.errors = [];
    this.render();
  }

  getErrors(): JSONError[] {
    return [...this.errors];
  }

  getErrorCount(): number {
    return this.errors.length;
  }

  getErrorCountBySeverity(severity: 'error' | 'warning'): number {
    return this.errors.filter((e) => e.severity === severity).length;
  }

  private render(): void {
    this.container.innerHTML = '';

    if (this.errors.length === 0) {
      this.renderEmptyState();
      return;
    }

    const header = document.createElement('div');
    header.className = 'error-panel-header';

    const errorCount = this.getErrorCountBySeverity('error');
    const warningCount = this.getErrorCountBySeverity('warning');

    header.innerHTML = `
      <span class="error-count">
        ${errorCount > 0 ? `<span class="error-badge">${errorCount} 错误</span>` : ''}
        ${warningCount > 0 ? `<span class="warning-badge">${warningCount} 警告</span>` : ''}
      </span>
      <button class="clear-errors-btn">清除</button>
    `;

    const clearBtn = header.querySelector('.clear-errors-btn');
    clearBtn?.addEventListener('click', () => {
      this.clearErrors();
    });

    this.container.appendChild(header);

    const list = document.createElement('div');
    list.className = 'error-list';

    this.errors.forEach((error, index) => {
      const item = this.createErrorItem(error, index);
      list.appendChild(item);
    });

    this.container.appendChild(list);
  }

  private renderEmptyState(): void {
    const emptyState = document.createElement('div');
    emptyState.className = 'error-panel-empty';
    emptyState.innerHTML = `
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <p>没有发现错误</p>
    `;
    this.container.appendChild(emptyState);
  }

  private createErrorItem(error: JSONError, index: number): HTMLElement {
    const item = document.createElement('div');
    item.className = `error-item ${error.severity}`;
    item.dataset.index = String(index);

    const icon = error.severity === 'error' ? '✕' : '⚠';
    const location = `第 ${error.line} 行, 第 ${error.column} 列`;

    item.innerHTML = `
      <div class="error-item-header">
        <span class="error-icon ${error.severity}">${icon}</span>
        <span class="error-location">${location}</span>
      </div>
      <div class="error-message">${this.escapeHtml(error.message)}</div>
      ${error.code ? `<div class="error-code">${this.escapeHtml(error.code)}</div>` : ''}
    `;

    item.addEventListener('click', () => {
      this.options.onErrorClick?.(error);
    });

    item.addEventListener('mouseenter', (e) => {
      this.options.onErrorHover?.(error, e as MouseEvent);
      item.classList.add('hovered');
    });

    item.addEventListener('mouseleave', () => {
      item.classList.remove('hovered');
    });

    return item;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  highlightError(line: number, column: number): void {
    const items = this.container.querySelectorAll('.error-item');
    items.forEach((item) => {
      item.classList.remove('highlighted');
    });

    const targetError = this.errors.find(
      (e) => e.line === line && e.column === column
    );

    if (targetError) {
      const index = this.errors.indexOf(targetError);
      const targetItem = this.container.querySelector(`[data-index="${index}"]`);
      targetItem?.classList.add('highlighted');
      targetItem?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  dispose(): void {
    this.container.innerHTML = '';
    this.errors = [];
  }
}

export default ErrorPanel;
