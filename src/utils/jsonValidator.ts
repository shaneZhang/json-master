import type { ValidationError } from '../components/MonacoEditor.js';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ParseError extends SyntaxError {
  position?: number;
  line?: number;
  column?: number;
}

export class JSONValidator {
  static validate(json: string): ValidationResult {
    const errors: ValidationError[] = [];

    if (!json || json.trim() === '') {
      return { valid: false, errors: [{ line: 1, column: 1, message: 'JSON 不能为空', severity: 'error' }] };
    }

    try {
      JSON.parse(json);
      return { valid: true, errors: [] };
    } catch (error) {
      if (error instanceof SyntaxError) {
        const parseError = error as ParseError;
        const position = this.extractPosition(parseError.message, json);
        
        if (position !== undefined) {
          const location = this.getLineColumn(json, position);
          errors.push({
            line: location.line,
            column: location.column,
            message: parseError.message,
            severity: 'error',
          });
        } else {
          errors.push({
            line: 1,
            column: 1,
            message: parseError.message,
            severity: 'error',
          });
        }
      } else {
        errors.push({
          line: 1,
          column: 1,
          message: error instanceof Error ? error.message : '未知错误',
          severity: 'error',
        });
      }

      errors.push(...this.findAdditionalErrors(json));

      return { valid: false, errors };
    }
  }

  private static extractPosition(message: string, json: string): number | undefined {
    const positionMatch = message.match(/position\s+(\d+)/i);
    if (positionMatch) {
      return parseInt(positionMatch[1], 10);
    }

    const lineMatch = message.match(/line\s+(\d+)/i);
    const columnMatch = message.match(/column\s+(\d+)/i);
    
    if (lineMatch && columnMatch) {
      const line = parseInt(lineMatch[1], 10);
      const column = parseInt(columnMatch[1], 10);
      return this.getPositionFromLineColumn(json, line, column);
    }

    return undefined;
  }

  static getLineColumn(json: string, position: number): { line: number; column: number } {
    const lines = json.substring(0, position).split('\n');
    return {
      line: lines.length,
      column: lines[lines.length - 1].length + 1,
    };
  }

  static getPositionFromLineColumn(json: string, line: number, column: number): number {
    const lines = json.split('\n');
    let position = 0;
    
    for (let i = 0; i < line - 1 && i < lines.length; i++) {
      position += lines[i].length + 1;
    }
    
    position += column - 1;
    return position;
  }

  private static findAdditionalErrors(json: string): ValidationError[] {
    const errors: ValidationError[] = [];
    const lines = json.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      const trailingCommaMatch = line.match(/,\s*[}\]]/);
      if (trailingCommaMatch) {
        errors.push({
          line: lineNum,
          column: trailingCommaMatch.index! + 1,
          message: '不允许尾随逗号',
          severity: 'error',
        });
      }

      const singleQuoteMatch = line.match(/'[^']*'/);
      if (singleQuoteMatch) {
        errors.push({
          line: lineNum,
          column: singleQuoteMatch.index! + 1,
          message: 'JSON 字符串必须使用双引号',
          severity: 'error',
        });
      }

      const unquotedKeyMatch = line.match(/[{,]\s*([a-zA-Z_]\w*)\s*:/);
      if (unquotedKeyMatch) {
        errors.push({
          line: lineNum,
          column: line.indexOf(unquotedKeyMatch[1]) + 1,
          message: '对象键必须用双引号包围',
          severity: 'error',
        });
      }

      if ((line.match(/\{/g) || []).length < (line.match(/\}/g) || []).length) {
        const extraClosing = line.lastIndexOf('}');
        if (extraClosing >= 0) {
          errors.push({
            line: lineNum,
            column: extraClosing + 1,
            message: '多余的闭合大括号',
            severity: 'error',
          });
        }
      }

      if ((line.match(/\[/g) || []).length < (line.match(/\]/g) || []).length) {
        const extraClosing = line.lastIndexOf(']');
        if (extraClosing >= 0) {
          errors.push({
            line: lineNum,
            column: extraClosing + 1,
            message: '多余的闭合中括号',
            severity: 'error',
          });
        }
      }
    });

    const openBraces = (json.match(/\{/g) || []).length;
    const closeBraces = (json.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      const lastLine = lines.length;
      errors.push({
        line: lastLine,
        column: lines[lastLine - 1].length,
        message: `大括号不匹配: ${openBraces} 个 '{' 和 ${closeBraces} 个 '}'`,
        severity: 'error',
      });
    }

    const openBrackets = (json.match(/\[/g) || []).length;
    const closeBrackets = (json.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      const lastLine = lines.length;
      errors.push({
        line: lastLine,
        column: lines[lastLine - 1].length,
        message: `中括号不匹配: ${openBrackets} 个 '[' 和 ${closeBrackets} 个 ']'`,
        severity: 'error',
      });
    }

    return errors;
  }

  static formatErrorMessage(error: ValidationError): string {
    return `第 ${error.line} 行, 第 ${error.column} 列: ${error.message}`;
  }

  static getErrorSummary(errors: ValidationError[]): string {
    const errorCount = errors.filter((e) => e.severity === 'error').length;
    const warningCount = errors.filter((e) => e.severity === 'warning').length;

    if (errorCount === 0 && warningCount === 0) {
      return '没有错误';
    }

    const parts: string[] = [];
    if (errorCount > 0) {
      parts.push(`${errorCount} 个错误`);
    }
    if (warningCount > 0) {
      parts.push(`${warningCount} 个警告`);
    }

    return parts.join(', ');
  }
}

export default JSONValidator;
