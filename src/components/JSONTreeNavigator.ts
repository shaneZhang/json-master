export interface JSONNode {
  key: string;
  value: unknown;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  path: string;
  line?: number;
  column?: number;
  children?: JSONNode[];
  expanded?: boolean;
  parent?: JSONNode;
}

export interface TreeNavigatorOptions {
  onNodeClick?: (node: JSONNode) => void;
  onNodeHover?: (node: JSONNode, event: MouseEvent) => void;
  onNodeExpand?: (node: JSONNode) => void;
  onNodeCollapse?: (node: JSONNode) => void;
}

export class JSONTreeNavigator {
  private container: HTMLElement;
  private rootNode: JSONNode | null = null;
  private options: TreeNavigatorOptions;
  private filterText: string = '';
  private nodeMap: Map<string, HTMLElement> = new Map();

  constructor(container: HTMLElement, options: TreeNavigatorOptions = {}) {
    this.container = container;
    this.options = options;
    this.init();
  }

  private init(): void {
    this.container.className = 'json-tree-navigator';
    this.container.innerHTML = '';
  }

  setJSON(json: string): void {
    try {
      const parsed = JSON.parse(json);
      this.rootNode = this.parseValue(parsed, 'root', '$', null);
      this.render();
    } catch {
      this.rootNode = null;
      this.container.innerHTML = '<div class="tree-error">无效的 JSON</div>';
    }
  }

  private parseValue(
    value: unknown,
    key: string,
    path: string,
    parent: JSONNode | null,
    line?: number,
    column?: number
  ): JSONNode {
    const node: JSONNode = {
      key,
      value,
      type: this.getValueType(value),
      path,
      line,
      column,
      parent: parent || undefined,
      expanded: false,
      children: [],
    };

    if (node.type === 'object' && value !== null) {
      const obj = value as Record<string, unknown>;
      node.children = Object.entries(obj).map(([k, v]) =>
        this.parseValue(v, k, `${path}.${k}`, node)
      );
    } else if (node.type === 'array') {
      const arr = value as unknown[];
      node.children = arr.map((v, index) =>
        this.parseValue(v, `[${index}]`, `${path}[${index}]`, node)
      );
    }

    return node;
  }

  private getValueType(value: unknown): JSONNode['type'] {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    return 'null';
  }

  private getTypeIcon(type: JSONNode['type']): string {
    const icons: Record<JSONNode['type'], string> = {
      object: '{ }',
      array: '[ ]',
      string: '" "',
      number: '#',
      boolean: '◆',
      null: '○',
    };
    return icons[type];
  }

  private getTypeClass(type: JSONNode['type']): string {
    return `type-${type}`;
  }

  private getPreviewValue(node: JSONNode): string {
    if (node.type === 'object') {
      const count = node.children?.length || 0;
      return `{${count} ${count === 1 ? 'key' : 'keys'}}`;
    }
    if (node.type === 'array') {
      const count = node.children?.length || 0;
      return `[${count} ${count === 1 ? 'item' : 'items'}}]`;
    }
    if (node.type === 'string') {
      const str = String(node.value);
      return str.length > 50 ? `"${str.substring(0, 50)}..."` : `"${str}"`;
    }
    if (node.type === 'null') {
      return 'null';
    }
    return String(node.value);
  }

  private render(): void {
    this.container.innerHTML = '';
    this.nodeMap.clear();

    if (!this.rootNode) {
      this.container.innerHTML = '<div class="tree-empty">暂无数据</div>';
      return;
    }

    const treeContent = document.createElement('div');
    treeContent.className = 'tree-content';

    const rootElement = this.createNodeElement(this.rootNode, 0);
    treeContent.appendChild(rootElement);

    this.container.appendChild(treeContent);
  }

  private createNodeElement(node: JSONNode, depth: number): HTMLElement {
    const nodeId = `node-${node.path}`;
    const nodeElement = document.createElement('div');
    nodeElement.className = 'tree-node';
    nodeElement.dataset.path = node.path;
    nodeElement.dataset.nodeId = nodeId;

    if (this.filterText && !this.matchesFilter(node)) {
      nodeElement.style.display = 'none';
    }

    const contentElement = document.createElement('div');
    contentElement.className = 'tree-node-content';
    contentElement.style.paddingLeft = `${depth * 16}px`;

    const hasChildren = node.children && node.children.length > 0;

    const expander = document.createElement('span');
    expander.className = `tree-expander ${hasChildren ? 'expandable' : ''} ${node.expanded ? 'expanded' : ''}`;
    expander.innerHTML = hasChildren ? (node.expanded ? '▼' : '▶') : '';
    expander.addEventListener('click', (e) => {
      e.stopPropagation();
      if (hasChildren) {
        this.toggleNode(node);
      }
    });
    contentElement.appendChild(expander);

    const icon = document.createElement('span');
    icon.className = `tree-icon ${this.getTypeClass(node.type)}`;
    icon.textContent = this.getTypeIcon(node.type);
    contentElement.appendChild(icon);

    const key = document.createElement('span');
    key.className = 'tree-key';
    key.textContent = node.key;
    contentElement.appendChild(key);

    const separator = document.createElement('span');
    separator.className = 'tree-separator';
    separator.textContent = ': ';
    contentElement.appendChild(separator);

    const preview = document.createElement('span');
    preview.className = `tree-preview ${this.getTypeClass(node.type)}`;
    preview.textContent = this.getPreviewValue(node);
    contentElement.appendChild(preview);

    if (hasChildren) {
      const count = document.createElement('span');
      count.className = 'tree-count';
      count.textContent = `(${node.children!.length})`;
      contentElement.appendChild(count);
    }

    contentElement.addEventListener('click', () => {
      this.options.onNodeClick?.(node);
    });

    contentElement.addEventListener('mouseenter', (e) => {
      this.options.onNodeHover?.(node, e as MouseEvent);
    });

    nodeElement.appendChild(contentElement);

    if (hasChildren && node.expanded) {
      const childrenContainer = document.createElement('div');
      childrenContainer.className = 'tree-children';

      node.children!.forEach((child) => {
        const childElement = this.createNodeElement(child, depth + 1);
        childrenContainer.appendChild(childElement);
      });

      nodeElement.appendChild(childrenContainer);
    }

    this.nodeMap.set(node.path, nodeElement);
    return nodeElement;
  }

  private toggleNode(node: JSONNode): void {
    node.expanded = !node.expanded;

    if (node.expanded) {
      this.options.onNodeExpand?.(node);
    } else {
      this.options.onNodeCollapse?.(node);
    }

    this.render();
  }

  expandAll(): void {
    this.traverseNode(this.rootNode, (n) => {
      if (n.children && n.children.length > 0) {
        n.expanded = true;
      }
    });
    this.render();
  }

  collapseAll(): void {
    this.traverseNode(this.rootNode, (n) => {
      n.expanded = false;
    });
    this.render();
  }

  expandToNode(path: string): void {
    const node = this.findNodeByPath(path);
    if (!node) return;

    let current: JSONNode | undefined = node;
    while (current) {
      current.expanded = true;
      current = current.parent;
    }

    this.render();

    const element = this.nodeMap.get(path);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('highlighted');
      setTimeout(() => {
        element.classList.remove('highlighted');
      }, 2000);
    }
  }

  private traverseNode(node: JSONNode | null, callback: (n: JSONNode) => void): void {
    if (!node) return;
    callback(node);
    node.children?.forEach((child) => this.traverseNode(child, callback));
  }

  private findNodeByPath(path: string): JSONNode | null {
    let result: JSONNode | null = null;
    this.traverseNode(this.rootNode, (n) => {
      if (n.path === path) {
        result = n;
      }
    });
    return result;
  }

  setFilter(text: string): void {
    this.filterText = text.toLowerCase();
    this.render();
  }

  private matchesFilter(node: JSONNode): boolean {
    if (!this.filterText) return true;

    const keyMatch = node.key.toLowerCase().includes(this.filterText);
    const valueMatch = String(node.value).toLowerCase().includes(this.filterText);

    if (keyMatch || valueMatch) return true;

    if (node.children) {
      return node.children.some((child) => this.matchesFilter(child));
    }

    return false;
  }

  getNodeByPath(path: string): JSONNode | null {
    return this.findNodeByPath(path);
  }

  getRootNode(): JSONNode | null {
    return this.rootNode;
  }

  dispose(): void {
    this.container.innerHTML = '';
    this.nodeMap.clear();
    this.rootNode = null;
  }
}

export default JSONTreeNavigator;
