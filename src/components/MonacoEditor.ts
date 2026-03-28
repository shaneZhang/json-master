import * as monaco from 'monaco-editor';

export interface EditorOptions {
  value?: string;
  language?: string;
  readOnly?: boolean;
  theme?: string;
  minimap?: boolean;
  lineNumbers?: 'on' | 'off' | 'relative' | 'interval';
  folding?: boolean;
  automaticLayout?: boolean;
  scrollBeyondLastLine?: boolean;
  wordWrap?: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
  fontSize?: number;
  fontFamily?: string;
  tabSize?: number;
  insertSpaces?: boolean;
  detectIndentation?: boolean;
  formatOnPaste?: boolean;
  formatOnType?: boolean;
}

export interface ValidationError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
}

export class MonacoEditor {
  private editor: monaco.editor.IStandaloneCodeEditor | null = null;
  private container: HTMLElement;
  private disposables: monaco.IDisposable[] = [];
  private validationErrors: ValidationError[] = [];

  constructor(container: HTMLElement, options: EditorOptions = {}) {
    this.container = container;
    this.init(options);
  }

  private init(options: EditorOptions): void {
    const defaultOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
      value: options.value || '',
      language: options.language || 'json',
      theme: options.theme || 'jsonMasterTheme',
      readOnly: options.readOnly ?? false,
      minimap: { enabled: options.minimap ?? false },
      lineNumbers: options.lineNumbers ?? 'on',
      folding: options.folding ?? true,
      automaticLayout: options.automaticLayout ?? true,
      scrollBeyondLastLine: options.scrollBeyondLastLine ?? false,
      wordWrap: options.wordWrap ?? 'on',
      fontSize: options.fontSize ?? 13,
      fontFamily: options.fontFamily ?? "'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace",
      tabSize: options.tabSize ?? 2,
      insertSpaces: options.insertSpaces ?? true,
      detectIndentation: options.detectIndentation ?? false,
      formatOnPaste: options.formatOnPaste ?? true,
      formatOnType: options.formatOnType ?? true,
      renderLineHighlight: 'all',
      selectOnLineNumbers: true,
      roundedSelection: false,
      cursorStyle: 'line',
      glyphMargin: true,
      contextmenu: true,
      quickSuggestions: true,
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnEnter: 'on',
      snippetSuggestions: 'top',
      wordBasedSuggestions: 'currentDocument',
    };

    this.editor = monaco.editor.create(this.container, defaultOptions);
  }

  static defineThemes(): void {
    // 定义自定义主题 - 使用 vs 基础主题确保正确渲染
    monaco.editor.defineTheme('jsonMasterTheme', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'string.key.json', foreground: '0000FF', fontStyle: 'bold' },
        { token: 'string.value.json', foreground: '008000' },
        { token: 'number.json', foreground: 'FFA500' },
        { token: 'keyword.json', foreground: '800080', fontStyle: 'bold' },
        { token: 'delimiter.json', foreground: '000000' },
        { token: 'comment.json', foreground: '808080' },
        { token: '', foreground: '333333' },
      ],
      colors: {
        'editor.background': '#FFFFFF',
        'editor.foreground': '#333333',
        'editorLineNumber.foreground': '#666666',
        'editorLineNumber.activeForeground': '#4CAF50',
        'editor.selectionBackground': '#B3D7FF',
        'editor.inactiveSelectionBackground': '#E5EBF1',
        'editor.lineHighlightBackground': '#F0F0F0',
        'editorCursor.foreground': '#000000',
        'editorWhitespace.foreground': '#CCCCCC',
        'editorIndentGuide.background': '#D3D3D3',
        'editorIndentGuide.activeBackground': '#939393',
        'editorError.foreground': '#F44336',
        'editorError.background': '#FFEBEE',
        'editorWarning.foreground': '#FF9800',
        'editorInfo.foreground': '#2196F3',
        'editorGutter.background': '#FFFFFF',
        'editorGutter.modifiedBackground': '#FFC107',
        'editorGutter.addedBackground': '#4CAF50',
        'editorGutter.deletedBackground': '#F44336',
      },
    });

    monaco.editor.defineTheme('jsonMasterThemeDark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'string.key.json', foreground: '569CD6', fontStyle: 'bold' },
        { token: 'string.value.json', foreground: 'CE9178' },
        { token: 'number.json', foreground: 'B5CEA8' },
        { token: 'keyword.json', foreground: 'C586C0', fontStyle: 'bold' },
        { token: 'delimiter.json', foreground: '#D4D4D4' },
        { token: 'comment.json', foreground: '#6A9955' },
      ],
      colors: {
        'editor.background': '#1E1E1E',
        'editor.foreground': '#D4D4D4',
        'editorLineNumber.foreground': '#858585',
        'editorLineNumber.activeForeground': '#4EC9B0',
        'editor.selectionBackground': '#264F78',
        'editor.inactiveSelectionBackground': '#3A3D41',
        'editor.lineHighlightBackground': '#2D2D30',
        'editorCursor.foreground': '#4EC9B0',
        'editorError.foreground': '#F48771',
        'editorError.background': '#5A1D1D',
        'editorWarning.foreground': '#CCA700',
        'editorInfo.foreground': '#75BEFF',
      },
    });
  }

  static configureJSONLanguage(): void {
    monaco.languages.setLanguageConfiguration('json', {
      brackets: [
        ['{', '}'],
        ['[', ']'],
      ],
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '"', close: '"' },
      ],
      surroundingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '"', close: '"' },
      ],
      folding: {
        offSide: false,
        markers: {
          start: /^\s*\{/,
          end: /^\s*\}/,
        },
      },
    });

    monaco.languages.setMonarchTokensProvider('json', {
      tokenizer: {
        root: [
          [/"(?:[^\\"]|\\.)*"(?=\s*:)/, 'string.key.json'],
          [/"(?:[^\\"]|\\.)*"/, 'string.value.json'],
          [/-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/, 'number.json'],
          [/true|false/, 'keyword.json'],
          [/null/, 'keyword.json'],
          [/[{}[\]]/, 'delimiter.json'],
          [/[,:]/, 'delimiter.json'],
          [/\/\/.*$/, 'comment.json'],
          [/\/\*/, 'comment', '@comment'],
          [/[ \t\r\n]+/, 'white'],
        ],
        comment: [
          [/[^\/*]+/, 'comment'],
          [/\*\//, 'comment', '@pop'],
          [/[\/*]/, 'comment'],
        ],
      },
    });
  }

  getValue(): string {
    return this.editor?.getValue() || '';
  }

  setValue(value: string): void {
    this.editor?.setValue(value);
  }

  getSelectedText(): string {
    const selection = this.editor?.getSelection();
    if (!selection) return '';
    return this.editor?.getModel()?.getValueInRange(selection) || '';
  }

  setSelection(range: monaco.IRange): void {
    this.editor?.setSelection(range);
    this.editor?.revealRangeInCenter(range);
  }

  insertText(text: string, position?: monaco.Position): void {
    if (!this.editor) return;
    
    const pos = position || this.editor.getPosition();
    if (!pos) return;

    const range = new monaco.Range(
      pos.lineNumber,
      pos.column,
      pos.lineNumber,
      pos.column
    );

    this.editor.executeEdits('insert', [
      {
        range,
        text,
        forceMoveMarkers: true,
      },
    ]);
  }

  formatDocument(): void {
    this.editor?.getAction('editor.action.formatDocument')?.run();
  }

  foldAll(): void {
    this.editor?.getAction('editor.foldAll')?.run();
  }

  unfoldAll(): void {
    this.editor?.getAction('editor.unfoldAll')?.run();
  }

  foldLevel(level: number): void {
    this.editor?.getAction(`editor.foldLevel${level}`)?.run();
  }

  gotoLine(lineNumber: number, column: number = 1): void {
    const position = { lineNumber, column };
    this.editor?.setPosition(position);
    this.editor?.revealLineInCenter(lineNumber);
  }

  revealLine(lineNumber: number): void {
    this.editor?.revealLineInCenter(lineNumber);
  }

  highlightLine(lineNumber: number, className: string = 'line-highlight'): void {
    if (!this.editor) return;

    const model = this.editor.getModel();
    if (!model) return;

    const lineContent = model.getLineContent(lineNumber);
    const range = new monaco.Range(lineNumber, 1, lineNumber, lineContent.length + 1);

    const decoration = {
      range,
      options: {
        isWholeLine: true,
        className: `monaco-editor-${className}`,
        glyphMarginClassName: `monaco-editor-glyph-${className}`,
      },
    };

    this.editor.deltaDecorations([], [decoration]);
  }

  setValidationErrors(errors: ValidationError[]): void {
    this.validationErrors = errors;
    this.updateErrorDecorations();
  }

  clearValidationErrors(): void {
    this.validationErrors = [];
    this.updateErrorDecorations();
  }

  private updateErrorDecorations(): void {
    if (!this.editor) return;

    const model = this.editor.getModel();
    if (!model) return;

    const markers: monaco.editor.IMarkerData[] = this.validationErrors.map((error) => ({
      severity: error.severity === 'error' 
        ? monaco.MarkerSeverity.Error 
        : monaco.MarkerSeverity.Warning,
      message: error.message,
      startLineNumber: error.line,
      startColumn: error.column,
      endLineNumber: error.line,
      endColumn: error.column + 1,
    }));

    monaco.editor.setModelMarkers(model, 'json-validation', markers);
  }

  getLineCount(): number {
    return this.editor?.getModel()?.getLineCount() || 0;
  }

  getLineContent(lineNumber: number): string {
    return this.editor?.getModel()?.getLineContent(lineNumber) || '';
  }

  onChange(callback: (value: string) => void): monaco.IDisposable {
    const disposable = this.editor?.onDidChangeModelContent(() => {
      callback(this.getValue());
    });
    if (disposable) {
      this.disposables.push(disposable);
    }
    return disposable!;
  }

  onCursorPositionChange(callback: (position: monaco.Position) => void): monaco.IDisposable {
    const disposable = this.editor?.onDidChangeCursorPosition((e) => {
      callback(e.position);
    });
    if (disposable) {
      this.disposables.push(disposable);
    }
    return disposable!;
  }

  onSelectionChange(callback: (selection: monaco.Selection) => void): monaco.IDisposable {
    const disposable = this.editor?.onDidChangeCursorSelection((e) => {
      callback(e.selection);
    });
    if (disposable) {
      this.disposables.push(disposable);
    }
    return disposable!;
  }

  focus(): void {
    this.editor?.focus();
  }

  layout(): void {
    this.editor?.layout();
  }

  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
    this.editor?.dispose();
    this.editor = null;
  }

  getEditor(): monaco.editor.IStandaloneCodeEditor | null {
    return this.editor;
  }
}

export default MonacoEditor;
