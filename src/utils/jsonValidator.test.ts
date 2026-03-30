import { describe, it, expect } from 'vitest';
import { JSONValidator } from './jsonValidator.js';

describe('JSONValidator', () => {
  describe('validate', () => {
    it('should return valid for empty object', () => {
      const result = JSONValidator.validate('{}');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return valid for empty array', () => {
      const result = JSONValidator.validate('[]');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return valid for complex JSON', () => {
      const json = JSON.stringify({
        name: 'test',
        value: 123,
        active: true,
        data: null,
        items: [1, 2, 3],
        nested: { a: 1, b: 2 }
      });
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid for empty string', () => {
      const result = JSONValidator.validate('');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should return invalid for whitespace only', () => {
      const result = JSONValidator.validate('   ');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect missing closing brace', () => {
      const result = JSONValidator.validate('{"key": "value"');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect missing closing bracket', () => {
      const result = JSONValidator.validate('[1, 2, 3');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect trailing comma in object', () => {
      const result = JSONValidator.validate('{"a": 1,}');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('逗号') || e.message.includes('trailing'))).toBe(true);
    });

    it('should detect trailing comma in array', () => {
      const result = JSONValidator.validate('[1, 2, 3,]');
      expect(result.valid).toBe(false);
    });

    it('should detect single quotes', () => {
      const result = JSONValidator.validate("{'key': 'value'}");
      expect(result.valid).toBe(false);
    });

    it('should detect unquoted keys', () => {
      const result = JSONValidator.validate('{key: "value"}');
      expect(result.valid).toBe(false);
    });

    it('should return correct line and column for error', () => {
      const json = '{\n  "key": "value\n}';
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(false);
      expect(result.errors[0].line).toBeGreaterThan(0);
      expect(result.errors[0].column).toBeGreaterThan(0);
    });

    it('should handle nested JSON errors', () => {
      const json = '{\n  "level1": {\n    "level2": {\n      "invalid\n    }\n  }\n}';
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(false);
    });

    it('should handle very long JSON', () => {
      const obj: Record<string, string> = {};
      for (let i = 0; i < 1000; i++) {
        obj[`key${i}`] = `value${i}`;
      }
      const json = JSON.stringify(obj);
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(true);
    });

    it('should handle Unicode characters', () => {
      const json = '{"name": "测试", "emoji": "🎉"}';
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(true);
    });

    it('should handle special characters in strings', () => {
      const json = '{"text": "Line 1\\nLine 2\\tTabbed"}';
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(true);
    });

    it('should detect extra closing brace', () => {
      const result = JSONValidator.validate('{"a": 1}}');
      expect(result.valid).toBe(false);
    });

    it('should detect extra closing bracket', () => {
      const result = JSONValidator.validate('[1, 2]]');
      expect(result.valid).toBe(false);
    });

    it('should handle deeply nested structures', () => {
      let json = '{"level0": ';
      for (let i = 1; i <= 50; i++) {
        json += `{"level${i}": `;
      }
      json += '"value"';
      for (let i = 1; i <= 50; i++) {
        json += '}';
      }
      json += '}';
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(true);
    });
  });

  describe('getLineColumn', () => {
    it('should return correct position for first line', () => {
      const json = '{"key": "value"}';
      const result = JSONValidator.getLineColumn(json, 2);
      expect(result.line).toBe(1);
      expect(result.column).toBe(3);
    });

    it('should return correct position for multi-line', () => {
      const json = '{\n  "key": "value"\n}';
      const result = JSONValidator.getLineColumn(json, 5);
      expect(result.line).toBe(2);
      expect(result.column).toBe(4);
    });

    it('should handle position at line boundary', () => {
      const json = 'line1\nline2';
      const result = JSONValidator.getLineColumn(json, 6);
      expect(result.line).toBe(2);
      expect(result.column).toBe(1);
    });

    it('should handle empty string', () => {
      const result = JSONValidator.getLineColumn('', 0);
      expect(result.line).toBe(1);
      expect(result.column).toBe(1);
    });
  });

  describe('getPositionFromLineColumn', () => {
    it('should return correct position for first line', () => {
      const json = '{"key": "value"}';
      const result = JSONValidator.getPositionFromLineColumn(json, 1, 3);
      expect(result).toBe(2);
    });

    it('should return correct position for multi-line', () => {
      const json = '{\n  "key": "value"\n}';
      const result = JSONValidator.getPositionFromLineColumn(json, 2, 3);
      expect(result).toBe(4);
    });

    it('should handle line 1 column 1', () => {
      const json = 'test';
      const result = JSONValidator.getPositionFromLineColumn(json, 1, 1);
      expect(result).toBe(0);
    });
  });

  describe('formatErrorMessage', () => {
    it('should format error message correctly', () => {
      const error = {
        line: 5,
        column: 10,
        message: 'Unexpected token',
        severity: 'error' as const,
      };
      const result = JSONValidator.formatErrorMessage(error);
      expect(result).toContain('5');
      expect(result).toContain('10');
      expect(result).toContain('Unexpected token');
    });
  });

  describe('getErrorSummary', () => {
    it('should return "没有错误" for empty errors', () => {
      const result = JSONValidator.getErrorSummary([]);
      expect(result).toBe('没有错误');
    });

    it('should return error count for single error', () => {
      const errors = [{
        line: 1,
        column: 1,
        message: 'Error',
        severity: 'error' as const,
      }];
      const result = JSONValidator.getErrorSummary(errors);
      expect(result).toContain('1');
      expect(result).toContain('错误');
    });

    it('should return both error and warning counts', () => {
      const errors = [
        { line: 1, column: 1, message: 'Error 1', severity: 'error' as const },
        { line: 2, column: 1, message: 'Error 2', severity: 'error' as const },
        { line: 3, column: 1, message: 'Warning', severity: 'warning' as const },
      ];
      const result = JSONValidator.getErrorSummary(errors);
      expect(result).toContain('2');
      expect(result).toContain('错误');
      expect(result).toContain('1');
      expect(result).toContain('警告');
    });
  });
});
