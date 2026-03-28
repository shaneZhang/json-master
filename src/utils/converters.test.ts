import { describe, it, expect } from 'vitest';
import { Converters } from './converters';

describe('Converters', () => {
  describe('jsonToYaml', () => {
    it('should convert simple object to YAML', () => {
      const json = '{"name":"test","value":123}';
      const result = Converters.jsonToYaml(json);
      expect(result).toContain('name: test');
      expect(result).toContain('value: 123');
    });

    it('should convert nested object to YAML', () => {
      const json = '{"outer":{"inner":"value"}}';
      const result = Converters.jsonToYaml(json);
      expect(result).toContain('outer:');
      expect(result).toContain('inner: value');
    });

    it('should convert array to YAML', () => {
      const json = '[1,2,3]';
      const result = Converters.jsonToYaml(json);
      expect(result).toContain('- 1');
      expect(result).toContain('- 2');
      expect(result).toContain('- 3');
    });

    it('should throw error for invalid JSON', () => {
      expect(() => Converters.jsonToYaml('{invalid}')).toThrow();
    });

    it('should handle null values', () => {
      const json = '{"value":null}';
      const result = Converters.jsonToYaml(json);
      expect(result).toContain('null');
    });

    it('should handle boolean values', () => {
      const json = '{"active":true}';
      const result = Converters.jsonToYaml(json);
      expect(result).toContain('true');
    });
  });

  describe('yamlToJson', () => {
    it('should convert simple YAML to JSON', () => {
      const yaml = 'name: test\nvalue: 123';
      const result = Converters.yamlToJson(yaml);
      const parsed = JSON.parse(result);
      expect(parsed.name).toBe('test');
      expect(parsed.value).toBe(123);
    });

    it('should convert nested YAML to JSON', () => {
      const yaml = 'outer:\n  inner: value';
      const result = Converters.yamlToJson(yaml);
      const parsed = JSON.parse(result);
      expect(parsed.outer.inner).toBe('value');
    });

    it('should convert YAML array to JSON', () => {
      const yaml = '- 1\n- 2\n- 3';
      const result = Converters.yamlToJson(yaml);
      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(3);
    });

    it('should convert with pretty option', () => {
      const yaml = 'name: test';
      const result = Converters.yamlToJson(yaml, true);
      expect(result).toContain('\n');
    });

    it('should convert without pretty option', () => {
      const yaml = 'name: test';
      const result = Converters.yamlToJson(yaml, false);
      expect(result).not.toContain('\n');
    });
  });

  describe('jsonToJsObject', () => {
    it('should convert JSON to JS object string', () => {
      const json = '{"name":"test"}';
      const result = Converters.jsonToJsObject(json);
      expect(result).toContain('name');
      expect(result).toContain('test');
    });

    it('should handle nested objects', () => {
      const json = '{"outer":{"inner":"value"}}';
      const result = Converters.jsonToJsObject(json);
      expect(result).toContain('outer');
      expect(result).toContain('inner');
    });

    it('should throw error for invalid JSON', () => {
      expect(() => Converters.jsonToJsObject('{invalid}')).toThrow();
    });

    it('should handle arrays', () => {
      const json = '[1,2,3]';
      const result = Converters.jsonToJsObject(json);
      expect(result).toContain('[');
      expect(result).toContain(']');
    });

    it('should handle null values', () => {
      const json = '{"value":null}';
      const result = Converters.jsonToJsObject(json);
      expect(result).toContain('null');
    });

    it('should handle special characters in keys', () => {
      const json = '{"key-name":"value"}';
      const result = Converters.jsonToJsObject(json);
      expect(result).toContain('key-name');
    });
  });

  describe('jsonToXml', () => {
    it('should convert simple object to XML', () => {
      const json = '{"name":"test"}';
      const result = Converters.jsonToXml(json);
      expect(result).toContain('<name>test</name>');
    });

    it('should handle nested objects', () => {
      const json = '{"outer":{"inner":"value"}}';
      const result = Converters.jsonToXml(json);
      expect(result).toContain('<outer>');
      expect(result).toContain('<inner>value</inner>');
    });

    it('should handle arrays', () => {
      const json = '{"items":[1,2]}';
      const result = Converters.jsonToXml(json);
      expect(result).toContain('<items>');
    });

    it('should throw error for invalid JSON', () => {
      expect(() => Converters.jsonToXml('{invalid}')).toThrow();
    });

    it('should use custom root name', () => {
      const json = '{"name":"test"}';
      const result = Converters.jsonToXml(json, 'custom');
      expect(result).toContain('<custom>');
    });

    it('should handle null values', () => {
      const json = '{"value":null}';
      const result = Converters.jsonToXml(json);
      expect(result).toContain('<value/>');
    });

    it('should escape special characters', () => {
      const json = '{"text":"<test>"}';
      const result = Converters.jsonToXml(json);
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
    });
  });

  describe('jsonToCsv', () => {
    it('should convert array of objects to CSV', () => {
      const json = '[{"name":"a","value":1},{"name":"b","value":2}]';
      const result = Converters.jsonToCsv(json);
      expect(result).toContain('name,value');
      expect(result).toContain('a,1');
      expect(result).toContain('b,2');
    });

    it('should throw error for non-array JSON', () => {
      const json = '{"name":"test"}';
      expect(() => Converters.jsonToCsv(json)).toThrow();
    });

    it('should throw error for invalid JSON', () => {
      expect(() => Converters.jsonToCsv('{invalid}')).toThrow();
    });

    it('should handle empty array', () => {
      const json = '[]';
      const result = Converters.jsonToCsv(json);
      expect(result).toBe('');
    });

    it('should handle values with commas', () => {
      const json = '[{"text":"a,b"}]';
      const result = Converters.jsonToCsv(json);
      expect(result).toContain('"a,b"');
    });

    it('should handle values with quotes', () => {
      const json = '[{"text":"a\\"b"}]';
      const result = Converters.jsonToCsv(json);
      expect(result).toContain('""');
    });

    it('should handle null values', () => {
      const json = '[{"name":"test","value":null}]';
      const result = Converters.jsonToCsv(json);
      expect(result).toContain('test,');
    });
  });

  describe('escapeString', () => {
    it('should escape backslashes', () => {
      const result = Converters.escapeString('a\\b');
      expect(result).toBe('a\\\\b');
    });

    it('should escape quotes', () => {
      const result = Converters.escapeString('a"b');
      expect(result).toBe('a\\"b');
    });

    it('should escape newlines', () => {
      const result = Converters.escapeString('a\nb');
      expect(result).toBe('a\\nb');
    });

    it('should escape tabs', () => {
      const result = Converters.escapeString('a\tb');
      expect(result).toBe('a\\tb');
    });
  });

  describe('unescapeString', () => {
    it('should unescape newlines', () => {
      const result = Converters.unescapeString('a\\nb');
      expect(result).toBe('a\nb');
    });

    it('should unescape quotes', () => {
      const result = Converters.unescapeString('a\\"b');
      expect(result).toBe('a"b');
    });

    it('should unescape tabs', () => {
      const result = Converters.unescapeString('a\\tb');
      expect(result).toBe('a\tb');
    });

    it('should unescape backslashes', () => {
      const result = Converters.unescapeString('a\\\\b');
      expect(result).toBe('a\\b');
    });
  });
});
