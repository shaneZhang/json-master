export interface TreeNode {
  key: string;
  path: string;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  value: unknown;
  children?: TreeNode[];
  isExpandable: boolean;
  count?: number;
  line?: number;
  column?: number;
}

export class JSONTreeView {
  private container: HTMLElement;
  private data: unknown = null;
  private treeData: TreeNode[] = [];
  private expandedNodes: Set<string> = new Set();
  private searchQuery: string = '';
  private onNodeClick?: (node: TreeNode) => void;

  constructor(container: HTMLElement, onNodeClick?: (node: TreeNode) => void) {
    this.container = container;
    this.onNodeClick = onNodeClick;
  }

  setData(data: unknown): void {
    this.data = data;
    this.treeData = this.buildTree(data, '', '$');
    this.render();
  }

  clear(): void {
    this.data = null;
    this.treeData = [];
    this.render();
  }

  setSearchQuery(query: string): void {
    this.searchQuery = query.toLowerCase();
    this.render();
  }

  toggleExpand(path: string): void {
    if (this.expandedNodes.has(path)) {
      this.expandedNodes.delete(path);
    } else {
      this.expandedNodes.add(path);
    }
    this.render();
  }

  expandAll(): void {
    this.addAllExpandablePaths(this.treeData);
    this.render();
  }

  collapseAll(): void {
    this.expandedNodes.clear();
    this.render();
  }

  private addAllExpandablePaths(nodes: TreeNode[]): void {
    for (const node of nodes) {
      if (node.isExpandable) {
        this.expandedNodes.add(node.path);
        if (node.children) {
          this.addAllExpandablePaths(node.children);
        }
      }
    }
  }

  private buildTree(value: unknown, key: string, path: string): TreeNode[] {
    const nodes: TreeNode[] = [];

    if (value === null) {
      nodes.push({
        key,
        path,
        type: 'null',
        value: null,
        isExpandable: false,
      });
    } else if (Array.isArray(value)) {
      const children: TreeNode[] = [];
      value.forEach((item, index) => {
        const childPath = `${path}[${index}]`;
        children.push(...this.buildTree(item, String(index), childPath));
      });
      nodes.push({
        key,
        path,
        type: 'array',
        value,
        children,
        isExpandable: value.length > 0,
        count: value.length,
      });
    } else if (typeof value === 'object') {
      const children: TreeNode[] = [];
      const entries = Object.entries(value as Record<string, unknown>);
      entries.forEach(([k, v]) => {
        const childPath = `${path}.${k}`;
        children.push(...this.buildTree(v, k, childPath));
      });
      nodes.push({
        key,
        path,
        type: 'object',
        value,
        children,
        isExpandable: entries.length > 0,
        count: entries.length,
      });
    } else if (typeof value === 'string') {
      nodes.push({
        key,
        path,
        type: 'string',
        value,
        isExpandable: false,
      });
    } else if (typeof value === 'number') {
      nodes.push({
        key,
        path,
        type: 'number',
        value,
        isExpandable: false,
      });
    } else if (typeof value === 'boolean') {
      nodes.push({
        key,
        path,
        type: 'boolean',
        value,
        isExpandable: false,
      });
    }

    return nodes;
  }

  private matchesSearch(node: TreeNode): boolean {
    if (!this.searchQuery) return true;
    if (node.key.toLowerCase().includes(this.searchQuery)) return true;
    if (String(node.value).toLowerCase().includes(this.searchQuery)) return true;
    if (node.children) {
      return node.children.some(child => this.matchesSearch(child));
    }
    return false;
  }

  render(): void {
    this.container.innerHTML = '';

    if (!this.data) {
      this.container.innerHTML = '<div class="tree-empty">输入有效 JSON 数据以显示树形结构</div>';
      return;
    }

    const filteredTree = this.searchQuery 
      ? this.treeData.filter(node => this.matchesSearch(node))
      : this.treeData;

    if (filteredTree.length === 0) {
      this.container.innerHTML = '<div class="tree-empty">没有匹配的节点</div>';
      return;
    }

    const treeElement = document.createElement('div');
    treeElement.className = 'json-tree';
    this.renderNodes(filteredTree, treeElement, 0);
    this.container.appendChild(treeElement);
  }

  private renderNodes(nodes: TreeNode[], parent: HTMLElement, depth: number): void {
    for (const node of nodes) {
      if (this.searchQuery && !this.matchesSearch(node)) continue;

      const nodeElement = document.createElement('div');
      nodeElement.className = 'tree-node';
      nodeElement.style.paddingLeft = `${depth * 16 + 8}px`;
      nodeElement.setAttribute('data-path', node.path);

      const contentElement = document.createElement('div');
      contentElement.className = 'tree-node-content';

      const iconElement = document.createElement('span');
      iconElement.className = `tree-icon tree-icon-${node.type}`;
      iconElement.innerHTML = this.getIconHTML(node.type);

      if (node.isExpandable) {
        iconElement.classList.add('expandable');
        if (this.expandedNodes.has(node.path)) {
          iconElement.classList.add('expanded');
        }
        iconElement.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleExpand(node.path);
        });
      }

      const keyElement = document.createElement('span');
      keyElement.className = 'tree-key';
      keyElement.textContent = node.key;

      const valueElement = document.createElement('span');
      valueElement.className = `tree-value tree-value-${node.type}`;
      valueElement.textContent = this.formatValue(node);

      contentElement.appendChild(iconElement);
      contentElement.appendChild(keyElement);
      contentElement.appendChild(valueElement);

      contentElement.addEventListener('click', () => {
        if (this.onNodeClick) {
          this.onNodeClick(node);
        }
      });

      contentElement.title = `${node.path}: ${this.formatTooltipValue(node)}`;

      nodeElement.appendChild(contentElement);

      if (node.isExpandable && node.children && this.expandedNodes.has(node.path)) {
        this.renderNodes(node.children, nodeElement, depth + 1);
      }

      parent.appendChild(nodeElement);
    }
  }

  private getIconHTML(type: string): string {
    const icons: Record<string, string> = {
      object: '{ }',
      array: '[ ]',
      string: 'Aa',
      number: '12',
      boolean: '◐',
      null: '∅',
    };
    return icons[type] || '?';
  }

  private formatValue(node: TreeNode): string {
    if (node.type === 'array') {
      return `Array(${node.count})`;
    }
    if (node.type === 'object') {
      return `Object(${node.count})`;
    }
    if (node.type === 'string') {
      return `"${String(node.value).substring(0, 50)}${String(node.value).length > 50 ? '...' : ''}"`;
    }
    if (node.type === 'null') {
      return 'null';
    }
    return String(node.value);
  }

  private formatTooltipValue(node: TreeNode): string {
    if (node.type === 'array' || node.type === 'object') {
      return JSON.stringify(node.value, null, 2).substring(0, 200);
    }
    return String(node.value);
  }
}
