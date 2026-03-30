import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSONTreeNavigator } from './JSONTreeNavigator.js';

describe('JSONTreeNavigator', () => {
  let container: HTMLElement;
  let navigator: JSONTreeNavigator;

  beforeEach(() => {
    container = document.createElement('div');
    navigator = new JSONTreeNavigator(container);
  });

  describe('constructor', () => {
    it('should initialize with empty state', () => {
      expect(navigator.getRootNode()).toBeNull();
    });

    it('should apply correct class to container', () => {
      expect(container.className).toBe('json-tree-navigator');
    });
  });

  describe('setJSON', () => {
    it('should parse empty object', () => {
      navigator.setJSON('{}');
      const root = navigator.getRootNode();
      expect(root).not.toBeNull();
      expect(root?.type).toBe('object');
      expect(root?.key).toBe('root');
    });

    it('should parse empty array', () => {
      navigator.setJSON('[]');
      const root = navigator.getRootNode();
      expect(root).not.toBeNull();
      expect(root?.type).toBe('array');
    });

    it('should parse string value', () => {
      navigator.setJSON('"test"');
      const root = navigator.getRootNode();
      expect(root?.type).toBe('string');
      expect(root?.value).toBe('test');
    });

    it('should parse number value', () => {
      navigator.setJSON('42');
      const root = navigator.getRootNode();
      expect(root?.type).toBe('number');
      expect(root?.value).toBe(42);
    });

    it('should parse boolean value', () => {
      navigator.setJSON('true');
      const root = navigator.getRootNode();
      expect(root?.type).toBe('boolean');
      expect(root?.value).toBe(true);
    });

    it('should parse null value', () => {
      navigator.setJSON('null');
      const root = navigator.getRootNode();
      expect(root?.type).toBe('null');
      expect(root?.value).toBeNull();
    });

    it('should parse nested object', () => {
      navigator.setJSON('{"level1": {"level2": "value"}}');
      const root = navigator.getRootNode();
      expect(root?.type).toBe('object');
      expect(root?.children).toHaveLength(1);
      expect(root?.children?.[0].type).toBe('object');
      expect(root?.children?.[0].children?.[0].type).toBe('string');
    });

    it('should parse array with mixed types', () => {
      navigator.setJSON('[1, "two", true, null, {"a": 1}]');
      const root = navigator.getRootNode();
      expect(root?.type).toBe('array');
      expect(root?.children).toHaveLength(5);
      expect(root?.children?.[0].type).toBe('number');
      expect(root?.children?.[1].type).toBe('string');
      expect(root?.children?.[2].type).toBe('boolean');
      expect(root?.children?.[3].type).toBe('null');
      expect(root?.children?.[4].type).toBe('object');
    });

    it('should handle invalid JSON', () => {
      navigator.setJSON('invalid');
      expect(container.querySelector('.tree-error')).toBeTruthy();
    });

    it('should generate correct paths', () => {
      navigator.setJSON('{"a": {"b": "c"}}');
      const root = navigator.getRootNode();
      expect(root?.path).toBe('$');
      expect(root?.children?.[0].path).toBe('$.a');
      expect(root?.children?.[0].children?.[0].path).toBe('$.a.b');
    });

    it('should generate correct array paths', () => {
      navigator.setJSON('[{"a": 1}, {"b": 2}]');
      const root = navigator.getRootNode();
      expect(root?.children?.[0].path).toBe('$[0]');
      expect(root?.children?.[1].path).toBe('$[1]');
      expect(root?.children?.[0].children?.[0].path).toBe('$[0].a');
    });
  });

  describe('expandAll', () => {
    it('should expand all nodes with children', () => {
      navigator.setJSON('{"a": {"b": {"c": 1}}}');
      navigator.expandAll();
      const root = navigator.getRootNode();
      expect(root?.expanded).toBe(true);
      expect(root?.children?.[0].expanded).toBe(true);
      expect(root?.children?.[0].children?.[0].expanded).toBe(true);
    });
  });

  describe('collapseAll', () => {
    it('should collapse all nodes', () => {
      navigator.setJSON('{"a": {"b": {"c": 1}}}');
      navigator.expandAll();
      navigator.collapseAll();
      const root = navigator.getRootNode();
      expect(root?.expanded).toBe(false);
      expect(root?.children?.[0].expanded).toBe(false);
    });
  });

  describe('expandToNode', () => {
    it('should expand to specific node path', () => {
      navigator.setJSON('{"a": {"b": {"c": 1}}}');
      navigator.expandToNode('$.a.b');
      const node = navigator.getNodeByPath('$.a.b');
      expect(node?.expanded).toBe(true);
    });

    it('should expand all parent nodes', () => {
      navigator.setJSON('{"a": {"b": {"c": 1}}}');
      navigator.expandToNode('$.a.b');
      expect(navigator.getNodeByPath('$')?.expanded).toBe(true);
      expect(navigator.getNodeByPath('$.a')?.expanded).toBe(true);
    });
  });

  describe('setFilter', () => {
    it('should filter by key', () => {
      navigator.setJSON('{"apple": 1, "banana": 2, "apricot": 3}');
      navigator.setFilter('app');
      const root = navigator.getRootNode();
      expect(root?.children?.[0].key).toBe('apple');
    });

    it('should filter by value', () => {
      navigator.setJSON('{"a": "hello", "b": "world"}');
      navigator.setFilter('hello');
      const root = navigator.getRootNode();
      expect(root?.children?.[0].key).toBe('a');
    });

    it('should show all nodes when filter is empty', () => {
      navigator.setJSON('{"a": 1, "b": 2}');
      navigator.setFilter('');
      const root = navigator.getRootNode();
      expect(root?.children).toHaveLength(2);
    });

    it('should show parent if child matches', () => {
      navigator.setJSON('{"parent": {"child": "value"}}');
      navigator.setFilter('value');
      const root = navigator.getRootNode();
      expect(root?.children).toHaveLength(1);
    });
  });

  describe('getNodeByPath', () => {
    it('should return node by path', () => {
      navigator.setJSON('{"a": {"b": 1}}');
      const node = navigator.getNodeByPath('$.a.b');
      expect(node).not.toBeNull();
      expect(node?.key).toBe('b');
    });

    it('should return null for non-existent path', () => {
      navigator.setJSON('{"a": 1}');
      const node = navigator.getNodeByPath('$.nonexistent');
      expect(node).toBeNull();
    });
  });

  describe('click handler', () => {
    it('should call onNodeClick when node is clicked', () => {
      const onNodeClick = vi.fn();
      const navWithHandler = new JSONTreeNavigator(container, { onNodeClick });
      navWithHandler.setJSON('{"test": 1}');
      
      const nodeContent = container.querySelector('.tree-node-content');
      nodeContent?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      
      expect(onNodeClick).toHaveBeenCalled();
    });
  });

  describe('node types', () => {
    it('should correctly identify object type', () => {
      navigator.setJSON('{}');
      expect(navigator.getRootNode()?.type).toBe('object');
    });

    it('should correctly identify array type', () => {
      navigator.setJSON('[]');
      expect(navigator.getRootNode()?.type).toBe('array');
    });

    it('should correctly identify string type', () => {
      navigator.setJSON('"test"');
      expect(navigator.getRootNode()?.type).toBe('string');
    });

    it('should correctly identify number type', () => {
      navigator.setJSON('123');
      expect(navigator.getRootNode()?.type).toBe('number');
    });

    it('should correctly identify boolean type', () => {
      navigator.setJSON('false');
      expect(navigator.getRootNode()?.type).toBe('boolean');
    });

    it('should correctly identify null type', () => {
      navigator.setJSON('null');
      expect(navigator.getRootNode()?.type).toBe('null');
    });
  });

  describe('dispose', () => {
    it('should clear container', () => {
      navigator.setJSON('{"test": 1}');
      navigator.dispose();
      expect(container.innerHTML).toBe('');
    });

    it('should reset root node', () => {
      navigator.setJSON('{"test": 1}');
      navigator.dispose();
      expect(navigator.getRootNode()).toBeNull();
    });
  });
});
