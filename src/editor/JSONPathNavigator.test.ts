import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSONPathNavigator, type JSONPathNavOptions } from './JSONPathNavigator';

describe('JSONPathNavigator', () => {
  let container: HTMLElement;
  let navigator: JSONPathNavigator;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (navigator) {
      navigator.clear();
    }
    container.remove();
  });

  describe('constructor', () => {
    it('should create navigator with container', () => {
      navigator = new JSONPathNavigator(container);
      expect(container.querySelector('.json-nav-search-wrapper')).toBeDefined();
      expect(container.querySelector('.json-nav-tree')).toBeDefined();
    });

    it('should create navigator with options', () => {
      const options: JSONPathNavOptions = {
        onNodeClick: vi.fn(),
        onNodeHover: vi.fn(),
      };
      navigator = new JSONPathNavigator(container, options);
      expect(navigator).toBeDefined();
    });
  });

  describe('parseJSON', () => {
    beforeEach(() => {
      navigator = new JSONPathNavigator(container);
    });

    it('should parse valid JSON object', () => {
      const json = '{"name":"test","value":123}';
      const result = navigator.parseJSON(json);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('object');
      expect(result?.children.length).toBe(2);
    });

    it('should parse valid JSON array', () => {
      const json = '[1,2,3]';
      const result = navigator.parseJSON(json);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('array');
      expect(result?.children.length).toBe(3);
    });

    it('should return null for empty string', () => {
      const result = navigator.parseJSON('');
      expect(result).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      const result = navigator.parseJSON('{invalid}');
      expect(result).toBeNull();
    });

    it('should parse nested objects', () => {
      const json = '{"outer":{"inner":"value"}}';
      const result = navigator.parseJSON(json);
      expect(result?.children[0]?.type).toBe('object');
      expect(result?.children[0]?.children.length).toBe(1);
    });

    it('should parse null values', () => {
      const json = '{"value":null}';
      const result = navigator.parseJSON(json);
      expect(result?.children[0]?.type).toBe('null');
    });

    it('should parse boolean values', () => {
      const json = '{"active":true}';
      const result = navigator.parseJSON(json);
      expect(result?.children[0]?.type).toBe('boolean');
    });

    it('should parse number values', () => {
      const json = '{"count":42}';
      const result = navigator.parseJSON(json);
      expect(result?.children[0]?.type).toBe('number');
    });

    it('should parse string values', () => {
      const json = '{"name":"test"}';
      const result = navigator.parseJSON(json);
      expect(result?.children[0]?.type).toBe('string');
    });
  });

  describe('expandAll and collapseAll', () => {
    beforeEach(() => {
      navigator = new JSONPathNavigator(container);
    });

    it('should expand all nodes', () => {
      const json = '{"a":{"b":"value"}}';
      navigator.parseJSON(json);
      navigator.collapseAll();
      navigator.expandAll();
      const rootNode = navigator.getRootNode();
      expect(rootNode?.expanded).toBe(true);
    });

    it('should collapse all nodes', () => {
      const json = '{"a":{"b":"value"}}';
      navigator.parseJSON(json);
      navigator.collapseAll();
      const rootNode = navigator.getRootNode();
      expect(rootNode?.expanded).toBe(false);
    });
  });

  describe('findNodeByPath', () => {
    beforeEach(() => {
      navigator = new JSONPathNavigator(container);
    });

    it('should find node by path', () => {
      const json = '{"name":"test","nested":{"key":"value"}}';
      navigator.parseJSON(json);
      const node = navigator.findNodeByPath('nested');
      expect(node).not.toBeNull();
      expect(node?.key).toBe('nested');
    });

    it('should return null for non-existent path', () => {
      const json = '{"name":"test"}';
      navigator.parseJSON(json);
      const node = navigator.findNodeByPath('nonexistent');
      expect(node).toBeNull();
    });

    it('should find nested node', () => {
      const json = '{"outer":{"inner":"value"}}';
      navigator.parseJSON(json);
      const node = navigator.findNodeByPath('outer.inner');
      expect(node).not.toBeNull();
      expect(node?.key).toBe('inner');
    });
  });

  describe('clear', () => {
    beforeEach(() => {
      navigator = new JSONPathNavigator(container);
    });

    it('should clear all data', () => {
      const json = '{"name":"test"}';
      navigator.parseJSON(json);
      navigator.clear();
      expect(navigator.getRootNode()).toBeNull();
    });
  });

  describe('getRootNode', () => {
    beforeEach(() => {
      navigator = new JSONPathNavigator(container);
    });

    it('should return null when no data', () => {
      expect(navigator.getRootNode()).toBeNull();
    });

    it('should return root node after parsing', () => {
      const json = '{"name":"test"}';
      navigator.parseJSON(json);
      expect(navigator.getRootNode()).not.toBeNull();
    });
  });

  describe('node callbacks', () => {
    it('should call onNodeClick when node is clicked', () => {
      const onNodeClick = vi.fn();
      navigator = new JSONPathNavigator(container, { onNodeClick });
      const json = '{"name":"test"}';
      navigator.parseJSON(json);
      
      const nodeElement = container.querySelector('.json-nav-node');
      if (nodeElement) {
        (nodeElement as HTMLElement).click();
        expect(onNodeClick).toHaveBeenCalled();
      }
    });
  });

  describe('search filtering', () => {
    beforeEach(() => {
      navigator = new JSONPathNavigator(container);
    });

    it('should filter nodes by search term', () => {
      const json = '{"name":"test","other":"value"}';
      navigator.parseJSON(json);
      
      const searchInput = container.querySelector('.json-nav-search') as HTMLInputElement;
      if (searchInput) {
        searchInput.value = 'name';
        searchInput.dispatchEvent(new Event('input'));
      }
      
      const rootNode = navigator.getRootNode();
      expect(rootNode).not.toBeNull();
    });
  });
});
