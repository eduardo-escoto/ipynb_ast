/**
 * Transformer/plugin system for ipynb-ast
 * Inspired by unified.js transformers
 */

import type { Node, Root } from './types';
import { isMarkdown } from './types';

/**
 * Transformer function type
 * Can modify nodes in place or return new nodes
 */
export type Transformer<T extends Node = Node> = (
  node: T,
  index?: number,
  parent?: Node
) => T | void | Promise<T | void>;

/**
 * Visitor function type
 * Used for traversing the AST without modification
 */
export type Visitor<T extends Node = Node> = (
  node: T,
  index?: number,
  parent?: Node
) => void | boolean | Promise<void | boolean>;

/**
 * Transform options
 */
export interface TransformOptions {
  /**
   * Whether to visit nodes in reverse order
   */
  reverse?: boolean;
}

/**
 * Visit all nodes in the tree
 * Similar to unist-util-visit
 */
export async function visit(
  tree: Node,
  visitor: Visitor,
  options: TransformOptions = {}
): Promise<void> {
  async function visitNode(
    node: Node,
    index?: number,
    parent?: Node
  ): Promise<boolean> {
    const result = await visitor(node, index, parent);

    // If visitor returns false, stop traversal
    if (result === false) {
      return false;
    }

    // Visit children
    if ('children' in node && Array.isArray((node as any).children)) {
      const children = (node as any).children;
      const indices = options.reverse
        ? Array.from({ length: children.length }, (_, i) => children.length - 1 - i)
        : Array.from({ length: children.length }, (_, i) => i);

      for (const i of indices) {
        const shouldContinue = await visitNode(children[i], i, node);
        if (!shouldContinue) {
          return false;
        }
      }
    }

    return true;
  }

  await visitNode(tree);
}

/**
 * Visit nodes of a specific type
 */
export async function visitType<T extends Node = Node>(
  tree: Node,
  type: string,
  visitor: Visitor<T>,
  options: TransformOptions = {}
): Promise<void> {
  await visit(
    tree,
    async (node, index, parent) => {
      if (node.type === type) {
        return visitor(node as T, index, parent);
      }
    },
    options
  );
}

/**
 * Transform all nodes in the tree
 * Transformers can modify nodes in place or return new nodes
 */
export async function transform(
  tree: Node,
  transformer: Transformer,
  options: TransformOptions = {}
): Promise<Node> {
  async function transformNode(
    node: Node,
    index?: number,
    parent?: Node
  ): Promise<Node> {
    // Transform children first (depth-first)
    if ('children' in node && Array.isArray((node as any).children)) {
      const children = (node as any).children;
      const newChildren: Node[] = [];

      const indices = options.reverse
        ? Array.from({ length: children.length }, (_, i) => children.length - 1 - i)
        : Array.from({ length: children.length }, (_, i) => i);

      for (const i of indices) {
        const transformed = await transformNode(children[i], i, node);
        newChildren[options.reverse ? children.length - 1 - i : i] = transformed;
      }

      (node as any).children = newChildren;
    }

    // Transform current node
    const result = await transformer(node, index, parent);
    return result || node;
  }

  return transformNode(tree);
}

/**
 * Transform nodes of a specific type
 */
export async function transformType<T extends Node = Node>(
  tree: Node,
  type: string,
  transformer: Transformer<T>,
  options: TransformOptions = {}
): Promise<Node> {
  return transform(
    tree,
    async (node, index, parent) => {
      if (node.type === type) {
        return transformer(node as T, index, parent);
      }
    },
    options
  );
}

/**
 * Filter nodes based on a predicate
 */
export async function filter(
  tree: Node,
  predicate: (node: Node, index?: number, parent?: Node) => boolean | Promise<boolean>
): Promise<Node> {
  async function filterNode(node: Node, index?: number, parent?: Node): Promise<Node | null> {
    // Check predicate
    const keep = await predicate(node, index, parent);
    if (!keep) {
      return null;
    }

    // Filter children
    if ('children' in node && Array.isArray((node as any).children)) {
      const children = (node as any).children;
      const filtered: Node[] = [];

      for (let i = 0; i < children.length; i++) {
        const result = await filterNode(children[i], i, node);
        if (result) {
          filtered.push(result);
        }
      }

      return { ...node, children: filtered } as Node;
    }

    return node;
  }

  const result = await filterNode(tree);
  return result || tree;
}

/**
 * Map over all nodes
 */
export async function map(
  tree: Node,
  mapper: (node: Node, index?: number, parent?: Node) => Node | Promise<Node>
): Promise<Node> {
  return transform(tree, mapper);
}

/**
 * Find the first node matching a predicate
 */
export async function find(
  tree: Node,
  predicate: (node: Node) => boolean | Promise<boolean>
): Promise<Node | null> {
  let found: Node | null = null;

  await visit(tree, async (node) => {
    if (await predicate(node)) {
      found = node;
      return false; // Stop traversal
    }
    return undefined; // Continue traversal
  });

  return found;
}

/**
 * Find all nodes matching a predicate
 */
export async function findAll(
  tree: Node,
  predicate: (node: Node) => boolean | Promise<boolean>
): Promise<Node[]> {
  const results: Node[] = [];

  await visit(tree, async (node) => {
    if (await predicate(node)) {
      results.push(node);
    }
  });

  return results;
}

// =============================================================================
// Common transformers
// =============================================================================

/**
 * Remove all outputs from code cells
 */
export const removeOutputs: Transformer<Root> = (root) => {
  if (root.type !== 'root') return;

  for (const cell of root.children) {
    if (cell.cellType === 'code' && cell.children.length > 1) {
      // Keep only the code node (first child)
      cell.children = [cell.children[0]];
    }
  }
};

/**
 * Remove cells by tag
 */
export function removeCellsByTag(...tags: string[]): Transformer<Root> {
  return (root) => {
    if (root.type !== 'root') return;

    root.children = root.children.filter((cell) => {
      const cellTags = cell.metadata?.tags || [];
      return !tags.some((tag) => cellTags.includes(tag));
    });
  };
}

/**
 * Remove empty cells
 */
export const removeEmptyCells: Transformer<Root> = (root) => {
  if (root.type !== 'root') return;

  root.children = root.children.filter((cell) => {
    if (cell.cellType === 'code') {
      return cell.children[0].value.trim().length > 0;
    }
    if (cell.cellType === 'markdown') {
      const content = cell.children[0];
      if (isMarkdown(content)) {
        return content.value.trim().length > 0;
      }
      // ParsedMarkdown has children, check if it has content
      return content.children && content.children.length > 0;
    }
    return true;
  });
};

/**
 * Extract cells by tag
 */
export function extractCellsByTag(...tags: string[]): Transformer<Root> {
  return (root) => {
    if (root.type !== 'root') return;

    root.children = root.children.filter((cell) => {
      const cellTags = cell.metadata?.tags || [];
      return tags.some((tag) => cellTags.includes(tag));
    });
  };
}
