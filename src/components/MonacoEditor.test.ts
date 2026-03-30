import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MonacoEditor } from './MonacoEditor.js';

// Mock monaco-editor
vi.mock('monaco-editor', () => ({
  editor: {
    create: vi.fn(() => ({
      getValue: vi.fn(() => ''),
      setValue: vi.fn(),
      getSelection: vi.fn(() => null),
      getModel: vi.fn(() => ({
        getValueInRange: vi.fn(() => ''),
        getLineCount: vi.fn(() => 1),
        getLineContent: vi.fn(() => ''),
      })),
      setSelection: vi.fn(),
      revealRangeInCenter: vi.fn(),
      executeEdits: vi.fn(),
      getAction: vi.fn(() => ({ run: vi.fn() })),
      setPosition: vi.fn(),
      revealLineInCenter: vi.fn(),
      deltaDecorations: vi.fn(() => []),
      onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
      onDidChangeCursorPosition: vi.fn(() => ({ dispose: vi.fn() })),
      onDidChangeCursorSelection: vi.fn(() => ({ dispose: vi.fn() })),
      focus: vi.fn(),
      layout: vi.fn(),
      dispose: vi.fn(),
      getPosition: vi.fn(() => ({ lineNumber: 1, column: 1 })),
    })),
    defineTheme: vi.fn(),
    setModelMarkers: vi.fn(),
  },
  languages: {
    setLanguageConfiguration: vi.fn(),
    setMonarchTokensProvider: vi.fn(),
  },
  Range: class {
    constructor(
      public startLineNumber: number,
      public startColumn: number,
      public endLineNumber: number,
      public endColumn: number
    ) {}
  },
  Position: class {
    constructor(public lineNumber: number, public column: number) {}
  },
  MarkerSeverity: {
    Error: 8,
    Warning: 4,
    Info: 2,
    Hint: 1,
  },
  IDisposable: class {},
}));

describe('MonacoEditor', () => {
  let container: HTMLElement;
  let editor: MonacoEditor;

  beforeEach(() => {
    container = document.createElement('div');
    editor = new MonacoEditor(container);
  });

  afterEach(() => {
    editor.dispose();
  });

  describe('constructor', () => {
    it('should create editor instance', () => {
      expect(editor).toBeDefined();
      expect(editor.getEditor()).not.toBeNull();
    });

    it('should accept options', () => {
      const customEditor = new MonacoEditor(container, {
        value: 'test',
        language: 'json',
        readOnly: true,
      });
      expect(customEditor).toBeDefined();
      customEditor.dispose();
    });
  });

  describe('defineThemes', () => {
    it('should define themes without error', () => {
      expect(() => MonacoEditor.defineThemes()).not.toThrow();
    });
  });

  describe('configureJSONLanguage', () => {
    it('should configure JSON language without error', () => {
      expect(() => MonacoEditor.configureJSONLanguage()).not.toThrow();
    });
  });

  describe('getValue', () => {
    it('should return editor value', () => {
      const value = editor.getValue();
      expect(typeof value).toBe('string');
    });
  });

  describe('setValue', () => {
    it('should set editor value', () => {
      expect(() => editor.setValue('test value')).not.toThrow();
    });
  });

  describe('getSelectedText', () => {
    it('should return selected text', () => {
      const text = editor.getSelectedText();
      expect(typeof text).toBe('string');
    });
  });

  describe('insertText', () => {
    it('should insert text without error', () => {
      expect(() => editor.insertText('inserted')).not.toThrow();
    });
  });

  describe('formatDocument', () => {
    it('should format document without error', () => {
      expect(() => editor.formatDocument()).not.toThrow();
    });
  });

  describe('foldAll', () => {
    it('should fold all without error', () => {
      expect(() => editor.foldAll()).not.toThrow();
    });
  });

  describe('unfoldAll', () => {
    it('should unfold all without error', () => {
      expect(() => editor.unfoldAll()).not.toThrow();
    });
  });

  describe('gotoLine', () => {
    it('should navigate to line without error', () => {
      expect(() => editor.gotoLine(5, 10)).not.toThrow();
    });
  });

  describe('revealLine', () => {
    it('should reveal line without error', () => {
      expect(() => editor.revealLine(5)).not.toThrow();
    });
  });

  describe('highlightLine', () => {
    it('should highlight line without error', () => {
      expect(() => editor.highlightLine(5)).not.toThrow();
    });
  });

  describe('setValidationErrors', () => {
    it('should set validation errors without error', () => {
      const errors = [
        { line: 1, column: 5, message: 'Test error', severity: 'error' as const },
      ];
      expect(() => editor.setValidationErrors(errors)).not.toThrow();
    });

    it('should handle multiple errors', () => {
      const errors = [
        { line: 1, column: 5, message: 'Error 1', severity: 'error' as const },
        { line: 2, column: 10, message: 'Warning 1', severity: 'warning' as const },
      ];
      expect(() => editor.setValidationErrors(errors)).not.toThrow();
    });
  });

  describe('clearValidationErrors', () => {
    it('should clear validation errors without error', () => {
      expect(() => editor.clearValidationErrors()).not.toThrow();
    });
  });

  describe('getLineCount', () => {
    it('should return line count', () => {
      const count = editor.getLineCount();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getLineContent', () => {
    it('should return line content', () => {
      const content = editor.getLineContent(1);
      expect(typeof content).toBe('string');
    });
  });

  describe('onChange', () => {
    it('should register change handler', () => {
      const callback = vi.fn();
      const disposable = editor.onChange(callback);
      expect(disposable).toBeDefined();
      expect(disposable.dispose).toBeDefined();
    });
  });

  describe('onCursorPositionChange', () => {
    it('should register cursor position handler', () => {
      const callback = vi.fn();
      const disposable = editor.onCursorPositionChange(callback);
      expect(disposable).toBeDefined();
    });
  });

  describe('onSelectionChange', () => {
    it('should register selection change handler', () => {
      const callback = vi.fn();
      const disposable = editor.onSelectionChange(callback);
      expect(disposable).toBeDefined();
    });
  });

  describe('focus', () => {
    it('should focus editor without error', () => {
      expect(() => editor.focus()).not.toThrow();
    });
  });

  describe('layout', () => {
    it('should layout editor without error', () => {
      expect(() => editor.layout()).not.toThrow();
    });
  });

  describe('dispose', () => {
    it('should dispose editor without error', () => {
      expect(() => editor.dispose()).not.toThrow();
    });

    it('should set editor to null after dispose', () => {
      editor.dispose();
      expect(editor.getEditor()).toBeNull();
    });
  });
});
