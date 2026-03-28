export interface ErrorInfo {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface DiagnosticLike {
  from: { line: number; column: number };
  to: { line: number; column: number };
  message: string;
  severity?: 'error' | 'warning';
}

export class ErrorMarker {
  private container: HTMLElement;
  private errors: ErrorInfo[] = [];
  private onErrorClick?: (error: ErrorInfo) => void;

  constructor(container: HTMLElement, onErrorClick?: (error: ErrorInfo) => void) {
    this.container = container;
    this.onErrorClick = onErrorClick;
  }

  setErrors(diagnostics: DiagnosticLike[]): void {
    this.errors = diagnostics.map(diag => ({
      line: diag.from.line,
      column: diag.from.column,
      message: diag.message,
      severity: diag.severity || 'error',
    }));
    this.render();
  }

  clear(): void {
    this.errors = [];
    this.render();
  }

  render(): void {
    if (this.errors.length === 0) {
      this.container.innerHTML = '<div class="no-errors">没有错误</div>';
      return;
    }

    const errorList = document.createElement('div');
    errorList.className = 'error-list';

    this.errors.forEach((error, index) => {
      const errorItem = document.createElement('div');
      errorItem.className = `error-item error-item-${error.severity}`;
      errorItem.setAttribute('data-index', String(index));

      const errorIcon = document.createElement('span');
      errorIcon.className = 'error-icon';
      errorIcon.textContent = error.severity === 'error' ? '✗' : '⚠';

      const errorContent = document.createElement('div');
      errorContent.className = 'error-content';

      const errorLocation = document.createElement('div');
      errorLocation.className = 'error-location';
      errorLocation.textContent = `第 ${error.line} 行, 第 ${error.column} 列`;

      const errorMessage = document.createElement('div');
      errorMessage.className = 'error-message';
      errorMessage.textContent = error.message;

      errorContent.appendChild(errorLocation);
      errorContent.appendChild(errorMessage);

      errorItem.appendChild(errorIcon);
      errorItem.appendChild(errorContent);

      errorItem.addEventListener('click', () => {
        if (this.onErrorClick) {
          this.onErrorClick(error);
        }
      });

      errorList.appendChild(errorItem);
    });

    this.container.innerHTML = '';
    this.container.appendChild(errorList);
  }
}
