// YAML conversion using simple implementation
// In production, you would install js-yaml: npm install js-yaml @types/js-yaml

export class Converters {
  static jsonToJsObject(json: string): string {
    try {
      const parsed = JSON.parse(json);
      return this.objectToString(parsed, 0);
    } catch (error) {
      throw new Error(`转换失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  static jsonToYaml(json: string): string {
    try {
      const parsed = JSON.parse(json);
      return this.objectToYaml(parsed, 0);
    } catch (error) {
      throw new Error(`YAML 转换失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  static yamlToJson(yamlStr: string, pretty: boolean = true): string {
    try {
      // Simple YAML to JSON conversion (basic implementation)
      // For full YAML support, use js-yaml library
      const parsed = this.parseSimpleYaml(yamlStr);
      return pretty 
        ? JSON.stringify(parsed, null, 2)
        : JSON.stringify(parsed);
    } catch (error) {
      throw new Error(`JSON 转换失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  static jsonToXml(json: string, rootName: string = 'root'): string {
    try {
      const parsed = JSON.parse(json);
      return this.objectToXml(parsed, rootName, 0);
    } catch (error) {
      throw new Error(`XML 转换失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  static jsonToCsv(json: string): string {
    try {
      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed)) {
        throw new Error('JSON 必须是一个数组才能转换为 CSV');
      }
      if (parsed.length === 0) {
        return '';
      }
      return this.arrayToCsv(parsed);
    } catch (error) {
      throw new Error(`CSV 转换失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  static escapeString(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }

  static unescapeString(str: string): string {
    return str
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }

  private static objectToString(obj: unknown, indent: number): string {
    const spaces = '  '.repeat(indent);
    
    if (obj === null) return 'null';
    if (obj === undefined) return 'undefined';
    
    if (typeof obj === 'string') return `'${obj.replace(/'/g, "\\'")}'`;
    if (typeof obj === 'number') return String(obj);
    if (typeof obj === 'boolean') return String(obj);
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      const items = obj.map(item => this.objectToString(item, indent + 1)).join(',\n');
      return `[\n${items}\n${spaces}]`;
    }
    
    if (typeof obj === 'object') {
      const entries = Object.entries(obj);
      if (entries.length === 0) return '{}';
      const items = entries.map(([key, value]) => {
        const keyStr = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`;
        return `${spaces}  ${keyStr}: ${this.objectToString(value, indent + 1)}`;
      }).join(',\n');
      return `{\n${items}\n${spaces}}`;
    }
    
    return String(obj);
  }

  private static objectToYaml(obj: unknown, indent: number): string {
    const spaces = '  '.repeat(indent);
    
    if (obj === null) return 'null';
    if (obj === undefined) return '';
    
    if (typeof obj === 'string') {
      if (obj.includes('\n') || obj.includes(':') || obj.includes('#')) {
        return `|\\n${spaces}${obj.split('\n').join('\\n' + spaces)}`;
      }
      return obj;
    }
    if (typeof obj === 'number') return String(obj);
    if (typeof obj === 'boolean') return String(obj);
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      return obj.map(item => {
        const itemYaml = this.objectToYaml(item, indent + 1);
        return `${spaces}- ${itemYaml}`;
      }).join('\n');
    }
    
    if (typeof obj === 'object') {
      const entries = Object.entries(obj);
      if (entries.length === 0) return '{}';
      return entries.map(([key, value]) => {
        const valueYaml = this.objectToYaml(value, indent + 1);
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          return `${spaces}${key}:\n${valueYaml}`;
        }
        return `${spaces}${key}: ${valueYaml}`;
      }).join('\n');
    }
    
    return String(obj);
  }

  private static parseSimpleYaml(yaml: string): unknown {
    // Simple YAML parser for basic cases
    // For production, use js-yaml library
    const lines = yaml.split('\n');
    return this.parseYamlLines(lines, 0, 0).value;
  }

  private static parseYamlLines(lines: string[], startIndex: number, baseIndent: number): { value: unknown; nextIndex: number } {
    if (startIndex >= lines.length) {
      return { value: null, nextIndex: startIndex };
    }

    const line = lines[startIndex];
    const trimmed = line.trim();

    if (trimmed === '' || trimmed.startsWith('#')) {
      return this.parseYamlLines(lines, startIndex + 1, baseIndent);
    }

    // Check if it's an array
    if (trimmed.startsWith('- ')) {
      const array: unknown[] = [];
      let i = startIndex;
      while (i < lines.length) {
        const currentLine = lines[i];
        const currentTrimmed = currentLine.trim();
        if (currentTrimmed === '' || currentTrimmed.startsWith('#')) {
          i++;
          continue;
        }
        if (!currentTrimmed.startsWith('- ')) break;
        
        const itemValue = currentTrimmed.substring(2);
        if (itemValue === '') {
          // Nested object or array
          const nested = this.parseYamlLines(lines, i + 1, baseIndent + 2);
          array.push(nested.value);
          i = nested.nextIndex;
        } else {
          array.push(this.parseYamlValue(itemValue));
          i++;
        }
      }
      return { value: array, nextIndex: i };
    }

    // Check if it's an object
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex > 0) {
      const obj: Record<string, unknown> = {};
      let i = startIndex;
      while (i < lines.length) {
        const currentLine = lines[i];
        const currentTrimmed = currentLine.trim();
        if (currentTrimmed === '' || currentTrimmed.startsWith('#')) {
          i++;
          continue;
        }
        
        const currentIndent = currentLine.length - currentLine.trimStart().length;
        if (currentIndent < baseIndent) break;
        
        const currentColonIndex = currentTrimmed.indexOf(':');
        if (currentColonIndex <= 0) break;
        
        const key = currentTrimmed.substring(0, currentColonIndex).trim();
        const valueStr = currentTrimmed.substring(currentColonIndex + 1).trim();
        
        if (valueStr === '') {
          // Nested value
          const nested = this.parseYamlLines(lines, i + 1, currentIndent + 2);
          obj[key] = nested.value;
          i = nested.nextIndex;
        } else {
          obj[key] = this.parseYamlValue(valueStr);
          i++;
        }
      }
      return { value: obj, nextIndex: i };
    }

    // Simple value
    return { value: this.parseYamlValue(trimmed), nextIndex: startIndex + 1 };
  }

  private static parseYamlValue(value: string): unknown {
    value = value.trim();
    if (value === 'null' || value === '~') return null;
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (/^-?\d+$/.test(value)) return parseInt(value, 10);
    if (/^-?\d*\.\d+$/.test(value)) return parseFloat(value);
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }
    return value;
  }

  private static objectToXml(obj: unknown, nodeName: string, indent: number): string {
    const spaces = '  '.repeat(indent);
    
    if (obj === null || obj === undefined) {
      return `${spaces}<${nodeName}/>`;
    }
    
    if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
      const escaped = String(obj)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
      return `${spaces}<${nodeName}>${escaped}</${nodeName}>`;
    }
    
    if (Array.isArray(obj)) {
      const items = obj.map((item) => 
        this.objectToXml(item, 'item', indent + 1)
      ).join('\n');
      return `${spaces}<${nodeName}>\n${items}\n${spaces}</${nodeName}>`;
    }
    
    if (typeof obj === 'object') {
      const entries = Object.entries(obj);
      if (entries.length === 0) {
        return `${spaces}<${nodeName}/>`;
      }
      const items = entries.map(([key, value]) => 
        this.objectToXml(value, key, indent + 1)
      ).join('\n');
      return `${spaces}<${nodeName}>\n${items}\n${spaces}</${nodeName}>`;
    }
    
    return `${spaces}<${nodeName}>${String(obj)}</${nodeName}>`;
  }

  private static arrayToCsv(array: unknown[]): string {
    if (array.length === 0) return '';
    
    const firstItem = array[0];
    if (typeof firstItem !== 'object' || firstItem === null) {
      throw new Error('数组元素必须是对象');
    }
    
    const headers = Object.keys(firstItem);
    const rows = array.map(item => {
      if (typeof item !== 'object' || item === null) {
        throw new Error('所有数组元素必须是对象');
      }
      return headers.map(header => {
        const value = (item as Record<string, unknown>)[header];
        const str = value === null || value === undefined ? '' : String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',');
    });
    
    return [headers.join(','), ...rows].join('\n');
  }
}
