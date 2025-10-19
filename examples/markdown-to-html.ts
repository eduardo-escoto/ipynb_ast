/**
 * Example converting notebook markdown cells to HTML
 */

import { parseFromFile, markdownToHtml } from '../src/index';

async function markdownToHtmlExample() {
  // Parse notebook with markdown parsing
  const notebook = await parseFromFile('example.ipynb', {
    parseMarkdown: true,
  });

  // Convert all markdown cells to HTML
  for (const cell of notebook.children) {
    if (cell.cellType === 'markdown') {
      const content = cell.children[0];

      if (content.type === 'parsedMarkdown') {
        // Convert the mdast tree to HTML
        const mdastTree = {
          type: 'root',
          children: content.children,
        };

        const html = await markdownToHtml(mdastTree as any);
        console.log('HTML:', html);
      } else {
        // If not parsed, convert the string directly
        const html = await markdownToHtml(content.value);
        console.log('HTML:', html);
      }
    }
  }
}

markdownToHtmlExample().catch(console.error);
