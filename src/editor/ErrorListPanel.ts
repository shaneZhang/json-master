import type { ParseError } from './JSONEditor';

export interface ErrorListOptions {
  onErrorClick?: (error: ParseError) => void;
}

export class ErrorListPanel {
  private container: HTMLElement;
  private errors: ParseError[] = [];
  private options: ErrorListOptions;

  constructor(container: HTMLElement, options: ErrorListOptions = {}) {
    this.container = container;
    this.options = options;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = '';
    this.container.className = 'error-list-panel';

    if (this.errors.length === 0) {
      this.container.classList.add('empty');
      return;
    }

    const header = document.createElement('div');
    header.className = 'error-list-header';
    header.innerHTML = `
      <span class="error-list-title">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
          <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm1 10H7V7h2v4zm0-5H7V4h2v2z"/>
        </svg>
        错误 (${this.errors.length})
      </span>
    `;
    this.container.appendChild(header);

    const list = document.createElement('div');
    list.className = 'error-list-items';

    for (const error of this.errors) {
      const item = this.createElement(error);
      list.appendChild(item);
    }

    this.container.appendChild(list);
  }

  private createElement(error: ParseError): HTMLElement {
    const item = document.createElement('div');
    item.className = `error-list-item error-${error.severity}`;

    const icon = document.createElement('span');
    icon.className = 'error-icon';
    icon.innerHTML = error.severity === 'error' 
      ? '<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm1 10H7V7h2v4zm0-5H7V4h2v2z"/></svg>'
      : '<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm1 10H7V7h2v4zm0-5H7V4h2v2z"/></svg>';

    const content = document.createElement('div');
    content.className = 'error-content';

    const location = document.createElement('span');
    location.className = 'error-location';
    location.textContent = `行 ${error.line}, 列 ${error.column}`;

    const message = document.createElement('span');
    message.className = 'error-message';
    message.textContent = error.message;

    content.appendChild(location);
    content.appendChild(message);

    item.appendChild(icon);
    item.appendChild(content);

    item.addEventListener('click', () => {
      if (this.options.onErrorClick) {
        this.options.onErrorClick(error);
      }
    });

    return item;
  }

  setErrors(errors: ParseError[]): void {
    this.errors = errors;
    this.render();
  }

  getErrors(): ParseError[] {
    return [...this.errors];
  }

  clear(): void {
    this.errors = [];
    this.render();
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }
}
