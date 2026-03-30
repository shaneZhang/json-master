import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorPanel, type JSONError } from './ErrorPanel.js';

describe('ErrorPanel', () => {
  let container: HTMLElement;
  let errorPanel: ErrorPanel;

  beforeEach(() => {
    container = document.createElement('div');
    errorPanel = new ErrorPanel(container);
  });

  describe('constructor', () => {
    it('should initialize with empty state', () => {
      expect(errorPanel.getErrors()).toHaveLength(0);
      expect(errorPanel.getErrorCount()).toBe(0);
    });
  });

  describe('setErrors', () => {
    it('should set errors and render them', () => {
      const errors: JSONError[] = [
        { line: 1, column: 5, message: 'Test error', severity: 'error' },
      ];
      errorPanel.setErrors(errors);
      expect(errorPanel.getErrors()).toHaveLength(1);
      expect(errorPanel.getErrorCount()).toBe(1);
    });

    it('should render empty state when no errors', () => {
      errorPanel.setErrors([]);
      expect(container.querySelector('.error-panel-empty')).toBeTruthy();
    });

    it('should render error list when errors exist', () => {
      const errors: JSONError[] = [
        { line: 1, column: 5, message: 'Test error', severity: 'error' },
      ];
      errorPanel.setErrors(errors);
      expect(container.querySelector('.error-list')).toBeTruthy();
      expect(container.querySelectorAll('.error-item')).toHaveLength(1);
    });

    it('should display error count badge', () => {
      const errors: JSONError[] = [
        { line: 1, column: 5, message: 'Error 1', severity: 'error' },
        { line: 2, column: 3, message: 'Error 2', severity: 'error' },
      ];
      errorPanel.setErrors(errors);
      const badge = container.querySelector('.error-badge');
      expect(badge).toBeTruthy();
      expect(badge?.textContent).toContain('2');
    });

    it('should display warning count badge', () => {
      const errors: JSONError[] = [
        { line: 1, column: 5, message: 'Warning 1', severity: 'warning' },
      ];
      errorPanel.setErrors(errors);
      const badge = container.querySelector('.warning-badge');
      expect(badge).toBeTruthy();
      expect(badge?.textContent).toContain('1');
    });

    it('should display both error and warning badges', () => {
      const errors: JSONError[] = [
        { line: 1, column: 5, message: 'Error', severity: 'error' },
        { line: 2, column: 3, message: 'Warning', severity: 'warning' },
      ];
      errorPanel.setErrors(errors);
      expect(container.querySelector('.error-badge')).toBeTruthy();
      expect(container.querySelector('.warning-badge')).toBeTruthy();
    });
  });

  describe('addError', () => {
    it('should add error to existing list', () => {
      errorPanel.setErrors([{ line: 1, column: 1, message: 'First', severity: 'error' }]);
      errorPanel.addError({ line: 2, column: 2, message: 'Second', severity: 'error' });
      expect(errorPanel.getErrorCount()).toBe(2);
    });

    it('should render after adding error', () => {
      errorPanel.addError({ line: 1, column: 1, message: 'Test', severity: 'error' });
      expect(container.querySelector('.error-list')).toBeTruthy();
    });
  });

  describe('clearErrors', () => {
    it('should clear all errors', () => {
      errorPanel.setErrors([{ line: 1, column: 1, message: 'Test', severity: 'error' }]);
      errorPanel.clearErrors();
      expect(errorPanel.getErrors()).toHaveLength(0);
      expect(errorPanel.getErrorCount()).toBe(0);
    });

    it('should render empty state after clearing', () => {
      errorPanel.setErrors([{ line: 1, column: 1, message: 'Test', severity: 'error' }]);
      errorPanel.clearErrors();
      expect(container.querySelector('.error-panel-empty')).toBeTruthy();
    });
  });

  describe('getErrorCountBySeverity', () => {
    it('should return correct error count', () => {
      const errors: JSONError[] = [
        { line: 1, column: 1, message: 'Error 1', severity: 'error' },
        { line: 2, column: 1, message: 'Error 2', severity: 'error' },
        { line: 3, column: 1, message: 'Warning', severity: 'warning' },
      ];
      errorPanel.setErrors(errors);
      expect(errorPanel.getErrorCountBySeverity('error')).toBe(2);
      expect(errorPanel.getErrorCountBySeverity('warning')).toBe(1);
    });

    it('should return 0 when no matching severity', () => {
      errorPanel.setErrors([{ line: 1, column: 1, message: 'Warning', severity: 'warning' }]);
      expect(errorPanel.getErrorCountBySeverity('error')).toBe(0);
    });
  });

  describe('highlightError', () => {
    it('should highlight error by line and column', () => {
      const errors: JSONError[] = [
        { line: 1, column: 5, message: 'Error 1', severity: 'error' },
        { line: 2, column: 10, message: 'Error 2', severity: 'error' },
      ];
      errorPanel.setErrors(errors);
      errorPanel.highlightError(2, 10);
      const items = container.querySelectorAll('.error-item');
      expect(items[1].classList.contains('highlighted')).toBe(true);
    });

    it('should remove highlight from other items', () => {
      const errors: JSONError[] = [
        { line: 1, column: 5, message: 'Error 1', severity: 'error' },
        { line: 2, column: 10, message: 'Error 2', severity: 'error' },
      ];
      errorPanel.setErrors(errors);
      errorPanel.highlightError(2, 10);
      const items = container.querySelectorAll('.error-item');
      expect(items[0].classList.contains('highlighted')).toBe(false);
      expect(items[1].classList.contains('highlighted')).toBe(true);
    });
  });

  describe('error item rendering', () => {
    it('should display error icon for errors', () => {
      errorPanel.setErrors([{ line: 1, column: 5, message: 'Test', severity: 'error' }]);
      const icon = container.querySelector('.error-icon.error');
      expect(icon).toBeTruthy();
      expect(icon?.textContent).toBe('✕');
    });

    it('should display warning icon for warnings', () => {
      errorPanel.setErrors([{ line: 1, column: 5, message: 'Test', severity: 'warning' }]);
      const icon = container.querySelector('.error-icon.warning');
      expect(icon).toBeTruthy();
      expect(icon?.textContent).toBe('⚠');
    });

    it('should display error location', () => {
      errorPanel.setErrors([{ line: 5, column: 10, message: 'Test', severity: 'error' }]);
      const location = container.querySelector('.error-location');
      expect(location).toBeTruthy();
      expect(location?.textContent).toContain('5');
      expect(location?.textContent).toContain('10');
    });

    it('should display error message', () => {
      errorPanel.setErrors([{ line: 1, column: 1, message: 'Test message', severity: 'error' }]);
      const message = container.querySelector('.error-message');
      expect(message).toBeTruthy();
      expect(message?.textContent).toBe('Test message');
    });

    it('should display error code if provided', () => {
      errorPanel.setErrors([{ 
        line: 1, 
        column: 1, 
        message: 'Test', 
        severity: 'error',
        code: 'ERR001'
      }]);
      const code = container.querySelector('.error-code');
      expect(code).toBeTruthy();
      expect(code?.textContent).toBe('ERR001');
    });
  });

  describe('click handler', () => {
    it('should call onErrorClick when error item is clicked', () => {
      const onErrorClick = vi.fn();
      const errorPanelWithHandler = new ErrorPanel(container, { onErrorClick });
      const error: JSONError = { line: 5, column: 10, message: 'Test', severity: 'error' };
      errorPanelWithHandler.setErrors([error]);
      
      const item = container.querySelector('.error-item');
      item?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      
      expect(onErrorClick).toHaveBeenCalledWith(error);
    });
  });

  describe('dispose', () => {
    it('should clear container and errors', () => {
      errorPanel.setErrors([{ line: 1, column: 1, message: 'Test', severity: 'error' }]);
      errorPanel.dispose();
      expect(container.innerHTML).toBe('');
      expect(errorPanel.getErrors()).toHaveLength(0);
    });
  });
});
