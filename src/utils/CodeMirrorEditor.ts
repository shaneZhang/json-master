import { EditorState, EditorStateConfig, Extension } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine, GutterMarker } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab, insertTab, indentLess, indentMore } from '@codemirror/commands';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { bracketMatching, foldGutter, foldKeymap, syntaxHighlighting, indentUnit, HighlightStyle } from '@codemirror/language';
import { linter, lintKeymap, Diagnostic, setDiagnostics } from '@codemirror/lint';
import { tags } from '@lezer/highlight';

export interface EditorOptions {
  readonly?: boolean;
  placeholder?: string;
  initialValue?: string;
  onChange?: (value: string) => void;
}

export class CodeMirrorEditor {
  private view: EditorView;
  private errorLineMarkers: Map<number, GutterMarker> = new Map();

  constructor(container: HTMLElement, options: EditorOptions = {}) {
    this.view = this.createEditor(container, options);
  }

  private createEditor(container: HTMLElement, options: EditorOptions): EditorView {
    const extensions: Extension[] = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      foldGutter(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      indentUnit.of('  '),
      rectangularSelection(),
      crosshairCursor(),
      highlightActiveLine(),
      bracketMatching(),
      json(),
      linter(jsonParseLinter()),
      this.createTheme(),
      syntaxHighlighting(this.createHighlightStyle()),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...lintKeymap,
        indentWithTab,
        { key: 'Tab', run: insertTab, shift: indentLess },
        { key: 'Ctrl-]', run: indentMore, shift: indentLess },
      ]),
    ];

    if (options.readonly) {
      extensions.push(EditorView.editable.of(false));
      extensions.push(EditorView.contentAttributes.of({ spellcheck: 'false' }));
    }

    if (options.onChange) {
      extensions.push(EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const value = update.state.doc.toString();
          options.onChange!(value);
        }
      }));
    }

    if (options.placeholder) {
      extensions.push(EditorView.contentAttributes.of({
        placeholder: options.placeholder,
      }));
    }

    const stateConfig: EditorStateConfig = {
      doc: options.initialValue || '',
      extensions,
    };

    const state = EditorState.create(stateConfig);

    return new EditorView({
      state,
      parent: container,
    });
  }

  private createTheme(): Extension {
    return EditorView.theme({
      '&': {
        flex: '1',
        height: '100%',
        minHeight: '200px',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace",
        fontSize: '13px',
        lineHeight: '1.5',
      },
      '.cm-content': {
        padding: '12px',
        caretColor: 'var(--text-primary)',
      },
      '.cm-gutters': {
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        color: 'var(--text-secondary)',
        minWidth: '40px',
      },
      '.cm-lineNumbers': {
        minWidth: '40px',
      },
      '.cm-lineNumber': {
        padding: '0 8px',
        textAlign: 'right',
        minWidth: '24px',
      },
      '.cm-foldGutter': {
        width: '20px',
      },
      '.cm-activeLine': {
        backgroundColor: 'rgba(76, 175, 80, 0.05)',
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'var(--bg-secondary)',
      },
      '.cm-selectionBackground': {
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
      },
      '.cm-cursor': {
        borderLeftColor: 'var(--text-primary)',
      },
      '.cm-matchingBracket': {
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        border: '1px solid rgba(76, 175, 80, 0.5)',
      },
      '.cm-nonmatchingBracket': {
        backgroundColor: 'rgba(244, 67, 54, 0.2)',
        border: '1px solid rgba(244, 67, 54, 0.5)',
      },
      '.cm-lint-marker-error': {
        content: '⚠️',
        fontSize: '12px',
        padding: '0 4px',
      },
      '.cm-lint-marker-warning': {
        content: '⚠️',
        fontSize: '12px',
        padding: '0 4px',
      },
      '.cm-diagnostic': {
        padding: '4px 8px',
        fontFamily: 'inherit',
        fontSize: '12px',
      },
      '.cm-diagnostic-error': {
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        borderLeft: '3px solid var(--danger-color)',
      },
      '.cm-diagnostic-warning': {
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        borderLeft: '3px solid #ff9800',
      },
      '.cm-diagnostic-info': {
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        borderLeft: '3px solid #2196f3',
      },
    }, { dark: false });
  }

  private createHighlightStyle(): HighlightStyle {
    return HighlightStyle.define([
      { tag: tags.keyword, color: '#9c27b0' },
      { tag: tags.atom, color: '#9c27b0' },
      { tag: tags.bool, color: '#9c27b0' },
      { tag: tags.null, color: '#9c27b0' },
      { tag: tags.string, color: '#4caf50' },
      { tag: tags.number, color: '#ff9800' },
      { tag: tags.propertyName, color: '#2196f3' },
      { tag: tags.bracket, color: '#757575' },
      { tag: tags.brace, color: '#757575' },
      { tag: tags.separator, color: '#757575' },
      { tag: tags.comment, color: '#9e9e9e', fontStyle: 'italic' },
      { tag: tags.invalid, color: '#f44336', textDecoration: 'underline wavy' },
    ]);
  }

  getValue(): string {
    return this.view.state.doc.toString();
  }

  setValue(value: string): void {
    this.view.dispatch({
      changes: {
        from: 0,
        to: this.view.state.doc.length,
        insert: value,
      },
    });
  }

  focus(): void {
    this.view.focus();
  }

  clear(): void {
    this.setValue('');
  }

  getLineCount(): number {
    return this.view.state.doc.lines;
  }

  getCursorPosition(): { line: number; column: number } {
    const pos = this.view.state.selection.main.head;
    const line = this.view.state.doc.lineAt(pos);
    return {
      line: line.number,
      column: pos - line.from + 1,
    };
  }

  setErrorLine(lineNumber: number): void {
    const marker = new (class extends GutterMarker {
      toDOM() {
        const el = document.createElement('div');
        el.style.backgroundColor = 'rgba(244, 67, 54, 0.3)';
        el.style.width = '100%';
        el.style.height = '100%';
        return el;
      }
    })();

    this.errorLineMarkers.set(lineNumber, marker);
    this.updateErrorLineGutter();
  }

  clearErrorLines(): void {
    this.errorLineMarkers.clear();
    this.updateErrorLineGutter();
  }

  private updateErrorLineGutter(): void {
    this.view.dom.querySelectorAll('.cm-line').forEach((lineEl, index) => {
      const lineNumber = index + 1;
      if (this.errorLineMarkers.has(lineNumber)) {
        lineEl.classList.add('cm-error-line');
      } else {
        lineEl.classList.remove('cm-error-line');
      }
    });
  }

  setDiagnostics(diagnostics: Diagnostic[]): void {
    this.view.dispatch(setDiagnostics(this.view.state, diagnostics));
  }

  scrollToLine(lineNumber: number): void {
    const line = this.view.state.doc.line(lineNumber);
    this.view.dispatch({
      effects: EditorView.scrollIntoView(line.from, { y: 'center' }),
    });
  }

  getView(): EditorView {
    return this.view;
  }

  destroy(): void {
    this.view.destroy();
  }
}
