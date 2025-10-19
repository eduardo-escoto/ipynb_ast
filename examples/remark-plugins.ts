/**
 * Example using remark plugins with ipynb-ast
 */

import { parseFromFile } from '../src/index';
// Example plugins (install these separately):
// import remarkGfm from 'remark-gfm';
// import remarkMath from 'remark-math';

async function remarkPluginExample() {
  // Parse notebook with remark plugins
  const notebook = await parseFromFile('example.ipynb', {
    parseMarkdown: true,
    markdownOptions: {
      plugins: [
        // Enable GitHub Flavored Markdown
        // remarkGfm,
        // Enable math syntax
        // remarkMath,
      ],
    },
  });

  console.log('Notebook parsed with remark plugins:', notebook);

  // The markdown cells will now have mdast trees with GFM and math nodes
  for (const cell of notebook.children) {
    if (cell.cellType === 'markdown') {
      const content = cell.children[0];
      if (content.type === 'parsedMarkdown') {
        console.log('Markdown AST:', JSON.stringify(content, null, 2));
      }
    }
  }
}

remarkPluginExample().catch(console.error);
