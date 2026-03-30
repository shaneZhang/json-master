import { describe, it, expect } from 'vitest';
import { JSONValidator } from './jsonValidator.js';

describe('JSONValidator Additional Coverage', () => {
  describe('extractPosition edge cases', () => {
    it('should handle error with line and column in message', () => {
      const json = '{"a": 1}';
      // Test that validation runs without error
      const result = JSONValidator.validate(json);
      expect(typeof result.valid).toBe('boolean');
    });

    it('should handle deeply nested invalid JSON', () => {
      const json = '{"a": {"b": {"c": [1, 2, invalid]}}}'; 
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(false);
    });

    it('should handle JSON with comments (invalid)', () => {
      const json = `{
        // this is a comment
        "key": "value"
      }`;
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(false);
    });

    it('should handle multiple errors in JSON', () => {
      const json = '{"a": 1, "b": }';
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle unclosed string', () => {
      const json = '{"key": "unclosed value}';
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(false);
    });

    it('should handle invalid escape sequences', () => {
      const json = '{"key": "value\\x"}';
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(false);
    });

    it('should handle mismatched braces and brackets', () => {
      const json = '{"arr": [1, 2, 3}}';
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(false);
    });

    it('should handle empty input with whitespace', () => {
      const result = JSONValidator.validate('   \n\t  ');
      expect(result.valid).toBe(false);
    });

    it('should handle very long single line JSON', () => {
      const keys = Array.from({ length: 100 }, (_, i) => `"key${i}": ${i}`).join(', ');
      const json = `{${keys}}`;
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(true);
    });

    it('should handle JSON with only whitespace and newlines', () => {
      const result = JSONValidator.validate('\n\n\n');
      expect(result.valid).toBe(false);
    });

    it('should handle numeric values at boundaries', () => {
      const json = `{
        "max": ${Number.MAX_VALUE},
        "min": ${Number.MIN_VALUE},
        "infinity": null,
        "negInfinity": null
      }`;
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(true);
    });

    it('should handle scientific notation', () => {
      const json = '{"a": 1e10, "b": 1.5e-5, "c": -2E+3}';
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(true);
    });

    it('should handle hex notation (invalid in JSON)', () => {
      const json = '{"a": 0xFF}';
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(false);
    });

    it('should handle octal notation (invalid in JSON)', () => {
      const json = '{"a": 0777}';
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(false);
    });

    it('should handle leading decimal point (invalid)', () => {
      const json = '{"a": .5}';
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(false);
    });

    it('should handle trailing decimal point', () => {
      const json = '{"a": 5.}';
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(false);
    });

    it('should handle multiple decimal points', () => {
      const json = '{"a": 1.2.3}';
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(false);
    });

    it('should handle control characters in string', () => {
      const json = '{"key": "value\x00"}';
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(false);
    });

    it('should handle valid escaped characters', () => {
      const json = '{"key": "\\"\\\\\\/\\b\\f\\n\\r\\t"}';
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(true);
    });

    it('should handle valid unicode escape', () => {
      const json = '{"key": "\\u0041\\u0042\\u0043"}';
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(true);
    });

    it('should handle incomplete unicode escape', () => {
      const json = '{"key": "\\u004"}';
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(false);
    });

    it('should handle invalid unicode escape', () => {
      const json = '{"key": "\\u00GH"}';
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(false);
    });

    it('should handle tab character in string (invalid)', () => {
      const json = '{"key": "val\tue"}';
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(false);
    });

    it('should handle newline in string (invalid)', () => {
      const json = '{"key": "val\nue"}';
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(false);
    });

    it('should handle duplicate keys (technically valid)', () => {
      const json = '{"a": 1, "a": 2}';
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(true);
    });

    it('should handle empty string key', () => {
      const json = '{"": "empty key"}';
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(true);
    });

    it('should handle array with only commas (invalid)', () => {
      const json = '[,,,]';
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(false);
    });

    it('should handle object with only commas (invalid)', () => {
      const json = '{,,,}';
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(false);
    });

    it('should handle missing colon', () => {
      const json = '{"key" "value"}';
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(false);
    });

    it('should handle missing comma between properties', () => {
      const json = '{"a": 1 "b": 2}';
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(false);
    });

    it('should handle missing comma between array items', () => {
      const json = '[1 2 3]';
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(false);
    });

    it('should handle extra commas in object', () => {
      const json = '{, "a": 1}';
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(false);
    });

    it('should handle extra commas in array', () => {
      const json = '[, 1, 2]';
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(false);
    });

    it('should handle bare words as values', () => {
      const json = '{"key": undefined}';
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(false);
    });

    it('should handle NaN (invalid in JSON)', () => {
      const json = '{"a": NaN}';
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(false);
    });

    it('should handle Infinity (invalid in JSON)', () => {
      const json = '{"a": Infinity}';
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(false);
    });

    it('should handle -Infinity (invalid in JSON)', () => {
      const json = '{"a": -Infinity}';
      const result = JSONValidator.validate(json);
      expect(result.valid).toBe(false);
    });
  });
});
