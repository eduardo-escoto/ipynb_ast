/**
 * Example visiting and transforming AST nodes
 */

import { parseFromFile, type Node, type Cell, isCodeCell, isMarkdownCell } from '../src/index';

/**
 * Simple visitor function that walks the AST
 */
function visit(node: Node, callback: (node: Node) => void) {
  callback(node);

  if ('children' in node && Array.isArray((node as any).children)) {
    for (const child of (node as any).children) {
      visit(child, callback);
    }
  }
}

async function visitingExample() {
  const notebook = await parseFromFile('example.ipynb', {
    parseMarkdown: true,
  });

  // Count different node types
  const nodeCounts: Record<string, number> = {};

  visit(notebook, (node) => {
    nodeCounts[node.type] = (nodeCounts[node.type] || 0) + 1;
  });

  console.log('Node type counts:', nodeCounts);

  // Find all code cells with outputs
  const codeCellsWithOutputs: Cell[] = [];

  for (const cell of notebook.children) {
    if (isCodeCell(cell) && cell.children.length > 1) {
      codeCellsWithOutputs.push(cell);
    }
  }

  console.log(`Found ${codeCellsWithOutputs.length} code cells with outputs`);

  // Find all markdown cells
  const markdownCells = notebook.children.filter(isMarkdownCell);
  console.log(`Found ${markdownCells.length} markdown cells`);
}

visitingExample().catch(console.error);
