import { describe, it, expect } from 'vitest';
import { JSONFormatter, defaultFormatOptions } from './jsonFormatter';

describe('JSONFormatter', () => {
  describe('format', () => {
    it('should format valid JSON with default options', () => {
      const input = '{"name":"test","value":123}';
      const result = JSONFormatter.format(input);
      expect(result).toBe('{\n  "name": "test",\n  "value": 123\n}');
    });

    it('should format JSON with 4 spaces indent', () => {
      const input = '{"name":"test"}';
      const result = JSONFormatter.format(input, { indent: 4, sortKeys: false, escapeUnicode: false });
      expect(result).toBe('{\n    "name": "test"\n}');
    });

    it('should format JSON with tab indent', () => {
      const input = '{"name":"test"}';
      const result = JSONFormatter.format(input, { indent: '\t', sortKeys: false, escapeUnicode: false });
      expect(result).toBe('{\n\t"name": "test"\n}');
    });

    it('should sort keys when sortKeys is true', () => {
      const input = '{"z":1,"a":2,"m":3}';
      const result = JSONFormatter.format(input, { indent: 2, sortKeys: true, escapeUnicode: false });
      expect(result).toBe('{\n  "a": 2,\n  "m": 3,\n  "z": 1\n}');
    });

    it('should escape unicode characters when escapeUnicode is true', () => {
      const input = '{"name":"测试"}';
      const result = JSONFormatter.format(input, { indent: 2, sortKeys: false, escapeUnicode: true });
      expect(result).toContain('\\u');
    });

    it('should throw error for invalid JSON', () => {
      const input = '{invalid}';
      expect(() => JSONFormatter.format(input)).toThrow('格式化失败');
    });

    it('should handle nested objects', () => {
      const input = '{"outer":{"inner":"value"}}';
      const result = JSONFormatter.format(input);
      expect(result).toContain('"outer"');
      expect(result).toContain('"inner"');
    });

    it('should handle arrays', () => {
      const input = '[1,2,3]';
      const result = JSONFormatter.format(input);
      expect(result).toBe('[\n  1,\n  2,\n  3\n]');
    });

    it('should handle null values', () => {
      const input = '{"value":null}';
      const result = JSONFormatter.format(input);
      expect(result).toContain('null');
    });

    it('should handle boolean values', () => {
      const input = '{"active":true,"disabled":false}';
      const result = JSONFormatter.format(input);
      expect(result).toContain('true');
      expect(result).toContain('false');
    });
  });

  describe('minify', () => {
    it('should minify formatted JSON', () => {
      const input = '{\n  "name": "test",\n  "value": 123\n}';
      const result = JSONFormatter.minify(input);
      expect(result).toBe('{"name":"test","value":123}');
    });

    it('should return same string for already minified JSON', () => {
      const input = '{"name":"test"}';
      const result = JSONFormatter.minify(input);
      expect(result).toBe('{"name":"test"}');
    });

    it('should throw error for invalid JSON', () => {
      const input = '{invalid}';
      expect(() => JSONFormatter.minify(input)).toThrow('压缩失败');
    });
  });

  describe('validate', () => {
    it('should return valid for correct JSON', () => {
      const input = '{"name":"test"}';
      const result = JSONFormatter.validate(input);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for incorrect JSON', () => {
      const input = '{"name":}';
      const result = JSONFormatter.validate(input);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return position for syntax error when available', () => {
      const input = '{"name":test}';
      const result = JSONFormatter.validate(input);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate arrays', () => {
      const input = '[1,2,3]';
      const result = JSONFormatter.validate(input);
      expect(result.valid).toBe(true);
    });

    it('should validate empty object', () => {
      const input = '{}';
      const result = JSONFormatter.validate(input);
      expect(result.valid).toBe(true);
    });

    it('should validate empty array', () => {
      const input = '[]';
      const result = JSONFormatter.validate(input);
      expect(result.valid).toBe(true);
    });
  });

  describe('getErrorLocation', () => {
    it('should return correct line and column for position', () => {
      const json = '{\n  "name": "test"\n}';
      const result = JSONFormatter.getErrorLocation(json, 5);
      expect(result.line).toBe(2);
      expect(result.column).toBe(4);
    });

    it('should return line 1 for position at start', () => {
      const json = '{"name":"test"}';
      const result = JSONFormatter.getErrorLocation(json, 0);
      expect(result.line).toBe(1);
      expect(result.column).toBe(1);
    });

    it('should handle multi-line JSON correctly', () => {
      const json = 'line1\nline2\nline3';
      const result = JSONFormatter.getErrorLocation(json, 7);
      expect(result.line).toBe(2);
    });
  });

  describe('getStats', () => {
    it('should return correct stats for simple object', () => {
      const json = '{"name":"test","value":123}';
      const result = JSONFormatter.getStats(json);
      expect(result.length).toBe(json.length);
      expect(result.lines).toBe(1);
      expect(result.keys).toBe(2);
    });

    it('should return correct stats for nested object', () => {
      const json = '{"outer":{"inner":"value"}}';
      const result = JSONFormatter.getStats(json);
      expect(result.keys).toBe(2);
      expect(result.objects).toBe(2);
      expect(result.depth).toBe(2);
    });

    it('should return correct stats for array', () => {
      const json = '[1,2,3]';
      const result = JSONFormatter.getStats(json);
      expect(result.arrays).toBe(1);
    });

    it('should handle empty JSON', () => {
      const json = '';
      const result = JSONFormatter.getStats(json);
      expect(result.length).toBe(0);
      expect(result.lines).toBe(0);
    });

    it('should handle invalid JSON gracefully', () => {
      const json = '{invalid}';
      const result = JSONFormatter.getStats(json);
      expect(result.length).toBe(json.length);
    });

    it('should count depth correctly', () => {
      const json = '{"a":{"b":{"c":1}}}';
      const result = JSONFormatter.getStats(json);
      expect(result.depth).toBe(3);
    });

    it('should handle mixed arrays and objects', () => {
      const json = '{"arr":[{"key":"value"}]}';
      const result = JSONFormatter.getStats(json);
      expect(result.objects).toBe(2);
      expect(result.arrays).toBe(1);
    });
  });

  describe('defaultFormatOptions', () => {
    it('should have correct default values', () => {
      expect(defaultFormatOptions.indent).toBe(2);
      expect(defaultFormatOptions.sortKeys).toBe(false);
      expect(defaultFormatOptions.escapeUnicode).toBe(false);
    });
  });
});
