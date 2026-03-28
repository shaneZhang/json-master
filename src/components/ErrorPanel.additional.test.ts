import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorPanel, type JSONError } from './ErrorPanel.js';

describe('ErrorPanel Additional Coverage', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
  });

  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      const errorPanel = new ErrorPanel(container);
      const errors: JSONError[] = [
        { line: 1, column: 1, message: '<script>alert("xss")</script>', severity: 'error' },
      ];
      errorPanel.setErrors(errors);
      const message = container.querySelector('.error-message');
      expect(message?.innerHTML).not.toContain('<script>');
      expect(message?.innerHTML).toContain('&lt;script&gt;');
    });

    it('should handle ampersand', () => {
      const errorPanel = new ErrorPanel(container);
      const errors: JSONError[] = [
        { line: 1, column: 1, message: 'Error & Warning', severity: 'error' },
      ];
      errorPanel.setErrors(errors);
      const message = container.querySelector('.error-message');
      expect(message?.innerHTML).toContain('&amp;');
    });

    it('should handle multiple special characters', () => {
      const errorPanel = new ErrorPanel(container);
      const errors: JSONError[] = [
        { line: 1, column: 1, message: '<div>Test & "quote"</div>', severity: 'error' },
      ];
      errorPanel.setErrors(errors);
      const message = container.querySelector('.error-message');
      expect(message?.innerHTML).toContain('&lt;');
      expect(message?.innerHTML).toContain('&gt;');
      expect(message?.innerHTML).toContain('&amp;');
      expect(message?.innerHTML).toContain('"quote"');
    });
  });

  describe('hover handler', () => {
    it('should call onErrorHover when error item is hovered', () => {
      const onErrorHover = vi.fn();
      const errorPanel = new ErrorPanel(container, { onErrorHover });
      const error: JSONError = { line: 5, column: 10, message: 'Test', severity: 'error' };
      errorPanel.setErrors([error]);
      
      const item = container.querySelector('.error-item');
      const mouseEvent = new MouseEvent('mouseenter', { bubbles: true });
      item?.dispatchEvent(mouseEvent);
      
      expect(onErrorHover).toHaveBeenCalled();
    });

    it('should add hovered class on mouseenter', () => {
      const errorPanel = new ErrorPanel(container);
      errorPanel.setErrors([{ line: 1, column: 1, message: 'Test', severity: 'error' }]);
      
      const item = container.querySelector('.error-item');
      item?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      
      expect(item?.classList.contains('hovered')).toBe(true);
    });

    it('should remove hovered class on mouseleave', () => {
      const errorPanel = new ErrorPanel(container);
      errorPanel.setErrors([{ line: 1, column: 1, message: 'Test', severity: 'error' }]);
      
      const item = container.querySelector('.error-item');
      item?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      item?.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      
      expect(item?.classList.contains('hovered')).toBe(false);
    });
  });

  describe('clear button', () => {
    it('should clear errors when clear button is clicked', () => {
      const errorPanel = new ErrorPanel(container);
      errorPanel.setErrors([{ line: 1, column: 1, message: 'Test', severity: 'error' }]);
      
      const clearBtn = container.querySelector('.clear-errors-btn');
      clearBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      
      expect(errorPanel.getErrorCount()).toBe(0);
    });

    it('should render empty state after clearing via button', () => {
      const errorPanel = new ErrorPanel(container);
      errorPanel.setErrors([{ line: 1, column: 1, message: 'Test', severity: 'error' }]);
      
      const clearBtn = container.querySelector('.clear-errors-btn');
      clearBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      
      expect(container.querySelector('.error-panel-empty')).toBeTruthy();
    });
  });

  describe('error item styling', () => {
    it('should apply error class to error items', () => {
      const errorPanel = new ErrorPanel(container);
      errorPanel.setErrors([{ line: 1, column: 1, message: 'Test', severity: 'error' }]);
      
      const item = container.querySelector('.error-item');
      expect(item?.classList.contains('error')).toBe(true);
    });

    it('should apply warning class to warning items', () => {
      const errorPanel = new ErrorPanel(container);
      errorPanel.setErrors([{ line: 1, column: 1, message: 'Test', severity: 'warning' }]);
      
      const item = container.querySelector('.error-item');
      expect(item?.classList.contains('warning')).toBe(true);
    });

    it('should display error code when provided', () => {
      const errorPanel = new ErrorPanel(container);
      const errors: JSONError[] = [
        { 
          line: 1, 
          column: 1, 
          message: 'Test', 
          severity: 'error',
          code: 'JSON_PARSE_ERROR'
        },
      ];
      errorPanel.setErrors(errors);
      
      const codeEl = container.querySelector('.error-code');
      expect(codeEl).toBeTruthy();
      expect(codeEl?.textContent).toBe('JSON_PARSE_ERROR');
    });
  });

  describe('multiple errors', () => {
    it('should render multiple errors correctly', () => {
      const errorPanel = new ErrorPanel(container);
      const errors: JSONError[] = [
        { line: 1, column: 1, message: 'Error 1', severity: 'error' },
        { line: 2, column: 5, message: 'Error 2', severity: 'error' },
        { line: 3, column: 10, message: 'Warning 1', severity: 'warning' },
      ];
      errorPanel.setErrors(errors);
      
      const items = container.querySelectorAll('.error-item');
      expect(items).toHaveLength(3);
      
      expect(items[0].getAttribute('data-index')).toBe('0');
      expect(items[1].getAttribute('data-index')).toBe('1');
      expect(items[2].getAttribute('data-index')).toBe('2');
    });

    it('should display correct counts in header', () => {
      const errorPanel = new ErrorPanel(container);
      const errors: JSONError[] = [
        { line: 1, column: 1, message: 'Error 1', severity: 'error' },
        { line: 2, column: 5, message: 'Error 2', severity: 'error' },
        { line: 3, column: 10, message: 'Warning 1', severity: 'warning' },
        { line: 4, column: 15, message: 'Warning 2', severity: 'warning' },
      ];
      errorPanel.setErrors(errors);
      
      const errorBadge = container.querySelector('.error-badge');
      const warningBadge = container.querySelector('.warning-badge');
      
      expect(errorBadge?.textContent).toContain('2');
      expect(warningBadge?.textContent).toContain('2');
    });
  });

  describe('getErrors', () => {
    it('should return copy of errors array', () => {
      const errorPanel = new ErrorPanel(container);
      const errors: JSONError[] = [
        { line: 1, column: 1, message: 'Test', severity: 'error' },
      ];
      errorPanel.setErrors(errors);
      const retrieved = errorPanel.getErrors();
      expect(retrieved).toEqual(errors);
      expect(retrieved).not.toBe(errors);
    });
  });
});