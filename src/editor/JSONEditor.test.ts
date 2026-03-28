import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSONEditor, type EditorOptions } from './JSONEditor';

describe('JSONEditor', () => {
  let container: HTMLElement;
  let editor: JSONEditor;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-editor';
    container.style.width = '500px';
    container.style.height = '300px';
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (editor) {
      editor.destroy();
    }
    container.remove();
  });

  describe('constructor', () => {
    it('should create editor with container', () => {
      editor = new JSONEditor(container);
      expect(container.querySelector('.cm-editor')).toBeDefined();
    });

    it('should create editor with options', () => {
      const options: EditorOptions = {
        readonly: true,
        placeholder: 'Enter JSON',
      };
      editor = new JSONEditor(container, options);
      expect(editor).toBeDefined();
    });

    it('should create editor with line numbers', () => {
      editor = new JSONEditor(container);
      expect(container.querySelector('.cm-lineNumbers')).toBeDefined();
    });

    it('should create editor with fold gutter', () => {
      editor = new JSONEditor(container);
      expect(container.querySelector('.cm-foldGutter')).toBeDefined();
    });

    it('should create editor with lint gutter', () => {
      editor = new JSONEditor(container);
      expect(container.querySelector('.cm-lintGutter')).toBeDefined();
    });
  });

  describe('getValue and setValue', () => {
    beforeEach(() => {
      editor = new JSONEditor(container);
    });

    it('should get empty string initially', () => {
      expect(editor.getValue()).toBe('');
    });

    it('should set and get value', () => {
      editor.setValue('{"name":"test"}');
      expect(editor.getValue()).toBe('{"name":"test"}');
    });

    it('should update value', () => {
      editor.setValue('{"a":1}');
      editor.setValue('{"b":2}');
      expect(editor.getValue()).toBe('{"b":2}');
    });

    it('should handle empty value', () => {
      editor.setValue('test');
      editor.setValue('');
      expect(editor.getValue()).toBe('');
    });
  });

  describe('focus', () => {
    beforeEach(() => {
      editor = new JSONEditor(container);
    });

    it('should focus editor', () => {
      editor.focus();
    });
  });

  describe('getLineCount', () => {
    beforeEach(() => {
      editor = new JSONEditor(container);
    });

    it('should return 1 for empty editor', () => {
      expect(editor.getLineCount()).toBe(1);
    });

    it('should return correct line count', () => {
      editor.setValue('{\n"name":"test"\n}');
      expect(editor.getLineCount()).toBe(3);
    });
  });

  describe('goToLine', () => {
    beforeEach(() => {
      editor = new JSONEditor(container);
    });

    it('should jump to line', () => {
      editor.setValue('{\n"name":"test"\n}');
      editor.goToLine(2);
    });

    it('should handle invalid line number', () => {
      editor.setValue('{"test":true}');
      editor.goToLine(100);
    });
  });

  describe('setSelection', () => {
    beforeEach(() => {
      editor = new JSONEditor(container);
    });

    it('should set selection', () => {
      editor.setValue('{"name":"test"}');
      editor.setSelection(0, 5);
    });
  });

  describe('getLinePosition', () => {
    beforeEach(() => {
      editor = new JSONEditor(container);
    });

    it('should return line position', () => {
      editor.setValue('{\n"name":"test"\n}');
      const pos = editor.getLinePosition(2);
      expect(pos).not.toBeNull();
      expect(pos?.from).toBe(2);
    });

    it('should return null for invalid line', () => {
      editor.setValue('{"test":true}');
      const pos = editor.getLinePosition(100);
      expect(pos).toBeNull();
    });

    it('should return null for line 0', () => {
      editor.setValue('{"test":true}');
      const pos = editor.getLinePosition(0);
      expect(pos).toBeNull();
    });
  });

  describe('foldAll and unfoldAll', () => {
    beforeEach(() => {
      editor = new JSONEditor(container);
    });

    it('should fold all regions', () => {
      editor.setValue('{"a":{"b":"value"}}');
      editor.foldAll();
    });

    it('should unfold all regions', () => {
      editor.setValue('{"a":{"b":"value"}}');
      editor.unfoldAll();
    });
  });

  describe('destroy', () => {
    it('should destroy editor', () => {
      editor = new JSONEditor(container);
      editor.destroy();
      expect(container.querySelector('.cm-editor')).toBeNull();
    });
  });

  describe('onChange callback', () => {
    it('should register onChange callback', () => {
      const onChange = vi.fn();
      editor = new JSONEditor(container);
      editor.onChange(onChange);
      
      editor.setValue('{"test": true}');
    });
  });

  describe('onErrorChange callback', () => {
    it('should register onErrorChange callback', () => {
      const onErrorChange = vi.fn();
      editor = new JSONEditor(container);
      editor.onErrorChange(onErrorChange);
      
      editor.setValue('{invalid}');
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      editor = new JSONEditor(container);
    });

    it('should detect invalid JSON', async () => {
      const onErrorChange = vi.fn();
      editor.onErrorChange(onErrorChange);
      
      editor.setValue('{invalid}');
      
      await vi.waitFor(() => {
        expect(onErrorChange).toHaveBeenCalled();
      }, { timeout: 1000 });
    });

    it('should clear errors for valid JSON', async () => {
      const onErrorChange = vi.fn();
      editor.onErrorChange(onErrorChange);
      
      editor.setValue('{"valid": true}');
      
      await vi.waitFor(() => {
        expect(onErrorChange).toHaveBeenCalledWith([]);
      }, { timeout: 1000 });
    });

    it('should clear errors for empty content', async () => {
      const onErrorChange = vi.fn();
      editor.onErrorChange(onErrorChange);
      
      editor.setValue('');
      
      await vi.waitFor(() => {
        expect(onErrorChange).toHaveBeenCalledWith([]);
      }, { timeout: 1000 });
    });
  });

  describe('readonly mode', () => {
    it('should create readonly editor', () => {
      editor = new JSONEditor(container, { readonly: true });
      editor.setValue('test');
      expect(editor.getValue()).toBe('test');
    });
  });

  describe('getErrors', () => {
    beforeEach(() => {
      editor = new JSONEditor(container);
    });

    it('should return empty array for valid JSON', () => {
      editor.setValue('{"valid": true}');
      const errors = editor.getErrors();
      expect(errors).toEqual([]);
    });

    it('should return errors for invalid JSON', () => {
      editor.setValue('{invalid}');
      const errors = editor.getErrors();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].severity).toBe('error');
    });

    it('should return empty array for empty content', () => {
      editor.setValue('');
      const errors = editor.getErrors();
      expect(errors).toEqual([]);
    });
  });

  describe('getErrorLines', () => {
    beforeEach(() => {
      editor = new JSONEditor(container);
    });

    it('should return empty array initially', () => {
      const lines = editor.getErrorLines();
      expect(lines).toEqual([]);
    });
  });

  describe('getEditorView', () => {
    beforeEach(() => {
      editor = new JSONEditor(container);
    });

    it('should return editor view', () => {
      const view = editor.getEditorView();
      expect(view).toBeDefined();
    });
  });

  describe('setTheme', () => {
    beforeEach(() => {
      editor = new JSONEditor(container);
    });

    it('should set dark theme', () => {
      editor.setTheme(true);
    });

    it('should set light theme', () => {
      editor.setTheme(false);
    });
  });
});
