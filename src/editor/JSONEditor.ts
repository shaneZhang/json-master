import { EditorView, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, dropCursor, rectangularSelection, crosshairCursor, keymap, ViewPlugin, Decoration } from '@codemirror/view';
import { EditorState, StateEffect, StateField, RangeSet, Transaction, Range } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { json } from '@codemirror/lang-json';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter, indentOnInput, foldKeymap, syntaxTree } from '@codemirror/language';
import { linter, lintGutter, Diagnostic } from '@codemirror/lint';
import { HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

export interface EditorOptions {
  readonly?: boolean;
  placeholder?: string;
  onChange?: (value: string) => void;
  onErrorChange?: (errors: ParseError[]) => void;
  onFoldChange?: (foldedRanges: FoldedRange[]) => void;
}

export interface ParseError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface FoldedRange {
  from: number;
  to: number;
}

export interface ErrorMarker {
  line: number;
  message: string;
}

const jsonHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: '#a855f7', fontWeight: 'bold' },
  { tag: t.string, color: '#22c55e' },
  { tag: t.number, color: '#f97316' },
  { tag: t.propertyName, color: '#3b82f6' },
  { tag: t.bool, color: '#a855f7', fontWeight: 'bold' },
  { tag: t.null, color: '#a855f7', fontWeight: 'bold' },
  { tag: t.punctuation, color: '#6b7280' },
  { tag: t.bracket, color: '#6b7280' },
  { tag: t.separator, color: '#6b7280' },
]);

const errorLineDecoration = Decoration.line({
  class: 'cm-error-line',
});

const errorLineField = StateField.define<RangeSet<Decoration>>({
  create: () => Decoration.none,
  update: (value, tr) => {
    if (!tr.docChanged) return value;
    return value.map(tr.changes);
  },
  provide: (f) => EditorView.decorations.from(f),
});

const setErrorLinesEffect = StateEffect.define<number[]>();

const errorLinePlugin = ViewPlugin.fromClass(
  class {
    decorations: RangeSet<Decoration>;
    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }
    update(update: { docChanged: boolean; transactions: readonly Transaction[]; view: EditorView }) {
      for (const tr of update.transactions) {
        for (const effect of tr.effects) {
          if (effect.is(setErrorLinesEffect)) {
            this.decorations = this.buildDecorations(update.view, effect.value);
            return;
          }
        }
      }
      if (update.docChanged) {
        this.decorations = this.buildDecorations(update.view);
      }
    }
    buildDecorations(view: EditorView, errorLines?: number[]): RangeSet<Decoration> {
      const lines = errorLines || [];
      const builder: Range<Decoration>[] = [];
      for (const line of lines) {
        const lineInfo = view.state.doc.line(line);
        builder.push(errorLineDecoration.range(lineInfo.from));
      }
      return RangeSet.of(builder);
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

const theme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '13px',
    fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace",
  },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace",
  },
  '.cm-content': {
    caretColor: '#333',
    padding: '8px 0',
  },
  '.cm-line': {
    padding: '0 8px 0 4px',
  },
  '.cm-gutters': {
    backgroundColor: '#f8f9fa',
    borderRight: '1px solid #e5e7eb',
    color: '#6b7280',
  },
  '.cm-gutter': {
    minWidth: '40px',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    padding: '0 8px 0 8px',
    textAlign: 'right',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#e5e7eb',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  '.cm-selectionMatch': {
    backgroundColor: '#fef08a',
  },
  '.cm-cursor': {
    borderLeftColor: '#333',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'rgba(59, 130, 246, 0.25) !important',
  },
  '.cm-error-line': {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  '.cm-error-line .cm-gutterElement': {
    backgroundColor: '#ef4444 !important',
    color: 'white !important',
  },
  '.cm-lintRange-error': {
    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100%25\' height=\'100%25\'%3E%3Cpath d=\'M0 100%25 L0 50%25 L100%25 0\' stroke=\'%23ef4444\' fill=\'none\' stroke-width=\'2\'/%3E%3C/svg%3E")',
    backgroundRepeat: 'repeat-x',
    backgroundPosition: 'bottom',
    paddingBottom: '2px',
  },
  '.cm-lintPoint-error': {
    '&::after': {
      content: '"⚠"',
      color: '#ef4444',
      marginLeft: '4px',
    },
  },
  '.cm-foldGutter': {
    width: '16px',
    cursor: 'pointer',
  },
  '.cm-foldGutter .cm-gutterElement': {
    padding: '0 2px',
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '10px',
  },
  '.cm-foldGutter .cm-gutterElement:hover': {
    color: '#3b82f6',
  },
  '.cm-fold-placeholder': {
    backgroundColor: '#e5e7eb',
    border: '1px solid #d1d5db',
    borderRadius: '3px',
    padding: '0 4px',
    margin: '0 2px',
    color: '#6b7280',
    cursor: 'pointer',
    fontSize: '11px',
  },
  '.cm-fold-placeholder:hover': {
    backgroundColor: '#d1d5db',
  },
  '.cm-tooltip-lint': {
    backgroundColor: '#1f2937',
    color: '#f9fafb',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    maxWidth: '300px',
  },
}, { dark: false });

const darkTheme = EditorView.theme({
  '&': {
    height: '100%',
    color: '#d4d4d4',
  },
  '.cm-scroller': {
    backgroundColor: '#1e1e1e',
  },
  '.cm-content': {
    caretColor: '#d4d4d4',
  },
  '.cm-gutters': {
    backgroundColor: '#252526',
    borderRightColor: '#3c3c3c',
    color: '#858585',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#37373d',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'rgba(59, 130, 246, 0.35) !important',
  },
  '.cm-cursor': {
    borderLeftColor: '#d4d4d4',
  },
  '.cm-error-line': {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  '.cm-fold-placeholder': {
    backgroundColor: '#3c3c3c',
    borderColor: '#4c4c4c',
    color: '#9ca3af',
  },
  '.cm-fold-placeholder:hover': {
    backgroundColor: '#4c4c4c',
  },
  '.cm-tooltip-lint': {
    backgroundColor: '#1f2937',
    color: '#f9fafb',
  },
}, { dark: true });

export class JSONEditor {
  private view: EditorView;
  private state: EditorState;
  private options: EditorOptions;
  private errorLines: number[] = [];
  private changeListener: ((value: string) => void) | null = null;
  private errorChangeListener: ((errors: ParseError[]) => void) | null = null;

  constructor(parent: HTMLElement, options: EditorOptions = {}) {
    this.options = options;
    this.state = this.createState();
    this.view = new EditorView({
      state: this.state,
      parent,
    });
    if (options.onErrorChange) {
      this.errorChangeListener = options.onErrorChange;
    }
  }

  private createState(): EditorState {
    const extensions = [
      lineNumbers(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      history(),
      dropCursor(),
      drawSelection(),
      indentOnInput(),
      bracketMatching(),
      foldGutter({
        openText: '▼',
        closedText: '▶',
      }),
      rectangularSelection(),
      crosshairCursor(),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...foldKeymap,
        indentWithTab,
      ]),
      json(),
      syntaxHighlighting(jsonHighlightStyle),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      linter(this.createLinter(), {
        delay: 100,
      }),
      lintGutter(),
      errorLinePlugin,
      errorLineField,
      theme,
      EditorView.updateListener.of((update) => {
        if (update.docChanged && this.changeListener) {
          this.changeListener(update.state.doc.toString());
        }
      }),
      EditorView.lineWrapping,
    ];

    if (this.options.readonly) {
      extensions.push(EditorState.readOnly.of(true));
    }

    return EditorState.create({
      extensions,
    });
  }

  private createLinter() {
    return (view: EditorView): Diagnostic[] => {
      const diagnostics: Diagnostic[] = [];
      const content = view.state.doc.toString();
      
      if (!content.trim()) {
        if (this.errorChangeListener) {
          this.errorChangeListener([]);
        }
        this.updateErrorLines([]);
        return diagnostics;
      }

      try {
        JSON.parse(content);
        if (this.errorChangeListener) {
          this.errorChangeListener([]);
        }
        this.updateErrorLines([]);
      } catch (error) {
        if (error instanceof SyntaxError) {
          const match = error.message.match(/position (\d+)/);
          let position = match ? parseInt(match[1], 10) : 0;
          
          if (position > content.length) {
            position = content.length;
          }
          
          let message = error.message;
          if (message.includes('Expected')) {
            message = message.replace('Expected', '期望');
          } else if (message.includes('Unexpected')) {
            message = message.replace('Unexpected', '意外的');
          }
          
          const line = view.state.doc.lineAt(Math.min(position, view.state.doc.length));
          const parseError: ParseError = {
            line: line.number,
            column: position - line.from + 1,
            message: `JSON 语法错误: ${message}`,
            severity: 'error',
          };
          
          diagnostics.push({
            from: position,
            to: Math.min(position + 1, content.length),
            message: `JSON 语法错误: ${message}`,
            severity: 'error',
          });
          
          if (this.errorChangeListener) {
            this.errorChangeListener([parseError]);
          }
          this.updateErrorLines([line.number]);
        }
      }

      return diagnostics;
    };
  }

  private updateErrorLines(lines: number[]): void {
    this.errorLines = lines;
    this.view.dispatch({
      effects: setErrorLinesEffect.of(lines),
    });
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

  onChange(callback: (value: string) => void): void {
    this.changeListener = callback;
  }

  onErrorChange(callback: (errors: ParseError[]) => void): void {
    this.errorChangeListener = callback;
  }

  focus(): void {
    this.view.focus();
  }

  destroy(): void {
    this.view.destroy();
  }

  getLineCount(): number {
    return this.view.state.doc.lines;
  }

  goToLine(lineNumber: number): void {
    const line = this.view.state.doc.line(Math.min(lineNumber, this.view.state.doc.lines));
    this.view.dispatch({
      selection: { anchor: line.from, head: line.to },
      scrollIntoView: true,
      effects: EditorView.scrollIntoView(line.from, { y: 'center' }),
    });
    this.focus();
  }

  setSelection(from: number, to: number): void {
    this.view.dispatch({
      selection: { anchor: from, head: to },
      scrollIntoView: true,
      effects: EditorView.scrollIntoView(from, { y: 'center' }),
    });
    this.focus();
  }

  getLinePosition(lineNumber: number): { from: number; to: number } | null {
    if (lineNumber < 1 || lineNumber > this.view.state.doc.lines) {
      return null;
    }
    const line = this.view.state.doc.line(lineNumber);
    return { from: line.from, to: line.to };
  }

  foldAll(): void {
    const { state } = this.view;
    const tree = syntaxTree(state);
    const ranges: { from: number; to: number }[] = [];
    
    tree.iterate({
      enter: (node) => {
        if (node.name === 'Array' || node.name === 'Object') {
          ranges.push({ from: node.from, to: node.to });
        }
      },
    });

    for (let i = ranges.length - 1; i >= 0; i--) {
      const range = ranges[i];
      const lineFrom = state.doc.lineAt(range.from);
      const lineTo = state.doc.lineAt(range.to);
      if (lineFrom.number !== lineTo.number) {
        this.view.dispatch({
          effects: StateEffect.appendConfig.of([]),
        });
      }
    }
  }

  unfoldAll(): void {
    const effects: StateEffect<unknown>[] = [];
    const { state } = this.view;
    
    const folded = state.field(
      StateField.define({
        create: () => Decoration.none,
        update: () => Decoration.none,
      }),
      false
    );
    
    if (folded) {
      this.view.dispatch({
        effects,
      });
    }
  }

  getErrors(): ParseError[] {
    const content = this.view.state.doc.toString();
    const errors: ParseError[] = [];
    
    if (!content.trim()) {
      return errors;
    }

    try {
      JSON.parse(content);
    } catch (error) {
      if (error instanceof SyntaxError) {
        const match = error.message.match(/position (\d+)/);
        const position = match ? parseInt(match[1], 10) : 0;
        const line = this.view.state.doc.lineAt(Math.min(position, this.view.state.doc.length));
        
        errors.push({
          line: line.number,
          column: position - line.from + 1,
          message: error.message,
          severity: 'error',
        });
      }
    }

    return errors;
  }

  setTheme(isDark: boolean): void {
    this.view.dispatch({
      effects: StateEffect.appendConfig.of(isDark ? darkTheme : theme),
    });
  }

  getEditorView(): EditorView {
    return this.view;
  }

  getErrorLines(): number[] {
    return [...this.errorLines];
  }
}
