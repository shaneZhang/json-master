import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ErrorListPanel, type ErrorListOptions } from './ErrorListPanel';
import type { ParseError } from './JSONEditor';

describe('ErrorListPanel', () => {
  let container: HTMLElement;
  let panel: ErrorListPanel;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-error-list';
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (panel) {
      panel.clear();
    }
    container.remove();
  });

  describe('constructor', () => {
    it('should create panel with container', () => {
      panel = new ErrorListPanel(container);
      expect(container.classList.contains('error-list-panel')).toBe(true);
    });

    it('should create panel with options', () => {
      const options: ErrorListOptions = {
        onErrorClick: vi.fn(),
      };
      panel = new ErrorListPanel(container, options);
      expect(panel).toBeDefined();
    });

    it('should be empty initially', () => {
      panel = new ErrorListPanel(container);
      expect(container.classList.contains('empty')).toBe(true);
    });
  });

  describe('setErrors', () => {
    beforeEach(() => {
      panel = new ErrorListPanel(container);
    });

    it('should display errors', () => {
      const errors: ParseError[] = [
        { line: 1, column: 5, message: 'Test error', severity: 'error' },
      ];
      panel.setErrors(errors);
      
      expect(container.classList.contains('empty')).toBe(false);
      expect(container.querySelector('.error-list-item')).toBeDefined();
    });

    it('should display multiple errors', () => {
      const errors: ParseError[] = [
        { line: 1, column: 5, message: 'Error 1', severity: 'error' },
        { line: 3, column: 10, message: 'Error 2', severity: 'error' },
      ];
      panel.setErrors(errors);
      
      const items = container.querySelectorAll('.error-list-item');
      expect(items.length).toBe(2);
    });

    it('should display warning severity', () => {
      const errors: ParseError[] = [
        { line: 1, column: 5, message: 'Warning', severity: 'warning' },
      ];
      panel.setErrors(errors);
      
      expect(container.querySelector('.error-warning')).toBeDefined();
    });

    it('should clear panel when empty array is passed', () => {
      panel.setErrors([{ line: 1, column: 1, message: 'Error', severity: 'error' }]);
      panel.setErrors([]);
      
      expect(container.classList.contains('empty')).toBe(true);
    });
  });

  describe('getErrors', () => {
    beforeEach(() => {
      panel = new ErrorListPanel(container);
    });

    it('should return empty array initially', () => {
      expect(panel.getErrors()).toEqual([]);
    });

    it('should return current errors', () => {
      const errors: ParseError[] = [
        { line: 1, column: 5, message: 'Test error', severity: 'error' },
      ];
      panel.setErrors(errors);
      
      expect(panel.getErrors()).toEqual(errors);
    });

    it('should return a copy of errors', () => {
      const errors: ParseError[] = [
        { line: 1, column: 5, message: 'Test error', severity: 'error' },
      ];
      panel.setErrors(errors);
      
      const retrieved = panel.getErrors();
      expect(retrieved).not.toBe(errors);
      expect(retrieved).toEqual(errors);
    });
  });

  describe('clear', () => {
    beforeEach(() => {
      panel = new ErrorListPanel(container);
    });

    it('should clear all errors', () => {
      panel.setErrors([{ line: 1, column: 1, message: 'Error', severity: 'error' }]);
      panel.clear();
      
      expect(panel.getErrors()).toEqual([]);
      expect(container.classList.contains('empty')).toBe(true);
    });
  });

  describe('hasErrors', () => {
    beforeEach(() => {
      panel = new ErrorListPanel(container);
    });

    it('should return false when no errors', () => {
      expect(panel.hasErrors()).toBe(false);
    });

    it('should return true when there are errors', () => {
      panel.setErrors([{ line: 1, column: 1, message: 'Error', severity: 'error' }]);
      expect(panel.hasErrors()).toBe(true);
    });
  });

  describe('error click callback', () => {
    it('should call onErrorClick when error is clicked', () => {
      const onErrorClick = vi.fn();
      panel = new ErrorListPanel(container, { onErrorClick });
      
      const errors: ParseError[] = [
        { line: 1, column: 5, message: 'Test error', severity: 'error' },
      ];
      panel.setErrors(errors);
      
      const errorItem = container.querySelector('.error-list-item') as HTMLElement;
      if (errorItem) {
        errorItem.click();
        expect(onErrorClick).toHaveBeenCalledWith(errors[0]);
      }
    });
  });

  describe('error display', () => {
    beforeEach(() => {
      panel = new ErrorListPanel(container);
    });

    it('should display error location', () => {
      const errors: ParseError[] = [
        { line: 5, column: 10, message: 'Test error', severity: 'error' },
      ];
      panel.setErrors(errors);
      
      expect(container.textContent).toContain('行 5');
      expect(container.textContent).toContain('列 10');
    });

    it('should display error message', () => {
      const errors: ParseError[] = [
        { line: 1, column: 1, message: 'Custom error message', severity: 'error' },
      ];
      panel.setErrors(errors);
      
      expect(container.textContent).toContain('Custom error message');
    });

    it('should display error count in header', () => {
      const errors: ParseError[] = [
        { line: 1, column: 1, message: 'Error 1', severity: 'error' },
        { line: 2, column: 1, message: 'Error 2', severity: 'error' },
      ];
      panel.setErrors(errors);
      
      expect(container.textContent).toContain('错误 (2)');
    });
  });
});
