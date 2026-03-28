export interface FormatOptions {
  indent: number | string;
  sortKeys: boolean;
  escapeUnicode: boolean;
}

export const defaultFormatOptions: FormatOptions = {
  indent: 2,
  sortKeys: false,
  escapeUnicode: false,
};

export class JSONFormatter {
  static format(json: string, options: Partial<FormatOptions> = {}): string {
    const opts = { ...defaultFormatOptions, ...options };
    
    try {
      const parsed = JSON.parse(json);
      const indent = typeof opts.indent === 'number' 
        ? ' '.repeat(opts.indent) 
        : opts.indent;
      
      let result: string;
      if (opts.sortKeys) {
        result = JSON.stringify(parsed, this.sortReplacer, indent);
      } else {
        result = JSON.stringify(parsed, null, indent);
      }
      
      if (opts.escapeUnicode) {
        result = this.escapeUnicode(result);
      }
      
      return result;
    } catch (error) {
      throw new Error(`格式化失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  static minify(json: string): string {
    try {
      const parsed = JSON.parse(json);
      return JSON.stringify(parsed);
    } catch (error) {
      throw new Error(`压缩失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  static validate(json: string): { valid: boolean; error?: string; position?: number } {
    try {
      JSON.parse(json);
      return { valid: true };
    } catch (error) {
      if (error instanceof SyntaxError) {
        const match = error.message.match(/position (\d+)/);
        const position = match ? parseInt(match[1], 10) : undefined;
        return { 
          valid: false, 
          error: error.message,
          position 
        };
      }
      return { valid: false, error: '未知错误' };
    }
  }

  static getErrorLocation(json: string, position: number): { line: number; column: number } {
    const lines = json.substring(0, position).split('\n');
    return {
      line: lines.length,
      column: lines[lines.length - 1].length + 1
    };
  }

  static getStats(json: string): { 
    length: number; 
    lines: number; 
    depth: number;
    keys: number;
    arrays: number;
    objects: number;
  } {
    try {
      const parsed = JSON.parse(json);
      const stats = this.analyzeValue(parsed, 0);
      return {
        length: json.length,
        lines: json.split('\n').length,
        depth: stats.depth,
        keys: stats.keys,
        arrays: stats.arrays,
        objects: stats.objects,
      };
    } catch (error) {
      let lines = 0;
      if (json.trim()) {
        try {
          const errorPos = error instanceof SyntaxError 
            ? parseInt(error.message.match(/position (\d+)/)?.[1] || '0', 10)
            : 0;
          const validJson = json.substring(0, errorPos > 0 ? errorPos : json.length);
          lines = validJson.split('\n').length;
        } catch {
          lines = 1;
        }
      }
      return { length: json.length, lines, depth: 0, keys: 0, arrays: 0, objects: 0 };
    }
  }

  private static sortReplacer(_key: string, value: unknown): unknown {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      return Object.keys(value).sort().reduce((sorted, k) => {
        sorted[k] = (value as Record<string, unknown>)[k];
        return sorted;
      }, {} as Record<string, unknown>);
    }
    return value;
  }

  private static escapeUnicode(str: string): string {
    // eslint-disable-next-line no-control-regex
    return str.replace(/[^\x00-\x7F]/g, (char) => {
      return '\\u' + ('0000' + char.charCodeAt(0).toString(16)).slice(-4);
    });
  }

  private static analyzeValue(value: unknown, depth: number): { 
    depth: number; 
    keys: number; 
    arrays: number; 
    objects: number;
  } {
    const stats = { depth, keys: 0, arrays: 0, objects: 0 };

    if (Array.isArray(value)) {
      stats.arrays++;
      let maxChildDepth = depth;
      for (const item of value) {
        const childStats = this.analyzeValue(item, depth + 1);
        stats.keys += childStats.keys;
        stats.arrays += childStats.arrays;
        stats.objects += childStats.objects;
        maxChildDepth = Math.max(maxChildDepth, childStats.depth);
      }
      stats.depth = maxChildDepth;
    } else if (value !== null && typeof value === 'object') {
      stats.objects++;
      stats.keys += Object.keys(value).length;
      let maxChildDepth = depth;
      for (const key in value) {
        const childStats = this.analyzeValue((value as Record<string, unknown>)[key], depth + 1);
        stats.keys += childStats.keys;
        stats.arrays += childStats.arrays;
        stats.objects += childStats.objects;
        maxChildDepth = Math.max(maxChildDepth, childStats.depth);
      }
      stats.depth = maxChildDepth;
    }

    return stats;
  }
}
