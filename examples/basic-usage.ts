/**
 * Basic usage example for ipynb-ast
 */

import { parseFromFile, parse } from '../src/index';

async function basicExample() {
  // Example 1: Parse a notebook without parsing markdown
  const notebook1 = await parseFromFile('example.ipynb');
  console.log('Basic parse:', notebook1);

  // Example 2: Parse a notebook with markdown parsing enabled
  const notebook2 = await parseFromFile('example.ipynb', {
    parseMarkdown: true,
  });
  console.log('With markdown parsing:', notebook2);

  // Example 3: Access parsed markdown cells
  for (const cell of notebook2.children) {
    if (cell.cellType === 'markdown') {
      const content = cell.children[0];
      if (content.type === 'parsedMarkdown') {
        console.log('Parsed markdown nodes:', content.children);
      }
    }
  }
}

basicExample().catch(console.error);
