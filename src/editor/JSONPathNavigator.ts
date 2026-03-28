export type NodeType = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';

export interface TreeNode {
  key: string;
  value: unknown;
  type: NodeType;
  children: TreeNode[];
  path: string;
  position: { line: number; column: number; from: number; to: number };
  expanded: boolean;
  visible: boolean;
  childCount: number;
}

export interface JSONPathNavOptions {
  onNodeClick?: (node: TreeNode) => void;
  onNodeHover?: (node: TreeNode | null) => void;
}

export class JSONPathNavigator {
  private container: HTMLElement;
  private treeContainer: HTMLElement;
  private searchInput: HTMLInputElement;
  private rootNode: TreeNode | null = null;
  private options: JSONPathNavOptions;
  private searchTerm: string = '';
  private collapsedNodes: Set<string> = new Set();

  constructor(container: HTMLElement, options: JSONPathNavOptions = {}) {
    this.container = container;
    this.options = options;
    this.treeContainer = this.createTreeContainer();
    this.searchInput = this.createSearchInput();
    this.render();
  }

  private createSearchInput(): HTMLInputElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'json-nav-search-wrapper';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'json-nav-search';
    input.placeholder = '搜索节点...';
    
    input.addEventListener('input', (e) => {
      this.searchTerm = (e.target as HTMLInputElement).value;
      this.filterNodes();
    });
    
    wrapper.appendChild(input);
    this.container.appendChild(wrapper);
    
    return input;
  }

  private createTreeContainer(): HTMLElement {
    const treeContainer = document.createElement('div');
    treeContainer.className = 'json-nav-tree';
    this.container.appendChild(treeContainer);
    return treeContainer;
  }

  private render(): void {
    this.container.innerHTML = '';
    this.container.appendChild(this.createSearchInput().parentElement!);
    this.container.appendChild(this.treeContainer);
  }

  parseJSON(json: string): TreeNode | null {
    if (!json.trim()) {
      this.rootNode = null;
      this.renderTree();
      return null;
    }

    try {
      const parsed = JSON.parse(json);
      this.rootNode = this.buildTree(parsed, '', '$', json);
      this.renderTree();
      return this.rootNode;
    } catch {
      this.rootNode = null;
      this.renderTree();
      return null;
    }
  }

  private buildTree(
    value: unknown,
    path: string,
    key: string,
    jsonString: string,
    position: { line: number; column: number; from: number; to: number } = { line: 1, column: 1, from: 0, to: 0 }
  ): TreeNode {
    const type = this.getNodeType(value);
    const node: TreeNode = {
      key,
      value,
      type,
      children: [],
      path,
      position,
      expanded: !this.collapsedNodes.has(path || key),
      visible: true,
      childCount: 0,
    };

    if (type === 'object' && value !== null) {
      const obj = value as Record<string, unknown>;
      const entries = Object.entries(obj);
      node.childCount = entries.length;
      
      for (const [k, v] of entries) {
        const childPath = path ? `${path}.${k}` : k;
        const childNode = this.buildTree(v, childPath, k, jsonString);
        node.children.push(childNode);
      }
    } else if (type === 'array') {
      const arr = value as unknown[];
      node.childCount = arr.length;
      
      for (let i = 0; i < arr.length; i++) {
        const childPath = path ? `${path}[${i}]` : `[${i}]`;
        const childNode = this.buildTree(arr[i], childPath, String(i), jsonString);
        node.children.push(childNode);
      }
    }

    return node;
  }

  private getNodeType(value: unknown): NodeType {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    return 'null';
  }

  private renderTree(): void {
    this.treeContainer.innerHTML = '';
    
    if (!this.rootNode) {
      this.treeContainer.innerHTML = '<div class="json-nav-empty">暂无数据</div>';
      return;
    }

    this.filterNodes();
    const nodeElement = this.renderNode(this.rootNode, 0);
    this.treeContainer.appendChild(nodeElement);
  }

  private filterNodes(): void {
    if (!this.rootNode) return;
    
    const term = this.searchTerm.toLowerCase();
    this.applyFilter(this.rootNode, term);
  }

  private applyFilter(node: TreeNode, term: string): boolean {
    if (!term) {
      node.visible = true;
      for (const child of node.children) {
        this.applyFilter(child, term);
      }
      return true;
    }

    const keyMatch = node.key.toLowerCase().includes(term);
    const valueMatch = this.getNodePreview(node).toLowerCase().includes(term);
    const pathMatch = node.path.toLowerCase().includes(term);
    
    let childMatch = false;
    for (const child of node.children) {
      if (this.applyFilter(child, term)) {
        childMatch = true;
      }
    }

    node.visible = keyMatch || valueMatch || pathMatch || childMatch;
    if (childMatch) {
      node.expanded = true;
    }
    
    return node.visible;
  }

  private renderNode(node: TreeNode, depth: number): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = `json-nav-node-wrapper ${node.visible ? '' : 'hidden'}`;
    wrapper.style.paddingLeft = `${depth * 16}px`;

    const nodeElement = document.createElement('div');
    nodeElement.className = `json-nav-node json-nav-${node.type}`;
    nodeElement.dataset.path = node.path;

    const icon = this.getNodeIcon(node);
    icon.className = 'json-nav-icon';
    nodeElement.appendChild(icon);

    const keyElement = document.createElement('span');
    keyElement.className = 'json-nav-key';
    keyElement.textContent = node.key;
    nodeElement.appendChild(keyElement);

    if (node.type === 'object' || node.type === 'array') {
      const countElement = document.createElement('span');
      countElement.className = 'json-nav-count';
      countElement.textContent = `${node.childCount}`;
      nodeElement.appendChild(countElement);

      const toggleIcon = document.createElement('span');
      toggleIcon.className = `json-nav-toggle ${node.expanded ? 'expanded' : ''}`;
      toggleIcon.textContent = node.expanded ? '▼' : '▶';
      toggleIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleNode(node, wrapper);
      });
      nodeElement.insertBefore(toggleIcon, nodeElement.firstChild);
    } else {
      const previewElement = document.createElement('span');
      previewElement.className = 'json-nav-preview';
      previewElement.textContent = this.getNodePreview(node);
      nodeElement.appendChild(previewElement);
    }

    nodeElement.addEventListener('click', () => {
      if (this.options.onNodeClick) {
        this.options.onNodeClick(node);
      }
    });

    nodeElement.addEventListener('mouseenter', () => {
      if (this.options.onNodeHover) {
        this.options.onNodeHover(node);
      }
    });

    nodeElement.addEventListener('mouseleave', () => {
      if (this.options.onNodeHover) {
        this.options.onNodeHover(null);
      }
    });

    wrapper.appendChild(nodeElement);

    if ((node.type === 'object' || node.type === 'array') && node.expanded) {
      const childrenContainer = document.createElement('div');
      childrenContainer.className = 'json-nav-children';
      
      for (const child of node.children) {
        const childElement = this.renderNode(child, depth + 1);
        childrenContainer.appendChild(childElement);
      }
      
      wrapper.appendChild(childrenContainer);
    }

    return wrapper;
  }

  private toggleNode(node: TreeNode, wrapper: HTMLElement): void {
    node.expanded = !node.expanded;
    
    if (node.expanded) {
      this.collapsedNodes.delete(node.path);
    } else {
      this.collapsedNodes.add(node.path);
    }

    const childrenContainer = wrapper.querySelector('.json-nav-children');
    const toggleIcon = wrapper.querySelector('.json-nav-toggle');
    
    if (node.expanded) {
      if (!childrenContainer) {
        const newChildrenContainer = document.createElement('div');
        newChildrenContainer.className = 'json-nav-children';
        for (const child of node.children) {
          newChildrenContainer.appendChild(this.renderNode(child, 0));
        }
        wrapper.appendChild(newChildrenContainer);
      }
      if (toggleIcon) {
        toggleIcon.classList.add('expanded');
        toggleIcon.textContent = '▼';
      }
    } else {
      if (childrenContainer) {
        childrenContainer.remove();
      }
      if (toggleIcon) {
        toggleIcon.classList.remove('expanded');
        toggleIcon.textContent = '▶';
      }
    }
  }

  private getNodeIcon(node: TreeNode): HTMLElement {
    const icon = document.createElement('span');
    
    switch (node.type) {
      case 'object':
        icon.innerHTML = `<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
          <path d="M2 2h4v4H2V2zm8 0h4v4h-4V2zM2 10h4v4H2v-4zm8 0h4v4h-4v-4z"/>
        </svg>`;
        icon.style.color = '#3b82f6';
        break;
      case 'array':
        icon.innerHTML = `<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
          <path d="M1 1h14v14H1V1zm2 2v10h10V3H3z"/>
        </svg>`;
        icon.style.color = '#22c55e';
        break;
      case 'string':
        icon.innerHTML = `<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
          <path d="M3 4h10v2H3V4zm0 3h10v2H3V7zm0 3h7v2H3v-2z"/>
        </svg>`;
        icon.style.color = '#22c55e';
        break;
      case 'number':
        icon.innerHTML = `<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
          <path d="M3 3h2v10H3V3zm4 0h2v10H7V3zm4 0h2v10h-2V3z"/>
        </svg>`;
        icon.style.color = '#f97316';
        break;
      case 'boolean':
        icon.innerHTML = `<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
          <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 12A5 5 0 118 3a5 5 0 010 10z"/>
          <circle cx="8" cy="8" r="3"/>
        </svg>`;
        icon.style.color = '#a855f7';
        break;
      case 'null':
        icon.innerHTML = `<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
          <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 12A5 5 0 118 3a5 5 0 010 10z"/>
        </svg>`;
        icon.style.color = '#a855f7';
        break;
    }
    
    return icon;
  }

  private getNodePreview(node: TreeNode): string {
    switch (node.type) {
      case 'string':
        return `"${String(node.value).substring(0, 30)}${String(node.value).length > 30 ? '...' : ''}"`;
      case 'number':
        return String(node.value);
      case 'boolean':
        return node.value ? 'true' : 'false';
      case 'null':
        return 'null';
      case 'object':
        return `{${node.childCount}}`;
      case 'array':
        return `[${node.childCount}]`;
      default:
        return '';
    }
  }

  expandAll(): void {
    if (this.rootNode) {
      this.setExpandedAll(this.rootNode, true);
      this.collapsedNodes.clear();
      this.renderTree();
    }
  }

  collapseAll(): void {
    if (this.rootNode) {
      this.setExpandedAll(this.rootNode, false);
      this.collectCollapsed(this.rootNode);
      this.renderTree();
    }
  }

  private setExpandedAll(node: TreeNode, expanded: boolean): void {
    node.expanded = expanded;
    for (const child of node.children) {
      this.setExpandedAll(child, expanded);
    }
  }

  private collectCollapsed(node: TreeNode): void {
    if (!node.expanded && node.path) {
      this.collapsedNodes.add(node.path);
    }
    for (const child of node.children) {
      this.collectCollapsed(child);
    }
  }

  findNodeByPath(path: string): TreeNode | null {
    if (!this.rootNode) return null;
    return this.searchNodeByPath(this.rootNode, path);
  }

  private searchNodeByPath(node: TreeNode, path: string): TreeNode | null {
    if (node.path === path) return node;
    for (const child of node.children) {
      const found = this.searchNodeByPath(child, path);
      if (found) return found;
    }
    return null;
  }

  clear(): void {
    this.rootNode = null;
    this.collapsedNodes.clear();
    this.searchTerm = '';
    if (this.searchInput) {
      this.searchInput.value = '';
    }
    this.renderTree();
  }

  getRootNode(): TreeNode | null {
    return this.rootNode;
  }
}
