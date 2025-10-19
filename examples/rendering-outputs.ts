/**
 * Example rendering notebook outputs to HTML
 */

import { parseFromFile, renderOutputToHtml } from '../src/index';

async function renderExample() {
  // Parse a notebook
  const notebook = await parseFromFile('example.ipynb');

  // Render all outputs to HTML
  for (const cell of notebook.children) {
    if (cell.cellType === 'code') {
      console.log(`\n=== Code Cell ${cell.executionCount} ===`);
      console.log('Source:', cell.children[0].value);

      // Render each output
      const outputs = cell.children.slice(1);
      for (let i = 0; i < outputs.length; i++) {
        const output = outputs[i];
        const html = await renderOutputToHtml(output, {
          wrap: true,
          wrapperClass: 'jupyter-output',
        });
        console.log(`Output ${i}:`, html);
      }
    }
  }
}

renderExample().catch(console.error);
